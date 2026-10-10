import { gsap } from 'gsap';
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshLambertMaterial,
  PointLight,
  RingGeometry,
  type BufferGeometry,
} from 'three';
import type { Palette } from './palette.ts';

export type ObjectKind = 'marker' | 'log-pile' | 'log' | 'clearing' | 'tree-ring' | 'lamp';

export interface Placement {
  id: string;
  kind: ObjectKind;
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** In-progress entries: drawn faint, deeper in the fog, and never "found". */
  faint: boolean;
}

interface Item {
  placement: Placement;
  root: Group;
  paint: MeshLambertMaterial;
  /** 0 = unfound (grey paint), 1 = found (accent). */
  found: number;
}

const ACCENT = new Color('#C9A46A');
const LAMP = '#FFD8A0';

/**
 * One small object per entry. Each has a "paint" part (a marker band, painted log ends, one tree
 * ring, a lantern) that turns from grey to the accent colour once the visitor has reached it.
 * The current object also gets a soft warm light. Colour appears only when something is found.
 */
export class ProjectObjects {
  readonly group = new Group();
  private readonly items = new Map<string, Item>();
  private readonly wood = new MeshLambertMaterial({ flatShading: true });
  private readonly grain = new MeshLambertMaterial({ flatShading: true });
  private readonly stone = new MeshLambertMaterial({ flatShading: true });
  private readonly faint = new MeshLambertMaterial({ flatShading: true });
  private readonly light = new PointLight(LAMP, 0, 10, 1.5);
  private palette?: Palette;
  private active: string | null = null;
  private lightTimeline?: gsap.core.Timeline;

  constructor(
    placements: Placement[],
    private readonly requestRender: () => void,
    private readonly reducedMotion: boolean,
  ) {
    for (const p of placements) {
      const paint = new MeshLambertMaterial({ flatShading: true });
      const root = this.build(p, paint);
      root.position.set(p.x, p.y, p.z);
      root.rotation.y = p.yaw;
      this.group.add(root);
      this.items.set(p.id, { placement: p, root, paint, found: 0 });
    }
    this.group.add(this.light);
  }

  setPalette(p: Palette): void {
    this.palette = p;
    this.wood.color.set(p.wood);
    this.grain.color.set(p.grain);
    this.stone.color.set(p.stone);
    this.faint.color.set(p.faintObject);
    this.items.forEach((item) => this.applyPaint(item));
  }

  /** Highlight the object for the entry in view (or none). Reaching an object marks it found. */
  setActive(id: string | null): void {
    if (id === this.active) return;
    this.active = id;
    const item = id ? this.items.get(id) : undefined;
    const target = item && !item.placement.faint ? item : undefined;
    const d = (s: number) => (this.reducedMotion ? 0 : s);

    if (target && target.found < 1) {
      gsap.to(target, { found: 1, duration: d(0.9), ease: 'power1.inOut', onUpdate: () => this.applyPaint(target) });
    }

    // One moving thing at a time: the light fades out, moves while dark, then fades in.
    const light = this.light;
    this.lightTimeline?.kill();
    const tl = (this.lightTimeline = gsap.timeline({ onUpdate: this.requestRender }));
    if (light.intensity > 0) tl.to(light, { intensity: 0, duration: d(0.35), ease: 'power1.in' });
    if (target) {
      tl.add(() => {
        const { x, z } = target.placement;
        const top = target.placement.kind === 'lamp' ? 2.1 : 1.4;
        light.position.set(x, top, z + 0.6);
      });
      tl.to(light, { intensity: target.placement.kind === 'lamp' ? 9 : 6, duration: d(0.7), ease: 'power1.out' });
    }
    tl.eventCallback('onComplete', this.requestRender);
  }

  private applyPaint(item: Item): void {
    if (!this.palette) return;
    if (item.placement.faint) item.paint.color.set(this.palette.faintObject);
    else item.paint.color.set(this.palette.paint).lerp(ACCENT, item.found);
    this.requestRender();
  }

  private build(p: Placement, paint: MeshLambertMaterial): Group {
    const g = new Group();
    const wood = p.faint ? this.faint : this.wood;
    const grain = p.faint ? this.faint : this.grain;
    const stone = p.faint ? this.faint : this.stone;
    const add = (geo: BufferGeometry, mat: MeshLambertMaterial, x = 0, y = 0, z = 0) => {
      const mesh = new Mesh(geo, mat);
      mesh.position.set(x, y, z);
      g.add(mesh);
      return mesh;
    };
    const marker = (x = 0, z = 0) => {
      add(new BoxGeometry(0.11, 1.25, 0.11), wood, x, 0.62, z);
      add(new BoxGeometry(0.118, 0.22, 0.118), paint, x, 1.14, z);
      add(new IcosahedronGeometry(0.17, 0), stone, x + 0.14, 0.05, z + 0.08);
      add(new IcosahedronGeometry(0.12, 0), stone, x - 0.12, 0.03, z - 0.1);
    };
    // A log lying along z, so its painted end faces the approaching camera.
    const log = (length: number, r: number, x: number, y: number, z: number) => {
      add(new CylinderGeometry(r, r, length, 7).rotateX(Math.PI / 2), wood, x, y, z);
      add(new CylinderGeometry(r * 0.98, r * 0.98, 0.02, 7).rotateX(Math.PI / 2), grain, x, y, z - length / 2);
      add(new CylinderGeometry(r * 0.55, r * 0.55, 0.03, 7).rotateX(Math.PI / 2), paint, x, y, z + length / 2 + 0.005);
      add(new CylinderGeometry(r * 0.98, r * 0.98, 0.02, 7).rotateX(Math.PI / 2), grain, x, y, z + length / 2 - 0.004);
    };

    switch (p.kind) {
      case 'marker':
        marker();
        break;
      case 'log-pile':
        log(2.6, 0.17, -0.2, 0.17, 0);
        log(2.6, 0.17, 0.18, 0.17, 0.05);
        log(2.6, 0.16, 0, 0.47, -0.04);
        break;
      case 'log':
        // Floating, half under the water line.
        log(3, 0.2, 0, 0, 0);
        break;
      case 'clearing':
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + 0.4;
          add(new CylinderGeometry(0.2, 0.25, 0.32, 7), wood, Math.cos(a) * 1.5, 0.16, Math.sin(a) * 1.5);
          add(new CylinderGeometry(0.19, 0.19, 0.01, 7), grain, Math.cos(a) * 1.5, 0.325, Math.sin(a) * 1.5);
        }
        marker();
        break;
      case 'tree-ring': {
        add(new CylinderGeometry(0.5, 0.6, 0.55, 10), wood, 0, 0.275, 0);
        const rings = [0.5, 0.42, 0.34, 0.26, 0.18, 0.1];
        rings.forEach((outer, i) => {
          const inner = rings[i + 1] ?? 0;
          const mat = i === 1 ? paint : i % 2 ? wood : grain;
          add(new RingGeometry(inner, outer, 20).rotateX(-Math.PI / 2), mat, 0, 0.552 + i * 0.001, 0);
        });
        break;
      }
      case 'lamp':
        add(new BoxGeometry(0.1, 2.3, 0.1), wood, 0, 1.15, 0);
        add(new BoxGeometry(0.42, 0.06, 0.08), wood, 0.16, 2.24, 0);
        add(new BoxGeometry(0.2, 0.28, 0.2), paint, 0.3, 2.0, 0);
        add(new IcosahedronGeometry(0.2, 0), stone, 0.12, 0.06, 0.1);
        break;
    }
    return g;
  }
}
