/**
 * Marks the card a search or link just went to (`entry:active`, from nav.ts), and dims cards that
 * don't match an active search (`search:filter`). The scroll fade-in is pure CSS (see `.card` in
 * styles.css).
 */
export function initCards(): void {
  document.addEventListener('search:filter', (event) => {
    const ids = (event as CustomEvent<string[] | null>).detail;
    const keep = ids ? new Set(ids) : null;
    document.querySelectorAll<HTMLElement>('.card[id]').forEach((card) => {
      card.classList.toggle('is-dimmed', !!keep && !keep.has(card.id));
    });
  });

  let current: HTMLElement | null = null;
  document.addEventListener('entry:active', (event) => {
    const id = (event as CustomEvent<string | null>).detail;
    current?.classList.remove('is-active');
    current = id ? document.getElementById(id) : null;
    if (current?.classList.contains('card')) current.classList.add('is-active');
    else current = null;
  });
}
