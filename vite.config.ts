import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { type Content, loadContent, missingFiles } from './src/content/load.ts';
import { renderFooter, renderHead, renderHeader, renderMain, renderNotePages, renderTemplates } from './src/content/render.tsx';
import { seasonInFinland } from './src/seasons.ts';

const root = process.cwd();
// Repo is david-adegbola/portfolio, so GitHub Pages serves the site at /portfolio/.
const base = '/portfolio/';
/** Note pages carry this where the stylesheet and head script go (see NotePages.tsx). */
const ASSETS_MARK = '<meta name="x-page-assets" content=""/>';

/** Content paths are written root-relative ("/cv.pdf", "/media/<id>/x.webp"); point them at the base. */
const withBase = (html: string) =>
  html
    .replace(/\b(href|src)="\/(?!\/)/g, `$1="${base}`)
    .replace(/\bsrcset="([^"]*)"/g, (_, v: string) => `srcset="${v.split(',').map((part) => part.trim().replace(/^\/(?!\/)/, base)).join(', ')}"`);

function load(warn?: (msg: string) => void) {
  const c: Content = loadContent(root);
  const missing = missingFiles(root, c);
  for (const file of missing) warn?.(`Referenced in content/ but not in /public yet (left out): ${file}`);
  const localCv = fs.existsSync(path.join(root, 'public/cv.pdf')) ? '/cv.pdf' : undefined;
  return { content: c, opts: { cv: c.site.cv ?? localCv, missing: new Set(missing) } };
}

/** Pre-renders content/ into index.html (dev and build) and writes the note pages (build). */
function content(): Plugin {
  return {
    name: 'portfolio-content',
    configureServer(server) {
      const watched = [path.join(root, 'content'), path.join(root, 'public/cv.pdf')];
      server.watcher.add(watched);
      const reload = (file: string) => {
        if (watched.some((w) => file.startsWith(w))) server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('change', reload).on('add', reload).on('unlink', reload);
      // Note pages in dev: rendered on request, styled through a tiny module entry.
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        const m = /^\/portfolio\/(notes\/(?:[a-z0-9-]+\/)?)$/.exec(url);
        if (!m) return next();
        const { content: c, opts } = load();
        const page = renderNotePages(c, opts)[`${m[1]}index.html`];
        if (!page) return next();
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(withBase(page).replace(ASSETS_MARK, `<script type="module" src="${base}src/note-styles.ts"></script>`));
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const { content: c, opts } = load((msg) => this.warn?.(msg));
        return (
          html
            // Without JS the page wears the build day's season; the head script updates it to today's.
            .replace('data-season="summer"', `data-season="${seasonInFinland()}"`)
            .replace('<!--head-->', renderHead(c.site))
            .replace('<!--header-->', withBase(renderHeader(c, opts)))
            .replace('<!--main-->', withBase(renderMain(c, opts)))
            .replace('<!--footer-->', withBase(renderFooter(c.site)))
            .replace('<!--templates-->', withBase(renderTemplates(c, opts)))
        );
      },
    },
    generateBundle() {
      const { content: c, opts } = load();
      for (const [fileName, source] of Object.entries(renderNotePages(c, opts))) {
        this.emitFile({ type: 'asset', fileName, source: withBase(source).replace('data-season="summer"', `data-season="${seasonInFinland()}"`) });
      }
    },
  };
}

/**
 * Inlines the page's (small) stylesheet into index.html, so first paint doesn't wait on a second
 * request, and gives the note pages the same stylesheet and head script.
 */
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      let source = String(html.source);
      let css = '';
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type !== 'asset' || !name.endsWith('.css')) continue;
        const link = new RegExp(`<link rel="stylesheet"[^>]*href="${base}${name}"[^>]*>`);
        if (!link.test(source)) continue;
        css += String(file.source);
        source = source.replace(link, () => `<style>${file.source}</style>`);
        delete bundle[name];
      }
      html.source = source;
      const headScript = /<script>[\s\S]*?<\/script>/.exec(source)?.[0] ?? '';
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type !== 'asset' || !name.startsWith('notes/') || !name.endsWith('.html')) continue;
        file.source = String(file.source).replace(ASSETS_MARK, () => `${headScript}<style>${css}</style>`);
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), content(), inlineCss()],
  resolve: { alias: { '@': path.join(root, 'src') } },
  build: {
    // The styleguide (DESIGN.md §3.6) is a second page at /portfolio/styleguide/, noindex and unlinked.
    rollupOptions: { input: { main: path.join(root, 'index.html'), styleguide: path.join(root, 'styleguide/index.html') } },
  },
});
