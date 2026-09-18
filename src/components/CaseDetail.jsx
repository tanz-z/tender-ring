import EvidenceBar from "./EvidenceBar";
import NetworkGraph from "./NetworkGraph";
import PeerChart from "./PeerChart";
import { formatINR } from "../lib/format";

const REASON_LABEL = {
  thin_market: "Thin market — few vendors serve this category, so concentration alone is expected.",
  low_value: "Low contract value — below the threshold where deep review is usually worthwhile.",
};

export default function CaseDetail({ tender, bids, vendors, allTenders }) {
  const flagged = tender.flagged;
  const hasBenign = tender.benignReasons.length > 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-inkmuted font-mono mb-1">
              {tender.category} · Buyer {tender.buyerId}
            </div>
            <h2 className="font-serif text-2xl text-ink">{tender.tenderId}</h2>
            <p className="text-sm text-inkmuted mt-1">
              Awarded to <span className="font-mono text-ink">{tender.winnerId}</span> for{" "}
              <span className="font-mono text-ink">{formatINR(tender.awardPrice)}</span>
              {" "}(estimated value {formatINR(tender.estValue)})
            </p>
          </div>

          {flagged && (
            <div
              className="border-2 border-flag text-flag px-3 py-1.5 rounded-sm rotate-[-3deg] font-serif text-sm tracking-wide shrink-0"
              aria-label="Flagged for review"
            >
              FLAGGED FOR REVIEW
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs bg-panel2 text-inkmuted px-2 py-1 rounded-sm font-mono">
            priority {tender.priority.toFixed(2)}
          </span>
          <span className="text-xs bg-panel2 text-inkmuted px-2 py-1 rounded-sm">
            {tender.signalsFired} of 4 signals fired
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-sm font-mono ${
              tender.riggedByCartel !== null ? "bg-flagsoft text-flag" : "bg-clearsoft text-clear"
            }`}
            title="This dataset is synthetic; ground truth is known because we planted it."
          >
            ground truth: {tender.riggedByCartel !== null ? `planted cartel #${tender.riggedByCartel}` : "not planted"}
          </span>
        </div>

        {hasBenign && (
          <div className="mt-4 border border-clear/40 bg-clearsoft rounded-sm p-3">
            <p className="text-sm text-clear font-medium mb-1">Possible benign explanation on file</p>
            <ul className="text-xs text-clear/90 list-disc pl-4 space-y-0.5">
              {tender.benignReasons.map((r) => (
                <li key={r}>{REASON_LABEL[r] || r}</li>
              ))}
            </ul>
            <p className="text-[0.7rem] text-clear/70 mt-1.5">
              This is why the priority score is lower than the raw anomaly signal alone would suggest.
            </p>
          </div>
        )}

        <section className="mt-7">
          <h3 className="font-serif text-lg text-ink mb-1">Evidence</h3>
          <p className="text-xs text-inkmuted mb-2">
            Each signal is scored independently. A case is only prioritized when several corroborate.
          </p>
          <EvidenceBar
            label="Bid rotation"
            value={tender.bidRotation}
            hint="Same small pool of bidders wins repeatedly for this buyer, alternating in a closed loop."
          />
          <EvidenceBar
            label="Cover bidding"
            value={tender.coverBidding}
            hint="Losing bids cluster tightly just above the winner, rather than spreading naturally."
          />
          <EvidenceBar
            label="Shell / shared-director linkage"
            value={tender.shellLinkage}
            hint="Two 'competing' bidders resolve to the same director or entity."
          />
          <EvidenceBar
            label="Peer-grouped price deviation"
            value={tender.priceDeviation}
            hint="Award price vs. the median for this category, not a global average."
          />
        </section>

        <section className="mt-7">
          <h3 className="font-serif text-lg text-ink mb-2">Bidder relationships</h3>
          <div className="border border-line rounded-sm bg-panel p-3">
            <NetworkGraph tender={tender} bids={bids} vendors={vendors} />
          </div>
          {tender.linkedPairs.length > 0 && (
            <p className="text-xs text-inkmuted mt-2">
              Dashed red lines: {tender.linkedPairs.map(([a, b]) => `${a} \u2194 ${b}`).join(", ")} resolve to the
              same director despite bidding as separate companies.
            </p>
          )}
        </section>

        <section className="mt-7 mb-4">
          <h3 className="font-serif text-lg text-ink mb-2">Price vs. category peers</h3>
          <div className="border border-line rounded-sm bg-panel p-3">
            <PeerChart tender={tender} allTenders={allTenders} />
          </div>
        </section>
      </div>
    </div>
  );
}
