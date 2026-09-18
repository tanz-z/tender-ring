import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { formatINR } from "../lib/format";

export default function PeerChart({ tender, allTenders }) {
  const peers = allTenders.filter((t) => t.category === tender.category);
  const prices = peers.map((t) => t.awardPrice).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];

  const data = peers.map((t) => ({
    x: t.tenderId,
    y: t.awardPrice,
    isSelf: t.tenderId === tender.tenderId,
  }));

  const others = data.filter((d) => !d.isSelf);
  const self = data.filter((d) => d.isSelf);

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#D3CFC2" />
          <XAxis dataKey="x" hide />
          <YAxis
            dataKey="y"
            tickFormatter={(v) => formatINR(v)}
            tick={{ fontSize: 10, fill: "#63677A" }}
            width={62}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis range={[40, 40]} />
          <ReferenceLine y={median} stroke="#63677A" strokeDasharray="3 3" label={{ value: "peer median", fontSize: 10, fill: "#63677A", position: "insideTopLeft" }} />
          <Tooltip
            formatter={(v) => [formatINR(v), "Award price"]}
            labelFormatter={(l) => l}
            contentStyle={{ fontSize: 12, borderRadius: 4, borderColor: "#D3CFC2" }}
          />
          <Scatter data={others} fill="#B7B2A1" />
          <Scatter data={self} fill="#AD3A2C" shape="diamond" />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-[0.7rem] text-inkmuted -mt-1">
        This tender against every other {tender.category} award in the dataset ({peers.length} peers) — the
        diamond is this case.
      </p>
    </div>
  );
}
