# PURE — Member App

## Stack
- Next.js 14 (frontend)
- Supabase (database + auth)
- Vercel (hosting)
- Cost: $0/month for up to ~200 members

---

## STEP 1 — GitHub

1. Go to https://github.com and create a free account
2. Click "New repository" → name it `pure-app` → Public → Create
3. Upload all these files (drag & drop in the browser)

---

## STEP 2 — Supabase

1. Go to https://supabase.com → Create a free account
2. Click "New project" → name it `pure` → choose a region close to you → Create
3. Wait ~2 minutes for the project to start
4. Go to **SQL Editor** → **New query**
5. Copy/paste the entire content of `supabase-setup.sql`
6. Click **Run**
7. Go to **Project Settings** → **API**
8. Copy your **Project URL** and **anon/public key** — you'll need these for Vercel

---

## STEP 3 — Vercel

1. Go to https://vercel.com → Create a free account (sign up with GitHub)
2. Click "Add New Project" → Import your `pure-app` repository
3. Before deploying, click **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click **Deploy** → wait ~2 minutes
5. Your app is live at `pure-app.vercel.app` 🎉

---

## STEP 4 — Add your first member

1. In Supabase → **Authentication** → **Users** → **Invite user**
2. Enter their email → they receive a password setup email
3. In **Table Editor** → **profiles** → find their row
4. Set `is_active = true`
5. Set `start_date = today's date` (format: YYYY-MM-DD)
6. Save → they can now log in!

---

## STEP 5 — Add batches

1. In Supabase → **Table Editor** → **batches**
2. Add a row for each batch:
   - `batch_number`: 1 to 24
   - `title`: name of the batch
   - `description`: short description
   - `pdf_url`: link to your PDF (Google Drive, Dropbox, etc.)
   - `is_published`: true (to make it visible)

---

## Managing members (daily admin)

Everything is done in **Supabase Table Editor → profiles**:

| Action | What to do |
|---|---|
| Activate a member | Set `is_active = true` |
| Start their program | Set `start_date = YYYY-MM-DD` |
| Pause a member | Set `is_active = false` |
| Change start date | Edit `start_date` |

No code needed. It's just a table.

---

## How progression works

- Week 1 (days 0–6): batches 1–2 visible
- Week 2 (days 7–13): batches 3–4 visible
- Week 3 (days 14–20): batches 5–6 visible
- ...and so on automatically

The system manages itself. You only set `start_date` once.
