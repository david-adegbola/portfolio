import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { type Content, loadContent, missingFiles, parseNote } from '../src/content/load.ts';
import { proofKinds } from '../src/components/Page.tsx';
import { renderMain, renderNotePages, renderTemplates } from '../src/content/render.tsx';
import type { Entry, Note, Site } from '../src/content/types.ts';

const root = path.resolve(__dirname, '..');
const opts = { missing: new Set<string>() };

/** A throwaway project folder with the given content files. */
function fixture(site: object, projects: unknown, files: Record<string, string> = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-'));
  fs.mkdirSync(path.join(dir, 'content/notes'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'content/site.json'), JSON.stringify(site));
  fs.writeFileSync(path.join(dir, 'content/projects.json'), JSON.stringify(projects));
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, 'content', name), text);
  return dir;
}
const site: Site = { name: 'N', url: 'https://x.test/', title: 'T', headline: 'Who I am.', description: 'D', email: 'a@x.test' };
const content = (entries: Entry[], extra: Partial<Content> = {}): Content => ({ site, entries, notes: [], ...extra });

describe('content loader', () => {
  it('accepts the real content', () => {
    expect(() => loadContent(root)).not.toThrow();
  });

  it('names the entry and field that is wrong', () => {
    const dir = fixture(site, [{ id: 'Bad ID', title: '', subjects: [] }, { id: 'ok', title: 'Ok', subjects: ['forestry'] }]);
    expect(() => loadContent(dir)).toThrowError(/entry #1.*"id" must be lowercase/s);
    expect(() => loadContent(dir)).toThrowError(/entry #2 \("ok"\): "subjects" must list one or more of "field", "software", "research"/);
  });

  it('requires alt text and pixel sizes on every image', () => {
    const dir = fixture(site, [{ id: 'p', title: 'P', subjects: ['field'], media: [{ src: '/media/p/a.webp', alt: ' ' }] }]);
    expect(() => loadContent(dir)).toThrowError(/needs "alt" text[\s\S]*needs "width" and "height"/);
    const noAlt = fixture({ ...site, portrait: { src: '/me.webp', width: 1, height: 1 } }, []);
    expect(() => loadContent(noAlt)).toThrowError(/"portrait": image "\/me.webp" needs "alt"/);
  });

  it('validates the hero, the contact prompt and the CV link', () => {
    expect(() => loadContent(fixture({ ...site, headline: undefined }, []))).toThrowError(/missing "headline"/);
    expect(() => loadContent(fixture({ ...site, statements: ['ok', ''] }, []))).toThrowError(/"statements" must be a list/);
    expect(() => loadContent(fixture({ ...site, contact: { text: 'x' } }, []))).toThrowError(/"contact" needs a "heading"/);
    expect(() => loadContent(fixture({ ...site, cv: 'https://x.test/cv.html' }, []))).toThrowError(/"cv" must be a link to a PDF/);
  });

  it('reads now.json and checks its date', () => {
    expect(loadContent(fixture(site, [], { 'now.json': '{"text":"Busy","updated":"2026-11-04"}' })).now?.text).toBe('Busy');
    expect(() => loadContent(fixture(site, [], { 'now.json': '{"text":"Busy","updated":"Nov"}' }))).toThrowError(/"updated" must be a date/);
  });

  it('lists only images that are missing from /public', () => {
    const entries = [{ id: 'p', title: 'P', subjects: ['field'], media: [{ src: '/favicon.svg', alt: 'x', width: 1, height: 1, srcset: [{ src: '/nope-640.webp', width: 640 }] }] }] as Entry[];
    expect(missingFiles(root, { site: { ...site, portrait: { src: '/portrait.webp', alt: 'Me', width: 1, height: 1 } }, entries })).toEqual(['/portrait.webp', '/nope-640.webp']);
  });
});

describe('notes', () => {
  const note = '---\ntitle: Soil checklist\ndate: 2026-11-20\nsummary: What a sample records.\n---\n\nText **here**.';

  it('parses the header and body, and explains a bad header', () => {
    expect(parseNote('soil-checklist', note).note).toMatchObject({ slug: 'soil-checklist', title: 'Soil checklist', date: '2026-11-20', summary: 'What a sample records.' });
    expect(parseNote('x', 'no header').problems[0]).toMatch(/must start with a --- header/);
    expect(parseNote('Bad Name', '---\ntitle: T\ndate: 20.11.2026\n---\nx').problems.join()).toMatch(/file name must be lowercase[\s\S]*"date:" must be YYYY-MM-DD/);
  });

  it('loads notes newest first, skipping drafts and the README', () => {
    const dir = fixture(site, []);
    fs.writeFileSync(path.join(dir, 'content/notes/older.md'), note.replace('2026-11-20', '2026-10-01'));
    fs.writeFileSync(path.join(dir, 'content/notes/newer.md'), note);
    fs.writeFileSync(path.join(dir, 'content/notes/_draft.md'), note);
    fs.writeFileSync(path.join(dir, 'content/notes/README.md'), '# How to');
    expect(loadContent(dir).notes.map((n) => n.slug)).toEqual(['newer', 'older']);
  });

  it('hides the Notes section until there is a note, then shows the newest three and writes a page for each', () => {
    expect(renderMain(content([]), opts)).not.toContain('id="notes"');
    const notes: Note[] = ['a', 'b', 'c', 'd'].map((s, i) => ({ slug: s, title: `Note ${s}`, date: `2026-11-0${4 - i}`, body: 'Body' }));
    const html = renderMain(content([], { notes }), opts);
    expect(html).toContain('id="notes"');
    expect(html).toContain('href="/notes/a/"');
    expect(html).not.toContain('href="/notes/d/"');
    expect(html).toContain('All 4 notes');
    const pages = renderNotePages(content([], { notes }), opts);
    expect(Object.keys(pages)).toEqual(['notes/index.html', 'notes/a/index.html', 'notes/b/index.html', 'notes/c/index.html', 'notes/d/index.html']);
    expect(pages['notes/a/index.html']).toMatch(/<h1 class="note-heading">Note a<\/h1>[\s\S]*datetime="2026-11-04"/i);
  });
});

describe('page rendering', () => {
  const entries: Entry[] = [
    { id: 'strong', title: 'Strong proof', subjects: ['field'], summary: 'Card text', problem: 'The problem.', did: '- Did it.', result: 'It worked.', tryIt: { label: 'Try it', href: 'https://x.test/app' }, links: [{ label: 'Code', href: 'https://x.test/code' }] },
    { id: 'plan', title: 'A plan', subjects: ['research'], status: 'in-progress', subtitle: 'Planned: something' },
    { id: 'plain', title: 'Card only', subjects: ['software'], summary: 'Nothing more to say' },
  ];

  it('keeps finished work in JSON order and puts unfinished work in Learning now, after it', () => {
    const html = renderMain(content(entries), opts);
    expect(html).toMatch(/id="work"[\s\S]*Strong proof[\s\S]*Card only[\s\S]*id="learning"[\s\S]*A plan/);
    expect(html).toMatch(/id="learning"[\s\S]*Planned: something/);
    expect(html).not.toContain('data-open="plan"');
  });

  it('says on the card what kind of proof the panel holds', () => {
    expect(proofKinds(entries[0])).toEqual(['working version', 'live site']);
    expect(
      proofKinds({ id: 'x', title: 'X', subjects: ['software'], links: [{ label: 'C', href: 'https://github.com/a/b' }, { label: 'L', href: 'https://github.com/a/b/blob/main/log.csv' }], proofNoteShort: 'certificate' }),
    ).toEqual(['code', 'data', 'certificate']);
    expect(renderMain(content(entries), opts)).toMatch(/class="card-proof"><span class="card-proof-label">Proof:<\/span> working version, live site/);
    expect(renderMain(content([entries[2]]), opts)).not.toContain('card-proof');
  });

  it('tags entries by subject', () => {
    expect(renderMain(content(entries), opts)).toMatch(/class="card-subjects"><span class="visually-hidden">Subject: <\/span><span class="subject">Field<\/span>/);
  });

  it('opens a panel only when it adds something, laid out as problem, what I did, result, proof', () => {
    const t = renderTemplates(content(entries), opts);
    expect(t).toContain('id="detail-strong"');
    expect(t).not.toContain('detail-plain');
    expect(t).not.toContain('detail-plan');
    expect(t).toMatch(/The problem[\s\S]*What I did[\s\S]*Result[\s\S]*Proof[\s\S]*Try it[\s\S]*Code/);
  });

  it('shows the headline, three statements, the Currently line and Email + CV in the hero', () => {
    const s = { ...site, statements: ['First.', 'Second.', 'Third.'], contact: { heading: 'Hiring?', text: 'Say hello.' }, location: 'Joensuu, Finland' };
    const html = renderMain({ site: s, entries, notes: [], now: { text: 'Studying', updated: '2026-11-04' } }, { ...opts, cv: 'https://x.test/cv.pdf' });
    expect(html).toContain('class="hero-headline">Who I am.<');
    expect(html).toMatch(/<ol class="statements">.*First\..*Second\..*Third\./s);
    expect(html).toMatch(/Currently<\/strong> <span>Studying<\/span>[\s\S]*November 2026/);
    expect(html).toMatch(/class="hero-actions"><a [^>]*href="mailto:a@x.test">Email me<\/a><a [^>]*href="https:\/\/x.test\/cv.pdf"/);
    expect(html).toMatch(/aria-label="On this page"[\s\S]*href="#work"[\s\S]*href="#learning"[\s\S]*href="#contact"/);
    expect(html).toMatch(/id="contact-h"[^>]*>Hiring\?</);
  });

  it('shows no image box when the image file is missing, and a responsive image when it exists', () => {
    const portrait = { src: '/me.webp', alt: 'David in the forest', width: 800, height: 800, srcset: [{ src: '/me-400.webp', width: 400 }, { src: '/me.webp', width: 800 }] };
    const s = { ...site, portrait };
    expect(renderMain({ ...content([]), site: s }, { missing: new Set(['/me.webp']) })).not.toContain('<img');
    const html = renderMain({ ...content([]), site: s }, { missing: new Set(['/me-400.webp']) });
    expect(html).toMatch(/<img src="\/me.webp" srcSet="\/me.webp 800w" sizes="[^"]+" alt="David in the forest" width="800" height="800" loading="eager"/);
  });

  it('has no search box and no scroll-in animation', () => {
    const html = renderMain(content(entries), opts);
    expect(html).not.toContain('role="search"');
    const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
    expect(css).not.toContain('animation-timeline');
  });
});
