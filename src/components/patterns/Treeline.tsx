// A quiet line drawing of a Finnish forest edge (spruce and birch), the page's one hint of the
// forest. Rendered once at build time from a fixed seed, so it's the same on every visit. It holds
// the details of all four seasons; CSS shows the ones for <html data-season> (styles.css,
// "Treeline"): snow in winter, small leaves and flowers in spring, full birches in summer, gold
// leaves falling in autumn. Purely decorative, so it's hidden from assistive technology.

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

const WIDTH = 1600;
// Half-unit precision is plenty at this size and keeps the HTML small.
const f = (n: number) => Math.round(n * 2) / 2;

function Spruce({ x, g, h }: { x: number; g: number; h: number }) {
  // Four tiers, widest at the bottom, drawn as one outline.
  const tiers = 4;
  const top = g - h;
  // Zigzag: top → out, in, out, in … → across the bottom tier → back up the other side.
  const left: string[] = [];
  const right: string[] = [];
  const snow: string[] = [];
  for (let i = 1; i <= tiers; i++) {
    const y = top + (h * 0.82 * i) / tiers;
    const w = h * 0.07 + h * 0.06 * i;
    const yIn = y - h * 0.05;
    left.push(`L${f(x - w)} ${f(y)}`);
    right.unshift(`L${f(x + w)} ${f(y)}`);
    if (i < tiers) {
      left.push(`L${f(x - w * 0.45)} ${f(yIn)}`);
      right.unshift(`L${f(x + w * 0.45)} ${f(yIn)}`);
    }
    // Snow lies on the upper edge of each tier.
    snow.push(`M${f(x - w * 0.9)} ${f(y - 1.4)} L${f(x - w * 0.35)} ${f(y - h * 0.15)}`);
    snow.push(`M${f(x + w * 0.35)} ${f(y - h * 0.15)} L${f(x + w * 0.9)} ${f(y - 1.4)}`);
  }
  const outline = `M${f(x)} ${f(top)} ${left.join(' ')} ${right.join(' ')} Z`;
  return (
    <g>
      <path className="tl-line" d={outline} />
      <path className="tl-line" d={`M${f(x)} ${f(g - h * 0.18)} V${g}`} />
      <path className="tl-snow" d={`M${f(x - 1.6)} ${f(top + 3)} L${f(x)} ${f(top + 0.6)} L${f(x + 1.6)} ${f(top + 3)} ${snow.join(' ')}`} />
    </g>
  );
}

function Birch({ x, g, h, r }: { x: number; g: number; h: number; r: () => number }) {
  // Thin white-barked trunk with a few dark marks, open branches, and a crown of small leaves.
  const top = g - h;
  const marks = [0.25, 0.45, 0.65].map((t) => {
    const y = g - h * t;
    return `M${f(x - 1)} ${f(y)} h2`;
  });
  const branches = `M${f(x)} ${f(top + h * 0.35)} l${f(-h * 0.14)} ${f(-h * 0.16)} M${f(x)} ${f(top + h * 0.28)} l${f(h * 0.13)} ${f(-h * 0.14)} M${f(x)} ${f(top + h * 0.5)} l${f(h * 0.12)} ${f(-h * 0.1)}`;
  const leaves = Array.from({ length: 7 }, () => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    return { cx: f(x + Math.cos(a) * h * 0.17 * d), cy: f(top + h * 0.22 + Math.sin(a) * h * 0.15 * d), r: f(1.2 + r() * 0.9) };
  });
  return (
    <g>
      <path className="tl-line" d={`M${f(x)} ${g} V${f(top)}`} />
      <path className="tl-line tl-bark" d={marks.join(' ')} />
      <path className="tl-line tl-branch" d={branches} />
      <g className="tl-leaves">
        {leaves.map((l, i) => (
          <circle key={i} cx={l.cx} cy={l.cy} r={l.r} />
        ))}
      </g>
    </g>
  );
}

export function Treeline({ seed = 7, height = 80, className }: { seed?: number; height?: number; className?: string }) {
  const r = rng(seed);
  const g = height - 4; // ground line
  const trees: React.ReactNode[] = [];
  const flowers: { x: number; y: number }[] = [];
  const fall: { x: number; y: number }[] = [];
  let x = 6 + r() * 20;
  let i = 0;
  while (x < WIDTH - 6) {
    // Stands with glades between them: every so often skip ahead.
    if (r() < 0.045) {
      const glade = 40 + r() * 70;
      for (let k = 0; k < 3; k++) flowers.push({ x: x + 10 + r() * (glade - 20), y: g - 1.5 });
      x += glade;
      continue;
    }
    const pick = r();
    const h = height * (0.42 + r() * 0.48);
    if (pick < 0.68) trees.push(<Spruce key={i} x={f(x)} g={g} h={h} />);
    else {
      trees.push(<Birch key={i} x={f(x)} g={g} h={h * 0.9} r={r} />);
      fall.push({ x: x + 6 + r() * 14, y: g - h * 0.3 * r() - 2 });
      flowers.push({ x: x - 8 + r() * 16, y: g - 1.5 });
    }
    x += 11 + r() * 20;
    i++;
  }
  const drift = Array.from({ length: 9 }, (_, k) => {
    const cx = (WIDTH / 9) * (k + 0.2 + r() * 0.6);
    const w = 60 + r() * 90;
    return `M${f(cx - w)} ${g} Q${f(cx)} ${f(g - 4 - r() * 3)} ${f(cx + w)} ${g}`;
  }).join(' ');

  return (
    <svg
      className={className ? `treeline ${className}` : 'treeline'}
      viewBox={`0 0 ${WIDTH} ${height}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <path className="tl-drift" d={drift} />
      {trees}
      <path className="tl-line tl-ground" d={`M0 ${g} H${WIDTH}`} />
      <g className="tl-flowers">
        {flowers.map((p, k) => (
          <circle key={k} cx={f(p.x)} cy={f(p.y)} r="1.4" />
        ))}
      </g>
      <g className="tl-fall">
        {fall.map((p, k) => (
          <ellipse key={k} cx={f(p.x)} cy={f(p.y)} rx="1.8" ry="1" transform={`rotate(${Math.round(r() * 80 - 40)} ${f(p.x)} ${f(p.y)})`} />
        ))}
      </g>
    </svg>
  );
}
