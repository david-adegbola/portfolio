// The page, as React components. Rendered to static HTML at build time (src/content/render.tsx),
// so every word is in index.html before any JavaScript runs (SEO, screen readers, no JS).
import { Marked } from 'marked';
import { Fragment, type ReactNode } from 'react';
import { objectKind } from '../content/objects.ts';
import { type Entry, type Link, type ProjectEntry, type ResearchEntry, type Site, isInProgress, isResearch } from '../content/types.ts';
import { Glyph, IconDown, IconMoon, IconNext, IconPrev, IconSearch, IconSun } from './icons.tsx';

const marked = new Marked({ async: false });

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

export function Header({ site, opts }: { site: Site; opts: RenderOptions }) {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top">
          {site.name}
        </a>
        <nav className="header-actions" aria-label="Contact">
          <a className="header-link" href={`mailto:${site.email}`}>
            Email
          </a>
          {opts.hasCv && (
            <a className="header-link" href="/cv.pdf" target="_blank" rel="noopener">
              CV
            </a>
          )}
          <button className="header-search" type="button" aria-label="Search" aria-controls="search-input">
            <IconSearch />
          </button>
          <button className="theme-toggle" type="button" aria-pressed="false">
            <span className="visually-hidden">Dark mode</span>
            <IconMoon />
            <IconSun />
          </button>
        </nav>
      </header>
      <div className="search-status" role="region" aria-label="Search results" hidden>
        <p className="search-summary"></p>
        <div className="search-status-actions">
          <button className="search-step" type="button" data-step="-1" aria-label="Previous result">
            <IconPrev />
          </button>
          <button className="search-step" type="button" data-step="1" aria-label="Next result">
            <IconNext />
          </button>
          <button className="search-clear" type="button">
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
    <form className="search" role="search" data-chips={JSON.stringify(site.searchChips ?? [])}>
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
      <div className="search-chips" role="group" aria-label="Suggestions"></div>
    </form>
  );
}

function Meta({ e }: { e: Entry }) {
  const bits = [e.year ? String(e.year) : '', ...(e.tags ?? [])].filter(Boolean);
  if (!bits.length) return null;
  return (
    <p className="card-meta">
      <Dotted items={bits} />
    </p>
  );
}

function ProjectCard({ e }: { e: ProjectEntry }) {
  if (isInProgress(e)) {
    const line = e.subtitle ?? e.summary;
    return (
      <li className="card card--in-progress" id={e.id}>
        <Glyph kind={objectKind(e)} />
        <p className="badge">In progress</p>
        <h3 className="card-title" lang={e.lang}>
          {e.title}
        </h3>
        {line && <p className="card-summary">{line}</p>}
      </li>
    );
  }
  const small = e.zone === 'lake';
  return (
    <li className={`card${small ? ' card--small' : ''}`} id={e.id}>
      <Glyph kind={objectKind(e)} />
      <h3 className="card-title">
        <a className="card-link" href={`#p/${e.id}`} data-open={e.id} lang={e.lang}>
          {e.title}
        </a>
      </h3>
      {e.subtitle && <p className="card-subtitle">{e.subtitle}</p>}
      {!small && e.summary && <p className="card-summary">{e.summary}</p>}
      {!small && <Meta e={e} />}
    </li>
  );
}

function ResearchCard({ e, opts }: { e: ResearchEntry; opts: RenderOptions }) {
  const context = [e.context, e.year ? String(e.year) : ''].filter(Boolean).join(' · ');
  const pdf = e.pdf && !opts.missing.has(e.pdf) ? e.pdf : undefined;
  if (isInProgress(e)) {
    return (
      <li className="card card--in-progress" id={e.id}>
        <Glyph kind={objectKind(e)} />
        <p className="badge">In progress</p>
        <h3 className="card-title" lang={e.lang}>
          {e.title}
        </h3>
        {context && <p className="card-subtitle">{context}</p>}
      </li>
    );
  }
  return (
    <li className="card card--research" id={e.id}>
      <Glyph kind={objectKind(e)} />
      <h3 className="card-title" lang={e.lang}>
        {e.title}
      </h3>
      <p className="card-subtitle">
        {e.authors.join(', ')}
        {context ? ` · ${context}` : ''}
      </p>
      <p className="card-summary">{e.abstract}</p>
      {pdf && (
        <p className="card-actions">
          <a className="button" href={pdf} target="_blank" rel="noopener">
            Read PDF<span className="visually-hidden">: {e.title}</span>
          </a>
          <a className="button button--quiet" href={pdf} download>
            Download<span className="visually-hidden">: {e.title}</span>
          </a>
        </p>
      )}
    </li>
  );
}

function Section(props: { id: string; heading: string; intro?: string; className?: string; children: ReactNode[] }) {
  const { id, heading, intro, className, children } = props;
  if (!children.length) return null;
  return (
    <section className={`section${className ? ` ${className}` : ''}`} id={id} aria-labelledby={`${id}-h`}>
      <h2 className="section-title" id={`${id}-h`}>
        {heading}
      </h2>
      {intro && <p className="section-intro">{intro}</p>}
      <ul className="card-list" role="list">
        {children}
      </ul>
    </section>
  );
}

export function Main({ site, entries: all, opts }: { site: Site; entries: Entry[]; opts: RenderOptions }) {
  const entries = sortEntries(all);
  const forest = entries.filter((e) => e.zone === 'forest' && !isResearch(e)) as ProjectEntry[];
  const research = entries.filter(isResearch);
  const lake = entries.filter((e) => e.zone === 'lake' && !isResearch(e)) as ProjectEntry[];
  const skills = site.skills ?? [];

  return (
    <>
      <section className="hero" aria-labelledby="hero-name">
        <h1 className="hero-name" id="hero-name">
          {site.name}
        </h1>
        <p className="hero-title">{site.title}</p>
        <p className="hero-intro">{site.intro}</p>
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

      {site.about && (
        <section className="section" id="about" aria-labelledby="about-h">
          <h2 className="section-title" id="about-h">
            About
          </h2>
          <p className="about">{site.about}</p>
          {skills.length > 0 && (
            <p className="skills">
              <span className="visually-hidden">Skills: </span>
              <Dotted items={skills} />
            </p>
          )}
        </section>
      )}

      <div id="projects" tabIndex={-1}>
        <Section id="work" heading="Work">
          {forest.map((e) => (
            <ProjectCard key={e.id} e={e} />
          ))}
        </Section>
        <Section id="research" heading="Research">
          {research.map((e) => (
            <ResearchCard key={e.id} e={e} opts={opts} />
          ))}
        </Section>
        <Section id="off-the-clock" heading="Off the clock" intro="Side work, across the lake." className="section--lake">
          {lake.map((e) => (
            <ProjectCard key={e.id} e={e} />
          ))}
        </Section>
      </div>

      <section className="section contact" id="contact" aria-labelledby="contact-h">
        <h2 className="section-title" id="contact-h">
          Get in touch
        </h2>
        <p className="contact-email">
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </p>
        <p className="contact-links">
          {opts.hasCv && (
            <a href="/cv.pdf" target="_blank" rel="noopener">
              CV (PDF)
            </a>
          )}
          <LinkList links={site.links ?? []} />
        </p>
      </section>
    </>
  );
}

function PanelContent({ e, opts }: { e: ProjectEntry; opts: RenderOptions }) {
  const eyebrow = [e.year ? String(e.year) : '', e.zone === 'lake' ? 'Off the clock' : ''].filter(Boolean).join(' · ');
  const media = (e.media ?? []).filter((m) => !opts.missing.has(m.src));
  const hasFacts = !!e.role || !!e.tools?.length;
  return (
    <>
      <header className="panel-header">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="panel-title" id="panel-title" lang={e.lang}>
          {e.title}
        </h2>
        {e.subtitle && <p className="panel-subtitle">{e.subtitle}</p>}
      </header>
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

/** One <template> per openable project; ProjectPanel clones it into the dialog. */
export function Templates({ entries, opts }: { entries: Entry[]; opts: RenderOptions }) {
  return entries
    .filter((e): e is ProjectEntry => !isResearch(e) && !isInProgress(e))
    .map((e) => (
      <template id={`detail-${e.id}`} key={e.id}>
        <PanelContent e={e} opts={opts} />
      </template>
    ));
}

const SEASONS = [
  ['spring', 'Spring', 'Kevät'],
  ['summer', 'Summer', 'Kesä'],
  ['autumn', 'Autumn', 'Syksy'],
  ['winter', 'Winter', 'Talvi'],
] as const;

export function Footer({ site, year }: { site: Site; year: number }) {
  // The season switcher and the search announcer sit last, after the content they relate to.
  return (
    <>
      <footer className="site-footer">
        <p>
          © {year} {site.name}
        </p>
      </footer>
      <div className="seasons" role="group" aria-label="Season in the forest">
        <p className="season-caption" id="season-caption" role="status"></p>
        <div className="season-buttons">
          {SEASONS.map(([id, en, fi]) => (
            <button key={id} className="season" type="button" data-season={id} aria-pressed="false" title={fi}>
              {en}
              <span className="season-now" hidden>
                <span className="visually-hidden">, now in Finland</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="visually-hidden" role="status" id="search-announce"></p>
    </>
  );
}
