# Requirements: Aike Auth + Pricing + Admin Ecosystem

**Defined:** 2026-03-26
**Core Value:** Businesses can sign up, choose a plan, pay via Stripe, and be managed via the admin dashboard — all integrated with the existing Aike static site.

## v1 Requirements

### Infrastructure

- [ ] **INFRA-01**: Supabase project created with `users` and `analytics` tables
- [ ] **INFRA-02**: Supabase JS client loaded via CDN on all HTML pages
- [ ] **INFRA-03**: Environment config (Supabase URL + anon key) centralised in one JS config file
- [ ] **INFRA-04**: Stripe account created with €14 Basic and €49 Pro products configured
- [ ] **INFRA-05**: Netlify or Vercel deployment configured with environment variables

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password (Supabase Auth)
- [ ] **AUTH-02**: User receives email confirmation after signup
- [ ] **AUTH-03**: User can log in with email and password
- [ ] **AUTH-04**: User can log out, session is cleared
- [ ] **AUTH-05**: Session persists across browser refresh (Supabase session storage)
- [ ] **AUTH-06**: Passwords are never stored in plaintext — Supabase Auth handles hashing
- [ ] **AUTH-07**: Auth pages (`login.html`, `signup.html`) match Aike design system

### Pricing

- [ ] **PRICE-01**: Pricing page shows exactly €14 Basic, €49 Pro, and Custom plans
- [ ] **PRICE-02**: Home page bundle cards reflect same €14 / €49 / custom pricing
- [ ] **PRICE-03**: Plan selection is stored on the user record in Supabase (`plan` field)

### Stripe Payments

- [ ] **STRIPE-01**: Clicking €14 plan redirects to Stripe Checkout (correct product/price ID)
- [ ] **STRIPE-02**: Clicking €49 plan redirects to Stripe Checkout (correct product/price ID)
- [ ] **STRIPE-03**: Clicking Custom plan shows a contact/booking flow (no Stripe charge)
- [ ] **STRIPE-04**: Stripe success URL updates user plan in Supabase after payment
- [ ] **STRIPE-05**: User's plan in Supabase is updated correctly on successful payment

### Header / Navigation

- [ ] **NAV-01**: Header shows "Login" link when user is not authenticated
- [ ] **NAV-02**: Header hides "Login" and shows round user profile image when authenticated
- [ ] **NAV-03**: Profile image element is structured to support future dropdown (logout, settings, my plan)

### Admin Dashboard

- [ ] **ADMIN-01**: Admin dashboard page (`pages/admin.html`) exists and is protected by auth
- [ ] **ADMIN-02**: Dashboard shows total user count
- [ ] **ADMIN-03**: Dashboard shows users table: email, plan, created_at (no passwords shown)
- [ ] **ADMIN-04**: Dashboard shows visit count and active user count (simulated locally)
- [ ] **ADMIN-05**: Admin page is only accessible to a designated admin email (hardcoded check)
- [ ] **ADMIN-06**: Admin UI matches Aike design system (dark, purple, minimal)

### Analytics

- [ ] **ANALYTICS-01**: Page visits are tracked on each page load and stored in Supabase `analytics` table
- [ ] **ANALYTICS-02**: Active users count is simulated locally and displayed on admin dashboard

## v2 Requirements

### User Workspace

- **WORKSPACE-01**: Logged-in users can access a personal dashboard with their plan details
- **WORKSPACE-02**: Users can upgrade/downgrade their plan
- **WORKSPACE-03**: Users can update profile image

### Advanced Auth

- **AUTH-V2-01**: OAuth login (Google, GitHub)
- **AUTH-V2-02**: Password reset via email
- **AUTH-V2-03**: Two-factor authentication

### Webhooks & Real-Time

- **WEBHOOK-01**: Stripe webhook (Netlify/Vercel function) automatically syncs plan on payment
- **ANALYTICS-V2-01**: Real-time active user tracking via Supabase Realtime

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first; mobile later |
| User workspace features | Infra-first for v1 |
| Real-time active users | Simulated for v1; real implementation in v2 |
| OAuth login | Email+password sufficient for v1 |
| Custom payment UI | Stripe Checkout is simpler, PCI-compliant |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01–05 | Phase 1 | Pending |
| AUTH-01–07 | Phase 2 | Pending |
| PRICE-01–03 | Phase 2 | Pending |
| STRIPE-01–05 | Phase 3 | Pending |
| NAV-01–03 | Phase 2 | Pending |
| ADMIN-01–06 | Phase 4 | Pending |
| ANALYTICS-01–02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after initial definition*
