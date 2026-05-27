# Mobile app (Expo)

The app lives in `mobile/`. It uses **Expo SDK 56** and **Expo Router** (file-based routes under `mobile/app/`).

## Run on iOS Simulator (recommended)

Expo Go on a physical device must match the SDK; if your Expo Go is outdated, use a **development build** in the Simulator instead of scanning a QR code.

```bash
cd mobile
npm install
npx expo run:ios
```

This opens the iOS Simulator with a native dev client. Use `npx expo start` in another terminal if you want Metro with dev menu options.

## Run on a physical iPhone

You need a **dev build** installed (same `expo run:ios` with a device selected in Xcode, or EAS Build), not an old Expo Go client, unless Expo Go matches SDK 56.

### Free Apple ID (Personal Team) and signing

Dose reminders are **local notifications** only. A free Personal Team cannot use the **Push Notifications** capability (remote APNs). The repo config plugin `plugins/withLocalNotificationsOnly.js` strips `aps-environment` so Xcode can sign the app.

If Xcode still shows Push Notifications under **Signing & Capabilities**, remove it with the **−** button, set **Bundle Identifier** to `com.charannuth.drdose`, then run:

```bash
cd mobile
npx expo prebuild --clean --platform ios
open ios/mobile.xcworkspace
```

## Environment variables (Supabase)

Copy `mobile/.env.example` to `mobile/.env` and use the same project URL and anon key as the web app (`VITE_*` → `EXPO_PUBLIC_*`):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Restart Metro with `npx expo start --clear` after changing env vars.

After adding or changing **native** packages (e.g. `@react-native-async-storage/async-storage`), rebuild the dev client — Metro alone is not enough:

```bash
cd mobile
npx expo run:ios
```

If you see `AsyncStorageError: Native module is null`, run the command above (not Expo Go on an outdated client).

## Screens (parity with web)

| Screen | Route | Notes |
|--------|-------|--------|
| Login | `/(auth)/login` | Sign in, sign up + email OTP, forgot password |
| Today | `/(tabs)/` | Daily / as-needed tabs, mark taken, undo, PRN log, streak snippet |
| Account | `/(tabs)/account` | Sign out |

Medication add/edit is still on the web app for now; mobile reads the same Supabase data.

## Deep linking

`app.json` sets `scheme` to `medicine-tracker` for `medicine-tracker://` URLs (used by Expo Router and OAuth redirects).

## Project layout

| Path | Role |
|------|------|
| `app/_layout.tsx` | Root stack |
| `app/(tabs)/` | Main tab navigator (Today, History, Tracking, Account) |
| `babel.config.js` | `expo-router/babel` plugin (required) |
| `package.json` `main` | `expo-router/entry` |

After changing native config or plugins, run `npx expo prebuild` (or `expo run:ios`, which prebuilds when needed) so `ios/` / `android/` stay in sync.
