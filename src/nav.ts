/**
 * The bridge between the UI and the scene. The UI asks to "fly" to an entry (an entry id,
 * `contact`, or `top`) and to filter matches; the scene, once loaded, takes over the flight so the
 * camera travels the path. Without the scene (no WebGL, or before it loads) the page just scrolls.
 */
export type FlyTarget = string;
type Flight = (target: FlyTarget) => Promise<void>;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scrollFallback: Flight = (target) =>
  new Promise((resolve) => {
    const el = target === 'top' ? document.body : document.getElementById(target);
    if (!el) return resolve();
    const behavior = reducedMotion() ? 'auto' : 'smooth';
    el.scrollIntoView({ block: target === 'top' ? 'start' : 'center', behavior });
    const done = () => {
      document.dispatchEvent(new CustomEvent('entry:active', { detail: target === 'top' ? null : target }));
      resolve();
    };
    if (behavior === 'auto') return done();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      done();
    };
    window.addEventListener('scrollend', finish, { once: true });
    setTimeout(finish, 1200);
  });

let flight: Flight = scrollFallback;

export const flyTo = (target: FlyTarget) => flight(target);

/** Called by the scene once it can fly the camera. */
export function provideFlight(fn: Flight): void {
  flight = fn;
}

/** Highlight these entries and fade the rest (null clears the filter). */
export function setFilter(ids: string[] | null): void {
  document.dispatchEvent(new CustomEvent('search:filter', { detail: ids }));
}
