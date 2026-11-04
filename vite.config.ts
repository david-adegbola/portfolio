import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { loadContent, missingFiles } from './src/content/load.ts';
import { renderEntriesData, renderFooter, renderHead, renderHeader, renderMain, renderTemplates } from './src/content/render.tsx';

const root = process.cwd();
// Repo is david-adegbola/portfolio, so GitHub Pages serves the site at /portfolio/.
const base = '/portfolio/';

/** Content paths are written root-relative ("/cv.pdf", "/media/<id>/x.webp"); point them at the base. */
const withBase = (html: string) => html.replace(/\b(href|src)="\/(?!\/)/g, `$1="${base}`);

/** Pre-renders content/*.json into index.html, in dev and in the build. */
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
    },
    transformIndexHtml(html) {
      const { site, entries } = loadContent(root);
      const missing = missingFiles(root, entries);
      for (const file of missing) this.warn?.(`Referenced in projects.json but not in /public yet (left out): ${file}`);
      const localCv = fs.existsSync(path.join(root, 'public/cv.pdf')) ? '/cv.pdf' : undefined;
      const opts = { cv: site.cv ?? localCv, missing: new Set(missing) };
      return html
        .replace('<!--head-->', renderHead(site))
        .replace('<!--header-->', withBase(renderHeader(site, entries, opts)))
        .replace('<!--main-->', withBase(renderMain(site, entries, opts)))
        .replace('<!--footer-->', renderFooter(site))
        .replace('<!--templates-->', withBase(renderTemplates(entries, opts)) + renderEntriesData(entries));
    },
  };
}

/**
 * Inlines the page's (small) stylesheet into index.html, so first paint doesn't wait on a second
 * request. Lazy-loaded CSS (the scene chunk's) stays a separate file.
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
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type !== 'asset' || !name.endsWith('.css')) continue;
        const link = new RegExp(`<link rel="stylesheet"[^>]*href="${base}${name}"[^>]*>`);
        if (!link.test(source)) continue;
        source = source.replace(link, () => `<style>${file.source}</style>`);
        delete bundle[name];
      }
      html.source = source;
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), content(), inlineCss()],
  resolve: { alias: { '@': path.join(root, 'src') } },
  // three.js is one ~190 KB gzipped chunk, loaded after the page is readable; budget is ~300 KB total.
  build: {
    chunkSizeWarningLimit: 800,
    // The styleguide (DESIGN.md §3.6) is a second page at /portfolio/styleguide/, noindex and unlinked.
    rollupOptions: { input: { main: path.join(root, 'index.html'), styleguide: path.join(root, 'styleguide/index.html') } },
  },
});
