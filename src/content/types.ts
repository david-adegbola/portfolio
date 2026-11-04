// The content model. content/site.json → Site, content/projects.json → Entry[],
// content/now.json → Now, content/notes/*.md → Note[]. Validated in load.ts.

export interface Link {
  label: string;
  href: string;
}

/** What an entry is about. Shown as its tag; never how it was built. */
export type Subject = 'field' | 'software' | 'research';
export const SUBJECTS: Subject[] = ['field', 'software', 'research'];
export const SUBJECT_LABEL: Record<Subject, string> = { field: 'Field', software: 'Software', research: 'Research' };

/**
 * An image. `alt` is required (say what's in it); `width` and `height` are the file's pixel size,
 * so the page reserves the space and nothing jumps. Optional `srcset`: smaller/larger copies of the
 * same image, for responsive sizes. A missing file is left out, never shown as an empty box.
 */
export interface Image {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  srcset?: { src: string; width: number }[];
}

export interface Entry {
  id: string;
  title: string;
  /** Language of the title when it isn't English, e.g. "fi". */
  lang?: string;
  subjects: Subject[];
  /** Short date for the card: "2026", "Aug–Oct 2025". */
  when?: string;
  /** Unfinished or planned: listed under "Learning now", one line, no panel. */
  status?: 'in-progress';
  /** One line under the title. */
  subtitle?: string;
  /** Two sentences on the card: what it is and what came of it. */
  summary?: string;
  /** Panel fact, e.g. "Fitter, Axioma Servisas UAB". */
  role?: string;
  /** Panel: the problem or the job. Markdown. */
  problem?: string;
  /** Panel: what David did. Markdown. */
  did?: string;
  /** Panel: what came of it. Markdown. Leave out rather than guess. */
  result?: string;
  /** Panel proof: a working version people can open ("Try it"), shown first. */
  tryIt?: Link;
  /** Panel proof: code, documents, live pages. */
  links?: Link[];
  /** Panel proof that isn't a link, e.g. "Work certificate available on request." */
  proofNote?: string;
  /** The same, in a few words for the card's "Proof:" line, e.g. "work certificate (on request)". */
  proofNoteShort?: string;
  /** Overrides the card's "Proof:" line when the automatic one would mislead. */
  proofLine?: string[];
  /** Images. The first one with `cover: true` also shows on the homepage card. */
  media?: (Image & { cover?: boolean })[];
}

export interface Education {
  title: string;
  place: string;
  years: string;
  note?: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface Site {
  name: string;
  /** The live site's address, with trailing slash. Used for the share image and canonical link. */
  url: string;
  /** Short positioning, for the browser tab and link previews. */
  title: string;
  /** The hero sentence under the name: who David is and what he offers. */
  headline: string;
  /** Three numbered lines under the headline that build to a point. */
  statements?: string[];
  portrait?: Image;
  /** Where David is, e.g. "Joensuu, Finland". Shown in the contact block and footer. */
  location?: string;
  /** The closing prompt above the email address. */
  contact?: { heading: string; text?: string };
  description: string;
  email: string;
  /** Link to the CV PDF (e.g. the one the CV repo publishes). Without it, /cv.pdf is used if it exists. */
  cv?: string;
  /** Paragraphs. */
  about?: string[];
  /** "What I can do for you": the end of About. */
  offer?: string[];
  /** The one line about how the software is made. */
  softwareNote?: string;
  /** The intro of the Learning now block. */
  learningNote?: string;
  education?: Education[];
  /** Hands-on IT work, one line each. */
  computing?: string[];
  skills?: SkillGroup[];
  links?: Link[];
}

/** content/now.json: the "Currently" line. */
export interface Now {
  text: string;
  /** YYYY-MM-DD: when the line was last true. */
  updated: string;
}

/** content/notes/<slug>.md */
export interface Note {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  summary?: string;
  /** Markdown body. */
  body: string;
}

export const isInProgress = (e: Entry) => e.status === 'in-progress';
