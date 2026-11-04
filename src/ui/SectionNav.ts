/**
 * Marks the section in view in the section nav (aria-current="location"), so visitors always know
 * where they are (Primer navigation; flows/section-nav.md). A section counts as "in view" when it
 * crosses a band a little above the middle of the screen.
 */
export function initSectionNav(): void {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[data-section-link]')];
  const ids = [...new Set(links.map((a) => a.dataset.sectionLink!))];
  const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const visible = new Set<string>();
  const mark = () => {
    // The first section (in page order) inside the band wins.
    const current = ids.find((id) => visible.has(id)) ?? null;
    for (const a of links) {
      if (a.dataset.sectionLink === current) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  };
  const observer = new IntersectionObserver(
    (records) => {
      for (const r of records) {
        if (r.isIntersecting) visible.add(r.target.id);
        else visible.delete(r.target.id);
      }
      mark();
    },
    { rootMargin: '-35% 0px -55% 0px' },
  );
  sections.forEach((s) => observer.observe(s));
}
