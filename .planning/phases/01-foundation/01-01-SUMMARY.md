---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [supabase, stripe, netlify, cdn, config]

# Dependency graph
requires: []
provides:
  - Centralised config file (window.AIKE_CONFIG) with nested supabase.url/anonKey and stripe keys
  - Supabase JS CDN loaded in all HTML pages
  - netlify.toml with SPA redirect rule
  - Real Supabase project URL + anon key wired into config.js
  - Real Stripe publishable key + price IDs wired into config.js
affects:
  - 02-auth
  - 03-payments
  - 04-admin

# Tech tracking
tech-stack:
  added:
    - "@supabase/supabase-js@2 (via CDN)"
    - "Netlify static hosting (netlify.toml)"
  patterns:
    - "window.AIKE_CONFIG canonical config object — nested shape (supabase.url, stripe.publishableKey)"
    - "Supabase JS loaded via CDN <script> tag, no Node.js build step"

key-files:
  created:
    - assets/js/config.js
    - netlify.toml
  modified:
    - index.html
    - pages/pricing.html
    - pages/solutions.html
    - pages/booking.html

key-decisions:
  - "window.AIKE_CONFIG uses nested shape — supabase.url NOT supabaseUrl; all subsequent phases must follow this canonical shape"
  - "Supabase JS loaded via CDN per-page rather than bundled — consistent with no-build-tool static site approach"
  - "netlify.toml redirect /* to /index.html with status 200 for SPA-style routing"
  - "Stripe Payment Links added alongside price IDs for direct checkout without Stripe.js"

patterns-established:
  - "Config pattern: window.AIKE_CONFIG.supabase.url / window.AIKE_CONFIG.supabase.anonKey"
  - "Script order: supabase.js CDN → config.js → auth.js → analytics.js → stripe-checkout.js → bundle.js"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 1 Plan 1: Foundation Summary

**Supabase CDN + centralised AIKE_CONFIG wired into all 4 HTML pages; netlify.toml configured; real Supabase project URL + anon key and Stripe publishable key + price IDs already populated in config.js**

## Performance

- **Duration:** 5 min (verification pass — all tasks were pre-completed in earlier commits)
- **Started:** 2026-03-27T12:58:04Z
- **Completed:** 2026-03-27T13:00:00Z
- **Tasks:** 6 (Wave 1: 2 tasks, Wave 2: 4 page edits)
- **Files modified:** 6

## Accomplishments

- `assets/js/config.js` created with canonical nested `window.AIKE_CONFIG` shape (supabase + stripe), real production keys already populated
- `netlify.toml` created with correct publish dir and SPA redirect rule
- Supabase JS CDN script + config.js wired before bundle.js in `index.html`, `pages/pricing.html`, `pages/solutions.html`, `pages/booking.html`

## Task Commits

All Wave 1 and Wave 2 tasks were completed in prior commits:

1. **Task 1.1: Create config.js** — completed in `ee51f57` (config: add real Supabase and Stripe keys)
2. **Task 1.2: Create netlify.toml** — completed in `839b980` (feat(phase-4): admin dashboard + analytics tracking)
3. **Wave 2: Wire CDN + config into index.html** — completed in `ee51f57`
4. **Wave 2: Wire CDN + config into pricing.html** — completed in `ee51f57`
5. **Wave 2: Wire CDN + config into solutions.html** — completed in `ee51f57`
6. **Wave 2: Wire CDN + config into booking.html** — completed in `ee51f57`

**Plan metadata:** (docs commit created below)

## Files Created/Modified

- `assets/js/config.js` — Centralised config with real Supabase URL/anon key and Stripe publishable key/price IDs/payment links
- `netlify.toml` — Build config (publish dir `.`) + SPA redirect rule
- `index.html` — Supabase CDN + config.js added before bundle.js
- `pages/pricing.html` — Supabase CDN + config.js added before bundle.js
- `pages/solutions.html` — Supabase CDN + config.js added before bundle.js
- `pages/booking.html` — Supabase CDN + config.js added before bundle.js

## Decisions Made

- `window.AIKE_CONFIG` uses nested shape: `supabase.url` and `supabase.anonKey`, not flat `supabaseUrl`. All Phase 2+ code must use this canonical form.
- Stripe Payment Links (`basicPaymentLink`, `proPaymentLink`) added to config in addition to price IDs — allows direct payment without Stripe.js `redirectToCheckout`.
- Script load order: supabase.js CDN first → config.js → other scripts → bundle.js last.

## Deviations from Plan

The plan specified placeholder values for Supabase and Stripe (M3/M5 as manual Wave 3 steps). In practice, the real keys were already populated in prior development, making M3 and M5 already complete. Config.js also includes `basicPaymentLink` and `proPaymentLink` fields not in the original plan template — these were added to support Stripe Payment Links (replacing deprecated `redirectToCheckout`).

**Total deviations:** 1 beneficial extension (Stripe Payment Links added to config)
**Impact on plan:** No scope issues — the addition enables the payment flow without Stripe.js redirect dependency.

## Issues Encountered

None — all tasks were already complete when this plan executor ran.

## User Setup Required

**Wave 3 manual steps remain for verification:**

- **M2 (SQL Schema):** Confirm the Supabase SQL schema has been run (users table, analytics table, RLS policies, trigger). If not yet done, the SQL is in the PLAN.md.
- **M6 (Deploy to Netlify):** Push to GitHub, connect repo in Netlify, deploy, confirm "Published" status and live URL.

## Next Phase Readiness

- Config foundation is complete — all HTML pages load Supabase JS and have access to `window.AIKE_CONFIG`
- Phase 2 (auth) can immediately use `window.AIKE_CONFIG.supabase.url` and `window.AIKE_CONFIG.supabase.anonKey` to initialise the Supabase client
- Phase 3 (payments) can use `window.AIKE_CONFIG.stripe.basicPaymentLink` and `proPaymentLink` directly

## Known Stubs

- `assets/js/config.js` `supabase.url` and `supabase.anonKey` — populated with real values; no stubs
- No UI stubs — this plan is infrastructure-only

---
*Phase: 01-foundation*
*Completed: 2026-03-27*
