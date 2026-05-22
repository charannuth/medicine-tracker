# Deploy Dr. Dose (pick up later)

Host the web app on **Vercel** (free). Your database stays on **Supabase** in the cloud — no local Supabase process.

## One-time: Vercel

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New Project** → import `charannuth/dr.dose`.
3. Set **Root Directory** to `web` (important). Vercel reads `web/vercel.json` for build settings.
4. **Environment variables** (Production + Preview):

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | From Supabase → Settings → API → Project URL |
   | `VITE_SUPABASE_ANON_KEY` | From Supabase → Settings → API → `anon` `public` key |

5. Click **Deploy**. Note your production URL in Vercel → **Domains** (may still be an older `*.vercel.app` alias until you add a new one).

## One-time: Supabase auth URLs

After you have the Vercel URL:

1. Supabase → **Authentication** → **URL configuration**
2. **Site URL:** `https://YOUR-VERCEL-URL.vercel.app`
3. **Redirect URLs** — add:
   - `https://YOUR-VERCEL-URL.vercel.app/**`
   - `http://localhost:5173/**` (for local dev)

Save. Password reset and sign-in redirects will work in production.

## Database (only if not done yet)

In Supabase **SQL Editor**, run in order:

1. `supabase/schema.sql` (new projects)
2. `supabase/migrations/002_dose_per_schedule_time.sql`
3. `supabase/migrations/003_split_dose_pills_mg.sql`
4. `supabase/migrations/004_medication_dates.sql`

## When you come back to develop locally

```bash
cd web
npm install          # if node_modules missing
npm run dev          # http://localhost:5173
```

Keep `web/.env` with the same Supabase keys. You do **not** need the Supabase dashboard tab open.

## Auto-deploy on push

Vercel redeploys when you push to `main` on GitHub (default). No extra step after the first setup.

## CLI (optional)

```bash
npm i -g vercel
cd /path/to/dr.dose
vercel login
vercel --cwd web
# set env vars in Vercel dashboard or: vercel env add
vercel --prod
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank app / “not configured” | Env vars missing on Vercel; redeploy after adding them |
| Auth redirect error | Add Vercel URL to Supabase redirect URLs |
| “column start_date does not exist” | Run migration `004_medication_dates.sql` |
| Free Supabase paused | Open project in dashboard once to wake it |
