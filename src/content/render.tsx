// Build-time HTML rendering: the React page (src/components/Page.tsx) rendered to markup, one
// string per placeholder in index.html. The only island (the detail panel, src/islands/) mounts
// into an empty #panel-root, so everything here is static markup.
import { renderToStaticMarkup } from 'react-dom/server';
import { Footer, Head, Header, Main, type RenderOptions, sortEntries, Templates } from '../components/Page.tsx';
import { type Entry, type Site, isResearch } from './types.ts';

export { type RenderOptions, sortEntries };

export const renderHead = (site: Site) => renderToStaticMarkup(<Head site={site} />);
export const renderHeader = (site: Site, entries: Entry[], opts: RenderOptions) =>
  renderToStaticMarkup(<Header site={site} entries={entries} opts={opts} />);
export const renderMain = (site: Site, entries: Entry[], opts: RenderOptions) =>
  renderToStaticMarkup(<Main site={site} entries={entries} opts={opts} />);
export const renderTemplates = (entries: Entry[], opts: RenderOptions) =>
  renderToStaticMarkup(<Templates entries={entries} opts={opts} />);

/** Footer, then the panel's mount point and the search announcer: last in the page. */
export const renderFooter = (site: Site, built = new Date()) =>
  renderToStaticMarkup(<Footer site={site} built={built} />) +
  `<div id="panel-root"></div>` +
  `<p class="visually-hidden" role="status" id="search-announce"></p>`;

/** Minimal entry data for the client (search). Same order as the page. */
export function renderEntriesData(all: Entry[]): string {
  const data = sortEntries(all).map((e) => ({
    id: e.id,
    zone: e.zone,
    type: e.type ?? 'project',
    title: e.title,
    lang: e.lang,
    subtitle: isResearch(e) ? e.context : e.subtitle,
    tags: e.tags ?? [],
    status: e.status,
  }));
  return `<script type="application/json" id="entries-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
