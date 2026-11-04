# portfolio

Personal portfolio of David Adegbola. Live at <https://david-adegbola.github.io/portfolio/>

Every push to `main` builds the site and deploys it to GitHub Pages (`.github/workflows/deploy.yml`).

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173/portfolio/
npm run build    # type-check + production build into dist/
npm test         # content and panel tests
```

## Add or edit content (no code needed)

All content lives in `content/`:

- `site.json`: name, `headline` (the one sentence under the name), the three numbered `statements`, `portrait`, `about` (paragraphs), `offer` ("What I can do for you"), `softwareNote`, `learningNote`, `education`, `computing` (hands-on IT work), `skills` (groups), `contact` (`heading`, `text`), `location`, email, CV link, links.
- `projects.json`: every piece of work, **strongest proof first** (the page keeps this order).
- `now.json`: the "Currently" line near the top (`text`, and `updated` as `YYYY-MM-DD`).
- `notes/`: one Markdown file per note (see `content/notes/README.md`).

Edit, commit and push. If something is malformed, the build stops and tells you which entry and field is wrong.

### A piece of work

Copy this into `content/projects.json`, at the place its proof deserves. Only `id`, `title` and `subjects` are required. Leave out anything you don't have rather than guessing.

```json
{
  "id": "forest-cover-change",
  "title": "Forest cover change in North Karelia",
  "subjects": ["research"],
  "when": "2026",
  "subtitle": "One line: what it is",
  "summary": "Two sentences for the card: what it is and what came of it.",
  "role": "Course project, UEF",
  "problem": "What needed solving. Markdown.",
  "did": "- What I did, as Markdown bullets.",
  "result": "What came of it: a number, a map, a decision. Markdown.",
  "tryIt": { "label": "Try it", "href": "https://…" },
  "links": [{ "label": "Code on GitHub", "href": "https://github.com/david-adegbola/…" }],
  "media": [{ "src": "/media/forest-cover-change/map.webp", "alt": "What the image shows", "width": 1600, "height": 1000, "cover": true }]
}
```

- `id`: lowercase words joined by dashes. It is also the panel's URL: `/portfolio/#p/forest-cover-change`.
- `subjects`: any of `"field"`, `"software"`, `"research"`. They're shown as the card's tags.
- Title in Finnish (or another language)? Add `"lang": "fi"` so screen readers pronounce it correctly.
- The panel shows **The problem**, **What I did**, **Result** and **Proof** (`tryIt` first, then `links`, then `proofNote` for proof that isn't a link). Any part you leave out is simply not shown. The card's "Proof:" line is worked out from the links (code, data, PDF, live site) plus `proofNoteShort`.
- Not finished, or only planned? Add `"status": "in-progress"` and write the `subtitle` as "Planned: …" or "In progress: …". It goes in the **Learning now** block, with no panel.

### Images

- Put the file in `public/media/<id>/` (WebP). Every image needs `alt` (what's in it) plus `width` and `height` (the file's size in pixels).
- Responsive sizes: add smaller copies and list them, e.g. `"srcset": [{ "src": "/media/x/a-800.webp", "width": 800 }, { "src": "/media/x/a.webp", "width": 1600 }]`.
- `"cover": true` on one image also shows it on the homepage card.
- Portrait: `"portrait": { "src": "/media/portrait.webp", "alt": "David Adegbola", "width": 800, "height": 800 }` in `site.json`. It appears inside the rings in the hero.
- A file that isn't in `public/` yet is left out (with a build warning), never shown as an empty box.

### Notes

One Markdown file per note in `content/notes/`, with a `title` and `date` header. It gets its own page at `/portfolio/notes/<file-name>/`, and the homepage lists the newest three. The section is hidden until the first note exists. Full instructions: `content/notes/README.md`.

### CV

`site.json` → `"cv"` links the CV buttons to a PDF. It points at the combined forestry CV that the `david-adegbola/cv` repo publishes, so the portfolio always shows the latest version. Remove `"cv"` to fall back to `public/cv.pdf` if that file exists. With neither, the buttons stay hidden.

### Wording

Facts follow `CV-RULES.md` in the `david-adegbola/cv` repo (e.g. the UPM Kaukas job is the electrostatic precipitator rebuild project; own software is built with AI coding agents, never "coded by hand"; VAMK is "IT studies, not completed"; GIS is something being learned). Open questions are in `TODO-DAVID.md`.

The page dresses itself in today's season in Finland (the colour on numerals and ring centres, and snow, leaves or flowers on the treeline). Nothing to set.

## First-time GitHub setup

Repo: <https://github.com/david-adegbola/portfolio>. Paths in the JSON stay root-relative (`/media/...`); the build adds the `/portfolio/` prefix.

1. Push to `main`.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
