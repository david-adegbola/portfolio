# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

All six build steps are done, plus the v0.3 visual pass (natural colours, seasons, wind). Last Lighthouse (2026-10-10, production preview): mobile 99 / 100 / 100 / 100, desktop 100 across the board (Performance / Accessibility / Best Practices / SEO). `portfolio-brief.md` is the full spec and the source of truth. Read it before making design or architecture decisions. Anything it marks **[TODO]** is undecided: ask David instead of guessing.

## Commands

- `npm run dev`: dev server on :5173 (also `.claude/launch.json` → "dev")
- `npm run build`: `tsc --noEmit` + `vite build` into `dist/`
- `npm run typecheck`
- `npm run preview`: serves `dist/` on :4173 (`.claude/launch.json` → "preview"); run Lighthouse against `http://localhost:4173/portfolio/`
- No lint or test setup yet.

## How the static site works

- `vite.config.ts` has a small plugin that reads `content/*.json` (`src/content/load.ts` validates it and fails the build with readable errors) and pre-renders the whole page into `index.html` (`src/content/render.ts`, build-time only, uses `marked`). Placeholders: `<!--head-->`, `<!--header-->`, `<!--main-->`, `<!--footer-->`, `<!--templates-->`.
- Project details are pre-rendered into `<template id="detail-<id>">`; `src/ui/ProjectPanel.ts` clones them into a native `<dialog>` (URL `#p/<id>`).
- Content paths in the JSON are written root-relative (`/media/...`, `/research/...`); the plugin's `withBase` rewrites `href`/`src` in the rendered fragments to `/portfolio/...`. Don't hardcode `/portfolio/` in content.
- The CV button is rendered only if `public/cv.pdf` exists at build time. Media/PDF paths that don't exist in `public/` are left out, with a build warning.
- Scene (`src/scene/`): `main.ts` lazy-loads it as its own chunk after `load` + idle, only if WebGL2 exists. `World` renders **on demand** (only when the camera or theme changes), no continuous loop. `Path.buildLayout` sizes the forest/lake/clearing zones from entry counts (read from the `#entries-data` JSON the build embeds). `Forest` = 4 `InstancedMesh`es (pine/birch × trunk/crown) sharing matrices, seeded RNG so the forest is identical every visit. Colours per theme in `scene/palette.ts`; theme changes are observed, not pushed.
- Scroll → camera: Lenis (skipped under reduced motion) + one ScrollTrigger over the whole document. `ScrollMap` keyframes map scroll px → path progress so the camera frames each object exactly when its HTML card (`#projects .card[id]`, page order) is mid-screen; contact → progress 1. Keyframes are re-measured on every ScrollTrigger refresh.
- `ProjectObjects`: one object per card (marker, log-pile, floating log, clearing, tree-ring stump; a lamp for `#contact`), placed right of the path. Reaching one tweens its "paint" part from grey to the accent (found, persists) and moves a single warm PointLight to it (fade out → move → fade in). The scene fires `entry:active`; `ui/Cards.ts` marks the card. In-progress entries are faint, set back in the fog, never found.
- Search (`ui/Search.ts`, Fuse.js in the main bundle): combobox while typing; Enter / chip / option click commits → `setFilter` (cards dim, objects fade into the fog) → after the fade, `flyTo(id)`. Fuse results scoring above 0.5 are dropped (short words fuzzy-match junk otherwise). Keyword shortcuts: cv/contact/email… → `contact`; research/paper… → all research entries. Chips come from `site.json` `searchChips` and are hidden when they'd find nothing. `/` focuses search, `Esc` clears. A fixed `.search-status` bar keeps prev/next/clear reachable after the flight.
- `src/nav.ts` bridges UI and scene: `flyTo` falls back to `scrollIntoView` until the scene calls `provideFlight` (Lenis `scrollTo`, 1.6 s ease-in-out cubic, `lock`; a cut under reduced motion). Each flight settles exactly once (arrival, safety timeout, or superseded); while flying, passed objects don't become active.
- Fallbacks: `main.ts` imports the scene only if `WebGL2RenderingContext` exists and `saveData` is off; the `WebGLRenderer` itself uses `failIfMajorPerformanceCaveat` (no software GL) and `bootScene` resolves false if it can't be created. Otherwise the page is the plain list and search uses the scroll fallback. Don't add a separate probe context: it cost ~1.4 s of blocking time on throttled mobile.
- Performance: `bootScene` is async and yields (`scheduler.yield`/`setTimeout`) between renderer, ground, trees and objects, then `compileAsync` before the first frame; keep long tasks short. The main stylesheet is inlined into `index.html` at build (`inlineCss` plugin). JS-only controls are shown via the `js` class set in the head script (no layout shift).
- Share image: `public/og.jpg` (1200×630) is a static render of the real scene in summer with name + title; regenerate it if the name, title or look changes. `public/apple-touch-icon.png` is the favicon glyph at 180px. `webglcontextlost` removes `.has-scene` (canvas + veil fade away); restore brings it back.
- Reduced motion: no Lenis, no glide. The camera holds at the nearest stop and cuts between stops with a canvas crossfade via the Web Animations API (the reduced-motion stylesheet zeroes CSS transitions, WAAPI isn't affected; animations are cancelled after so CSS owns opacity again).
- Mobile (< 64rem): the veil is the `.page` background (scrolls with content) with a clear window onto the forest above the name; no fixed `body::before` veil. Header search button (`.header-search`) flies to top and focuses the input. Canvas uses `100lvh`; `ScrollTrigger.config({ ignoreMobileResize: true })`; no antialias on small screens.
- Seasons & look (v0.3): `src/seasons.ts` (shared with UI) picks today's season in Finland (Helsinki time: Nov–Mar winter, Apr–May spring, Jun–Aug summer, Sep–Oct autumn) or the visitor's pick (`sessionStorage`, via `ui/Seasons.ts`, event `season:change`). `scene/palette.ts` has one hand-tuned daylight `Look` per season; dark mode derives a night version of each. Season/theme changes crossfade the whole look (`mixLook`, 1.4 s).
- `scene/vegetation.ts`: one Lambert material for all vegetation and the ground, patched in `onBeforeCompile`. The red channel of the vertex colour (or instance colour) blends `colA`→`colB` (green adds brightness variation); `bloom` scales the mesh about its base (flowers, birch leaves, shrubs come and go with the season); wind sways by (local y / height)², with travelling gusts. Trunk and crown of a species must share wind settings or they separate. A mesh uses either vertex colours or instance colours, never both (they multiply). `customProgramCacheKey` is shared.
- `Forest`: pine/spruce/birch by site (spruce near water, birch on edges, pine on dry ground), glades, density noise, bilberry/lingonberry, grass, boulders, seven wildflowers in patches (glades/clearing, path edge, lake shore), blob contact shadows. Build is sliced (`addTrees`, `addFloor`, `addFlowers`); the ground is computed per grid point then de-indexed (per-triangle values crack the ground).
- `World` runs a continuous loop (`startLoop`, 30 fps on phones) to advance `windTime`; under reduced motion it stays on-demand. A sky dome follows the camera.
- Lighthouse: close or blank the Browser pane's forest tabs first. A tab rendering the forest continuously competes for CPU/GPU and inflated TBT to ~3–5 s in testing.
- Card fade-in is CSS-only (`animation-timeline: view()`), so cards can never get stuck hidden. `ProjectPanel` fires `panel:open`/`panel:close` so Lenis stops while the dialog is open.
- A fixed `body::before` veil (bg colour, gradient on ≥64rem) sits between the canvas and the text to keep AA contrast; it only appears with `.has-scene`.
- Browser-pane screenshots of the canvas can be one frame stale (on-demand rendering); scroll a little and screenshot twice.
- Light-mode contrast: `#8A9095` and the accent fail AA on `#EEF0EE`, so light mode uses `--muted-text: #5C6368` and the accent appears only as underlines/decoration, never as text.

## What's being built

A personal portfolio for David Adegbola (forestry/GIS job hunting in Finland), hosted on GitHub Pages at `https://david-adegbola.github.io/portfolio/` (repo `david-adegbola/portfolio`, Vite `base: '/portfolio/'`; this overrides the brief's `david-adegbola.github.io` / `base: '/'`). It deploys through a GitHub Actions workflow (`.github/workflows/deploy.yml`) on every push to `main`.

Stack: Vite + TypeScript, vanilla three.js, Lenis (smooth scroll), GSAP + ScrollTrigger (scroll progress 0–1 → camera position on a `CatmullRomCurve3`), Fuse.js (fuzzy search). No backend, no CMS.

## Architecture (planned, see brief §5)

- **One data source:** `content/projects.json` feeds the 3D scene, the search index, and the plain-HTML fallback list. Entries have `zone` (`"forest"` sorts before `"lake"`), an optional `"type": "research"` with its own schema (authors, context, abstract, pdf), an optional `"status": "in-progress"` (faint marker, no detail panel), and a `sceneObject` that picks the 3D object.
- **HTML is primary, canvas is decoration.** All text lives in real DOM (header, cards, detail panel, fallback list). The WebGL canvas sits behind as a background layer. `main.ts` boots the UI first, then the scene, so the site is usable before the scene loads, if it fails to load, and when WebGL isn't available.
- `src/scene/`: `World` (renderer, fog, render loop, pause when the tab is hidden), `Forest` (instanced trees, lake, ground), `Path` (spline, zones, progress mapping), `ProjectObjects` (one object per entry, found/unfound states).
- `src/ui/`: `Header` (name + Email + CV, fixed and always visible), `Search` (input, chips, Fuse, results list, fly-to), `ProjectPanel` (2D detail overlay, `Esc` closes), `Fallback` (plain list, with a Research section).
- The path length scales with the number of entries, so a site with few entries should still look complete, not empty.
- Adding content must never need code changes: edit the JSON, drop files in `public/media/<id>/` or `public/research/`, then push.

## Constraints that are easy to break

- Build order (brief §7) is incremental: the static site comes first and must deploy on its own. **Stop and show David a preview after each step.**
- Motion: camera flights take 1.2–2s, ease-in-out, with no overshoot. One moving thing at a time for visitor-triggered motion; the ambient wind is the exception (off under reduced motion). No particles, bloom, auto-rotation, or shadow maps (contact shadows only). Low-poly, flat-shaded, natural seasonal colours, light haze. All vegetation uses `InstancedMesh`.
- `prefers-reduced-motion` → no camera flights (cut or crossfade). No WebGL → show the plain list automatically. Include a "Skip the forest" link at the top.
- Mobile (375px+): fewer trees, pixel ratio capped at 1.5, touch scroll drives the path.
- Budget: JS under ~300 KB gzipped, first readable content under 1.5s on 4G, Lighthouse 90+ for Performance and Accessibility. Images are lazy-loaded WebP.
- Never use stock photos or grey placeholder boxes. Entries without media render as text-only cards. Hide the CV button until `public/cv.pdf` exists.
- Design tokens (colours, Inter Tight / Fraunces, type scale) are in brief §3; they're the page's, not the forest's. Use the accent `#C9A46A` sparingly; it marks the "found" state and links.
