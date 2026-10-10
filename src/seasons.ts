/**
 * Seasons, shared by the UI (the switcher) and the scene. By default the forest shows the season
 * it is in Finland today; a visitor can pick another for the rest of their visit.
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

const KEY = 'season';

/**
 * The season in Finland now (Helsinki time), roughly following the thermal seasons in the south
 * and east: snow from November to March, spring in April–May, summer June–August, autumn
 * September–October.
 */
export function seasonInFinland(date = new Date()): Season {
  const month = Number(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Helsinki', month: 'numeric' }).format(date));
  if (month >= 4 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 10) return 'autumn';
  return 'winter';
}

/** The visitor's pick for this visit, if any, else today's season. */
export function initialSeason(): Season {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved && (SEASONS as string[]).includes(saved)) return saved as Season;
  } catch {
    // Storage blocked: fall through to today's season.
  }
  return seasonInFinland();
}

export function chooseSeason(season: Season): void {
  try {
    sessionStorage.setItem(KEY, season);
  } catch {
    // Storage blocked: the choice still applies until the page is reloaded.
  }
  document.dispatchEvent(new CustomEvent<Season>('season:change', { detail: season }));
}
