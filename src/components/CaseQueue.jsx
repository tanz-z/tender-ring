import { formatINR } from "../lib/format";

export default function CaseQueue({ rows, selectedId, onSelect, limit = 40 }) {
  const visible = rows.slice(0, limit);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-line flex items-baseline justify-between">
        <h2 className="font-serif text-lg text-ink">Investigation queue</h2>
        <span className="text-xs text-inkmuted font-mono">ranked by priority</span>
      </div>
      <div className="overflow-y-auto flex-1">
        {visible.map((r, i) => {
          const active = r.tenderId === selectedId;
          return (
            <div key={r.tenderId}>
              {i === 20 && (
                <div className="px-5 py-2 bg-panel2/60 border-y border-line/70">
                  <span className="text-[0.65rem] text-inkmuted font-mono">— investigation threshold —</span>
                </div>
              )}
              <button
                onClick={() => onSelect(r.tenderId)}
                className={`w-full text-left px-5 py-3 border-b border-line/70 transition-colors ${
                  active ? "bg-ink text-paper" : "hover:bg-panel2"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`font-mono text-xs w-6 shrink-0 ${active ? "text-paper/60" : "text-inkmuted"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="font-mono text-sm truncate">{r.tenderId}</div>
                      <div className={`text-xs truncate ${active ? "text-paper/70" : "text-inkmuted"}`}>
                        {r.category} · {formatINR(r.awardPrice)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-mono text-sm">{r.priority.toFixed(2)}</span>
                    <span
                      className={`text-[0.65rem] px-1.5 py-0.5 rounded-sm ${
                        active ? "bg-paper/15 text-paper" : "bg-panel2 text-inkmuted"
                      }`}
                    >
                      {r.signalsFired} signal{r.signalsFired === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
