type Theme = 'light' | 'dark';

const root = document.documentElement;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

const currentTheme = (): Theme =>
  (root.dataset.theme as Theme | undefined) ?? (systemDark.matches ? 'dark' : 'light');

/** Theme toggle. Default follows the system; a manual choice is remembered. */
export function initHeader(): void {
  const toggle = document.querySelector<HTMLButtonElement>('.theme-toggle');
  if (!toggle) return;

  const sync = () => toggle.setAttribute('aria-pressed', String(currentTheme() === 'dark'));

  toggle.addEventListener('click', () => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage blocked: the choice just lasts for this visit.
    }
    sync();
  });
  systemDark.addEventListener('change', sync);

  sync();
}
