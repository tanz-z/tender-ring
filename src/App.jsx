import { useMemo, useState } from "react";
import { generateMarket } from "./lib/generateData";
import { buildPriorityTable, precisionAtK } from "./lib/detectors";
import Header from "./components/Header";
import StatsBar from "./components/StatsBar";
import CaseQueue from "./components/CaseQueue";
import CaseDetail from "./components/CaseDetail";
import Methodology from "./components/Methodology";

export default function App() {
  const market = useMemo(() => generateMarket(), []);
  const rows = useMemo(() => {
    const built = buildPriorityTable(market.vendors, market.tenders, market.bids);
    // the top slice of the queue is what "flagged for review" means here —
    // a rank-based cutoff, since the priority score's scale depends on the
    // dataset rather than being a fixed universal number
    return built.map((r, i) => ({ ...r, flagged: i < 20 }));
  }, [market]);
  const precisionRows = useMemo(
    () => [precisionAtK(rows, 10), precisionAtK(rows, 20), precisionAtK(rows, 40)],
    [rows]
  );
  const nRigged = useMemo(() => market.tenders.filter((t) => t.riggedByCartel !== null).length, [market]);

  const [selectedId, setSelectedId] = useState(rows[0].tenderId);
  const selected = rows.find((r) => r.tenderId === selectedId) || rows[0];

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      <Header />
      <StatsBar nTenders={market.tenders.length} nRigged={nRigged} precisionRows={precisionRows} />

      <main className="max-w-[1400px] mx-auto md:px-10 px-0">
        <div className="grid md:grid-cols-[380px_1fr] border-x border-line bg-paper min-h-[640px]">
          <div className="border-r border-line">
            <CaseQueue rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div>
            <CaseDetail
              tender={selected}
              bids={market.bids}
              vendors={market.vendors}
              allTenders={market.tenders}
            />
          </div>
        </div>
      </main>

      <Methodology />

      <footer className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 text-[0.7rem] text-inkmuted/70">
        ClearBid — prototype for a hackathon submission, Smart Governance &amp; Compliance track.
      </footer>
    </div>
  );
}
