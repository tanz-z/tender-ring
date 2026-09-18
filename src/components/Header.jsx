export default function Header() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-7">
        <div className="flex items-baseline justify-between gap-6 flex-wrap">
          <div>
            <h1 className="font-serif text-[2.1rem] leading-none text-ink font-semibold tracking-tight">
              ClearBid
            </h1>
            <p className="mt-2 text-inkmuted text-[0.95rem] max-w-xl leading-snug">
              A prototype procurement-audit console. It doesn't hunt for outliers —
              it builds a peer group for every contract first, then ranks the cases
              worth a human investigator's time.
            </p>
          </div>
          <div className="text-right text-xs text-inkmuted font-mono leading-relaxed">
            <div>Smart Governance &amp; Compliance</div>
            <div>Synthetic dataset · known ground truth</div>
          </div>
        </div>
      </div>
    </header>
  );
}
