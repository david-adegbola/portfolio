// Build-time HTML rendering. The whole page is pre-rendered into index.html from content/*.json,
// so every word is in the HTML source before any JavaScript runs (SEO, screen readers, no-JS).
import { Marked } from 'marked';
import { type Entry, type Link, type ProjectEntry, type ResearchEntry, type Site, isInProgress, isResearch } from './types.ts';

const marked = new Marked({ async: false });

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isExternal = (href: string) => /^https?:\/\//.test(href);
const linkAttrs = (href: string) => (isExternal(href) ? ' target="_blank" rel="noopener"' : '');

export interface RenderOptions {
  hasCv: boolean;
  /** Files referenced in the JSON that don't exist in /public. They are left out, never shown broken. */
  missing: Set<string>;
}

/** Forest before lake; within a zone, JSON order, with in-progress entries last ("deeper in the fog"). */
export function sortEntries(entries: Entry[]): Entry[] {
  const rank = (e: Entry) => (e.zone === 'forest' ? 0 : 2) + (isInProgress(e) ? 1 : 0);
  return entries.map((e, i) => ({ e, i })).sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i).map(({ e }) => e);
}

const ICON_MOON =
  '<svg class="icon-moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const ICON_SUN =
  '<svg class="icon-sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

export function renderHead(site: Site): string {
  return `<title>${esc(site.name)}: ${esc(site.title)}</title>
    <meta name="description" content="${esc(site.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(site.name)}" />
    <meta property="og:description" content="${esc(site.description)}" />`;
}

export function renderHeader(site: Site, opts: RenderOptions): string {
  const cv = opts.hasCv
    ? `<a class="header-link" href="/cv.pdf" target="_blank" rel="noopener">CV</a>`
    : '';
  return `<header class="site-header">
    <a class="brand" href="#top">${esc(site.name)}</a>
    <nav class="header-actions" aria-label="Contact">
      <a class="header-link" href="mailto:${esc(site.email)}">Email</a>
      ${cv}
      <button class="theme-toggle" type="button" aria-pressed="false" hidden>
        <span class="visually-hidden">Dark mode</span>${ICON_MOON}${ICON_SUN}
      </button>
    </nav>
  </header>`;
}

function meta(e: Entry): string {
  const bits = [e.year ? String(e.year) : '', ...(e.tags ?? [])].filter(Boolean);
  return bits.length ? `<p class="card-meta">${bits.map(esc).join('<span aria-hidden="true"> · </span>')}</p>` : '';
}

function projectCard(e: ProjectEntry): string {
  if (isInProgress(e)) {
    return `<li class="card card--in-progress" id="${esc(e.id)}">
      <p class="badge">In progress</p>
      <h3 class="card-title">${esc(e.title)}</h3>
      ${e.subtitle || e.summary ? `<p class="card-summary">${esc(e.subtitle ?? e.summary ?? '')}</p>` : ''}
    </li>`;
  }
  const small = e.zone === 'lake';
  return `<li class="card${small ? ' card--small' : ''}" id="${esc(e.id)}">
    <h3 class="card-title"><a class="card-link" href="#p/${esc(e.id)}" data-open="${esc(e.id)}">${esc(e.title)}</a></h3>
    ${e.subtitle ? `<p class="card-subtitle">${esc(e.subtitle)}</p>` : ''}
    ${!small && e.summary ? `<p class="card-summary">${esc(e.summary)}</p>` : ''}
    ${small ? '' : meta(e)}
  </li>`;
}

function researchCard(e: ResearchEntry, opts: RenderOptions): string {
  const context = [e.context, e.year ? String(e.year) : ''].filter(Boolean).map((s) => esc(s!)).join(' · ');
  const pdf = e.pdf && !opts.missing.has(e.pdf) ? e.pdf : undefined;
  if (isInProgress(e)) {
    return `<li class="card card--in-progress" id="${esc(e.id)}">
      <p class="badge">In progress</p>
      <h3 class="card-title">${esc(e.title)}</h3>
      ${context ? `<p class="card-subtitle">${context}</p>` : ''}
    </li>`;
  }
  return `<li class="card card--research" id="${esc(e.id)}">
    <h3 class="card-title">${esc(e.title)}</h3>
    <p class="card-subtitle">${esc(e.authors.join(', '))}${context ? ` · ${context}` : ''}</p>
    <p class="card-summary">${esc(e.abstract)}</p>
    ${
      pdf
        ? `<p class="card-actions">
      <a class="button" href="${esc(pdf)}" target="_blank" rel="noopener">Read PDF<span class="visually-hidden">: ${esc(e.title)}</span></a>
      <a class="button button--quiet" href="${esc(pdf)}" download>Download<span class="visually-hidden">: ${esc(e.title)}</span></a>
    </p>`
        : ''
    }
  </li>`;
}

function section(id: string, heading: string, intro: string, items: string[], extraClass = ''): string {
  if (!items.length) return '';
  return `<section class="section ${extraClass}" id="${id}" aria-labelledby="${id}-h">
    <h2 class="section-title" id="${id}-h">${heading}</h2>
    ${intro ? `<p class="section-intro">${intro}</p>` : ''}
    <ul class="card-list" role="list">${items.join('')}</ul>
  </section>`;
}

const linkList = (links: Link[]) =>
  links.map((l) => `<a href="${esc(l.href)}"${linkAttrs(l.href)}>${esc(l.label)}</a>`).join('');

export function renderMain(site: Site, all: Entry[], opts: RenderOptions): string {
  const entries = sortEntries(all);
  const forest = entries.filter((e) => e.zone === 'forest' && !isResearch(e)) as ProjectEntry[];
  const research = entries.filter(isResearch);
  const lake = entries.filter((e) => e.zone === 'lake' && !isResearch(e)) as ProjectEntry[];
  const skills = site.skills ?? [];

  return `<section class="hero" aria-labelledby="hero-name">
      <h1 class="hero-name" id="hero-name">${esc(site.name)}</h1>
      <p class="hero-title">${esc(site.title)}</p>
      <p class="hero-intro">${esc(site.intro)}</p>
    </section>

    ${
      site.about
        ? `<section class="section" id="about" aria-labelledby="about-h">
      <h2 class="section-title" id="about-h">About</h2>
      <p class="about">${esc(site.about)}</p>
      ${skills.length ? `<p class="skills"><span class="visually-hidden">Skills: </span>${skills.map(esc).join('<span aria-hidden="true"> · </span>')}</p>` : ''}
    </section>`
        : ''
    }

    <div id="projects" tabindex="-1">
      ${section('work', 'Work', '', forest.map(projectCard))}
      ${section('research', 'Research', '', research.map((e) => researchCard(e, opts)))}
      ${section('off-the-clock', 'Off the clock', 'Side work, across the lake.', lake.map(projectCard), 'section--lake')}
    </div>

    <section class="section contact" id="contact" aria-labelledby="contact-h">
      <h2 class="section-title" id="contact-h">Get in touch</h2>
      <p class="contact-email"><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
      <p class="contact-links">
        ${opts.hasCv ? `<a href="/cv.pdf" target="_blank" rel="noopener">CV (PDF)</a>` : ''}
        ${linkList(site.links ?? [])}
      </p>
    </section>`;
}

function panelContent(e: ProjectEntry, opts: RenderOptions): string {
  const eyebrow = [e.year ? String(e.year) : '', e.zone === 'lake' ? 'Off the clock' : ''].filter(Boolean).join(' · ');
  const facts = [
    e.role ? `<div><dt>Role</dt><dd>${esc(e.role)}</dd></div>` : '',
    e.tools?.length ? `<div><dt>Tools</dt><dd>${e.tools.map(esc).join(', ')}</dd></div>` : '',
  ].join('');
  const media = (e.media ?? []).filter((m) => !opts.missing.has(m.src));
  return `<header class="panel-header">
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      <h2 class="panel-title" id="panel-title">${esc(e.title)}</h2>
      ${e.subtitle ? `<p class="panel-subtitle">${esc(e.subtitle)}</p>` : ''}
    </header>
    ${e.summary ? `<p class="panel-summary">${esc(e.summary)}</p>` : ''}
    ${facts ? `<dl class="facts">${facts}</dl>` : ''}
    ${e.body ? `<div class="prose">${marked.parse(e.body) as string}</div>` : ''}
    ${media
      .map(
        (m) =>
          `<figure class="media"><img src="${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy" decoding="async" /></figure>`,
      )
      .join('')}
    ${e.links?.length ? `<p class="panel-links">${linkList(e.links)}</p>` : ''}
    ${e.tags?.length ? `<p class="card-meta">${e.tags.map(esc).join('<span aria-hidden="true"> · </span>')}</p>` : ''}`;
}

/** One <template> per openable project; ProjectPanel clones it into the dialog. */
export function renderTemplates(all: Entry[], opts: RenderOptions): string {
  return all
    .filter((e): e is ProjectEntry => !isResearch(e) && !isInProgress(e))
    .map((e) => `<template id="detail-${esc(e.id)}">${panelContent(e, opts)}</template>`)
    .join('\n');
}

export function renderFooter(site: Site): string {
  return `<footer class="site-footer"><p>© ${new Date().getFullYear()} ${esc(site.name)}</p></footer>`;
}

/** Minimal entry data for the client (scene now, search later). Same order as the page. */
export function renderEntriesData(all: Entry[]): string {
  const data = sortEntries(all).map((e) => ({
    id: e.id,
    zone: e.zone,
    type: e.type ?? 'project',
    title: e.title,
    subtitle: isResearch(e) ? e.context : e.subtitle,
    tags: e.tags ?? [],
    status: e.status,
    sceneObject: e.sceneObject,
  }));
  return `<script type="application/json" id="entries-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
