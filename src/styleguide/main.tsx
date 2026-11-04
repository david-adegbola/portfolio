import '@fontsource-variable/inter-tight';
import '@fontsource-variable/fraunces';
import '../globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Styleguide } from './Styleguide.tsx';

createRoot(document.getElementById('styleguide')!).render(
  <StrictMode>
    <Styleguide />
  </StrictMode>,
);
