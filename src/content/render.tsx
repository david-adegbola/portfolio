// Build-time HTML rendering: the React page (src/components/Page.tsx) rendered to markup, one
// string per placeholder in index.html, plus the standalone note pages. The only island (the
// detail panel, src/islands/) mounts into an empty #panel-root, so everything here is static.
import { renderToStaticMarkup } from 'react-dom/server';
import { NotePage, NotesIndex } from '../components/NotePages.tsx';
import { Footer, Head, Header, Main, type RenderOptions, sectionsFor, Templates } from '../components/Page.tsx';
import type { Content } from './load.ts';
import type { Site } from './types.ts';

export type { RenderOptions };

export const renderHead = (site: Site) => renderToStaticMarkup(<Head site={site} />);
export const renderHeader = (c: Content, opts: RenderOptions) =>
  renderToStaticMarkup(<Header site={c.site} sections={sectionsFor(c.site, c.entries, c.notes)} opts={opts} />);
export const renderMain = (c: Content, opts: RenderOptions) =>
  renderToStaticMarkup(<Main site={c.site} entries={c.entries} now={c.now} notes={c.notes} opts={opts} />);
export const renderTemplates = (c: Content, opts: RenderOptions) => renderToStaticMarkup(<Templates entries={c.entries} opts={opts} />);

/** Footer, then the panel's mount point: last in the page. */
export const renderFooter = (site: Site, built = new Date()) =>
  renderToStaticMarkup(<Footer site={site} built={built} />) + `<div id="panel-root"></div>`;

/** Every note page, keyed by its output path (relative to the site root). */
export function renderNotePages(c: Content, opts: RenderOptions, built = new Date()): Record<string, string> {
  if (!c.notes.length) return {};
  const pages: Record<string, string> = {
    'notes/index.html': '<!doctype html>' + renderToStaticMarkup(<NotesIndex site={c.site} notes={c.notes} opts={opts} built={built} />),
  };
  for (const note of c.notes) {
    pages[`notes/${note.slug}/index.html`] = '<!doctype html>' + renderToStaticMarkup(<NotePage site={c.site} note={note} opts={opts} built={built} />);
  }
  return pages;
}
