// Which forest object stands for an entry: the small line drawing on its card (components/icons.tsx
// Glyph). Picked by the entry's "sceneObject" in projects.json, else by zone.
export type ObjectKind = 'marker' | 'log-pile' | 'log' | 'clearing' | 'tree-ring' | 'lamp';

interface Describable {
  zone: 'forest' | 'lake';
  type?: string;
  sceneObject?: string;
}

export function objectKind(e: Describable): ObjectKind {
  switch (e.sceneObject) {
    case 'marker':
    case 'clearing':
    case 'tree-ring':
      return e.sceneObject;
    case 'log':
      return e.zone === 'lake' ? 'log' : 'log-pile';
  }
  if (e.type === 'research') return 'tree-ring';
  return e.zone === 'lake' ? 'log' : 'marker';
}
