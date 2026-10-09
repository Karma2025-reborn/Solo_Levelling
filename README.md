# Hunter System v3.0

A 72-week E → S rank transformation app that installs on your phone and works offline.

| Tab | What it does |
|---|---|
| **Today** | The next thing to do, a water tracker, daily quests (some tick themselves), today's workout, and a full timeline from wake-up to sleep with every meal, water glass and supplement |
| **Plan** | All 72 weeks across ranks E → D → C → B → A → S. Every exercise has an animated figure. Tap the figure or **How to** for step-by-step instructions, common mistakes, breathing, easier/harder options and your history. Tap **Log sets** to record kg × reps; last session's numbers show in grey so you know what to beat. **Finish workout** ticks the quest and gives 50 XP |
| **Food** | Type what you actually ate ("3 roti, 1 bowl dal, 2 chai with sugar") or search 140+ Indian foods. Shows calories, protein, carbs, fat and fibre against targets calculated from your age, height, weight and current rank, plus a System analysis of what's causing the surplus (sugar, fried food, low protein, biggest calorie sources) and a 7-day calorie chart. Add your own foods from nutrition labels |
| **Status window** (top of Status) | Power level and six stats scored 0–100 from your real logs: **STR** (push-ups, pull-ups, lift maxes ÷ body weight, lift progress), **AGI** (run pace, burpees), **VIT** (plank, resting heart rate, workouts done), **PHY** (waist ÷ height), **FUEL** (protein, calorie target, clean days), **DIS** (daily quests). Radar chart now vs 4 weeks ago, trend arrows and 8-week sparklines. A short summary also shows on Today. Do the 15-minute **Stat check** every 2 weeks to keep it accurate |
| **Status** | Your rank and what the next rank needs, streak, workout count, a 12-week activity map, the rank test form, body log (weight and waist charts), and estimated 1-rep-max charts for your main lifts |
| **Timer** | Rest timer with presets, "Set done → start rest", and a set counter. Beeps and vibrates |
| **Settings** | Weight, height, start date, diet (veg / veg + egg / non-veg), gym time (morning / evening), supplement reminders, notifications, calendar reminders, backup |

## v3.0: three systems

The bottom bar is now **Today · Body · Food · Mind · Wealth · Stats**. Settings is the gear icon at the top right; the rest timer is a button at the top of Body.

**Today** shows your Body, Mind and Wealth ranks plus all three daily quest lists.

**Mind (INT), E → S**: ranks up automatically when every target is met (books finished, deep-work hours, money lessons, insights, courses, lessons/talks published).
- Daily quests: 20 pages, 90 min deep work, 30 min skill, money lesson, 1 insight, no phone in the first hour
- Deep-work timer (25 / 50 / 90 min) that logs your hours
- Reading tracker + a 25-book Hunter library (habits, money, business, leadership, sales, AI)
- 52-week money & business curriculum, one lesson + action per week
- 4 skill tracks: leadership (HOD), AI for engineering, business & sales, technical depth (stress engine)
- Insight journal, courses and teaching counter

**Wealth, E → S (₹100 Cr in 60 months)**: ranks up automatically from your data.
- E Foundation (month 6): money tracked, emergency fund, no bad debt, 30% savings rate, insurance, first side income
- D Launch (month 18): ₹2 L/month side income, Futurnyx registered, 50 customers, ₹50 L net worth
- C Scale (month 30): ₹1 Cr revenue run-rate, team of 5, ₹1 Cr net worth
- B Company (month 42): ₹10 Cr run-rate, 20% margin, ₹10 Cr net worth
- A Empire (month 60): ₹40 Cr run-rate, ₹8 Cr profit, ₹100 Cr net worth → S
- Reality check (growth needed, what investing alone reaches, what the business must add), money log with savings rate and category breakdown, revenue-action counter, monthly business metrics with run-rate chart, net worth snapshots with chart, and missions for every rank.

Not financial advice. Check tax, legal and investment decisions with a qualified CA or adviser.

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
| Food database (calories and macros per serving) | `js/foods.js` |
| Mind ranks, library, skill tracks, money lessons | `js/mind.js` |
| Wealth ranks, missions, categories | `js/wealth.js` |
| Stick-figure animations | `js/figures.js` (each figure is pose A ↔ pose B) |
| Screens, tracking, reminders, timer | `js/app.js` |
| Colours and fonts | top of `css/app.css` |

---

Stop training right away if you feel chest pain, dizziness, or breathlessness that doesn't settle within 2–3 minutes. Get a health check (BP, HbA1c, lipid profile, ECG) before starting, and always use safety pins or a spotter for heavy barbell work.
