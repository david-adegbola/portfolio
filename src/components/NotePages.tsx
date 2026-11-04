// Standalone pages for notes: /notes/<slug>/ for each note and /notes/ for the list. Rendered at
// build time into their own HTML files (vite.config.ts); no JavaScript, same stylesheet.
import { Marked } from 'marked';
import type { Note, Site } from '../content/types.ts';
import { Footer, formatDate, Header, NoteList, type RenderOptions } from './Page.tsx';
import { Rings } from './patterns/Rings.tsx';
import { buttonVariants } from './ui/button.tsx';

const marked = new Marked({ async: false });

interface PageProps {
  site: Site;
  opts: RenderOptions;
  /** Build time, for the footer's "Updated" line. */
  built: Date;
}

function Shell({ site, opts, built, title, description, path, children }: PageProps & { title: string; description: string; path: string; children: React.ReactNode }) {
  return (
    <html lang="en" data-season="summer">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${site.url}${path}`} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#F3F1EA" />
        {/* Replaced at build time with the site's stylesheet and the season script. */}
        <meta name="x-page-assets" content="" />
      </head>
      <body id="top">
        <a className="skip-link" href="#note">
          Skip to the note
        </a>
        <Header site={site} sections={[]} opts={opts} home="/" />
        <main className="page page--note" id="note" tabIndex={-1}>
          {children}
        </main>
        <Footer site={site} built={built} />
      </body>
    </html>
  );
}

export function NotePage({ site, note, opts, built }: PageProps & { note: Note }) {
  return (
    <Shell site={site} opts={opts} built={built} title={`${note.title} · ${site.name}`} description={note.summary ?? site.description} path={`notes/${note.slug}/`}>
      <article className="note">
        <p className="note-back">
          <a href="/notes/">Notes</a>
        </p>
        <h1 className="note-heading">{note.title}</h1>
        <p className="note-date">
          <time dateTime={note.date}>{formatDate(note.date)}</time>
        </p>
        <div className="prose note-body" dangerouslySetInnerHTML={{ __html: marked.parse(note.body) as string }} />
        <p className="note-contact">
          <a className={buttonVariants({ size: 'lg' })} href={`mailto:${site.email}`}>
            Email me
          </a>
          <a className={buttonVariants({ variant: 'outline', size: 'lg' })} href="/">
            Back to the portfolio
          </a>
        </p>
      </article>
    </Shell>
  );
}

export function NotesIndex({ site, notes, opts, built }: PageProps & { notes: Note[] }) {
  return (
    <Shell site={site} opts={opts} built={built} title={`Notes · ${site.name}`} description={`Notes by ${site.name}`} path="notes/">
      <section className="section section--first" aria-labelledby="notes-h">
        <div className="section-head">
          <Rings count={4} seed={37} className="rings--mark" />
          <h1 className="section-title" id="notes-h">
            Notes
          </h1>
        </div>
        <NoteList notes={notes} />
      </section>
    </Shell>
  );
}
