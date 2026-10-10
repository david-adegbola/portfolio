import { Color } from 'three';
import type { Season } from '../seasons.ts';

export type ThemeName = 'light' | 'dark';
export type FlowerKind = 'anemone' | 'coltsfoot' | 'lily' | 'buttercup' | 'harebell' | 'fireweed' | 'heather';
export const FLOWER_KINDS: FlowerKind[] = ['anemone', 'coltsfoot', 'lily', 'buttercup', 'harebell', 'fireweed', 'heather'];

/** Hex colours and numbers that fully describe how the forest looks in one season and theme. */
export interface Look {
  skyTop: string;
  /** Horizon and fog colour. */
  horizon: string;
  fogDensity: number;
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  sunColor: string;
  sun: number;
  /** Forest floor: moss (A) and heath / needle litter (B). */
  groundA: string;
  groundB: string;
  lake: string;
  pineTrunkLow: string;
  pineTrunkHigh: string;
  pineCrownA: string;
  pineCrownB: string;
  spruceTrunk: string;
  spruceCrownA: string;
  spruceCrownB: string;
  birchBark: string;
  birchMark: string;
  birchCrownA: string;
  birchCrownB: string;
  /** 0 = bare branches, 1 = full crown. */
  birchLeaves: number;
  shrubA: string;
  shrubB: string;
  shrubs: number;
  grassA: string;
  grassB: string;
  grass: number;
  rockA: string;
  rockB: string;
  stem: string;
  /** How open each wildflower is (0 = not there this season). */
  flowers: Record<FlowerKind, number>;
  petals: Record<FlowerKind, string>;
  shadow: string;
  shadowOpacity: number;
  // Project objects.
  wood: string;
  grain: string;
  stone: string;
  /** Unfound paint (marker bands, log ends). Found paint is always the accent. */
  paint: string;
  faintObject: string;
}

const PETALS: Record<FlowerKind, string> = {
  anemone: '#F4F1E8', // valkovuokko
  coltsfoot: '#E9C23A', // leskenlehti
  lily: '#FBFAF4', // kielo
  buttercup: '#EDC93B', // niittyleinikki
  harebell: '#7F86D6', // kissankello
  fireweed: '#C8559A', // maitohorsma
  heather: '#A06AA4', // kanerva
};

const OBJECTS = {
  wood: '#8B6E55',
  grain: '#D8C29E',
  stone: '#8E928C',
  paint: '#C9C6BC',
  faintObject: '#B9BDB4',
};

const none: Record<FlowerKind, number> = {
  anemone: 0,
  coltsfoot: 0,
  lily: 0,
  buttercup: 0,
  harebell: 0,
  fireweed: 0,
  heather: 0,
};

/** Daylight looks, one per season. Natural, slightly muted colours, never neon. */
const DAY: Record<Season, Look> = {
  spring: {
    skyTop: '#9FC0DC',
    horizon: '#E3EAE4',
    fogDensity: 0.018,
    hemiSky: '#EEF4F6',
    hemiGround: '#6E7F4C',
    hemi: 0.85,
    sunColor: '#FFF4E2',
    sun: 1.05,
    groundA: '#6B8A45',
    groundB: '#8C7C58',
    lake: '#6E8C93',
    pineTrunkLow: '#6B5B4E',
    pineTrunkHigh: '#B0754B',
    pineCrownA: '#3F5E37',
    pineCrownB: '#55743F',
    spruceTrunk: '#5B4A3E',
    spruceCrownA: '#2E4A32',
    spruceCrownB: '#45653F',
    birchBark: '#EEEBE3',
    birchMark: '#3A3632',
    birchCrownA: '#A3C568',
    birchCrownB: '#C0D684',
    birchLeaves: 0.75,
    shrubA: '#6F9A48',
    shrubB: '#8EB25B',
    shrubs: 0.8,
    grassA: '#7DA750',
    grassB: '#A8C66C',
    grass: 0.7,
    rockA: '#8A8E88',
    rockB: '#6D8A4A',
    stem: '#6E9A45',
    flowers: { ...none, anemone: 1, coltsfoot: 1, lily: 0.35 },
    petals: PETALS,
    shadow: '#2C3A24',
    shadowOpacity: 0.32,
    ...OBJECTS,
  },
  summer: {
    skyTop: '#8DB3D6',
    horizon: '#DCE5E2',
    fogDensity: 0.016,
    hemiSky: '#EDF3F4',
    hemiGround: '#5A6F3E',
    hemi: 0.85,
    sunColor: '#FFF0D6',
    sun: 1.15,
    groundA: '#55733E',
    groundB: '#7B6F4A',
    lake: '#4F6C72',
    pineTrunkLow: '#695848',
    pineTrunkHigh: '#B27448',
    pineCrownA: '#3A5733',
    pineCrownB: '#4E6C3A',
    spruceTrunk: '#584739',
    spruceCrownA: '#2A452E',
    spruceCrownB: '#3B5A37',
    birchBark: '#EEEBE3',
    birchMark: '#3A3632',
    birchCrownA: '#5F8E3B',
    birchCrownB: '#82A64C',
    birchLeaves: 1,
    shrubA: '#4D7A39',
    shrubB: '#6A8E3E',
    shrubs: 1,
    grassA: '#6C9446',
    grassB: '#9BB45C',
    grass: 1,
    rockA: '#8A8E88',
    rockB: '#5E7B44',
    stem: '#4E7A35',
    flowers: { ...none, lily: 0.8, buttercup: 1, harebell: 1, fireweed: 1, heather: 0.3 },
    petals: PETALS,
    shadow: '#24321E',
    shadowOpacity: 0.36,
    ...OBJECTS,
  },
  autumn: {
    skyTop: '#A6B6C3',
    horizon: '#E3DED1',
    fogDensity: 0.022,
    hemiSky: '#F1EDE4',
    hemiGround: '#6E5E3A',
    hemi: 0.85,
    sunColor: '#FFD9A4',
    sun: 1.05,
    groundA: '#5B6B39',
    groundB: '#86704A',
    lake: '#5B6E72',
    pineTrunkLow: '#695848',
    pineTrunkHigh: '#AA6E45',
    pineCrownA: '#3B5634',
    pineCrownB: '#4C6638',
    spruceTrunk: '#584739',
    spruceCrownA: '#2B442F',
    spruceCrownB: '#3A5636',
    birchBark: '#EEEBE3',
    birchMark: '#3A3632',
    birchCrownA: '#E0AC3C',
    birchCrownB: '#C8742E',
    birchLeaves: 0.9,
    // Bilberry turns red in autumn; lingonberry stays green.
    shrubA: '#A2432C',
    shrubB: '#6E7A3A',
    shrubs: 1,
    grassA: '#A99A5A',
    grassB: '#C4A65E',
    grass: 0.9,
    rockA: '#8A8E88',
    rockB: '#667546',
    stem: '#7D7A3C',
    flowers: { ...none, heather: 1, harebell: 0.3 },
    petals: PETALS,
    shadow: '#33291C',
    shadowOpacity: 0.34,
    ...OBJECTS,
  },
  winter: {
    skyTop: '#B4C4D4',
    horizon: '#E9EDF1',
    fogDensity: 0.02,
    hemiSky: '#F2F6FA',
    hemiGround: '#C9D3DC',
    hemi: 0.95,
    sunColor: '#EEF2FA',
    sun: 0.75,
    groundA: '#EFF3F6',
    groundB: '#DCE4EC',
    // Frozen and snow-covered.
    lake: '#E3EAF0',
    pineTrunkLow: '#5E5246',
    pineTrunkHigh: '#9C6A47',
    pineCrownA: '#3C5640',
    pineCrownB: '#DCE4E8',
    spruceTrunk: '#53453A',
    spruceCrownA: '#2E4733',
    spruceCrownB: '#D5DEE3',
    birchBark: '#E8E6E0',
    birchMark: '#3A3632',
    birchCrownA: '#8A7A5A',
    birchCrownB: '#8A7A5A',
    birchLeaves: 0,
    shrubA: '#6E7A55',
    shrubB: '#6E7A55',
    shrubs: 0,
    grassA: '#B2A878',
    grassB: '#B2A878',
    grass: 0,
    rockA: '#8F949A',
    rockB: '#EEF2F5',
    stem: '#6E7A55',
    flowers: { ...none },
    petals: PETALS,
    shadow: '#5E7290',
    shadowOpacity: 0.28,
    ...OBJECTS,
  },
};

// Polar night: the same season under a dark sky. Derived, so every season has a night version.
const NIGHT = new Color('#10151B');
const MOON = '#A9BCD9';
const dim = (hex: string, amount: number) => `#${new Color(hex).lerp(NIGHT, amount).getHexString()}`;

function night(day: Look): Look {
  const out = { ...day } as Look;
  for (const [key, value] of Object.entries(day)) {
    if (typeof value === 'string') (out as unknown as Record<string, string>)[key] = dim(value, 0.7);
  }
  // Snow and pale bark keep a little moonlit glow.
  for (const key of ['groundA', 'groundB', 'lake', 'birchBark', 'pineCrownB', 'spruceCrownB', 'rockB'] as const) {
    const lum = new Color(day[key]).getHSL({ h: 0, s: 0, l: 0 }).l;
    if (lum > 0.8) out[key] = dim(day[key], 0.6);
  }
  // Open water mirrors the dark sky; only snow-covered ice keeps its glow.
  if (new Color(day.lake).getHSL({ h: 0, s: 0, l: 0 }).l < 0.8) out.lake = dim(day.lake, 0.84);
  out.petals = Object.fromEntries(Object.entries(day.petals).map(([k, v]) => [k, dim(v, 0.66)])) as Record<FlowerKind, string>;
  out.skyTop = '#1A2230';
  out.horizon = '#14171A';
  out.hemiSky = '#5C6B80';
  out.hemiGround = '#14181C';
  out.hemi = 0.85;
  out.sunColor = MOON;
  out.sun = 0.45;
  out.shadow = '#05080B';
  out.shadowOpacity = day.shadowOpacity * 0.8;
  out.fogDensity = day.fogDensity * 1.35;
  return out;
}

const looks: Record<ThemeName, Record<Season, Look>> = {
  light: DAY,
  dark: {
    spring: night(DAY.spring),
    summer: night(DAY.summer),
    autumn: night(DAY.autumn),
    winter: night(DAY.winter),
  },
};

export const lookFor = (theme: ThemeName, season: Season): Look => looks[theme][season];

/** Blend two looks (for season and theme crossfades). */
export function mixLook(a: Look, b: Look, t: number): Look {
  const c = new Color();
  const mix = (x: string, y: string) => `#${c.set(x).lerp(new Color(y), t).getHexString()}`;
  const num = (x: number, y: number) => x + (y - x) * t;
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(a) as (keyof Look)[]) {
    const x = a[key];
    const y = b[key];
    if (typeof x === 'string') out[key] = mix(x, y as string);
    else if (typeof x === 'number') out[key] = num(x, y as number);
  }
  out.flowers = Object.fromEntries(FLOWER_KINDS.map((k) => [k, num(a.flowers[k], b.flowers[k])]));
  out.petals = Object.fromEntries(FLOWER_KINDS.map((k) => [k, mix(a.petals[k], b.petals[k])]));
  return out as unknown as Look;
}

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
