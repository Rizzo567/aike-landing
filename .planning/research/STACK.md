# Technology Stack: Aike Mobile App

**Project:** Aike v2.0 — React Native iPhone companion app
**Researched:** 2026-03-27
**Overall confidence:** MEDIUM — all claims from training data (cutoff August 2025). External docs fetching was unavailable. Versions marked as LOW confidence should be verified with `npx expo-doctor` after init.

> NOTE: No external search tools were available during this research session (WebSearch, WebFetch, Brave, Exa, Firecrawl all denied). All findings come from training data. Where a version could have moved since August 2025, confidence is marked LOW and a verification command is provided.

---

## Recommended Stack

### Core Platform

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| Expo SDK | **52** | RN runtime + toolchain | MEDIUM | SDK 52 released Nov 2024. SDK 53 may be out by March 2026 — verify with `npx create-expo-app --template`. Use whatever `create-expo-app` installs by default; it always targets the latest stable SDK. |
| React Native | **0.76.x** (bundled with SDK 52) | Core framework | MEDIUM | Bundled automatically with Expo SDK — do not pin separately. |
| Node.js | **20.x LTS** | Build toolchain | HIGH | Expo requires Node 18+. Node 20 LTS is the safest choice. |
| expo-router | **3.x or 4.x** | File-based routing + navigation | MEDIUM | expo-router v3 shipped with SDK 52. v4 may be current by March 2026. Always matches the Expo SDK version — do not install a different major. |

**Verification command after project init:**
```bash
npx expo-doctor
```

---

### Navigation (via expo-router)

expo-router is the only routing solution to use. It provides file-based routing built on React Navigation 6 under the hood. Do NOT install React Navigation separately — expo-router wraps it.

| Pattern | How | File |
|---------|-----|------|
| Bottom tabs (5 tabs) | `<Tabs>` layout in `app/(tabs)/_layout.tsx` | Built into expo-router |
| Stack navigator per tab | `<Stack>` layout inside each tab folder | Built into expo-router |
| Auth gate | Root `app/_layout.tsx` — redirect unauthenticated users | Built into expo-router |

**Why expo-router over bare React Navigation:** Deep linking works automatically, URL-based navigation matches web mental model, typed routes in v3+. For this app there is no reason to use bare React Navigation.

---

### Supabase Integration

| Package | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| `@supabase/supabase-js` | **2.x** (latest 2.x) | Supabase client | HIGH |
| `@react-native-async-storage/async-storage` | **1.x** | Session persistence storage adapter | HIGH |
| `react-native-url-polyfill` | **2.x** | URL polyfill required by supabase-js in RN | HIGH |
| `expo-secure-store` | bundled with SDK | Secure token storage (optional upgrade from AsyncStorage) | HIGH |

**Why this setup:** supabase-js v2 ships a `@supabase/supabase-js` package that works in React Native, but requires two things the browser provides natively that RN does not: (1) a storage adapter for session persistence, and (2) a URL polyfill. Without AsyncStorage the session is lost on app restart. Without the URL polyfill, Supabase auth calls throw at runtime.

**Supabase client initialization for RN (pattern):**
```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,   // MUST be false in RN — no browser URL bar
  },
})
```

**Expo Go compatible:** YES — all three packages work in Expo Go.

---

### Stripe Payments

**Recommendation: Use Payment Link redirect via `expo-linking` + in-app browser. Do NOT add a native Stripe SDK for MVP.**

| Package | Purpose | Confidence |
|---------|---------|------------|
| `expo-web-browser` | Open Stripe Payment Link in in-app browser | HIGH |
| `expo-linking` | Handle deep link callback after payment | HIGH |

**Why not `@stripe/stripe-react-native`:**
- Requires native build (not Expo Go compatible without a dev client)
- Needs Stripe publishable key, webhook, and backend to confirm payment intent
- The Aike web app already uses Stripe Payment Links — reusing them in mobile is consistent and zero-backend
- For MVP, Payment Link redirect is correct. Add native Stripe SDK only if you need in-app card entry (v3+).

**Why not `expo-stripe` (deprecated):** The package `expo-stripe` is a wrapper around `@stripe/stripe-react-native` and does not simplify the native build requirement.

**Payment flow for MVP:**
```typescript
import * as WebBrowser from 'expo-web-browser'

const openPayment = async (planLink: string) => {
  await WebBrowser.openBrowserAsync(planLink, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
  })
}
```

**Expo Go compatible:** YES — expo-web-browser works in Expo Go.

---

### Styling

**Recommendation: NativeWind v4 with StyleSheet fallback for one-off overrides.**

| Option | Verdict | Reason |
|--------|---------|--------|
| `StyleSheet` (built-in) | Use as fallback only | Verbose, no design system tokens, hard to maintain dark theme consistently |
| **NativeWind v4** | **RECOMMENDED** | Tailwind CSS syntax in RN. v4 works with Expo SDK 52 + New Architecture. Fastest way to build a consistent dark UI with utility classes. No runtime overhead — compiles to StyleSheet. |
| Tamagui | Overkill for MVP | Full design system framework. Excellent but adds 3-4h setup time, custom compiler, complex config. Use in v3+ if design needs expand significantly. |

**NativeWind v4 setup:**
```bash
npx expo install nativewind@^4.0 tailwindcss
```

Configure `tailwind.config.js` with dark mode and Aike colors:
```js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'aike-purple': '#a855f7',
        'aike-bg': '#111111',
        'aike-surface': '#1a1a1a',
      },
    },
  },
}
```

**Expo Go compatible:** YES for NativeWind v4.

---

### Animations

**Recommendation: React Native Reanimated 3 for all animations. Moti as a thin wrapper where convenient.**

| Package | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| `react-native-reanimated` | **3.x** | Core animation engine (UI thread, 60/120fps) | HIGH |
| `moti` | **0.x** | Declarative animation API built on Reanimated 3 | HIGH |

**Why Reanimated 3 over Animated (built-in):** Built-in `Animated` runs on the JS thread and drops frames during heavy loads. Reanimated 3 runs on the UI thread (JSI-based) — essential for glassmorphism transitions, skeleton shimmers, and tab animations that match iOS native feel.

**Why Moti:** It wraps Reanimated 3 with a `<MotiView>` component that takes `from`/`animate` props — exactly like Framer Motion on web. Skeleton screens become trivial:
```tsx
<MotiView
  from={{ opacity: 0.3 }}
  animate={{ opacity: 1 }}
  transition={{ loop: true, type: 'timing', duration: 800 }}
/>
```

**Expo Go compatible:** Reanimated 3 requires a dev client or bare workflow to use worklets. In Expo Go, only the JS-thread subset works (animations that don't use `useSharedValue` with worklets). For skeleton screens using `MotiView` with simple opacity loops — Expo Go works. For gesture-driven animations — dev client needed.

**Flag:** Build a dev client early if animations are central to the UX. `npx expo run:ios` or EAS Build creates the dev client.

---

### Icons

**Recommendation: `@expo/vector-icons` only. No additional icon library needed for MVP.**

| Package | Purpose | Confidence |
|---------|---------|------------|
| `@expo/vector-icons` | ~30 icon sets (Ionicons, MaterialIcons, Feather, etc.) bundled with Expo | HIGH |

**Why not Lucide React Native:** Lucide is excellent but requires installing separately and has no advantage over Ionicons for a 5-tab app. `@expo/vector-icons` is already installed by default in every Expo project.

**Recommended icon set for premium dark UI:** `Ionicons` or `MaterialCommunityIcons` — both have filled/outline variants for active/inactive tab states.

**Expo Go compatible:** YES.

---

### Fonts

**Recommendation: `expo-font` with `useFonts` hook. Load Inter and Outfit to match web design system.**

| Package | Purpose | Confidence |
|---------|---------|------------|
| `expo-font` | Font loading runtime | HIGH |
| `@expo-google-fonts/inter` | Inter font family | HIGH |
| `@expo-google-fonts/outfit` | Outfit font family | HIGH |

**Why:** Matches the existing web design system exactly. Both `@expo-google-fonts/*` packages bundle the font files — no network request at runtime. `useFonts` returns a `[loaded, error]` pair — show a splash screen until `loaded === true`.

```bash
npx expo install expo-font @expo-google-fonts/inter @expo-google-fonts/outfit
```

**Expo Go compatible:** YES.

---

### Safe Areas

| Package | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| `react-native-safe-area-context` | **4.x** | Handle iPhone notch, Dynamic Island, home indicator | HIGH |
| `react-native-safe-area-context` | — | `SafeAreaProvider` must wrap entire app in root `_layout.tsx` | HIGH |

**Why:** Without this, content bleeds under the Dynamic Island (iPhone 14 Pro+) and home indicator. expo-router's `<Stack>` and `<Tabs>` handle safe areas automatically when `SafeAreaProvider` is at the root. This package is installed by default in every `create-expo-app` project.

**Expo Go compatible:** YES.

---

### Haptics

| Package | Purpose | Confidence |
|---------|---------|------------|
| `expo-haptics` | Trigger haptic feedback (impact, notification, selection) | HIGH |

**Why:** On a premium B2B app, haptic feedback on tab switches, CTA button taps, and success states makes the app feel native-quality. One line of code per interaction:
```typescript
import * as Haptics from 'expo-haptics'
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
```

**Expo Go compatible:** YES.

---

### Additional Essential Packages

| Package | Purpose | When Needed | Expo Go Compatible |
|---------|---------|-------------|-------------------|
| `expo-constants` | Read `app.json` values, API URLs, env config | From day 1 | YES |
| `expo-status-bar` | Control iOS status bar style (dark/light) | From day 1 | YES |
| `expo-splash-screen` | Keep splash visible until fonts + data loaded | From day 1 | YES |
| `expo-secure-store` | Store JWT tokens securely (keychain on iOS) | Auth phase | YES |
| `expo-image` | Performant image component (caching, blurhash) | Profile/avatar images | YES |
| `@tanstack/react-query` | Server state, caching, background refresh | Supabase data fetching | YES (JS only) |
| `zustand` | Lightweight client state (user session, UI state) | Auth state, theme | YES |

**Why React Query over SWR or plain `useEffect`:** React Query handles background refresh, stale-while-revalidate, and error/loading states declaratively. For a 5-tab app hitting Supabase, it eliminates 80% of `useEffect` data-fetching boilerplate.

**Why Zustand over Redux:** Redux is 10x the boilerplate for this app size. Zustand is a 3-line store. For holding `{ user, session, plan }` globally, Zustand is correct.

---

## Packages to Explicitly NOT Add (MVP)

| Package | Why Not |
|---------|---------|
| `@stripe/stripe-react-native` | Requires native build, adds complexity. Payment Links cover MVP. |
| Tamagui | 4-6h setup overhead, own compiler, not needed when NativeWind covers the design. |
| `react-native-gesture-handler` | Already included transitively via expo-router/React Navigation. Do not install separately unless you need custom gestures. |
| `react-native-maps` | Not in the feature set. |
| `react-native-purchases` (RevenueCat) | Overkill — Stripe handles subscriptions via web. Add only if moving to in-app purchases. |
| Firebase | Already on Supabase. Two auth systems = bugs. |
| `i18n-js` / `i18next` | Not in scope. Italian-only app for now. |
| `redux` / `redux-toolkit` | Zustand is sufficient for this app's state complexity. |

---

## Expo Go vs Dev Client Compatibility Summary

| Package | Expo Go | Dev Client / `expo run:ios` |
|---------|---------|----------------------------|
| expo-router | YES | YES |
| supabase-js | YES | YES |
| NativeWind v4 | YES | YES |
| react-native-reanimated (worklets) | PARTIAL (JS thread only) | YES (full UI thread) |
| moti (simple opacity/scale) | YES | YES |
| expo-haptics | YES | YES |
| expo-font | YES | YES |
| expo-web-browser (Payment Links) | YES | YES |
| @stripe/stripe-react-native | NO | YES |
| expo-secure-store | YES | YES |
| expo-image | YES | YES |

**Recommendation:** Start development in Expo Go. When skeleton screen animations start looking choppy or you need gesture-driven Reanimated worklets, run `npx expo run:ios` once to create the dev client. This is a one-time 10-minute step.

---

## Project Initialization

```bash
# Create project with latest Expo SDK
npx create-expo-app@latest AikeMobile --template tabs

# Install all recommended packages
npx expo install \
  @supabase/supabase-js \
  @react-native-async-storage/async-storage \
  react-native-url-polyfill \
  expo-secure-store \
  expo-web-browser \
  expo-linking \
  react-native-reanimated \
  moti \
  nativewind@^4.0 \
  expo-font \
  @expo-google-fonts/inter \
  @expo-google-fonts/outfit \
  expo-constants \
  expo-status-bar \
  expo-splash-screen \
  expo-haptics \
  expo-image \
  react-native-safe-area-context

# JS-only packages (npm, not expo install)
npm install @tanstack/react-query zustand tailwindcss
```

> Always use `npx expo install` (not `npm install`) for Expo packages. It resolves the version compatible with your SDK automatically.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Routing | expo-router | React Navigation bare | expo-router IS React Navigation; no reason to use bare version |
| Styling | NativeWind v4 | Tamagui | Tamagui setup overhead not worth it for MVP; revisit at v3 |
| Styling | NativeWind v4 | StyleSheet only | Inconsistent token management; dark theme harder to maintain |
| State | Zustand | Redux Toolkit | Redux is 5x more boilerplate for this app size |
| Data fetching | React Query | SWR | React Query has better RN support and more features |
| Payments | Payment Link redirect | @stripe/stripe-react-native | Native Stripe requires dev client and backend; PL is zero-backend |
| Animations | Reanimated 3 + Moti | Animated (built-in) | JS thread animations drop frames; Reanimated runs on UI thread |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Expo SDK version | LOW | SDK 52 was current at training cutoff (Aug 2025). SDK 53 may have shipped. Run `npx create-expo-app` to get current. |
| expo-router version | LOW | v3.x with SDK 52. v4 may be current. Version always matches SDK — let `create-expo-app` decide. |
| supabase-js RN setup | HIGH | AsyncStorage adapter + URL polyfill is the established, stable pattern since supabase-js v2. |
| Stripe via Payment Links | HIGH | Correct approach for an app that already uses Stripe Payment Links on web. Zero-backend is a stated constraint. |
| NativeWind v4 | MEDIUM | v4 had some early-adopter rough edges in late 2024 but was stable. Verify docs if issues arise. |
| Reanimated 3 + Moti | HIGH | Stable, well-adopted, correct choice for premium UI animations. |
| Supporting packages | HIGH | expo-haptics, expo-font, safe-area-context are stable Expo primitives — unlikely to have changed. |

---

## Sources

- Training data through August 2025 (no external fetch available during this research session)
- Expo SDK 52 release notes (November 2024) — training data
- expo-router v3 docs — training data
- supabase-js v2 React Native guide — training data
- NativeWind v4 migration guide — training data

**Verification recommended before writing requirements:**
```bash
npx create-expo-app --template && npx expo-doctor
```
This will reveal the actual current SDK and expo-router version in use.
