import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import type { ClientEntry } from '../content/entries.ts';
import { provideFlight } from '../nav.ts';
import { Forest } from './Forest.ts';
import { currentTheme, onThemeChange, palettes } from './palette.ts';
import { buildLayout, type Layout, poseAt, ScrollMap } from './Path.ts';
import { type ObjectKind, type Placement, ProjectObjects } from './ProjectObjects.ts';
import { World } from './World.ts';

gsap.registerPlugin(ScrollTrigger);
// Mobile address bars resize the viewport while scrolling; don't re-measure for that.
ScrollTrigger.config({ ignoreMobileResize: true });

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
  const world = new World(canvas, small ? 1.5 : 2, !small);
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
  let lenis: Lenis | undefined;
  if (!reducedMotion) {
    lenis = new Lenis({ autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis!.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('panel:open', () => lenis!.stop());
    document.addEventListener('panel:close', () => lenis!.start());
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

  // Reduced motion: the camera never glides. It holds at a stop and cuts to the next one, with a
  // short crossfade of the canvas, as the visitor scrolls from card to card.
  // Holds at whichever stop is nearest (the top of the page counts as one), matching the active card.
  const stepProgress = (scroll: number) => {
    let u = 0;
    let nearest = scroll;
    stops.forEach((s, i) => {
      const d = Math.abs(scroll - stopScroll[i]);
      if (d < nearest) [u, nearest] = [s.u, d];
    });
    return u;
  };
  let shownU = -1;
  let wantedU = 0;
  let cutting = false;
  const cutTo = (u: number) => {
    wantedU = u;
    if (shownU < 0) {
      // First frame: no fade.
      shownU = u;
      poseAt(layout, u, world.camera.position, world.cameraTarget);
      return world.requestRender();
    }
    if (cutting || u === shownU) return;
    cutting = true;
    // Web Animations, not CSS transitions: the reduced-motion stylesheet zeroes transitions.
    const out = canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
    out.onfinish = () => {
      shownU = wantedU;
      poseAt(layout, shownU, world.camera.position, world.cameraTarget);
      world.renderNow();
      const back = canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
      out.cancel();
      back.onfinish = () => {
        // Hand opacity back to the stylesheet (it hides the canvas if the GPU context is lost).
        back.cancel();
        cutting = false;
        // The visitor may have scrolled on during the fade.
        if (wantedU !== shownU) cutTo(wantedU);
      };
    };
  };

  let active: string | null = null;
  // While flying to a search result, objects passed on the way aren't "reached": no light hopping
  // from object to object, just the one at the destination.
  let flying = false;
  const update = (scroll: number) => {
    if (reducedMotion) cutTo(stepProgress(scroll));
    else {
      poseAt(layout, map.progress(scroll), world.camera.position, world.cameraTarget);
      world.requestRender();
    }
    if (flying) return;

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

  document.addEventListener('search:filter', (event) => objects.setFilter((event as CustomEvent<string[] | null>).detail));

  // Camera flights: a scroll to the stop's position, so camera, card and page stay in step.
  // 1.6 s ease-in-out, no overshoot; under reduced motion, a cut.
  const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  // Each flight settles exactly once: on arrival, on a safety timeout (if the scroll library never
  // reports completion), or when a newer flight replaces it.
  let settle: (() => void) | null = null;
  provideFlight(
    (target) =>
      new Promise((resolve) => {
        settle?.();
        const limit = lenis ? lenis.limit : ScrollTrigger.maxScroll(window);
        const i = stops.findIndex((s) => s.id === target);
        const wanted = target === 'top' ? 0 : target === CONTACT ? limit : i >= 0 ? stopScroll[i] : null;
        if (wanted === null) return resolve();
        const to = Math.min(Math.max(wanted, 0), limit);

        let timer = 0;
        const done = () => {
          if (settle !== done) return;
          settle = null;
          clearTimeout(timer);
          flying = false;
          update(window.scrollY);
          resolve();
        };
        settle = done;

        if (!lenis || Math.abs(window.scrollY - to) < 2) {
          window.scrollTo(0, to);
          return void requestAnimationFrame(done);
        }
        flying = true;
        const duration = 1.6;
        timer = window.setTimeout(done, duration * 1000 + 400);
        lenis.scrollTo(to, { duration, easing: easeInOutCubic, force: true, lock: true, onComplete: done });
      }),
  );

  world.onFirstFrame(() => document.documentElement.classList.add('has-scene'));
}
