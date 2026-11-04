# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Before any UI or UX work, read DESIGN.md and follow its research protocol. Never design a component, pattern or flow from memory when the reference system's docs can be checked.

## Status

All six build steps are done, then v0.3 (seasons), the v0.4 redesign (React + Tailwind v4 + shadcn/ui, "Field notebook" look on Primer structure; see `design-research/primer/PLAN.md`, `design-audit/AUDIT.md`), v0.5 (3D forest removed, light theme only), and **v0.6 "proof" (branch `portfolio-proof`, 2026-11-04)**:

- One sentence plus three numbered lines in the hero, a "Currently" line, and Email/CV buttons.
- One Work list ordered by strength of proof, with panels answering problem / what I did / result / proof.
- A "Learning now" block for planned and unfinished work; About ends with "What I can do for you"; Background holds education, hands-on IT work and skills.
- Data-driven Notes, hidden until the first note exists.
- Image support; tree-ring/contour motif; two typefaces.
- Search removed.

`TODO-DAVID.md` lists everything that needs David's input. `portfolio-brief.md` still describes the 3D forest and search; where it disagrees with this file, this file and David's later decisions win. Anything it marks **[TODO]** is undecided: ask David instead of guessing.

- **Audience and positioning** (David, 2026-11-04): forestry and forest-tech employers, UEF research project leads, geospatial/IT employers. He is a forestry student with a computing background, **not** a GIS specialist. GIS and remote sensing are things he's learning. VAMK is IT studies, **not completed**.
- **Facts:** only from this repo, the CV repo (`~/startups/CV`, `david-adegbola/cv`, its `CV-RULES.md` §6–7 is the source of truth) and David's own messages. Never invent numbers, results, dates, photos or testimonials. If something is missing, add it to `TODO-DAVID.md`; never use a placeholder that looks real.
- How to audit (AGENTS.md: never on the host, never `--no-sandbox`): image `portfolio-dev:lighthouse` (`portfolio-dev:chromium` + `npm i -g lighthouse@12`, which also ships axe-core), run with `--network none --cap-drop ALL --security-opt no-new-privileges --security-opt seccomp=<Docker default profile + allow unshare, clone, chroot>`, project mounted read-only, a small static server serving `dist/` at `/portfolio/`. A CDP script in the session scratchpad (`tools/check.mjs`) takes screenshots of every section and panel at 1440/390, checks horizontal scroll, internal links, the keyboard flow, console errors and runs axe. Last run (2026-11-04): no console errors, no horizontal scroll, no broken links, 0 axe violations (home and panel, both widths).

## Commands

- `npm run dev`: dev server on :5173 at `/portfolio/` (note pages too, via a middleware)
- `npm run build`: `tsc --noEmit` + `vite build` into `dist/`
- `npm run typecheck`, `npm run preview` (serves `dist/` on :4173)
- `npm run lint` (oxlint; typescript-eslint doesn't support TS 7), `npm test` (Vitest, `test/`)
- All commands run in the `portfolio-dev` Docker container (AGENTS.md); preview with `--host 0.0.0.0`. Don't run Node, Python or `sed -i` on the host.

## How the static site works

- The page is React components (`src/components/Page.tsx`) rendered to static HTML at build time (`src/content/render.tsx`). `vite.config.ts` has a plugin that reads `content/` (`src/content/load.ts` validates it and fails the build with readable errors) and fills the placeholders in `index.html` (`<!--head-->`, `<!--header-->`, `<!--main-->`, `<!--footer-->`, `<!--templates-->`). Markdown uses `marked` at build time only.
- Content: `site.json` (`Site` in `src/content/types.ts`), `projects.json` (`Entry[]`, **JSON order = page order = strongest proof first**), `now.json` (the "Currently" line), `notes/*.md`. Entries have `subjects` (`field` / `software` / `research`, shown as tags; never tag by how it was built), optional `status: "in-progress"` (→ Learning now block, no panel), and the panel parts `problem`, `did`, `result`, `tryIt` (shown first), `links`, `proofNote` / `proofNoteShort`. The card's "Proof:" line comes from `proofKinds()` (code, data, PDF, live site, working version).
- "I write the spec and check the result" appears **once**, as `site.json` `softwareNote` above the Work list. Don't repeat it on entries.
- Panels: pre-rendered `<template id="detail-<id>" data-title data-subtitle data-lang>` in page order. The `ProjectPanel` island (`src/islands/`, a shadcn Sheet = Radix Dialog) clones the body (URL `#p/<id>`), with prev / next in page order. On close, focus goes back to the card link that opened it (`onCloseAutoFocus`). It's the only island, in a lazy chunk: `main.ts` loads it on idle, on the first card click or on a `#p/` link. Don't import React/Radix from the main bundle: it would put ~85 KB gz on the critical path.
- Images (`components/patterns/Picture.tsx`): `alt`, `width`, `height` required by the loader; optional `srcset`. Files missing from `public/` are left out (whole image, or single srcset entries), never an empty box. `site.portrait` sits inside the hero rings; `cover: true` puts an entry image on its card.
- Notes: `content/notes/<slug>.md` with `title` / `date` front matter (parser in `load.ts`, no dependency). The build writes `/notes/<slug>/` and `/notes/` (`NotePages.tsx`), with the main stylesheet and head script inlined by the `inlineCss` plugin (marker `<meta name="x-page-assets">`). Homepage shows the newest three; the section and nav link are hidden with no notes. `_draft.md` and `README.md` are skipped.
- Content paths are written root-relative (`/media/...`); `withBase` rewrites `href`/`src`/`srcset` to `/portfolio/...`. Don't hardcode `/portfolio/` in content.
- shadcn components live in `src/components/ui/` (button, sheet), edited to match the Primer research. `cn()` is plain `clsx` (no tailwind-merge): variants are written so no two set the same property. Use relative imports there (vite.config loads them, `@/` doesn't resolve). `styles.css` is imported into the `components` cascade layer, so Tailwind utilities win over it.
- Page order: hero → treeline → Work → Learning now → About → Background → Notes → Contact. `SectionNav` in the header (≥64rem) and the hero (<64rem); current section via `ui/SectionNav.ts`. Header is fixed with a solid background and a bottom rule. Email + CV are in the header and the hero.
- No search (removed 2026-11-04: seven entries and a section nav don't need it). No scroll-in animations: content is visible at once.
- `/styleguide/` (second Vite entry, noindex, unlinked) shows tokens, buttons, rings, treeline in four seasons, the work list and the learning block.

## Look

- **Two typefaces:** Fraunces (name, headings, statement numerals) and Inter Tight (everything else). No mono labels; dates use tabular numerals. Code in panels uses the system monospace.
- **One visual idea: rings** (`components/patterns/Rings.tsx`): concentric, slightly irregular closed curves that read as tree rings and as map contours (forestry + GIS). Hero figure (12 rings, beside the column at ≥80rem, framing the portrait) and a 4-ring mark beside every section title. Centre in the season colour. Fixed seeds; `aria-hidden`.
- **Treeline** (`Treeline.tsx`): full-width line drawing at the foot of the hero, spruce and birch only (pines this small read as mushrooms). Holds every season's details; CSS shows today's. Static. Don't repeat it with `<use>` (page selectors don't reach into the copy).
- **Season:** `src/seasons.ts` `seasonForMonth` (Helsinki time: Nov–Mar winter, Apr–May spring, Jun–Aug summer, Sep–Oct autumn); the head script in `index.html` repeats it and sets `<html data-season>` before paint (`test/seasons.test.tsx` checks they agree). `--season` (≥ 5.4:1, may colour small text): statement numerals, ring centres, the "Currently" rule, subject marks, footer season line, drawing details. An accent, not a theme.
- **Light theme only** (David, 2026-11-04): no dark mode, no theme toggle, no `dark:` variant. Don't add one back without asking.
- Tokens are in `src/globals.css` (shadcn names plus `--season`, `--found`, `--glyph`, `--line-art`, `--attention`, `--state-*`, `--shadow-*`, `--radius-*`); `styles.css` uses tokens only.
- Share image: `public/og.jpg` is still the old 3D forest render. Remake it from the rings/treeline when David asks.

## What's being built

A personal portfolio for David Adegbola (forestry job hunting in Finland), hosted on GitHub Pages at `https://david-adegbola.github.io/portfolio/` (repo `david-adegbola/portfolio`, Vite `base: '/portfolio/'`). It deploys through `.github/workflows/deploy.yml` on every push to `main`.

Stack: Vite + TypeScript + React (build-time rendering, one lazy island) + Tailwind v4 + shadcn/ui (Radix). No backend, no CMS, no WebGL, no search.

Adding content must never need code changes: edit `content/`, drop files in `public/media/<id>/`, then push.

## Constraints that are easy to break

- **Stop and show David a preview after each step.** Nothing is pushed, merged or deployed without his say-so.
- Simple and calm: no motion beyond small hover/focus transitions and the panel slide. Nothing loops, nothing moves on its own, nothing waits for scrolling to appear.
- `prefers-reduced-motion` → no smooth scroll, no fades. Keep the skip link ("Skip to projects").
- Mobile (375px+) must fit: name + Email + CV in one header row; 44px touch targets.
- Budget: JS under ~300 KB gzipped (now ~2 KB page + ~85 KB lazy panel), first readable content under 1.5s on 4G, Lighthouse 90+ for Performance and Accessibility. Images lazy-loaded (portrait eager), WebP.
- Never use stock photos or placeholder boxes. Entries without media render as text-only cards. Hide the CV buttons when there's no CV.
- The availability sentence in `site.json` `contact.text` stays as David wrote it until he confirms it (TODO-DAVID.md).
