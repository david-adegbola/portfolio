// Build-time HTML rendering: the React page (src/components/Page.tsx) rendered to static markup,
// one string per placeholder in index.html.
import { renderToStaticMarkup } from 'react-dom/server';
import { Footer, Head, Header, Main, type RenderOptions, sortEntries, Templates } from '../components/Page.tsx';
import { type Entry, type Site, isResearch } from './types.ts';

export { type RenderOptions, sortEntries };

export const renderHead = (site: Site) => renderToStaticMarkup(<Head site={site} />);
export const renderHeader = (site: Site, opts: RenderOptions) => renderToStaticMarkup(<Header site={site} opts={opts} />);
export const renderMain = (site: Site, entries: Entry[], opts: RenderOptions) =>
  renderToStaticMarkup(<Main site={site} entries={entries} opts={opts} />);
export const renderFooter = (site: Site) => renderToStaticMarkup(<Footer site={site} year={new Date().getFullYear()} />);
export const renderTemplates = (entries: Entry[], opts: RenderOptions) =>
  renderToStaticMarkup(<Templates entries={entries} opts={opts} />);

/** Minimal entry data for the client (scene and search). Same order as the page. */
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
    sceneObject: e.sceneObject,
  }));
  return `<script type="application/json" id="entries-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
