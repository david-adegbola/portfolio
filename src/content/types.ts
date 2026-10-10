export type Zone = 'forest' | 'lake';

export interface Link {
  label: string;
  href: string;
}

export interface Media {
  type: 'image';
  src: string;
  alt: string;
}

interface BaseEntry {
  id: string;
  zone: Zone;
  title: string;
  tags?: string[];
  year?: number;
  /** In-progress entries show as a faint, one-line card with no detail panel. */
  status?: 'in-progress';
  sceneObject?: string;
}

export interface ProjectEntry extends BaseEntry {
  type?: 'project';
  subtitle?: string;
  role?: string;
  tools?: string[];
  summary?: string;
  /** Markdown. */
  body?: string;
  media?: Media[];
  links?: Link[];
}

export interface ResearchEntry extends BaseEntry {
  type: 'research';
  authors: string[];
  context?: string;
  abstract: string;
  pdf?: string;
}

export type Entry = ProjectEntry | ResearchEntry;

export interface Site {
  name: string;
  /** The live site's address, with trailing slash. Used for the share image and canonical link. */
  url: string;
  title: string;
  intro: string;
  description: string;
  email: string;
  about?: string;
  skills?: string[];
  links?: Link[];
  /** Suggestion chips under the search input. Chips with no matches are hidden automatically. */
  searchChips?: string[];
}

export const isResearch = (e: Entry): e is ResearchEntry => e.type === 'research';
export const isInProgress = (e: Entry) => e.status === 'in-progress';
