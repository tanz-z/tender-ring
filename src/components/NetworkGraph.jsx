import { formatINR } from "../lib/format";

// Star layout: tender at the centre, each bidder placed on a circle
// around it. Winner is filled solid; a red arc is drawn between any two
// bidders that were resolved to share a director (the shell-linkage signal).
export default function NetworkGraph({ tender, bids, vendors }) {
  const w = 480;
  const h = 320;
  const cx = w / 2;
  const cy = h / 2 + 6;
  const radius = 118;

  const tenderBids = bids
    .filter((b) => b.tenderId === tender.tenderId)
    .sort((a, b) => a.price - b.price);

  const dirMap = new Map(vendors.map((v) => [v.vendorId, v.directorId]));
  const n = tenderBids.length;
  const nodes = tenderBids.map((b, i) => {
    const angle = -Math.PI / 2 + (i / n) * 2 * Math.PI;
    return {
      ...b,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      isWinner: b.vendorId === tender.winnerId,
    };
  });

  const linkedPairs = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (dirMap.get(nodes[i].vendorId) === dirMap.get(nodes[j].vendorId)) {
        linkedPairs.push([nodes[i], nodes[j]]);
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Bidder relationship graph for this tender">
      {/* spokes from tender to every bidder */}
      {nodes.map((node) => (
        <line
          key={`spoke-${node.vendorId}`}
          x1={cx} y1={cy} x2={node.x} y2={node.y}
          stroke="#D3CFC2" strokeWidth="1.5"
        />
      ))}

      {/* shared-director links, drawn as a curved red arc */}
      {linkedPairs.map(([a, b], idx) => {
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dx = mx - cx, dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pull = 22;
        const ctrlX = mx + (dx / dist) * pull;
        const ctrlY = my + (dy / dist) * pull;
        return (
          <path
            key={`link-${idx}`}
            d={`M ${a.x} ${a.y} Q ${ctrlX} ${ctrlY} ${b.x} ${b.y}`}
            fill="none" stroke="#AD3A2C" strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round"
          />
        );
      })}

      {/* tender node */}
      <rect x={cx - 46} y={cy - 16} width="92" height="32" rx="4" fill="#1C2333" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono, monospace" fill="#F1F0EC">
        {tender.tenderId}
      </text>

      {/* bidder nodes */}
      {nodes.map((node) => (
        <g key={node.vendorId}>
          <circle
            cx={node.x} cy={node.y} r={node.isWinner ? 26 : 21}
            fill={node.isWinner ? "#AD3A2C" : "#E8E5DA"}
            stroke={node.isWinner ? "#AD3A2C" : "#B7B2A1"}
            strokeWidth="1.5"
          />
          <text
            x={node.x} y={node.y - 2} textAnchor="middle" fontSize="10.5"
            fontFamily="IBM Plex Mono, monospace"
            fill={node.isWinner ? "#F1F0EC" : "#1C2333"}
          >
            {node.vendorId}
          </text>
          <text
            x={node.x} y={node.y + 10} textAnchor="middle" fontSize="8"
            fontFamily="Inter, sans-serif"
            fill={node.isWinner ? "#F1F0EC" : "#63677A"}
          >
            {formatINR(node.price)}
          </text>
        </g>
      ))}
    </svg>
  );
}
