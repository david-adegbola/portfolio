import '@fontsource-variable/inter-tight';
import '@fontsource-variable/fraunces';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './globals.css'; // also brings in styles.css, in the components layer
import { readEntries } from './content/entries.ts';
import { flyTo } from './nav.ts';
import { initCards } from './ui/Cards.ts';
import { initHeader } from './ui/Header.ts';
import { initSearch } from './ui/Search.ts';

// The page is already fully rendered HTML. Wire up the UI first, so it works before, without, or
// if the scene fails; then load the scene as a separate chunk once the page is idle.
initHeader();
initCards();
initSearch();

const whenIdle = (fn: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);
const afterLoad = (fn: () => void) =>
  document.readyState === 'complete' ? whenIdle(fn) : window.addEventListener('load', () => whenIdle(fn), { once: true });

// React islands (detail panel, season switcher) are their own chunk, fetched when the page is idle
// or as soon as they're needed, so React and Radix never delay the first paint.
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

// Links marked data-fly travel to an entry (camera and page together) instead of jumping, then
// land keyboard focus on it. Without JS they're plain anchors.
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-fly]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  const id = link.dataset.fly!;
  flyTo(id).then(() => document.querySelector<HTMLElement>(`[id="${id}"] .card-link`)?.focus({ preventScroll: true }));
});

/**
 * Only load the forest where it can run: WebGL2 present and the visitor not saving data. The
 * renderer itself then refuses software-only GL (see scene/World.ts), leaving the plain list.
 */
function sceneWanted(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !connection?.saveData && 'WebGL2RenderingContext' in window;
}

if (sceneWanted()) {
  const boot = () =>
    import('./scene/index.ts')
      .then(({ bootScene }) => bootScene(readEntries()))
      // The season switcher only shows with the forest, so it's mounted once the forest is up.
      .then(async (ok) => {
        if (ok) (await loadIslands()).mountSeasons();
      })
      .catch((err) => {
        // Whatever went wrong, leave the plain page, not a half-built scene.
        document.querySelector('canvas.scene')?.remove();
        console.warn('3D scene unavailable; the page works without it.', err);
      });
  afterLoad(boot);
}
