# Dr. Dose

A personal web app to manage medications, log daily doses, track adherence streaks, and check for known drug interactions. Built for private use (you and family) with cloud sync via Supabase.

> **Development log** (below) records what shipped each session. It updates automatically on every commit when [git hooks are installed](#development-log). Feature docs follow for reference.

## Development log

Newest first. Each line is added from the commit subject when you commit (with hooks enabled).

<!-- DEVLOG:START -->
- **2026-05-25** (`c05f28a`) — Fix cycle calendar predictions and lock future-day logging.

- **2026-05-25** (`67cb786`) — Add Today button to cycle day logging strip.

- **2026-05-25** (`e8add4c`) — Add editable period end dates and database-backed body metric units.

- **2026-05-25** (`1134877`) — Add unified tracking calendar with adjustable ranges and tracker sources.

- **2026-05-25** (`31fd90f`) — Improve cycle tracking UX, predictions, and per-cycle length learning.

- **2026-05-25** (`a313f2c`) — Add menstrual cycle calendar with phases, predictions, and daily logs.

- **2026-05-25** (`53dced2`) — Add oral PRN amount dropdown with 1–10 and custom entry.

- **2026-05-25** (`33c7484`) — Add PRN dose check-ins, flexible dosing, and wellness trend insights.

- **2026-05-24** (`551f9c0`) — Add daily vs as-needed meds, profile stats, and Tracking hub.

- **2026-05-24** (`2001cdb`) — Keep the top navbar visible while scrolling.

- **2026-05-24** (`187ddba`) — Add drug name autocomplete to the interactions safety check.

- **2026-05-24** (`9a6eec6`) — Style minor interaction cards with a distinct blue tint.

- **2026-05-24** (`e13b145`) — Add minor albuterol and montelukast pairs and tidy beta-blocker warnings.

- **2026-05-23** (`e3fd93f`) — Fix drug interaction checks and polish streaks and mobile nav.

- **2026-05-23** (`4a2108c`) — Add streaks, medical records, history calendar, and maroon branding.

- **2026-05-23** (`6ec5c1d`) — Add streak celebrations, profile photos, and UI polish for deploy.

- **2026-05-23** (`f94e121`) — Add README development log with auto-update git hooks.

- **2026-05-23** (`17c3ebb`) — Update README for Dr. Dose rebrand and current features.

- **2026-05-23** (`e2d0257`) — Add in-app reminder banner and service worker notifications.

- **2026-05-23** (`40a9399`) — Show doctor report in-app instead of relying on pop-ups.

- **2026-05-23** (`73c10d6`) — Add wellness tracking with trends, med briefings, and doctor report.

- **2026-05-23** (`978fad8`) — Simplify medication name placeholder and hints.

- **2026-05-23** (`6429d6f`) — Fix ESLint errors so CI passes on push.

- **2026-05-23** (`6dc3007`) — Prioritize brand names in medication search with local list and RxNorm cleanup.

- **2026-05-23** (`f497651`) — Add RxNorm live search for medication name autocomplete.

- **2026-05-23** (`29f04c0`) — Add responsive layouts and mobile-friendly medication search.

- **2026-05-23** (`a7d16c4`) — Improve mobile dose time entry with mask and native picker.

- **2026-05-23** (`f0ce06c`) — Rebrand to Dr. Dose and add email OTP verification.

- **2026-05-23** (`00a3402`) — Point Vercel Git builds at the web app root directory.

- **2026-05-23** (`3b4b0d6`) — Add multi-step medication wizard, safety review, and UX fixes.

- **2026-05-23** (`68ba6d7`) — Move Vercel config to web/ and add deploy documentation.

- **2026-05-23** (`691829f`) — Add Medicine Tracker web v1 with Supabase backend.

- **2026-05-23** (`65835bf`) — Add repository scaffold for Medicine Tracker. README, roadmap, license, contributor docs, issue/PR templates, and CI skeleton.

<!-- DEVLOG:END -->

---

## Vision

Dr. Dose aims to be the central hub between patients, pharmacies, and healthcare providers — making it simple to know what to take, when to take it, and when to refill, while reducing accidental double-dosing.

## Current status

**Web v1** — feature-complete for daily personal use. React + Vite frontend, Supabase Auth + PostgreSQL backend.

| Target | Status |
|--------|--------|
| Web (v1) | **Available** (`web/`) |
| iOS / Android | Planned |
| Pharmacy integrations | Long-term |

**Stack:** [React](https://react.dev) · [Vite](https://vite.dev) · [Supabase](https://supabase.com) (Auth + PostgreSQL) · [RxNorm](https://www.nlm.nih.gov/research/umls/rxnorm/index.html) (drug name lookup)

---

## Features

### Authentication

| Feature | Description |
|---------|-------------|
| **Email sign up / sign in** | Sign up with email + password, then **8-digit email verification**; sign in is password-only. |
| **Forgot password** | Email verification code → set new password (same OTP flow as sign up). |
| **Sign out** | From profile menu or Account page. |
| **Config guard** | App shows setup instructions if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing. |

### Today (home)

The main dashboard for logging doses.

| Feature | Description |
|---------|-------------|
| **Medication list** | All medications **active today** (respects start/end dates). |
| **Per-dose logging** | Each scheduled time is its own row — e.g. morning and evening are two separate “Mark taken” actions. |
| **Double-dose prevention** | Database enforces one log per medication + calendar day + schedule time. |
| **Undo** | Remove today’s log for a specific dose slot; pill count is restored if tracked. |
| **Daily summary** | “X of Y doses taken” for the current day. |
| **Add / edit / delete** | Full medication form from header “Add medication” or card actions. |
| **Streak snippet** | Short line linking current streak status to Account. |
| **Refill banner** | Warns when any medication has ≤ 7 pills remaining. |
| **Missed doses banner** | Shows yesterday’s missed slots and today’s past-due slots (by schedule time). |
| **Due now banner** | Always shows today’s past-due doses (not dismissable). |
| **Daily wellness check-in** | Log sleep, energy, symptoms at the bottom of Today. |
| **Interaction alert** | If active meds have known interaction warnings, a banner links to Drug safety check. |

### Medications (form & list)

| Feature | Description |
|---------|-------------|
| **Name with autocomplete** | Local brand list (~90 names) + live **RxNorm** search; brands prioritized with generic shown underneath. |
| **Medication type** | Optional route/form (e.g. inhaler, eye drops) for non-pill schedules. |
| **Safety panel on add** | Side effects, alcohol/cannabis/tobacco notes, and interaction preview while adding a med. |
| **Dose amount** | Separate **pills/tablets** and **mg** fields; at least one required. |
| **Dose times** | One row per daily dose — 12-hour time + AM/PM; add/remove rows; duplicate times are normalized. |
| **Schedule dates** | **Start date** (required) and optional **end date** for short courses (e.g. antibiotics). |
| **Notes** | Free text (e.g. “take with food”). |
| **Pill inventory** | Optional “track pills remaining”; decrements on mark taken, increments on undo. |
| **All medications page** | Full list including upcoming/ended meds with status badges and date ranges. |

### History

| Feature | Description |
|---------|-------------|
| **14-day dose list** | Chronological log with medication name, dose label, schedule time, and taken time. |
| **42-day calendar** | Tap a day to filter the list; tap again to clear. Days with logs are highlighted. |
| **Weekly summary** | “This week: X of Y doses (Z%)” based on active meds per day. |
| **Stats** | Total doses logged and days with at least one dose (over the loaded window). |

### Adherence streaks (Account)

| Feature | Description |
|---------|-------------|
| **Perfect day** | Every scheduled dose for every **active** medication logged that calendar day. |
| **Current streak** | Consecutive perfect days; today in progress does not break the streak until the day ends. |
| **Longest streak** | Best run in the last year of data. |
| **7-day chart** | Visual bars for the last week. |
| **Today progress** | “X of Y doses logged” on the streak card. |

### Drug interaction check

Educational tool — **not medical advice**.

| Feature | Description |
|---------|-------------|
| **Automatic check** | On `/interactions`, checks all medications active today. |
| **RxNorm name mapping** | Brand names (e.g. Lexapro) resolved to generic names via NIH RxNorm. |
| **Curated database** | 60+ clinically significant pairs (major / moderate / minor) with descriptions and management tips. |
| **Pair results** | Sorted by severity; shows both display names and mapped generic names. |
| **“Check another drug”** | Add a hypothetical drug and re-run without saving it. |
| **Today banner** | Surfaces count and top warning when interactions exist. |
| **Disclaimer** | Clear limits: incomplete database, not a substitute for pharmacist/clinician. |

> NIH’s public drug–drug interaction API was discontinued; this app uses a local reference set plus RxNorm, not a live DrugBank/FDA feed.

### Account & settings

| Feature | Description |
|---------|-------------|
| **Display name** | Saved to Supabase user metadata. |
| **Theme** | Light or dark mode; toggle in header (moon/sun) or Account dropdown; follows system preference on first visit. |
| **Timezone** | “Today”, streaks, and missed-dose logic use the selected IANA timezone. |
| **Browser reminders** | Optional dose alerts while the tab is open (permission required). |
| **In-app reminder banner** | Bottom banner when a reminder fires — works even when macOS hides system pop-ups. |
| **Reminder diagnostics** | Test notification + “Check dose reminders now” with per-slot status on Account. |
| **Sign-in details** | Email and account creation date. |

### Wellness

Track daily experiences to **discuss with your clinician** — not a diagnosis tool.

| Feature | Description |
|---------|-------------|
| **Baseline profile** | Usual sleep, eating notes, substance use frequency, symptoms to track. |
| **Daily log** | Sleep hours/quality, energy, appetite, exercise, symptom chips, notes. |
| **Today check-in** | Same log as Wellness, quick entry at the bottom of Today. |
| **7-day history** | Tap any day to view or edit logs. |
| **Trends** | Bar charts (sleep, energy) + week-over-week comparison text. |
| **Medication briefings** | Educational side effects and substance notes per active med. |
| **Doctor report** | Printable summary (baseline, 14 days of logs, briefings) — Save as PDF from print dialog. |

### Onboarding & help

| Feature | Description |
|---------|-------------|
| **First-visit modal** | Short walkthrough; option to jump straight to adding a medication. |
| **Help & safety** | How to use each area, streak rules, double-dose prevention, medical disclaimer. |

### Navigation & layout

| Feature | Description |
|---------|-------------|
| **Profile menu** | Avatar dropdown: Today, History, Wellness, My account, All medications, Drug safety check, Help, Sign out. |
| **Responsive layout** | Centered column, mobile-friendly cards and forms. |
| **Account page styling** | Purple gradient theme on streak and settings cards (distinct from teal “Today” accents). |

---

## Data model (Supabase)

### `medications`

| Column | Description |
|--------|-------------|
| `name` | Medication name |
| `dose_pills`, `dose_mg` | Text dose labels (at least one required) |
| `schedule_times` | Array of 24h times, e.g. `["08:00","20:00"]` |
| `notes` | Optional |
| `pills_remaining` | Optional integer |
| `start_date`, `end_date` | Schedule window (`end_date` optional) |
| `user_id` | Owner (RLS) |

### `dose_logs`

| Column | Description |
|--------|-------------|
| `medication_id`, `user_id` | References |
| `taken_on` | Calendar date (user timezone) |
| `schedule_time` | Which daily slot was logged |
| `taken_at` | Timestamp |

**Unique constraint:** `(medication_id, taken_on, schedule_time)` — prevents duplicate logs for the same slot.

### `wellness_profiles` / `wellness_logs`

Per-user baseline (sleep habits, substance use, symptom focus) and one **daily log per calendar day** (sleep, energy, appetite, exercise, symptoms, notes). See migration `006_wellness.sql`.

### Migrations (run in order)

1. `supabase/schema.sql` — initial schema (or baseline for new projects)
2. `supabase/migrations/002_dose_per_schedule_time.sql` — per–dose-time logs
3. `supabase/migrations/003_split_dose_pills_mg.sql` — `dose_pills` / `dose_mg` (replaces `dosage`)
4. `supabase/migrations/004_medication_dates.sql` — `start_date` / `end_date`
5. `supabase/migrations/005_medication_type.sql` — route/form fields
6. `supabase/migrations/006_wellness.sql` — wellness profile + daily logs

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for project setup.

---

## Project structure

```
dr.dose/
├── web/                          # React + Vite app
│   ├── src/
│   │   ├── pages/                # Today, History, Wellness, Account, Medications, Interactions, Help
│   │   ├── components/           # UI (forms, cards, banners, streak, auth, wellness)
│   │   ├── lib/                  # medications, streaks, wellness, interactions, notifications
│   │   └── data/                 # drug-interactions.json, drug-safety.json, brand-medications.json
│   ├── public/sw.js              # Service worker for more reliable browser notifications
│   └── .env                      # Supabase keys (not committed)
├── supabase/
│   ├── schema.sql
│   └── migrations/
├── docs/                         # SUPABASE_SETUP, ROADMAP
├── vercel.json                   # Deploy root = web/
└── .github/workflows/ci.yml      # Lint + build on push
```

---

## Getting started

### Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project

### Setup

1. **Database & auth** — [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
2. **Run migrations** — SQL Editor, migrations `002` → `006` if not using a fresh `schema.sql` only (see above)
3. **Environment:**

```bash
cp web/.env.example web/.env
# VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
# VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. **Run locally:**

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173` (or the URL Vite prints).

### Deploy (Vercel)

Step-by-step: **[docs/DEPLOY.md](docs/DEPLOY.md)**

1. Import repo on [vercel.com](https://vercel.com) — set **Root Directory** to `web` (see `web/vercel.json`)
2. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
3. Supabase → **Authentication** → add production URL to **Site URL** and **Redirect URLs**

### Resume later (local dev)

```bash
cd web && npm install && npm run dev
```

No need to run Supabase locally; keep `web/.env` with your API keys.

### Build

```bash
cd web
npm run build
npm run preview
```

---

## Scripts (`web/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

---

## Roadmap

Planned next steps: UI polish, notifications when the app is closed (mobile), native apps via Capacitor, larger interaction database, pharmacy integrations. See [docs/ROADMAP.md](docs/ROADMAP.md).

**Live demo:** Deploy to Vercel with env vars from Supabase; add production URL to Supabase Auth redirect allowlist.

---

## Development log (setup)

After cloning, run once:

```bash
./scripts/install-githooks.sh
```

Each `git commit` then appends its subject to the [Development log](#development-log) at the top of this file (same commit, via `post-commit` amend). To skip once: `SKIP_DEVLOG=1 git commit …`

Manual entry: `./scripts/append-dev-log.sh "Your summary"`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

## Security

See [SECURITY.md](SECURITY.md). Never commit `web/.env` or the Supabase **service_role** key.

## Medical disclaimer

Dr. Dose is for **personal organization only**. It does not provide medical advice, diagnosis, or treatment. Drug interaction information is incomplete and may be outdated. Always follow your prescriber and pharmacist. Call emergency services for urgent medical problems.
