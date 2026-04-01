# Architecture Patterns: Aike Mobile App

**Domain:** React Native companion app for existing Supabase SaaS
**Researched:** 2026-03-27
**Overall confidence:** HIGH (Expo Router v3+, Supabase RN SDK, React Query v5 — all stable at knowledge cutoff)

---

## 1. Directory Tree

The mobile app lives in a dedicated subdirectory of the monorepo root. This keeps it fully isolated from the web assets while sharing nothing except environment values (Supabase URL/anon key, which are already public).

```
AIKE/
  mobile/                          ← new: entire RN project lives here
    app/
      _layout.tsx                  ← root layout: SessionProvider + QueryClientProvider
      +not-found.tsx
      (auth)/
        _layout.tsx                ← Stack layout, no tab bar
        login.tsx
        signup.tsx
      (tabs)/
        _layout.tsx                ← Tab layout with glassmorphism bar
        pulse.tsx                  ← tab: Dashboard / AI pulse
        inbox.tsx                  ← tab: AI inbox
        pipeline.tsx               ← tab: CRM pipeline
        calendar.tsx               ← tab: Booking calendar
        pay.tsx                    ← tab: Payments
    components/
      owl/
        OwlMascot.tsx              ← dynamic mood-based mascot
        owlAssets.ts               ← require() map keyed by mood string
      ui/
        SkeletonCard.tsx
        GlassCard.tsx
        TabBarBackground.tsx       ← blur + border glassmorphism view
      auth/
        AuthGuard.tsx              ← redirect wrapper
    constants/
      theme.ts                     ← colors, spacing, typography, radii
      config.ts                    ← Supabase URL + anon key (matches web config.js)
    hooks/
      useSession.ts                ← current Supabase session + user
      useProfile.ts                ← public.users row (plan, is_admin)
      useAnalytics.ts              ← track event → /api/track or Supabase direct
    lib/
      supabase.ts                  ← singleton Supabase client
      queryClient.ts               ← React Query QueryClient instance
    assets/
      images/
        owl-default.png            ← copy of logo.png
        owl-annoiato.png           ← copy of logoannoiato.png
        owl-impressionato.png      ← copy of logoimpressionato.png
        owl-sollevato.png          ← copy of logosollevato.png
        owl-spaventato.png         ← copy of logospaventato.png
    app.json
    package.json
    tsconfig.json
    babel.config.js
    metro.config.js
```

**Rationale for `mobile/` subdirectory:** The web project is pure static HTML with no package.json at root level. Introducing a `package.json` at root would conflict with that model and confuse Netlify builds. Keeping the app self-contained inside `mobile/` means zero interference with web deployment.

---

## 2. Auth Flow: Supabase Session in React Native

### 2.1 Storage: SecureStore, not AsyncStorage

Use `expo-secure-store` as the Supabase session storage adapter. Confidence: HIGH.

```
AsyncStorage  →  plaintext in app sandbox  →  NOT acceptable for JWT tokens
SecureStore   →  iOS Keychain / Android Keystore  →  correct for auth tokens
```

The `@supabase/supabase-js` client accepts a custom `storage` adapter. Wrap SecureStore to match the `Storage` interface:

```typescript
// lib/supabase.ts
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';

const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,   // IMPORTANT: must be false in RN
  },
});
```

**Why `detectSessionInUrl: false`:** The web SDK parses `window.location.hash` for session tokens from magic-link redirects. In React Native there is no `window.location` — Expo Router handles the URL via deep link callbacks instead. Setting this to `true` will throw.

### 2.2 Session Persistence Flow

```
App cold start
  └─ supabase.auth.getSession()  →  reads from SecureStore (sync-ish, fast)
       └─ session exists  →  route to (tabs)
       └─ no session     →  route to (auth)/login
```

Subscribe to auth state changes in the root `_layout.tsx` to react to sign-in/sign-out from anywhere:

```typescript
// app/_layout.tsx (abridged)
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (session) router.replace('/(tabs)/pulse');
      else          router.replace('/(auth)/login');
    }
  );
  return () => subscription.unsubscribe();
}, []);
```

### 2.3 Deep Link Handling for Magic Links / Email Confirm

Magic links and email confirm links use a redirect URL. For Expo Go / development the URL scheme is `exp://`. For production builds it is a custom scheme you define in `app.json`.

**app.json scheme:**
```json
{
  "expo": {
    "scheme": "aike",
    "...": "..."
  }
}
```

**Supabase dashboard setting:** Add `aike://` to "Redirect URLs" in Authentication > URL Configuration.

**Expo Router handles the link automatically** when `detectSessionInUrl: false` and you manually call `supabase.auth.exchangeCodeForSession(url)` inside a `useEffect` that listens to `Linking.getInitialURL()` and `Linking.addEventListener`. Expo Router v3+ exposes `useURL()` from `expo-linking` which simplifies this:

```typescript
// app/_layout.tsx (deep link handler addition)
import * as Linking from 'expo-linking';

const url = Linking.useURL();
useEffect(() => {
  if (url) {
    const parsed = Linking.parse(url);
    // Supabase appends #access_token or ?code= depending on flow
    supabase.auth.getSessionFromUrl({ url }).catch(() => {});
  }
}, [url]);
```

Confidence: MEDIUM — `getSessionFromUrl` API shape should be verified against the current `@supabase/supabase-js` RN docs before implementation, as this API has changed between v1 and v2.

---

## 3. Supabase Client Singleton Pattern

The web project uses an IIFE with a module-level `_client` variable behind `window.aikeSupabase.getClient()`. The React Native equivalent is a module-level singleton — ES modules are cached by the bundler (Metro), so the file only executes once.

```typescript
// lib/supabase.ts  ←  THE single source of truth
export const supabase = createClient(...);
// Every other file: import { supabase } from '../lib/supabase'
```

No wrapper function needed. Metro's module cache guarantees one instance.

**Do not** pass the client through React Context or props — import it directly where needed. The only thing that should go through Context is the reactive session state (user object, loading boolean).

```typescript
// hooks/useSession.ts
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, s) => setSession(s)
    );
    return () => subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}
```

---

## 4. Data Fetching Pattern: React Query

**Recommendation: React Query v5 (`@tanstack/react-query`).** Confidence: HIGH.

### Why React Query over SWR or raw useEffect

| Concern | raw useEffect | SWR | React Query v5 |
|---------|--------------|-----|----------------|
| Loading / error states | manual | built-in | built-in |
| Cache invalidation | manual | basic | fine-grained |
| Background refetch | manual | basic | configurable |
| Optimistic updates | manual | awkward | first-class |
| Infinite scroll | manual | plugin | built-in |
| DevTools | none | none | React Query Devtools |
| Bundle size | 0 | ~4 kB | ~14 kB |
| Supabase integration | raw | raw | raw or `@supabase-cache-helpers` |

For Supabase specifically, React Query wraps `supabase.from('table').select()` calls cleanly:

```typescript
// hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('id, email, plan, is_admin')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,   // 5 min — plan data doesn't change often
  });
}
```

### QueryClient setup

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
});
```

Wrap the root layout:
```typescript
// app/_layout.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  );
}
```

---

## 5. OwlMascot Component: Dynamic Asset Resolution

### 5.1 The Constraint

Metro bundler requires `require()` calls to have **static string literals** — it cannot resolve dynamic paths computed at runtime. This means `require('../assets/images/owl-' + mood + '.png')` will fail at build time.

### 5.2 Correct Pattern: Static require() Map

```typescript
// components/owl/owlAssets.ts
export type OwlMood =
  | 'default'
  | 'annoiato'
  | 'impressionato'
  | 'sollevato'
  | 'spaventato';

// Each require() is a static literal — Metro can resolve all at build time
export const OWL_ASSETS: Record<OwlMood, ReturnType<typeof require>> = {
  default:       require('../../assets/images/owl-default.png'),
  annoiato:      require('../../assets/images/owl-annoiato.png'),
  impressionato: require('../../assets/images/owl-impressionato.png'),
  sollevato:     require('../../assets/images/owl-sollevato.png'),
  spaventato:    require('../../assets/images/owl-spaventato.png'),
};
```

```typescript
// components/owl/OwlMascot.tsx
import React from 'react';
import { Image, StyleSheet, type ImageStyle } from 'react-native';
import { OWL_ASSETS, type OwlMood } from './owlAssets';

interface OwlMascotProps {
  mood?: OwlMood;
  size?: number;
  style?: ImageStyle;
}

export function OwlMascot({ mood = 'default', size = 80, style }: OwlMascotProps) {
  return (
    <Image
      source={OWL_ASSETS[mood]}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel={`Aike owl — ${mood}`}
    />
  );
}
```

### 5.3 Asset Files

Copy (do not reference cross-boundary from web `assets/`) the owl PNGs into `mobile/assets/images/` with semantic names. The web filenames (`logoannoiato.png` etc.) are opaque — rename to `owl-annoiato.png` for clarity. The copy is intentional: Metro needs the files inside the `mobile/` project root.

| Web filename | Mobile filename | Mood key |
|---|---|---|
| `logo.png` | `owl-default.png` | `default` |
| `logoannoiato.png` | `owl-annoiato.png` | `annoiato` |
| `logoimpressionato.png` | `owl-impressionato.png` | `impressionato` |
| `logosollevato.png` | `owl-sollevato.png` | `sollevato` |
| `logospaventato.png` | `owl-spaventato.png` | `spaventato` |

### 5.4 Why not expo-asset

`expo-asset` is useful for downloading remote assets or for complex asset pipeline work. For local PNGs that ship with the app bundle, the `require()` map is simpler, has no async loading step, and is the standard documented pattern. Confidence: HIGH.

---

## 6. Theme / Design Tokens: constants/theme.ts

Translate the web CSS custom properties directly into a typed TypeScript object. This creates a single source of truth for the mobile app that mirrors the web design system.

```typescript
// constants/theme.ts

export const Colors = {
  // Core palette — matches web :root CSS variables exactly
  bg:           '#111111',
  surface:      '#1a1a1a',
  surfaceAlt:   '#222222',
  border:       'rgba(255, 255, 255, 0.08)',
  primary:      '#a855f7',
  primaryDim:   'rgba(168, 85, 247, 0.12)',
  text:         '#ffffff',
  textMuted:    '#9ca3af',
  white:        '#ffffff',

  // Glassmorphism tab bar
  tabBarBg:     'rgba(17, 17, 17, 0.85)',
  tabBarBorder: 'rgba(168, 85, 247, 0.15)',

  // Status / semantic
  success:      '#10b981',
  warning:      '#f59e0b',
  error:        '#ef4444',
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   40,
  '2xl': 64,
  '3xl': 96,
} as const;

export const Radii = {
  sm:   8,
  md:   16,
  lg:   24,
  full: 9999,
} as const;

export const Typography = {
  fontSans:    'Inter_400Regular',
  fontSansMed: 'Inter_500Medium',
  fontSansBold: 'Inter_700Bold',

  sizeXs:  11,
  sizeSm:  13,
  sizeMd:  15,
  sizeLg:  17,
  sizeXl:  20,
  size2xl: 24,
  size3xl: 30,
  size4xl: 36,

  lineHeightBody:    1.6,
  lineHeightHeading: 1.2,
} as const;

export const Shadows = {
  glow: {
    shadowColor:   '#a855f7',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius:  20,
    elevation:     8,
  },
  card: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius:  16,
    elevation:     4,
  },
} as const;

// Transition durations in ms (use with Animated or Reanimated)
export const Transitions = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;
```

**Font loading:** Use `expo-google-fonts` with `@expo-google-fonts/inter`. Load in root `_layout.tsx` with `useFonts()` and show a `SplashScreen` until fonts are ready.

---

## 7. Bottom Tab Bar: Glassmorphism in Expo Router

### 7.1 Pattern

Expo Router v3+ uses `expo-router/tabs` which wraps `@react-navigation/bottom-tabs`. The tab bar background can be customised with `tabBarBackground` prop on the `Tabs` component.

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { TabBarBackground } from '../../components/ui/TabBarBackground';
import { Colors } from '../../constants/theme';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          position:        'absolute',  // REQUIRED for blur to show content below
          backgroundColor: 'transparent',
          borderTopColor:  Colors.tabBarBorder,
          borderTopWidth:  1,
          elevation:       0,           // Android: remove default shadow
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={{
              position:         'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor:  Colors.tabBarBg,
            }}
          />
        ),
        headerShown: false,
      }}
    >
      <Tabs.Screen name="pulse"    options={{ title: 'Pulse' }} />
      <Tabs.Screen name="inbox"    options={{ title: 'Inbox' }} />
      <Tabs.Screen name="pipeline" options={{ title: 'Pipeline' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="pay"      options={{ title: 'Pay' }} />
    </Tabs>
  );
}
```

**Key detail — `position: 'absolute'`:** Without this, the `BlurView` sits on top of a solid background. Making the tab bar `position: 'absolute'` lets the scroll content visually flow behind the bar so the blur effect is visible.

**Content padding:** Screens inside `(tabs)/` must add `paddingBottom` equal to the tab bar height (~83pt on iPhone with home indicator) so content is not obscured. Use `useBottomTabBarHeight()` from `@react-navigation/bottom-tabs` or the `useSafeAreaInsets()` bottom value plus 49.

```typescript
// components/ui/TabBarBackground.tsx  (reusable wrapper)
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

export function TabBarBackground() {
  return (
    <BlurView
      intensity={80}
      tint="dark"
      style={[StyleSheet.absoluteFill, { backgroundColor: Colors.tabBarBg }]}
    />
  );
}
```

### 7.2 Required Package

```bash
npx expo install expo-blur
```

`expo-blur` is an Expo SDK first-party package. Confidence: HIGH.

---

## 8. Integration Points with Existing Backend

### 8.1 What the Mobile App Reuses Unchanged

| Asset | Location | Mobile uses how |
|-------|----------|-----------------|
| Supabase project | `iczkxlligfelqmcddbdc.supabase.co` | Same URL + anon key in `constants/config.ts` |
| `public.users` table | Supabase | `useProfile` hook queries `id, email, plan, is_admin` |
| `public.analytics` table | Supabase | `useAnalytics` inserts rows directly |
| Supabase Auth | `auth.users` | Same email/password signIn via `supabase.auth.signInWithPassword` |
| Stripe Payment Links | `buy.stripe.com/...` | Open in system browser via `Linking.openURL()` — no Stripe SDK needed |
| `/api/track` Netlify edge function | `https://aike.netlify.app/api/track` | HTTP POST from `useAnalytics` hook |

### 8.2 What Is New / Mobile-Only

| Component | File | Notes |
|-----------|------|-------|
| Supabase singleton | `lib/supabase.ts` | SecureStore adapter, RN-specific config |
| Session hook | `hooks/useSession.ts` | Reactive session state |
| Profile hook | `hooks/useProfile.ts` | React Query wrapper |
| Theme constants | `constants/theme.ts` | Mirrors web CSS tokens |
| OwlMascot | `components/owl/` | RN Image + mood map |
| Tab bar | `app/(tabs)/_layout.tsx` | Glassmorphism, expo-blur |
| Auth screens | `app/(auth)/` | Login + signup, no web equivalent |
| Skeleton screens | `components/ui/SkeletonCard.tsx` | Loading states |

### 8.3 constants/config.ts (mirrors web config.js)

```typescript
// constants/config.ts
// These are public/safe values — same as web config.js
export const SUPABASE_URL     = 'https://iczkxlligfelqmcddbdc.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // full key

export const STRIPE_BASIC_LINK = 'https://buy.stripe.com/7sYeV57bvcHedjU4R68og02';
export const STRIPE_PRO_LINK   = 'https://buy.stripe.com/9B64granHePm4No4R68og01';
```

No `.env` file needed for anon key in Expo — it is already public (same as the web). However, using `app.config.js` with `process.env` is the Expo convention for keeping these values outside source code. Either approach is acceptable here.

---

## 9. Build Order: Fastest Path to Working Demo

Build in dependency order — each layer unlocks the next.

### Layer 1: Foundation (day 1)
1. `npx create-expo-app mobile --template blank-typescript` inside the AIKE repo
2. Install core deps: `expo-router`, `@supabase/supabase-js`, `expo-secure-store`, `@tanstack/react-query`, `expo-blur`, `expo-font`, `@expo-google-fonts/inter`
3. `constants/theme.ts` — design tokens (no dependencies)
4. `constants/config.ts` — Supabase credentials (no dependencies)
5. `lib/supabase.ts` — singleton client (depends on config + SecureStore)

**Gate:** `supabase.auth.getSession()` returns without error in Expo Go.

### Layer 2: Auth (day 1-2)
6. `hooks/useSession.ts` — reactive session
7. `app/(auth)/_layout.tsx` + `login.tsx` + `signup.tsx` — bare screens (no styling yet)
8. `app/_layout.tsx` — root with auth redirect logic + QueryClientProvider

**Gate:** Sign in with a real account → session persists across app kill/relaunch.

### Layer 3: Tab Shell (day 2)
9. `app/(tabs)/_layout.tsx` — glassmorphism tab bar, 5 tabs
10. `components/ui/TabBarBackground.tsx`
11. Each `app/(tabs)/*.tsx` — placeholder `<View><Text>Tab name</Text></View>`

**Gate:** All 5 tabs navigate correctly, tab bar renders with blur effect.

### Layer 4: OwlMascot + Theme Components (day 2-3)
12. Copy owl PNGs into `mobile/assets/images/`
13. `components/owl/owlAssets.ts` + `components/owl/OwlMascot.tsx`
14. `components/ui/SkeletonCard.tsx` — reusable shimmer skeleton
15. `components/ui/GlassCard.tsx` — dark surface card with border

**Gate:** `<OwlMascot mood="sollevato" />` renders correctly in Pulse tab.

### Layer 5: Data Hooks (day 3)
16. `lib/queryClient.ts`
17. `hooks/useProfile.ts` — queries `public.users`
18. `hooks/useAnalytics.ts` — posts to `/api/track`

**Gate:** Pulse tab shows real user plan from Supabase.

### Layer 6: Screen Content (day 3-5)
19. Build each of the 5 tab screens with real layouts + skeleton states
20. Connect data hooks to UI
21. Polish auth screens with Aike design system

**Gate:** Full demo flow: cold start → login → Pulse tab with real data → all 5 tabs navigable.

---

## 10. Anti-Patterns to Avoid

### Anti-Pattern 1: Multiple Supabase Client Instances
**What goes wrong:** Calling `createClient()` in multiple files creates separate auth state machines that desync.
**Instead:** Always import from `lib/supabase.ts` — one file, one instance.

### Anti-Pattern 2: AsyncStorage for Auth Tokens
**What goes wrong:** JWT tokens stored in plaintext are accessible to any process with app sandbox access.
**Instead:** SecureStore adapter as specified in Section 2.

### Anti-Pattern 3: `detectSessionInUrl: true` in React Native
**What goes wrong:** Crashes at runtime — no `window.location` in RN.
**Instead:** Always `detectSessionInUrl: false` + manual deep link handling.

### Anti-Pattern 4: Dynamic require() for Images
**What goes wrong:** Metro bundler cannot resolve `require('../assets/' + variable + '.png')` at build time. The image will be missing in production builds.
**Instead:** Static require() map as specified in Section 5.

### Anti-Pattern 5: Web `config.js` Shared Directly
**What goes wrong:** Web `config.js` uses `window.AIKE_CONFIG = {}` which is a browser global. Metro will throw "window is not defined".
**Instead:** Duplicate the values into `mobile/constants/config.ts` as plain TypeScript exports.

### Anti-Pattern 6: Tab Bar Without `position: 'absolute'`
**What goes wrong:** BlurView renders but shows solid background because there is no content behind the tab bar to blur.
**Instead:** `position: 'absolute'` on `tabBarStyle` + `paddingBottom` on all tab screen content.

---

## Sources

- Expo Router v3 documentation (training knowledge, HIGH confidence for file structure and navigation patterns)
- `@supabase/supabase-js` v2 React Native guide (training knowledge, HIGH confidence for `detectSessionInUrl`, `autoRefreshToken`)
- Expo SecureStore documentation (training knowledge, HIGH confidence)
- `@tanstack/react-query` v5 documentation (training knowledge, HIGH confidence)
- `expo-blur` BlurView documentation (training knowledge, HIGH confidence)
- Metro bundler static require() constraint (training knowledge, HIGH confidence — fundamental bundler behavior)
- Existing web codebase: `assets/js/config.js`, `assets/js/auth.js`, `assets/css/styles.css` (HIGH confidence — direct source inspection)

**Confidence flags requiring verification before implementation:**
- `supabase.auth.getSessionFromUrl()` API shape in current `@supabase/supabase-js` RN — verify against current docs (MEDIUM confidence, API changed between v1→v2)
- Expo Router deep link + Supabase magic link integration — verify the exact listener pattern with current Expo Router v3/v4 docs
