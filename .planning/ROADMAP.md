# Roadmap: Aike Auth + Pricing + Admin Ecosystem

**Project:** Aike SaaS — Static site + Supabase + Stripe Checkout
**Granularity:** Coarse (4 phases)
**Coverage:** 27/27 v1 requirements mapped
**Created:** 2026-03-26

---

## Phases

- [x] **Phase 1: Foundation** — Supabase + Stripe accounts configured, deployment live, shared config wired in (completed 2026-03-27)
- [ ] **Phase 2: Auth + Pricing UI** — Users can sign up, log in, log out; pricing is consistent; header reflects auth state
- [ ] **Phase 3: Stripe Payments** — Users can pay for plans via Stripe Checkout; plan syncs to Supabase on success
- [ ] **Phase 4: Admin Dashboard + Analytics** — Admin can view all users, plans, and site analytics behind a protected page

---

## Phase Details

### Phase 1: Foundation
**Goal**: The project infrastructure is fully operational — Supabase is provisioned, Stripe products exist, the site deploys from a clean config, and every page loads the shared JS client.
**Depends on**: Nothing
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Estimated plans**: 1-2
**Success Criteria** (what must be TRUE):
  1. Supabase project exists with `users` and `analytics` tables and correct schema
  2. All HTML pages load Supabase JS client via CDN without console errors
  3. One centralised config file (`assets/js/config.js` or equivalent) holds Supabase URL and anon key
  4. Stripe account has €14 Basic and €49 Pro products with active price IDs
  5. Site deploys to Netlify or Vercel; environment variables are set; live URL resolves
**Plans**: TBD

### Phase 2: Auth + Pricing UI
**Goal**: Users can create an account, log in, and log out. The header responds to auth state. Pricing is consistent at €14 / €49 / custom across all pages.
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, PRICE-01, PRICE-02, PRICE-03, NAV-01, NAV-02, NAV-03
**Estimated plans**: 2-3
**Success Criteria** (what must be TRUE):
  1. A new visitor can sign up with email + password and receive a confirmation email
  2. A confirmed user can log in; session persists after browser refresh
  3. A logged-in user can log out; session clears immediately
  4. Header shows "Login" link when logged out; shows round profile image when logged in
  5. Profile image element accepts a future dropdown without structural changes
  6. `pages/pricing.html` shows exactly €14 Basic, €49 Pro, and Custom — no other figures
  7. `index.html` bundle/pricing cards reflect the same €14 / €49 / custom values
  8. Supabase `users` table has a `plan` field populated on account creation
  9. `login.html` and `signup.html` exist and visually match the Aike design system (dark bg, purple accent, Inter + Outfit fonts)
**Plans**: TBD
**UI hint**: yes

### Phase 3: Stripe Payments
**Goal**: Users can pay for Basic or Pro plans via Stripe Checkout and have their plan recorded in Supabase automatically on success.
**Depends on**: Phase 2
**Requirements**: STRIPE-01, STRIPE-02, STRIPE-03, STRIPE-04, STRIPE-05
**Estimated plans**: 1-2
**Success Criteria** (what must be TRUE):
  1. Clicking the €14 plan CTA redirects to Stripe Checkout with the correct Basic price ID
  2. Clicking the €49 plan CTA redirects to Stripe Checkout with the correct Pro price ID
  3. Clicking the Custom plan CTA triggers the contact/booking flow — no Stripe charge initiated
  4. After successful payment, Stripe success URL updates the user's `plan` field in Supabase to `basic` or `pro`
  5. A user who completes checkout sees their correct plan reflected in Supabase (verifiable in dashboard)
**Plans**: TBD

### Phase 4: Admin Dashboard + Analytics
**Goal**: The designated admin can log in and access a protected dashboard showing all users, their plans, visit counts, and active user activity.
**Depends on**: Phase 3
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ANALYTICS-01, ANALYTICS-02
**Estimated plans**: 2
**Success Criteria** (what must be TRUE):
  1. Navigating to `pages/admin.html` without auth redirects to `login.html`
  2. A non-admin authenticated user is denied access (redirected away or shown an error)
  3. The admin sees a total user count, and a table of users showing email, plan, and created_at (no passwords)
  4. Visit count increments in the Supabase `analytics` table on each page load across the site
  5. Admin dashboard displays a visit count and a simulated active user count
  6. Admin UI uses the Aike design system: dark background, purple accents, minimal layout
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/? | Complete    | 2026-03-27 |
| 2. Auth + Pricing UI | 0/? | Not started | - |
| 3. Stripe Payments | 0/? | Not started | - |
| 4. Admin Dashboard + Analytics | 0/? | Not started | - |

---

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 2 | Pending |
| PRICE-01 | Phase 2 | Pending |
| PRICE-02 | Phase 2 | Pending |
| PRICE-03 | Phase 2 | Pending |
| NAV-01 | Phase 2 | Pending |
| NAV-02 | Phase 2 | Pending |
| NAV-03 | Phase 2 | Pending |
| STRIPE-01 | Phase 3 | Pending |
| STRIPE-02 | Phase 3 | Pending |
| STRIPE-03 | Phase 3 | Pending |
| STRIPE-04 | Phase 3 | Pending |
| STRIPE-05 | Phase 3 | Pending |
| ADMIN-01 | Phase 4 | Pending |
| ADMIN-02 | Phase 4 | Pending |
| ADMIN-03 | Phase 4 | Pending |
| ADMIN-04 | Phase 4 | Pending |
| ADMIN-05 | Phase 4 | Pending |
| ADMIN-06 | Phase 4 | Pending |
| ANALYTICS-01 | Phase 4 | Pending |
| ANALYTICS-02 | Phase 4 | Pending |

**v1 requirements: 27 mapped / 27 total — no orphans**

---
*Roadmap created: 2026-03-26*
