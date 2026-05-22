# Supabase setup

Follow these steps once to connect the web app to your database and auth.

## 1. Create a project

1. Sign in at [supabase.com](https://supabase.com) (free tier is fine).
2. **New project** → pick a name, database password, and region.
3. Wait until the project is ready.

## 2. Run the database schema

1. In the dashboard, open **SQL** → **New query**.
2. Copy the full contents of [`supabase/schema.sql`](../supabase/schema.sql) from this repo.
3. Click **Run**.

This creates `medications` and `dose_logs` tables plus Row Level Security (each user only sees their own rows).

**Already ran an older schema?** Also run these migrations in order:

1. [`002_dose_per_schedule_time.sql`](../supabase/migrations/002_dose_per_schedule_time.sql) — separate dose per scheduled time  
2. [`003_split_dose_pills_mg.sql`](../supabase/migrations/003_split_dose_pills_mg.sql) — separate pills and mg fields  
3. [`004_medication_dates.sql`](../supabase/migrations/004_medication_dates.sql) — start date and optional end date

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
