// Section navigation (flows/section-nav.md). Primer UnderlineNav look: muted links, the section in
// view marked with aria-current="location" and a spruce underline (ui/SectionNav.ts sets it).
// Links glide to their section (data-fly); without JS they're plain anchors.
import { cn } from '../../lib/utils.ts';

export interface SectionLink {
  id: string;
  label: string;
}

/**
 * Rendered twice: in the header (tablet and up) and in the hero (phones), never both visible, so
 * only one is in the accessibility tree at a time. Each gets its own label anyway.
 */
export function SectionNav(p: { sections: SectionLink[]; className?: string; label?: string }) {
  const { sections, className, label = 'Sections' } = p;
  if (!sections.length) return null;
  return (
    <nav className={cn('section-nav', className)} aria-label={label}>
      <ul role="list">
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} data-fly={s.id} data-section-link={s.id}>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
