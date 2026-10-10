// Build-time only (runs inside vite.config.ts, in Node).
// Reads content/*.json and fails the build with a readable message if an entry is malformed,
// so editing the JSON by hand is safe.
import fs from 'node:fs';
import path from 'node:path';
import type { Entry, Site } from './types.ts';

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`Could not read ${path.basename(file)}: ${(err as Error).message}`);
  }
}

function validateEntries(raw: unknown): string[] {
  if (!Array.isArray(raw)) return ['projects.json must be a list: [ {...}, {...} ]'];
  const problems: string[] = [];
  const seen = new Set<string>();
  raw.forEach((e, i) => {
    const where = `entry #${i + 1}${e && typeof e.id === 'string' ? ` ("${e.id}")` : ''}`;
    if (!e || typeof e !== 'object') return problems.push(`${where}: not an object`);
    if (typeof e.id !== 'string' || !ID.test(e.id))
      problems.push(`${where}: "id" must be lowercase words joined by dashes, e.g. "forest-cover-map"`);
    else if (seen.has(e.id)) problems.push(`${where}: duplicate id`);
    else seen.add(e.id);
    if (e.zone !== 'forest' && e.zone !== 'lake') problems.push(`${where}: "zone" must be "forest" or "lake"`);
    if (typeof e.title !== 'string' || !e.title.trim()) problems.push(`${where}: missing "title"`);
    if (e.status !== undefined && e.status !== 'in-progress') problems.push(`${where}: "status" can only be "in-progress"`);
    if (e.type !== undefined && e.type !== 'project' && e.type !== 'research')
      problems.push(`${where}: "type" must be "research" or left out`);
    if (e.type === 'research') {
      if (!Array.isArray(e.authors) || !e.authors.length) problems.push(`${where}: research needs "authors"`);
      if (typeof e.abstract !== 'string') problems.push(`${where}: research needs "abstract"`);
    }
    if (e.year !== undefined && typeof e.year !== 'number') problems.push(`${where}: "year" must be a number, without quotes`);
    for (const m of e.media ?? []) {
      if (!m.src || !m.alt) problems.push(`${where}: every media item needs "src" and "alt"`);
    }
  });
  return problems;
}

export function loadContent(root: string): { site: Site; entries: Entry[] } {
  const site = readJson(path.join(root, 'content/site.json')) as Site;
  const entries = readJson(path.join(root, 'content/projects.json'));
  const problems = validateEntries(entries);
  for (const key of ['name', 'title', 'email'] as const) {
    if (typeof site[key] !== 'string') problems.push(`site.json: missing "${key}"`);
  }
  if (problems.length) throw new Error(`Content problems:\n  - ${problems.join('\n  - ')}`);
  return { site, entries: entries as Entry[] };
}

/** Warn (don't fail) about files referenced from the JSON that aren't in /public yet. */
export function missingFiles(root: string, entries: Entry[]): string[] {
  const refs = entries.flatMap((e) =>
    e.type === 'research' ? (e.pdf ? [e.pdf] : []) : (e.media ?? []).map((m) => m.src),
  );
  return refs.filter((src) => !fs.existsSync(path.join(root, 'public', src)));
}
