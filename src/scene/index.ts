import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import type { ClientEntry } from '../content/entries.ts';
import { Forest } from './Forest.ts';
import { currentTheme, onThemeChange, palettes } from './palette.ts';
import { buildLayout, type Layout, poseAt, ScrollMap } from './Path.ts';
import { type ObjectKind, type Placement, ProjectObjects } from './ProjectObjects.ts';
import { World } from './World.ts';

gsap.registerPlugin(ScrollTrigger);

const CONTACT = 'contact';

interface Stop {
  id: string;
  /** Camera progress at which this stop's object is framed. */
  u: number;
  /** The HTML element whose arrival mid-screen means "you're here". */
  element: HTMLElement;
}

function kindFor(e: ClientEntry): ObjectKind {
  switch (e.sceneObject) {
    case 'marker':
    case 'clearing':
    case 'tree-ring':
      return e.sceneObject;
    case 'log':
      return e.zone === 'lake' ? 'log' : 'log-pile';
  }
  if (e.type === 'research') return 'tree-ring';
  return e.zone === 'lake' ? 'log' : 'marker';
}

/**
 * One object per card, in page order: forest entries spaced through the forest, lake entries
 * floating across the lake, and a lamp in the clearing for the contact section. Objects sit just
 * right of the path, where the camera (and on wide screens, the free side of the screen) faces.
 */
function plan(layout: Layout, entries: ClientEntry[]): { placements: Placement[]; stops: Stop[] } {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const cards = [...document.querySelectorAll<HTMLElement>('#projects .card[id]')].filter((el) => byId.has(el.id));
  const forest = cards.filter((el) => byId.get(el.id)!.zone === 'forest');
  const lake = cards.filter((el) => byId.get(el.id)!.zone === 'lake');

  const placements: Placement[] = [];
  const stops: Stop[] = [];
  const place = (el: HTMLElement, z: number, side: number, lead: number) => {
    const e = byId.get(el.id)!;
    const faint = e.status === 'in-progress';
    const x = layout.pathX(z) + (faint ? 11 : side);
    placements.push({ id: e.id, kind: kindFor(e), x, y: 0, z: faint ? z - 6 : z, yaw: (z * 1.7) % 0.5, faint });
    stops.push({ id: e.id, u: layout.uAtZ(z + lead), element: el });
  };

  const forestStart = -20;
  const forestSpan = -layout.forestEnd - 30;
  forest.forEach((el, i) => place(el, forestStart - ((i + 0.5) * forestSpan) / forest.length, 3.4, 9));

  const { lake: water } = layout;
  lake.forEach((el, i) => {
    const t = (i + 0.5) / lake.length;
    place(el, water.z + water.rz * 0.55 - t * water.rz * 1.1, 3.2, 8);
  });

  const contact = document.getElementById(CONTACT);
  if (contact) {
    placements.push({ id: CONTACT, kind: 'lamp', x: layout.pathX(layout.end) + 2.6, y: 0, z: layout.end - 8, yaw: 0.3, faint: false });
    stops.push({ id: CONTACT, u: 1, element: contact });
  }
  return { placements, stops };
}

/** Builds the scene behind the page and ties the camera to scroll. */
export function bootScene(entries: ClientEntry[]): void {
  const small = window.matchMedia('(max-width: 48rem), (pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'scene';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const layout = buildLayout(
    entries.filter((e) => e.zone === 'forest').length,
    entries.filter((e) => e.zone === 'lake').length,
  );
  const world = new World(canvas, small ? 1.5 : 2);
  const forest = new Forest(layout, small ? 900 : 2400);
  const { placements, stops } = plan(layout, entries);
  const objects = new ProjectObjects(placements, () => world.requestRender(), reducedMotion);
  world.scene.add(forest.group, objects.group);

  const applyTheme = () => {
    const palette = palettes[currentTheme()];
    world.setPalette(palette);
    forest.setPalette(palette);
    objects.setPalette(palette);
  };
  applyTheme();
  onThemeChange(applyTheme);

  // Smooth scrolling, unless the visitor asked for reduced motion (then native scroll drives the camera).
  if (!reducedMotion) {
    const lenis = new Lenis({ autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('panel:open', () => lenis.stop());
    document.addEventListener('panel:close', () => lenis.start());
    // A deep link (#p/<id>) may have opened the panel before the scene loaded.
    if (document.querySelector<HTMLDialogElement>('dialog.panel')?.open) lenis.stop();
  }

  // Scroll positions at which each stop's element sits mid-screen. Recomputed on every refresh
  // (resize, fonts loading), since they depend on layout.
  const map = new ScrollMap();
  let stopScroll: number[] = [];
  const measure = () => {
    const max = ScrollTrigger.maxScroll(window);
    const mid = window.innerHeight * 0.5;
    stopScroll = stops.map((s) => {
      const r = s.element.getBoundingClientRect();
      const centre = r.top + window.scrollY + Math.min(r.height, window.innerHeight * 0.6) / 2;
      return Math.min(Math.max(centre - mid, 0), max);
    });
    map.set([
      { scroll: 0, u: 0 },
      ...stops.map((s, i) => ({ scroll: s.id === CONTACT ? max : stopScroll[i], u: s.u })),
    ]);
  };

  let active: string | null = null;
  const update = (scroll: number) => {
    poseAt(layout, map.progress(scroll), world.camera.position, world.cameraTarget);
    world.requestRender();

    // The stop nearest to its mid-screen position, if it's close enough.
    let best: string | null = null;
    let bestDistance = window.innerHeight * 0.4;
    stops.forEach((s, i) => {
      const d = Math.abs(scroll - stopScroll[i]);
      if (d < bestDistance) [best, bestDistance] = [s.id, d];
    });
    if (best !== active) {
      active = best;
      objects.setActive(active);
      document.dispatchEvent(new CustomEvent('entry:active', { detail: active }));
    }
  };

  const trigger = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => update(self.scroll()),
    onRefresh: (self) => {
      measure();
      update(self.scroll());
    },
  });
  measure();
  update(trigger.scroll());

  world.onFirstFrame(() => document.documentElement.classList.add('has-scene'));
}
