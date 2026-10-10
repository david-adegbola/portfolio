import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import type { ClientEntry } from '../content/entries.ts';
import { Forest } from './Forest.ts';
import { currentTheme, onThemeChange, palettes } from './palette.ts';
import { buildLayout, poseAt } from './Path.ts';
import { World } from './World.ts';

gsap.registerPlugin(ScrollTrigger);

/** Builds the scene behind the page and ties the camera to scroll progress. */
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
  world.scene.add(forest.group);

  const applyTheme = () => {
    const palette = palettes[currentTheme()];
    world.setPalette(palette);
    forest.setPalette(palette);
  };
  applyTheme();
  onThemeChange(applyTheme);

  const setProgress = (progress: number) => {
    poseAt(layout, progress, world.camera.position, world.cameraTarget);
    world.requestRender();
  };

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

  const trigger = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => setProgress(self.progress),
  });
  setProgress(trigger.progress);

  world.onFirstFrame(() => document.documentElement.classList.add('has-scene'));
}
