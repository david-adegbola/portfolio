import '@fontsource-variable/inter-tight';
import '@fontsource/fraunces/latin-400.css';
import '@fontsource/fraunces/latin-ext-400.css';
import './styles.css';
import { initHeader } from './ui/Header';
import { initProjectPanel } from './ui/ProjectPanel';

// The page is already fully rendered HTML. Wire up the UI first; the 3D scene boots after this (step 2).
initHeader();
initProjectPanel();
