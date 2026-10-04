# Hunter System v2

A 72-week E → S rank transformation app that installs on your phone and works offline.

| Tab | What it does |
|---|---|
| **Today** | The next thing to do, a water tracker, daily quests (some tick themselves), today's workout, and a full timeline from wake-up to sleep with every meal, water glass and supplement |
| **Plan** | All 72 weeks across ranks E → D → C → B → A → S. Every exercise has an animated figure. Tap the figure or **How to** for step-by-step instructions, common mistakes, breathing, easier/harder options and your history. Tap **Log sets** to record kg × reps; last session's numbers show in grey so you know what to beat. **Finish workout** ticks the quest and gives 50 XP |
| **Status** | Your rank and what the next rank needs, streak, workout count, a 12-week activity map, the rank test form, body log (weight and waist charts), and estimated 1-rep-max charts for your main lifts |
| **Timer** | Rest timer with presets, "Set done → start rest", and a set counter. Beeps and vibrates |
| **Settings** | Weight, height, start date, diet (veg / veg + egg / non-veg), gym time (morning / evening), supplement reminders, notifications, calendar reminders, backup |

## The path

| Rank | Weeks | Focus | Rank test (examples for 72 kg) |
|---|---|---|---|
| E → D | 1–12 | Machines → free weights, walking, fix food | 15 push-ups, 60 s plank, 2 km under 18 min, waist −5 cm |
| D → C | 13–24 | 5 × 5 barbell strength, first pull-up, running | 25 push-ups, 1 pull-up, 3 km under 20 min, squat 0.75× and bench 0.6× body weight for 5 |
| C → B | 25–40 | Push / pull / legs, V-taper | 40 push-ups, 5 pull-ups, 10 dips, 5 km under 32 min, squat 1×, bench 0.8×, deadlift 1.25× |
| B → A | 41–56 | Cut phase, reveal the abs | 50 push-ups, 10 pull-ups, 15 dips, 5 km under 28 min, waist ÷ height ≤ 0.48 |
| A → S | 57–72 | Power, athleticism, full Daily Quest (100/100/100/10 km) | 60 push-ups, 15 pull-ups, 25 dips, 10 km under 60 min, squat 1.5×, bench 1.25×, deadlift 2×, waist ÷ height ≤ 0.45 |

Your rank only goes up when you **pass the test** in Status → Rank test, not just because the weeks pass. Every 4th week in ranks D–A is a lighter deload week.

## Reminders

Phones only let a web app show notifications while it is open or was used recently. So there are three options in **Settings → Reminders**:

1. **Turn on app notifications.** Works while the app is open or in the background for a while.
2. **Add each reminder to Google Calendar** (most reliable on Android). Tap **Add** next to each one and press **Save**. They repeat daily. In Google Calendar → Settings → your calendar → **Default notifications**, set **At time of event**.
3. **Download calendar file (.ics).** Imports all reminders at once into Outlook, Samsung Calendar or iPhone Calendar.

## Updating from v1

This is a new app with a new name and new storage. Your v1 (E-Rank Quest) ticks don't carry over. You can keep both installed, or delete the old repo.

## Put it online (same as before)

1. Open your GitHub repo and **delete the old files**, or create a new **public** repo called `hunter`.
2. Upload **everything inside** this folder (`index.html`, `css`, `js`, `icons`, `manifest.json`, `sw.js`). `index.html` must be at the top level.
3. **Settings → Pages →** Deploy from a branch, branch `main` or `master`, folder `/ (root)`, Save.
4. Open `https://<your-username>.github.io/<repo-name>/` in Chrome on your phone, then **⋮ → Install app**.

## Updating the app later

1. Change files in VS Code (test with **Live Server**: right-click `index.html` → Open with Live Server).
2. In `sw.js` bump `VERSION`, for example `hunter-v2.0.0` → `hunter-v2.0.1`.
3. Upload the changed files to GitHub. On the phone, close and reopen the app twice.

## Your data

Everything is stored on your phone only. Uninstalling the app or clearing Chrome's site data erases it, so use **Settings → Save backup file** every couple of weeks.

## Where to change things

| What | File |
|---|---|
| Workouts for every week and day, rank test targets | `js/program.js` |
| Exercise instructions, mistakes, tips | `js/exercises.js` |
| Meals, timeline times, water amounts, diet rules | `js/diet.js` |
| Stick-figure animations | `js/figures.js` (each figure is pose A ↔ pose B) |
| Screens, tracking, reminders, timer | `js/app.js` |
| Colours and fonts | top of `css/app.css` |

---

Stop training right away if you feel chest pain, dizziness, or breathlessness that doesn't settle within 2–3 minutes. Get a health check (BP, HbA1c, lipid profile, ECG) before starting, and always use safety pins or a spotter for heavy barbell work.
