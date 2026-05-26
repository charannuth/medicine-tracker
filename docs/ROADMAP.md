# Roadmap

Planned work for **Dr. Dose**. Priorities may shift; shipped items are marked for context.

**Web app (everything shipped today):** [WEB_APP.md](WEB_APP.md) — full page-by-page guide for users and developers.

## Shipped (web v1 — May 2026)

### Platform & auth

- [x] GitHub repo, CI (lint + build), Vercel deploy (`web/` root)
- [x] Supabase Auth (email + password, **8-digit email OTP** on sign-up / forgot password)
- [x] Row Level Security on all user data
- [x] Migrations **002–016** (see [MIGRATIONS.md](MIGRATIONS.md))

### Core adherence

- [x] Medication CRUD (pills/mg, schedule times, notes, start/end dates, route/form)
- [x] **Scheduled** and **as-needed (PRN)** meds with per-day caps and dose check-in
- [x] Mark taken / undo per dose slot (idempotent unique constraint)
- [x] Pill inventory + refill banner
- [x] History (list + calendar), weekly stats, streaks
- [x] Missed-dose and due-now banners
- [x] Browser reminders + service worker (while app/tab active — not true background push)

### Safety & records

- [x] Curated drug interaction check + RxNorm name mapping
- [x] Medical records (allergies, conditions, blood type, demographics)
- [x] Medication safety panel on add (side effects, substance notes)

### Wellness

- [x] Baseline profile + daily logs (sleep, energy, symptoms, etc.)
- [x] Trends, medication briefings, printable doctor report
- [x] PRN ↔ wellness trend insights in reports (non-diagnostic)

### Tracking hub

- [x] Enable/disable modules (`user_trackers`)
- [x] Physical profile (metric/imperial units stored in DB)
- [x] **Cycle & period** — calendar (1 day–12 months), phases, predictions, day logs, period start/end editing
- [x] **Medication progress** tracker (from Today adherence)
- [ ] **HRT & hormones** — catalog entry; doses can sync from Today when enabled; full UI coming later
- [ ] Weight, vitals, pain, migraine, respiratory, custom — catalog placeholders

### UX

- [x] Onboarding modal, Help & safety, light/dark theme, timezone
- [x] Profile avatars (Supabase Storage)
- [x] Responsive / mobile-friendly web layout

---

## Phase A — Before native mobile (recommended next)

Focus: things that are painful to retrofit after iOS/Android.

| Item | Why |
|------|-----|
| **Push notifications** (APNs + FCM) | Real reminders when app is closed; web cannot match this on iOS |
| **Shared TypeScript package** | Extract `lib/` domain logic (dates, cycle, streaks, interactions) for web + mobile |
| **Offline dose log queue** | Mark taken on poor network; sync when online |
| **Automated tests** | Timezone, streaks, cycle prediction, dose idempotency |
| **Docs & schema discipline** | Keep [MIGRATIONS.md](MIGRATIONS.md) updated; avoid breaking API without migration |

## Phase B — Mobile v1 (Expo / React Native or Capacitor)

| Item | Notes |
|------|--------|
| Today + mark taken + push | Minimum lovable mobile |
| Auth (secure token storage, deep links for OTP) | Reuse Supabase |
| History + streaks | Read-mostly |
| Tracking / Wellness | Phase 2 screens |

## Phase C — Refills & polish

- [ ] Smarter refill forecasting (days-supply from schedule)
- [ ] Quiet hours for notifications
- [ ] iOS widget (read-only: next dose / today progress)
- [ ] HRT tracker UI + reports
- [ ] Additional tracking modules (weight, vitals, …)

## Phase D — Intelligence & vision

- [ ] AI medication Q&A (with strict disclaimers)
- [ ] Label OCR / pill ID (third-party APIs TBD)
- [ ] Richer export (PDF share sheet)

## Phase E — Integrations & scale

- [ ] Pharmacy / prescription partners (legal + technical review)
- [ ] Multi-device sync polish (already via Supabase; conflict rules if offline)
- [ ] HIPAA / compliance review if beyond private family use

## Phase F — Hardware (long-term)

- Wearables, smart dispensers, offline hardware bridge

---

**Compliance note:** Features involving prescriptions, PHI, and clinical decisions need appropriate review (e.g. HIPAA in the US) before broad production use. This roadmap is for planning only.
