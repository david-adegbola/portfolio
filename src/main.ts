import '@fontsource-variable/inter-tight';
import '@fontsource-variable/fraunces';
import './globals.css'; // also brings in styles.css, in the components layer
import { flyTo } from './nav.ts';
import { initSectionNav } from './ui/SectionNav.ts';

// The page is already fully rendered HTML (and dressed in today's season by the head script in
// index.html); this only wires up the section nav and the detail panel.

const whenIdle = (fn: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);
const afterLoad = (fn: () => void) =>
  document.readyState === 'complete' ? whenIdle(fn) : window.addEventListener('load', () => whenIdle(fn), { once: true });

// The React island (the detail panel) is its own chunk, fetched when the page is idle or as soon
// as it's needed, so React and Radix never delay the first paint.
let islands: Promise<typeof import('./islands/index.tsx')> | null = null;
const loadIslands = () =>
  (islands ??= import('./islands/index.tsx').then((m) => {
    m.mountPanel();
    return m;
  }));

// Until the panel is listening (it fires `panel:ready`), a card click records the project in the
// URL and loads it; the panel opens on #p/<id> when it mounts. After that it handles clicks itself.
let panelReady = false;
document.addEventListener('panel:ready', () => (panelReady = true), { once: true });
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-open]');
  if (panelReady || !link || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  if (location.hash !== `#p/${link.dataset.open}`) history.pushState(null, '', `#p/${link.dataset.open}`);
  loadIslands();
});
if (location.hash.startsWith('#p/')) loadIslands();
afterLoad(loadIslands);

// Links marked data-fly glide to a section instead of jumping, then land keyboard focus on its
// heading. The URL takes the section's anchor, so it can be shared. Without JS they're plain anchors.
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-fly]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  const id = link.dataset.fly!;
  const target = document.getElementById(id);
  if (!target) return;
  history.replaceState(null, '', `#${id}`);
  flyTo(id).then(() => target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true }));
});
initSectionNav();
