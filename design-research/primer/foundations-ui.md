# Primer UI foundations (researched 2026-11-04)

Sources: primer.style/product/getting-started/foundations/color-usage, /typography, /layout; primer.style/product/primitives/typography, /size. Values below are as published there.

## Colour

- Three tiers: **base** scales (not mode-aware, never used directly), **functional** tokens (mode-aware, preferred), **component** tokens (e.g. `focus-outlineColor`, `control-borderColor-danger`).
- Naming: `{bgColor|fgColor|borderColor}-{role}[-muted|-emphasis]`. Roles: `default`, `muted`, `accent` (links, selected, focus), `success`, `attention` (warnings, *in progress*), `danger`.
- `bgColor-{role}-emphasis` always pairs with `fgColor-onEmphasis`.
- Borders and dividers use neutral steps 7–8; text and icons 9–10. Control states (rest / hover / active) step along the neutral scale.
- Dark mode: functional tokens re-resolve per mode; neutral scales run in opposite directions so most tokens need no override. High-contrast themes aim for 7:1.
- Not found on the pages read: exact hex values for functional tokens (they're per theme, in `@primer/primitives`), inset/subtle surface names, shadow tokens.

## Typography

| Style | Size | Line height | Weight |
|---|---|---|---|
| display | 2.5rem | 1.375 | 500 |
| title-large | 2rem | 1.5 | 600 |
| title-medium | 1.25rem | 1.625 | 600 |
| title-small | 1rem | 1.5 | 600 |
| subtitle | 1.25rem | 1.625 | 400 |
| body-large | 1rem | 1.5 | 400 |
| body-medium | 0.875rem | 1.5 | 400 |
| body-small | 0.75rem | 1.625 | 400 |
| caption | 0.75rem | 1.25 | 400 |
| codeBlock | 0.8125rem | 1.5 | 400 |

Weights: light 300, normal 400, medium 500, semibold 600. Rules: rem units; unitless line heights on a 4px grid; ~80 characters max per line; left-aligned, ragged right; hierarchy from size and weight, not colour; semantic heading order independent of styling. Font stack leads with Mona Sans (OFL); mono stack is system mono.

## Layout and size

- Breakpoints: xsmall 320, small 544, medium 768, large 1012, xlarge 1280, xxlarge 1400. Ranges: narrow <768 (1 col), regular ≥768 (2), wide ≥1400 (3).
- Content padding 16px up to large, 24px at xlarge+. Full pages max 1280px.
- Spacing `--base-size-*`: 2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 64, 80, 96, 112, 128 px.
- Stack gaps: condensed 8, normal 16, spacious 24.
- Controls (height): xsmall 24, small 28, medium 32, large 40, xlarge 48. Inline padding 8 / 12 / 16 (condensed / normal / spacious).
- Radius: small 3px, medium/default 6px, large 12px, full 9999px.
- Border width: thin/default 1px, thick 2px, thicker 4px.
- Focus outline: 2px, offset −2px (inset).
- Overlay: widths xsmall 192 … xlarge 960; radius 6px; padding 8 / 16.

## Interaction states

Rest → hover → active step along the neutral scale. Selected / current uses the `accent` role. Primer advises against `disabled` buttons (keyboard users can't reach them); use `inactive` (looks disabled, still focusable, can explain why) or `loading` (`aria-disabled`, keeps focus).

## Project decisions (pending approval: see PLAN.md)

| Primer concept | This project | shadcn / Tailwind token |
|---|---|---|
| `bgColor-default` / `-muted` | page / panel surfaces | `--background`, `--muted` |
| `fgColor-default` / `-muted` | ink / muted text (AA over canvas veil) | `--foreground`, `--muted-foreground` |
| `accent` role | links, current section, focus (new text-safe accent) | `--primary`, `--ring` |
| `attention` role | "In progress" badge | `--attention` (custom) |
| "found" (brand) | birch gold `#C9A46A`, decoration only | `--found` (custom) |
| borderColor-default / muted | dividers | `--border` |
| radius small / medium / large / full | inputs & chips / cards / panel / pills | `--radius-sm/md/lg`, `rounded-full` |
| controls medium 32 / large 40 / xlarge 48 | dense / default / touch (44 via DESIGN §6.5) | Button `size` variants |
| focus 2px | keep 2px, offset +2 outside (overlaps canvas otherwise) | `ring-2 ring-offset-2` |
