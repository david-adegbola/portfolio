// The React island, loaded on demand by main.ts (React + Radix stay off the critical path).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectPanel } from './ProjectPanel.tsx';

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
