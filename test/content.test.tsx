import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/content/load.ts';
import { objectKind } from '../src/content/objects.ts';
import { renderMain, renderTemplates, sortEntries } from '../src/content/render.tsx';
import type { Entry } from '../src/content/types.ts';

const root = path.resolve(__dirname, '..');
const opts = { missing: new Set<string>() };

/** A throwaway project folder with the given content files. */
function fixture(site: object, projects: unknown): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-'));
  fs.mkdirSync(path.join(dir, 'content'));
  fs.writeFileSync(path.join(dir, 'content/site.json'), JSON.stringify(site));
  fs.writeFileSync(path.join(dir, 'content/projects.json'), JSON.stringify(projects));
  return dir;
}
const site = { name: 'N', url: 'https://x.test/', title: 'T', intro: 'I', description: 'D', email: 'a@x.test' };

describe('content loader', () => {
  it('accepts the real content', () => {
    expect(() => loadContent(root)).not.toThrow();
  });

  it('names the entry and field that is wrong', () => {
    const dir = fixture(site, [{ id: 'Bad ID', zone: 'sea', title: '' }, { id: 'ok', zone: 'forest', title: 'Ok', year: '2026' }]);
    expect(() => loadContent(dir)).toThrowError(/entry #1.*"id" must be lowercase/s);
    expect(() => loadContent(dir)).toThrowError(/"zone" must be "forest" or "lake"/);
    expect(() => loadContent(dir)).toThrowError(/entry #2 \("ok"\): "year" must be a number/);
  });

  it('requires authors and abstract on research', () => {
    const dir = fixture(site, [{ id: 'p', type: 'research', zone: 'forest', title: 'P' }]);
    expect(() => loadContent(dir)).toThrowError(/research needs "authors"[\s\S]*research needs "abstract"/);
  });
});

describe('objectKind', () => {
  it('maps logs by zone and falls back by type', () => {
    expect(objectKind({ zone: 'forest', sceneObject: 'log' })).toBe('log-pile');
    expect(objectKind({ zone: 'lake', sceneObject: 'log' })).toBe('log');
    expect(objectKind({ zone: 'forest', type: 'research' })).toBe('tree-ring');
    expect(objectKind({ zone: 'lake' })).toBe('log');
    expect(objectKind({ zone: 'forest' })).toBe('marker');
  });
});

describe('page rendering', () => {
  const entries: Entry[] = [
    { id: 'lake-1', zone: 'lake', title: 'Lake one' },
    { id: 'wip', zone: 'forest', title: 'Work in progress', status: 'in-progress' },
    { id: 'forest-1', zone: 'forest', title: 'Forest one', summary: 'Summary text', role: 'Did things' },
    { id: 'forest-2', zone: 'forest', title: 'Forest two', summary: 'Shown on the card already' },
  ];

  it('sorts forest first and in-progress last within a zone', () => {
    expect(sortEntries(entries).map((e) => e.id)).toEqual(['forest-1', 'forest-2', 'wip', 'lake-1']);
  });

  it('puts every entry in the HTML, and opens a panel only when it has more than the card shows', () => {
    const html = renderMain(site, entries, opts);
    for (const e of entries) expect(html).toContain(e.title);
    const templates = renderTemplates(entries, opts);
    expect(templates).toContain('id="detail-forest-1"');
    expect(templates).not.toContain('detail-forest-2');
    expect(templates).not.toContain('detail-wip');
    expect(html).not.toContain('data-open="forest-2"');
  });

  it('renders the landing statements, numbered entries, the section nav and the contact prompt', () => {
    const s = {
      ...site,
      about: 'About text',
      statements: ['First.', 'Second.', 'Third.'],
      contact: { heading: 'Hiring?', text: 'Say hello.' },
      location: 'Joensuu, Finland',
    };
    const html = renderMain(s, entries, { ...opts, cv: 'https://x.test/cv.pdf' });
    expect(html).toMatch(/<ol class="statements">.*First\..*Second\..*Third\./s);
    // Entries are an ordered list, numbered per section; the year shows on finished ones only.
    expect(html).toMatch(/id="work"[\s\S]*<ol class="card-list">[\s\S]*class="card-num">01<[\s\S]*class="card-num">02</);
    expect(html).toMatch(/aria-label="On this page"[\s\S]*href="#work"[\s\S]*href="#about"[\s\S]*href="#contact"/);
    expect(html).not.toContain('href="#research"');
    expect(html).toMatch(/id="contact-h"[^>]*>Hiring\?</);
    expect(html).toContain('Open my CV (PDF)');
    expect(html).toContain('Joensuu, Finland');
  });

  it('validates statements and the contact prompt', () => {
    expect(() => loadContent(fixture({ ...site, statements: ['ok', ''] }, []))).toThrowError(/"statements" must be a list/);
    expect(() => loadContent(fixture({ ...site, contact: { text: 'x' } }, []))).toThrowError(/"contact" needs a "heading"/);
  });

  it('rejects a CV link that is not a PDF', () => {
    const dir = fixture({ ...site, cv: 'https://x.test/cv.html' }, []);
    expect(() => loadContent(dir)).toThrowError(/"cv" must be a link to a PDF/);
  });

  it('leaves out an empty research section', () => {
    expect(renderMain(site, entries, opts)).not.toContain('id="research"');
  });
});
