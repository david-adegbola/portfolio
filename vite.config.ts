import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { loadContent, missingFiles } from './src/content/load.ts';
import { renderFooter, renderHead, renderHeader, renderMain, renderTemplates } from './src/content/render.ts';

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
      const opts = { hasCv: fs.existsSync(path.join(root, 'public/cv.pdf')), missing: new Set(missing) };
      return html
        .replace('<!--head-->', renderHead(site))
        .replace('<!--header-->', withBase(renderHeader(site, opts)))
        .replace('<!--main-->', withBase(renderMain(site, entries, opts)))
        .replace('<!--footer-->', renderFooter(site))
        .replace('<!--templates-->', withBase(renderTemplates(entries, opts)));
    },
  };
}

export default defineConfig({
  base,
  plugins: [content()],
});
