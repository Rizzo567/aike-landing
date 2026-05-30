# Plan: Phase 1 — Foundation

**Phase:** 01-foundation
**Goal:** Supabase + Stripe accounts configured, deployment live, shared config wired in
**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Created:** 2026-03-26

---

## Tasks

### Wave 1 — Create centralised config file

**Task 1.1** — Create `assets/js/config.js`

```js
// assets/js/config.js
// Public config — Supabase anon key and Stripe publishable key are
// intentionally client-side safe. Access is controlled by Supabase RLS.

// NOTE: nested shape (supabase.url, supabase.anonKey) is canonical.
// Phase 2+ code must use window.AIKE_CONFIG.supabase.url — NOT window.AIKE_CONFIG.supabaseUrl
window.AIKE_CONFIG = {
  supabase: {
    url: 'REPLACE_WITH_SUPABASE_URL',          // e.g. https://abcdef.supabase.co
    anonKey: 'REPLACE_WITH_SUPABASE_ANON_KEY'  // Settings > API > anon public
  },
  stripe: {
    publishableKey: 'REPLACE_WITH_STRIPE_PUBLISHABLE_KEY', // pk_test_... or pk_live_...
    basicPriceId: 'REPLACE_WITH_BASIC_PRICE_ID',            // price_... for €14/mo
    proPriceId: 'REPLACE_WITH_PRO_PRICE_ID'                 // price_... for €49/mo
  }
};
```

**Task 1.2** — Create `netlify.toml`

```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Wave 2 — Wire Supabase CDN + config into all HTML pages

Add these two script tags immediately before the existing `bundle.js` script in each file:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script src="PATH_TO_CONFIG"></script>
```

| File | PATH_TO_CONFIG |
|------|----------------|
| `index.html` | `assets/js/config.js` |
| `pages/pricing.html` | `../assets/js/config.js` |
| `pages/solutions.html` | `../assets/js/config.js` |
| `pages/booking.html` | `../assets/js/config.js` |

**Resulting script block (root page example):**
```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script src="assets/js/config.js"></script>
  <script src="assets/js/bundle.js"></script>
</body>
```

---

### Wave 3 — Manual steps (user actions)

These cannot be automated — they require dashboard access.

**M1 — Create Supabase project**
1. Go to supabase.com → New project
2. Name: `aike-prod`, region: closest to your users, set a strong DB password
3. Wait for provisioning (~2 min)
4. Go to Settings → API → copy **Project URL** and **anon public** key

**M2 — Run SQL schema in Supabase SQL Editor**

Go to Supabase → SQL Editor → New Query → paste and run:

```sql
-- Public users table (mirrors auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics table
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Users: each user reads/updates only their own row
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Analytics: anyone (anon) can insert page visits
CREATE POLICY "Anyone can insert analytics"
  ON public.analytics FOR INSERT
  WITH CHECK (true);

-- Analytics: authenticated users can read
CREATE POLICY "Authenticated can read analytics"
  ON public.analytics FOR SELECT
  USING (auth.role() = 'authenticated');

-- Trigger: auto-create public.users row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, plan)
  VALUES (NEW.id, NEW.email, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**M3 — Fill in Supabase values in config.js**
- Replace `REPLACE_WITH_SUPABASE_URL` with your Project URL
- Replace `REPLACE_WITH_SUPABASE_ANON_KEY` with your anon public key

**M4 — Create Stripe products**
1. Go to stripe.com → Dashboard → Products → Add product
2. **Basic Plan**: Name = "Aike Basic", Price = €14.00, Recurring Monthly, Currency EUR → Save → copy the `price_xxx` ID
3. **Pro Plan**: Name = "Aike Pro", Price = €49.00, Recurring Monthly, Currency EUR → Save → copy the `price_xxx` ID
4. Go to Developers → API keys → copy **Publishable key** (`pk_test_...`)

**M5 — Fill in Stripe values in config.js**
- Replace `REPLACE_WITH_STRIPE_PUBLISHABLE_KEY`
- Replace `REPLACE_WITH_BASIC_PRICE_ID`
- Replace `REPLACE_WITH_PRO_PRICE_ID`

**M6 — Deploy to Netlify**
1. Push code to a GitHub repository
2. Go to netlify.com → Add new site → Import from Git → select repo
3. Build command: *(leave empty)*
4. Publish directory: `.`
5. Deploy → copy live URL

---

## UAT Checklist

- [ ] Open `index.html` in browser (via Netlify URL or Live Server) — no console errors
- [ ] In browser console: `window.AIKE_CONFIG` returns the config object (not undefined)
- [ ] In browser console: `window.supabase` returns the Supabase library (not undefined)
- [ ] In browser console: `window.supabase.createClient(window.AIKE_CONFIG.supabase.url, window.AIKE_CONFIG.supabase.anonKey)` — returns a client object without error
- [ ] Open `pages/pricing.html` — no console errors, `window.supabase` defined
- [ ] Open `pages/solutions.html` — no console errors, `window.supabase` defined
- [ ] Open `pages/booking.html` — no console errors, `window.supabase` defined
- [ ] Supabase dashboard → Table Editor shows `users` and `analytics` tables
- [ ] Stripe dashboard shows 2 products: Aike Basic (€14/mo) and Aike Pro (€49/mo), each with an active price
- [ ] Netlify dashboard shows site as "Published" with a live URL

---

## Files Changed

| Action | File |
|--------|------|
| CREATE | `assets/js/config.js` |
| CREATE | `netlify.toml` |
| EDIT | `index.html` (add 2 script tags before bundle.js) |
| EDIT | `pages/pricing.html` (add 2 script tags before bundle.js) |
| EDIT | `pages/solutions.html` (add 2 script tags before bundle.js) |
| EDIT | `pages/booking.html` (add 2 script tags before bundle.js) |

---

*Plan created: 2026-03-26*
