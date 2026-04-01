# Domain Pitfalls — Aike Mobile App (Expo Router + Supabase)

**Domain:** B2B SaaS companion iPhone app — React Native / Expo Router / Supabase
**Researched:** 2026-03-27
**Confidence note:** WebSearch and WebFetch were unavailable. All findings come from training data
through August 2025. The patterns below are well-established, widely reported, and largely
stable — but version-specific behavior (especially Expo SDK 53+ or expo-router v4+) should be
verified with official docs before implementing each phase.

---

## How to Use This File

Each pitfall entry has:
- **Description** — what goes wrong
- **Why it happens** — the root cause
- **Prevention** — concrete fix or pattern
- **Phase risk** — which milestone phase is most likely to hit this

Pitfalls are ordered by severity within each category.

---

## Category 1: Expo Router — File Structure and Auth Guards

---

### Pitfall 1: Auth Guard Redirect Loop in Root Layout

**Description:** The app enters an infinite redirect loop between the auth screen and the
protected tabs. The splash screen flashes, or the app shows a blank white screen on launch.
This is the single most common Expo Router bug reported by first-time adopters.

**Why it happens:** The auth guard in `app/_layout.tsx` reads session state from Supabase or
Zustand and redirects based on it. On first render, the session state is `undefined` (not yet
loaded from AsyncStorage). The guard treats `undefined` as "not authenticated" and redirects
to `/login`. The login screen then detects a user is present (from a stale re-render) and
redirects back to `/`. This loop repeats until React bails out.

The trigger is always the same: **redirecting before the auth state is known**.

```typescript
// WRONG — redirects on undefined, causes loop
const { session } = useAuth()
if (!session) router.replace('/login')   // fires before session is loaded

// CORRECT — wait for loading to settle
const { session, loading } = useAuth()
if (loading) return null                 // hold — show nothing until we know
if (!session) router.replace('/login')
```

**Prevention:**
1. Add a `loading` / `initialized` boolean to your auth store (Zustand or context).
2. Return `null` or a splash-equivalent component from the root layout until `loading === false`.
3. Never redirect in a `useEffect` that depends on a value that starts as `undefined`.
4. Use `router.replace` (not `router.push`) for auth redirects — `push` adds to history stack
   and the back button can return to a screen the user should not see.
5. Keep the splash screen visible during this window with `SplashScreen.preventAutoHideAsync()`
   and call `SplashScreen.hideAsync()` only after session is resolved.

**Phase risk:** Phase 1 (Project Init + Auth Shell). This bites on day one of writing the auth
guard. If it is not fixed before adding real screens, every subsequent tab will inherit the
problem.

---

### Pitfall 2: Incorrect File Naming — Parentheses Groups and Route Collisions

**Description:** Routes do not work as expected. Navigating to a tab shows a blank screen.
Deep links resolve to 404. The `(tabs)` group is not treated as a layout wrapper.

**Why it happens:** Expo Router uses the filesystem as the routing table. The conventions are
strict:
- `app/(tabs)/_layout.tsx` — correct (route group with tab layout)
- `app/tabs/_layout.tsx` — WRONG (becomes a navigable route `/tabs/`, not a group)
- `app/(tabs)/index.tsx` — correct (the default tab, renders at `/`)
- `app/(tabs)/home.tsx` — correct (renders at `/home`)
- `app/(tabs)/Home.tsx` — may fail on case-sensitive filesystems (Linux CI/CD)

Route groups in parentheses `()` are invisible to the URL — they are purely organizational.
Developers coming from Next.js often know this, but the exact behavior of nested groups with
`Stack` and `Tabs` combinations is less documented.

**Prevention:**
1. Follow the canonical Expo Router folder structure from `create-expo-app --template tabs`.
   Do not rename these files unless you understand the routing table consequence.
2. Always use lowercase filenames for route files. Mixed case causes silent failures on
   case-sensitive Linux filesystems used in EAS Build.
3. Use `npx expo-router export --dump-routes` (or equivalent) to inspect the resolved route
   table before running.

**Phase risk:** Phase 1 (Project Init). Getting the folder structure wrong at init forces a
rename refactor later. The template from `create-expo-app --template tabs` gives the correct
structure — use it as the starting point, do not start from blank.

---

### Pitfall 3: Missing `+not-found.tsx` and Unhandled Deep Link Routes

**Description:** A deep link (e.g., from an email confirmation or a push notification) navigates
to a route that does not exist. The app crashes or shows a blank screen with no error.

**Why it happens:** Expo Router expects a `app/+not-found.tsx` file to catch unmatched routes.
Without it, unmatched deep links throw a runtime error. Email confirmation links from Supabase
include a `#access_token` fragment that, without proper handling, resolves to a route that
does not exist.

**Prevention:**
1. Create `app/+not-found.tsx` immediately at project init — even just `<Redirect href="/" />`.
2. For Supabase email confirmation deep links specifically, register a custom scheme in
   `app.json` (`scheme: "aike"`) and handle the `aike://auth/callback` URL in the root layout
   with `expo-linking`.

**Phase risk:** Phase 2 (Supabase Auth integration). Deep links appear when wiring up email
confirmation. Without `+not-found.tsx`, testing confirmation on a physical device crashes the
app.

---

## Category 2: Supabase Auth in React Native

---

### Pitfall 4: Session Not Persisting Across App Restarts

**Description:** The user logs in, closes the app, reopens it, and is shown the login screen
again. The session was not saved.

**Why it happens:** `supabase-js` defaults to `localStorage` as its storage adapter in browser
environments. In React Native, `localStorage` does not exist. Without explicitly passing
`AsyncStorage` as the storage adapter, the client silently uses an in-memory fallback that
clears on app close.

This is compounded by a second mistake: forgetting to import `react-native-url-polyfill/auto`
before creating the Supabase client. Without the URL polyfill, auth calls may throw
`"URL is not a constructor"` errors on older Hermes versions, which makes the session problem
look like a network error instead.

**Prevention:**

The correct Supabase client initialization for React Native (must be in a file imported before
any component uses Supabase):

```typescript
// lib/supabase.ts — this file must be imported at the top of app/_layout.tsx
import 'react-native-url-polyfill/auto'   // Line 1, before anything else
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,  // CRITICAL: must be false — RN has no browser URL bar
    },
  }
)
```

Key flags:
- `storage: AsyncStorage` — without this, session is memory-only
- `detectSessionInUrl: false` — if left as `true` (the default), supabase-js tries to parse
  `window.location.hash` which does not exist in RN and throws a runtime error
- `autoRefreshToken: true` — Supabase tokens expire after 1 hour; without this, users are
  silently logged out mid-session

**Phase risk:** Phase 2 (Auth integration). This is the first thing to write. Getting it wrong
makes all subsequent auth tests unreliable — tests pass in Expo Go (session in memory) but
fail on device restart.

---

### Pitfall 5: Supabase Email Confirmation Deep Link Not Handled

**Description:** User taps the "Confirm email" link in their inbox. On iOS it opens the app
(correct), but the session is not set — the user is still logged out.

**Why it happens:** Supabase sends a confirmation email with a link containing an
`access_token` and `refresh_token` in the URL fragment (e.g.,
`aike://auth/callback#access_token=...`). The app must:
1. Be registered as a handler for the custom scheme `aike://`
2. Intercept the incoming URL on launch/resume
3. Extract the token from the fragment
4. Call `supabase.auth.setSession({ access_token, refresh_token })` or
   `supabase.auth.exchangeCodeForSession(code)` depending on the auth flow type

If any step is missing, the token is silently dropped and the user appears unauthenticated
even though the email confirmation succeeded on Supabase's side.

**Prevention:**
1. Add `scheme: "aike"` to `app.json` under `expo`.
2. Set the Supabase redirect URL in the Supabase dashboard to `aike://auth/callback`.
3. In the root `_layout.tsx`, subscribe to `Linking.addEventListener('url', ...)` and parse
   the incoming URL on both cold launch and resume:

```typescript
// app/_layout.tsx
import * as Linking from 'expo-linking'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

useEffect(() => {
  // Handle cold launch URL
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink(url)
  })
  // Handle resume URL
  const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url))
  return () => sub.remove()
}, [])

function handleDeepLink(url: string) {
  const { queryParams } = Linking.parse(url)
  // For PKCE flow (Supabase default since v2.x)
  if (queryParams?.code) {
    supabase.auth.exchangeCodeForSession(String(queryParams.code))
  }
}
```

Note: Supabase switched the default auth flow from implicit (fragment-based tokens) to PKCE
(code-based) in supabase-js v2.x. Confirm which flow is active in your Supabase project
settings — the token extraction differs.

**Phase risk:** Phase 2 (Auth). Critical to test on a real device with a real email — Expo Go
on simulator does not test custom scheme handling reliably.

---

### Pitfall 6: AsyncStorage Keys Colliding with Existing Web Session Data

**Description:** The mobile app can read or overwrite session tokens stored by other
AsyncStorage users (e.g., if the project accidentally ships with a web-targeting config that
uses `localStorage` key names as AsyncStorage keys).

**Why it happens:** This is rare but occurs in brownfield setups where an older version of
supabase-js or a conflicting auth library was installed. supabase-js v2 uses a predictable
AsyncStorage key format (`supabase.auth.token`). If another library or an older supabase-js
initialization also uses this key, sessions can overwrite each other.

**Prevention:**
1. Use only one Supabase client instance across the entire app — a singleton in `lib/supabase.ts`.
2. Never instantiate `createClient()` inside a component or hook — it creates a new client per
   render, each managing its own AsyncStorage key.
3. Run `AsyncStorage.getAllKeys()` during development to inspect what keys are stored.

**Phase risk:** Phase 2 (Auth). Low probability for a greenfield mobile app, but worth knowing
in a multi-milestone project where packages evolve.

---

## Category 3: React Native Image Assets

---

### Pitfall 7: Dynamic Owl Mood Images Cannot Use Runtime require()

**Description:** Attempting to load OwlMascot images dynamically based on a `mood` prop
(e.g., `require(\`../assets/owl-\${mood}.png\`)`) throws a bundler error or silently shows
nothing.

**Why it happens:** Metro (the React Native bundler) resolves `require()` calls at build time
using static analysis. It cannot resolve template literals inside `require()` because the
string is not known at bundle time. This is a fundamental Metro constraint, not a bug.

```typescript
// WRONG — Metro cannot resolve this
const img = require(`../assets/owl-${mood}.png`)

// CORRECT — static map resolved at build time
const OWL_MOODS = {
  idle:        require('../assets/owl-idle.png'),
  alert:       require('../assets/owl-alert.png'),
  celebration: require('../assets/owl-celebration.png'),
} as const

type OwlMood = keyof typeof OWL_MOODS
const img = OWL_MOODS[mood]
```

**Prevention:**
1. Always use a static `require()` map for mood-based or theme-based assets.
2. Define the map at module level (outside the component) so Metro can analyze it at bundle time.
3. If assets need to be truly dynamic (e.g., user-uploaded avatars), use a URI string
   (`{ uri: 'https://...' }`) via `expo-image` instead of `require()`.

**Phase risk:** Phase 1 (OwlMascot component implementation). This will surface on the first
day of building the Owl component if dynamic require is attempted. Easy fix once known.

---

### Pitfall 8: Missing @2x/@3x Asset Variants — Blurry Images on Retina Displays

**Description:** Owl mascot and custom icons look blurry or pixelated on iPhone 14 Pro and
newer Retina displays.

**Why it happens:** React Native resolves image assets at 1x, 2x, and 3x density automatically
if the files are named correctly (`owl-idle.png`, `owl-idle@2x.png`, `owl-idle@3x.png`). If
only the 1x version is present, RN upscales it — resulting in visible blur.

**Prevention:**
1. Export the Owl mascot at all three densities from the design tool (Figma: export at 1x, 2x, 3x).
2. Name files with the `@2x` / `@3x` suffix convention in the same directory.
3. For SVG-based illustrations, use `react-native-svg` with an SVG source instead — resolution-
   independent and smaller bundle size than three PNG variants.

**Phase risk:** Phase 1 (Design system / OwlMascot). Easy to miss during rapid prototyping;
catches attention in design review.

---

## Category 4: Bottom Tab + Stack Navigator Combination

---

### Pitfall 9: Double Header — Tab Screen Shows Two Navigation Bars

**Description:** Opening a detail screen from within a tab (e.g., tapping a Pipeline lead card
opens a lead detail screen) shows two headers stacked: one from the tab layout and one from
the nested Stack navigator.

**Why it happens:** Expo Router's `<Tabs>` and `<Stack>` each render their own header by
default. When a Stack is nested inside a tab, both are active simultaneously unless one is
explicitly hidden.

**Prevention:**
Two valid approaches depending on the desired UX:

Option A — Hide the tab's header, let the Stack manage headers:
```typescript
// app/(tabs)/_layout.tsx
<Tabs.Screen
  name="pipeline"
  options={{ headerShown: false }}  // Tab's own header hidden
/>
```
```typescript
// app/(tabs)/pipeline/_layout.tsx — Stack inside tab
<Stack>
  <Stack.Screen name="index" options={{ title: 'Pipeline' }} />
  <Stack.Screen name="lead-detail" options={{ title: 'Lead Detail' }} />
</Stack>
```

Option B — Show tab header on list screen, hide on detail screen (push navigation feel):
Set `headerShown: false` on the Stack and manage headers per-screen with
`<Stack.Screen options={{ headerShown: true }} />` at the file level.

**Rule:** Each screen should have exactly one entity responsible for its header. Decide at
architecture time which layout owns the header for each screen type.

**Phase risk:** Phase 3 (Pipeline + Inbox screens with detail navigation). Will appear the
moment the first Stack-inside-Tab detail screen is built.

---

### Pitfall 10: Safe Area Double-Padding — Content Pushed Too Far Down or Up

**Description:** Screen content has excessive top or bottom padding. The header appears with
a visible gap above it. Bottom content is cut off or floating above the home indicator.

**Why it happens:** Two simultaneous sources of safe area padding are applied:
1. `react-native-safe-area-context` `SafeAreaView` or `useSafeAreaInsets()` applied inside
   the screen component
2. expo-router's `<Stack>` or `<Tabs>` components also apply safe area padding automatically

When both are active, insets are doubled.

**Prevention:**
1. Do NOT wrap screen content in `<SafeAreaView>` when inside an expo-router `<Stack>` or
   `<Tabs>` — the navigator handles it.
2. Use `useSafeAreaInsets()` only when you need the raw values for custom positioning (e.g.,
   positioning a FAB above the home indicator):
```typescript
const insets = useSafeAreaInsets()
// Position FAB: bottom = tabBarHeight + insets.bottom + 16
```
3. Set `SafeAreaProvider` once at the root `app/_layout.tsx` — never inside individual screens.

**Phase risk:** Phase 1 (Tab bar setup) and Phase 3 (FAB positioning on Pay screen). The
double-padding usually appears on the Pulse dashboard (first tab built) and re-appears on
every new screen until the pattern is enforced.

---

### Pitfall 11: Back Button Visible on Root Tab Screens

**Description:** The root screen of a tab (e.g., Pulse dashboard at `app/(tabs)/index.tsx`)
shows a back button in the header, suggesting the user can navigate "back" from the first tab.

**Why it happens:** When the Stack navigator is nested inside tabs, it retains its history
stack. If the user navigated to a detail screen and then tapped a different tab and came back,
the Stack's history still includes the detail screen — making the back button appear on what
should be the root tab screen.

**Prevention:**
1. For tab root screens, explicitly set `headerBackVisible: false`:
```typescript
<Stack.Screen name="index" options={{ headerBackVisible: false }} />
```
2. When a user switches tabs, reset the nested Stack history with:
```typescript
// In the tab press handler
navigation.reset({ index: 0, routes: [{ name: 'index' }] })
```
Or use `listeners` on `<Tabs.Screen>`:
```typescript
<Tabs.Screen
  name="pipeline"
  listeners={{ tabPress: (e) => navigation.reset({ index: 0, routes: [{ name: 'index' }] }) }}
/>
```

**Phase risk:** Phase 2 (Tab layout setup) and Phase 3 (first detail screen built). This
appears late because it requires navigating to a detail screen and then switching tabs.

---

## Category 5: Styling — StyleSheet and Dark Mode Performance

---

### Pitfall 12: Creating StyleSheet Objects Inside Render (or Inside Components)

**Description:** The app feels janky during navigation transitions. Profiler shows excessive
object allocation. The issue is especially visible on skeleton screen shimmers.

**Why it happens:** `StyleSheet.create()` called inside a component body or inside `render()`
runs on every render. While `StyleSheet.create()` is faster than plain objects (it flattens and
validates at creation time), it still allocates a new object reference on each call — causing
unnecessary reconciliation and garbage collection pressure.

```typescript
// WRONG — new StyleSheet created on every render
function PulseCard() {
  const styles = StyleSheet.create({  // allocates on every render
    card: { backgroundColor: '#1a1a1a', borderRadius: 12 }
  })
  return <View style={styles.card} />
}

// CORRECT — defined once at module level
const styles = StyleSheet.create({
  card: { backgroundColor: '#1a1a1a', borderRadius: 12 }
})
function PulseCard() {
  return <View style={styles.card} />
}
```

**Prevention:**
1. Define all `StyleSheet.create()` calls at the module level (outside the component function).
2. For styles that depend on runtime values (theme, insets, dimensions), use `useMemo`:
```typescript
const dynamicStyles = useMemo(() =>
  StyleSheet.create({ card: { marginBottom: insets.bottom + 16 } }),
  [insets.bottom]
)
```
3. If using NativeWind (recommended in STACK.md), this pitfall is largely avoided — NativeWind
   compiles utility classes to StyleSheet at build time, not at runtime.

**Phase risk:** All phases with component development, but most visible in Phase 3 (5 screens
with skeleton shimmers and lists).

---

### Pitfall 13: useColorScheme() Causing Hydration Mismatches and Flicker

**Description:** The app flashes a white or light background on launch before settling to the
dark Aike theme. Or theme-dependent styles are incorrect on first render.

**Why it happens:** `useColorScheme()` is asynchronous on some React Native versions and
returns `null` on the first render before the system theme is known. Any component that
renders theme-dependent styles based on this value will briefly show the wrong theme.

**Prevention:**
1. Default to `'dark'` when `useColorScheme()` returns `null` — Aike is dark-only:
```typescript
const scheme = useColorScheme() ?? 'dark'
```
2. If the app ever supports light mode, wrap all theme logic in a context that defaults to
   the stored user preference (from AsyncStorage) before `useColorScheme()` resolves.
3. Keep the splash screen visible until the theme is resolved (same window as auth loading).
4. With NativeWind's dark mode class system, set `darkMode: 'class'` and apply the `dark`
   class at the root — this is deterministic and does not flicker.

**Phase risk:** Phase 1 (Design system / theme setup). Usually noticed during first dark UI
implementation on a real device (simulators are less prone to this).

---

## Category 6: Stripe in React Native

---

### Pitfall 14: Using Linking.openURL() Instead of expo-web-browser for Payment Links

**Description:** Stripe Payment Link opens in Safari, user pays, returns to the app — but the
return URL deep link does not fire. Or: on some iOS versions, `Linking.openURL()` does not
open the system browser at all.

**Why it happens:** `Linking.openURL()` for HTTPS URLs opens Safari and exits the app session.
The app is suspended while Safari is foreground. When the user returns, the app resumes but
does not reliably receive the Stripe redirect URL because iOS does not guarantee `Linking`
events for HTTPS-scheme deep links when the app was suspended.

`expo-web-browser` opens an in-app browser (`SFSafariViewController` on iOS) that stays
inside the app process. When the browser dismisses, the Promise resolves — no deep link
required for simple "did payment complete" detection.

**Prevention:**
```typescript
// WRONG — exits app, return URL unreliable
import { Linking } from 'react-native'
await Linking.openURL(stripePaymentLink)

// CORRECT — in-app browser, Promise resolves on dismiss
import * as WebBrowser from 'expo-web-browser'
const result = await WebBrowser.openBrowserAsync(stripePaymentLink, {
  presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
})
// result.type === 'cancel' | 'dismiss' — does not confirm payment,
// but you can then query Supabase for updated plan status
```

Note: `WebBrowser.openBrowserAsync()` does not return payment success/failure — it only
tells you the browser was dismissed. To confirm payment, query Supabase for the user's updated
`plan` field after the browser closes (Stripe webhook updates it server-side).

**Phase risk:** Phase 4 (Pay screen / Stripe integration). This is the implementation pattern
defined in STACK.md — following it avoids this pitfall entirely.

---

### Pitfall 15: App Store Rejection — In-App Purchase Rules for Digital Goods

**Description:** Apple rejects the app because it sells digital subscription access (Basic/Pro
plans) via Stripe, bypassing Apple's in-app purchase (IAP) system.

**Why it happens:** Apple's App Store guidelines (guideline 3.1.1) require that digital goods
and subscriptions sold within an app use Apple's IAP system if the purchase is initiated from
within the app. External payment links presented inside the app can trigger this rule.

**Prevention:**
1. The safest pattern for MVP: do not show pricing or a "Upgrade to Pro" button inside the
   app at all. Direct users to the web (aike.com/pricing) to manage their subscription.
2. If the Pay screen shows the Stripe Payment Link button, frame it as "Manage subscription
   on web" (opening WebBrowser to the web pricing page) rather than an in-app purchase flow.
3. "Reader apps" (apps where content is consumed, not purchased, inside the app) are exempt.
   A SaaS tool where the subscription is managed externally can argue this exemption.
4. Consult Apple's guidelines current version before App Store submission — this policy is
   actively enforced and has shifted over time.

**Phase risk:** Phase 5 (App Store submission). The pitfall happens late but is fatal if hit.
Architecture decisions in Phase 4 (how the Pay screen is framed) determine whether this is a
risk.

**Confidence:** MEDIUM — Apple's IAP rules are frequently updated. This pitfall is based on
training data through August 2025. Verify current guidelines before submission.

---

## Category 7: Performance — FlatList, FlashList, Re-renders

---

### Pitfall 16: Using FlatList Without keyExtractor and getItemLayout

**Description:** Scrolling through the Inbox thread list, Pipeline kanban cards, or Calendar
meeting list is noticeably janky. Scrolling to a specific position (e.g., today in Calendar)
is slow.

**Why it happens:** Without `keyExtractor`, React Native uses array index as the key —
causing full re-render of all visible items when any item changes. Without `getItemLayout`,
the list cannot pre-calculate item positions and cannot scroll to specific items efficiently.

**Prevention:**
```typescript
// Minimum correct FlatList usage
<FlatList
  data={threads}
  keyExtractor={(item) => item.id}       // stable unique ID, not index
  getItemLayout={(_, index) => ({        // only if all items are fixed height
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  renderItem={({ item }) => <ThreadRow thread={item} />}
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={10}
/>
```

For variable-height items (Pipeline cards with different text lengths), omit `getItemLayout`
but keep `keyExtractor`.

**When to use FlashList instead:**
`@shopify/flash-list` is a drop-in FlatList replacement that is ~5x faster for large lists.
Use it for:
- Inbox thread list (potentially hundreds of items)
- Pipeline leads list per column (when leads grow)

The API is nearly identical to FlatList. The only required additional prop is `estimatedItemSize`.

```typescript
import { FlashList } from '@shopify/flash-list'
<FlashList
  data={threads}
  keyExtractor={(item) => item.id}
  estimatedItemSize={72}   // match your ThreadRow height
  renderItem={({ item }) => <ThreadRow thread={item} />}
/>
```

**Phase risk:** Phase 3 (Inbox and Pipeline screens). FlatList is fine for Calendar (small,
fixed list). Use FlashList from the start for Inbox and Pipeline.

---

### Pitfall 17: Passing Inline Functions and Object Literals as Props — Causing Unnecessary Re-renders

**Description:** Tapping a KPI card on Pulse causes the entire screen to re-render. Skeleton
shimmer animations stutter when parent state changes. The Owl component re-animates on every
data refresh.

**Why it happens:** Inline arrow functions and object literals in JSX create a new reference
on every render. Child components that receive them will always see "changed" props and
re-render even if the data is identical.

```typescript
// WRONG — new function reference on every render
<KPICard onPress={() => setExpanded(true)} style={{ marginTop: 8 }} />

// CORRECT — stable references
const handleExpand = useCallback(() => setExpanded(true), [])
const cardStyle = useMemo(() => ({ marginTop: 8 }), [])
<KPICard onPress={handleExpand} style={cardStyle} />
```

**Prevention:**
1. Wrap event handlers in `useCallback` when passed to memoized children.
2. Wrap computed objects in `useMemo` when passed as props.
3. Wrap leaf display components (KPICard, ThreadRow, OwlMascot) in `React.memo()` so they
   only re-render when their props actually change.
4. Do NOT over-memoize — only apply where profiling shows actual re-render cost.

**Pragmatic rule for Aike:** Memo the OwlMascot (animation-heavy), all list item row components
(ThreadRow, PipelineCard, CalendarCard), and the tab bar badge components. Skip memo on layout
wrappers and containers.

**Phase risk:** Phase 3 (all 5 screens built). Performance regressions appear when multiple
tabs are mounted simultaneously and Supabase data refreshes on focus.

---

## Category 8: EAS Build and Deployment

---

### Pitfall 18: Expo Go Limitations Hide Native Build Failures

**Description:** The app works perfectly in Expo Go during development. EAS Build then fails,
or the production build crashes on launch with a native module error. The dev→prod gap causes
lost hours.

**Why it happens:** Expo Go is a pre-built app container with a curated set of native modules.
Any package that requires native code outside Expo Go's bundle (e.g., `@stripe/stripe-react-native`,
custom native modules, or certain version of `react-native-reanimated` with worklets) will
silently fall back to a no-op in Expo Go but fail in a production build.

**Prevention:**
1. Run `npx expo run:ios` early (before Phase 3) to create a local dev client. This exercises
   the native build pipeline and surfaces native module errors weeks before EAS Build.
2. In EAS Build, use `development` profile (creates a dev client) before `production` profile.
3. Check `npx expo-doctor` after every `npm install` — it flags packages incompatible with
   your SDK version before they cause build failures.
4. The Aike stack as defined in STACK.md avoids native-only packages for MVP. Stick to the
   defined stack.

**Phase risk:** Phase 4 (EAS Build + TestFlight). The gap becomes visible at first EAS Build.
Running `npx expo run:ios` once in Phase 1 or 2 eliminates the surprise.

---

### Pitfall 19: Environment Variables Not Available in Production Builds

**Description:** Supabase URL and anon key are undefined in the EAS production build. The app
makes no network calls. All screens show error states.

**Why it happens:** Expo uses `.env` files for local development (via `EXPO_PUBLIC_*` prefix).
EAS Build does not automatically read your local `.env` file — it reads environment variables
configured in `eas.json` or the EAS dashboard.

```json
// eas.json — correct way to provide env vars
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://xxxx.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJ..."
      }
    }
  }
}
```

Note: `EXPO_PUBLIC_*` variables are embedded in the JavaScript bundle at build time. They are
not secret — they are visible in the bundle. This is acceptable for the Supabase anon key
(see Pitfall 21 on RLS), but never use `EXPO_PUBLIC_*` for service role keys or admin credentials.

**Prevention:**
1. Set all required env vars in `eas.json` under each build profile, or in the EAS dashboard
   under "Secrets" (preferred for sensitive values).
2. Use `expo-constants` to access them in code: `Constants.expoConfig?.extra?.supabaseUrl`.
3. Add a startup check that logs a clear error if any required env var is missing:
```typescript
if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is not set — check eas.json env config')
}
```

**Phase risk:** Phase 4 (first EAS Build). This is universally hit on first EAS Build by
developers who used `.env` locally throughout development.

---

### Pitfall 20: OTA Updates Breaking Native-Dependent Code

**Description:** An over-the-air (OTA) update via Expo Updates pushes new JS that uses a
native module that is not present in the currently installed binary. The app crashes on update.

**Why it happens:** EAS Update (OTA) only ships JavaScript. If a new package requires a new
native module, the existing installed binary does not have it. The new JS calls a native method
that does not exist.

**Prevention:**
1. OTA updates are safe only for pure JS changes (UI tweaks, copy changes, Supabase query
   adjustments).
2. Any time a new native package is added (or an existing native package is version-bumped),
   submit a full native build through EAS Build, not an OTA update.
3. Use `runtimeVersion` in `eas.json` to version your native binary. Expo Updates will not
   deliver OTA updates to incompatible binary versions.

**Phase risk:** Phase 5 (post-launch maintenance). Does not affect initial build, but critical
for update strategy planning.

---

## Category 9: Supabase RLS and anon Key Security

---

### Pitfall 21: Trusting the anon Key as a Security Boundary

**Description:** Developer assumes that since the Supabase anon key is "public" and required
for all client calls, Row Level Security (RLS) is optional or secondary. Data from other users
is accessible via direct Supabase queries.

**Why it happens:** The Supabase anon key is embedded in the mobile app bundle (visible via
reverse engineering) and in the web JS (visible in DevTools). Developers conflate "the key
is public" with "no security needed." This is wrong. The anon key authenticates the Supabase
client (proves the request is from an Aike app), but it does not protect individual rows.

**Prevention:**
The anon key is fine to use. RLS is the security layer:

1. Enable RLS on ALL tables that contain user data:
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
```

2. Write policies that restrict access to the authenticated user's own data:
```sql
CREATE POLICY "Users can only see their own leads"
  ON leads FOR SELECT
  USING (auth.uid() = user_id);
```

3. Never use the Supabase **service role key** in the mobile app. The service role key bypasses
   RLS entirely — it belongs only in server-side environments (Supabase Edge Functions,
   Netlify serverless functions).

4. Test RLS with a second test account. Log in as User B and verify that User A's leads are
   not returned.

**Phase risk:** Phase 2 (Supabase schema setup). RLS policies must be written before any data
is written from the mobile app. Retrofitting RLS after data exists is possible but requires
policy testing against existing data.

---

### Pitfall 22: Missing RLS on New Mobile-Specific Tables

**Description:** New tables added for the mobile milestone (`messages`, `payment_requests`) are
created without RLS. Any authenticated user can query any other user's payment requests or
messages.

**Why it happens:** Supabase creates tables with RLS **disabled** by default. The existing
tables from v1.0 may have RLS configured, but new tables added in v2.0 start without policies.
This is easy to miss when iterating quickly on schema.

**Prevention:**
1. Make enabling RLS and writing at least one SELECT policy part of the definition of "done"
   for every new table.
2. Use Supabase dashboard's "Authentication > Policies" view to audit which tables have RLS
   disabled.
3. In the Supabase SQL editor, this query shows all tables without RLS:
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE tablename = pg_tables.tablename
);
```

**Phase risk:** Phase 2 and Phase 3 (any phase where new Supabase tables are created for
mobile-specific features).

---

## Phase-Risk Summary Matrix

| Pitfall | Phase Most at Risk | Severity |
|---------|-------------------|----------|
| 1. Auth guard redirect loop | Phase 1: Project Init + Auth Shell | Critical |
| 2. Expo Router file naming / route collisions | Phase 1: Project Init | High |
| 3. Missing +not-found.tsx | Phase 2: Auth Integration | Medium |
| 4. Session not persisting (AsyncStorage missing) | Phase 2: Auth Integration | Critical |
| 5. Email confirmation deep link not handled | Phase 2: Auth Integration | High |
| 6. AsyncStorage key collisions | Phase 2: Auth Integration | Low |
| 7. Dynamic require() for Owl moods | Phase 1: OwlMascot Component | High |
| 8. Missing @2x/@3x image variants | Phase 1: Design System | Medium |
| 9. Double header (tab + stack) | Phase 3: Pipeline + Inbox screens | High |
| 10. Safe area double-padding | Phase 1 and Phase 3 | High |
| 11. Back button on root tab screen | Phase 2 and Phase 3 | Medium |
| 12. StyleSheet created inside render | Phase 3: All 5 screens | Medium |
| 13. useColorScheme() dark mode flicker | Phase 1: Theme Setup | Medium |
| 14. Linking.openURL vs WebBrowser for Stripe | Phase 4: Pay Screen | High |
| 15. App Store IAP rule rejection | Phase 5: App Store Submission | Critical |
| 16. FlatList without keyExtractor/FlashList | Phase 3: Inbox + Pipeline | High |
| 17. Inline functions causing re-renders | Phase 3: All 5 screens | Medium |
| 18. Expo Go hides native build failures | Phase 4: EAS Build | High |
| 19. Env vars missing in EAS production build | Phase 4: EAS Build | Critical |
| 20. OTA updates breaking native modules | Phase 5: Post-launch | Medium |
| 21. anon key treated as security boundary | Phase 2: Supabase Setup | Critical |
| 22. New tables without RLS | Phase 2 and Phase 3 | High |

---

## Warning Signs to Watch For During Implementation

| Warning Sign | Likely Pitfall |
|-------------|---------------|
| App shows blank white screen on launch | Pitfall 1 (redirect loop) or Pitfall 13 (dark mode flicker) |
| User is logged out on every app restart | Pitfall 4 (AsyncStorage missing) |
| "URL is not a constructor" error in console | Pitfall 4 (missing react-native-url-polyfill) |
| Email confirm link opens app but user still logged out | Pitfall 5 (deep link not handled) |
| Image not found / require() error | Pitfall 7 (dynamic require) |
| Two headers visible on detail screen | Pitfall 9 (double header) |
| Content behind Dynamic Island / home indicator | Pitfall 10 (safe area) |
| Back button shows on Pulse/Inbox/Pipeline root | Pitfall 11 (Stack history not reset) |
| Payment browser opens Safari and app loses focus | Pitfall 14 (Linking vs WebBrowser) |
| Supabase returns empty arrays for all queries in production | Pitfall 21 or 22 (RLS blocks anon reads without auth) |
| App works in Expo Go but crashes in EAS build | Pitfall 18 (native module not in Go) |
| All API calls return undefined after EAS build | Pitfall 19 (env vars not in eas.json) |
| List scrolling janky with 50+ items | Pitfall 16 (FlatList, no keyExtractor/FlashList) |

---

## Sources and Confidence

| Area | Confidence | Notes |
|------|------------|-------|
| Expo Router auth guard patterns | HIGH | Documented pattern, widely reported, stable since expo-router v2 |
| Expo Router file naming | HIGH | Stable filesystem convention since expo-router v1 |
| Supabase AsyncStorage + URL polyfill | HIGH | Documented requirement in supabase-js v2 RN guide, unchanged since v2.0 |
| Supabase PKCE deep link flow | MEDIUM | PKCE became default in supabase-js v2.x; verify flow type in your project settings |
| Metro static require() constraint | HIGH | Fundamental Metro bundler behavior, unchanged |
| Tab+Stack double header | HIGH | Well-documented React Navigation / expo-router behavior |
| Safe area double-padding | HIGH | Common, well-documented, stable |
| expo-web-browser vs Linking.openURL | HIGH | expo-web-browser documented use case for in-app auth/payment flows |
| Apple IAP guideline 3.1.1 | MEDIUM | Policy correct as of Aug 2025 but actively evolving — verify before submission |
| FlashList recommendation | HIGH | Shopify FlashList is the community standard FlatList replacement as of 2024-2025 |
| EAS env var configuration | HIGH | eas.json env configuration is the documented EAS Build pattern |
| Supabase RLS anon key | HIGH | Core Supabase security model, unchanged |

All findings from training data through August 2025. No external docs were fetchable during
this research session. Verify version-specific behaviors with `npx expo-doctor` and official
Expo / Supabase docs before implementing each phase.
