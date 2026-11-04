// Inline SVG icons used by the page. Line icons, 1.6 stroke, inherit the text colour.

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

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

/** "Opens in a new tab", for external links. */
export const IconExternal = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className="icon-external">
    <path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" {...line} />
  </svg>
);
