# Plan: Phase 4 — Admin Dashboard + Analytics

**Phase:** 04-admin-dashboard
**Goal:** Admin can view all users, plans, and site analytics behind a protected page.
**Requirements:** ADMIN-01–06, ANALYTICS-01–02
**Created:** 2026-03-26

## Tasks

- CREATE `assets/js/analytics.js` — DOMContentLoaded INSERT into analytics table (anon, fire-and-forget)
- CREATE `pages/admin.html` — protected dashboard (auth gate + is_admin check → redirect)
- EDIT all HTML pages — add analytics.js script tag

## Admin Auth Flow

1. Load admin.html → show spinner
2. `sb.auth.getUser()` — if no session → redirect to login.html
3. `sb.from('users').select('is_admin').eq('id', user.id)` — if is_admin !== true → redirect to index.html
4. Show dashboard

## Manual Step Required (one-time Supabase SQL)

Run in Supabase SQL Editor:

```sql
-- Add is_admin column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Allow admins to read ALL users (not just their own row)
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Allow admins to read ALL analytics
CREATE POLICY "Admins can read all analytics" ON public.analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Set your account as admin (replace with your actual email)
UPDATE public.users SET is_admin = true WHERE email = 'YOUR_ADMIN_EMAIL';
```

## UAT

- [ ] Visit pages/admin.html when logged out → redirects to login.html
- [ ] Visit pages/admin.html logged in as non-admin → redirects to index.html
- [ ] Visit pages/admin.html as admin → dashboard loads
- [ ] Stat cards show total user count, total visits, active (last 5 min)
- [ ] User table shows email, plan badge, joined date for all users
- [ ] Navigate any page on the site → new row appears in Supabase analytics table
- [ ] Logout button signs out and redirects to login.html

---
*Plan created: 2026-03-26*
