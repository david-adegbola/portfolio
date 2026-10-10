import '@fontsource-variable/inter-tight';
import '@fontsource/fraunces/latin-400.css';
import '@fontsource/fraunces/latin-ext-400.css';
import './styles.css';
import { readEntries } from './content/entries.ts';
import { initCards } from './ui/Cards.ts';
import { initHeader } from './ui/Header.ts';
import { initProjectPanel } from './ui/ProjectPanel.ts';
import { initSearch } from './ui/Search.ts';

// The page is already fully rendered HTML. Wire up the UI first, so it works before, without, or
// if the scene fails; then load the scene as a separate chunk once the page is idle.
initHeader();
initProjectPanel();
initCards();
initSearch();

/**
 * Only load the forest where it will run well: WebGL2 on real hardware (software-rendered GL would
 * crawl), and not when the visitor has asked to save data. Otherwise the page is the plain list.
 */
function sceneWanted(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

if (sceneWanted()) {
  const boot = () =>
    import('./scene/index.ts')
      .then(({ bootScene }) => bootScene(readEntries()))
      .catch((err) => console.warn('3D scene unavailable; the page works without it.', err));
  const whenIdle = (fn: () => void) =>
    'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);
  if (document.readyState === 'complete') whenIdle(boot);
  else window.addEventListener('load', () => whenIdle(boot), { once: true });
}
