# DESIGN.md — Research-Driven UI & UX System for Claude Code

> Add this line to the project's `CLAUDE.md`:
> `Before any UI or UX work, read DESIGN.md and follow its research protocol. Never design a component, pattern or flow from memory when the reference system's docs can be checked.`

---

## 0. Configuration (edit per project)

```
STACK:      shadcn/ui + Tailwind CSS (v4) + React/Next.js
LEAD:       primer            # source of truth: radix | material | carbon | primer | atlassian
CONSULT:    carbon            # optional: compared on complex components and UX patterns
USERS:      Recruiters and hiring managers in Finnish forestry, GIS and the forest industry
KEY TASKS:  See who David is in seconds; email him; open his CV; skim his work and research; find a topic via search
```

- **LEAD** decides look, behaviour and patterns. **CONSULT** systems are for comparison and filling gaps only.
- If LEAD and CONSULT disagree, LEAD wins unless I approve the change.
- **Radix is a component and colour system with little UX pattern guidance.** If LEAD is `radix`, take UX patterns from the first CONSULT system plus the general UX sources in §2, and record that choice.

---

## 1. Core idea

- **shadcn/ui + Tailwind** = implementation layer.
- **LEAD design system** = source of truth for **UI** (how things look: shading, elevation, components, states) and **UX** (how things work: navigation, forms, feedback, errors, empty and loading states, content, flows).
- **General UX standards** = the baseline every design must pass, whatever the LEAD.

Claude must **check the official docs** for how the LEAD system handles each component, pattern and flow decision, write down what it found, then implement it. Do not rely on memory of a design system.

---

## 2. Official sources

Start from these roots and navigate or search within them. If a path has moved, search `site:<domain> <topic>`.

### Design systems

| System | UI: foundations & components | UX: patterns & content | Source / tokens |
|---|---|---|---|
| **Radix** | radix-ui.com/themes/docs, radix-ui.com/colors/docs | minimal; use CONSULT + general sources | github.com/radix-ui/themes, github.com/radix-ui/colors |
| **Material 3** | m3.material.io → Styles, Components | m3.material.io → Foundations (interaction, accessibility, layout, content design) | github.com/material-components/material-web |
| **Carbon** | carbondesignsystem.com → Elements, Components | carbondesignsystem.com → Patterns (forms, empty states, notifications, loading, data tables, login, dialogs and more), Guidelines (accessibility, content) | github.com/carbon-design-system/carbon |
| **Primer** | primer.style → Foundations/Primitives, Components | primer.style → UI patterns (forms, empty states, loading, saving, messaging, navigation), Content | github.com/primer/primitives, github.com/primer/react |
| **Atlassian** | atlassian.design → Foundations, Components | atlassian.design → Patterns, Content (voice & tone, writing guidelines) | atlassian.design/foundations/tokens |

### General UX standards (always apply)

| Topic | Source |
|---|---|
| Usability heuristics | nngroup.com: Nielsen's 10 usability heuristics |
| Accessibility | WCAG 2.2 AA (w3.org/WAI/WCAG22/quickref) |
| Keyboard & ARIA interaction patterns | WAI-ARIA Authoring Practices Guide (w3.org/WAI/ARIA/apg/patterns) |
| Forms, errors, navigation research | nngroup.com articles on the specific pattern |

If a docs site fetches poorly (Material is JavaScript-heavy), use the GitHub source or a browser tool.

---

## 3. Research protocol

All research is saved under `design-research/<lead>/` and **reused**. Read existing files before fetching again.

### 3.1 UI foundations (once per project) → `foundations-ui.md`
- **Colour:** palette structure; which shade is used for background, subtle surface, hover, pressed, selected, border, text and solid fill; tints and overlays; dark mode.
- **Shading & elevation:** how depth is shown (shadows, tonal surfaces, layers or borders), the levels, which components sit at each level, dark mode behaviour.
- **Shape, spacing & grid, typography, motion:** with actual values and token names.
- **Interaction states:** how hover, focus, pressed, selected, disabled and loading are expressed.

### 3.2 UX foundations (once per project) → `foundations-ux.md`
Research how the LEAD system (or CONSULT/general sources where LEAD is silent) handles:
- **Information architecture & navigation:** global nav vs local nav, breadcrumbs, tabs vs pages, depth, how users know where they are.
- **Forms:** layout (single column, grouping), labels, required/optional marking, help text, validation timing, error messages, multi-step forms, saving.
- **Feedback & messaging:** when to use toast vs inline alert vs banner vs dialog; success, warning and error behaviour; persistence and dismissal.
- **Loading, saving & progress:** skeletons vs spinners vs progress bars, optimistic updates, autosave vs explicit save.
- **Empty states:** first-use, no results, cleared, error; what each must contain.
- **Destructive & irreversible actions:** confirmation, undo, wording.
- **Search, filter & sort:** placement, behaviour and how results update.
- **Data display:** tables vs lists vs cards, pagination vs infinite scroll, bulk actions.
- **Onboarding & first run.**
- **Content & voice:** tone, capitalisation, button and label wording, error-message formula, plain language.
- **Accessibility & keyboard:** focus order, focus management in dialogs and route changes, shortcuts, screen reader announcements.
- **Responsive behaviour:** what changes at mobile, touch target sizes.

### 3.3 Components (each time one is first needed) → `components/<component>.md`
1. Anatomy. 2. Variants and **when to use each**. 3. Sizes. 4. All states and how each is shaded. 5. Elevation. 6. Placement & behaviour rules (do/don't). 7. Accessibility (keyboard, ARIA; check APG for the matching pattern). 8. Content rules. 9. Sources.
For complex components, add a comparison with CONSULT systems.

### 3.4 Patterns & flows (each time a flow is designed or changed) → `patterns/<pattern>.md` and `flows/<flow>.md`
For a **pattern** (e.g. form validation, empty state, delete confirmation): the LEAD guidance, CONSULT comparison, the general-standard check, and the decision for this project.

For a **flow** (e.g. sign-up, create item, checkout, settings):
1. **Goal:** what the user is trying to do; which KEY TASK it serves.
2. **Current steps** (if existing): screens, decisions, errors, dead ends.
3. **Target steps:** fewest steps that still prevent errors; which patterns from §3.2 apply at each step.
4. **States per step:** loading, empty, error, success, and partial or slow network.
5. **Edge cases:** permissions, no data, very long content, offline, back button and refresh, mid-flow abandonment.
6. **Heuristic check:** Nielsen's 10 against the target flow.
7. **Accessibility check:** keyboard-only and screen-reader walkthrough.

### 3.5 Translate to shadcn
Add a mapping table to each research file (LEAD concept → shadcn component, variant or Tailwind token). Add missing tokens to `app/globals.css` (light + `.dark`, exposed via `@theme inline`). Edit shadcn source in `components/ui/` so defaults match the research. Build reusable pattern components (e.g. `EmptyState`, `ConfirmDestructive`, `FormField`, `PageHeader`) in `components/patterns/`. Comment each with the research file it's based on.

### 3.6 Verify
- **UI:** a `/styleguide` route showing every component in all variants, sizes and states, light and dark.
- **UX:** walk each changed flow end to end, including error, empty and loading states, keyboard-only and at mobile width. Screenshot where tools allow.
- List deviations from the research and why.

---

## 4. Audit protocol

Use when asked for a design audit. **An audit does not change code.**

Output: `design-audit/AUDIT.md`, plus screenshots in `design-audit/screens/` if a browser tool is available.

### 4.1 Inventory
- Routes/screens, layouts, and the components in use (shadcn, custom, third-party).
- Styling sources: global CSS, Tailwind config/theme, inline styles, CSS modules, hardcoded values.
- Key user flows mapped from the code and routes, matched to KEY TASKS.

### 4.2 UI audit
- Token use vs hardcoded colours, spacing, radii and shadows (count and locations).
- Duplicate or near-duplicate components (e.g. three different button styles).
- Inconsistent shading: hover, pressed, selected and disabled handled differently across the app.
- Elevation consistency; dark mode coverage; typography scale consistency.
- Contrast failures; focus visibility.
- Gaps vs the LEAD system's component guidance.

### 4.3 UX audit
- Each key flow: steps, friction, dead ends, missing states (loading, empty, error, success).
- Navigation & IA: can users tell where they are and get back?
- Forms: labels, validation timing, error clarity, data loss on error or refresh.
- Feedback: are actions confirmed? Are errors actionable?
- Destructive actions: confirmation and undo.
- Content: inconsistent wording, jargon, vague buttons ("OK", "Submit").
- Accessibility: keyboard traps, focus management, missing labels or ARIA, touch targets.
- Responsive: broken layouts and unusable controls at 375px.
- Nielsen's 10 heuristics, applied to the app as a whole.

### 4.4 Findings format
Each finding has:
`ID | Area (UI/UX) | Severity (critical / high / medium / low) | Where (route, file:line) | What's wrong | Evidence | Which rule or source it breaks | Recommended fix | Effort (S/M/L)`

Severity guide:
- **Critical:** blocks a key task, loses data, or fails accessibility in a way that prevents use.
- **High:** causes frequent errors or confusion on a key flow.
- **Medium:** inconsistency or friction.
- **Low:** polish.

End the audit with: top 10 fixes by impact ÷ effort, and a proposed redesign phase plan.

---

## 5. Redesign protocol

Use when asked to redesign. Work on a **new git branch**.

1. **Audit first** (§4) if no current `design-audit/AUDIT.md` exists.
2. **Research foundations** (§3.1, §3.2) and show me a summary (palette, elevation, radius, type, key UX pattern decisions) **before changing code**.
3. **Plan** in phases and get my approval:
   - **Phase 1 – Foundations:** tokens in `globals.css`, typography, dark mode. No layout changes yet.
   - **Phase 2 – Components:** align `components/ui/` with research; replace duplicates; build `components/patterns/`.
   - **Phase 3 – Flows:** redesign one key flow at a time (§3.4), highest audit severity first.
   - **Phase 4 – Remaining screens & polish.**
4. **Preserve behaviour:** do not remove features, change routes, data models, API calls or business logic unless I approve. Redesign how things look and work for the user, not what the product does.
5. **Small, reviewable steps:** one phase or one flow per commit, with a short note. Run the build, lint and tests after each.
6. **Before/after:** screenshots or a written comparison per flow, linked to the audit finding IDs it fixes.
7. **Update** the research files and AUDIT.md (mark findings resolved).

---

## 6. Rules that always apply

1. **shadcn/ui is the component layer.** Add components with `npx shadcn@latest add <name>`; never hand-build what shadcn provides.
2. **Tokens only.** No hardcoded colours, spacing, radii or shadows in components. Exact values from research go into tokens first.
3. **Every screen has every state:** loading, empty, error, success. Never ship a happy-path-only screen.
4. **Accessibility:** WCAG 2.2 AA minimum, plus LEAD requirements, plus APG keyboard patterns. Focus is managed on dialogs and route changes.
5. **Mobile-first;** touch targets of at least 44×44px (or LEAD's spec if larger).
6. **Content:** verb-first buttons, plain language, and error messages that say what happened and how to fix it. Follow the LEAD voice guidance.
7. **Emulate, don't copy identity.** Follow structure, behaviour and patterns. No logos, illustrations, or proprietary fonts and icons; use open substitutes.
8. **No silent blending.** Anything taken from a CONSULT system is noted in research and approved.
9. **If research, these rules and my request conflict, ask me.**

---

## 7. Brand overrides (fill in per project)

The LEAD system supplies structure and behaviour; these supply identity. Overrides win where they conflict.

```
Brand name:
Primary/accent colour (hex):
Neutral tint:
Heading font:
Body font:
Voice (3 words):
Things to avoid:
```
