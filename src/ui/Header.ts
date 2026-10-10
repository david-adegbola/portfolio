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
    // Snap, don't smear: switch with transitions off, then restore them on the next frame.
    const freeze = document.createElement('style');
    freeze.textContent = '*,*::before,*::after{transition:none !important}';
    document.head.append(freeze);
    root.dataset.theme = next;
    void getComputedStyle(document.body).opacity;
    requestAnimationFrame(() => freeze.remove());
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
