# Notes

One file per note. A new note needs only a new file here, then a push.

- File name = URL: `soil-sample-checklist.md` → `/portfolio/notes/soil-sample-checklist/`.
  Lowercase words joined by dashes. Don't rename a file once it's published (the URL would change).
- Start the file with this header, then write in Markdown:

```
---
title: What a soil sample has to record
date: 2026-11-20
summary: One sentence for the homepage list (optional).
---

Your text…
```

- `date` is `YYYY-MM-DD`. The homepage shows the newest three; `/portfolio/notes/` lists all.
- A file name starting with `_` is a draft and isn't published. This README is skipped too.
- Images: put them in `public/media/notes/` and write `![What the photo shows](/media/notes/photo.webp)`.
- The Notes section stays hidden until there's at least one note.
