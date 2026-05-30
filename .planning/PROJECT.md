# Aike

## What This Is

Aike is a premium business automation SaaS that helps businesses automate client management, workflows, booking systems, and internal processes. The existing website is a polished static HTML/CSS/JS site with a dark premium design system (Aike purple `#a855f7`, dark background `#111111`). This project adds a full auth, pricing, and admin ecosystem on top using Supabase (free tier) and Stripe Checkout — no server required.

## Core Value

Businesses can sign up, choose a plan, pay via Stripe, and access their Aike workspace — while the admin has full visibility over users, plans, and site analytics.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Supabase integration: users table, sessions, analytics tracking
- [ ] Auth system: signup, login, logout, session persistence, bcrypt-hashed passwords via Supabase Auth
- [ ] Pricing consistency: €14 basic / €49 pro / custom across all pages
- [ ] Stripe Checkout: payment flows for €14 and €49 plans, custom plan contact flow
- [ ] Admin dashboard: protected page showing users list, emails, plans, visits, active users
- [ ] Header logic: show "Login" pre-auth, show round profile image post-auth
- [ ] Analytics: track page visits and active users, store in Supabase
- [ ] Deployment: configured for Netlify or Vercel (static hosting)

### Out of Scope

- User-facing dashboard / workspace features — deferred to v2 (focus is infra first)
- Mobile app — web-first
- OAuth / social login — email+password only for v1
- Real-time active user tracking — simulated locally for v1

## Context

- **Stack**: Pure static HTML/CSS/JS, no framework, no build tool. Pages: `index.html`, `pages/pricing.html`, `pages/solutions.html`, `pages/booking.html`
- **Design system**: CSS custom properties in `assets/css/styles.css` — `#111111` dark bg, `#1a1a1a` surface, `#a855f7` purple accent, Inter + Outfit fonts
- **Component injection**: Header and footer are injected via template literals in `assets/js/bundle.js` — any auth UI changes go there
- **Supabase approach**: JS client loaded via CDN (`<script>` tag) in each HTML page — no Node.js needed
- **Stripe approach**: Stripe Checkout redirect (client-side) — no server-side webhook required for basic flow; webhooks needed for plan sync (Netlify/Vercel functions for that)
- **No Stripe account yet** — user needs step-by-step setup instructions

## Constraints

- **No server**: Supabase free tier handles auth + DB; Stripe Checkout handles payments — no backend runtime
- **Static hosting**: Netlify or Vercel — serverless functions available if webhooks are needed
- **Design integrity**: Every new page/component must match the existing Aike design system exactly
- **Pricing lock**: €14 / €49 / custom — must be consistent in Supabase schema, Stripe products, and all UI
- **Security**: Passwords never visible — Supabase Auth handles hashing; no raw passwords in DB or UI

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase over Firebase | Free tier is generous, Postgres-based (structured), built-in Auth, good JS client | — Pending |
| Stripe Checkout over custom payment UI | Simpler, PCI-compliant, no server needed for basic flow | — Pending |
| Static site + CDN libraries | Avoids framework migration, preserves existing design system | — Pending |
| Netlify/Vercel deployment | Serverless functions available for Stripe webhooks, free tier, CI/CD | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after initialization*
