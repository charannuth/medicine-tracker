# Supabase setup

Follow these steps once to connect the web app to your database and auth.

**App features (web):** [WEB_APP.md](WEB_APP.md) · **Migrations:** [MIGRATIONS.md](MIGRATIONS.md)

## 1. Create a project

1. Sign in at [supabase.com](https://supabase.com) (free tier is fine).
2. **New project** → pick a name, database password, and region.
3. Wait until the project is ready.

## 2. Run the database schema

1. In the dashboard, open **SQL** → **New query**.
2. Copy the full contents of [`supabase/schema.sql`](../supabase/schema.sql) from this repo.
3. Click **Run**.

This creates `medications` and `dose_logs` tables plus Row Level Security (each user only sees their own rows).

**Already ran an older schema?** Run any missing migrations in order. Full list, verification queries, and troubleshooting: **[MIGRATIONS.md](MIGRATIONS.md)**.

Quick index:

| Migration | Summary |
|-----------|---------|
| `002` | Per–schedule-time dose logs |
| `003` | `dose_pills` / `dose_mg` |
| `004` | `start_date` / `end_date` |
| `005` | Medication route and form |
| `006` | Wellness profiles and daily logs |
| `007` | Avatar storage bucket |
| `008` | Medical records |
| `009` | Scheduled vs PRN + demographics on records |
| `010` | Tracking hub and cycle tables |
| `011`–`013` | PRN flexibility and check-in fields |
| `014`–`015` | Cycle symptoms, late period, cycle length learning |
| `016` | Height/weight unit preferences (`metric` / `imperial`) |

Production should have **002 through 016** applied before using Tracking, PRN, or unit preferences.

### Profile photos (optional)

After migration `007_avatars_storage.sql`, users can upload a profile picture from **My account** → **Settings**. Photos are stored in the public `avatars` bucket under `{userId}/avatar.jpg`.

## 3. Configure authentication

1. Go to **Authentication** → **Providers** → **Email**.
2. Ensure Email is enabled.
3. Turn **on** **Confirm email** (required for sign-up verification codes).

### Email verification codes (sign up + forgot password)

The app emails an **8-digit code** for new accounts and for password reset (Supabase `{{ .Token }}`). Supabase must include that token in the email body (not only a magic link).

1. **Authentication** → **Email Templates**.
2. Edit **Confirm signup** — include the code, for example:

   ```text
   Your Dr. Dose verification code is: {{ .Token }}
   ```

   Remove or de-emphasize the confirmation link if you only want in-app code entry.

3. Edit **Reset password** — same pattern:

   ```text
   Your password reset code is: {{ .Token }}
   ```

4. **Authentication** → **URL configuration** — add your app URLs (local + production), e.g.  
   `http://localhost:5173/**` and your production URL from Vercel → Domains, e.g. `https://medicine-tracker-one-eta.vercel.app/**` (add `/**`)

**Sign in** uses email + password only (no code). **Forgot password** uses the same code flow as sign up.

### Do not disable confirm email

If **Confirm email** is off, new users skip verification and sign in immediately without a code.

## 4. Add API keys to the app

1. **Project Settings** → **API**.
2. Copy **Project URL** and **anon public** key (not the `service_role` key).
3. In the repo:

```bash
cp web/.env.example web/.env
```

4. Paste values into `web/.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 5. Run the app

```bash
cd web
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173`), create an account, and add a medication.

## 6. Invite your sister to test

**Separate accounts (recommended):** she signs up with her email; each of you sees only your own data.

**Same machine:** she can use a different browser or incognito window.

**Deployed link (later):** deploy the `web` folder to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) and add the same `VITE_*` env vars in the host dashboard.

## Security reminders

- Never commit `web/.env` or put the **service_role** key in the frontend.
- The **anon** key is safe in the browser only because **RLS** policies restrict data per user.
- This is for personal testing, not production HIPAA compliance.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| “Supabase is not configured” | Create `web/.env`, restart `npm run dev` |
| Sign up works but can’t sign in | Confirm email, or disable confirm in Auth settings |
| “relation does not exist” | Run `supabase/schema.sql` again |
| “Already marked as taken” | Expected — one dose per med per day |
| RLS errors on insert | Ensure `user_id` matches logged-in user (app does this automatically) |
| Wellness check-in errors | Run `006_wellness.sql` |
| Tracking / cycle errors | Run `010`–`015` (see [MIGRATIONS.md](MIGRATIONS.md)) |
| Unit preference not saving | Run `016_body_metric_units.sql` |
| PRN / as-needed med errors | Run `009`, `011`–`013` |
