import { chooseSeason, initialSeason, type Season, seasonInFinland } from '../seasons.ts';

/**
 * The season switcher. It starts on the season it is in Finland today (marked with a dot) and lets
 * a visitor see the forest in any other season for the rest of their visit. It's only shown while
 * the forest is (see `.seasons` in styles.css).
 */
export function initSeasons(): void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('.season')];
  if (!buttons.length) return;
  const today = seasonInFinland();
  const press = (season: Season) =>
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.season === season)));

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
