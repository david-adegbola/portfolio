# Portfolio Website — Build Brief (v0.2)

> Hand this file to Claude Code as the full spec.
> Anything marked **[TODO]** is still undecided. Ask David before guessing.

---

## 1. Goal

A personal portfolio for **David Adegbola**, a Sustainable Forest Bioeconomy student at UEF, positioning him for **GIS / remote sensing and forestry roles** in Finland (e.g. Metsä Group, UPM, Stora Enso).

**Primary audience:** hiring managers and recruiters in forestry, GIS, and the forest industry.
**Two actions, always one click away:**
1. **Email David**: `mailto:adavidadegbola@gmail.com`
2. **View CV** at `/cv.pdf`, which opens in a new tab and is also downloadable [TODO supply PDF]

Both live in a small fixed header on every screen and state, including during 3D motion.

**Feel:** minimalist, Scandinavian, calm. Real motion in Three.js, used for navigation and not as decoration.

---

## 2. Concept: "Etsi" (Finnish: *search / seek*)

### The scene
- A long, misty **boreal landscape**: pine and birch trunks, a still lake, low fog, pale sky.
- Projects sit in the scene as objects: floating logs, survey marker posts, clearings. The floating logs reference Lake Saimaa beside UPM Kaukas, where David's interest in forestry began.
- Near-monochrome palette. Colour only appears when something is "found."

### Two zones along one camera path
1. **The forest (main path):** GIS, remote sensing, and forestry work. This is most of the scroll length, and visitors reach it first.
2. **Across the lake ("Off the clock"):** a shorter, quieter final stretch for side work: Hetkin, Nidave Films, Dust and Scrolls. These get smaller objects and shorter cards. They are visibly secondary, but searchable like everything else.
3. **The clearing (end):** contact details, email, and CV.

### Interaction
1. **Landing:** fog, a few trunks, the name and one-line title, plus one quiet input:
   `What are you looking for?` with suggestion chips: `GIS`, `remote sensing`, `forestry`, `CV`.
   - Typing `cv` or `contact` flies to the clearing.
2. **Scroll:** the camera glides along a spline through the forest. Project objects drift into view, and a minimal text card fades in next to each.
3. **Search:** fuzzy match on project titles and tags. The camera **flies to the best match**, non-matches fade into the fog, and the match gains a soft warm light. If several items match, show a small list of results under the input, so the visitor picks one and the camera flies there.
4. **Open a project:** a click opens a clean 2D HTML detail panel (overlay or side sheet) with no 3D in the way. `Esc` closes it.

### Motion rules
- Slow and eased: camera flights take 1.2–2s with ease-in-out, no bounce or overshoot.
- One moving idea at a time.
- No decorative particles, no bloom-on-everything, no auto-rotating objects.
- Fog and depth do most of the visual work.

---

## 3. Visual design

| Token | Value |
|---|---|
| Background / fog (light) | `#EEF0EE` |
| Background / fog (dark, "polar night") | `#14171A` |
| Ink | `#1C1F22` (light) · `#E6E8E6` (dark) |
| Muted | `#8A9095` |
| Accent (found state, links) | `#C9A46A`, a warm lamp / birch-bark tone, used sparingly |
| Typeface | **Inter Tight** for UI and body. Optional **Fraunces** for the name and section titles only |
| Type scale | 14 / 16 / 20 / 32 / 56 px, line height 1.5–1.6 |
| Layout | Large margins, text max width ~62ch, generous white space |
| Mode | Light by default, dark via `prefers-color-scheme`, plus a manual toggle |

3D style: **low-poly, flat-shaded, heavy fog.** No photoreal textures. Trees use `InstancedMesh`.

---

## 4. Content

Every entry lives in `content/projects.json`, which feeds the scene, the search, and the plain-HTML fallback.

```json
{
  "id": "example-gis-project",
  "zone": "forest",
  "title": "Project title",
  "subtitle": "One line: what it is",
  "tags": ["GIS", "remote sensing", "Sentinel-2", "QGIS", "Python"],
  "year": 2026,
  "role": "What David did",
  "tools": ["QGIS", "Python", "rasterio"],
  "summary": "1–2 sentences: problem → method → result.",
  "body": "Longer markdown: data source, method, result, what was learned.",
  "media": [{ "type": "image", "src": "/media/example/map.webp", "alt": "..." }],
  "links": [{ "label": "Code", "href": "https://github.com/..." }],
  "sceneObject": "marker"
}
```

`zone` is either `"forest"` (main) or `"lake"` (off the clock). The forest zone sorts first.

### Forest zone: main work [TODO — David to confirm or add real GIS projects]
- [TODO] GIS / remote sensing project(s). **This is the most important content on the site.**
- **Mistä puu tulee**: forest learning sim → 2D forestry sim game for children 8–16 (tags: forestry, education, carbon, game)
- **SuFoBE @ UEF**: studies; key courses and coursework worth showing (tags: forestry, bioeconomy)
- **UPM Kaukas Pulp Mill**: summer contract work on a boiler renovation (tags: forest industry, pulp)

### Research (forest zone)
Research papers, reports, and coursework write-ups get their own entry type, `"type": "research"`, with these fields:

```json
{
  "id": "example-paper",
  "type": "research",
  "zone": "forest",
  "title": "Paper title",
  "authors": ["David Adegbola"],
  "year": 2026,
  "context": "e.g. UEF course, thesis, independent study",
  "abstract": "Short abstract, written for a non-specialist reader.",
  "tags": ["forestry", "carbon", "..."],
  "pdf": "/research/example-paper.pdf",
  "sceneObject": "tree-ring"
}
```

- PDFs go in `/public/research/`. Each entry shows title, context, year, abstract, and buttons to **Read PDF** (new tab) and **Download**.
- In the scene, research appears as a cut log or stump with visible tree rings. Searching `research` or `paper` lists every research entry.
- The plain fallback list has a dedicated **Research** section.
- [TODO] David to supply the first research PDF(s) and abstracts.

### Lake zone: off the clock
- **Hetkin** (hetkin.app): startup
- **Nidave Films**: film and documentary work
- **Dust and Scrolls**: writing on cosmology and intellectual inquiry

### Other content
- **About** (short, human, ~80 words): Nigeria → IT at VAMK, Vaasa → a summer at UPM Kaukas, watching logs on Lake Saimaa → Sustainable Forest Bioeconomy at UEF → GIS and forestry. [TODO David to approve the final text]
- **Skills strip** (plain text, no progress bars or ratings): e.g. QGIS, ArcGIS, Python, … [TODO real list]
- **Links:** adavidadegbola@gmail.com · GitHub `https://github.com/david-adegbola` · LinkedIn [TODO URL]
- **Media:** none yet. David will add images as projects happen. **Never use stock photos.** Entries without media render cleanly as text-only cards, with no grey placeholder boxes in production.

### Designed for a site that grows
The site launches with very little content and fills up over time. It must look intentional at every stage.
- **The path length scales with the number of entries.** With 3 entries, the walk is short and complete, not a long empty forest.
- **`"status": "in-progress"`** entries are allowed. They appear as a faint marker deeper in the fog, labelled "In progress," with a one-line description and no detail panel. This shows momentum without faking finished work.
- **Adding content needs no code.** Add an entry to `projects.json`, drop files into `/public/media/<id>/` or `/public/research/`, then commit and push. GitHub Actions redeploys. The README documents this with a copy-paste entry template.

---

## 5. Tech stack and hosting

- **Vite + TypeScript**, vanilla **three.js**
- **Lenis** for smooth scroll, **GSAP + ScrollTrigger** to map scroll progress (0–1) to camera position along a `CatmullRomCurve3`
- **Fuse.js** for fuzzy search
- Content in JSON/Markdown in the repo, with no CMS and no backend
- **Hosting: GitHub Pages**
  - Repo named `david-adegbola.github.io` → site served at `https://david-adegbola.github.io/` with Vite `base: '/'`
  - Deploy via a GitHub Actions workflow (build → upload `dist` → deploy to Pages) on push to `main`
  - A custom domain can be added later via a `CNAME` file. Not required now.
- Includes a `README.md` explaining how to add a project (edit `projects.json`, drop images into `/public/media/<id>/`, push).

### Structure
```
/src
  main.ts               entry: boots UI first, then the scene
  scene/
    World.ts            renderer, camera, fog, resize, render loop, pause when hidden
    Forest.ts           instanced trees, lake plane, ground
    Path.ts             camera spline, zones, progress mapping
    ProjectObjects.ts   one object per project, found/unfound states
  ui/
    Header.ts           name + Email + CV (always visible)
    Search.ts           input, chips, Fuse.js, results list, fly-to
    ProjectPanel.ts     HTML detail panel
    Fallback.ts         plain list view
/content/projects.json
/public/media/, /public/cv.pdf
/.github/workflows/deploy.yml
```

---

## 6. Non-negotiables

1. **Content first.** All text exists in real HTML, for SEO, screen readers, and copy-paste. The canvas is a background layer, never the only place information lives.
2. **"Skip the forest" link** at the top → a plain, fast list of all projects + CV + email. Recruiters skim.
3. **Reduced motion:** with `prefers-reduced-motion`, there are no camera flights (cut or crossfade instead) and the site stays fully usable.
4. **No WebGL** → automatically show the plain list.
5. **Mobile (375px+):** fewer trees, pixel ratio capped at 1.5, touch scroll drives the path, and the search input stays reachable.
6. **Performance:** JS < ~300 KB gzipped, first readable content < 1.5s on 4G, 60fps on a mid-range laptop. No shadows by default. Images in WebP, lazy-loaded.
7. **Accessibility:** keyboard-operable search, results, and panel; visible focus; alt text; WCAG AA contrast in both modes.
8. **Meta:** `<title>`, description, Open Graph image, favicon (a simple tree or marker glyph).

---

## 7. Build order

1. **Static site first:** header (Email, CV), about, project list from JSON, detail panel, dark mode, GitHub Pages deploy. **Deployable and useful on its own.**
2. Three.js scene: fog, forest, lake, camera on spline, scroll-driven.
3. Project objects along the path in two zones, with cards synced to scroll.
4. Search → fly-to-match, results list, fade of non-matches, `cv`/`contact` shortcuts.
5. Reduced-motion, mobile tuning, WebGL fallback.
6. Performance + Lighthouse pass (target 90+ for Performance and Accessibility).

After each step, stop and show David a preview before continuing.

---

## 8. Still open [TODO]
- First research PDF(s) + abstracts
- GIS / remote sensing projects (can launch as `in-progress` entries)
- LinkedIn URL
- CV PDF (until supplied, hide the CV button rather than linking to a missing file)
- Final About text and skills list
- Media, added over time
