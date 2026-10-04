# E-Rank Quest

A 12-week transformation app (E-Rank → D-Rank) that installs on your phone and works offline.

- **Today:** the workout for each day of the 12 weeks, an animated figure for every exercise, the day's meals (veg / egg / non-veg) and a daily quest checklist
- **Progress:** log weight and waist and see the trend graphs
- **Timer:** rest timer with presets, a set counter, and a beep + vibration when rest ends
- **Settings:** body weight, plan start date, backup / restore

No accounts and no server. Everything is saved on your phone.

---

## 1. Run it on your computer (VS Code)

1. Install **VS Code** from https://code.visualstudio.com
2. Unzip this folder, then in VS Code choose **File → Open Folder…** and pick `erank-app`.
3. VS Code will suggest the **Live Server** extension. Click **Install**. Or search "Live Server" by Ritwick Dey in the Extensions panel.
4. Right-click `index.html` and choose **Open with Live Server**.
5. The app opens at `http://127.0.0.1:5500`. Any file you save reloads automatically.

> Opening `index.html` by double-clicking works too, but offline mode and install only work when it's served (Live Server or GitHub Pages).

**Test it at phone size:** in Chrome press `F12`, then the phone icon (Toggle device toolbar).

## 2. Put it online for free (GitHub Pages)

1. Create a free account at https://github.com
2. Click **New repository**, name it `erank-app`, and set it to **Public**.
3. On the new repo page click **uploading an existing file**, drag in **everything inside** the `erank-app` folder (including `css`, `js` and `icons`), then click **Commit changes**.
4. Go to **Settings → Pages**. Under *Branch*, choose `main` and `/ (root)`, then **Save**.
5. Wait 1–2 minutes. Your app is live at `https://<your-username>.github.io/erank-app/`

(Or, with Git installed: open the VS Code terminal and run
`git init`, `git add .`, `git commit -m "E-Rank v1"`, then follow the push commands GitHub shows.)

## 3. Install on your phone

1. Open your GitHub Pages link in **Chrome** on Android.
2. Tap the **Install** button in the app's top bar, or **⋮ → Install app / Add to Home screen**.
3. The E-Rank icon appears on your home screen and opens full-screen, even without internet.

On iPhone: open the link in Safari, then **Share → Add to Home Screen**.

## 4. Updating the app

When you change a file:
1. Open `sw.js` and bump the version, for example `erank-v1.0.0` → `erank-v1.0.1`.
2. Upload the changed files to GitHub again.
3. On the phone, close and reopen the app twice to pick up the new version.

## 5. Your data and backups

- Ticks, test results and the progress log are stored **on your phone only**, in browser storage.
- Uninstalling the app or clearing Chrome's site data **erases them**.
- Go to **Settings → Save backup file** every couple of weeks. To move to a new phone, install the app there and use **Restore from file**.

## 6. Where to change things

Everything is in `js/app.js`:

| What | Search for |
|---|---|
| Workouts per week and day | `function program(` |
| Exercise names, muscles, form tips | `const EX=` |
| Meals for each weekday | `const MEALS=` |
| Diet rules per phase | `const DIETFOCUS=` |
| Daily step targets | `const STEPS=` |
| Daily quest list | `function quests(` |
| Stick-figure animations | `const FIG=` |

Colours and fonts are at the top of `css/app.css` (`:root { … }`).

## Files

```
erank-app/
├── index.html          app layout and tabs
├── css/app.css         styles
├── js/app.js           plan data, figures and all app logic
├── manifest.json       app name, icon and colours for install
├── sw.js               service worker (offline support)
├── icons/              app icons (192, 512, maskable)
└── .vscode/            recommends the Live Server extension
```

## Ideas for v2

- Progress photos stored on the phone
- Daily reminder notifications
- C-Rank plan (months 4–6)
- Package as a Play Store app with Capacitor

---

Stop training right away if you feel chest pain, dizziness, or breathlessness that doesn't settle within 2–3 minutes. Get a health check (BP, HbA1c, lipid profile, ECG) before starting.
