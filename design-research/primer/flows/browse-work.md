# Flow: browse work → open detail (key task: skim his work and research)

**Goal.** Scan every entry quickly, see which ones have more to read, read them in a row.

**Before.** Unnumbered cards; every finished entry opened a panel, some nearly empty (audit X2); no way to go to the next project without closing (X7); year mixed into the tags.

**After (Phase 3).**
1. Each section is a numbered index (`IndexList` / `IndexItem`, an `<ol>`), with a count beside the section title.
2. Item: number + the forest object's glyph on the left (glyph only with the forest), title, year on the right (mono), subtitle, summary, tags.
3. Only items with more to show are links (`hasDetail`), marked with an arrow that nudges on hover. The whole item is the click target.
4. Panel (Sheet): title, facts, write-up, links; at the bottom **Previous / Next** in page order. Stepping replaces the content in place, updates `#p/<id>` (replaceState) and moves focus to the new title.

**States.** In progress: amber badge, no year, no link, dashed glyph. Search filter active: non-matches dim. Panel loading: the islands chunk loads on idle; a click before it's ready records `#p/<id>` and the panel opens when mounted (no spinner: <1s, Primer loading guidance).

**Edge cases.** First / last project: only Next / Previous shows. Deep link to an entry with no panel: ignored, page stays. Back after stepping: closes the panel (stepping doesn't add history entries).

**Heuristics.** 2 Match (only promise detail that exists); 3 Control (prev / next / Esc / Back); 7 Efficiency (read on without closing).

**Accessibility.** Ordered lists; arrow and numbers `aria-hidden`; panel title is the dialog's name and receives focus after stepping; pager is a labelled `nav` ("More projects").
