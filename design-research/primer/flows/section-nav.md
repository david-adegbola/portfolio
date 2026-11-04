# Flow: section navigation (audit X3)

**Goal.** Jump to Work, Built with AI, About or Contact from anywhere, and always know where you are (Primer navigation: "users should always know where they are").

**After (Phase 3).**
- ≥64rem: section links in the header between the name and the actions (UnderlineNav look: muted, spruce underline on the current one). <64rem: the same list, numbered, in the hero; the header search button stays the way back to the top.
- Links carry `data-fly`: with the forest they glide (same flight as search, 1.6s ease-in-out; a cut under reduced motion), then focus the section heading; the URL takes the anchor (replaceState). Without JS they're plain anchors.
- `ui/SectionNav.ts` marks the section crossing a band just above mid-screen with `aria-current="location"`.

**Edge cases.** Empty sections (e.g. Research) aren't listed. Old browsers without IntersectionObserver: links work, no current marker.

**Heuristics.** 1 Visibility (current section); 3 Control (jump anywhere); 6 Recognition.

**Accessibility.** Two labelled navs ("Sections", "On this page"), only one displayed at a time. Focus moves to the section heading after a jump (headings have `tabindex="-1"`). Touch targets 44px on coarse pointers.
