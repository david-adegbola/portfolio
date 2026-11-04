// The site's one visual idea: concentric, slightly irregular rings that read both as a tree's
// growth rings and as map contour lines (forestry and GIS in one drawing). Drawn at build time
// from a fixed seed, so it's the same on every visit; decorative, hidden from assistive tech.
// The innermost ring (the pith, or the hilltop) takes the season colour. See styles.css "Rings".

/** Small deterministic RNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 2) / 2;

/** One closed, smooth ring through `pts` (quadratic curves through the midpoints). */
function closed(pts: [number, number][]): string {
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = pts.length;
  const start = mid(pts[n - 1], pts[0]);
  let d = `M${f(start[0])} ${f(start[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return `${d} Z`;
}

export function Rings({ count = 11, seed = 5, className }: { count?: number; seed?: number; className?: string }) {
  const r = rng(seed);
  // A few low-frequency waves shared by every ring, so the rings stay nested (never cross) and
  // look like one tree, or one hill.
  const waves = [2, 3, 5].map((k) => ({ k, a: 0.025 + r() * 0.035, p: r() * Math.PI * 2 }));
  // Small marks need far fewer points than the hero drawing (keeps the HTML small).
  const steps = count <= 4 ? 18 : 36;
  const rings: string[] = [];
  for (let i = 0; i < count; i++) {
    // Rings get wider apart outwards, with a little year-to-year variation.
    const t = (i + 1) / count;
    const radius = 46 * Math.pow(t, 0.85) * (0.97 + r() * 0.06);
    // The centre drifts slightly with each ring: trees aren't perfectly round.
    const cx = 50 + (1 - t) * 2.5;
    const cy = 50 - (1 - t) * 1.5;
    const pts: [number, number][] = [];
    for (let s = 0; s < steps; s++) {
      const th = (s / steps) * Math.PI * 2;
      const w = waves.reduce((acc, v) => acc + v.a * Math.sin(v.k * th + v.p + i * 0.08), 0);
      const rr = radius * (1 + w * t);
      pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]);
    }
    rings.push(closed(pts));
  }
  return (
    <svg className={className ? `rings ${className}` : 'rings'} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {rings.map((d, i) => (
        <path key={i} d={d} className={i === 0 ? 'rings-pith' : undefined} />
      ))}
    </svg>
  );
}
