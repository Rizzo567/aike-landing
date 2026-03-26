# Plan: Phase 3 — Stripe Payments

**Phase:** 03-stripe-payments
**Goal:** Users can pay for Basic or Pro via Stripe Checkout; plan syncs to Supabase on success.
**Requirements:** STRIPE-01, STRIPE-02, STRIPE-03, STRIPE-04, STRIPE-05
**Created:** 2026-03-26

## Tasks

- CREATE `assets/js/stripe-checkout.js` — aikeCheckout.basic() / .pro(), auth check, redirectToCheckout
- CREATE `pages/success.html` — reads ?plan=, updates public.users.plan via Supabase session
- EDIT `pages/pricing.html` — Basic/Pro CTAs → onclick aikeCheckout; add Stripe.js CDN + stripe-checkout.js
- EDIT `index.html` — same CTA wiring + scripts

## Flow

1. User clicks Basic/Pro CTA
2. `aikeCheckout.basic()` checks auth → if not logged in, redirect to signup
3. If logged in → `stripe.redirectToCheckout({ lineItems, mode:'subscription', successUrl, cancelUrl, clientReferenceId: userId })`
4. After payment → Stripe redirects to `/pages/success.html?plan=basic`
5. `success.html` reads Supabase session from localStorage, updates `public.users` set plan='basic'

## Note (v1 limitation)

Without a server/webhook, plan is set via URL param on the success page.
This is acceptable for MVP — add a Stripe webhook in a future milestone for production hardening.

## UAT

- [ ] Click Basic "Get started" when logged out → redirects to signup.html
- [ ] Click Basic "Get started" when logged in → Stripe Checkout opens with €14 plan
- [ ] Click Pro "Get started" when logged in → Stripe Checkout opens with €49 plan
- [ ] Click Custom "Book a call" → goes to booking.html (no Stripe charge)
- [ ] Complete Stripe test payment → lands on success.html showing correct plan badge
- [ ] Supabase users table shows plan = 'basic' or 'pro' for the user

---
*Plan created: 2026-03-26*
