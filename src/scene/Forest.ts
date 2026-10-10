import {
  BufferAttribute,
  type BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  type MeshLambertMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three';
import type { Layout } from './Path.ts';
import { FLOWER_KINDS, type FlowerKind, type Look } from './palette.ts';
import { rng } from './rng.ts';
import { merge, tint, type VegUniforms, vegMaterial } from './vegetation.ts';

/** Keep the camera's corridor clear of trunks. */
const CORRIDOR = 4.5;
/** Wildflowers are drawn a little larger than life, so they read from the path. */
const FLOWER_SCALE = 2.2;

interface Veg {
  mesh: InstancedMesh | Mesh;
  uniforms: VegUniforms;
  material: MeshLambertMaterial;
}

interface Placement {
  x: number;
  z: number;
  /** Uniform scale, or [x, y, z]. */
  s: number | [number, number, number];
  r: number;
  /** Instance colour: blend (0–1) and brightness (0–1). */
  blend: number;
  shade: number;
}

/** Natural open glades along the forest walk: no trees, plenty of grass and flowers. */
interface Glade {
  x: number;
  z: number;
  r: number;
}

// ---------------------------------------------------------------------------------------------
// Geometry. Everything is low-poly and flat-shaded; the per-vertex colour's red channel picks
// between a mesh's two seasonal colours (see vegetation.ts).

/** Scots pine: long bare trunk, grey-brown below and orange-red higher up, high narrow crown. */
function pineGeometry() {
  const trunk = new CylinderGeometry(0.055, 0.1, 2.8, 5, 4).translate(0, 1.4, 0).toNonIndexed();
  const pos = trunk.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) colors.set([MathUtils.smoothstep(pos.getY(i), 1.0, 2.2), 0.5, 0], i * 3);
  trunk.setAttribute('color', new BufferAttribute(colors, 3));
  const crown = merge([
    new ConeGeometry(0.7, 1.3, 6).translate(0, 2.45, 0),
    new ConeGeometry(0.55, 1.1, 6).translate(0.05, 3.1, 0),
    new ConeGeometry(0.38, 0.9, 6).translate(0, 3.7, 0.04),
  ]);
  return { trunk, crown, height: 4.2, crownRadius: 0.7 };
}

/** Norway spruce: a dark, narrow cone of drooping tiers almost to the ground. */
function spruceGeometry() {
  const trunk = tint(new CylinderGeometry(0.07, 0.13, 1.6, 5).translate(0, 0.8, 0), 0);
  const tiers: BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    tiers.push(new ConeGeometry(1.1 - i * 0.2, 1.5 - i * 0.12, 7).translate(0, 1.0 + i * 0.86, 0));
  }
  return { trunk, crown: merge(tiers), height: 5.3, crownRadius: 1.0 };
}

/** Birch: white trunk with dark marks, a few upswept branches (all you see in winter), airy crown. */
function birchGeometry(random: () => number) {
  const trunk = new CylinderGeometry(0.06, 0.09, 4, 5, 7).translate(0, 2, 0).toNonIndexed();
  const branches = [0, 1.6, 3.2, 4.6].map((a, i) =>
    new CylinderGeometry(0.008, 0.02, 0.95 - i * 0.1, 3)
      .translate(0, 0.475 - i * 0.05, 0)
      .rotateZ(0.55)
      .rotateY(a)
      .translate(0, 2.7 + i * 0.35, 0)
      .toNonIndexed(),
  );
  // Per face, so the dark lenticel marks are crisp patches rather than smears.
  const markFaces = (g: BufferGeometry, chance: number, base: number) => {
    const count = g.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let f = 0; f < count; f += 3) {
      const r = random() < chance ? 1 : base;
      for (let v = 0; v < 3; v++) colors.set([r, 0.5, 0], (f + v) * 3);
    }
    g.setAttribute('color', new BufferAttribute(colors, 3));
    return g;
  };
  markFaces(trunk, 0.13, 0);
  branches.forEach((b) => markFaces(b, 0, 0.55));
  // An airy crown of several small leaf masses, so light and sky show through.
  const crown = merge(
    [
      [0, 4.45, 0, 0.5],
      [0.42, 4.05, 0.15, 0.46],
      [-0.38, 4.1, -0.2, 0.44],
      [0.1, 3.7, -0.42, 0.42],
      [-0.15, 3.55, 0.4, 0.4],
      [0.45, 3.4, -0.1, 0.36],
      [-0.45, 3.35, 0.05, 0.34],
    ].map(([x, y, z, r]) => new IcosahedronGeometry(r, 0).scale(1, 1.2, 1).translate(x, y, z)),
  );
  return { trunk: merge([trunk, ...branches]), crown, height: 4.6, crownRadius: 0.9 };
}

const stem = (h: number) => tint(new CylinderGeometry(0.006, 0.009, h, 3).translate(0, h / 2, 0), 0);
const petal = (g: BufferGeometry) => tint(g, 1);

/** Finnish wildflowers, in their season: stem (r = 0) and flower (r = 1). Local height in metres. */
function flowerGeometry(kind: FlowerKind, random: () => number): { geo: BufferGeometry; height: number } {
  switch (kind) {
    case 'anemone': // valkovuokko: white, low, carpets under spring birches
      return { geo: merge([stem(0.13), petal(new CircleGeometry(0.042, 5).rotateX(-Math.PI / 2.4).translate(0, 0.135, 0))]), height: 0.14 };
    case 'coltsfoot': // leskenlehti: early yellow on bare path edges
      return { geo: merge([stem(0.09), petal(new CircleGeometry(0.036, 8).rotateX(-Math.PI / 2.2).translate(0, 0.095, 0))]), height: 0.1 };
    case 'lily': // kielo, Finland's national flower: a row of small white bells
      return {
        geo: merge([
          stem(0.17),
          ...[0, 1, 2].map((i) => petal(new IcosahedronGeometry(0.016, 0).translate(0.028, 0.15 - i * 0.03, 0))),
        ]),
        height: 0.17,
      };
    case 'buttercup': // niittyleinikki: meadow yellow, two heads
      return {
        geo: merge([
          stem(0.33),
          petal(new CircleGeometry(0.03, 5).rotateX(-Math.PI / 2).translate(0, 0.33, 0)),
          tint(new CylinderGeometry(0.005, 0.006, 0.1, 3).rotateZ(-0.6).translate(0.03, 0.27, 0), 0),
          petal(new CircleGeometry(0.026, 5).rotateX(-Math.PI / 2).translate(0.06, 0.31, 0)),
        ]),
        height: 0.33,
      };
    case 'harebell': // kissankello: nodding blue bells
      return {
        geo: merge([stem(0.3), petal(new ConeGeometry(0.03, 0.05, 5, 1, true).rotateZ(Math.PI * 0.85).translate(0.012, 0.29, 0))]),
        height: 0.31,
      };
    case 'fireweed': // maitohorsma: tall pink spikes in clearings and on shores
      return {
        geo: merge([
          stem(0.82),
          ...[0, 1, 2, 3].map((i) => petal(new ConeGeometry(0.05 - i * 0.009, 0.1, 5).translate(0, 0.6 + i * 0.075, 0))),
        ]),
        height: 0.9,
      };
    case 'heather': {
      // kanerva: low mounds, flowering purple over green
      const mound = new IcosahedronGeometry(0.12, 0).scale(1.3, 0.7, 1.3).translate(0, 0.06, 0).toNonIndexed();
      const count = mound.attributes.position.count;
      const colors = new Float32Array(count * 3);
      for (let f = 0; f < count; f += 3) {
        const r = random() < 0.6 ? 1 : 0;
        for (let v = 0; v < 3; v++) colors.set([r, 0.5, 0], (f + v) * 3);
      }
      mound.setAttribute('color', new BufferAttribute(colors, 3));
      return { geo: mound, height: 0.13 };
    }
  }
}

/** Soft round contact shadow, drawn once to a small canvas. */
function shadowTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

// ---------------------------------------------------------------------------------------------

export class Forest {
  readonly group = new Group();
  private readonly heightAt: (x: number, z: number) => number;
  private readonly density: (x: number, z: number) => number;
  private readonly glades: Glade[] = [];
  private readonly veg: Record<string, Veg> = {};
  private readonly flowers = new Map<FlowerKind, Veg>();
  private readonly lake: Mesh<CircleGeometry, MeshBasicMaterial>;
  private readonly shadowMaterial: MeshBasicMaterial;
  /** Sun-side offset for contact shadows (the sun is high to the left, behind the camera). */
  private readonly shadowOffset = new Vector3(0.18, 0, -0.12);

  constructor(private readonly layout: Layout) {
    const random = rng(7);
    const phase = [random() * 10, random() * 10, random() * 10];
    // Flat along the path, gently rolling away from it, sunk under the lake.
    this.heightAt = (x, z) => {
      const roll =
        Math.sin(x * 0.08 + phase[0]) * Math.cos(z * 0.06 + phase[1]) * 1.4 + Math.sin((x + z) * 0.21 + phase[2]) * 0.35;
      const y = roll * MathUtils.smoothstep(Math.abs(x - layout.pathX(z)), 4, 22);
      return MathUtils.lerp(-0.6, y, MathUtils.smoothstep(layout.lakeDistance(x, z), 0.92, 1.12));
    };
    // Low-frequency stand density: thicker stands and lighter patches rather than an even spread.
    this.density = (x, z) =>
      0.5 + 0.5 * Math.sin(x * 0.071 + 1.3) * Math.cos(z * 0.052 + 0.4) * 0.8 + 0.1 * Math.sin(z * 0.19 + x * 0.05);

    // A few glades along the forest walk, alternating sides.
    const glade = rng(3);
    const forestLength = -layout.forestEnd;
    const count = Math.max(2, Math.round(forestLength / 32));
    for (let i = 0; i < count; i++) {
      const z = -14 - ((i + 0.5) * (forestLength - 20)) / count;
      const side = i % 2 ? -1 : 1;
      this.glades.push({ x: layout.pathX(z) + side * MathUtils.lerp(9, 14, glade()), z, r: MathUtils.lerp(5, 8, glade()) });
    }

    this.shadowMaterial = new MeshBasicMaterial({
      alphaMap: shadowTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });

    this.group.add(this.ground());
    this.lake = this.lakeMesh();
    this.group.add(this.lake);
  }

  setLook(look: Look): void {
    const set = (name: string, a: string, b: string, bloom = 1) => {
      const v = this.veg[name];
      if (!v) return;
      v.uniforms.colA.value.set(a);
      v.uniforms.colB.value.set(b);
      v.uniforms.bloom.value = bloom;
      v.mesh.visible = bloom > 0.005;
    };
    set('ground', look.groundA, look.groundB);
    set('pineTrunk', look.pineTrunkLow, look.pineTrunkHigh);
    set('pineCrown', look.pineCrownA, look.pineCrownB);
    set('spruceTrunk', look.spruceTrunk, look.spruceTrunk);
    set('spruceCrown', look.spruceCrownA, look.spruceCrownB);
    set('birchTrunk', look.birchBark, look.birchMark);
    set('birchCrown', look.birchCrownA, look.birchCrownB, look.birchLeaves);
    set('shrubs', look.shrubA, look.shrubB, look.shrubs);
    set('grass', look.grassA, look.grassB, look.grass);
    set('rocks', look.rockA, look.rockB);
    for (const kind of FLOWER_KINDS) {
      const v = this.flowers.get(kind);
      if (!v) continue;
      v.uniforms.colA.value.set(look.stem);
      v.uniforms.colB.value.set(look.petals[kind]);
      v.uniforms.bloom.value = look.flowers[kind];
      v.mesh.visible = look.flowers[kind] > 0.005;
    }
    this.lake.material.color.set(look.lake);
    this.shadowMaterial.color.set(look.shadow);
    this.shadowMaterial.opacity = look.shadowOpacity;
  }

  // -------------------------------------------------------------------------------------------

  private inGlade(x: number, z: number, margin = 0): boolean {
    return this.glades.some((g) => Math.hypot(x - g.x, z - g.z) < g.r + margin);
  }

  private inClearing(x: number, z: number, margin = 0): boolean {
    const c = this.layout.clearing;
    return Math.hypot(x - c.x, z - c.z) < c.r + margin;
  }

  private ground(): Mesh {
    const { layout } = this;
    const zNear = 30;
    const zFar = layout.end - 80;
    const length = zNear - zFar;
    const width = 180;
    // Heights and colours are computed once per grid point on the indexed plane, then expanded to
    // separate triangles (needed for crisp flat shading), so shared corners always agree.
    const grid = new PlaneGeometry(width, length, 72, Math.round(length / 2.5));
    grid.rotateX(-Math.PI / 2).translate(0, 0, (zNear + zFar) / 2);
    const hash = (x: number, z: number) => {
      const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
      return h - Math.floor(h);
    };
    const pos = grid.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // A little jitter gives the flat-shaded facets something to catch the light on.
      pos.setY(i, this.heightAt(x, z) + (hash(x, z) - 0.5) * 0.2);
      // Moss (0) and heath / needle litter (1) in patches; the walked path is needle-covered.
      const patches = 0.3 + 0.35 * Math.sin(x * 0.19 + 2.1) * Math.cos(z * 0.23) + 0.15 * Math.sin(x * 0.6 + z * 0.4);
      const trail = 1 - MathUtils.smoothstep(Math.abs(x - layout.pathX(z)), 0.8, 2.2);
      colors.set([MathUtils.clamp(Math.max(patches, trail), 0, 1), 0.3 + hash(z, x) * 0.4, 0], i * 3);
    }
    grid.setAttribute('color', new BufferAttribute(colors, 3));
    const geo = grid.toNonIndexed();
    grid.dispose();
    geo.computeVertexNormals();
    const { material, uniforms } = vegMaterial({ vertexColors: true });
    const mesh = new Mesh(geo, material);
    this.veg.ground = { mesh, uniforms, material };
    return mesh;
  }

  private lakeMesh(): Mesh<CircleGeometry, MeshBasicMaterial> {
    const { x, z, rx, rz } = this.layout.lake;
    const geo = new CircleGeometry(1, 48).rotateX(-Math.PI / 2).scale(rx, 1, rz);
    // Unlit and flat: still water (or snow-covered ice in winter).
    const mesh = new Mesh(geo, new MeshBasicMaterial());
    mesh.position.set(x, -0.05, z);
    return mesh;
  }

  /** One instanced mesh per part, all sharing the same placements. */
  private instanced(
    name: string,
    geo: BufferGeometry,
    items: Placement[],
    opts: Parameters<typeof vegMaterial>[0],
    sink = 0,
  ): void {
    if (!items.length) return;
    const { material, uniforms } = vegMaterial(opts);
    const mesh = new InstancedMesh(geo, material, items.length);
    const m = new Matrix4();
    const q = new Quaternion();
    const e = new Euler();
    const s = new Vector3();
    const p = new Vector3();
    const c = new Color();
    items.forEach((it, i) => {
      if (typeof it.s === 'number') s.setScalar(it.s);
      else s.set(...it.s);
      q.setFromEuler(e.set(0, it.r, 0));
      p.set(it.x, this.heightAt(it.x, it.z) - sink * s.y, it.z);
      mesh.setMatrixAt(i, m.compose(p, q, s));
      // Per-vertex colours carry the blend for these meshes; otherwise it's per instance.
      if (!opts?.vertexColors) mesh.setColorAt(i, c.setRGB(it.blend, it.shade, 0));
    });
    mesh.computeBoundingSphere();
    this.group.add(mesh);
    this.veg[name] = { mesh, uniforms, material };
  }

  private shadows(items: { x: number; z: number; size: number }[]): void {
    if (!items.length) return;
    const geo = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const mesh = new InstancedMesh(geo, this.shadowMaterial, items.length);
    const m = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3();
    const p = new Vector3();
    items.forEach((it, i) => {
      p.set(it.x, this.heightAt(it.x, it.z) + 0.04, it.z).addScaledVector(this.shadowOffset, it.size);
      mesh.setMatrixAt(i, m.compose(p, q, s.set(it.size, 1, it.size * 0.85)));
    });
    mesh.computeBoundingSphere();
    this.group.add(mesh);
  }

  /** Pine, spruce and birch, mixed the way a Finnish forest is: pine on dry ground, spruce near water, birch on edges. */
  addTrees(count: number): void {
    const { layout } = this;
    const random = rng(42);
    const zStart = 6;
    const zEnd = layout.end - 50;
    const pines: Placement[] = [];
    const spruces: Placement[] = [];
    const birches: Placement[] = [];
    const shade: { x: number; z: number; size: number }[] = [];

    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts++ < count * 8) {
      const z = MathUtils.lerp(zStart, zEnd, random());
      const side = random() < 0.5 ? -1 : 1;
      // Denser near the path, so trunks pass close by; thinning out into the haze.
      const d = CORRIDOR + Math.pow(random(), 1.4) * 55;
      // The landing view is just a few trunks.
      if (z > -25 && d < 16 && random() < 0.65) continue;
      const x = layout.pathX(z) + side * d;
      if (random() > 0.3 + 0.7 * this.density(x, z)) continue;
      if (layout.lakeDistance(x, z, 2) < 1) continue;
      if (this.inClearing(x, z) || this.inGlade(x, z)) continue;
      // Near the end, keep the camera's last stretch open into the clearing.
      if (z < layout.lakeEnd && z > layout.end && d < CORRIDOR + 4) continue;

      const nearWater = layout.lakeDistance(x, z) < 1.7;
      const edge = d < 9 || this.inGlade(x, z, 5) || this.inClearing(x, z, 6);
      const roll = random();
      const species = nearWater
        ? roll < 0.5 ? 'spruce' : roll < 0.78 ? 'birch' : 'pine'
        : edge
          ? roll < 0.42 ? 'birch' : roll < 0.75 ? 'pine' : 'spruce'
          : roll < 0.55 ? 'pine' : roll < 0.85 ? 'spruce' : 'birch';
      // Spruces are wide at the base: keep them a step back from the path so they don't loom.
      if (species === 'spruce' && d < CORRIDOR + 2) continue;
      const scale =
        species === 'birch' ? MathUtils.lerp(1.4, 2.3, random()) : species === 'spruce' ? MathUtils.lerp(1.3, 2.3, random()) : MathUtils.lerp(1.5, 2.6, random());
      const item: Placement = { x, z, s: scale, r: random() * Math.PI * 2, blend: random(), shade: random() };
      (species === 'pine' ? pines : species === 'spruce' ? spruces : birches).push(item);
      const radius = species === 'spruce' ? 1.0 : species === 'birch' ? 0.9 : 0.7;
      if (d < 40) shade.push({ x, z, size: radius * scale * 2.4 });
      placed++;
    }

    const pine = pineGeometry();
    const spruce = spruceGeometry();
    const birch = birchGeometry(random);
    // Trunk and crown share wind settings, so they bend together.
    this.instanced('pineTrunk', pine.trunk, pines, { wind: 0.05, height: pine.height, vertexColors: true });
    this.instanced('pineCrown', pine.crown, pines, { wind: 0.05, height: pine.height });
    this.instanced('spruceTrunk', spruce.trunk, spruces, { wind: 0.04, height: spruce.height, vertexColors: true });
    this.instanced('spruceCrown', spruce.crown, spruces, { wind: 0.04, height: spruce.height });
    this.instanced('birchTrunk', birch.trunk, birches, { wind: 0.08, height: birch.height, vertexColors: true });
    this.instanced('birchCrown', birch.crown, birches, { wind: 0.08, height: birch.height, flutter: 0.012 });
    this.shadows(shade);
  }

  /** Forest floor: bilberry and lingonberry, grass, and moss-backed boulders left by the ice age. */
  addFloor(counts: { shrubs: number; grass: number; rocks: number }): void {
    const { layout } = this;
    const random = rng(77);
    const zEnd = layout.end - 30;
    const spot = (maxD: number, nearPath = 1.4): { x: number; z: number; d: number } | null => {
      const z = MathUtils.lerp(5, zEnd, random());
      const d = 1.5 + Math.pow(random(), nearPath) * maxD;
      const x = layout.pathX(z) + (random() < 0.5 ? -1 : 1) * d;
      if (layout.lakeDistance(x, z) < 1.02) return null;
      return { x, z, d };
    };

    const shrubs: Placement[] = [];
    for (let i = 0; shrubs.length < counts.shrubs && i < counts.shrubs * 4; i++) {
      const p = spot(38);
      if (!p || random() > 0.25 + 0.75 * this.density(p.x, p.z)) continue;
      shrubs.push({ x: p.x, z: p.z, s: MathUtils.lerp(0.8, 1.5, random()), r: random() * 6.3, blend: random(), shade: random() });
    }

    // Grass favours glades, the clearing, shores and the path edge.
    const grass: Placement[] = [];
    for (let i = 0; grass.length < counts.grass && i < counts.grass * 4; i++) {
      const p = spot(34, 1.8);
      if (!p) continue;
      const open = this.inGlade(p.x, p.z, 2) || this.inClearing(p.x, p.z, 3) || layout.lakeDistance(p.x, p.z) < 1.3 || p.d < 4;
      if (!open && random() < 0.6) continue;
      grass.push({ x: p.x, z: p.z, s: MathUtils.lerp(0.7, 1.5, random()), r: random() * 6.3, blend: random(), shade: random() });
    }

    const rocks: Placement[] = [];
    const rockShade: { x: number; z: number; size: number }[] = [];
    for (let i = 0; rocks.length < counts.rocks && i < counts.rocks * 6; i++) {
      const p = spot(40, 1.1);
      if (!p || p.d < 2.5) continue;
      const size = MathUtils.lerp(0.5, 1.8, Math.pow(random(), 2));
      const s: [number, number, number] = [size * MathUtils.lerp(0.9, 1.4, random()), size * MathUtils.lerp(0.55, 0.9, random()), size];
      // Blend = how mossy (or, in winter, how snow-capped).
      rocks.push({ x: p.x, z: p.z, s, r: random() * 6.3, blend: Math.pow(random(), 0.7), shade: random() });
      if (p.d < 30) rockShade.push({ x: p.x, z: p.z, size: size * 1.6 });
    }

    // Bilberry / lingonberry: a low, bushy clump of small leafy pieces, not a single blob.
    const shrubGeo = merge(
      [
        [0, 0.13, 0, 0.12],
        [0.13, 0.1, 0.05, 0.1],
        [-0.1, 0.09, 0.08, 0.09],
        [0.03, 0.08, -0.12, 0.1],
        [-0.06, 0.17, -0.03, 0.08],
      ].map(([x, y, z, r]) => new IcosahedronGeometry(r, 0).scale(1, 0.85, 1).translate(x, y, z)),
    );
    const blades = [0, 1, 2, 3].map((i) =>
      new ConeGeometry(0.022, 0.42 - i * 0.04, 3)
        .translate(0, (0.42 - i * 0.04) / 2, 0)
        .rotateZ((i - 1.5) * 0.22)
        .rotateY(i * 1.7),
    );
    this.instanced('shrubs', shrubGeo, shrubs, { wind: 0.025, height: 0.25 });
    this.instanced('grass', merge(blades), grass, { wind: 0.1, height: 0.42 });
    this.instanced('rocks', new IcosahedronGeometry(0.55, 0), rocks, {}, 0.28);
    this.shadows(rockShade);
  }

  /**
   * Wildflowers in patches: in glades and the clearing, along the path edge, and on the lake shore,
   * each kind where it actually grows. Which ones show depends on the season (see palette.ts).
   */
  addFlowers(count: number): void {
    const { layout } = this;
    const random = rng(99);
    const pick = (weights: Partial<Record<FlowerKind, number>>): FlowerKind => {
      const entries = Object.entries(weights) as [FlowerKind, number][];
      let roll = random() * entries.reduce((sum, [, w]) => sum + w, 0);
      for (const [k, w] of entries) if ((roll -= w) <= 0) return k;
      return entries[0][0];
    };
    const meadow = { fireweed: 0.25, buttercup: 0.2, harebell: 0.2, heather: 0.15, anemone: 0.1, lily: 0.1, coltsfoot: 0.05 };
    const edge = { anemone: 0.25, coltsfoot: 0.2, lily: 0.2, harebell: 0.15, buttercup: 0.1, heather: 0.1 };
    const shore = { buttercup: 0.35, harebell: 0.25, fireweed: 0.2, coltsfoot: 0.2 };

    const byKind = new Map<FlowerKind, Placement[]>(FLOWER_KINDS.map((k) => [k, []]));
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts++ < count) {
      const where = random();
      let cx: number;
      let cz: number;
      let kind: FlowerKind;
      if (where < 0.35) {
        const g = random() < 0.75 ? this.glades[Math.floor(random() * this.glades.length)] : { ...layout.clearing };
        const a = random() * Math.PI * 2;
        const r = Math.sqrt(random()) * g.r;
        [cx, cz] = [g.x + Math.cos(a) * r, g.z + Math.sin(a) * r];
        kind = pick(meadow);
      } else if (where < 0.82) {
        cz = MathUtils.lerp(4, layout.end - 10, random());
        cx = layout.pathX(cz) + (random() < 0.5 ? -1 : 1) * MathUtils.lerp(1.3, 5, random());
        kind = pick(edge);
      } else {
        const a = random() * Math.PI * 2;
        const ring = MathUtils.lerp(1.04, 1.22, random());
        const { lake } = layout;
        [cx, cz] = [lake.x + Math.cos(a) * lake.rx * ring, lake.z + Math.sin(a) * lake.rz * ring];
        kind = pick(shore);
      }
      // A patch of one kind, as flowers actually grow.
      const n = 4 + Math.floor(random() * 9);
      for (let i = 0; i < n && placed < count; i++) {
        const x = cx + (random() - 0.5) * 1.6;
        const z = cz + (random() - 0.5) * 1.6;
        if (layout.lakeDistance(x, z) < 1.02 || Math.abs(x - layout.pathX(z)) < 1.1) continue;
        byKind.get(kind)!.push({ x, z, s: FLOWER_SCALE * MathUtils.lerp(0.8, 1.3, random()), r: random() * 6.3, blend: 0, shade: 0.5 });
        placed++;
      }
    }

    for (const kind of FLOWER_KINDS) {
      const { geo, height } = flowerGeometry(kind, random);
      const wind = kind === 'heather' ? 0.01 : kind === 'fireweed' ? 0.07 : 0.05;
      this.instanced(`flower-${kind}`, geo, byKind.get(kind)!, { wind, height, flutter: kind === 'heather' ? 0 : 0.004, vertexColors: true });
      const v = this.veg[`flower-${kind}`];
      if (v) this.flowers.set(kind, v);
    }
  }
}
