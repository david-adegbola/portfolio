// Numbered index of entries (flows/browse-work.md): the reference sites' numbered lists, as a
// field log. Each item: number + the forest object's glyph in the left column; title (a link when
// the entry has a panel, with an arrow cue), year on the right, subtitle, summary, tags.
// The list is an <ol>, so screen readers hear the position; the visible numbers are decoration.
import type { ReactNode } from 'react';
import type { ObjectKind } from '../../content/objects.ts';
import { cn } from '../../lib/utils.ts';
import { Glyph, IconNext } from '../icons.tsx';
import { Badge } from '../ui/badge.tsx';

export function IndexList({ children, className }: { children: ReactNode; className?: string }) {
  return <ol className={cn('card-list', className)}>{children}</ol>;
}

export interface IndexItemProps {
  id: string;
  index: number;
  kind: ObjectKind;
  title: string;
  lang?: string;
  /** When set, the title opens the detail panel for this id. */
  opens?: boolean;
  year?: number;
  subtitle?: ReactNode;
  summary?: ReactNode;
  tags?: string[];
  inProgress?: boolean;
  small?: boolean;
  className?: string;
  children?: ReactNode;
}

export function IndexItem(p: IndexItemProps) {
  return (
    <li
      id={p.id}
      className={cn('card', p.small && 'card--small', p.inProgress && 'card--in-progress', p.className)}
    >
      <div className="card-marker" aria-hidden="true">
        <span className="card-num">{String(p.index).padStart(2, '0')}</span>
        <Glyph kind={p.kind} />
      </div>
      <div className="card-body">
        {p.inProgress && (
          <p className="badge">
            <Badge variant="attention">In progress</Badge>
          </p>
        )}
        <div className="card-head">
          <h3 className="card-title">
            {p.opens ? (
              <a className="card-link" href={`#p/${p.id}`} data-open={p.id} lang={p.lang}>
                {p.title}
                <IconNext />
              </a>
            ) : (
              <span lang={p.lang}>{p.title}</span>
            )}
          </h3>
          {p.year && <span className="card-year">{p.year}</span>}
        </div>
        {p.subtitle && <p className="card-subtitle">{p.subtitle}</p>}
        {p.summary && <p className="card-summary">{p.summary}</p>}
        {!!p.tags?.length && (
          <p className="card-meta">
            {p.tags.map((t, i) => (
              <span key={t}>
                {i > 0 && <span aria-hidden="true"> · </span>}
                {t}
              </span>
            ))}
          </p>
        )}
        {p.children}
      </div>
    </li>
  );
}
