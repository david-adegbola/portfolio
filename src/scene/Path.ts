import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';

/**
 * The camera path: forest → across the lake → the clearing, running along -z.
 * Zone lengths scale with the number of entries, so a site with three entries is a short,
 * complete walk rather than a long empty one.
 */
export interface Layout {
  curve: CatmullRomCurve3;
  /** z where each zone starts/ends (z decreases along the path). */
  forestEnd: number;
  lakeEnd: number;
  end: number;
  lake: { x: number; z: number; rx: number; rz: number };
  clearing: { x: number; z: number; r: number };
  /** Path x at a given z (the path is a function of z, which makes "distance to path" cheap). */
  pathX(z: number): number;
  /** Signed lake test: < 1 inside the ellipse. */
  lakeDistance(x: number, z: number, margin?: number): number;
}

const EYE_LAND = 1.7;
const EYE_WATER = 2.1;

const sway = (z: number) => Math.sin(z * 0.045) * 5 + Math.sin(z * 0.11 + 1.3) * 1.5;

export function buildLayout(forestCount: number, lakeCount: number): Layout {
  const forestLength = 50 + 16 * Math.max(forestCount, 1);
  const lakeLength = 30 + 6 * Math.max(lakeCount, 1);
  const clearingLength = 24;

  const forestEnd = -forestLength;
  const lakeEnd = forestEnd - lakeLength;
  const end = lakeEnd - clearingLength;

  // Over the water the path straightens out: a calm crossing.
  const damp = (z: number) => (z < forestEnd && z > lakeEnd ? 0.35 : 1);
  const xAt = (z: number) => sway(z) * damp(z);

  const points: Vector3[] = [];
  const step = 8;
  for (let z = 0; z > end; z -= step) points.push(new Vector3(xAt(z), 0, z));
  points.push(new Vector3(xAt(end), 0, end));
  const curve = new CatmullRomCurve3(points, false, 'centripetal');

  // Sample the curve into a z → x lookup.
  const samples = 800;
  const zs = new Float32Array(samples + 1);
  const xs = new Float32Array(samples + 1);
  const p = new Vector3();
  for (let i = 0; i <= samples; i++) {
    curve.getPointAt(i / samples, p);
    zs[i] = p.z;
    xs[i] = p.x;
  }
  const pathX = (z: number) => {
    if (z >= zs[0]) return xs[0];
    if (z <= zs[samples]) return xs[samples];
    let lo = 0;
    let hi = samples;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (zs[mid] > z) lo = mid;
      else hi = mid;
    }
    const t = (z - zs[lo]) / (zs[hi] - zs[lo]);
    return xs[lo] + (xs[hi] - xs[lo]) * t;
  };

  const lakeZ = (forestEnd + lakeEnd) / 2;
  // Narrow enough that both shores stay visible through the fog.
  const lake = { x: pathX(lakeZ), z: lakeZ, rx: 17, rz: lakeLength / 2 - 3 };
  const lakeDistance = (x: number, z: number, margin = 0) =>
    Math.hypot((x - lake.x) / (lake.rx + margin), (z - lake.z) / (lake.rz + margin));

  const clearing = { x: pathX(end), z: end - 12, r: 17 };

  return { curve, forestEnd, lakeEnd, end, lake, clearing, pathX, lakeDistance };
}

const ahead = new Vector3();
const tangent = new Vector3();

/** Camera pose at path progress u (0–1). Writes into position and target. */
export function poseAt(layout: Layout, u: number, position: Vector3, target: Vector3): void {
  const t = MathUtils.clamp(u, 0, 1);
  layout.curve.getPointAt(t, position);
  const overWater = MathUtils.smoothstep(1.15 - layout.lakeDistance(position.x, position.z), 0, 0.3);
  position.y = MathUtils.lerp(EYE_LAND, EYE_WATER, overWater);

  // Look a little way down the path; near the end, keep looking straight on along the last tangent.
  const lookU = t + 0.035;
  if (lookU <= 1) layout.curve.getPointAt(lookU, ahead);
  else {
    layout.curve.getPointAt(1, ahead);
    layout.curve.getTangentAt(1, tangent);
    ahead.addScaledVector(tangent, (lookU - 1) * layout.curve.getLength());
  }
  target.set(ahead.x, position.y - 0.15, ahead.z);
}
