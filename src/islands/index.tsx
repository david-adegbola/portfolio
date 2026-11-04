// The React islands, loaded on demand by main.ts (React + Radix stay off the critical path).
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { ProjectPanel } from './ProjectPanel.tsx';
import { SeasonSwitcher } from './Seasons.tsx';

let panelMounted = false;
/** The detail panel. No server markup (it's closed until opened), so it's a fresh root; it reads #p/<id> on mount. */
export function mountPanel(): void {
  const root = document.getElementById('panel-root');
  if (!root || panelMounted) return;
  panelMounted = true;
  createRoot(root).render(
    <StrictMode>
      <ProjectPanel />
    </StrictMode>,
  );
}

let seasonsMounted = false;
/** The season switcher, hydrated over its pre-rendered markup once the forest is showing. */
export function mountSeasons(): void {
  const root = document.getElementById('seasons');
  if (!root || seasonsMounted) return;
  seasonsMounted = true;
  hydrateRoot(
    root,
    <StrictMode>
      <SeasonSwitcher />
    </StrictMode>,
  );
}
