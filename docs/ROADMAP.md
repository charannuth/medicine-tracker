# Roadmap

This document tracks planned phases for Dr. Dose. Priorities may shift as the project evolves.

## Phase 0 — Foundation (current)

- [x] GitHub repository setup (README, license, templates, CI)
- [x] Web app scaffold (React + Vite)
- [x] Supabase auth + schema (medications, dose_logs, RLS)
- [ ] Deploy web app for sister to test via URL

## Phase 1 — Core adherence

- Medication CRUD (name, dosage, frequency, notes)
- Schedule builder (times per day, days of week)
- “Mark as taken” for today (idempotent — no double-counting same day)
- History view (calendar or list)
- Local push notifications for reminders

## Phase 2 — Refills & UX

- Pill count / days-supply tracking
- Refill-needed alerts
- Onboarding flow
- Settings (notification sound, quiet hours, theme)
- iOS widget (read-only: next dose / today’s progress)

## Phase 3 — Intelligence & vision

- AI chat agent (medication Q&A, adherence tips) with clear medical disclaimers
- Camera scan: label OCR and/or pill identification (third-party APIs TBD)
- Export / share adherence report (PDF or share sheet)

## Phase 4 — Integrations

- OAuth or partner APIs with major pharmacies (CVS, Walgreens, etc.)
- EHR / prescription sync where legally and technically feasible
- Account sync across devices (backend required)

## Phase 5 — Hardware ecosystem

- Wearable SDK integration for vitals and anomaly alerts
- Smart bottle / dispenser hardware protocol and cloud bridge
- Offline-safe dose logging when phone unavailable

---

**Note:** Features involving prescriptions, PHI, and clinical decisions require compliance review (e.g. HIPAA considerations in the US) before production use. This roadmap is for planning only.
