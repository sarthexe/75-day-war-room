# 75-Day War Room

A local-first, dark-mode productivity command center for the run from **notice period (LWD: Dec 31, 2026)** through **GATE CSE 2027 (Feb 6, 2027)** — with C++ DSA interview prep, morning running, sleep-shift tracking, job applications, and weekend project sprints.

No backend. No accounts. Everything lives in your browser's `localStorage`, with 1-click JSON export/import for cross-device sync.

## Stack

- Vite + React + TypeScript
- Tailwind CSS (dark-first: `#09090b` canvas, `#18181b` cards, `zinc-800` borders)
- `lucide-react` icons, `recharts` charts
- PWA: `manifest.json` + service worker for offline use on the metro

## Views

| # | View | What it does |
|---|------|--------------|
| 1 | **Command Center** | LWD/GATE countdowns, Phase 1↔2 and day-type toggles, editable checkable timetable with live-block highlighting, daily non-negotiables, 75-day heatmap + streak |
| 2 | **GATE CSE 2027** | 55–60 target banner, tiered syllabus (Tier 1/2/3) with revision % + PYQ counters, mock test logger with 55-mark reference chart, 1-page mistake notebook |
| 3 | **C++ DSA** | Sticky 60-minute 4-phase AlgoHunt timer, 5-week synced roadmap, Week 2 C-tracing gap checklist, problem log with required pattern triggers and auto re-attempt flags |
| 4 | **Run & Sleep** | Wake-up ramp chart toward 7:00 AM with 7h sleep indicators, run/walk interval log, editable pre/post-run checklist |
| 5 | **Jobs & Projects** | Application table + mini-kanban with weekly counter, weekend project sprints with checkable Sunday deliverables |

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # tsc --noEmit + vite build
npm run preview    # serve the production build
```

## Deploy to Vercel

Import the repo in Vercel — the defaults work:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

## Keyboard shortcuts

- `1`–`5` — switch views (ignored while typing in an input)
- `Space` — start/pause the DSA protocol timer (DSA view only)
- `Esc` — close the settings modal

## Data & backups

Sidebar → **Backup / Import / Reset**:

- **Export JSON Backup** — save a dated snapshot to Drive/iCloud
- **Import JSON Backup** — restore on any device or browser
- **Reset Data** — two-step confirm, restores seed schedules and curriculum

Clearing site data or switching browsers starts empty — the JSON export is the cross-device bridge.
