# Dr. Dose — Web app guide

Complete reference for the **current web application** (`web/`). For database setup see [SUPABASE_SETUP.md](SUPABASE_SETUP.md); for migrations see [MIGRATIONS.md](MIGRATIONS.md). For **native iOS/Android** plans see [ROADMAP.md](ROADMAP.md) (not shipped yet).

---

## At a glance

| Route | Page | Purpose |
|-------|------|---------|
| `/` | **Today** | Log scheduled and as-needed doses; banners; wellness check-in |
| `/history` | **History** | Dose log + calendar; wellness notes per day |
| `/wellness` | **Wellness** | Baseline profile, daily logs, trends, doctor report |
| `/tracking` | **Tracking** | Optional modules (cycle, med progress); shared calendar |
| `/account` | **My account** | Profile, medications list, settings, reminders, streak summary |
| `/streaks` | **Streaks** | Streak stats, tulip badges, consistency calendar |
| `/interactions` | **Drug safety check** | Interaction pairs + allergy cross-check |
| `/medical-records` | **Medical records** | Allergies, conditions, demographics |
| `/help` | **Help & safety** | How-to and disclaimers |
| `/medications` | — | Redirects to `/tracking` (legacy URL) |

**Header:** profile menu (navigation), theme toggle, **Add medication** (opens form on Today).

**Auth:** Sign up / sign in / forgot password screens when logged out. Email **8-digit OTP** on sign-up and password reset.

---

## Today (`/`)

### Scheduled vs as-needed tabs

- **Scheduled** — fixed daily times; each time slot is a separate **Mark taken** / **Undo**.
- **As needed (PRN)** — log when you take a dose; optional **max doses per day**; PRN check-in (symptoms, reason, notes, amount).

### Scheduled doses

- Only medications **active today** (`start_date` ≤ today ≤ `end_date` if set).
- **Double-dose prevention:** one log per medication + calendar day + `schedule_time` (database unique constraint).
- **Undo** restores pill count if inventory is tracked.
- Daily summary: “X of Y doses taken.”
- **Move to as needed** / **Move to daily schedule** on a card switches type without re-entering the name.

### As-needed (PRN) doses

- **Log dose** opens check-in: med-specific symptom chips (from route/name defaults + your med’s custom hints), optional reason and notes.
- **Oral meds:** amount dropdown 1–10 or custom text; other routes use presets / custom amount.
- Respects **max doses per day** when configured.
- PRN logs sync to `dose_logs` with `logged_amount`, `prn_symptoms`, `prn_reason`, `prn_notes`.

### Banners

| Banner | Behavior |
|--------|----------|
| **Refill** | Any med with ≤ 7 pills remaining |
| **Missed doses** | Yesterday’s missed slots + today’s past-due; dismissible per day |
| **Due now** | Today’s past-due slots; not dismissible |
| **Interactions** | Link to safety check when active meds have warnings |

### Other on Today

- **Streak snippet** (scheduled tab) — current streak + link to Streaks.
- **Streak celebration** — modal on milestone perfect days.
- **Wellness check-in** — same fields as Wellness page, quick entry.
- **Add / edit medication** — full form + safety panel (see Medications below).

---

## Medications (form & management)

Access: **Add medication** (header), edit/delete on Today cards, **My account → Medications**.

| Field / action | Details |
|----------------|---------|
| **Name** | Local brand list + live **RxNorm** search; brands shown above generic |
| **Schedule type** | Scheduled (times per day) or as-needed |
| **Dose** | `dose_pills` and/or `dose_mg`; PRN may use daily cap instead of dose labels |
| **Times** | 12h + AM/PM rows; duplicates normalized |
| **Dates** | Required start; optional end (short courses) |
| **Route / form** | e.g. oral, inhaler — drives safety copy and PRN defaults |
| **Pill inventory** | Optional count; updates on mark taken / undo |
| **PRN hints** | Custom amount presets and symptom chips per med |
| **Tracking sync** | Optional **HRT** — Today doses mirror into Tracking when enabled |
| **Safety panel** | Side effects, substance notes, interaction preview while adding |

**List (Account):** all meds with status (active / upcoming / ended) and date ranges.

---

## History (`/history`)

- **Dose list** — recent logs with med name, dose label, schedule time, taken timestamp.
- **Calendar** — ~42 days; tap day to filter list; color indicates perfect / partial / missed adherence.
- **Day detail** — doses + wellness note for selected day.
- **Weekly summary** — doses taken vs expected this week.
- **Stats** — totals over loaded window.

Uses your **Account timezone** for “today” and day boundaries.

---

## Streaks (`/streaks` and Account)

- **Perfect day** — every scheduled dose for every **active** med logged that calendar day (PRN does not affect streak).
- **Current streak** — consecutive perfect days; today in progress until day ends in your timezone.
- **Longest streak** — best run (~1 year of data).
- **7-day chart** — bar visualization.
- **Tulip badges** — milestones by longest streak length.
- **Consistency calendar** — perfect / partial / missed days.

Account shows summary + links to Streaks and History.

---

## Wellness (`/wellness`)

Educational / self-report — **not diagnosis**.

| Area | Details |
|------|---------|
| **Baseline** | Usual sleep, eating, substance use, symptoms to track |
| **Daily log** | Sleep hours/quality, energy, appetite, exercise, symptom chips, notes |
| **History** | ~7-day strip; tap to view/edit |
| **Trends** | Sleep/energy charts; week-over-week text |
| **Med briefings** | Side effects and substance notes per active med |
| **Doctor report** | In-app printable view: baseline, ~14 days logs, briefings, **PRN insights** (patterns vs wellness — non-diagnostic); save as PDF via print |

---

## Medical records (`/medical-records`)

Self-reported — **not certified clinical records**.

- Allergies and conditions (tags) — used on **Drug safety check** and add-med allergy hints.
- Blood type, past surgeries, family history, emergency/other notes.
- Demographics: DOB, gender, height, weight.
- **Units:** choose metric (cm, kg) or US/imperial (ft/in, lb); preference saved on `medical_records`; values stored as cm/kg.

---

## Drug safety check (`/interactions`)

- Auto-runs on **medications active today**.
- **RxNorm** maps brands to generics for matching.
- **Local curated set** (~60+ pairs: major / moderate / minor) with management text.
- **Check another drug** — hypothetical add without saving.
- **Allergy warnings** when med name overlaps your allergy list.
- **Autocomplete** on hypothetical drug field (RxNorm + local list).
- Disclaimer: incomplete, not a substitute for pharmacist/clinician.

---

## Tracking (`/tracking`)

Optional modules via **My trackers**; enable/disable per module.

### Physical profile

- DOB, gender, height, weight (same unit prefs as medical records).
- Collapsible summary when collapsed.

### Unified calendar

- **View:** 1 day, 4 days, 1 week, 1 month, 3 / 6 / 12 months.
- **Show:** dropdown of enabled trackers with calendar support (cycle = live; others may show “coming soon”).
- Legend and phase/period styling shared with cycle module.
- Selecting a day updates the **day log** below (cycle module).

### Cycle & period (enabled module)

| Feature | Details |
|---------|---------|
| **Period started / ended** | Start date editable while open; **end date** picker before ending (defaults to today) |
| **Last period ended** | Edit end date after close |
| **Predictions** | Next period window; multi-cycle **striped** predicted days on long views; late-period bump |
| **Cycle length** | Per-period `cycle_length_days`; recent average; optional override for next cycle only |
| **Phases** | Follicular, ovulation, luteal (estimates — not diagnostic) |
| **Day log** | Flow, pre/during/post symptoms, intercourse, notes |
| **Day strip** | Scroll days; ← → ; **Today** button |
| **Future days** | Calendar preview only; log form disabled until that calendar date |
| **Fix a mistake** | Soft/hard clear day; reopen period; delete period; etc. |

### Medication progress

- Adherence/streak-style view from Today scheduled data.

### Not yet available (catalog)

HRT full UI, weight, vitals, pain, migraine, respiratory, custom — listed in Add tracker as “coming soon.” HRT dose sync from Today works when `tracking_sync = hrt` on a med.

---

## My account (`/account`)

- Display name (user metadata).
- Profile photo upload (**avatars** bucket).
- Streak summary, badges teaser, links to Streaks / History.
- **Medications** section — full CRUD list.
- **Settings:** theme, timezone, browser reminders, reminder test/diagnostics.
- Sign-in email, created date, **Sign out**.

### Reminders (web limitation)

- Browser notifications + service worker while the **tab/app is open** (or recently active).
- In-app bottom banner when a reminder fires.
- **Not** true iOS/Android background push — planned for native app ([ROADMAP.md](ROADMAP.md)).

---

## Help (`/help`)

- Area-by-area usage (Today, History, Tracking, Wellness, etc.).
- Streak rules, double-dose prevention, reminders.
- Medical disclaimer.

---

## Onboarding

- First-visit modal; skip to add medication.
- **Config guard** if Supabase env vars missing.

---

## Data & privacy (web)

- All personal rows scoped by `user_id` with **RLS**.
- Data lives in your Supabase project (cloud).
- Anon key in browser is OK only because of RLS — never expose `service_role` in the client.
- Personal/family use; not positioned as HIPAA-certified product.

---

## Mobile & future (not in web v1)

Documented in [ROADMAP.md](ROADMAP.md). Highlights:

- Native **push notifications** when app is closed
- **Offline** dose logging queue
- Shared TypeScript domain package for web + mobile
- iOS widget, HRT/weight trackers, pharmacy integrations

The web app remains the reference implementation until mobile v1 ships.
