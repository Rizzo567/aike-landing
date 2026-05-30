# Feature Landscape — Aike Mobile App (v2.0)

**Domain:** B2B automation SaaS — iPhone companion / command center
**Researched:** 2026-03-27
**Confidence note:** WebSearch was unavailable. Findings are drawn from training data on Pipedrive mobile (v5+), HubSpot mobile (iOS), Intercom mobile, Stripe Invoicing, and general B2B mobile UX patterns. All patterns were active as of August 2025. Confidence is MEDIUM unless noted.

---

## Scope Boundary

This file covers ONLY the five new screens for the v2.0 mobile milestone. The following are already built on the web platform and are explicitly out of scope here:

- Auth (signup / login / logout / session persistence)
- Stripe payment links and plan management
- Admin dashboard (users, plans, analytics)

---

## Reference Apps Studied

| App | Screen most referenced | Key pattern borrowed |
|-----|------------------------|----------------------|
| Pipedrive Mobile | Pipeline, Calendar | Swipe-to-stage, deal card density |
| HubSpot Mobile | Pulse Dashboard, CRM | Activity feed + KPI strip |
| Intercom Mobile | Smart Inbox | AI-suggested reply triage |
| Stripe Invoicing iOS | Direct Payments | Payment request creation flow |
| Linear Mobile | General | Skeleton screens, haptic feedback model |

---

## Screen 1: Pulse Dashboard

**Purpose:** First screen after launch. Answers "what happened and what needs attention right now?" for a business owner with 10–100 active clients.

### Data Shown

| Data element | Source | Priority |
|--------------|--------|----------|
| Daily KPI strip (active clients, open leads, messages today, revenue today) | Supabase aggregates | P0 |
| Activity feed (timestamped events: new lead, payment received, booking confirmed, message) | Supabase `analytics` / events table | P0 |
| Owl mascot mood indicator (idle / alert / celebration) | Derived from KPI delta | P1 |
| Streak / momentum badge ("3-day active streak") | Computed from daily login + actions | P2 |

### Primary User Actions (max 3)

1. **Tap activity feed item** — deep-links directly into the relevant screen (Inbox, Pipeline, Calendar, Pay)
2. **Pull-to-refresh** — fetches latest data from Supabase
3. **Tap KPI card** — expands to a 7-day sparkline chart overlay

### Empty / Loading States

| State | What to show |
|-------|-------------|
| First launch (no data yet) | Owl + onboarding prompt: "Connect your first client to start seeing activity" |
| Loading | Skeleton: 4 KPI card placeholders + 5 feed item rows, animated shimmer in Aike purple |
| No activity today | Owl in "idle" mood, message: "All caught up — enjoy the quiet" |
| Supabase unreachable | Last-cached values with "Last updated 3 min ago" badge, no hard error |

### Table Stakes

- [ ] KPI strip with at least 3 metrics (clients, leads, messages)
- [ ] Scrollable activity feed with timestamps
- [ ] Pull-to-refresh with haptic confirmation on complete
- [ ] Skeleton loading state (no blank screen ever)
- [ ] Deep-link tap from feed item to source screen

### Differentiators

- [ ] Owl mascot with at least 3 mood states (idle / alert / celebration) that reacts to KPI deltas
- [ ] KPI sparkline on tap (7-day history in a bottom-sheet overlay)
- [ ] "Momentum" streak badge visible on dashboard header
- [ ] Activity feed grouped by type with colored left-border accent (purple = lead, green = payment, blue = message)

### Anti-Features

| Anti-feature | Why to avoid |
|--------------|-------------|
| Full chart dashboard on first screen | Overwhelms on mobile — defer charting to a dedicated Analytics tab or web admin |
| Auto-playing animations on each feed item | Battery drain, distracting — animate only on state transitions |
| Infinite scroll without pagination | Supabase free tier row fetch cost — paginate at 20 items, load more on demand |
| "Notification center" copy of iOS notifications | Duplicates native notifications — the feed is activity history, not an alert panel |

### Mobile-Specific UX Notes

- KPI strip: horizontal scroll with `snapToInterval`, no pagination dots (they read as noise on dark premium)
- Activity feed items: minimum 60pt height, 16pt horizontal padding — thumb-safe
- Safe area: respect bottom safe area inset on devices with home indicator
- Haptics: light impact on pull-to-refresh trigger, notification haptic on celebration state

---

## Screen 2: Smart Inbox

**Purpose:** Triage incoming client messages. AI suggests a reply or action; user approves, overrides, or dismisses.

### Data Shown

| Data element | Source | Priority |
|--------------|--------|----------|
| Message thread previews (sender name, snippet, time, unread badge) | Supabase `messages` table | P0 |
| AI-suggested action chip per thread ("Reply: confirm appointment", "Flag as urgent", "Archive") | AI layer (future: edge function or OpenAI call) | P0 |
| Confidence score or label on AI suggestion ("High confidence") | AI layer | P1 |
| Thread labels/tags (urgent, waiting, resolved) | User-applied, stored in Supabase | P1 |

### Primary User Actions (max 3)

1. **Swipe right on thread** — approve AI-suggested action (haptic + green flash)
2. **Swipe left on thread** — dismiss / snooze (haptic + grey fade)
3. **Tap thread** — open full conversation and manually override AI suggestion

### Empty / Loading States

| State | What to show |
|-------|-------------|
| Empty inbox | Owl celebration mood, "Inbox zero — you're on top of it" |
| Loading | 5 skeleton thread rows with shimmer |
| AI suggestion loading | Inline spinner on suggestion chip — does not block the row interaction |
| No AI available (offline / quota exceeded) | Thread shown without suggestion chip — user can still tap and reply manually |

### Table Stakes

- [ ] Unread badge count on tab bar icon
- [ ] Thread list with sender name, snippet, relative timestamp
- [ ] Swipe-to-dismiss (left) with visual confirmation
- [ ] Tap-to-open full thread
- [ ] Manual reply compose from thread view
- [ ] Skeleton loading state

### Differentiators

- [ ] AI suggestion chip on each unread thread with approve/dismiss swipe gestures
- [ ] Confidence label on AI suggestion (High / Medium — never show "Low confidence" as a chip)
- [ ] Swipe-right-to-approve with green flash + haptic medium impact
- [ ] Batch triage: long-press selects multiple threads, action bar appears with "Approve all AI suggestions" button
- [ ] Auto-snooze: dismissed item reappears after configurable duration (4h default)

### Anti-Features

| Anti-feature | Why to avoid |
|--------------|-------------|
| Showing raw AI prompt or model name in UI | Looks unpolished — users want the suggestion, not the machinery |
| Forcing AI action before user can read thread | Override must always be one tap away — AI assists, never blocks |
| Chat UI with typing bubbles on inbox list | Inbox list is for triage, not chat — full chat UI only inside thread view |
| Email-style "Mark all as read" without action | Inbox zero should be earned through triage, not hidden — no mass mark-read without action |

### Mobile-Specific UX Notes

- Swipe gestures: use `react-native-gesture-handler` `Swipeable` — threshold 40% of row width to trigger
- Haptics: medium impact on approve (swipe right completes), light impact on dismiss
- Thread row height: 72pt minimum — enough for name + snippet + time in 2 lines
- Destructive swipe (dismiss): red background revealed, icon visible, requires reaching 60% to confirm — prevents accidental dismissal

---

## Screen 3: CRM Pipeline

**Purpose:** Visual kanban of leads by stage. Business owner moves leads forward or rejects them on-the-go.

### Data Shown

| Data element | Source | Priority |
|--------------|--------|----------|
| Stage columns (e.g., New Lead / Contacted / Proposal / Won / Lost) | Supabase `leads` table with `stage` field | P0 |
| Lead cards: name, company, value (€), days in stage | Supabase `leads` | P0 |
| Stage count badge on each column header | Computed from leads count | P0 |
| Total pipeline value per stage | Computed aggregate | P1 |
| Last activity date on lead card | Supabase `leads.last_activity_at` | P1 |

### Primary User Actions (max 3)

1. **Swipe card right** — advance lead to next stage (haptic + card animates into next column)
2. **Swipe card left** — reject / mark as Lost (haptic + card fades with red overlay)
3. **Tap lead card** — open lead detail sheet (contact info, history, edit stage manually, add note)

### Empty / Loading States

| State | What to show |
|-------|-------------|
| No leads in stage | Column shows dashed border placeholder + "No leads here yet" |
| Empty pipeline (all stages empty) | Owl alert mood, "Add your first lead to start tracking deals" + CTA button |
| Loading | 3 skeleton columns, 2 skeleton cards per column |
| Advancing stage (optimistic UI) | Card moves immediately; if Supabase call fails, card snaps back with error toast |

### Table Stakes

- [ ] Horizontal-scroll kanban with at least 3 stages visible in peek layout
- [ ] Lead card showing name, value (€), days in current stage
- [ ] Tap card to open detail sheet
- [ ] Edit stage from detail sheet (fallback for users who find swipe non-obvious)
- [ ] Skeleton loading state for columns and cards

### Differentiators

- [ ] Swipe card right = advance stage, swipe left = mark lost — with distinct haptics (success vs warning)
- [ ] "Days in stage" badge turns amber at 5 days, red at 10 days — visual urgency without notification
- [ ] Optimistic UI on stage advance (card moves immediately, reverts silently if network fails)
- [ ] Lead detail bottom sheet with quick-add note field (one tap to open keyboard)
- [ ] Total pipeline value footer bar showing € sum across all non-Lost leads

### Anti-Features

| Anti-feature | Why to avoid |
|--------------|-------------|
| Drag-and-drop card between columns | Unreliable on mobile scroll containers — swipe gestures are faster and more accurate |
| More than 5 stage columns | Mobile viewport cannot show more than 3 columns in peek — 5 is the hard limit |
| Inline editing of lead name/value on card | Accidental edits from scroll attempts — edit only inside detail sheet |
| Full CRM contact history log on lead card | Card must stay scannable — history belongs inside detail sheet |

### Mobile-Specific UX Notes

- Kanban layout: `ScrollView` horizontal at column level, `FlatList` vertical within each column
- Card swipe: implemented per-card via `Swipeable` — NOT dragging the card between columns
- Stage advance animation: spring physics, 300ms, card slides right then disappears; next column count badge bumps with scale pulse
- Peek layout: on 390pt wide screen, show 2.5 columns (2 full + 0.5 peeking) to signal horizontal scroll

---

## Screen 4: Calendar Integration

**Purpose:** See today's and upcoming meetings. Take quick action on each (confirm, reschedule, open contact).

### Data Shown

| Data element | Source | Priority |
|--------------|--------|----------|
| Meeting list grouped by day (today first) | Supabase `bookings` table | P0 |
| Meeting card: client name, time, duration, type (call / in-person / video) | Supabase `bookings` | P0 |
| Meeting status badge (confirmed / pending / cancelled) | Supabase `bookings.status` | P0 |
| Time-until label on next meeting ("in 45 min") | Computed from current time | P1 |
| Quick action buttons per card: Confirm / Reschedule / Open Contact | Inline on card | P1 |

### Primary User Actions (max 3)

1. **Tap "Confirm"** — marks meeting as confirmed in Supabase, sends confirmation (if messaging integration active)
2. **Tap "Reschedule"** — opens a date/time picker bottom sheet to propose new time
3. **Tap meeting card** — opens meeting detail sheet with client info and meeting notes field

### Empty / Loading States

| State | What to show |
|-------|-------------|
| No meetings today | "No meetings today — enjoy the free time" with Owl idle |
| No upcoming meetings | "No upcoming meetings in the next 7 days" |
| Loading | 3 skeleton meeting card rows |
| Past meeting (already occurred) | Greyed out card, moved to "Past" section below today's fold |

### Table Stakes

- [ ] Meeting list grouped by day, today first
- [ ] Meeting card with client name, time, type
- [ ] Status badge (confirmed / pending)
- [ ] Tap card to open detail
- [ ] Skeleton loading state

### Differentiators

- [ ] "Time until next meeting" hero label at top of screen (e.g., "Next meeting in 45 min — Sarah Chen")
- [ ] Inline confirm button directly on card — no navigate-then-confirm friction
- [ ] Reschedule bottom sheet with DateTimePicker — does not leave the screen
- [ ] Past meetings section auto-collapsed below a "View past" disclosure toggle
- [ ] Haptic feedback on confirm (notification success haptic)

### Anti-Features

| Anti-feature | Why to avoid |
|--------------|-------------|
| Full calendar month grid view | Dense and thumb-unfriendly on mobile — list view is faster for triage |
| Syncing with system iOS Calendar via EventKit | Requires entitlement review, adds complexity — Supabase bookings table is the source of truth for v2 |
| Video call join button (Zoom/Meet link) | Requires deep-link handling per provider — defer to v3 |
| Drag-to-reschedule on calendar grid | Again: grid view is anti-pattern — use list + bottom sheet |

### Mobile-Specific UX Notes

- Section headers for days: sticky headers in `SectionList` — "Today", "Tomorrow", "Mon 30 Mar"
- Confirm button: 36pt height minimum, tappable on the card without opening detail — use `TouchableOpacity` with `stopPropagation` equivalent
- DateTimePicker: use `@react-native-community/datetimepicker` (well-tested, iOS native spinner)
- Safe area: bottom sheet for reschedule must account for keyboard inset (`KeyboardAvoidingView`)

---

## Screen 5: Direct Payments

**Purpose:** Create a payment request for a client on-the-go and track open / paid / overdue status.

### Data Shown

| Data element | Source | Priority |
|--------------|--------|----------|
| Payment request list: client name, amount (€), status, due date | Supabase `payment_requests` table (new) | P0 |
| Status badge per request (draft / sent / paid / overdue) | Supabase `payment_requests.status` | P0 |
| Total outstanding amount (sum of all open requests) | Computed aggregate | P1 |
| Payment creation form: client name/email, amount, description, due date | UI form | P0 |

### Primary User Actions (max 3)

1. **Tap "+" FAB (floating action button)** — opens payment creation sheet (client, amount, due date, optional note)
2. **Tap payment row** — opens detail: resend reminder, view payment link, copy link, mark as paid manually
3. **Pull-to-refresh** — syncs latest statuses from Supabase (and Stripe webhook data if available)

### Empty / Loading States

| State | What to show |
|-------|-------------|
| No payment requests yet | Owl idle, "Create your first payment request to get paid faster" + CTA |
| Loading | 4 skeleton list rows |
| Request just sent | Success toast with Owl celebration mood: "Payment request sent to [client]" |
| Overdue request | Row highlighted with amber left border, "X days overdue" badge |

### Table Stakes

- [ ] List of all payment requests with status and amount
- [ ] Create new payment request form (client email, amount, due date)
- [ ] Status badges (draft, sent, paid, overdue)
- [ ] Copy payment link to clipboard
- [ ] Skeleton loading state

### Differentiators

- [ ] FAB with spring animation on mount — clearly primary action
- [ ] Overdue visual: amber/red left border on row (consistent with Pipeline urgency language)
- [ ] "Total outstanding: €X" summary bar at top of list
- [ ] One-tap "Resend reminder" from detail sheet — no email client opens (Supabase sends it)
- [ ] Owl celebration animation on first payment marked as paid in a session

### Anti-Features

| Anti-feature | Why to avoid |
|--------------|-------------|
| In-app Stripe checkout for the business owner | Owner creates requests for clients — they do not pay through the app themselves |
| PDF invoice generation on device | Compute-heavy on mobile, not expected at this tier — generate server-side or defer to web |
| Recurring payment setup on mobile | Complex form, risk of misconfiguration on small screen — keep on web admin |
| Showing raw Stripe payment intent IDs | Internal IDs surface technical debt to users — show human-readable reference numbers only |

### Mobile-Specific UX Notes

- FAB: positioned 24pt above bottom tab bar, right-aligned, 56pt diameter, Aike purple background
- Form bottom sheet: slides up from bottom, not a push navigation — keeps list visible behind dim overlay
- Amount input: numeric keyboard (`keyboardType="decimal-pad"`), € prefix as static label left of input
- Copy link: `Clipboard.setString()` + brief haptic + toast "Link copied" — do not open Share sheet by default (Share sheet is secondary action)

---

## Cross-Screen Patterns

### Skeleton Screens (all 5 tabs)

Every screen must show a skeleton before data loads. No blank screens, no spinners alone.

Pattern: render skeleton immediately on mount, replace with real content on first data resolve. Use the same layout geometry as real content (card shapes match real cards) to prevent layout shift.

### Haptic Feedback Model

| Action type | Haptic |
|-------------|--------|
| Pull-to-refresh trigger | Light impact |
| Pull-to-refresh complete | Notification success |
| Swipe action approved (Inbox, Pipeline) | Medium impact |
| Swipe action destructive (dismiss, lost) | Heavy impact |
| Button confirm / CTA | Light impact |
| Celebration state (Owl) | Notification success |
| Error / revert | Notification error |

Use `expo-haptics` (`Haptics.impactAsync`, `Haptics.notificationAsync`). Never use haptics on passive scroll.

### Owl Mascot Moods (cross-screen)

| Mood | Trigger | Visual |
|------|---------|--------|
| `idle` | Default, inbox zero, no meetings today | Owl neutral, slow blink animation |
| `alert` | Overdue payment, stale lead (>10 days), unread messages | Owl eyes wide, amber accent |
| `celebration` | Payment received, pipeline advance to Won, inbox zero after triage | Owl bounce + confetti particle burst |

The Owl is a differentiator. Keep it subtle — it appears in empty states and momentarily on celebrations, not on every screen load.

### Navigation (Bottom Tab Bar)

| Tab | Icon | Badge |
|-----|------|-------|
| Pulse | home / lightning bolt | — |
| Inbox | message bubble | Unread count (red, max "99+") |
| Pipeline | funnel | — |
| Calendar | calendar | Pending confirmations count |
| Pay | credit card / wallet | Overdue count (amber) |

Tab bar background: blurred glass (`expo-blur` `BlurView`, intensity 80) over dark background — do not use solid opaque bar.

---

## Feature Dependency Map

```
Auth (existing web) → All 5 screens (user identity required)
Supabase users table → Pulse KPIs, Pipeline leads, Payment requests
Supabase bookings table → Calendar screen
Supabase messages table → Smart Inbox (new table needed)
Supabase payment_requests table → Direct Payments (new table needed)
AI suggestion chip → Smart Inbox (can be stubbed with static suggestions in v2.0, real AI in v3)
Stripe webhook data → Direct Payments status sync (can poll Supabase in v2.0, webhook in v3)
```

---

## MVP Recommendation for v2.0

### Build in this milestone

All 5 screens with table stakes complete. Differentiators to include:

- Owl mascot with 3 moods (high ROI for brand identity, low complexity)
- Skeleton screens on all 5 tabs (non-negotiable quality signal)
- Swipe gestures on Inbox and Pipeline (the core "command center" interaction model)
- FAB on Pay screen
- "Time until next meeting" hero on Calendar

### Defer to v3.0

| Deferred Feature | Reason |
|-----------------|--------|
| AI suggestion chip with real model calls | Requires edge function, OpenAI cost, rate limiting — stub with static labels in v2 |
| Stripe webhook real-time payment status | Webhook infra not yet on mobile path — poll Supabase in v2 |
| Video call join button (Zoom/Meet) | Deep-link per provider, entitlement complexity |
| PDF invoice generation | Server-side compute, not mobile-native |
| Recurring payment setup | Complex form, web-first |
| iOS Calendar (EventKit) sync | Entitlement + privacy review overhead |
| Batch Inbox triage | Nice-to-have, ship after single triage is stable |
| Analytics sparkline charts | Web admin already has analytics — mobile v2 shows numbers only |

---

## Sources and Confidence

| Claim / Pattern | Confidence | Basis |
|-----------------|------------|-------|
| Pipedrive mobile swipe-to-stage pattern | MEDIUM | Training data, Pipedrive iOS v5 documentation patterns, Aug 2025 |
| HubSpot mobile KPI strip + activity feed | MEDIUM | Training data, HubSpot mobile feature set well-documented |
| Intercom inbox swipe triage | MEDIUM | Training data, Intercom mobile iOS patterns |
| react-native-gesture-handler Swipeable | HIGH | Stable, documented API, used by all major RN apps |
| expo-haptics API (`impactAsync`, `notificationAsync`) | HIGH | Expo SDK documentation, stable since SDK 40 |
| expo-blur BlurView for tab bar | HIGH | Expo SDK documentation |
| @react-native-community/datetimepicker | HIGH | Active maintained package, iOS native spinner |
| AI suggestion chip UX model | MEDIUM | Based on Intercom Fin suggestions, GitHub Copilot Chat UI patterns |
| Stripe payment request flow on mobile | MEDIUM | Based on Stripe Invoicing iOS app patterns + Stripe mobile SDK docs |

WebSearch was unavailable for this session. All patterns are from training data. Recommend verifying Pipedrive and HubSpot mobile changelogs directly before finalizing interaction model choices.
