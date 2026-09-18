export default function EvidenceBar({ label, value, hint }) {
  const pctVal = Math.round(value * 100);
  const active = value > 0.3;
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm text-ink">{label}</span>
        <span className={`font-mono text-xs ${active ? "text-flag" : "text-inkmuted"}`}>{pctVal}%</span>
      </div>
      <div className="h-1.5 bg-panel2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${active ? "bg-flag" : "bg-inkmuted/50"}`}
          style={{ width: `${Math.max(pctVal, 2)}%` }}
        />
      </div>
      {hint && <p className="text-[0.7rem] text-inkmuted mt-1">{hint}</p>}
    </div>
  );
}
