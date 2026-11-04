// Build-time HTML rendering: the React page (src/components/Page.tsx) rendered to markup, one
// string per placeholder in index.html. Static parts use renderToStaticMarkup; islands that the
// client hydrates (src/islands/) use renderToString, so React can pick them up without re-rendering.
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { Footer, Head, Header, Main, type RenderOptions, sortEntries, Templates } from '../components/Page.tsx';
import { SeasonSwitcher } from '../islands/Seasons.tsx';
import { type Entry, type Site, isResearch } from './types.ts';

export { type RenderOptions, sortEntries };

export const renderHead = (site: Site) => renderToStaticMarkup(<Head site={site} />);
export const renderHeader = (site: Site, opts: RenderOptions) => renderToStaticMarkup(<Header site={site} opts={opts} />);
export const renderMain = (site: Site, entries: Entry[], opts: RenderOptions) =>
  renderToStaticMarkup(<Main site={site} entries={entries} opts={opts} />);
export const renderTemplates = (entries: Entry[], opts: RenderOptions) =>
  renderToStaticMarkup(<Templates entries={entries} opts={opts} />);

/**
 * Footer, then the season switcher (an island), the panel's mount point and the search announcer:
 * last in the page, after the content they relate to.
 */
export const renderFooter = (site: Site) =>
  renderToStaticMarkup(<Footer site={site} year={new Date().getFullYear()} />) +
  `<div class="seasons" id="seasons">${renderToString(<SeasonSwitcher />)}</div>` +
  `<div id="panel-root"></div>` +
  `<p class="visually-hidden" role="status" id="search-announce"></p>`;

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
