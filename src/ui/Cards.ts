/**
 * Marks the card whose object the camera has reached (the scene announces it with an
 * `entry:active` event). The scroll fade-in is pure CSS (see `.card` in styles.css).
 */
export function initCards(): void {
  let current: HTMLElement | null = null;
  document.addEventListener('entry:active', (event) => {
    const id = (event as CustomEvent<string | null>).detail;
    current?.classList.remove('is-active');
    current = id ? document.getElementById(id) : null;
    current?.classList.add('is-active');
  });
}
