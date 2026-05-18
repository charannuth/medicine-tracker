# Medicine Tracker

A personal web app to manage medications, log daily doses, track adherence streaks, and check for known drug interactions. Built for private use (you and family) with cloud sync via Supabase.

## Vision

Medicine Tracker aims to be the central hub between patients, pharmacies, and healthcare providers — making it simple to know what to take, when to take it, and when to refill, while reducing accidental double-dosing.

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
| **Email sign up / sign in** | Supabase email auth; each user only sees their own data (Row Level Security). |
| **Forgot password** | Reset link sent by email; configure redirect URLs in Supabase for local and production. |
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
| **Interaction alert** | If active meds have known interaction warnings, a banner links to Drug safety check. |

### Medications (form & list)

| Feature | Description |
|---------|-------------|
| **Name with autocomplete** | Type-ahead suggestions for ~90 common generic drugs; selecting one can pre-fill dose hints. |
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
| **Browser reminders** | Optional notifications while the app tab is open, at scheduled dose times (requires permission). |
| **Sign-in details** | Email and account creation date. |

### Onboarding & help

| Feature | Description |
|---------|-------------|
| **First-visit modal** | Short walkthrough; option to jump straight to adding a medication. |
| **Help & safety** | How to use each area, streak rules, double-dose prevention, medical disclaimer. |

### Navigation & layout

| Feature | Description |
|---------|-------------|
| **Profile menu** | Avatar dropdown: Today, History, My account, All medications, Drug safety check, Help, Sign out. |
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

### Migrations (run in order)

1. `supabase/schema.sql` — initial schema (or baseline for new projects)
2. `supabase/migrations/002_dose_per_schedule_time.sql` — per–dose-time logs
3. `supabase/migrations/003_split_dose_pills_mg.sql` — `dose_pills` / `dose_mg` (replaces `dosage`)
4. `supabase/migrations/004_medication_dates.sql` — `start_date` / `end_date`

See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for project setup.

---

## Project structure

```
medicine-tracker/
├── web/                          # React + Vite app
│   ├── src/
│   │   ├── pages/                # Today, History, Account, Medications, Interactions, Help
│   │   ├── components/           # UI (forms, cards, banners, streak, auth)
│   │   ├── lib/                  # medications, streaks, history, interactions, dates, settings
│   │   └── data/                 # drug-interactions.json (curated pairs)
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
2. **Run migrations** — SQL Editor, migrations `002` → `004` (see above)
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

Planned next steps: mobile apps, push notifications when app is closed, larger interaction database, pharmacy integrations. See [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

## Security

See [SECURITY.md](SECURITY.md). Never commit `web/.env` or the Supabase **service_role** key.

## Medical disclaimer

Medicine Tracker is for **personal organization only**. It does not provide medical advice, diagnosis, or treatment. Drug interaction information is incomplete and may be outdated. Always follow your prescriber and pharmacist. Call emergency services for urgent medical problems.
