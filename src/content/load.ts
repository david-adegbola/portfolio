// Build-time only (runs inside vite.config.ts, in Node).
// Reads content/ and fails the build with a readable message if anything is malformed, so
// editing the files by hand is safe.
import fs from 'node:fs';
import path from 'node:path';
import { type Entry, type Image, type Note, type Now, type Site, SUBJECTS } from './types.ts';

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`Could not read ${path.basename(file)}: ${(err as Error).message}`, { cause: err });
  }
}

const isLink = (l: unknown) =>
  !!l && typeof l === 'object' && typeof (l as { label?: unknown }).label === 'string' && typeof (l as { href?: unknown }).href === 'string';

function imageProblems(img: Partial<Image> | undefined, where: string): string[] {
  if (!img || typeof img !== 'object') return [`${where}: an image must be an object`];
  const p: string[] = [];
  if (typeof img.src !== 'string' || !img.src) p.push(`${where}: image needs "src"`);
  if (typeof img.alt !== 'string' || !img.alt.trim()) p.push(`${where}: image "${img.src ?? '?'}" needs "alt" text (say what's in it)`);
  if (typeof img.width !== 'number' || typeof img.height !== 'number')
    p.push(`${where}: image "${img.src ?? '?'}" needs "width" and "height" (the file's size in pixels)`);
  for (const s of img.srcset ?? []) {
    if (typeof s?.src !== 'string' || typeof s?.width !== 'number') p.push(`${where}: each "srcset" item needs "src" and "width"`);
  }
  return p;
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
    if (typeof e.title !== 'string' || !e.title.trim()) problems.push(`${where}: missing "title"`);
    if (!Array.isArray(e.subjects) || !e.subjects.length || e.subjects.some((s: unknown) => !SUBJECTS.includes(s as never)))
      problems.push(`${where}: "subjects" must list one or more of ${SUBJECTS.map((s) => `"${s}"`).join(', ')}`);
    if (e.status !== undefined && e.status !== 'in-progress') problems.push(`${where}: "status" can only be "in-progress"`);
    if (e.lang !== undefined && (typeof e.lang !== 'string' || !/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(e.lang)))
      problems.push(`${where}: "lang" must be a language code such as "fi"`);
    if (e.when !== undefined && typeof e.when !== 'string') problems.push(`${where}: "when" must be text, e.g. "2026" or "Aug–Oct 2025"`);
    if (e.tryIt !== undefined && !isLink(e.tryIt)) problems.push(`${where}: "tryIt" needs "label" and "href"`);
    if (e.links !== undefined && (!Array.isArray(e.links) || !e.links.every(isLink))) problems.push(`${where}: every link needs "label" and "href"`);
    if (e.proofLine !== undefined && (!Array.isArray(e.proofLine) || e.proofLine.some((s: unknown) => typeof s !== 'string')))
      problems.push(`${where}: "proofLine" must be a list of short texts`);
    for (const m of e.media ?? []) problems.push(...imageProblems(m, where));
  });
  return problems;
}

function validateSite(site: Site): string[] {
  const problems: string[] = [];
  for (const key of ['name', 'url', 'title', 'headline', 'email', 'description'] as const) {
    if (typeof site[key] !== 'string' || !site[key].trim()) problems.push(`site.json: missing "${key}"`);
  }
  if (site.statements !== undefined && (!Array.isArray(site.statements) || site.statements.some((s) => typeof s !== 'string' || !s.trim())))
    problems.push('site.json: "statements" must be a list of short sentences');
  if (site.contact !== undefined && typeof site.contact?.heading !== 'string') problems.push('site.json: "contact" needs a "heading"');
  if (site.cv !== undefined && (typeof site.cv !== 'string' || !/^(https:\/\/|\/)\S+\.pdf$/.test(site.cv)))
    problems.push('site.json: "cv" must be a link to a PDF, e.g. "https://…/cv.pdf" or "/cv.pdf"');
  if (site.portrait !== undefined) problems.push(...imageProblems(site.portrait, 'site.json "portrait"'));
  for (const key of ['about', 'offer', 'computing'] as const) {
    const v = site[key];
    if (v !== undefined && (!Array.isArray(v) || v.some((s) => typeof s !== 'string'))) problems.push(`site.json: "${key}" must be a list of text`);
  }
  for (const ed of site.education ?? []) {
    if (!ed.title || !ed.place || !ed.years) problems.push('site.json: every "education" item needs "title", "place" and "years"');
  }
  for (const g of site.skills ?? []) {
    if (typeof g.group !== 'string' || !Array.isArray(g.items)) problems.push('site.json: every "skills" item needs "group" and "items"');
  }
  return problems;
}

function loadNow(root: string): { now?: Now; problems: string[] } {
  const file = path.join(root, 'content/now.json');
  if (!fs.existsSync(file)) return { problems: [] };
  const now = readJson(file) as Now;
  const problems: string[] = [];
  if (typeof now?.text !== 'string' || !now.text.trim()) problems.push('now.json: missing "text"');
  if (typeof now?.updated !== 'string' || !DATE.test(now.updated)) problems.push('now.json: "updated" must be a date, YYYY-MM-DD');
  return { now, problems };
}

/**
 * A note is content/notes/<slug>.md: a small header between --- lines, then Markdown.
 *   ---
 *   title: What a soil sample has to record
 *   date: 2026-11-20
 *   summary: One sentence for the homepage (optional).
 *   ---
 * The file name is the URL: /portfolio/notes/<slug>/. Files starting with "_" are drafts and
 * are skipped.
 */
export function parseNote(slug: string, text: string): { note?: Note; problems: string[] } {
  const where = `notes/${slug}.md`;
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { problems: [`${where}: must start with a --- header (title, date)`] };
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([a-z]+):\s*(.*)$/.exec(line.trim());
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  const problems: string[] = [];
  if (!ID.test(slug)) problems.push(`${where}: the file name must be lowercase words joined by dashes`);
  if (!meta.title) problems.push(`${where}: missing "title:"`);
  if (!meta.date || !DATE.test(meta.date)) problems.push(`${where}: "date:" must be YYYY-MM-DD`);
  if (!m[2].trim()) problems.push(`${where}: the note has no text`);
  if (problems.length) return { problems };
  return { note: { slug, title: meta.title, date: meta.date, summary: meta.summary || undefined, body: m[2] }, problems };
}

function loadNotes(root: string): { notes: Note[]; problems: string[] } {
  const dir = path.join(root, 'content/notes');
  if (!fs.existsSync(dir)) return { notes: [], problems: [] };
  const notes: Note[] = [];
  const problems: string[] = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.md') || file.startsWith('_') || file.toLowerCase() === 'readme.md') continue;
    const r = parseNote(file.slice(0, -3), fs.readFileSync(path.join(dir, file), 'utf8'));
    problems.push(...r.problems);
    if (r.note) notes.push(r.note);
  }
  // Newest first.
  notes.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  return { notes, problems };
}

export interface Content {
  site: Site;
  entries: Entry[];
  now?: Now;
  notes: Note[];
}

export function loadContent(root: string): Content {
  const site = readJson(path.join(root, 'content/site.json')) as Site;
  const entries = readJson(path.join(root, 'content/projects.json'));
  const now = loadNow(root);
  const notes = loadNotes(root);
  const problems = [...validateEntries(entries), ...validateSite(site), ...now.problems, ...notes.problems];
  if (problems.length) throw new Error(`Content problems:\n  - ${problems.join('\n  - ')}`);
  return { site, entries: entries as Entry[], now: now.now, notes: notes.notes };
}

/** Warn (don't fail) about files referenced from the content that aren't in /public yet. */
export function missingFiles(root: string, { site, entries }: Pick<Content, 'site' | 'entries'>): string[] {
  const images = [...(site.portrait ? [site.portrait] : []), ...entries.flatMap((e) => e.media ?? [])];
  const refs = images.flatMap((img) => [img.src, ...(img.srcset ?? []).map((s) => s.src)]);
  return [...new Set(refs)].filter((src) => !fs.existsSync(path.join(root, 'public', src)));
}
