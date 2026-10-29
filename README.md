# ARETE v8.5 · Level up in real life

*Arete* is Greek for excellence. ARETE (formerly Hunter System) is an E → S rank transformation app that installs on your phone and works offline. Your data never leaves the phone.

| Tab | What it does |
|---|---|
| **Today** | Status window (rank, level, XP, streak), today's Gate (workout), breathing check, water + protein quick-add, daily quests (some tick themselves), mentor, Main quest, and the folded day plan from wake-up to sleep |
| **Plan** | All 72 weeks across ranks E → D → C → B → A → S. Every exercise has an animated figure. Tap the figure or **How to** for step-by-step instructions, common mistakes, breathing, easier/harder options and your history. Tap **Log sets** to record kg × reps; last session's numbers show in grey so you know what to beat. **Finish workout** ticks the quest and gives 50 XP |
| **Food** | Type what you actually ate ("3 roti, 1 bowl dal, 2 chai with sugar") or search 140+ Indian foods. Shows calories, protein, carbs, fat and fibre against targets calculated from your age, height, weight and current rank, plus a System analysis of what's causing the surplus (sugar, fried food, low protein, biggest calorie sources) and a 7-day calorie chart. Add your own foods from nutrition labels |
| **Status window** (top of Status) | Power level and six stats scored 0–100 from your real logs: **STR** (push-ups, pull-ups, lift maxes ÷ body weight, lift progress), **AGI** (run pace, burpees), **VIT** (plank, resting heart rate, workouts done), **PHY** (waist ÷ height), **FUEL** (protein, calorie target, clean days), **DIS** (daily quests). Radar chart now vs 4 weeks ago, trend arrows and 8-week sparklines. A short summary also shows on Today. Do the 15-minute **Stat check** every 2 weeks to keep it accurate |
| **Status** | Your rank and what the next rank needs, streak, workout count, a 12-week activity map, the rank test form, body log (weight and waist charts), and estimated 1-rep-max charts for your main lifts |
| **Timer** | Rest timer with presets, "Set done → start rest", and a set counter. Beeps and vibrates |
| **Settings** | Weight, height, start date, diet (veg / veg + egg / non-veg), gym time (morning / evening), supplement reminders, notifications, calendar reminders, backup |

## v8.5: Codex and sound
- **Codex** (Body → Open the Codex): 12 short original pages, tagged by rank and reading time: fat loss basics, progressive overload, protein for Indian vegetarians, asthma-safe cardio, sleep, gas and bloating, form before load, scale vs waist, eating out, managing hunger, deload weeks, and getting to 8–10% safely. Filter by rank, read, tap **Mark as read** for +20 XP, then go to the next page. General education, not medical advice.
- Your **mentor** recommends one unread page that fits the day (sleep on rest days, protein when you're low, asthma-safe cardio on a yellow day…).
- **Sound effects** (Settings, off by default): short original tones for quest complete, level up, rank up and Gate cleared.
- Faster start: the background particles and decorative animations begin a moment after the app opens, Today draws its top half first, and the Codex loads in the background. Lighthouse mobile (gzip, median of 3): Performance 93, Accessibility 100, Best Practices 100.

## v8.4: Hunter profile
- **Five stats**, scored 0–100 from your real logs, on a radar (now vs 4 weeks ago):
  - **STR** Strength: push-ups, pull-ups, lift maxes ÷ body weight, lift progress.
  - **END** Endurance: run pace, plank, resting heart rate, cardio minutes per week.
  - **AGI** Agility: burpees, mobility minutes per week.
  - **VIT** Vitality: waist ÷ height, protein, calorie target, clean days, water.
  - **DISC** Discipline: daily quests, Gates cleared, weekly quests.
  (They replace the old six: PHY and FUEL are now part of VIT. Nothing stored changed.)
- **Rank roadmap** (Stats → Status): E → S as a vertical timeline. Cleared ranks are green, your current rank glows and shows the next rank test: each requirement against your latest logs and stat checks, how many are met, and weeks left. You still rank up only by passing the test (button jumps to the test form).
- **Shadow rival**: you vs you 4 weeks ago: power level, all five stats, waist, weight, 7-day volume, quest rate and streak, with who wins each row. Appears once you're 4 weeks into the plan.
- **My routines** (top of Body): build your own workout (name, search exercises, sets and rep range or seconds, reorder), save it, and **Run as Gate**. Logs, records, rest timer and the Gate-cleared screen work the same. On a rest day the Gate card offers your routines.

## v8.3: Quests and habits
- **Weekly quests** (Today, under daily quests): Clear 5 Gates (+150 XP), log food on 5 days, hit your protein on 4 days, 150 min cardio, weigh-in with waist (+50), 8 hours on the Mission (+100 each). They track themselves from your logs and reset every Monday. Past weeks count too.
- **Custom habits**: *+ Add or manage habits* under daily quests. Name it ("10 pages reading", "no sugar in chai"), pick the days, done. Each habit is a daily quest: +15 XP and it counts toward your streak. Removing one keeps its history.
- **Streak freeze**: rest days (Sunday) and asthma red days no longer break your streak. If you don't hit 80% that day it's frozen ❄ instead of reset.
- **Penalty quest**: miss 2 days in a row and a red Penalty Quest appears on Today: a 20-minute walk (talk pace) + 50 bodyweight squats. Finish both before midnight and your streak is restored.
- **Titles**: 14 milestones (first Gate, 10 / 50 Gates, 3 / 7 / 30-day streak, first PR, +10 kg on a lift, −5 kg, −5 cm waist, protein 7 days, water 30 days, D-Rank, level 10). Unlocking one shows a TITLE UNLOCKED screen; the first time you open v8.3, titles you already earned are unlocked together. Tap an unlocked title in **Stats → Status** to wear it on your status window.
- Level-up and title screens now queue instead of overwriting each other, and vibration only happens after you've touched the app.

## v8.2: Progress
Stats now has five sections along the top: **Status · Records · Calendar · Charts · Photos** (it remembers the last one you used).
- **Records**: your best set for every exercise you've logged (e.g. *12.5 kg × 10*), estimated 1-rep max, heaviest weight, number of sessions and a trend line. Records broken in the last 7 days get a gold **PR · NEW** badge. Filter by Chest, Back, Shoulders, Arms, Legs, Core.
- **Calendar**: a month view. Cyan = Gate cleared, gold ring = 80%+ of daily quests, green dot = food logged. Tap a day for its details (Gate, sets, quests, calories and protein, water, cardio, weight and waist) or open it in Food.
- **Charts**: body log + weight and waist trends (as before), **weekly volume per muscle** (kg lifted, last 8 weeks) with **sets this week per muscle**, **calories and protein vs target** for the last 14 days, cardio / core / mobility, and the strength chart.
- **Photos**: take or pick a progress photo (front / side / back). Photos are **stored only on this phone** (IndexedDB), never uploaded and **not in the backup file**. Uninstalling deletes them, so use **Save copy** for any you want to keep. **Before / after** compares two dates with a slider and shows your weight and waist change between them. Start fresh does not delete photos; delete them one by one.
- Fixes: the cardio week now runs Monday–Sunday (it was a day off in India), and the top bar shows your real week when the app opens on a tab other than Today.

## v8.1: Gates (focus workout mode)
- **Enter Gate** (Today, or the top of Body) opens a full-screen workout: one exercise at a time, with a progress bar, the animated figure and **How to do it**.
- **Big set logger**: one row per set with **WEIGHT kg | REPS** (seconds for holds) and a **Log** button. Last time's numbers show in grey and are used if you leave a box empty, so "same as last time" is one tap. **−2.5 kg / +2.5 kg / −1 / +1** buttons adjust the current set. The double-progression cue ("add 2.5 kg today", "same weight, beat by 1 rep") sits above the sets. **+ Add a set** for extra work.
- **Auto rest timer** after each set (90 s; 45 s abs, 60 s pump day, 150 s heavy barbell lifts) with a ring, **+15 s**, **Skip**, and a beep + vibration when it ends.
- **Swipe** left / right (or the buttons) to move between exercises. Cardio steps log minutes, distance, effort and (asthma mode) breathing; warm-up and stretch steps are one tap. Asthma yellow day enters a light Gate (walk + mobility); red keeps it sealed.
- Leave any time with ✕ or the phone's back button: everything is saved and **Resume Gate** picks up where you were.
- **GATE CLEARED** screen: XP count-up, sets, kg lifted, minutes, and **new personal records** (best estimated 1-rep max, or most reps / seconds) highlighted.
- Same data as before: sets logged in a Gate show in Body, Stats and exports, and the other way round.

## v8.0: new Today, System Awakening, faster start
- **System Awakening**: a first-launch setup (name, height, weight, age, goal, gym time, diet, asthma and doctor-review mode) with an animated intro. It only shows on a new install or after Start fresh. Replay it from Settings.
- **New Today screen**, about 40% shorter:
  - **Status window**: your rank, name, level, a gold XP bar that fills when you earn XP, and a streak flame.
  - **Today's Gate**: the workout as one card with rank, minutes, exercise count and XP reward. **Enter Gate** opens it in Body. It shows *Cleared*, *Light* (asthma yellow), *Sealed* (red) or *Rest* when that applies.
  - **Water + protein quick-add**: water buttons, plus one-tap protein (whey, 2 eggs, paneer, soya, curd) that goes straight into your Food log.
  - **Daily quests** with a counter and how many more you need to keep your streak. Then the mentor and your Main quest.
  - **Day plan** (the full timeline and diet rules) is folded away; its header shows what's next.
- **Cleaner design**: calmer windows, one type scale, every button and row at least 44 px tall.
- **Faster start**: scripts no longer block the first paint, and the 1,014-recipe INDB food table loads a moment later (or as soon as you open Food). Lighthouse mobile: Performance 95, Accessibility 100.
- **Original names**: stages are now E Awakening · D The Forge · C Proving Ground · B Refinement · A Ascent · S Apex. The rank-up button says *Continue*; the S-Rank challenge is the *Century day*.
- Settings has **Name** and **Main goal**. The goal is shown on your status window; the training plan, 1,900 kcal and 140 g protein stay the same.

## v7.1: ARETE
- **New name and icon**: ARETE, with an original glowing-hexagon "A" sigil (app icon, maskable icon, favicon and the app bar).
- **Launch screen**: the sigil draws in, then "ARETE · Level up in real life" (under 1.2 s; skipped when "reduce motion" is on, and on reloads in the same session).
- **Reliable updates**: when a new version is online, a **New version available · Tap to update** banner appears. Tap it and the app reloads on the new version. No more "close and reopen twice".
- The offline cache now loads each file on its own (one missing file can't block an update) and always fetches fresh copies, so a phone can't get stuck on an old version.
- Your data is untouched: same storage, and old `hunter-backup-….json` files still restore. New backups are named `arete-backup-….json`.

## v7.0: new look, mentors, start fresh
- **HUD redesign**: notched glass System windows with glowing edges, hexagon rank badge, mana-particle background, quest-progress ring with water / protein / calories / streak, System-style notifications, LEVEL UP animation, smooth tab transitions.
- **Mentors** (original characters, each with an animated sigil): Kael · The Night Warden (back and pump days), Garo · The Living Mountain (chest and legs), Sora · The Still Sky (shoulders and rest days), Ryn · The Unblessed (arms). A new line each day plus an "order" based on what you still need to do.
- **Start fresh** (Settings, red window): erases every log, keeps your settings, saves a backup file first. Type RESET to confirm and pick the new week-1 date.
- The split now runs from week 1: Year-end sprint weeks 1–10, Cut to sharp 11–26, Build & sharpen 27–43.
- Faster and fully offline: fonts are bundled (no Google Fonts call), heavy totals are cached between screens, the background pauses when the app is hidden, and all animation turns off if your phone has "reduce motion" on.
- Body tab: workout first, health and guides below it.

## v6.0: split program for sharp cuts
From week 5 the gym plan is one muscle a day: **Mon Chest · Tue Back · Wed Shoulders · Thu Arms · Fri Upper pump · Sat Legs · Sun rest + long walk**, with 10 min abs every gym day and an incline-walk fat burner (20 min, 25 min in weeks 15–26, 15 min after).
- Phases: **Year-end sprint** (weeks 5–14, to 31 Dec, machines and dumbbells), **Cut to sharp** (15–26, barbell bench, rows, OHP, squat and pull-ups join), **Build & sharpen** (27–43). Deload weeks 20, 31, 38.
- **Rep ranges with progression cues** on every card: add weight when you hit the top of the range on every set, "too light" when reps run far past it, "keep this weight" when below it.
- Calorie target now uses a desk-job activity factor (about 1,900 kcal at 78 kg); protein 1.8 g per kg.
- Water check card on Today if you fall behind (1 L by noon, 2 L by 4 pm, 3 L by 8 pm). Sunday quest: measure your waist.
- Cut check shows the week-26 waist target (waist ÷ height 0.45) and the final sharp-cut target (0.43, about 8–10% body fat).

## v5.3: export for analysis
Settings → **Export for analysis** (pick 14 / 30 / 90 days or everything):
- **Copy summary for chat**: a compact text report (daily food, macros, workouts, cardio, breathing, body log, lift progress, last 7 days of food) to paste into Claude.
- **Share analysis file (.json)**: the full structured data; on Android it opens the share menu so you can send it straight to the Claude app, WhatsApp or Drive.
- **Daily table (.csv)**: one row per day for Excel or Google Sheets.
The **backup file** is still separate: use it only to restore the app.

## v5.2: cardio, core and mobility logging
- **Cardio** cards (walk, treadmill, cycle, intervals, run, sprints) have **Log cardio**: minutes, distance, average heart rate, effort (talk test) and, in asthma mode, how your breathing felt. Your fat-burn heart-rate zone is shown.
- **Core** cards have **Log sets** (reps) or **Log hold times** (seconds for planks), with last time shown in grey.
- **Stretch / Mobility** blocks have a **Mark done** button with minutes and your tightest area.
- **Stats → Cardio · Core · Mobility**: this week against targets (150 min cardio, about 18 core sets, 60 min mobility), an 8-week chart, breathing flags, and **Log extra activity** for walks, Sunday walks, yoga or sport outside the gym.

## v5.1: 10-month plan, sharp cuts by month 6
Two deadlines: **cuts by week 26** (fat loss, mostly diet) and **S-Rank strength by week 43** (10 months).

| Rank | Weeks | Focus | Rank test (no timed runs, asthma-safe) |
|---|---|---|---|
| E | 1–8 | Machines → free weights, cut starts | 15 push-ups, 60 s plank, waist −3 cm |
| D | 9–16 | Barbell 5 × 5, deficit | 22 push-ups, 90 s plank, squat 0.75× / bench 0.6× BW × 5, waist −6 cm |
| C | 17–26 | V-taper + final cut push | **Week-26 cut check:** waist ÷ height ≤ 0.46, 30 push-ups, 2 pull-ups, squat 0.95× / bench 0.7× / deadlift 1.15× BW |
| B | 27–35 | Hold the cut, build strength | 40 push-ups, 5 pull-ups, 8 dips, squat 1.1× / bench 0.8× / deadlift 1.35× BW, waist ÷ height ≤ 0.46 |
| A | 36–43 | Peak strength | **S-Rank test:** 50 push-ups, 8 pull-ups, 12 dips, squat 1.25× / bench 0.9× / deadlift 1.5× BW, waist ÷ height ≤ 0.45 |

Diet: about 500 kcal below maintenance until week 26, then about 250 (weeks 27–35) and 200 (36–43) so strength can climb. Protein 1.8 g per kg throughout. A **6-month cut check** card in Body compares your logged waist with where it should be on a straight line to the week-26 target.

## v4.2
- **Doctor review mode** (on by default, Settings): until your chest specialist clears you, sprints, burpees, jumps, kettlebell swings and hard runs are swapped for steady cardio at talk pace; timed rank-test runs are postponed. Strength work is unchanged.
- **Health to-do** card at the top of Body: pulmonologist, repeat spirometry, asthma action plan, blood tests, BP, testosterone, urologist, flu vaccine.
- Height and weight set from your spirometry report (178 cm, 76 kg) if you hadn't changed them.

## v4.1
- **Asthma mode** (Settings): daily green / yellow / red breathing check on Today that switches the workout to a light session or rest, an inhaler check before the gym in the timeline, asthma cues on hard cardio blocks, and an Asthma-safe training card in Body.
- **1,282 foods**: everyday items, 130 Maharashtrian and Kolhapuri dishes (tambda / pandhra rassa, sukka, bhakri, pithla, zunka, usal, misal, puran poli…) and 1,014 Indian recipes from the Indian Nutrient Databank. The parser now understands several foods in one phrase ("pithla bhakri").
- **Mission**: new quick-cash step (paid 1-on-1 sessions) right after choosing your product.
- **Look your best** card in Body.

Food data credit: Indian Nutrient Databank (INDB), Anuvaad Solutions. Vijayakumar A, Dubasi HB, Awasthi A, Jaacks LM. Development of an Indian Food Composition Database. Current Developments in Nutrition, 2024.

## v4.0: simple mode, built around your real day

Bottom bar: **Today · Body · Food · Mission · Stats**.

- **Real schedule** in the Today timeline: 5:45 wake, gym 6:15–7:30, office, Money hour 8:45–9:45 pm (Mon–Fri), sleep 10:30. Sunday has its own plan: long walk, 3-hour power block, family, weekly review.
- **Mission tab**: one step at a time on the path Futurnyx → your own company before the goal date. 25 steps in 5 phases. Money-hour timer, weekly 8-hour target, monthly revenue chart, and a parking lot of paused ideas.
- **Body tab**: daily 5-minute vitality routine (pelvic floor) and a belly-fat protocol.
- The full Mind and Wealth trackers are still in Settings → Advanced trackers, with all data kept.

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
2. In `sw.js` bump `VERSION`, for example `arete-v7.1.0` → `arete-v7.1.1`, and the version text at the bottom of Settings in `index.html`.
3. Push to GitHub. Open the app on the phone: a **New version available** banner appears within a minute or so. Tap it.

The app is served from the GitHub repo `Solo_Levelling`, so its link stays `https://karma2025-reborn.github.io/Solo_Levelling/`. Renaming the repo would change that link: the installed app would stop updating, you would have to install it again from the new link, and its data would **not** carry over (data is stored per link), so you would need **Save backup file** first and **Restore from file** after.

## Your data

Everything is stored on your phone only. Uninstalling the app or clearing Chrome's site data erases it, so use **Settings → Save backup file** every couple of weeks.

## Where to change things

| What | File |
|---|---|
| Workouts for every week and day, rank test targets | `js/program.js` |
| Exercise instructions, mistakes, tips | `js/exercises.js` |
| Meals, timeline times, water amounts, diet rules | `js/diet.js` |
| Food database (calories and macros per serving) | `js/foods.js`, `js/foods_mh.js` (Marathi), `js/foods_indb.js` (INDB) |
| Mind ranks, library, skill tracks, money lessons | `js/mind.js` |
| Wealth ranks, missions, categories | `js/wealth.js` |
| Mission steps, weekly rhythm, parking lot | `js/mission.js` |
| Codex articles | `js/codex.js` |
| Stick-figure animations | `js/figures.js` (each figure is pose A ↔ pose B) |
| Screens, tracking, reminders, timer | `js/app.js` |
| Colours and fonts | top of `css/app.css` |

---

Stop training right away if you feel chest pain, dizziness, or breathlessness that doesn't settle within 2–3 minutes. Get a health check (BP, HbA1c, lipid profile, ECG) before starting, and always use safety pins or a spotter for heavy barbell work.
