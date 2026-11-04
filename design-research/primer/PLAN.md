# Redesign plan (draft, awaiting David's approval)

Branch `redesign`. One phase per commit; build (and, once set up, lint + tests) run in the `portfolio-dev` container after each. Preview shown to David after each phase (CLAUDE.md).

## Phase 0 – Stack move (parity, no visual change)
- Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (DESIGN §0 stack). **Not Next.js** unless David prefers it: Next adds ~90 KB gz of runtime, and the JS budget is ~300 KB with the 198 KB forest chunk.
- Keep build-time pre-rendering: the Vite plugin renders the React tree with `react-dom/server` into `index.html`, so every word is still in the HTML before JS runs (brief §6.1). The client hydrates.
- Keep unchanged: `content/*.json` + `load.ts` validation, `base: '/portfolio/'`, `#p/<id>` URLs, section anchors, the vanilla three.js scene (mounted once from React), `nav.ts` bridge, reduced-motion and WebGL fallbacks, deploy workflow.
- Add: ESLint + a small Vitest suite (content loader, search ranking, objectKind) so "run lint and tests" (DESIGN §5.5) means something.
- Exit check: page looks and behaves as today; JS budget recorded.

## Phase 1 – Foundations
- Tokens in `src/globals.css` (light + `.dark`, `@theme inline`): colour roles, type scale, spacing, radius, elevation, focus, from foundations-ui.md + the chosen brand option.
- Fonts; dark mode on the `.dark` class (keeps the system default + manual toggle).
- Update brief §3 and CLAUDE.md with the new tokens.

## Phase 2 – Components
- shadcn: Button (variants primary / default / invisible, sizes incl. 44px touch), Sheet (detail panel), ToggleGroup (seasons), Badge (In progress), Popover-free combobox (keep APG behaviour; shadcn Command's cmdk changes keyboard semantics, so only its styling is reused).
- Patterns in `src/components/patterns/`: `SectionNav`, `IndexList` + `IndexItem` (numbered entry, optional thumbnail), `SearchBox`, `SearchStatus`, `SeasonSwitcher`, `ContactBlock`.
- `/styleguide/` page (noindex, not linked) showing every component in every state, light and dark (DESIGN §3.6).

## Phase 3 – Flows (highest audit severity first)
1. Browse work → open detail (X2, X7, X8)
2. Section navigation (X3)
3. Landing / hero (X4): numbered statements from the About text
4. Search (U3, X5 touch targets)
5. Contact (closing prompt)

## Phase 4 – Polish
Non-colour found cue (U5), off-scale sizes (U6), reduced motion and 375px pass, Lighthouse (container + headless Chromium, needs David's approval), regenerate `og.jpg`, mark AUDIT findings resolved.
