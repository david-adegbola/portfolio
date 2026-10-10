# portfolio

Personal portfolio of David Adegbola. Live at https://david-adegbola.github.io/portfolio/

Every push to `main` builds the site and deploys it to GitHub Pages (`.github/workflows/deploy.yml`).

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

## Add or edit content (no code needed)

All content lives in two files:

- `content/site.json`: name, intro, about text, skills, email, links
- `content/projects.json`: every project and research entry

Edit the JSON, commit and push. If an entry is malformed, the build stops and tells you which entry and field is wrong.

### A project

Copy this into the list in `content/projects.json`. Only `id`, `zone` and `title` are required; leave out anything you don't have.

```json
{
  "id": "forest-cover-change",
  "zone": "forest",
  "title": "Forest cover change in North Karelia",
  "subtitle": "One line: what it is",
  "tags": ["GIS", "remote sensing", "Sentinel-2"],
  "year": 2026,
  "role": "What I did",
  "tools": ["QGIS", "Python"],
  "summary": "1–2 sentences: problem → method → result.",
  "body": "Longer **markdown**: data source, method, result, what I learned.",
  "media": [{ "type": "image", "src": "/media/forest-cover-change/map.webp", "alt": "Describe the image" }],
  "links": [{ "label": "Code", "href": "https://github.com/david-adegbola/..." }],
  "sceneObject": "marker"
}
```

- `id`: lowercase words joined by dashes. It is also the URL: `/portfolio/#p/forest-cover-change`.
- Title in Finnish (or another language)? Add `"lang": "fi"` so screen readers pronounce it correctly.
- Leave out `summary` if it would only repeat the `subtitle`.
- `zone`: `"forest"` for main work, `"lake"` for side work ("Off the clock").
- Images go in `public/media/<id>/` as `.webp`. A missing file is left out, never shown broken.
- Not finished yet? Add `"status": "in-progress"`. It shows as a faint "In progress" card with no detail panel.

### A research paper

```json
{
  "id": "example-paper",
  "type": "research",
  "zone": "forest",
  "title": "Paper title",
  "authors": ["David Adegbola"],
  "year": 2026,
  "context": "UEF course, thesis, or independent study",
  "abstract": "Short abstract for a non-specialist reader.",
  "tags": ["forestry", "carbon"],
  "pdf": "/research/example-paper.pdf",
  "sceneObject": "tree-ring"
}
```

Put the PDF in `public/research/`. The entry shows Read PDF and Download buttons once the file exists.

### CV

Drop the file in as `public/cv.pdf`. The CV button appears in the header automatically; until then it stays hidden.

## First-time GitHub setup

Repo: https://github.com/david-adegbola/portfolio. Paths in the JSON stay root-relative (`/media/...`); the build adds the `/portfolio/` prefix.

1. Push to `main`.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
