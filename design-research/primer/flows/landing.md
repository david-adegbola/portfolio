# Flow: landing (key task: see who David is in seconds)

**Goal.** A recruiter knows who David is, what he's looking for and where to go next, without scrolling.

**Before.** Name, title, one intro paragraph, search, "See my work". On phones the name started ~22vh down (audit X4).

**After (Phase 3).**
1. Name (Fraunces 56) and title.
2. Three numbered statements (`site.json` `statements`): Nigeria → VAMK; fitter at UPM Kaukas; SuFoBE at UEF + learning GIS. Numbered like the reference sites' lists; `<ol>` so the order is announced, numbers `aria-hidden`.
3. One "looking for" line (`intro`).
4. Phones / tablets: a numbered "On this page" section list (the header nav takes over at ≥64rem).
5. Search with chips, then "See my work".
6. Phones: the forest window above the name is 14vh (`--hero-window`).

**States.** No JS: no search, everything else present. No WebGL: no forest window content, same text. No statements in `site.json`: the block is left out.

**Edge cases.** Long statements wrap with `text-wrap: pretty` at 52ch. A fourth statement just adds a fourth line.

**Heuristics.** 1 Visibility (who / what / where next, up front); 6 Recognition (sections listed, not hidden); 8 Minimalism (three lines, not a paragraph).

**Accessibility.** One `h1`; statements an ordered list; "On this page" nav labelled separately from the header's "Sections" (only one is ever displayed).
