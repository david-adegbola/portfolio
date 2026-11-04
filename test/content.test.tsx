import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/content/load.ts';
import { objectKind } from '../src/content/objects.ts';
import { renderMain, renderTemplates, sortEntries } from '../src/content/render.tsx';
import type { Entry } from '../src/content/types.ts';

const root = path.resolve(__dirname, '..');
const opts = { hasCv: false, missing: new Set<string>() };

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
    { id: 'forest-1', zone: 'forest', title: 'Forest one', summary: 'Summary text' },
  ];

  it('sorts forest first and in-progress last within a zone', () => {
    expect(sortEntries(entries).map((e) => e.id)).toEqual(['forest-1', 'wip', 'lake-1']);
  });

  it('puts every entry in the HTML, and gives a detail panel only to finished projects', () => {
    const html = renderMain(site, entries, opts);
    for (const e of entries) expect(html).toContain(e.title);
    const templates = renderTemplates(entries, opts);
    expect(templates).toContain('id="detail-forest-1"');
    expect(templates).not.toContain('detail-wip');
  });

  it('leaves out an empty research section', () => {
    expect(renderMain(site, entries, opts)).not.toContain('id="research"');
  });
});
