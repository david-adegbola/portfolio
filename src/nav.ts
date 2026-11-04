/**
 * Glide to a section (or `top`): it lines up under the header (scroll-padding). Smooth unless the
 * visitor prefers reduced motion. Resolves once, when the scroll ends (or after 1.2 s).
 */
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const flyTo = (target: string): Promise<void> =>
  new Promise((resolve) => {
    const el = target === 'top' ? document.body : document.getElementById(target);
    if (!el) return resolve();
    const behavior = reducedMotion() ? 'auto' : 'smooth';
    el.scrollIntoView({ block: 'start', behavior });
    if (behavior === 'auto') return resolve();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      resolve();
    };
    window.addEventListener('scrollend', finish, { once: true });
    setTimeout(finish, 1200);
  });
