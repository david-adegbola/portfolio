# Design audit (2026-11-04)

Baseline: `main` at `d6f4965`. Audited from source and a container build (`npm run build` passes; page JS 14.3 KB gz, scene chunk 198.3 KB gz). No screenshots: no browser was available in the isolated environment at audit time.

LEAD: Primer · CONSULT: Carbon · USERS: recruiters and hiring managers in Finnish forestry, GIS and the forest industry.

## 4.1 Inventory

**Routes.** One page, `/portfolio/`. Deep links: `#p/<id>` opens a project panel; section anchors `#work`, `#research`, `#off-the-clock`, `#contact`, `#about`, `#projects`, `#top`.

**Screens / regions.** Fixed header (name, Email, CV if `public/cv.pdf` exists, search button, theme toggle) · hero (name, title, intro, search, See my work) · About · Work · Research (hidden while empty) · Off the clock · Get in touch · footer · season switcher (fixed, forest only) · search status bar (fixed, while a search is active) · detail panel (`<dialog>` side sheet).

**Components.** All hand-built, no component library: header pill links, icon buttons (search, theme), search combobox + chips, search status bar, cards (project, research, in-progress, small/lake), card glyphs, detail panel, buttons (`.button`, `.button--quiet`), season segmented control.

**Styling sources.** One stylesheet, `src/styles.css` (1019 lines), inlined at build. Tokens on `:root` for colour, type sizes, measure, gutter, header height, easing. No tokens for radius, shadow or spacing. Scene colours in `src/scene/palette.ts`.

**Key flows → key tasks.**

| Flow | Key task |
|---|---|
| Land → read name, title, intro | See who David is in seconds |
| Header Email / contact section email | Email him |
| Header CV | Open his CV (currently hidden, no `cv.pdf`) |
| Scroll the list / open a panel | Skim his work and research |
| Type or pick a chip → fly to match → step/clear | Find a topic via search |

## 4.2 UI audit

| ID | Area | Severity | Where | What's wrong | Evidence | Rule / source | Fix | Effort |
|---|---|---|---|---|---|---|---|---|
| U1 | UI | Medium | `src/styles.css:104, 321, 332, 471, 503, 622` | Seven different radii (2px, 4px, 0.65rem, 1rem, 1.25rem, 999px, 50%), none tokenised | grep of `border-radius` | DESIGN §6.2 tokens only; Primer `borderRadius-*` (3/6/12/full) | Radius tokens; map each surface to one | S |
| U2 | UI | Medium | `src/styles.css:324, 410, 472` | Three hand-written shadows; no elevation levels | grep of `box-shadow` | DESIGN §6.2; Primer resting/floating overlay levels | Two elevation tokens (resting, floating) | S |
| U3 | UI | Medium | `.search-option[aria-selected]`, `.season[aria-pressed]`, hover rules using `--line` | Hover, selected and pressed share one fill (`--line`), so the selected season and a hovered one look alike | `src/styles.css` season and search-option rules | Primer: distinct rest / hover / active / selected steps | State tokens: hover, active, selected (selected also gets weight or border) | S |
| U4 | UI | Medium | `.header-link`, `.button`, `.button--quiet`, `.search-chip` | Four near-duplicate outlined pill styles with different border strengths (28% ink, ink, `--line`) | `src/styles.css:118–131, 708–727, 360–378` | DESIGN §4.2 duplicate components; Primer Button variants | One Button with variants (primary, default, invisible) + sizes | M |
| U5 | UI | Medium | `.card.is-found .card-glyph` | "Found" is shown by colour alone (grey → gold) | `src/styles.css:660–667` | WCAG 1.4.1 (decorative here, but it's the site's one state cue) | Add a shape change (filled dot / tick) alongside colour | S |
| U6 | UI | Low | `.season-caption` `font-size: 0.8125rem` | Off-scale size | `src/styles.css:481` | Primer type scale (12/14/16/20/32/40) | Use the 12px or 14px step | S |
| U7 | UI | Low | Accent `#C9A46A` | Fails AA as text on the light background, so it's restricted to underlines; links read as "ink with a faint gold line" | CLAUDE.md light-mode contrast note | WCAG 1.4.3 | New look: an accent that passes as text, keep gold only for "found" | S |

## 4.3 UX audit

| ID | Area | Severity | Where | What's wrong | Evidence | Rule / source | Fix | Effort |
|---|---|---|---|---|---|---|---|---|
| X1 | UX | Critical (content) | `content/site.json`, no `public/cv.pdf` | CV button is hidden because there's no CV; no LinkedIn; skills list empty; no GIS / remote sensing projects yet | `site.json:9` `"skills": []`; brief §8 | Key tasks "open his CV", "skim his work" | Needs David's content; design must make the gap look intentional | — |
| X2 | UX | High | `renderMain` (`src/content/render.ts`) | Panels open with almost nothing: SuFoBE has a subtitle only; Hetkin, Nidave Films, Dust and Scrolls have a subtitle (and one link). A click promises detail that isn't there | `content/projects.json` | Nielsen 2 (match expectations), 8 (minimalism); Primer navigation: Dialog is a context switch | Only make an entry openable when it has more than its card shows; otherwise show everything inline | S |
| X3 | UX | Medium | Header | No section navigation: Research, Off the clock and Contact are reachable only by scrolling or search | `renderHeader` | Nielsen 3, 6; Primer navigation: "users should always know where they are" | Compact section nav with `aria-current` on scroll | M |
| X4 | UX | Medium | `.page` padding-top on <64rem | On phones the name starts ~22vh down and the first project is well below the fold | `src/styles.css` mobile `.page` rule | Key task "see who David is in seconds" | Tighter hero; first project visible or one tap away | S |
| X5 | UX | Medium | `.header-link`, `.search-chip`, `.season`, `.search-step`, `.search-clear` | Touch targets 36px high (2.25rem) | `min-height: 2.25rem` rules | DESIGN §6.5 (44px); WCAG 2.5.8 passes at 24px | 44px targets on coarse pointers | S |
| X6 | UX | Low | Season buttons | Finnish names only in `title` (no touch, unreliable for screen readers) | `src/content/render.ts:271` | Primer: no info in tooltips only | Show Finnish name in the caption (already) and drop `title` | S |
| X7 | UX | Low | Detail panel | No way to go to the next/previous project without closing | `ProjectPanel.ts` | Nielsen 7 (efficiency) | Prev / next in the panel footer | S |
| X8 | UX | Low | Cards | Most entries have no year; the list has little scannable metadata | `content/projects.json` | Reference sites rely on dates/numbers for scanning | Numbered index + year when present | S |

**Working well (keep):** content is fully pre-rendered HTML; skip link; WebGL fallback; reduced-motion crossfades; combobox follows APG (aria-activedescendant, Esc, Enter); results announced via a stable status region; panel is a native `<dialog>` with focus return and URL; contrast measured over the canvas; Lighthouse 99–100.

**Nielsen's 10, whole site.** Strong on 1 (visibility: found state, status bar), 4 (consistency), 5 (error prevention: dead chips hidden), 9 (empty-state wording). Weak on 3 (user control: no section nav), 6 (recognition over recall: sections only discoverable by scrolling), 2 (panel expectations, X2).

## Resolved

| ID | When | How |
|---|---|---|
| X2 | Content update, 2026-11-04 | `hasDetail()`: a card opens a panel only when the panel adds something |
| U1, U2, U6, U7 | Phase 1 | Radius, elevation and type tokens; text-safe spruce accent, gold only for "found" |
| U3, U4, X5, X6 | Phase 2 | One shadcn Button (variants, 44px on touch); ToggleGroup with distinct hover / selected; season names no longer only in `title` |
| X3, X4, X7, X8 | Phase 3 | Section nav with current marker; numbered statements + 14vh window on phones; prev / next in the panel; numbered index with years (`design-research/primer/flows/`) |

## Top 10 fixes (impact ÷ effort)

1. X2 Openable only when there's more to read · 2. X3 Section nav · 3. X4 Mobile hero · 4. U4 One Button component · 5. U3 State tokens · 6. X5 44px targets · 7. U7 Text-safe accent · 8. U1/U2 Radius + elevation tokens · 9. U5 Non-colour found cue · 10. X7 Prev/next in panel. X1 needs content from David.

## Proposed phases

See `design-research/primer/PLAN.md`.
