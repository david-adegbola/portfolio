import type { Zone } from './types.ts';

/** The client-side view of an entry, read from the JSON the build embeds in the page. */
export interface ClientEntry {
  id: string;
  zone: Zone;
  type: 'project' | 'research';
  title: string;
  subtitle?: string;
  tags: string[];
  status?: 'in-progress';
  sceneObject?: string;
}

export function readEntries(): ClientEntry[] {
  try {
    return JSON.parse(document.getElementById('entries-data')?.textContent ?? '[]');
  } catch {
    return [];
  }
}
