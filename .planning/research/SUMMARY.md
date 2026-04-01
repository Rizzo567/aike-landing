# Research Summary: Aike Mobile App v2.0

**Synthesized:** 2026-03-27
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md (PITFALLS.md not produced — pitfalls extracted directly from anti-patterns across all three files)
**Overall confidence:** MEDIUM-HIGH — architecture and stack patterns are HIGH confidence from stable Expo/Supabase/React Query APIs; feature UX patterns are MEDIUM (training data, no live app audit)

---

## Executive Summary

Aike v2.0 is a React Native iPhone companion app that gives business owners a mobile command center over five distinct domains: real-time KPIs (Pulse), AI-assisted message triage (Inbox), kanban lead management (Pipeline), booking management (Calendar), and on-the-go payment requests (Pay). The app connects to the existing Supabase backend and Stripe infrastructure — no new backend services are required for v2.0. The recommended build is Expo SDK (latest stable from `create-expo-app`) with expo-router for file-based navigation, NativeWind v4 for styling, React Query v5 for server state, and Supabase with a SecureStore auth adapter.

The architecture is deliberately thin: a `mobile/` subdirectory isolates the entire RN project from the existing static web deployment, a module-level Supabase singleton prevents auth state desync, and a static `require()` map resolves the Owl mascot PNG assets safely through Metro. Three Supabase tables need to be created before screen build begins: `messages` (Inbox), `payment_requests` (Pay), and `leads` (Pipeline). The existing `bookings` and `users` tables cover Calendar and Pulse respectively.

The primary risk is complexity creep: the five screens each have swipe gestures, skeleton states, haptic feedback, and the Owl mascot mood system that must all work before the app feels polished. The mitigation is strict layered build order — foundation, auth, tab shell, shared components, data hooks, screen content — with a working demo gate at each layer. AI suggestion chips (Inbox), Stripe webhooks (Pay), and iOS Calendar sync are explicitly deferred to v3.0 to keep v2.0 shippable.

---

## Key Findings

### From STACK.md — Recommended Technologies

| Package | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| Expo SDK | Latest stable (was 52 at cutoff; verify with `create-expo-app`) | RN runtime | MEDIUM |
| expo-router | Matches SDK (v3 or v4) | File-based routing + navigation | MEDIUM |
| `@supabase/supabase-js` | 2.x | Supabase client | HIGH |
| `expo-secure-store` | SDK-bundled | JWT token storage (iOS Keychain) | HIGH |
| `@react-native-async-storage/async-storage` | 1.x | Supabase session storage fallback | HIGH |
| `react-native-url-polyfill` | 2.x | Required by supabase-js in RN | HIGH |
| `nativewind` | ^4.0 | Tailwind utility classes in RN | MEDIUM |
| `tailwindcss` | peer dep | NativeWind compiler | MEDIUM |
| `react-native-reanimated` | 3.x | UI-thread animations | HIGH |
| `moti` | 0.x | Declarative animation API over Reanimated | HIGH |
| `@tanstack/react-query` | 5.x | Server state + caching | HIGH |
| `zustand` | latest | Client state (session, UI flags) | HIGH |
| `expo-blur` | SDK-bundled | BlurView for glassmorphism tab bar | HIGH |
| `expo-haptics` | SDK-bundled | Haptic feedback | HIGH |
| `expo-web-browser` | SDK-bundled | Open Stripe Payment Links | HIGH |
| `expo-font` + `@expo-google-fonts/inter` | SDK / latest | Inter font, matches web design system | HIGH |
| `expo-image` | SDK-bundled | Performant image component | HIGH |
| `@expo/vector-icons` | SDK-bundled | Ionicons for tab bar icons | HIGH |

**Do NOT add:** `@stripe/stripe-react-native` (requires native build), Tamagui (setup overhead), Firebase (already on Supabase), redux/redux-toolkit (Zustand sufficient), `react-native-maps`, `react-native-purchases`.

**Missing from STACK.md:** `expo-blur` (needed for tab bar glassmorphism, mentioned in ARCHITECTURE.md — add to install script) and `@react-native-community/datetimepicker` (needed for Calendar reschedule bottom sheet).

---

### From FEATURES.md — Screen-by-Screen Table Stakes

#### Screen 1: Pulse Dashboard
- KPI strip: active clients, open leads, messages today, revenue today
- Scrollable activity feed with timestamps and color-coded left-border accents by type
- Pull-to-refresh with haptic on complete
- Skeleton loading (4 KPI cards + 5 feed rows)
- Deep-link tap from feed item to source screen
- Owl mascot with 3 moods: `idle`, `alert`, `celebration`

#### Screen 2: Smart Inbox
- Thread list: sender name, snippet, relative timestamp, unread badge
- Swipe right = approve AI suggestion (green flash + medium haptic)
- Swipe left = dismiss/snooze (grey fade + light haptic)
- Tap to open full thread + manual reply compose
- Skeleton loading (5 thread rows)
- Unread count badge on tab bar icon
- **v2.0 AI stub:** Show static "Reply: confirm appointment" chip — no real model call. Real AI in v3.

#### Screen 3: CRM Pipeline
- Horizontal-scroll kanban, 3 stages visible in peek layout (2.5 columns on 390pt screen)
- Lead card: name, value (€), days in stage, last activity
- Swipe right = advance stage (spring animation + success haptic)
- Swipe left = mark Lost (red overlay + heavy haptic)
- Tap card = lead detail bottom sheet with note field
- Optimistic UI on stage advance; revert with error toast if Supabase fails
- Skeleton loading (3 columns, 2 cards each)
- "Days in stage" badge: amber at 5 days, red at 10 days

#### Screen 4: Calendar
- Meeting list in SectionList with sticky day headers (Today / Tomorrow / Mon DD Mon)
- Meeting card: client name, time, duration, type badge, status badge
- "Time until next meeting" hero label at top
- Inline Confirm button on card (no navigate-then-confirm friction)
- Reschedule bottom sheet with `@react-native-community/datetimepicker`
- Past meetings auto-collapsed under disclosure toggle
- Skeleton loading (3 meeting rows)

#### Screen 5: Direct Payments
- Payment request list: client name, amount, status badge (draft/sent/paid/overdue), due date
- "Total outstanding: €X" summary bar at top
- FAB (56pt, Aike purple, spring animation on mount) opens creation sheet
- Creation form: client email, amount (decimal-pad + € prefix), description, due date
- Tap row = detail sheet: resend reminder, copy payment link, mark paid manually
- Overdue rows: amber left border + "X days overdue" badge
- Skeleton loading (4 rows)

#### Cross-Screen Non-Negotiables
- Skeleton screens on ALL 5 tabs — no blank screens, no spinners alone
- Haptics on every swipe confirm, pull-to-refresh trigger/complete, CTA tap, celebration
- Tab bar: glassmorphism blur (expo-blur, intensity 80, tint dark)
- Tab badges: Inbox = unread count (red), Calendar = pending confirmations (red), Pay = overdue count (amber)
- Owl mascot: `idle` (slow blink), `alert` (wide eyes, amber accent), `celebration` (bounce + confetti)

#### Deferred to v3.0
Real AI model calls for Inbox suggestions, Stripe webhooks for real-time payment status, video call join buttons, PDF invoice generation, recurring payment setup, iOS Calendar EventKit sync, analytics sparkline charts, batch inbox triage.

---

### From ARCHITECTURE.md — Architecture Decisions

#### Directory Layout
The entire RN project lives in `mobile/` at the monorepo root. This prevents any conflict with the existing static web assets and Netlify build pipeline.

```
AIKE/
  mobile/
    app/
      _layout.tsx             ← root: SessionProvider + QueryClientProvider
      (auth)/                 ← login, signup, no tab bar
      (tabs)/                 ← 5 tabs with glassmorphism bar
        _layout.tsx
        pulse.tsx | inbox.tsx | pipeline.tsx | calendar.tsx | pay.tsx
    components/
      owl/                    ← OwlMascot.tsx + owlAssets.ts
      ui/                     ← SkeletonCard, GlassCard, TabBarBackground
      auth/                   ← AuthGuard
    constants/
      theme.ts                ← design tokens (mirrors web CSS vars)
      config.ts               ← Supabase URL + anon key
    hooks/
      useSession.ts | useProfile.ts | useAnalytics.ts
    lib/
      supabase.ts             ← singleton client (SecureStore adapter)
      queryClient.ts          ← React Query client
    assets/images/            ← owl-default/annoiato/impressionato/sollevato/spaventato.png
```

#### Supabase Singleton
`lib/supabase.ts` exports one `createClient()` instance. Metro module cache guarantees one instance. Every file imports directly from this file — never pass the client through context or props. Only the reactive session state (user, loading boolean) goes through context via `useSession.ts`.

#### SecureStore Auth Adapter
JWT tokens stored via `expo-secure-store` (iOS Keychain). NOT AsyncStorage (plaintext). Custom adapter wraps `getItemAsync`/`setItemAsync`/`deleteItemAsync` to satisfy the supabase-js `Storage` interface. Always set `detectSessionInUrl: false` — `window.location` does not exist in RN.

#### React Query Pattern
`QueryClientProvider` wraps the root layout. Per-screen hooks use `useQuery` with explicit `queryKey` arrays and `staleTime`. Optimistic mutations via `useMutation` with `onMutate` / `onError` rollback (required for Pipeline stage advance).

#### OwlMascot Asset Map Pattern
Metro cannot resolve dynamic `require()` paths. The solution is a static lookup object in `components/owl/owlAssets.ts` where every `require()` is a string literal. The component receives a `mood` prop and indexes into the map.

| Web filename | Mobile filename | Mood key |
|---|---|---|
| `logo.png` | `owl-default.png` | `default` |
| `logoannoiato.png` | `owl-annoiato.png` | `annoiato` |
| `logoimpressionato.png` | `owl-impressionato.png` | `impressionato` |
| `logosollevato.png` | `owl-sollevato.png` | `sollevato` |
| `logospaventato.png` | `owl-spaventato.png` | `spaventato` |

Copy (do not reference) the PNGs into `mobile/assets/images/` — Metro requires files inside the project root.

#### Glassmorphism Tab Bar
`tabBarStyle.position: 'absolute'` is mandatory — without it, BlurView shows a solid background because no content is behind it. All tab screen root containers must add `paddingBottom` equal to the tab bar height (~83pt on iPhone with home indicator) via `useBottomTabBarHeight()`.

#### Theme Tokens
`constants/theme.ts` mirrors the web CSS custom properties as typed TypeScript constants: `Colors`, `Spacing`, `Radii`, `Typography`, `Shadows`, `Transitions`. NativeWind config extends these same values.

---

## New Database Tables Required

These three tables do not exist yet and must be created in Supabase before the relevant screens can be built.

### `messages`
Used by: Smart Inbox

```sql
create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  sender_name   text not null,
  sender_email  text,
  snippet       text not null,
  full_body     text,
  status        text not null default 'unread',   -- unread | read | archived | snoozed
  label         text,                              -- urgent | waiting | resolved
  ai_suggestion text,                              -- stubbed text in v2.0
  created_at    timestamptz default now(),
  snoozed_until timestamptz
);
create index on public.messages(user_id, created_at desc);
```

### `payment_requests`
Used by: Direct Payments

```sql
create table public.payment_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  client_name     text not null,
  client_email    text not null,
  amount_cents    integer not null,
  currency        text not null default 'EUR',
  description     text,
  status          text not null default 'draft',  -- draft | sent | paid | overdue
  due_date        date,
  payment_link    text,
  stripe_ref      text,                            -- human-readable, not intent ID
  created_at      timestamptz default now(),
  paid_at         timestamptz
);
create index on public.payment_requests(user_id, status, due_date);
```

### `leads`
Used by: CRM Pipeline

```sql
create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  name             text not null,
  company          text,
  email            text,
  value_cents      integer default 0,
  currency         text not null default 'EUR',
  stage            text not null default 'new',   -- new | contacted | proposal | won | lost
  note             text,
  last_activity_at timestamptz default now(),
  created_at       timestamptz default now()
);
create index on public.leads(user_id, stage, last_activity_at desc);
```

**Existing tables reused as-is:** `public.users` (Pulse KPIs + auth), `public.bookings` (Calendar), `public.analytics` (Pulse activity feed).

---

## Watch Out For — Top 5 Pitfalls

### 1. Multiple Supabase Client Instances
**What breaks:** Two `createClient()` calls create independent auth state machines that desync silently — session updates in one instance are not reflected in the other, causing phantom logout or stale user state.
**Prevention:** `lib/supabase.ts` is the ONLY place `createClient()` is called. Every file imports the exported `supabase` constant. Enforce with an ESLint rule if needed.

### 2. `detectSessionInUrl: true` in React Native
**What breaks:** Supabase's web SDK attempts to read `window.location.hash` which does not exist in RN. The app crashes with "window is not defined" at the first auth call.
**Prevention:** Always set `detectSessionInUrl: false`. Handle magic link redirects manually via `Linking.useURL()` + `supabase.auth.getSessionFromUrl()`.

### 3. Dynamic `require()` for Owl Assets
**What breaks:** `require('../assets/owl-' + mood + '.png')` silently produces an empty image in development and a hard crash in production builds. Metro resolves `require()` at bundle time — it cannot evaluate runtime variables.
**Prevention:** The static `OWL_ASSETS` map in `owlAssets.ts` with one literal `require()` per mood. Never compute the path at runtime.

### 4. Tab Bar Without `position: 'absolute'`
**What breaks:** The `BlurView` renders behind an opaque background layer, making the glassmorphism effect invisible. The tab bar appears as a flat dark bar instead of frosted glass.
**Prevention:** Set `tabBarStyle.position: 'absolute'` in the Tabs layout. Add `paddingBottom` to every tab screen to prevent content hiding behind the bar.

### 5. Skipping Optimistic UI on Pipeline Stage Advance
**What breaks:** On a 400ms+ mobile network, the user swipes a card and nothing happens visually for half a second. They swipe again. The card advances twice. Frustration + data corruption.
**Prevention:** Use React Query `useMutation` with `onMutate` to update the local cache immediately, `onError` to roll back the card with an error toast, and `onSettled` to invalidate the query. The card must move before the network call resolves.

### 6. (Bonus) Sharing `window.AIKE_CONFIG` from Web
**What breaks:** The web `config.js` uses `window.AIKE_CONFIG = {}`. Metro throws "window is not defined" on import.
**Prevention:** `constants/config.ts` duplicates the Supabase URL and anon key as plain TS exports. Never import from web config files inside the `mobile/` project.

---

## Implications for Roadmap — Suggested Phase Sequence

### Phase 0: Database Setup (prerequisite, ~0.5 day)
Create the three new Supabase tables (`messages`, `payment_requests`, `leads`) with RLS policies before any screen build begins. This is the only backend work in v2.0 and it unblocks all screen phases.

**Research flag:** Standard SQL — no research phase needed. Write migrations directly.

### Phase 1: Foundation + Auth (~1.5 days)
Initialize `mobile/` with `create-expo-app`, install all packages, set up `lib/supabase.ts` (SecureStore adapter), `constants/theme.ts`, `constants/config.ts`, `lib/queryClient.ts`, `hooks/useSession.ts`, `app/(auth)/` screens, and root `_layout.tsx` with auth redirect.

**Gate:** Sign in with real account → session persists across app kill/relaunch in Expo Go.

**Research flag:** No additional research needed. Architecture file specifies exact implementation patterns.

### Phase 2: Tab Shell + Shared Components (~1 day)
Build `app/(tabs)/_layout.tsx` with glassmorphism tab bar, 5 placeholder tabs. Build `OwlMascot`, `SkeletonCard`, `GlassCard`, `TabBarBackground`. Copy Owl PNGs.

**Gate:** All 5 tabs navigate; BlurView blur effect visible; `<OwlMascot mood="celebration" />` renders.

**Research flag:** No additional research needed.

### Phase 3: Pulse Dashboard (~1 day)
KPI strip (scroll with `snapToInterval`), activity feed with color accents, pull-to-refresh, skeleton state, deep-link taps, Owl mood logic (idle/alert/celebration based on KPI deltas).

**Gate:** Real Supabase data populates KPI cards; Owl switches mood on state change.

**Research flag:** No research needed — read from existing `public.analytics` table.

### Phase 4: Smart Inbox (~1.5 days)
Thread list from `messages` table, swipe gestures (`react-native-gesture-handler` Swipeable), static AI suggestion chip stub, unread badge, full thread view with manual reply compose, skeleton state.

**Gate:** Swipe right marks thread read + green flash + haptic; inbox badge updates on tab bar.

**Research flag:** Gesture handler Swipeable threshold/animation tuning may benefit from quick docs check. Low risk — well-documented API.

### Phase 5: CRM Pipeline (~1.5 days)
Horizontal-scroll kanban from `leads` table, lead cards with days-in-stage urgency coloring, swipe-to-advance + swipe-to-lose with optimistic UI, lead detail bottom sheet, skeleton state.

**Gate:** Swipe advance → card moves immediately → Supabase updates → stage count badge bumps.

**Research flag:** Optimistic mutation pattern is well-covered by React Query docs — no research phase. Verify `useMutation` + `cancelQueries` pattern before coding.

### Phase 6: Calendar (~1 day)
SectionList with sticky day headers from `bookings` table, "time until next meeting" hero, inline confirm button, reschedule bottom sheet with `@react-native-community/datetimepicker`, past meetings disclosure, skeleton state.

**Gate:** Confirm button updates `bookings.status` in Supabase without leaving the screen.

**Research flag:** `@react-native-community/datetimepicker` has mode/display quirks on iOS — skim current README before implementing.

### Phase 7: Direct Payments (~1.5 days)
Payment request list from `payment_requests` table, total outstanding bar, FAB + creation form bottom sheet, status badges with overdue highlighting, detail sheet with copy-link + manual paid, skeleton state, Owl celebration on first paid.

**Gate:** Create payment request → row appears with "sent" status → copy link works.

**Research flag:** No research needed — all patterns covered by FEATURES.md and ARCHITECTURE.md.

### Phase 8: Polish + QA (~1 day)
Haptics audit across all 5 screens, tab badge counts wired to live data, safe area insets verified on iPhone 14 Pro (Dynamic Island) and iPhone SE (small screen), dark theme consistency pass, skeleton-to-content transition timing, Expo Go vs dev client animation check.

**Gate:** Full cold-start-to-demo flow works on a physical iPhone without visible jank.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (packages + versions) | MEDIUM | SDK version may have moved past 52. Run `npx create-expo-app` to get current. All core patterns (Supabase adapter, React Query, NativeWind) are HIGH confidence. |
| Features (screen UX) | MEDIUM | Derived from competitive app analysis (Pipedrive, HubSpot, Intercom) via training data. No live audit. Core patterns are well-established. |
| Architecture | HIGH | Expo Router file structure, Supabase singleton, SecureStore adapter, React Query, Metro require() constraint — all stable, well-documented patterns. |
| Pitfalls | HIGH | Anti-patterns identified directly from architecture constraints and prior RN project common failure modes — not speculative. |
| New DB schema | MEDIUM | Schema is reasonable for v2.0 feature set. RLS policies, indexes, and exact field names should be reviewed with the lead developer before migration. |

**Gaps to address during planning:**
- Exact `supabase.auth.getSessionFromUrl()` API shape in current supabase-js v2 — verify against live docs before implementing magic link flow
- Expo Router version at time of init — let `create-expo-app` decide, do not pin manually
- RLS policies for the three new tables — not designed in research, must be defined during Phase 0
- `@react-native-community/datetimepicker` display mode for iOS time-only vs datetime selection — skim README before Phase 6

---

## Build Order Summary

```
Phase 0: DB Tables (messages, payment_requests, leads)
   ↓
Phase 1: Foundation + Auth (Supabase singleton, SecureStore, routing)
   ↓
Phase 2: Tab Shell + Shared Components (glassmorphism bar, Owl, Skeleton)
   ↓
Phase 3: Pulse Dashboard (KPIs, activity feed, Owl mood)
   ↓
Phase 4: Smart Inbox (threads, swipe gestures, AI stub chip)
   ↓
Phase 5: CRM Pipeline (kanban, optimistic stage advance)
   ↓
Phase 6: Calendar (SectionList, confirm, reschedule)
   ↓
Phase 7: Direct Payments (FAB, creation form, status tracking)
   ↓
Phase 8: Polish + QA (haptics, badges, safe areas, animation)
```

---

## Sources

- `.planning/research/STACK.md` — 2026-03-27
- `.planning/research/FEATURES.md` — 2026-03-27
- `.planning/research/ARCHITECTURE.md` — 2026-03-27
- Training data through August 2025 (Expo SDK 52, expo-router v3, supabase-js v2, React Query v5)
- Competitive reference: Pipedrive Mobile v5+, HubSpot Mobile iOS, Intercom Mobile iOS, Stripe Invoicing iOS, Linear Mobile
