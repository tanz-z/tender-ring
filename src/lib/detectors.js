// Every detector returns a Map<tenderId, score 0..1> plus, where useful,
// the raw evidence behind that score so the UI can explain a flag rather
// than just assert one.

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(item);
  }
  return m;
}

export function detectCoverBidding(bids) {
  const scores = new Map();
  const byTender = groupBy(bids, (b) => b.tenderId);
  for (const [tid, group] of byTender) {
    if (group.length < 3) continue;
    const prices = group.map((b) => b.price).sort((a, b) => a - b);
    const winner = prices[0];
    const losers = prices.slice(1);
    const margins = losers.map((p) => (p - winner) / winner);
    const mean = margins.reduce((a, b) => a + b, 0) / margins.length;
    const variance = margins.reduce((a, b) => a + (b - mean) ** 2, 0) / margins.length;
    const std = Math.sqrt(variance);
    const tightness = 1 - Math.min(std / (mean + 1e-6), 1);
    const closeness = 1 - Math.min(mean / 0.1, 1);
    scores.set(tid, Math.max(0, (tightness + closeness) / 2));
  }
  return scores;
}

export function detectBidRotation(tenders) {
  const scores = new Map();
  const byCatBuyer = groupBy(tenders, (t) => `${t.category}__${t.buyerId}`);
  for (const [, group] of byCatBuyer) {
    if (group.length < 3) continue;
    const sorted = [...group].sort((a, b) => (a.tenderId > b.tenderId ? 1 : -1));
    const winners = sorted.map((t) => t.winnerId);
    const distinct = new Set(winners);
    if (distinct.size < 2 || distinct.size > 4) continue;
    let alternations = 0;
    for (let i = 1; i < winners.length; i++) if (winners[i] !== winners[i - 1]) alternations++;
    const rotationScore = alternations / (winners.length - 1);
    const poolScore = 1 - distinct.size / winners.length;
    const s = rotationScore * poolScore;
    sorted.forEach((t) => scores.set(t.tenderId, Math.max(scores.get(t.tenderId) || 0, s)));
  }
  return scores;
}

export function detectShellLinkage(vendors, bids) {
  const dirMap = new Map(vendors.map((v) => [v.vendorId, v.directorId]));
  const scores = new Map();
  const details = new Map();
  const byTender = groupBy(bids, (b) => b.tenderId);
  for (const [tid, group] of byTender) {
    const dirs = group.map((b) => dirMap.get(b.vendorId));
    const seen = new Map();
    const linkedPairs = [];
    dirs.forEach((d, i) => {
      if (seen.has(d)) linkedPairs.push([group[seen.get(d)].vendorId, group[i].vendorId]);
      else seen.set(d, i);
    });
    scores.set(tid, Math.min(linkedPairs.length / 2, 1));
    if (linkedPairs.length) details.set(tid, linkedPairs);
  }
  return { scores, details };
}

export function peerPriceDeviation(tenders) {
  const scores = new Map();
  const byCat = groupBy(tenders, (t) => t.category);
  for (const [, group] of byCat) {
    const prices = group.map((t) => t.awardPrice).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const absDevs = prices.map((p) => Math.abs(p - median)).sort((a, b) => a - b);
    const mad = absDevs[Math.floor(absDevs.length / 2)] + 1e-6;
    group.forEach((t) => {
      const z = Math.abs((t.awardPrice - median) / (1.4826 * mad));
      scores.set(t.tenderId, Math.min(z / 4, 1));
    });
  }
  return scores;
}

// A rough stand-in for "benign explanation" checks a real system would run
// against procurement records: thin markets and very small-value tenders
// don't deserve the same scrutiny as a thick market with a large contract.
export function benignExplanation(tenders, vendors) {
  const vendorCountByCat = new Map();
  vendors.forEach((v) => vendorCountByCat.set(v.category, (vendorCountByCat.get(v.category) || 0) + 1));
  const counts = [...vendorCountByCat.values()].sort((a, b) => a - b);
  // only the thinnest slice of categories counts as a "thin market" — with a
  // handful of categories this is roughly the single sparsest one, not most of them
  const thinCutoff = counts[Math.max(0, Math.floor(counts.length * 0.25) - 1)];

  const valueSorted = [...tenders].map((t) => t.estValue).sort((a, b) => a - b);
  const lowValueCutoff = valueSorted[Math.floor(valueSorted.length * 0.08)];

  const flags = new Map();
  tenders.forEach((t) => {
    const reasons = [];
    if ((vendorCountByCat.get(t.category) || 0) <= thinCutoff) reasons.push("thin_market");
    if (t.estValue <= lowValueCutoff) reasons.push("low_value");
    flags.set(t.tenderId, reasons);
  });
  return flags;
}

export function buildPriorityTable(vendors, tenders, bids) {
  const cover = detectCoverBidding(bids);
  const rotation = detectBidRotation(tenders);
  const { scores: linkage, details: linkageDetails } = detectShellLinkage(vendors, bids);
  const priceDev = peerPriceDeviation(tenders);
  const benign = benignExplanation(tenders, vendors);

  const values = tenders.map((t) => t.estValue);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);

  const rows = tenders.map((t) => {
    const c = cover.get(t.tenderId) || 0;
    const r = rotation.get(t.tenderId) || 0;
    const l = linkage.get(t.tenderId) || 0;
    const p = priceDev.get(t.tenderId) || 0;
    const signals = [c, r, l, p];
    const signalsFired = signals.filter((s) => s > 0.3).length;
    const corroboration = signalsFired / signals.length;
    const materiality = (t.estValue - minV) / (maxV - minV + 1e-6);
    const rawSignal = signals.reduce((a, b) => a + b, 0) / signals.length;
    const benignReasons = benign.get(t.tenderId) || [];
    const benignPenalty = benignReasons.length > 0 ? 0.35 * benignReasons.length : 0;
    const priority =
      rawSignal * (0.5 + 0.5 * corroboration) * (0.5 + 0.5 * materiality) * Math.max(0, 1 - benignPenalty);

    return {
      ...t,
      coverBidding: c,
      bidRotation: r,
      shellLinkage: l,
      priceDeviation: p,
      signalsFired,
      corroboration,
      materiality,
      benignReasons,
      linkedPairs: linkageDetails.get(t.tenderId) || [],
      priority,
    };
  });

  rows.sort((a, b) => b.priority - a.priority);
  return rows;
}

export function precisionAtK(ranked, k) {
  const topK = ranked.slice(0, k);
  const hits = topK.filter((r) => r.riggedByCartel !== null).length;
  const totalRigged = ranked.filter((r) => r.riggedByCartel !== null).length;
  return {
    k,
    precision: hits / k,
    recall: totalRigged ? hits / totalRigged : 0,
    hits,
    totalRigged,
  };
}
