# Plan: Phase 2 — Auth + Pricing UI

**Phase:** 02-auth-pricing-ui
**Goal:** Users can sign up, log in, log out. Header reflects auth state. Pricing consistent at €14/€49/Custom.
**Requirements:** AUTH-01–07, PRICE-01–03, NAV-01–03
**Created:** 2026-03-26

---

## Wave 1 — Auth JS module

**Task 2.1** — Create `assets/js/auth.js`

Handles: Supabase client init, signup, login, logout, session check, header update.
All pages load this after config.js, before bundle.js.

---

## Wave 2 — Update header template in bundle.js

**Task 2.2** — Update `getHeaderHTML(b)` in `assets/js/bundle.js`

Replace the plain "Log in" link with:
- `id="auth-login-btn"` anchor (visible when logged out)
- `id="auth-profile-wrapper"` div (hidden by default, shown when logged in)
  - Contains a round `<button id="auth-profile-btn">` with avatar initials/image
  - Structured for future dropdown (aria-haspopup, data attributes)

---

## Wave 3 — Auth pages

**Task 2.3** — Create `pages/login.html`
**Task 2.4** — Create `pages/signup.html`

Both pages match Aike design: dark bg, purple accent, Inter+Outfit, centered card.

---

## Wave 4 — Pricing UI updates

**Task 2.5** — Update `pages/pricing.html` — replace $2,500/$5,400 with €14/€49/Custom subscription plans
**Task 2.6** — Update `index.html` bundle cards — rename tiers, add €14/€49/Custom pricing

---

## Wave 5 — Wire auth.js into all HTML pages

**Task 2.7** — Add `<script src="assets/js/auth.js">` to all pages after config.js

---

## UAT

- [ ] Visit `pages/signup.html` → fill email+password → submit → see "Check your email" confirmation message
- [ ] Visit `pages/login.html` → login with confirmed account → redirected to `index.html`
- [ ] After login, header shows round purple avatar (no "Log in" link)
- [ ] After login, browser refresh still shows avatar (session persists)
- [ ] Click logout (from profile button) → header reverts to "Log in"
- [ ] Visit `pages/pricing.html` → see exactly €14/mo Basic, €49/mo Pro, Custom plans
- [ ] Visit `index.html` → bundle cards show €14, €49, Custom pricing
- [ ] Supabase `users` table has a row for the new user with `plan = 'free'`

---

## Files Changed

| Action | File |
|--------|------|
| CREATE | `assets/js/auth.js` |
| EDIT   | `assets/js/bundle.js` (header HTML template) |
| CREATE | `pages/login.html` |
| CREATE | `pages/signup.html` |
| EDIT   | `pages/pricing.html` (pricing amounts + plan names) |
| EDIT   | `index.html` (bundle card pricing + plan names) |
| EDIT   | `index.html`, `pages/pricing.html`, `pages/solutions.html`, `pages/booking.html` (add auth.js script tag) |

---

*Plan created: 2026-03-26*
