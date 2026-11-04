// /styleguide/: every token and component in every variant and state (DESIGN.md §3.6). Light only. Not linked from the site and marked noindex.
import { type ReactNode, useState } from 'react';
import { IconSearch } from '../components/icons.tsx';
import { IndexItem, IndexList } from '../components/patterns/IndexList.tsx';
import { Badge } from '../components/ui/badge.tsx';
import { Button } from '../components/ui/button.tsx';
import { Treeline } from '../components/patterns/Treeline.tsx';
import { Sheet, SheetContent, SheetTitle } from '../components/ui/sheet.tsx';
import { SEASON_NAMES, SEASONS } from '../seasons.ts';

const COLOURS = [
  ['background', 'Page, paper'],
  ['card', 'Raised surfaces'],
  ['muted', 'Subtle fill, tracks'],
  ['accent', 'Pressed / selected fill'],
  ['foreground', 'Ink · text'],
  ['muted-foreground', 'Secondary text'],
  ['primary', 'Links, current, primary action'],
  ['attention', 'In progress'],
  ['season', "Today's season: numbers, glyphs, drawing details"],
  ['found', 'Autumn birch leaves (decoration only)'],
  ['glyph', 'In-progress glyph (decoration only)'],
  ['line-art', 'Tree drawing lines (decoration only)'],
  ['border', 'Dividers'],
  ['input', 'Control borders'],
] as const;

const TYPE = [
  ['--fs-56', 'Name · Fraunces', 'font-serif'],
  ['--fs-40', 'Display · Fraunces', 'font-serif'],
  ['--fs-32', 'Section title · Fraunces', 'font-serif'],
  ['--fs-20', 'Subtitle · Inter Tight', 'font-sans'],
  ['--fs-16', 'Body · Inter Tight', 'font-sans'],
  ['--fs-14', 'Small · Inter Tight', 'font-sans'],
  ['--fs-12', '2026 · forestry · GIS · IBM Plex Mono', 'font-mono'],
] as const;

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border-t border-border py-6">
      <h3 className="font-mono text-xs tracking-wide text-muted-foreground">{title}</h3>
      {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// `theme` only keeps ids and labels unique; there is one (light) theme.
function Theme({ theme }: { theme: 'light' }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background p-6 text-foreground">

      <Block title="COLOUR">
        <ul className="grid grid-cols-2 gap-3">
          {COLOURS.map(([name, use]) => (
            <li key={name} className="flex items-center gap-3">
              <span className="size-9 shrink-0 rounded-md border border-border" style={{ background: `var(--${name})` }} />
              <span className="min-w-0 text-sm leading-tight">
                <span className="block font-mono text-xs">--{name}</span>
                <span className="text-muted-foreground">{use}</span>
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="TYPE" note="Primer scale 12 / 14 / 16 / 20 / 32 / 40, plus 56 for the name.">
        <ul className="space-y-2">
          {TYPE.map(([size, label, family]) => (
            <li key={size} className={`${family} leading-tight`} style={{ fontSize: `var(${size})` }}>
              {label} <span className="font-mono text-xs text-muted-foreground">{size}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="BUTTON" note="Variants: default (primary, one per group) · outline · ghost · link. 44px tall on touch screens.">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Email</Button>
          <Button variant="outline">CV</Button>
          <Button variant="ghost">Clear</Button>
          <Button variant="link" size="inline">See my work</Button>
          <Button variant="ghost" size="icon" aria-label="Search">
            <IconSearch />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline">
            Small
          </Button>
          <Button size="lg">Large</Button>
          <Button variant="outline" aria-disabled="true">
            Inactive (aria-disabled)
          </Button>
        </div>
      </Block>

      <Block title="BADGE">
        <div className="flex flex-wrap gap-2">
          <Badge variant="attention">In progress</Badge>
          <Badge variant="outline">Research</Badge>
          <Badge>2026</Badge>
        </div>
      </Block>

      <Block title="TREELINE (four seasons)" note="The page shows only today's season in Finland (<html data-season>); here each is forced with data-season.">
        <div className="grid gap-3 overflow-hidden">
          {SEASONS.map((s) => (
            <div key={s} data-season={s} className="min-w-0">
              <p className="font-mono text-xs" style={{ color: 'var(--season)' }}>
                {SEASON_NAMES[s][0]} · {SEASON_NAMES[s][1]}
              </p>
              {/* Contained here instead of full-bleed (utilities beat the components layer). */}
              <Treeline className="mx-0 w-full" seed={7} />
            </div>
          ))}
        </div>
      </Block>

      <Block
        title="INDEX ITEM (IndexList)"
        note="Number + glyph in the season colour, year on the right, arrow when it opens a panel. Solid glyph on the card a search just went to; grey and dashed while in progress."
      >
        <IndexList>
          <IndexItem id={`sg-${theme}-1`} index={1} kind="marker" title="Opens a panel" opens year={2026} subtitle="Default item" summary="One or two sentences: problem, method, result." tags={['forestry', 'GIS']} />
          <IndexItem id={`sg-${theme}-2`} index={2} kind="log-pile" title="Active item" year={2025} subtitle="After a search went to it" className="is-active" />
          <IndexItem id={`sg-${theme}-3`} index={3} kind="marker" title="Planned item" subtitle="One line, no panel" inProgress />
          <IndexItem id={`sg-${theme}-4`} index={4} kind="log" title="Small item" opens subtitle="Built with AI agents" small />
        </IndexList>
      </Block>

      <Block title="SECTION NAV" note="Current section: spruce underline (aria-current).">
        <nav className="section-nav" aria-label={`Example sections (${theme})`}>
          <ul role="list">
            <li>
              <a href="#styleguide" aria-current="location">
                Work
              </a>
            </li>
            <li>
              <a href="#styleguide">Built with AI</a>
            </li>
            <li>
              <a href="#styleguide">Contact</a>
            </li>
          </ul>
        </nav>
      </Block>

      <Block title="ELEVATION · RADIUS">
        <div className="flex flex-wrap gap-4">
          <div className="grid size-24 place-items-center rounded-sm bg-card text-xs shadow-resting">sm · resting</div>
          <div className="grid size-24 place-items-center rounded-md bg-card text-xs shadow-resting">md · resting</div>
          <div className="grid size-24 place-items-center rounded-lg bg-card text-xs shadow-floating">lg · floating</div>
        </div>
      </Block>
    </div>
  );
}

export function Styleguide() {
  const [open, setOpen] = useState(false);
  return (
    <main className="mx-auto max-w-[90rem] bg-background p-4 text-foreground sm:p-8">
      <header className="pb-6">
        <h1 className="font-serif text-[length:var(--fs-40)] leading-tight">Styleguide</h1>
        <p className="mt-2 max-w-[62ch] text-muted-foreground">
          Field notebook tokens and the shadcn components, aligned with Primer (see design-research/primer/). Tab through to see focus rings; hover and
          press to see the states.
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={() => setOpen(true)}>
            Open the detail sheet
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-[48rem]">
        <Theme theme="light" />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent aria-describedby={undefined}>
          <div className="panel-inner">
            <header className="panel-header">
              <p className="eyebrow">2026 · Built with AI agents</p>
              <SheetTitle className="panel-title">Detail sheet</SheetTitle>
              <p className="panel-subtitle">Side sheet on wide screens, full screen on phones. Esc or the close button closes it.</p>
            </header>
            <p className="panel-summary">The summary sits here, then facts, the write-up, media and links.</p>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
