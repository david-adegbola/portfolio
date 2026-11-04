/**
 * Moving around the page: the UI asks to go to an entry (an entry id), a section, or `top`, and
 * to filter matches. Entries are centred; sections and the top line up under the header
 * (scroll-padding). Smooth unless the visitor prefers reduced motion. Arriving marks the entry
 * (`entry:active`, see ui/Cards.ts).
 */
export type Target = string;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const flyTo = (target: Target): Promise<void> =>
  new Promise((resolve) => {
    const el = target === 'top' ? document.body : document.getElementById(target);
    if (!el) return resolve();
    const behavior = reducedMotion() ? 'auto' : 'smooth';
    el.scrollIntoView({ block: target === 'top' || el.tagName === 'SECTION' ? 'start' : 'center', behavior });
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      document.dispatchEvent(new CustomEvent('entry:active', { detail: target === 'top' ? null : target }));
      resolve();
    };
    if (behavior === 'auto') return finish();
    window.addEventListener('scrollend', finish, { once: true });
    setTimeout(finish, 1200);
  });

/** Highlight these entries and fade the rest (null clears the filter). */
export function setFilter(ids: string[] | null): void {
  document.dispatchEvent(new CustomEvent('search:filter', { detail: ids }));
}
