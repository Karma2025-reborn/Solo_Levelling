# ARETE · Level up in real life

Offline-first fitness + habit PWA (formerly "Hunter System"). Plain HTML/CSS/JS, no build step,
no backend, no tracking. Hosted on GitHub Pages from repo `Karma2025-reborn/Solo_Levelling`
(branch `master`, root): https://karma2025-reborn.github.io/Solo_Levelling/

## Hard rules
- **Never rename or break localStorage keys.** Prefix is `hunter:` (`P` in `js/app.js`). It stays
  `hunter:` even though the app is now ARETE. If a stored format must change, add a one-time
  migration guarded by a flag key (see `spiroMig`, `mver` at the top of `js/app.js`).
- **Backup format is fixed:** `{app:'hunter', v:2, saved, data}`. Import must keep accepting
  `app:'hunter'`. Only the *file name* changed (`arete-backup-YYYY-MM-DD.json`).
- Keep **Save backup / Restore**, **Export for analysis** (summary, .json, .csv) and **Start fresh** working.
- Internal identifiers that are not user-visible keep their old names on purpose:
  `window.HUNTER_ASTHMA`, `window.HunterExport`, `.ics` event UIDs (`hunter-…@hunter.app`, so
  re-importing the calendar file doesn't duplicate events), manifest `"id": "./"` (keeps the install).
- Profile fields added in v8: `prof.name`, `prof.goal` (`cut` | `strength` | `both`, display only: it does
  not change training or nutrition). Keys added in v8: `hunter:onboarded` (System Awakening done),
  `hunter:tlOpen` (day plan folded state). Existing users with any logs are marked onboarded automatically.
- Stage names are original: E Awakening · D The Forge · C Proving Ground · B Refinement · A Ascent · S Apex.
  Don't reintroduce anime terms (Arise, Shadow Monarch, Dungeon, "Daily Quest 100/100/100/10 km" …).
- "Hunter" as the *player's* title (e.g. "D-Rank Hunter", "Hunter stats") is game flavour, not the app name.
- All art is original SVG drawn in code. No anime characters, likenesses, quotes or catchphrases.
  Mentors are our own: Kael, Garo, Sora, Ryn (`js/hud.js`).
- Data stays on the phone: no network calls except loading the app itself.
- Ask before every `git push`.

## Training logic (do not change without being asked)
- Split from week 1 (`splitDay` in `js/program.js`): Mon Chest · Tue Back · Wed Shoulders · Thu Arms ·
  Fri Upper pump · Sat Legs · Sun rest + long walk. **Abs 10 min every gym day.** Incline-walk
  fat burner after lifting (20 min weeks 1–10, 25 min 11–26, 15 min after).
- Phases: Year-end sprint (weeks 1–10, machines/dumbbells) · Cut to sharp (11–26, barbell lifts join) ·
  Build & sharpen (27–43) · S maintenance (44+). Deloads weeks 20, 31, 38 (then every 8th from 44).
- **Double progression:** stay in the rep range; when every set hits the top, add 2.5 kg (5 kg on
  lifts ≥ 40 kg). Cue logic: `progCue` in `js/app.js`.
- **Asthma mode** (`prof.asthma`): daily green / yellow / red breathing check; yellow = light day,
  red = rest; inhaler check before gym in the timeline.
- **Doctor review mode** (`prof.medHold`, default on): sprints, burpees, jumps, kettlebell swings and
  hard runs swapped for steady talk-pace cardio (`adaptItems`); timed rank-test runs postponed.
- Nutrition (`targets()` in `js/app.js`): Mifflin-St Jeor × 1.4 (desk job); −500 kcal until week 26,
  then −250 (B) / −200 (A) / 0 (S). ≈ 1,900 kcal at 76–78 kg. Protein 1.8 g/kg (≈ 140 g). Fat 25 %.
  Water 0.04 L/kg + 0.5 L. Final target ≈ 8–10 % body fat (waist ÷ height 0.43). **Never aim lower.**
- Diet default veg + egg (`prof.diet` 0 veg, 1 veg + egg, 2 non-veg).

## Files
| File | What |
|---|---|
| `index.html` | All screens (Today, Body/plan, Food, Mission, Mind, Wealth, Stats, Timer, Settings), splash, sigil symbol |
| `js/app.js` | App logic, storage, XP/level/streak, quests, reminders, backup/export, SW registration + update banner |
| `js/hud.js` | Particle background, mentors, progress ring, level-up overlay (`window.HUD`) |
| `js/program.js` | Week/day program, stages, rank tests (`window.Plan`) |
| `js/exercises.js`, `js/figures.js` | Exercise guide text, animated stick figures |
| `js/diet.js` | Daily timeline, meals, diet rules |
| `js/foods.js`, `js/foods_mh.js`, `js/foods_indb.js` | Food database. INDB (108 KB) is **not** in index.html: `loadINDB()` in app.js injects it 2.5 s after boot, or when Food / Settings opens or the search box is focused, then calls `window.addFoods()` |
| `js/mind.js`, `js/wealth.js`, `js/mission.js` | Mind / Wealth / Mission data |
| `css/app.css` → `css/hud.css` → `css/arete.css` | Base styles, HUD theme, then the ARETE design layer (tokens, 44 px targets, Today components, onboarding) |
| `fonts/` | Self-hosted Chakra Petch (headings) + Barlow (body) |
| `icons/arete-icon.svg`, `icons/arete-maskable.svg` | Icon sources → `icon-192.png`, `icon-512.png`, `maskable-512.png` |
| `icons/favicon.svg` | Favicon |
| `sw.js` | Service worker (offline cache + update flow) |

Design tokens: base `#0a0c14` (splash, icon, manifest), panels navy, cyan `#4FD8FF`, violet `#8B5CFF`,
gold `#FFC857` for XP/rewards. Respect `prefers-reduced-motion` (hud.css turns all animation off and hides the splash).

## Releasing a change
1. `node --check` every changed JS file.
2. Test locally: `python -m http.server 8765`, open http://localhost:8765/ at 390 px width; console must be clean.
   All `<script>` tags are `defer`; keep it that way (first paint before JS). Lighthouse targets (mobile,
   gzip like GitHub Pages): Performance ≥ 90, Accessibility ≥ 95. v8.0 measured 95 / 100.
3. Bump `VERSION` in `sw.js` (`arete-vX.Y.Z`) **and** the version text at the bottom of Settings in `index.html`.
   Add any new file to `SHELL` in `sw.js`.
4. Update `README.md` (what's new) and this file if rules/structure changed.
5. Commit with a clear message. Ask before pushing.

Update flow: the new service worker installs in the background (each file cached separately with
`cache:'reload'`) and waits; the page shows "New version available · Tap to update"; tapping sends
`SKIP_WAITING` and the page reloads on `controllerchange`. Upgrading from an old `hunter-*` cache
skips waiting automatically (those pages have no banner).

Regenerating icons: render the two SVG sources to PNG at 512 / 192 px (any headless browser or
SVG converter). Keep the maskable sigil inside the central circle of radius 205 px.
