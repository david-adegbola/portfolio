import '@fontsource-variable/inter-tight';
import '@fontsource-variable/fraunces';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '../globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Styleguide } from './Styleguide.tsx';

createRoot(document.getElementById('styleguide')!).render(
  <StrictMode>
    <Styleguide />
  </StrictMode>,
);
