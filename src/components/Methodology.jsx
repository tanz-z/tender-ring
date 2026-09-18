export default function Methodology() {
  return (
    <section className="border-t border-line bg-panel">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        <h2 className="font-serif text-xl text-ink mb-1">How this works</h2>
        <p className="text-sm text-inkmuted max-w-2xl mb-6">
          Built for the "Smart Governance &amp; Compliance" track — auditing post-award procurement
          without assuming every change or every unusual price is misconduct.
        </p>
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-ink mb-1">1. Peer group, not global average</h3>
            <p className="text-xs text-inkmuted leading-relaxed">
              Every award is compared against other tenders in the same category, not the whole
              market. A specialist supplier being the sole realistic bidder isn't treated the same
              as it would be in a thick, competitive category.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink mb-1">2. Four independent signals</h3>
            <p className="text-xs text-inkmuted leading-relaxed">
              Bid rotation, cover bidding, shared-director linkage, and peer-grouped price deviation
              are each scored on their own evidence — no single signal is enough on its own.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink mb-1">3. Corroboration before priority</h3>
            <p className="text-xs text-inkmuted leading-relaxed">
              <span className="font-mono">priority = signal strength &times; corroboration &times; materiality &times; (1 &minus; benign explanation)</span>.
              A case needs multiple signals and real rupee value at stake to reach the top of the queue.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink mb-1">4. Suppression is shown, not hidden</h3>
            <p className="text-xs text-inkmuted leading-relaxed">
              When a benign explanation applies — a thin market, a low-value contract — the case is
              marked and down-weighted, and the reason is visible rather than silently dropped.
            </p>
          </div>
        </div>
        <p className="text-[0.7rem] text-inkmuted/70 mt-7 border-t border-line pt-4">
          This is a hackathon prototype. The market, vendors, and cartels are synthetically
          generated with a fixed seed — the "ground truth" tags exist only because we planted them,
          which lets precision be measured honestly. No real vendor, buyer, or official is
          represented here.
        </p>
      </div>
    </section>
  );
}
