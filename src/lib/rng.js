// Deterministic seeded RNG so every visitor sees the same synthetic
// market and the same ground truth — reproducible, not random-per-load.

export function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeUtils(rng) {
  const uniform = (lo, hi) => lo + rng() * (hi - lo);
  const int = (lo, hi) => Math.floor(uniform(lo, hi + 1));
  const choice = (arr) => arr[Math.floor(rng() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  // Box-Muller for an approximate lognormal, same shape as np.random.lognormal
  const lognormal = (mean, sigma) => {
    const u1 = Math.max(rng(), 1e-9);
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.exp(mean + sigma * z);
  };
  return { uniform, int, choice, shuffle, sample, lognormal };
}
