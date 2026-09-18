export function formatINR(value) {
  const crore = value / 1e7;
  const lakh = value / 1e5;
  if (crore >= 1) return `\u20B9${crore.toFixed(2)} Cr`;
  return `\u20B9${lakh.toFixed(1)} L`;
}

export function pct(v) {
  return `${Math.round(v * 100)}%`;
}
