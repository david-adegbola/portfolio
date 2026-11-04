# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Before any UI or UX work, read DESIGN.md and follow its research protocol. Never design a component, pattern or flow from memory when the reference system's docs can be checked.

## Status

All six build steps are done, then v0.3 (seasons), the v0.4 redesign (branch `redesign`, 2026-11-04: React + Tailwind v4 + shadcn/ui, "Field notebook" look on Primer structure, numbered index and section nav; see `design-research/primer/PLAN.md` and `design-audit/AUDIT.md`), and **v0.5 (2026-11-04): the 3D forest is gone.** David wanted nothing distracting. The page is now plain text with quiet forest-and-season accents: one line drawing of a spruce-and-birch treeline under the hero, and a season colour on numbers and card glyphs. three.js, GSAP, Lenis and the season switcher were removed. `portfolio-brief.md` still describes the 3D forest in places; where it disagrees with this file, this file and David's decision win. `portfolio-brief.md` is otherwise the full spec. Anything it marks **[TODO]** is undecided: ask David instead of guessing.

- Last Lighthouse (2026-11-04, v0.4 with 3D disabled, so it matches v0.5's page): mobile 93–99 / 100 / 96 / 100, desktop 100 / 100 / 96 / 100. Best Practices 96 was three.js failing without WebGL, which no longer ships. Re-run after v0.5.
- How to audit (AGENTS.md: never on the host, never `--no-sandbox`): image `portfolio-dev:lighthouse` (`portfolio-dev:chromium` + `npm i -g lighthouse@12`), run with `--network none --cap-drop ALL --security-opt no-new-privileges --security-opt seccomp=<Docker default profile + allow unshare, clone, chroot>`, project mounted read-only, a small static server serving `dist/` at `/portfolio/` with gzip, Chromium `--headless=new`. Screenshots the same way (`--screenshot`, `--force-dark-mode`).

## Commands

- `npm run dev`: dev server on :5173 (also `.claude/launch.json` → "dev")
- `npm run build`: `tsc --noEmit` + `vite build` into `dist/`
- `npm run typecheck`
- `npm run preview`: serves `dist/` on :4173 (`.claude/launch.json` → "preview")
- `npm run lint` (oxlint; typescript-eslint doesn't support TS 7), `npm test` (Vitest, `test/`)
- All commands run in the `portfolio-dev` Docker container (AGENTS.md); preview with `--host 0.0.0.0`.

## How the static site works

- The page is React components (`src/components/Page.tsx`) rendered to static HTML at build time (`src/content/render.tsx`). `vite.config.ts` has a small plugin that reads `content/*.json` (`src/content/load.ts` validates it and fails the build with readable errors) and fills the placeholders in `index.html`: `<!--head-->`, `<!--header-->`, `<!--main-->`, `<!--footer-->`, `<!--templates-->`. Markdown bodies use `marked` at build time only. Media/PDF paths that don't exist in `public/` are left out, with a build warning.
- Content paths in the JSON are written root-relative (`/media/...`, `/research/...`); the plugin's `withBase` rewrites `href`/`src` in the rendered fragments to `/portfolio/...`. Don't hardcode `/portfolio/` in content.
- Project details are pre-rendered into `<template id="detail-<id>" data-title data-subtitle data-eyebrow data-lang>` in page order. The `ProjectPanel` island (`src/islands/`, a shadcn Sheet = Radix Dialog) clones the body and draws the header from the data attributes (URL `#p/<id>`), with prev / next in page order. It's the only island, in a lazy chunk: `main.ts` loads it on idle, on the first card click (which pushes `#p/<id>` first; the panel reads the hash on mount and fires `panel:ready`) or on a `#p/` link. Don't import React/Radix from the main bundle (`ui/*.ts`): it would put ~85 KB gz on the critical path.
- shadcn components live in `src/components/ui/`, edited to match the Primer research (header comment in each). `cn()` is plain `clsx` (no tailwind-merge): variants are written so no two set the same property. Components added with `npx shadcn add` assume tailwind-merge, so check them for conflicting classes and fix their imports (`cn` from `../../lib/utils.ts`; relative imports, since the build loads them through vite.config where `@/` doesn't resolve). Static markup uses `buttonVariants()` classes directly. `styles.css` is imported into the `components` cascade layer, so Tailwind utilities win over it.
- Flows (`design-research/primer/flows/`): hero statements from `site.json` `statements`; entries render as numbered `IndexList`/`IndexItem` (`src/components/patterns/`), glyph under the number; `SectionNav` in the header (≥64rem) and the hero (<64rem), current section via `ui/SectionNav.ts`; `ContactBlock` from `site.json` `contact` + `location`; footer signature with the build month and today's season. Page order: hero → treeline → Work → Research → Built with AI → About → Contact.
- A card opens a detail panel only when the panel adds something beyond the card (`hasDetail` in `Page.tsx`). Zones are still `forest` (Work) and `lake` ("Built with AI agents", `#built-with-ai`) in the JSON.
- The CV button links to `site.json` `cv` (the combined forestry PDF from the `david-adegbola/cv` repo), else `public/cv.pdf` if it exists, else it's hidden. Job and own-project wording follows that repo's `CV-RULES.md` (never "boiler renovation"; own projects are built with AI coding agents, never coded by hand).
- Entries may set `"lang"` (e.g. `"fi"`) for a title in another language; it's output as `lang` on the card title, panel title and search result.
- `/styleguide/` (second Vite entry, noindex, unlinked) shows every token and component, and the treeline in all four seasons.

## Forest and season accents (v0.5)

- **Season:** `src/seasons.ts` `seasonForMonth` (Helsinki time: Nov–Mar winter, Apr–May spring, Jun–Aug summer, Sep–Oct autumn). The head script in `index.html` repeats the rule and sets `<html data-season>` before first paint; the build writes the build day's season there for no-JS visitors. `test/seasons.test.tsx` runs the head script and checks it agrees. Visitors can't pick a season (David's choice).
- **Season colour:** `--season` (from `--season-light` / `--season-dark` per `[data-season]` in `globals.css`): frost blue, birch-leaf green, spruce green, rowan red. Each is ≥ 5.4:1 on `--background` and `--card`, so it may colour small text. It's used on statement numbers, card numbers, card glyphs, the footer season line and the drawing's details. Keep it to small details; it's an accent, not a theme.
- **Treeline** (`src/components/patterns/Treeline.tsx`): one inline SVG, full width (`100vw`, body has `overflow-x: clip`), at the foot of the hero. Its ground line replaces the first section's border. Spruce and birch only (pines drawn this small read as mushrooms). Built from a fixed seed at build time, so it's identical every build. It contains every season's details (`.tl-snow`, `.tl-drift`, `.tl-leaves`, `.tl-flowers`, `.tl-fall`), and CSS shows today's. Static, `aria-hidden`. Don't use `<use>` to repeat it: page selectors don't reach into the copy, so it renders unstyled. Don't add motion.
- **Card glyphs:** each card carries a small line drawing of a forest object (`src/content/objects.ts` `objectKind`, picked by the entry's `sceneObject` or its zone), in the season colour. The card a search or link just went to gets `.is-active` (heavier line, filled; not colour alone). In-progress entries: grey, dashed.

## Search and navigation

- Search (`ui/Search.ts`, Fuse.js in the main bundle): combobox while typing; Enter / chip / option click commits → `setFilter` (non-matching cards dim) → after the fade, `flyTo(id)`. Fuse results scoring above 0.5 are dropped (short words fuzzy-match junk otherwise). Keyword shortcuts: cv/contact/email… → `contact`; research/paper… → all research entries. Chips come from `site.json` `searchChips` and are hidden when they'd find nothing. No single-key shortcuts (WCAG 2.1.4); the header search button returns to search, `Esc` clears. Results are announced through the always-present `#search-announce` status element; the empty state `.search-empty` is a stable `role="status"` region driven by its text, never `hidden`. A fixed `.search-status` bar keeps prev/next/clear reachable after the scroll.
- `src/nav.ts` `flyTo`: `scrollIntoView` (entries centred; sections and the top under the header via `scroll-padding`), smooth unless reduced motion; settles once (`scrollend` or a 1.2 s timeout) and fires `entry:active` (`ui/Cards.ts` marks the card). `data-fly` links (section nav, "See my work") use it, then focus the section heading or the card link.
- Reduced motion: no smooth scrolling; the CSS reduced-motion block zeroes transitions and animations. Card fade-in is CSS-only (`animation-timeline: view()`), so cards can never get stuck hidden.
- Performance: the main stylesheet is inlined into `index.html` at build (`inlineCss` plugin). JS-only controls are shown via the `js` class set in the head script (no layout shift).
- Share image: `public/og.jpg` (1200×630) is still a render of the old 3D forest with name + title. It should be remade to match the new look (treeline drawing) when David wants; `public/apple-touch-icon.png` is the favicon glyph at 180px.
- Tokens ("Field notebook") are in `src/globals.css` with shadcn names (`--background`, `--foreground`, `--muted-foreground`, `--primary` = spruce, `--border`, `--ring`, …) plus `--season`, `--found` (birch gold: autumn leaves, decoration only), `--glyph` (in-progress glyphs), `--line-art` (drawing lines, decoration only), `--attention`, `--state-*`, `--shadow-resting/floating`, `--radius-sm/md/lg/full`. `src/styles.css` holds component styles and must use tokens only. **Light theme only** (David, 2026-11-04): no dark mode, no theme toggle, no `dark:` variant, `color-scheme: light`. Don't add one back without asking. Re-measure contrast if tokens change.

## What's being built

A personal portfolio for David Adegbola (forestry/GIS job hunting in Finland), hosted on GitHub Pages at `https://david-adegbola.github.io/portfolio/` (repo `david-adegbola/portfolio`, Vite `base: '/portfolio/'`; this overrides the brief's `david-adegbola.github.io` / `base: '/'`). It deploys through a GitHub Actions workflow (`.github/workflows/deploy.yml`) on every push to `main`.

Stack: Vite + TypeScript + React (build-time rendering, one lazy island) + Tailwind v4 + shadcn/ui (Radix), Fuse.js (fuzzy search). No backend, no CMS, no WebGL.

- **One data source:** `content/projects.json` feeds the page, the search index and the detail panels. Entries have `zone` (`"forest"` sorts before `"lake"`), an optional `"type": "research"` with its own schema (authors, context, abstract, pdf), an optional `"status": "in-progress"` (faint, no detail panel), and an optional `sceneObject` that picks the card glyph.
- Adding content must never need code changes: edit the JSON, drop files in `public/media/<id>/` or `public/research/`, then push.

## Constraints that are easy to break

- **Stop and show David a preview after each step.** Nothing is pushed or merged without his say-so.
- Simple and calm: no motion beyond small hover/focus transitions, the card fade-in and the search scroll. Nothing loops, nothing moves on its own.
- `prefers-reduced-motion` → no smooth scroll, no fades. Include a skip link at the top ("Skip to projects").
- Mobile (375px+) must fit: name + Email + CV + the search button in one header row; 44px touch targets.
- Budget: JS under ~300 KB gzipped (now ~13 KB page + ~85 KB lazy panel), first readable content under 1.5s on 4G, Lighthouse 90+ for Performance and Accessibility. Images are lazy-loaded WebP.
- Never use stock photos or grey placeholder boxes. Entries without media render as text-only cards. Hide the CV button when there's no CV.
- Use the birch gold `#C9A46A` sparingly (autumn birch leaves); it's never text.
