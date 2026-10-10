import {
  BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Layout } from './Path.ts';
import type { Palette } from './palette.ts';
import { rng } from './rng.ts';

/** Keep the camera's corridor clear of trunks. */
const CORRIDOR = 4.5;

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
  parts.forEach((g) => g.dispose());
  return merged;
}

/** Low-poly Scots pine: a long bare trunk and a high, narrow crown. About 4.2 units tall at scale 1. */
function pineGeometry() {
  const trunk = new CylinderGeometry(0.055, 0.1, 2.8, 5).translate(0, 1.4, 0);
  const crown = merge([
    new ConeGeometry(0.7, 1.3, 6).translate(0, 2.45, 0),
    new ConeGeometry(0.55, 1.1, 6).translate(0, 3.1, 0),
    new ConeGeometry(0.38, 0.9, 6).translate(0, 3.7, 0),
  ]);
  return { trunk, crown };
}

/** Low-poly birch: a tall pale trunk and an irregular, open crown. */
function birchGeometry() {
  const trunk = new CylinderGeometry(0.06, 0.09, 4, 5).translate(0, 2, 0);
  const crown = merge([
    new IcosahedronGeometry(0.9, 0).scale(1, 1.35, 1).translate(0, 4.1, 0),
    new IcosahedronGeometry(0.65, 0).scale(1, 1.2, 1).translate(0.35, 3.3, 0.2),
  ]);
  return { trunk, crown };
}

export class Forest {
  readonly group = new Group();
  private readonly materials: Record<
    keyof Pick<Palette, 'ground' | 'lake' | 'pineCrown' | 'pineTrunk' | 'birchCrown' | 'birchTrunk'>,
    MeshLambertMaterial | MeshBasicMaterial
  >;

  private readonly heightAt: (x: number, z: number) => number;

  constructor(layout: Layout, treeCount: number) {
    const random = rng(7);
    const phase = [random() * 10, random() * 10, random() * 10];
    // Flat along the path, gently rolling away from it, sunk under the lake.
    this.heightAt = (x, z) => {
      const roll =
        Math.sin(x * 0.08 + phase[0]) * Math.cos(z * 0.06 + phase[1]) * 1.4 + Math.sin((x + z) * 0.21 + phase[2]) * 0.35;
      const y = roll * MathUtils.smoothstep(Math.abs(x - layout.pathX(z)), 4, 22);
      return MathUtils.lerp(-0.6, y, MathUtils.smoothstep(layout.lakeDistance(x, z), 0.92, 1.12));
    };

    const mat = () => new MeshLambertMaterial({ flatShading: true });
    this.materials = {
      ground: mat(),
      // Unlit and flat: still water, a shade off the fog so the shoreline reads.
      lake: new MeshBasicMaterial(),
      pineCrown: mat(),
      pineTrunk: mat(),
      birchCrown: mat(),
      birchTrunk: mat(),
    };
    this.group.add(this.ground(layout), this.lakeMesh(layout));
    this.trees(layout, treeCount);
  }

  setPalette(p: Palette): void {
    for (const key of Object.keys(this.materials) as (keyof typeof this.materials)[]) {
      this.materials[key].color.set(p[key]);
    }
  }

  private ground(layout: Layout): Mesh {
    const zNear = 30;
    const zFar = layout.end - 80;
    const length = zNear - zFar;
    const width = 180;
    const geo = new PlaneGeometry(width, length, 72, Math.round(length / 2.5));
    geo.rotateX(-Math.PI / 2).translate(0, 0, (zNear + zFar) / 2);

    const jitter = rng(11);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // A little per-vertex jitter gives the flat-shaded facets something to catch the light on.
      pos.setY(i, this.heightAt(x, z) + (jitter() - 0.5) * 0.2);
    }
    geo.computeVertexNormals();
    return new Mesh(geo, this.materials.ground);
  }

  private lakeMesh(layout: Layout): Mesh {
    const { x, z, rx, rz } = layout.lake;
    const geo = new CircleGeometry(1, 40).rotateX(-Math.PI / 2).scale(rx, 1, rz);
    const mesh = new Mesh(geo, this.materials.lake);
    mesh.position.set(x, -0.05, z);
    return mesh;
  }

  private trees(layout: Layout, count: number): void {
    const random = rng(42);
    const zStart = 6;
    const zEnd = layout.end - 50;
    const placements: { x: number; z: number; s: number; r: number; birch: boolean; tint: number }[] = [];

    let attempts = 0;
    while (placements.length < count && attempts++ < count * 6) {
      const z = MathUtils.lerp(zStart, zEnd, random());
      const side = random() < 0.5 ? -1 : 1;
      // Denser near the path, so trunks pass close by; thinning out into the fog.
      const d = CORRIDOR + Math.pow(random(), 1.4) * 55;
      // The landing view is just fog and a few trunks.
      if (z > -25 && d < 16 && random() < 0.65) continue;
      const x = layout.pathX(z) + side * d;
      if (layout.lakeDistance(x, z, 2) < 1) continue;
      const { clearing } = layout;
      if (Math.hypot(x - clearing.x, z - clearing.z) < clearing.r) continue;
      // Near the end, keep the camera's last stretch open into the clearing.
      if (z < layout.lakeEnd && z > layout.end && d < CORRIDOR + 4) continue;
      const birch = random() < 0.3;
      placements.push({
        x,
        z,
        s: birch ? MathUtils.lerp(1.4, 2.3, random()) : MathUtils.lerp(1.5, 2.6, random()),
        r: random() * Math.PI * 2,
        birch,
        tint: MathUtils.lerp(0.9, 1.08, random()),
      });
    }

    const pine = pineGeometry();
    const birch = birchGeometry();
    const pines = placements.filter((p) => !p.birch);
    const birches = placements.filter((p) => p.birch);
    const make = (geo: BufferGeometry, material: MeshLambertMaterial | MeshBasicMaterial, items: typeof placements) => {
      const mesh = new InstancedMesh(geo, material, items.length);
      const m = new Matrix4();
      const q = new Quaternion();
      const up = new Vector3(0, 1, 0);
      const c = new Color();
      items.forEach((p, i) => {
        q.setFromAxisAngle(up, p.r);
        m.compose(new Vector3(p.x, this.heightAt(p.x, p.z) - 0.15, p.z), q, new Vector3(p.s, p.s, p.s));
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, c.setScalar(p.tint));
      });
      mesh.computeBoundingSphere();
      this.group.add(mesh);
    };
    make(pine.trunk, this.materials.pineTrunk, pines);
    make(pine.crown, this.materials.pineCrown, pines);
    make(birch.trunk, this.materials.birchTrunk, birches);
    make(birch.crown, this.materials.birchCrown, birches);
  }
}
