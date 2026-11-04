import { chooseSeason, initialSeason, type Season, seasonInFinland } from '../seasons.ts';

/**
 * What the forest shows in each season, in plain words. The canvas itself is decorative, so this
 * caption is its text: shown beside the switcher and announced when the season changes.
 */
const CAPTIONS: Record<Season, [fi: string, text: string]> = {
  spring: ['Kevät', 'Birches in first leaf, wood anemones beneath them.'],
  summer: ['Kesä', 'Full leaf, fireweed in the clearings, harebells by the path.'],
  autumn: ['Ruska', 'Birches gone gold, bilberry turning red, heather in flower.'],
  winter: ['Talvi', 'Snow on the spruces, bare birches, a frozen lake.'],
};

/**
 * The season switcher. It starts on the season it is in Finland today (marked with a dot) and lets
 * a visitor see the forest in any other season for the rest of their visit. It's only shown while
 * the forest is (see `.seasons` in styles.css).
 */
export function initSeasons(): void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('.season')];
  if (!buttons.length) return;
  const today = seasonInFinland();
  const caption = document.getElementById('season-caption');
  const press = (season: Season) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.season === season)));
    if (!caption) return;
    const [fi, text] = CAPTIONS[season];
    caption.innerHTML = `<strong lang="fi">${fi}.</strong> ${text}`;
  };

  for (const b of buttons) {
    if (b.dataset.season === today) b.querySelector<HTMLElement>('.season-now')!.hidden = false;
    b.addEventListener('click', () => {
      const season = b.dataset.season as Season;
      press(season);
      chooseSeason(season);
    });
  }
  press(initialSeason());
}
