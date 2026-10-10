export type ThemeName = 'light' | 'dark';

export interface Palette {
  fog: string;
  fogDensity: number;
  ground: string;
  lake: string;
  pineCrown: string;
  pineTrunk: string;
  birchCrown: string;
  birchTrunk: string;
  sky: string;
  skyGround: string;
  hemi: number;
  sun: number;
}

// Near-monochrome on purpose: colour is reserved for "found" things (accent, step 3+).
export const palettes: Record<ThemeName, Palette> = {
  light: {
    fog: '#EEF0EE',
    fogDensity: 0.034,
    ground: '#D5DAD5',
    lake: '#DCE1E2',
    pineCrown: '#7E8A84',
    pineTrunk: '#837C75',
    birchCrown: '#A2AC9D',
    birchTrunk: '#D8D5CD',
    sky: '#FFFFFF',
    skyGround: '#A8ADA8',
    hemi: 1.1,
    sun: 0.7,
  },
  dark: {
    fog: '#14171A',
    fogDensity: 0.036,
    ground: '#1D2124',
    lake: '#1A1E21',
    pineCrown: '#2F3734',
    pineTrunk: '#2C2926',
    birchCrown: '#3B433C',
    birchTrunk: '#77766F',
    sky: '#B8C4CC',
    skyGround: '#202426',
    hemi: 0.9,
    sun: 0.4,
  },
};

export function currentTheme(): ThemeName {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Calls back whenever the effective theme changes (manual toggle or system setting). */
export function onThemeChange(callback: (theme: ThemeName) => void): void {
  let last = currentTheme();
  const check = () => {
    const now = currentTheme();
    if (now !== last) callback((last = now));
  };
  new MutationObserver(check).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', check);
}
