# Primer UX foundations (researched 2026-11-04)

Sources: primer.style/product/ui-patterns/navigation, /empty-states, /loading; /components/dialog, /button, /segmented-control, /autocomplete. Where Primer pages were silent, general sources from DESIGN §2 apply (noted).

## Navigation & IA
- Users should always know where they are; few nav items, the essential ones always available.
- Kinds of shift: new page (URL changes, offer a way back), same-page state, **new spot on the page (anchor; URL should change)**, dialog (focus moves in, rest of page inert).
- Tabs that change the URL → UnderlineNav; panel-only toggles → UnderlinePanels; don't mix. SegmentedControl for filtering / switching views.
- Place nav next to what it controls; skip links; tab order = visual order; correct heading structure.
- Not on the page read: `aria-current`. Using APG/WAI practice: `aria-current="location"` on the in-view section link.
- **Decision:** header section nav (Work · Research · Off the clock · Contact), anchors update the URL, current section marked with `aria-current` and an accent underline (UnderlineNav look).

## Search (Autocomplete)
- Anatomy: label + input + overlay menu; menu labelled by the field label; `emptyStateText` for no results; a loading indicator while options populate.
- Keyboard/ARIA not on the overview page → APG combobox pattern (current implementation already follows it).
- **Decision:** keep the current combobox behaviour; restyle as Primer Autocomplete (overlay radius 6, padding 8, floating elevation).

## Dialog (project detail)
- Title required (= accessible name), optional subtitle (= description); close X top right; Escape closes; return focus to trigger; body scrolls when max height reached.
- Positions incl. `right` (side sheet) and per-viewport (e.g. bottom / fullscreen on narrow). Widths: small 296, medium 320, large 480, xlarge 640.
- Navigation guidance: a dialog is a context switch, so don't open one that adds nothing (audit X2).
- **Decision:** right side sheet, xlarge-ish width (≈ 576–640px) on regular+, fullscreen on narrow; prev/next in a footer (audit X7).

## Buttons
- Primary: one per group, rarely more than one per page. Default for general actions. Invisible for minimal UI. Danger unused here.
- Sizes small / medium (default) / large (use sparingly).
- Avoid `disabled`; use `inactive` or `loading`.
- **Decision:** Email = primary (the page's main action); CV = default; icon buttons (search, theme) = invisible with `aria-label`; chips = small default.

## Segmented control (seasons)
- One choice from a short linear set, applied immediately. Variants default / subtle; on narrow: `hideLabels` or `dropdown`.
- ARIA not on the overview page → APG: a group of toggle buttons with `aria-pressed` (current) is valid; keep it.
- **Decision:** Primer SegmentedControl look (selected segment raised on muted track), labels kept on narrow (four short words fit at 375px).

## Empty states
- Types: not yet used, temporarily empty, error. Primary text required; optional secondary text and one primary action. Be specific; no vague "There was a problem".
- **Decision:** search no-results keeps its specific message + suggested chips (already matches). Sections with no entries stay hidden (no empty sections on a portfolio). Missing CV: hide the button (brief), no empty state.

## Loading
- Under 1s: show nothing. 1–3s: indeterminate. Skeletons for large areas. One announcement per group; `role="status"`; avoid layout shift.
- **Decision:** the forest fades in when ready (no spinner); the page is readable before it. Nothing else loads.

## Content & voice
- Primer content pages not fetched yet; using DESIGN §6.6: verb-first buttons, plain language. Current copy already follows this ("Email", "Read PDF", "Download", "Clear").

## Accessibility & keyboard
- Focus moves into dialogs and back to the trigger; skip link; status announcements via a stable live region (already in place).

## Responsive
- Narrow <768: one column, 16px padding; regular ≥768; wide ≥1400. Touch targets 44×44 (DESIGN §6.5, stricter than Primer's 32px medium control).
