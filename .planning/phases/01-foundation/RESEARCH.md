# Research: Phase 1 — Foundation

**Phase:** 01-foundation
**Date:** 2026-03-26
**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05

---

## 1. Supabase JS CDN Integration (INFRA-02)

### CDN URL
The Supabase JS client is available via CDN as a UMD bundle (works without a module system):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
```

This exposes `window.supabase` globally. To create a client:

```js
const { createClient } = window.supabase
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

**Where to load**: In each HTML page's `<head>` or just before `</body>`, BEFORE `bundle.js`. The config file must load first.

### Script loading order per page
```html
<!-- 1. Supabase CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<!-- 2. Config (sets window.AIKE_CONFIG) -->
<script src="assets/js/config.js"></script>           <!-- root pages -->
<script src="../assets/js/config.js"></script>        <!-- pages/ -->
<!-- 3. Bundle (uses window.AIKE_CONFIG to init Supabase) -->
<script src="assets/js/bundle.js"></script>
```

---

## 2. Centralised Config File (INFRA-03)

### File: `assets/js/config.js`

Since there is no build step, environment variables cannot be injected at build time. The config file holds the values directly as a window global. This is safe because Supabase's `anon` key is a **public key** designed to be exposed in client-side code — it is protected by Row Level Security on the DB side.

```js
// assets/js/config.js
// Supabase public config — anon key is safe to expose (protected by RLS)
window.AIKE_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_ID.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY'
};
```

**Usage in bundle.js:**
```js
const supabaseClient = window.supabase.createClient(
  window.AIKE_CONFIG.supabaseUrl,
  window.AIKE_CONFIG.supabaseAnonKey
);
```

**Path resolution**: Use the same `b` (base path) variable already used in bundle.js:
- Root pages: `assets/js/config.js`
- `pages/` pages: `../assets/js/config.js`

Since `config.js` is a separate `<script>` tag in each HTML file, use relative paths directly:
- `index.html`: `<script src="assets/js/config.js"></script>`
- `pages/*.html`: `<script src="../assets/js/config.js"></script>`

---

## 3. Supabase Database Schema (INFRA-01)

### `users` table
Supabase Auth already creates a `auth.users` table. We create a public `users` table that mirrors/extends it:

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Plan values:** `'free'`, `'basic'`, `'pro'`

### `analytics` table

```sql
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- users: each user can read and update only their own row
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- analytics: anyone (even anon) can INSERT (for page visit tracking)
CREATE POLICY "Anyone can insert analytics" ON public.analytics
  FOR INSERT WITH CHECK (true);

-- analytics: only authenticated users can SELECT (admin uses service key)
CREATE POLICY "Authenticated can read analytics" ON public.analytics
  FOR SELECT USING (auth.role() = 'authenticated');
```

### Auto-insert user on signup (DB trigger)

```sql
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

---

## 4. Stripe Products Setup (INFRA-04)

### Products to create in Stripe Dashboard
1. **Basic Plan** — Name: "Aike Basic", Price: €14.00/month, Currency: EUR
2. **Pro Plan** — Name: "Aike Pro", Price: €49.00/month, Currency: EUR

### Price IDs
After creating, Stripe generates `price_XXXX` IDs. These go into `config.js`:

```js
window.AIKE_CONFIG = {
  supabaseUrl: '...',
  supabaseAnonKey: '...',
  stripe: {
    publishableKey: 'pk_live_...',  // or pk_test_... for testing
    basicPriceId: 'price_XXXXX',    // €14/mo
    proPriceId: 'price_XXXXX'       // €49/mo
  }
};
```

### Stripe Checkout redirect (for Phase 3 reference)
```js
// Load Stripe.js CDN: <script src="https://js.stripe.com/v3/"></script>
const stripe = Stripe(window.AIKE_CONFIG.stripe.publishableKey);
stripe.redirectToCheckout({
  lineItems: [{ price: window.AIKE_CONFIG.stripe.basicPriceId, quantity: 1 }],
  mode: 'subscription',
  successUrl: window.location.origin + '/pages/success.html?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: window.location.origin + '/pages/pricing.html'
});
```

---

## 5. Netlify/Vercel Deployment (INFRA-05)

### Netlify
- **Build command**: (leave empty — no build step)
- **Publish directory**: `.` (root of repo) or just point to repo root
- **`netlify.toml`** (optional but recommended):

```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel
- **Framework Preset**: Other
- **Build Command**: (leave empty)
- **Output Directory**: `.` (root)
- **`vercel.json`** (optional):

```json
{
  "cleanUrls": false
}
```

### Environment Variables on Static Sites
Since there is no build step, Netlify/Vercel environment variables are NOT accessible at runtime in JS (there is no `process.env`). The correct approach for this project is:

**Use `config.js` with the values hardcoded directly.** The Supabase `anon` key is designed to be public. The Stripe publishable key is also public. No secrets are exposed.

For the deployment step:
1. Push code to GitHub
2. Connect repo to Netlify or Vercel
3. Deploy — the `config.js` file with real values is already in the repo (or gitignored with a template)

**Recommendation**: Commit `config.js` with real values (acceptable since these are public keys). Add a comment in the file explaining this.

---

## 6. Existing HTML Pattern

### Current script loading in `index.html`
```html
<!-- At bottom of body -->
<script src="assets/js/bundle.js"></script>
```

### Updated loading order (all pages)
Add before `bundle.js`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script src="assets/js/config.js"></script>  <!-- root pages -->
```

For `pages/*.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script src="../assets/js/config.js"></script>
```

---

## 7. Recommendations

1. **config.js is the single source of truth** — all API keys and IDs live here, loaded on every page
2. **Supabase anon key is public** — safe to commit, RLS handles access control
3. **Netlify is recommended** over Vercel for this project — simpler static site config, free custom domain, no serverless function required for basic Stripe flow
4. **Use test keys first** — configure Stripe with `pk_test_` and `sk_test_` during development
5. **DB trigger handles user creation** — when user signs up via Supabase Auth, the trigger auto-inserts into `public.users` with `plan = 'free'`
6. **RLS on analytics** — allow anon INSERT so page visits can be tracked without login

---

*Research completed: 2026-03-26*
