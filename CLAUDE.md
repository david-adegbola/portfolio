# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Build step 1 (static site) is done. `portfolio-brief.md` is the full spec and the source of truth. Read it before making design or architecture decisions. Anything it marks **[TODO]** is undecided: ask David instead of guessing.

## Commands

- `npm run dev`: dev server on :5173 (also `.claude/launch.json` → "dev")
- `npm run build`: `tsc --noEmit` + `vite build` into `dist/`
- `npm run typecheck`
- No lint or test setup yet.

## How the static site works

- `vite.config.ts` has a small plugin that reads `content/*.json` (`src/content/load.ts` validates it and fails the build with readable errors) and pre-renders the whole page into `index.html` (`src/content/render.ts`, build-time only, uses `marked`). Placeholders: `<!--head-->`, `<!--header-->`, `<!--main-->`, `<!--footer-->`, `<!--templates-->`.
- Project details are pre-rendered into `<template id="detail-<id>">`; `src/ui/ProjectPanel.ts` clones them into a native `<dialog>` (URL `#p/<id>`).
- The CV button is rendered only if `public/cv.pdf` exists at build time. Media/PDF paths that don't exist in `public/` are left out, with a build warning.
- Light-mode contrast: `#8A9095` and the accent fail AA on `#EEF0EE`, so light mode uses `--muted-text: #5C6368` and the accent appears only as underlines/decoration, never as text.

## What's being built

A personal portfolio for David Adegbola (forestry/GIS job hunting in Finland), hosted on GitHub Pages at `https://david-adegbola.github.io/` (repo `david-adegbola.github.io`, Vite `base: '/'`). It deploys through a GitHub Actions workflow (`.github/workflows/deploy.yml`) on every push to `main`.

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
- Motion: camera flights take 1.2–2s, ease-in-out, with no overshoot. One moving thing at a time. No particles, bloom, auto-rotation, or shadows. The 3D style is low-poly and flat-shaded with heavy fog. Trees use `InstancedMesh`.
- `prefers-reduced-motion` → no camera flights (cut or crossfade). No WebGL → show the plain list automatically. Include a "Skip the forest" link at the top.
- Mobile (375px+): fewer trees, pixel ratio capped at 1.5, touch scroll drives the path.
- Budget: JS under ~300 KB gzipped, first readable content under 1.5s on 4G, Lighthouse 90+ for Performance and Accessibility. Images are lazy-loaded WebP.
- Never use stock photos or grey placeholder boxes. Entries without media render as text-only cards. Hide the CV button until `public/cv.pdf` exists.
- Design tokens (colours, Inter Tight / Fraunces, type scale) are in brief §3. Use the accent `#C9A46A` sparingly; it marks the "found" state and links.
