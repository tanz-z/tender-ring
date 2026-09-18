import { mulberry32, makeUtils } from "./rng.js";

export const CATEGORIES = [
  "Road Construction",
  "Medical Equipment",
  "IT Services",
  "Office Supplies",
  "Sanitation",
];

export const CONFIG = {
  seed: 30,
  nVendors: 60,
  nTenders: 300,
  nCartels: 3,
  cartelSize: 4,
};

function makeVendors(u, n) {
  const vendors = [];
  for (let i = 0; i < n; i++) {
    vendors.push({
      vendorId: `V${String(i).padStart(3, "0")}`,
      category: u.choice(CATEGORIES),
      directorId: `D${String(i).padStart(3, "0")}`,
      regYear: u.int(2005, 2024),
      cartelId: null,
    });
  }
  return vendors;
}

function plantCartels(u, vendors, nCartels, cartelSize) {
  const cartels = [];
  for (let cid = 0; cid < nCartels; cid++) {
    const cat = CATEGORIES[cid % CATEGORIES.length];
    const pool = vendors.filter((v) => v.category === cat).map((v) => v.vendorId);
    const ring = u.sample(pool, Math.min(cartelSize, pool.length));
    cartels.push({ cartelId: cid, category: cat, members: ring });
    ring.forEach((vid) => {
      const v = vendors.find((x) => x.vendorId === vid);
      v.cartelId = cid;
    });
    // two ring members quietly share a director — simulates shell-company overlap
    const sharedDir = `SHARED_D${cid}`;
    ring.slice(0, 2).forEach((vid) => {
      const v = vendors.find((x) => x.vendorId === vid);
      v.directorId = sharedDir;
    });
  }
  return cartels;
}

function generateTendersAndBids(u, vendors, cartels) {
  const tenders = [];
  const bids = [];

  for (let t = 0; t < CONFIG.nTenders; t++) {
    const cat = u.choice(CATEGORIES);
    const baseValue = u.lognormal(15.5, 0.6);
    const buyerId = `B${String(u.int(0, 14)).padStart(2, "0")}`;
    const tenderId = `T${String(t).padStart(4, "0")}`;

    let riggedBy = null;
    for (const cartel of cartels) {
      if (cartel.category === cat && u.uniform(0, 1) < 0.55) {
        riggedBy = cartel.cartelId;
        break;
      }
    }

    const eligible = vendors.filter((v) => v.category === cat).map((v) => v.vendorId);
    const nBidders = u.int(3, 6);
    let bidders = u.sample(eligible, Math.min(nBidders, eligible.length));

    const tenderBids = [];

    if (riggedBy !== null) {
      const ring = cartels[riggedBy].members.filter((v) => eligible.includes(v));
      const forced = u.sample(ring, Math.min(2, ring.length));
      forced.forEach((v) => {
        if (!bidders.includes(v)) {
          bidders[u.int(0, bidders.length - 1)] = v;
        }
      });
      const ringInPlay = bidders.filter((v) => ring.includes(v));
      const winner = ringInPlay.length ? u.choice(ringInPlay) : u.choice(bidders);

      bidders.forEach((v) => {
        let price;
        if (v === winner) price = baseValue * u.uniform(0.97, 1.02);
        else if (ring.includes(v)) price = baseValue * u.uniform(1.02, 1.05); // cover bid
        else price = baseValue * u.uniform(0.9, 1.15); // outsider, unaware
        tenderBids.push({ tenderId, vendorId: v, price });
      });
    } else {
      bidders.forEach((v) => {
        const price = baseValue * u.uniform(0.85, 1.2);
        tenderBids.push({ tenderId, vendorId: v, price });
      });
    }

    tenderBids.sort((a, b) => a.price - b.price);
    const winnerBid = tenderBids[0];

    tenders.push({
      tenderId,
      category: cat,
      buyerId,
      estValue: baseValue,
      riggedByCartel: riggedBy,
      winnerId: winnerBid.vendorId,
      awardPrice: winnerBid.price,
    });
    bids.push(...tenderBids);
  }
  return { tenders, bids };
}

export function generateMarket() {
  const rng = mulberry32(CONFIG.seed);
  const u = makeUtils(rng);
  const vendors = makeVendors(u, CONFIG.nVendors);
  const cartels = plantCartels(u, vendors, CONFIG.nCartels, CONFIG.cartelSize);
  const { tenders, bids } = generateTendersAndBids(u, vendors, cartels);
  return { vendors, cartels, tenders, bids };
}
