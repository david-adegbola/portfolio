// The page, as React components. Rendered to static HTML at build time (src/content/render.tsx),
// so every word is in index.html before any JavaScript runs (SEO, screen readers, no JS).
// Flows: design-research/primer/flows/ (landing, browse-work, section-nav, contact).
import { Marked } from 'marked';
import { Fragment, type ReactNode } from 'react';
import { objectKind } from '../content/objects.ts';
import { type Entry, type Link, type ProjectEntry, type ResearchEntry, type Site, isInProgress, isResearch } from '../content/types.ts';
import { cn } from '../lib/utils.ts';
import { IconDown, IconMoon, IconNext, IconPrev, IconSearch, IconSun } from './icons.tsx';
import { ContactBlock } from './patterns/ContactBlock.tsx';
import { IndexItem, IndexList } from './patterns/IndexList.tsx';
import { type SectionLink, SectionNav } from './patterns/SectionNav.tsx';
import { buttonVariants } from './ui/button.tsx';

const marked = new Marked({ async: false });

export interface RenderOptions {
  /** Where the CV PDF lives, if there is one. */
  cv?: string;
  /** Files referenced in the JSON that don't exist in /public. They are left out, never shown broken. */
  missing: Set<string>;
}

/** Forest before lake; within a zone, JSON order, with in-progress entries last ("deeper in the fog"). */
export function sortEntries(entries: Entry[]): Entry[] {
  const rank = (e: Entry) => (e.zone === 'forest' ? 0 : 2) + (isInProgress(e) ? 1 : 0);
  return entries.map((e, i) => ({ e, i })).sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i).map(({ e }) => e);
}

/** The side zone's section name (the scene's "across the lake"). */
export const LAKE_HEADING = 'Built with AI agents';

/**
 * A project opens a detail panel only when the panel has more to show than its card: a summary on
 * a small card, a role, tools, a write-up, media or links. Otherwise a click would promise detail
 * that isn't there (design audit X2).
 */
export function hasDetail(e: ProjectEntry): boolean {
  if (isInProgress(e)) return false;
  const cardShowsSummary = e.zone !== 'lake';
  return !!(e.role || e.tools?.length || e.body || e.media?.length || e.links?.length || (e.summary && !cardShowsSummary));
}

const isExternal = (href: string) => /^https?:\/\//.test(href);
const linkProps = (href: string) => (isExternal(href) ? { target: '_blank', rel: 'noopener' } : {});

/** Items separated by a middle dot that screen readers skip. */
const Dotted = ({ items }: { items: ReactNode[] }) =>
  items.map((item, i) => (
    <Fragment key={i}>
      {i > 0 && <span aria-hidden="true"> · </span>}
      {item}
    </Fragment>
  ));

const LinkList = ({ links }: { links: Link[] }) =>
  links.map((l) => (
    <a key={l.href} href={l.href} {...linkProps(l.href)}>
      {l.label}
    </a>
  ));

/** The page's sections in order, for the section nav. Empty sections are left out. */
function split(all: Entry[]) {
  const entries = sortEntries(all);
  return {
    forest: entries.filter((e) => e.zone === 'forest' && !isResearch(e)) as ProjectEntry[],
    research: entries.filter(isResearch),
    lake: entries.filter((e) => e.zone === 'lake' && !isResearch(e)) as ProjectEntry[],
  };
}
export function sectionsFor(site: Site, all: Entry[]): SectionLink[] {
  const { forest, research, lake } = split(all);
  return [
    forest.length ? { id: 'work', label: 'Work' } : null,
    research.length ? { id: 'research', label: 'Research' } : null,
    lake.length ? { id: 'built-with-ai', label: 'Built with AI' } : null,
    site.about ? { id: 'about', label: 'About' } : null,
    { id: 'contact', label: 'Contact' },
  ].filter((s): s is SectionLink => s !== null);
}

export function Head({ site }: { site: Site }) {
  const title = `${site.name}: ${site.title}`;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={site.description} />
      <link rel="canonical" href={site.url} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={site.url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={site.description} />
      <meta property="og:image" content={`${site.url}og.jpg`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${site.name}, ${site.title}, over a misty low-poly forest`} />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}

export function Header({ site, entries, opts }: { site: Site; entries: Entry[]; opts: RenderOptions }) {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top">
          {site.name}
        </a>
        <SectionNav sections={sectionsFor(site, entries)} className="section-nav--header" />
        <nav className="header-actions" aria-label="Contact">
          {/* The page's main action is the one primary button (Primer: one primary per group). */}
          <a className={buttonVariants({ size: 'sm' })} href={`mailto:${site.email}`}>
            Email
          </a>
          {opts.cv && (
            <a className={buttonVariants({ variant: 'outline', size: 'sm' })} href={opts.cv} target="_blank" rel="noopener">
              CV
            </a>
          )}
          <button
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'header-search')}
            type="button"
            aria-label="Search"
            aria-controls="search-input"
          >
            <IconSearch />
          </button>
          <button className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'theme-toggle')} type="button" aria-pressed="false">
            <span className="visually-hidden">Dark mode</span>
            <IconMoon />
            <IconSun />
          </button>
        </nav>
      </header>
      <div className="search-status" role="region" aria-label="Search results" hidden>
        <p className="search-summary"></p>
        <div className="search-status-actions">
          <button className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'search-step')} type="button" data-step="-1" aria-label="Previous result">
            <IconPrev />
          </button>
          <button className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'search-step')} type="button" data-step="1" aria-label="Next result">
            <IconNext />
          </button>
          <button className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'search-clear')} type="button">
            Clear
          </button>
        </div>
      </div>
    </>
  );
}

/** The search form. Shown only when JavaScript runs (the `js` class, see index.html); the page works without it. */
function Search({ site }: { site: Site }) {
  return (
    <form className="search" role="search">
      <label className="search-label" htmlFor="search-input">
        What are you looking for?
      </label>
      <div className="search-field">
        <IconSearch />
        <input
          id="search-input"
          className="search-input"
          type="search"
          autoComplete="off"
          spellCheck="false"
          enterKeyHint="search"
          placeholder="A project, a tool, a topic"
          role="combobox"
          aria-expanded="false"
          aria-controls="search-results"
          aria-autocomplete="list"
        />
      </div>
      <ul className="search-results" id="search-results" role="listbox" aria-label="Matches" hidden></ul>
      <p className="search-empty" role="status"></p>
      {/* Suggestion chips: small outline Buttons. Search.ts removes any that would find nothing. */}
      <div className="search-chips" role="group" aria-label="Suggestions">
        {(site.searchChips ?? []).map((chip) => (
          <button key={chip} type="button" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'search-chip')}>
            {chip}
          </button>
        ))}
      </div>
    </form>
  );
}

function ProjectItem({ e, index }: { e: ProjectEntry; index: number }) {
  const small = e.zone === 'lake';
  const inProgress = isInProgress(e);
  return (
    <IndexItem
      id={e.id}
      index={index}
      kind={objectKind(e)}
      title={e.title}
      lang={e.lang}
      opens={hasDetail(e)}
      year={inProgress ? undefined : e.year}
      subtitle={e.subtitle ?? (inProgress ? e.summary : undefined)}
      summary={!small && !inProgress ? e.summary : undefined}
      tags={!small && !inProgress ? e.tags : undefined}
      inProgress={inProgress}
      small={small}
    />
  );
}

function ResearchItem({ e, index, opts }: { e: ResearchEntry; index: number; opts: RenderOptions }) {
  const pdf = e.pdf && !opts.missing.has(e.pdf) ? e.pdf : undefined;
  const inProgress = isInProgress(e);
  const byline = [e.authors.join(', '), e.context].filter(Boolean).join(' · ');
  return (
    <IndexItem
      id={e.id}
      index={index}
      kind={objectKind(e)}
      title={e.title}
      lang={e.lang}
      year={e.year}
      subtitle={byline}
      summary={inProgress ? undefined : e.abstract}
      inProgress={inProgress}
      className="card--research"
    >
      {pdf && !inProgress && (
        <p className="card-actions">
          <a className={buttonVariants({ variant: 'outline' })} href={pdf} target="_blank" rel="noopener">
            Read PDF<span className="visually-hidden">: {e.title}</span>
          </a>
          <a className={buttonVariants({ variant: 'ghost' })} href={pdf} download>
            Download<span className="visually-hidden">: {e.title}</span>
          </a>
        </p>
      )}
    </IndexItem>
  );
}

function Section(props: { id: string; heading: string; intro?: string; className?: string; count: number; children: ReactNode }) {
  const { id, heading, intro, className, count, children } = props;
  if (!count) return null;
  return (
    <section className={cn('section', className)} id={id} aria-labelledby={`${id}-h`}>
      <div className="section-head">
        <h2 className="section-title" id={`${id}-h`} tabIndex={-1}>
          {heading}
        </h2>
        <span className="section-count" aria-hidden="true">
          {String(count).padStart(2, '0')}
        </span>
      </div>
      {intro && <p className="section-intro">{intro}</p>}
      <IndexList>{children}</IndexList>
    </section>
  );
}

export function Main({ site, entries: all, opts }: { site: Site; entries: Entry[]; opts: RenderOptions }) {
  const { forest, research, lake } = split(all);
  const skills = site.skills ?? [];
  const statements = site.statements ?? [];

  return (
    <>
      <section className="hero" aria-labelledby="hero-name">
        <h1 className="hero-name" id="hero-name">
          {site.name}
        </h1>
        <p className="hero-title">{site.title}</p>
        {statements.length > 0 && (
          <ol className="statements">
            {statements.map((s, i) => (
              <li key={i}>
                <span className="statement-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="hero-intro">{site.intro}</p>
        <SectionNav sections={sectionsFor(site, all)} className="section-nav--hero" numbered label="On this page" />
        <Search site={site} />
        {forest.length > 0 && (
          <p>
            <a className="see-work" href="#work" data-fly={forest[0].id}>
              See my work
              <IconDown />
            </a>
          </p>
        )}
      </section>

      <div id="projects" tabIndex={-1}>
        <Section id="work" heading="Work" count={forest.length}>
          {forest.map((e, i) => (
            <ProjectItem key={e.id} e={e} index={i + 1} />
          ))}
        </Section>
        <Section id="research" heading="Research" count={research.length}>
          {research.map((e, i) => (
            <ResearchItem key={e.id} e={e} index={i + 1} opts={opts} />
          ))}
        </Section>
        <Section
          id="built-with-ai"
          heading={LAKE_HEADING}
          intro="Own projects. I write the spec and the rules the coding agent (Claude Code) follows, guide it and check the result."
          className="section--lake"
          count={lake.length}
        >
          {lake.map((e, i) => (
            <ProjectItem key={e.id} e={e} index={i + 1} />
          ))}
        </Section>
      </div>

      {site.about && (
        <section className="section" id="about" aria-labelledby="about-h">
          <h2 className="section-title" id="about-h" tabIndex={-1}>
            About
          </h2>
          <p className="about">{site.about}</p>
          {skills.length > 0 && (
            <>
              <h3 className="skills-title" id="skills-h">
                Skills
              </h3>
              <ul className="skills" aria-labelledby="skills-h">
                {skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <ContactBlock
        heading={site.contact?.heading ?? 'Get in touch'}
        text={site.contact?.text}
        email={site.email}
        cv={opts.cv}
        location={site.location}
        links={site.links ?? []}
      />
    </>
  );
}

/** The panel body. The header (eyebrow, title, subtitle) is drawn by the Sheet from the template's data attributes. */
function PanelContent({ e, opts }: { e: ProjectEntry; opts: RenderOptions }) {
  const media = (e.media ?? []).filter((m) => !opts.missing.has(m.src));
  const hasFacts = !!e.role || !!e.tools?.length;
  return (
    <>
      {e.summary && <p className="panel-summary">{e.summary}</p>}
      {hasFacts && (
        <dl className="facts">
          {e.role && (
            <div>
              <dt>Role</dt>
              <dd>{e.role}</dd>
            </div>
          )}
          {!!e.tools?.length && (
            <div>
              <dt>Tools</dt>
              <dd>{e.tools.join(', ')}</dd>
            </div>
          )}
        </dl>
      )}
      {e.body && <div className="prose" dangerouslySetInnerHTML={{ __html: marked.parse(e.body) as string }} />}
      {media.map((m) => (
        <figure className="media" key={m.src}>
          <img src={m.src} alt={m.alt} loading="lazy" decoding="async" />
        </figure>
      ))}
      {!!e.links?.length && (
        <p className="panel-links">
          <LinkList links={e.links} />
        </p>
      )}
      {!!e.tags?.length && (
        <p className="card-meta">
          <Dotted items={e.tags} />
        </p>
      )}
    </>
  );
}

/** One <template> per openable project, in page order; the ProjectPanel island clones it into the Sheet (and uses the order for prev / next). */
export function Templates({ entries, opts }: { entries: Entry[]; opts: RenderOptions }) {
  return sortEntries(entries)
    .filter((e): e is ProjectEntry => !isResearch(e) && hasDetail(e))
    .map((e) => (
      <template
        id={`detail-${e.id}`}
        key={e.id}
        data-title={e.title}
        data-lang={e.lang}
        data-subtitle={e.subtitle}
        data-eyebrow={[e.year ? String(e.year) : '', e.zone === 'lake' ? LAKE_HEADING : ''].filter(Boolean).join(' · ') || undefined}
      >
        <PanelContent e={e} opts={opts} />
      </template>
    ));
}

/** A signature, like the end of a letter: name and place, and when the page was last built. */
export function Footer({ site, built }: { site: Site; built: Date }) {
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/Helsinki' }).format(built);
  return (
    <footer className="site-footer">
      <p className="footer-sign">
        {site.name}
        {site.location && <span className="footer-place"> · {site.location}</span>}
      </p>
      <p className="footer-meta">
        Updated {month} · © {built.getFullYear()}
      </p>
    </footer>
  );
}
