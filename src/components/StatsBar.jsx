import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { pct } from "../lib/format";

function Stat({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-2xl text-ink">{value}</span>
      <span className="text-xs text-inkmuted">{label}</span>
      {sub && <span className="text-[0.7rem] text-inkmuted/70">{sub}</span>}
    </div>
  );
}

export default function StatsBar({ nTenders, nRigged, precisionRows }) {
  const chartData = precisionRows.map((r) => ({
    name: `Top ${r.k}`,
    precision: Math.round(r.precision * 100),
  }));

  return (
    <div className="border-b border-line bg-panel">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5 grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
        <Stat label="Tenders in this market" value={nTenders} />
        <Stat label="Planted cartel tenders" value={nRigged} sub="ground truth, for scoring only" />
        <Stat
          label="Precision @ top 10"
          value={pct(precisionRows[0].precision)}
          sub={`${precisionRows[0].hits} of top 10 are real cartel cases`}
        />
        <Stat
          label="Recall @ top 20"
          value={pct(precisionRows[1].recall)}
          sub="of all rigged tenders caught in the queue's first 20"
        />
        <div className="col-span-2 md:col-span-1 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#D3CFC2" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#63677A" }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                formatter={(v) => [`${v}%`, "Precision"]}
                contentStyle={{ fontSize: 12, borderRadius: 4, borderColor: "#D3CFC2" }}
              />
              <Bar dataKey="precision" fill="#AD3A2C" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
