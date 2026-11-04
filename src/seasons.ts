/**
 * The season the page is dressed in: always today's season in Finland (Helsinki time), roughly
 * following the thermal seasons in the south and east: snow from November to March, spring in
 * April–May, summer June–August, autumn September–October.
 *
 * It's applied before first paint by the head script in index.html (`data-season` on <html>),
 * which repeats `seasonForMonth`; test/seasons.test.ts checks the two agree. The build writes the
 * build day's season into the HTML, so the page is dressed even without JavaScript.
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: Season[] = ['winter', 'spring', 'summer', 'autumn'];

/** Month 1–12 → season. */
export function seasonForMonth(month: number): Season {
  if (month >= 4 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 10) return 'autumn';
  return 'winter';
}

export function seasonInFinland(date = new Date()): Season {
  const month = Number(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Helsinki', month: 'numeric' }).format(date));
  return seasonForMonth(month);
}

/** The season's name in English and Finnish, for the footer. */
export const SEASON_NAMES: Record<Season, [en: string, fi: string]> = {
  winter: ['Winter', 'talvi'],
  spring: ['Spring', 'kevät'],
  summer: ['Summer', 'kesä'],
  autumn: ['Autumn', 'syksy'],
};
