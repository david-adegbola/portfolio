// Inline SVG icons used by the page. Line icons, 1.6 stroke, inherit the text colour.
import type { ObjectKind } from '../content/objects.ts';

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const IconMoon = () => (
  <svg className="icon-moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export const IconSun = () => (
  <svg className="icon-sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

export const IconSearch = () => (
  <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const IconDown = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 5v14M6 13l6 6 6-6" {...line} />
  </svg>
);

export const IconPrev = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M14.5 6l-6 6 6 6" {...line} />
  </svg>
);

export const IconNext = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M9.5 6l6 6-6 6" {...line} />
  </svg>
);

export const IconClose = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * Line drawings of the forest objects, one per card: the same object the visitor walks up to in
 * the scene. Grey until found, gold after (see ui/Cards.ts).
 */
const GLYPHS: Record<ObjectKind, React.ReactNode> = {
  marker: (
    <>
      <path d="M12 21V5" />
      <path d="M10 4.5h4v4.5h-4z" />
      <path d="M8 21c.6-1.3 1.6-2 2.6-2M16 21c-.5-1.1-1.3-1.7-2.1-1.8" />
    </>
  ),
  'log-pile': (
    <>
      <circle cx="7.5" cy="16" r="3.5" />
      <circle cx="16.5" cy="16" r="3.5" />
      <circle cx="12" cy="8.5" r="3.5" />
      <circle cx="12" cy="8.5" r="1" />
    </>
  ),
  log: (
    <>
      <path d="M4.5 10.5h12" />
      <path d="M4.5 14.5h12" />
      <path d="M4.5 10.5a2 2 0 0 0 0 4" />
      <ellipse cx="16.5" cy="12.5" rx="2" ry="2" />
      <path d="M3 19c1.5 0 1.5-.8 3-.8s1.5.8 3 .8 1.5-.8 3-.8 1.5.8 3 .8 1.5-.8 3-.8 1.5.8 3 .8" />
    </>
  ),
  clearing: (
    <>
      <path d="M12 17V8" />
      <path d="M10.6 7.5h2.8v3h-2.8z" />
      <circle cx="5" cy="15" r="1.6" />
      <circle cx="19" cy="15" r="1.6" />
      <circle cx="7.5" cy="19.5" r="1.6" />
      <circle cx="16.5" cy="19.5" r="1.6" />
    </>
  ),
  'tree-ring': (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="5.2" />
      <circle cx="12" cy="12" r="2.4" />
    </>
  ),
  lamp: (
    <>
      <path d="M8 21V4h5" />
      <path d="M13 4v3" />
      <path d="M11.5 7h3v4h-3z" />
    </>
  ),
};

export const Glyph = ({ kind }: { kind: ObjectKind }) => (
  <svg
    className="card-glyph"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {GLYPHS[kind]}
  </svg>
);
