# TODO for David

Things the site needs from you. Nothing here is on the site as a placeholder. Where something
is missing, the site leaves it out.

## 1. Pick the hero

Used now: **Option A**. The text lives in `content/site.json` (`headline`, `statements`).

**A (used): forestry first, computing as the extra**
> Forestry student at the University of Eastern Finland, with a computing background. I can work in the forest, on a research project or on the technical side.
> 1. I started in computing: an OND in Computer Science in Ibadan, Nigeria, then IT studies at VAMK in Vaasa.
> 2. In 2025 I worked as a fitter at the UPM Kaukas pulp mill. My employer rated my work excellent.
> 3. Now I study Sustainable Forest Bioeconomy at UEF. I measure trees and sample soil on field courses, and I'm learning GIS.

**B: the mill as the turning point**
> I study forest bioeconomy at UEF and came to forestry from computing, so I'm useful in the field and at the keyboard.
> 1. Computing first: an OND in Computer Science (Ibadan, 2019–2022), then IT studies at VAMK.
> 2. A fitter's job at UPM Kaukas in 2025 showed me the forest industry from the inside. Employer rating: excellent.
> 3. Now at UEF: tree measurement and soil sampling on field courses, GIS next.

**C: what you offer, up front**
> Field work, research help or technical work: a forestry student at UEF who knows computers.
> 1. Studied Computer Science in Nigeria (OND, 2019–2022) and IT at VAMK in Vaasa.
> 2. Worked at the UPM Kaukas pulp mill in 2025, rated excellent by my employer.
> 3. Studying Sustainable Forest Bioeconomy at UEF, with field work in tree measurement and soil sampling.

## 2. Confirm before sending the site to anyone

- [ ] **Availability.** The contact section still says *"I can work full-time, start immediately and travel anywhere in Finland."* I didn't change this. Confirm full-time and "start immediately" against your study schedule.
- [ ] **"Currently" line** (`content/now.json`): *"First year of Sustainable Forest Bioeconomy at UEF in Joensuu. Learning GIS and Finnish."* Is it right? Update `text` and `updated` whenever it changes.
- [ ] **How the temperature logger was made.** The Work section says once: *"For my own software I use an AI coding agent (Claude Code): I write the spec and check the result."* The logger dates from November 2025, before your AI-agent projects (from January 2026 on your CV). Was it written with an agent, by you as coursework (VAMK?), or both? CV-RULES says never to claim you write code by hand, so tell me which and I'll word it exactly.
- [ ] **Raspberry Pi.** The code reads the sensor through Linux's 1-Wire interface but doesn't name the board. The site says Raspberry Pi because your brief did. Which model, if you want it named?

## 3. Missing proof

- [ ] **Mistä puu tulee has no live version.** The repo only says "open `index.html`". `david-adegbola.github.io/sufobe/` serves a different app called "Kasva!". Deploy the simulation (e.g. GitHub Pages from the `sufobe` repo) and send me the URL. A **Try it** button then goes above the code link (`"tryIt"` in `content/projects.json`).
- [ ] **Mistä puu tulee result.** Has it been used with a class or shown to a teacher? Anything you can say (how many pupils, before/after answers from the teacher panel) becomes its **Result**. Without it, the panel has no Result section.
- [ ] **Hetkin outcomes.** What came of the residency and the pitch: users, a pilot, feedback, a decision, a demo day? hetkin.app shows only the name and tagline. Without an outcome, the panel has no Result section.
- [ ] **Job scraper.** Is it still running? Any result you can state (jobs found, applications made from it)?
- [ ] **Forest ecology field work.** The course name or code and the dates. Photos would be the proof (see 4).
- [ ] **Hands-on IT, two lines from your brief.** "Set up a domain and email routing with Cloudflare and Resend" and "Connected a store's TV to a server so it could show ads." For what or whom, and when? A sentence of context makes each one proof rather than a claim. They aren't in the CV repo yet (see 6).

## 4. Photos to supply

None are on the site yet. Each image needs alt text (what's in it) and its size in pixels. Put the files in `public/media/<id>/` as `.webp`; I'll wire them in, or see the README ("Images").

- [ ] **Portrait**, square, at least 800×800. It goes inside the rings in the hero (`site.json` `portrait`).
- [ ] **Tree measuring** on the field course (calliper, tape or clinometer in use).
- [ ] **Soil sampling**: a sample bag with its QR code, or the pit and the checklist.
- [ ] **Mill site**, only if Axioma / UPM allow photos to be published. No people's faces without their OK.
- [ ] **Mistä puu tulee** screenshots: 2–3 steps of the lesson, plus the teacher panel.
- [ ] Optional: the temperature sensor wired to the Pi.
- [ ] Optional: hetkin.app screenshot.

## 5. Notes: three titles from your real work

The Notes section is built and hidden until there's a first note. Add `content/notes/<name>.md` (see `content/notes/README.md`). I won't write them for you. Suggested titles:

1. **What one soil sample has to record**: the field checklist from the forest ecology course, and why each item is there.
2. **Reading a DS18B20 sensor on a Raspberry Pi**: the 1-Wire interface, CRC checks, and what 51 readings over a night looked like.
3. **Keeping an AI coding agent to the facts**: the rules file behind your CVs, and what it stops.

## 6. Where the site and your CV disagree

I didn't change the CV repo.

- [ ] **Forest measurement.** The forestry CV lists it under *Want to learn*. The site says you measured trees on the forest ecology field course. Both can be true (a course is not a skill yet), but an employer may read them as a contradiction. Decide on one wording. Either add the field course to the CV, or change the site to "Learning: tree measurement (forest ecology field course)".
- [ ] **Field work, temperature logger, Linux, Cloudflare/Resend, store TV.** All on the site, none in the forestry CV, and the last three are not in CV-RULES §7 either. If they're true, add them to CV-RULES so every CV agrees.
- [ ] **Hands-on IT list** (servers, network cables, Active Directory). It comes from CV-RULES §7 (confirmed for the IT Field Technician CV). The forestry CV linked from the site leaves it out. That's fine, but it's a difference.
- [ ] **Travel.** The CV says "can work anywhere in Finland" / "travel". The site says "travel anywhere in Finland". Same meaning, slightly different words.

## 7. Other

- [ ] **Share image.** `public/og.jpg` still shows the old 3D forest. I can make a new one from the rings and treeline (needs no 3D) when you say.
- [ ] **Search** was removed (see the summary for why). Say if you want a small header search back.
