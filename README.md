# Medicine Tracker

A cross-platform mobile application to help users manage medications, track doses, and stay connected with their pharmacy and care team.

## Vision

Medicine Tracker aims to be the central hub between patients, pharmacies, and healthcare providers — making it simple to know what to take, when to take it, and when to refill, while preventing accidental overdosage.

## Current status

**Early development.** Repository scaffolding and project planning are in place; application code has not started yet.

## Planned platform

| Target | Status |
|--------|--------|
| iOS | Planned |
| Android | Planned |
| Pharmacy integrations (CVS, Walgreens, etc.) | Long-term |

**Stack (planned):** React Native with [Expo](https://expo.dev) for a single codebase targeting iOS and Android.

## Short-term goals

- [ ] Initialize mobile app (Expo / React Native)
- [ ] Local medication list (add, edit, remove)
- [ ] Dosage and schedule configuration per medication
- [ ] Daily dose logging (mark as taken — once per day per med)
- [ ] Refill reminders based on supply count
- [ ] Push notifications for scheduled doses
- [ ] Basic onboarding and settings

## Long-term goals

### App features

- Scan medications via camera (label or pill recognition)
- Live prescription and doctor updates via pharmacy / hospital integrations
- Refill and dosage insights
- Built-in AI assistant for medication questions and adherence help
- iOS home screen widget
- Push notifications at user-chosen times

### Hardware & wearables

- Wearables tracking bodily response to medications (short- and long-term)
- Anomaly detection (allergic reactions, elevated heart rate, etc.)
- Smart pill bottles and dispensers syncing dose events when the user cannot log on their phone (lid open, amount dispensed, real-time account sync)

## Project structure

```
medicine-tracker/
├── .github/          # Issue/PR templates, CI workflows
├── docs/             # Design notes, ADRs, roadmap details
├── app/              # Mobile application (coming soon)
└── README.md
```

## Getting started

> Application setup instructions will be added once the mobile project is initialized.

**Prerequisites (planned):**

- Node.js 20+
- npm or yarn
- Expo Go (for device testing) or Xcode / Android Studio (for simulators)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE).

## Security

To report a security vulnerability, see [SECURITY.md](SECURITY.md).
