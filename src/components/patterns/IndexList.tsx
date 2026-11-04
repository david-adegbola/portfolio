// The work list (flows/browse-work.md): one entry per item, strongest proof first. Each item: the
// title (a link to its panel, with an arrow cue), the date on the right, a one-line subtitle, two
// sentences of summary and the subject tags. An optional cover image sits beside it.
import type { ReactNode } from 'react';
import { type Image, type Subject, SUBJECT_LABEL } from '../../content/types.ts';
import { cn } from '../../lib/utils.ts';
import { IconNext } from '../icons.tsx';
import { Picture } from './Picture.tsx';

export function IndexList({ children, className }: { children: ReactNode; className?: string }) {
  return <ol className={cn('card-list', className)}>{children}</ol>;
}

export function Subjects({ subjects }: { subjects: Subject[] }) {
  return (
    <p className="card-subjects">
      <span className="visually-hidden">Subject: </span>
      {subjects.map((s, i) => (
        <span key={s} className="subject">
          {i > 0 && <span aria-hidden="true"> · </span>}
          {SUBJECT_LABEL[s]}
        </span>
      ))}
    </p>
  );
}

export interface IndexItemProps {
  id: string;
  title: string;
  lang?: string;
  /** When set, the title opens the detail panel for this id. */
  opens?: boolean;
  when?: string;
  subtitle?: ReactNode;
  summary?: ReactNode;
  subjects: Subject[];
  /** Kinds of proof behind the entry ("code", "data"…), shown as one line. */
  proof?: string[];
  cover?: Image;
  missing?: Set<string>;
  className?: string;
}

export function IndexItem(p: IndexItemProps) {
  const cover = p.cover && p.missing ? <Picture img={p.cover} missing={p.missing} sizes="(min-width: 40rem) 10rem, 100vw" className="card-cover" /> : null;
  return (
    <li id={p.id} className={cn('card', cover && 'card--cover', p.className)}>
      <div className="card-body">
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
          {p.when && <span className="card-when">{p.when}</span>}
        </div>
        {p.subtitle && <p className="card-subtitle">{p.subtitle}</p>}
        {p.summary && <p className="card-summary">{p.summary}</p>}
        <div className="card-foot">
          <Subjects subjects={p.subjects} />
          {!!p.proof?.length && (
            <p className="card-proof">
              <span className="card-proof-label">Proof:</span> {p.proof.join(', ')}
            </p>
          )}
        </div>
      </div>
      {cover}
    </li>
  );
}
