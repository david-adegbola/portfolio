import Fuse from 'fuse.js';
import { type ClientEntry, readEntries } from '../content/entries.ts';
import { flyTo, setFilter } from '../nav.ts';

const CONTACT = 'contact';
// Typing one of these goes straight to the clearing (email + CV).
const CONTACT_WORDS = ['cv', 'resume', 'résumé', 'contact', 'email', 'e-mail', 'mail', 'hire', 'ansioluettelo', 'yhteystiedot'];
// Typing one of these lists every research entry.
const RESEARCH_WORDS = ['research', 'paper', 'papers', 'thesis', 'publication', 'publications', 'tutkimus'];

interface Result {
  id: string;
  title: string;
  lang?: string;
  meta: string;
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function metaFor(e: ClientEntry): string {
  if (e.status === 'in-progress') return 'In progress';
  if (e.type === 'research') return 'Research';
  return e.zone === 'lake' ? 'Off the clock' : 'Work';
}

/**
 * Search: type to see matches (a combobox), then Enter, a chip, or a click runs it. Non-matches
 * fade, the camera flies to the chosen match, and a small fixed bar keeps the results within reach
 * (previous / next / clear) after the search box has scrolled away.
 */
export function initSearch(): void {
  const form = document.querySelector<HTMLFormElement>('form.search');
  const status = document.querySelector<HTMLElement>('.search-status');
  if (!form || !status) return;
  const input = form.querySelector<HTMLInputElement>('.search-input')!;
  const list = form.querySelector<HTMLUListElement>('.search-results')!;
  const empty = form.querySelector<HTMLElement>('.search-empty')!;
  const chipsBox = form.querySelector<HTMLElement>('.search-chips')!;
  const summary = status.querySelector<HTMLElement>('.search-summary')!;
  // Always in the page (never hidden), so screen readers reliably announce what it says.
  const announcer = document.getElementById('search-announce');
  const stepButtons = status.querySelectorAll<HTMLButtonElement>('.search-step');

  const entries = readEntries();
  const fuse = new Fuse(entries, {
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'tags', weight: 0.3 },
      { name: 'subtitle', weight: 0.1 },
    ],
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  });
  // Fuse's threshold lets weak partial hits through on short words ("gis" → "Mistä puu tulee").
  // Real matches score near 0; anything past this is noise.
  const MAX_SCORE = 0.5;
  const toResult = (e: ClientEntry): Result => ({ id: e.id, title: e.title, lang: e.lang, meta: metaFor(e) });

  const search = (raw: string): Result[] => {
    const q = raw.trim().toLowerCase();
    if (!q) return [];
    if (CONTACT_WORDS.includes(q)) return [{ id: CONTACT, title: 'Email and CV', meta: 'Get in touch' }];
    if (RESEARCH_WORDS.includes(q)) return entries.filter((e) => e.type === 'research').map(toResult);
    return fuse
      .search(q)
      .filter((r) => (r.score ?? 1) <= MAX_SCORE)
      .map((r) => toResult(r.item));
  };

  // Live list state (while typing) and committed search state (after Enter / chip / click).
  let options: Result[] = [];
  let highlighted = 0;
  let committed: { query: string; results: Result[]; index: number } | null = null;

  const closeList = () => {
    list.hidden = true;
    empty.textContent = '';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };

  const renderList = () => {
    const q = input.value.trim();
    options = search(q);
    highlighted = 0;
    if (!q) return closeList();
    if (!options.length) {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      const chipNames = availableChips.filter((c) => c.toLowerCase() !== q.toLowerCase()).slice(0, 3);
      const tryThese = chipNames.length ? ` Try ${chipNames.join(', ')}.` : '';
      empty.textContent = RESEARCH_WORDS.includes(q.toLowerCase())
        ? `No research papers here yet.${tryThese}`
        : `Nothing matches “${q}”.${tryThese}`;
      return;
    }
    empty.textContent = '';
    list.replaceChildren(
      ...options.map((r, i) => {
        const li = document.createElement('li');
        li.id = `search-option-${i}`;
        li.className = 'search-option';
        li.setAttribute('role', 'option');
        li.innerHTML = `<span class="search-option-title"></span><span class="search-option-meta"></span>`;
        li.firstElementChild!.textContent = r.title;
        if (r.lang) li.firstElementChild!.setAttribute('lang', r.lang);
        li.lastElementChild!.textContent = r.meta;
        // Keep focus in the input while clicking an option.
        li.addEventListener('mousedown', (e) => e.preventDefault());
        li.addEventListener('click', () => commit(q, options, i));
        return li;
      }),
    );
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    highlight(0);
  };

  const highlight = (i: number) => {
    highlighted = (i + options.length) % options.length;
    list.querySelectorAll('.search-option').forEach((el, j) => el.setAttribute('aria-selected', String(j === highlighted)));
    input.setAttribute('aria-activedescendant', `search-option-${highlighted}`);
    list.children[highlighted]?.scrollIntoView({ block: 'nearest' });
  };

  /** Focus the arrived-at card, so keyboard and screen-reader users land on the result too. */
  const focusTarget = (id: string) => {
    const el =
      id === CONTACT
        ? document.getElementById('contact-h')
        : (document.querySelector<HTMLElement>(`[id="${id}"] .card-link`) ?? document.getElementById(id));
    if (!el) return;
    if (!el.matches('a, button, input')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };

  let flightToken = 0;
  const go = async (result: Result, fadeFirst: boolean) => {
    const token = ++flightToken;
    // One moving thing at a time: let non-matches fade before the camera moves.
    if (fadeFirst && !reducedMotion()) await new Promise((r) => setTimeout(r, 450));
    if (token !== flightToken) return;
    await flyTo(result.id);
    if (token === flightToken) focusTarget(result.id);
  };

  const showStatus = () => {
    if (!committed) {
      status.hidden = true;
      return;
    }
    const { query, results, index } = committed;
    const current = results[index];
    summary.textContent =
      results.length > 1
        ? `“${query}”: ${index + 1} of ${results.length}, ${current.title}`
        : `“${query}”: ${current.title}`;
    if (announcer) announcer.textContent = summary.textContent;
    stepButtons.forEach((b) => (b.hidden = results.length < 2));
    status.hidden = false;
  };

  const commit = (query: string, results: Result[], index: number) => {
    closeList();
    if (!results.length) return;
    const ids = results.map((r) => r.id);
    const sameFilter = committed && committed.results.map((r) => r.id).join() === ids.join();
    committed = { query: query.trim(), results, index };
    // The contact shortcut isn't a filter: nothing needs to fade.
    const filtering = !(results.length === 1 && results[0].id === CONTACT);
    if (!sameFilter) setFilter(filtering ? ids : null);
    showStatus();
    go(results[index], filtering && !sameFilter);
  };

  const clear = () => {
    flightToken++;
    if (announcer) announcer.textContent = committed ? 'Search cleared' : '';
    committed = null;
    input.value = '';
    closeList();
    setFilter(null);
    showStatus();
  };

  // Chips: only those that currently find something, so the site never offers a dead end.
  const chips = JSON.parse(form.dataset.chips || '[]') as string[];
  const availableChips = chips.filter((c) => search(c).length > 0);
  chipsBox.replaceChildren(
    ...availableChips.map((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'search-chip';
      b.textContent = c;
      b.addEventListener('click', () => {
        input.value = c;
        commit(c, search(c), 0);
      });
      return b;
    }),
  );
  chipsBox.hidden = availableChips.length === 0;

  input.addEventListener('input', renderList);
  input.addEventListener('focus', () => input.value.trim() && !committed && renderList());
  input.addEventListener('blur', () => setTimeout(closeList, 120));
  input.addEventListener('keydown', (e) => {
    const open = !list.hidden;
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      highlight(highlighted + 1);
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      highlight(highlighted - 1);
    } else if (e.key === 'Escape') {
      if (open || empty.textContent) closeList();
      else if (committed || input.value) clear();
      e.preventDefault();
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value;
    const results = search(q);
    if (results.length) commit(q, results, list.hidden ? 0 : highlighted);
    else renderList();
  });

  stepButtons.forEach((b) =>
    b.addEventListener('click', () => {
      if (!committed) return;
      const n = committed.results.length;
      committed.index = (committed.index + Number(b.dataset.step) + n) % n;
      showStatus();
      go(committed.results[committed.index], false);
    }),
  );
  status.querySelector('.search-clear')!.addEventListener('click', clear);

  // Esc clears a search when nothing else is open. (No single-letter shortcuts: speech-input users
  // trigger those by accident, WCAG 2.1.4. The header search button is the way back to search.)
  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]');
    const panelOpen = document.querySelector<HTMLDialogElement>('dialog.panel')?.open;
    if (typing || panelOpen) return;
    if (e.key === 'Escape' && committed) clear();
  });

  // The header button keeps search one tap away once the hero has scrolled off (vital on phones).
  const headerButton = document.querySelector<HTMLButtonElement>('.header-search');
  const toSearch = () => flyTo('top').then(() => input.focus({ preventScroll: true }));
  headerButton?.addEventListener('click', toSearch);
}
