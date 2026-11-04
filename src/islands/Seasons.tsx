// The season switcher: a shadcn ToggleGroup styled as a Primer SegmentedControl. Pre-rendered at
// build time with nothing pressed, then hydrated: on the client it shows today's season in Finland
// or the visitor's earlier pick (useSyncExternalStore keeps hydration free of mismatches). Only
// shown while the forest is (see `.seasons` in styles.css).
import { useSyncExternalStore } from 'react';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group.tsx';
import { chooseSeason, initialSeason, type Season, seasonInFinland } from '../seasons.ts';

const SEASONS: [Season, string][] = [
  ['spring', 'Spring'],
  ['summer', 'Summer'],
  ['autumn', 'Autumn'],
  ['winter', 'Winter'],
];

/**
 * What the forest shows in each season, in plain words. The canvas itself is decorative, so this
 * caption is its text: shown beside the switcher and announced when the season changes.
 */
const CAPTIONS: Record<Season, [fi: string, text: string]> = {
  spring: ['Kevät', 'Birches in first leaf, wood anemones beneath them.'],
  summer: ['Kesä', 'Full leaf, fireweed in the clearings, harebells by the path.'],
  autumn: ['Ruska', 'Birches gone gold, bilberry turning red, heather in flower.'],
  winter: ['Talvi', 'Snow on the spruces, bare birches, a frozen lake.'],
};

// The chosen season lives in sessionStorage and is announced with `season:change` (seasons.ts).
const subscribe = (onChange: () => void) => {
  document.addEventListener('season:change', onChange);
  return () => document.removeEventListener('season:change', onChange);
};
const noSubscribe = () => () => {};
const none = () => null;

export function SeasonSwitcher() {
  const season = useSyncExternalStore(subscribe, initialSeason, none);
  const today = useSyncExternalStore(noSubscribe, seasonInFinland, none);
  const caption = season ? CAPTIONS[season] : null;
  return (
    <>
      <p className="season-caption" id="season-caption" role="status">
        {caption && (
          <>
            <strong lang="fi">{caption[0]}.</strong> {caption[1]}
          </>
        )}
      </p>
      <ToggleGroup
        type="single"
        value={season ?? ''}
        aria-label="Season in the forest"
        onValueChange={(value) => {
          // A segmented control always keeps one choice: ignore attempts to unselect.
          if (value) chooseSeason(value as Season);
        }}
      >
        {SEASONS.map(([id, label]) => (
          <ToggleGroupItem key={id} value={id} className="relative">
            {label}
            {today === id && (
              <span className="season-now">
                <span className="visually-hidden">, now in Finland</span>
              </span>
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </>
  );
}
