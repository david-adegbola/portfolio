// The page, as React components. Rendered to static HTML at build time (src/content/render.tsx),
// so every word is in index.html before any JavaScript runs (SEO, screen readers, no JS).
// Order: hero → Work (strongest proof first) → Learning now → About → Background → Notes → Contact.
import { Marked } from 'marked';
import type { ReactNode } from 'react';
import { type Entry, type Link, type Note, type Now, type Site, isInProgress } from '../content/types.ts';
import { cn } from '../lib/utils.ts';
import { SEASON_NAMES, SEASONS } from '../seasons.ts';
import { IconDown, IconExternal } from './icons.tsx';
import { ContactBlock } from './patterns/ContactBlock.tsx';
import { IndexItem, IndexList, Subjects } from './patterns/IndexList.tsx';
import { Picture } from './patterns/Picture.tsx';
import { Rings } from './patterns/Rings.tsx';
import { type SectionLink, SectionNav } from './patterns/SectionNav.tsx';
import { Treeline } from './patterns/Treeline.tsx';
import { buttonVariants } from './ui/button.tsx';

const marked = new Marked({ async: false });
const md = (text: string) => marked.parse(text) as string;

export interface RenderOptions {
  /** Where the CV PDF lives, if there is one. */
  cv?: string;
  /** Files referenced in the content that don't exist in /public. They are left out, never shown broken. */
  missing: Set<string>;
}

/** How many notes the homepage lists. */
export const NOTES_ON_HOME = 3;

/** Finished work in JSON order (strongest proof first), then the unfinished work for "Learning now". */
export function split(entries: Entry[]) {
  return { done: entries.filter((e) => !isInProgress(e)), learning: entries.filter(isInProgress) };
}

/** A finished entry opens a panel when the panel has something the card doesn't. */
export function hasDetail(e: Entry): boolean {
  if (isInProgress(e)) return false;
  return !!(e.problem || e.did || e.result || e.role || e.tryIt || e.links?.length || e.proofNote || e.media?.length);
}

/**
 * What kind of proof backs an entry, in a few words, for the card: "working version", "code",
 * "data", "PDF", "live site", or the entry's own short label for proof that isn't a link.
 */
export function proofKinds(e: Entry): string[] {
  if (e.proofLine) return e.proofLine;
  const kind = (href: string) =>
    /\.csv($|\?)/i.test(href) ? 'data' : /\.pdf($|\?)/i.test(href) ? 'PDF' : /github\.com\//.test(href) ? 'code' : 'live site';
  const kinds = [...(e.tryIt ? ['working version'] : []), ...(e.links ?? []).map((l) => kind(l.href)), ...(e.proofNoteShort ? [e.proofNoteShort] : [])];
  return [...new Set(kinds)];
}

const isExternal = (href: string) => /^https?:\/\//.test(href);
const linkProps = (href: string) => (isExternal(href) ? { target: '_blank', rel: 'noopener' } : {});

export const formatDate = (iso: string, month: 'long' | 'short' = 'long') =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month, year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
const formatMonth = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

/** The page's sections in order, for the section nav. Empty sections are left out. */
export function sectionsFor(site: Site, entries: Entry[], notes: Note[]): SectionLink[] {
  const { done, learning } = split(entries);
  return [
    done.length ? { id: 'work', label: 'Work' } : null,
    learning.length ? { id: 'learning', label: 'Learning' } : null,
    site.about?.length || site.offer?.length ? { id: 'about', label: 'About' } : null,
    site.education?.length || site.computing?.length || site.skills?.length ? { id: 'background', label: 'Background' } : null,
    notes.length ? { id: 'notes', label: 'Notes' } : null,
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
      <meta property="og:image" content={`${site.url}og.png`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${site.name}: ${site.headline} A tree-ring drawing and a line of spruce and birch.`} />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}

/** Email and CV are in the header on every screen, one click away. */
export function Header({ site, sections, opts, home = '#top' }: { site: Site; sections: SectionLink[]; opts: RenderOptions; home?: string }) {
  return (
    <header className="site-header">
      <a className="brand" href={home}>
        {site.name}
      </a>
      <SectionNav sections={sections} className="section-nav--header" />
      <nav className="header-actions" aria-label="Contact">
        <a className={buttonVariants({ size: 'sm' })} href={`mailto:${site.email}`}>
          Email
        </a>
        {opts.cv && (
          <a className={buttonVariants({ variant: 'outline', size: 'sm' })} href={opts.cv} target="_blank" rel="noopener">
            CV
          </a>
        )}
      </nav>
    </header>
  );
}

/** A section with a ring mark beside its heading. */
function Section(props: { id: string; heading: string; intro?: ReactNode; className?: string; seed: number; children: ReactNode }) {
  const { id, heading, intro, className, seed, children } = props;
  return (
    <section className={cn('section', className)} id={id} aria-labelledby={`${id}-h`}>
      <div className="section-head">
        <Rings count={4} seed={seed} className="rings--mark" />
        <h2 className="section-title" id={`${id}-h`} tabIndex={-1}>
          {heading}
        </h2>
      </div>
      {intro && <p className="section-intro">{intro}</p>}
      {children}
    </section>
  );
}

function Hero({ site, now, sections, opts }: { site: Site; now?: Now; sections: SectionLink[]; opts: RenderOptions }) {
  const statements = site.statements ?? [];
  const hasPortrait = !!site.portrait && !opts.missing.has(site.portrait.src);
  const portrait = hasPortrait ? <Picture img={site.portrait} missing={opts.missing} sizes="(min-width: 80rem) 10rem, 5rem" className="portrait" eager /> : null;
  return (
    <section className={cn('hero', hasPortrait && 'hero--portrait')} aria-labelledby="hero-name">
      <div className="hero-text">
        <h1 className="hero-name" id="hero-name">
          {site.name}
        </h1>
        <p className="hero-headline">{site.headline}</p>
        {statements.length > 0 && (
          <ol className="statements">
            {statements.map((s, i) => (
              <li key={i}>
                <span className="statement-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        )}
        {now && (
          <p className="now">
            <strong className="now-label">Currently</strong>{' '}
            <span>{now.text}</span>{' '}
            <span className="now-date">
              (<time dateTime={now.updated}>{formatMonth(now.updated)}</time>)
            </span>
          </p>
        )}
        <p className="hero-actions">
          <a className={buttonVariants({ size: 'lg' })} href={`mailto:${site.email}`}>
            Email me
          </a>
          {opts.cv && (
            <a className={buttonVariants({ variant: 'outline', size: 'lg' })} href={opts.cv} target="_blank" rel="noopener">
              Open my CV (PDF)
            </a>
          )}
          {sections[0]?.id === 'work' && (
            <a className="see-work" href="#work" data-fly="work">
              See the proof
              <IconDown />
            </a>
          )}
        </p>
        <SectionNav sections={sections} className="section-nav--hero" label="On this page" />
      </div>
      <div className="hero-figure" aria-hidden={portrait ? undefined : 'true'}>
        <Rings count={12} seed={5} className="rings--hero" />
        {portrait}
      </div>
      <Treeline className="treeline--hero" />
    </section>
  );
}

function Work({ site, entries, opts }: { site: Site; entries: Entry[]; opts: RenderOptions }) {
  if (!entries.length) return null;
  return (
    <Section id="work" heading="Work" seed={11} intro="Finished work, the strongest proof first. Open one to see the problem, what I did, the result and the proof.">
      {site.softwareNote && <p className="software-note">{site.softwareNote}</p>}
      <IndexList>
        {entries.map((e) => (
          <IndexItem
            key={e.id}
            id={e.id}
            title={e.title}
            lang={e.lang}
            opens={hasDetail(e)}
            when={e.when}
            subtitle={e.subtitle}
            summary={e.summary}
            subjects={e.subjects}
            proof={proofKinds(e)}
            cover={e.media?.find((m) => m.cover)}
            missing={opts.missing}
          />
        ))}
      </IndexList>
    </Section>
  );
}

function Learning({ site, entries }: { site: Site; entries: Entry[] }) {
  if (!entries.length) return null;
  return (
    <Section id="learning" heading="Learning now" seed={17} intro={site.learningNote} className="section--learning">
      <ul className="learning-list">
        {entries.map((e) => (
          <li key={e.id} id={e.id} className="learning-item">
            <p className="learning-title" lang={e.lang}>
              {e.title}
            </p>
            {e.subtitle && <p className="learning-subtitle">{e.subtitle}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function About({ site }: { site: Site }) {
  if (!site.about?.length && !site.offer?.length) return null;
  return (
    <Section id="about" heading="About" seed={23}>
      <div className="about">
        {site.about?.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {!!site.offer?.length && (
        <>
          <h3 className="sub-title" id="offer-h">
            What I can do for you
          </h3>
          <ul className="offer" aria-labelledby="offer-h">
            {site.offer.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

function Background({ site }: { site: Site }) {
  const { education = [], computing = [], skills = [] } = site;
  if (!education.length && !computing.length && !skills.length) return null;
  return (
    <Section id="background" heading="Background" seed={29}>
      {education.length > 0 && (
        <>
          <h3 className="sub-title">Education</h3>
          <ul className="ledger">
            {education.map((ed) => (
              <li key={ed.title} className="ledger-row">
                <span className="ledger-when">{ed.years}</span>
                <span className="ledger-what">
                  <strong>{ed.title}</strong>, {ed.place}
                  {ed.note && <span className="ledger-note"> {ed.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {computing.length > 0 && (
        <>
          <h3 className="sub-title" id="computing-h">
            Hands-on IT work
          </h3>
          <ul className="ruled" aria-labelledby="computing-h">
            {computing.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      )}
      {skills.length > 0 && (
        <>
          <h3 className="sub-title">Skills</h3>
          <dl className="skills">
            {skills.map((g) => (
              <div key={g.group}>
                <dt>{g.group}</dt>
                <dd>{g.items.join(' · ')}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Section>
  );
}

function Notes({ notes }: { notes: Note[] }) {
  if (!notes.length) return null;
  return (
    <Section id="notes" heading="Notes" seed={37}>
      <NoteList notes={notes.slice(0, NOTES_ON_HOME)} />
      {notes.length > NOTES_ON_HOME && (
        <p className="notes-all">
          <a href="/notes/">All {notes.length} notes</a>
        </p>
      )}
    </Section>
  );
}

export function NoteList({ notes }: { notes: Note[] }) {
  return (
    <ul className="notes-list">
      {notes.map((n) => (
        <li key={n.slug}>
          <p className="note-title">
            <a href={`/notes/${n.slug}/`}>{n.title}</a>
          </p>
          <p className="note-date">
            <time dateTime={n.date}>{formatDate(n.date)}</time>
          </p>
          {n.summary && <p className="note-summary">{n.summary}</p>}
        </li>
      ))}
    </ul>
  );
}

export function Main({ site, entries, now, notes, opts }: { site: Site; entries: Entry[]; now?: Now; notes: Note[]; opts: RenderOptions }) {
  const { done, learning } = split(entries);
  const sections = sectionsFor(site, entries, notes);
  return (
    <>
      <Hero site={site} now={now} sections={sections} opts={opts} />
      <div id="projects" tabIndex={-1}>
        <Work site={site} entries={done} opts={opts} />
        <Learning site={site} entries={learning} />
      </div>
      <About site={site} />
      <Background site={site} />
      <Notes notes={notes} />
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

function ProofLink({ link, primary }: { link: Link; primary?: boolean }) {
  return (
    <a
      className={buttonVariants({ variant: primary ? 'default' : 'outline', size: primary ? 'lg' : 'default' })}
      href={link.href}
      {...linkProps(link.href)}
    >
      {link.label}
      {isExternal(link.href) && (
        <>
          <IconExternal />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </>
      )}
    </a>
  );
}

/** The panel body: problem, what I did, result, proof. The header is drawn by the Sheet from the template's data attributes. */
function PanelContent({ e, opts }: { e: Entry; opts: RenderOptions }) {
  const media = (e.media ?? []).filter((m) => !opts.missing.has(m.src));
  const hasProof = !!(e.tryIt || e.links?.length || e.proofNote);
  // No summary here: the card shows it, and the parts below say the same in more detail.
  return (
    <>
      {(e.role || e.when) && (
        <dl className="facts">
          {e.role && (
            <div>
              <dt>Role</dt>
              <dd>{e.role}</dd>
            </div>
          )}
          {e.when && (
            <div>
              <dt>When</dt>
              <dd>{e.when}</dd>
            </div>
          )}
        </dl>
      )}
      {e.problem && (
        <section className="panel-part">
          <h3>The problem</h3>
          <div className="prose" dangerouslySetInnerHTML={{ __html: md(e.problem) }} />
        </section>
      )}
      {e.did && (
        <section className="panel-part">
          <h3>What I did</h3>
          <div className="prose" dangerouslySetInnerHTML={{ __html: md(e.did) }} />
        </section>
      )}
      {e.result && (
        <section className="panel-part">
          <h3>Result</h3>
          <div className="prose" dangerouslySetInnerHTML={{ __html: md(e.result) }} />
        </section>
      )}
      {media.map((m) => (
        <Picture key={m.src} img={m} missing={opts.missing} sizes="(min-width: 40rem) 34rem, 100vw" className="media" />
      ))}
      {hasProof && (
        <section className="panel-part">
          <h3>Proof</h3>
          {(e.tryIt || !!e.links?.length) && (
            <p className="proof-links">
              {e.tryIt && <ProofLink link={e.tryIt} primary />}
              {e.links?.map((l) => <ProofLink key={l.href} link={l} />)}
            </p>
          )}
          {e.proofNote && <p className="proof-note">{e.proofNote}</p>}
        </section>
      )}
      <Subjects subjects={e.subjects} />
    </>
  );
}

/** One <template> per openable entry, in page order; the ProjectPanel island clones it into the Sheet (and uses the order for prev / next). */
export function Templates({ entries, opts }: { entries: Entry[]; opts: RenderOptions }) {
  return split(entries)
    .done.filter(hasDetail)
    .map((e) => (
      <template id={`detail-${e.id}`} key={e.id} data-title={e.title} data-lang={e.lang} data-subtitle={e.subtitle}>
        <PanelContent e={e} opts={opts} />
      </template>
    ));
}

/** A signature, like the end of a letter: name and place, when the page was last built, and the season. */
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
      {/* Today's season in Finland, the one the drawings show. All four are in the HTML; CSS shows the one for <html data-season>. */}
      <p className="footer-season">
        {SEASONS.map((s) => (
          <span key={s} data-season-name={s}>
            {SEASON_NAMES[s][0]} in Finland · <span lang="fi">{SEASON_NAMES[s][1]}</span>
          </span>
        ))}
      </p>
    </footer>
  );
}
