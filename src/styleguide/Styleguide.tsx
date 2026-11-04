// /styleguide/: every token and component in every variant and state (DESIGN.md §3.6). Light only.
// Not linked from the site and marked noindex.
import { type ReactNode, useState } from 'react';
import { IndexItem, IndexList } from '../components/patterns/IndexList.tsx';
import { Rings } from '../components/patterns/Rings.tsx';
import { Treeline } from '../components/patterns/Treeline.tsx';
import { Button } from '../components/ui/button.tsx';
import { Sheet, SheetContent, SheetTitle } from '../components/ui/sheet.tsx';
import { SEASON_NAMES, SEASONS } from '../seasons.ts';

const COLOURS = [
  ['background', 'Page, paper'],
  ['card', 'Raised surfaces'],
  ['muted', 'Subtle fill'],
  ['accent', 'Pressed / selected fill'],
  ['foreground', 'Ink · text'],
  ['muted-foreground', 'Secondary text'],
  ['primary', 'Links, current, primary action'],
  ['season', "Today's season: numerals, ring centres, drawing details"],
  ['found', 'Autumn birch leaves (decoration only)'],
  ['line-art', 'Drawing lines (decoration only)'],
  ['border', 'Dividers, rules'],
  ['input', 'Control borders, dashed "planned" boxes'],
] as const;

const TYPE = [
  ['--fs-56', 'Name · Fraunces', 'font-serif'],
  ['--fs-40', 'Note title · Fraunces', 'font-serif'],
  ['--fs-32', 'Section title · Fraunces', 'font-serif'],
  ['--fs-20', 'Headline, card title · Inter Tight', 'font-sans'],
  ['--fs-16', 'Body · Inter Tight', 'font-sans'],
  ['--fs-14', 'Small: dates, subjects · Inter Tight', 'font-sans'],
] as const;

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border-t border-border py-6">
      <h3 className="font-serif text-[length:var(--fs-20)]">{title}</h3>
      {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Styleguide() {
  const [open, setOpen] = useState(false);
  const missing = new Set<string>();
  return (
    <main className="mx-auto max-w-[48rem] bg-background p-4 text-foreground sm:p-8">
      <header className="pb-6">
        <h1 className="font-serif text-[length:var(--fs-40)] leading-tight">Styleguide</h1>
        <p className="mt-2 max-w-[62ch] text-muted-foreground">
          Field notebook tokens and the shadcn components, aligned with Primer (see design-research/primer/). Tab through to see focus rings; hover and
          press to see the states.
        </p>
      </header>

      <Block title="Colour">
        <ul className="grid grid-cols-2 gap-3">
          {COLOURS.map(([name, use]) => (
            <li key={name} className="flex items-center gap-3">
              <span className="size-9 shrink-0 rounded-md border border-border" style={{ background: `var(--${name})` }} />
              <span className="min-w-0 text-sm leading-tight">
                <span className="block font-medium">--{name}</span>
                <span className="text-muted-foreground">{use}</span>
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Type">
        <ul className="grid gap-2">
          {TYPE.map(([size, label, family]) => (
            <li key={size} className={family} style={{ fontSize: `var(${size})`, lineHeight: 1.2 }}>
              {label} <span className="font-sans text-xs text-muted-foreground">{size}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Email me</Button>
          <Button variant="outline">Open my CV (PDF)</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link" size="inline">
            Link
          </Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <Button variant="outline" onClick={() => setOpen(true)}>
            Open the detail sheet
          </Button>
        </div>
      </Block>

      <Block title="Rings" note="Tree rings and map contours in one drawing. Section mark (4 rings) and hero figure (12 rings); the centre takes the season colour.">
        <div className="flex items-center gap-6">
          <Rings count={4} seed={11} className="rings--mark" />
          <Rings count={12} seed={5} className="size-40" />
        </div>
      </Block>

      <Block title="Treeline (four seasons)" note="The page shows only today's season in Finland (<html data-season>); here each is forced with data-season.">
        <div className="grid gap-3 overflow-hidden">
          {SEASONS.map((s) => (
            <div key={s} data-season={s} className="min-w-0">
              <p className="text-sm" style={{ color: 'var(--season)' }}>
                {SEASON_NAMES[s][0]} · {SEASON_NAMES[s][1]}
              </p>
              {/* Contained here instead of full-bleed (utilities beat the components layer). */}
              <Treeline className="mx-0 w-full" seed={7} />
            </div>
          ))}
        </div>
      </Block>

      <Block title="Work list (IndexList)" note="Title opens the panel (arrow cue); date on the right; subjects below. Without a panel, the title is plain text.">
        <IndexList>
          <IndexItem id="sg-1" title="Opens a panel" opens when="2026" subtitle="One-line subtitle" summary="Two sentences: what it is and what came of it." subjects={['field', 'research']} missing={missing} />
          <IndexItem id="sg-2" title="No panel" when="Aug–Oct 2025" subtitle="Everything is on the card" subjects={['software']} missing={missing} />
        </IndexList>
      </Block>

      <Block title="Learning now" note="Planned or unfinished work: dashed, one line, no panel.">
        <ul className="learning-list">
          <li className="learning-item">
            <p className="learning-title">Forest cover change from Sentinel-2</p>
            <p className="learning-subtitle">Planned: mapping forest cover change in QGIS</p>
          </li>
        </ul>
      </Block>

      <Block title="Section nav" note="Current section: spruce underline (aria-current).">
        <nav className="section-nav" aria-label="Example sections">
          <ul role="list">
            <li>
              <a href="#styleguide" aria-current="location">
                Work
              </a>
            </li>
            <li>
              <a href="#styleguide">Learning</a>
            </li>
            <li>
              <a href="#styleguide">Contact</a>
            </li>
          </ul>
        </nav>
      </Block>

      <Block title="Elevation · radius">
        <div className="flex flex-wrap gap-4">
          <div className="grid size-24 place-items-center rounded-sm bg-card text-xs shadow-resting">sm · resting</div>
          <div className="grid size-24 place-items-center rounded-md bg-card text-xs shadow-resting">md · resting</div>
          <div className="grid size-24 place-items-center rounded-lg bg-card text-xs shadow-floating">lg · floating</div>
        </div>
      </Block>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent aria-describedby={undefined}>
          <div className="panel-inner">
            <header className="panel-header">
              <SheetTitle className="panel-title">Detail sheet</SheetTitle>
              <p className="panel-subtitle">Side sheet on wide screens, full screen on phones. Esc or the close button closes it.</p>
            </header>
            <p className="panel-summary">The summary, then the problem, what I did, the result and the proof.</p>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
