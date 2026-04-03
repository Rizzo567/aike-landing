# Auth System Redesign — Design Spec
**Date:** 2026-04-03
**Status:** Approved by user

---

## Scope

Rebuild `pages/login.html`, `pages/signup.html`, fix `pages/admin.html`, and improve `assets/js/auth.js`.

Stack: pure HTML/CSS/JS — no React, no npm, no build tool (per CLAUDE.md).

Out of scope: `aike-owl-jarvis` (local tool, no auth needed), AIKE-APP (deleted).

---

## Visual Design

**Style:** Dark Premium — background `#09090f`, accents indigo/white, no gradients on buttons.

**Layout:** Split — left panel (45%) + right panel (55%) on desktop. Mobile: right panel only (left hidden).

### Left Panel

| Element | Detail |
|---------|--------|
| Background | Shooting stars canvas — exact same code as `solutions.html` `#stars-canvas` |
| Brand | `assets/images/logo.png` (owl, height 30px) + `"aike"` text in `font-family: "Suisse Int'l", "Inter"`, `font-weight: 700`, `font-size: 1.6rem`, `letter-spacing: -0.02em` — identical to `.header__brand` |
| CTA text | Two-line, `font-size: clamp(1.6rem, 2.5vw, 2rem)`, `font-weight: 800`. Line 1 uses `sol-line-1` entrance animation (translateY+blur+scale). Line 2 uses `.hero__title-highlight` style with `sol-line-2` clip-path reveal |
| CTA copy | "Built for teams that move fast and" / "need results" |
| Globe | `cobe` library via ESM import (`https://cdn.jsdelivr.net/npm/cobe/+esm`). Config: `dark:1`, `baseColor:[0.18,0.12,0.38]`, `markerColor:[0.55,0.25,0.95]`, `glowColor:[0.15,0.08,0.3]`, auto-rotate `phi += 0.004`. Canvas 200×200px, `border-radius: 50%`, violet radial glow behind it |
| Footer | `© 2025 AIKE` in `color: #2d2d40` |

### Right Panel

| Element | Detail |
|---------|--------|
| Heading | "Bentornato" (login) / "Crea il tuo account" (signup) |
| Subheading | "Accedi al tuo account AIKE." / "Inizia gratuitamente." |
| Social buttons | Two buttons side-by-side: Google (full-color SVG logo inline) + GitHub (white SVG logo inline). Background `#111118`, border `#1e1e30`, border-radius `8px` |
| Divider | `"oppure continua con email"` in `#2a2a3e` between two `1px` lines `#1a1a2a` |
| Email field | Label `EMAIL` uppercase, input `background: #0e0e1a`, border `#1e1e30`, border-radius `8px` |
| Password field | Same style + show/hide toggle (eye icon) |
| Confirm password | Signup only |
| CTA button | Full width, `background: #fff`, `color: #09090f`, `border-radius: 8px`, `font-weight: 600` |
| Footer link | Login: "Non hai un account? **Registrati**" / Signup: "Hai già un account? **Accedi**" |
| Error state | Red text below the relevant field, `font-size: 12px`, `color: #ef4444` |
| Loading state | Button text replaced with spinner, button disabled |

---

## Auth Flow

### Sign Up
1. Client-side validation: email format, password ≥ 8 chars, passwords match
2. `supabase.auth.signUp({ email, password })`
3. Success → show "Controlla la tua email per confermare l'account"
4. Error → show parsed error below field

### Login
1. `supabase.auth.signInWithPassword({ email, password })`
2. Success → `window.location.href = '../index.html'`
3. Error → show parsed error message

### Social Login (Google + GitHub)
```javascript
supabase.auth.signInWithOAuth({
  provider: 'google', // or 'github'
  options: { redirectTo: window.location.origin + '/pages/login.html' }
})
```
Both buttons use this pattern. No extra libraries needed.

### Logout
`supabase.auth.signOut()` → redirect to `index.html`. Already handled in `auth.js`.

### Session persistence
Supabase SDK v2 handles this automatically via localStorage. No changes needed.

---

## Admin Protection

**Problem with current approach:** entire admin UI is in DOM, hidden with CSS `display:none`. Trivially bypassed.

**New approach:** Admin page starts with only a loading spinner in DOM. After `supabase.auth.getUser()` (server-verified) + `users` table `is_admin` check, the admin UI is injected dynamically via JS. Non-admins never see the HTML.

```javascript
// admin.html init
async function initAdmin() {
  showGate(); // spinner only
  const { data: { user } } = await supabase.auth.getUser(); // server-round-trip verify
  if (!user) { window.location.href = 'login.html'; return; }

  const { data: profile } = await supabase
    .from('users').select('is_admin').eq('id', user.id).single();

  if (!profile?.is_admin) { window.location.href = '../index.html'; return; }

  renderAdminUI(user, profile); // only now inject the UI
}
```

This means even DevTools CSS inspection won't reveal admin content — it doesn't exist in DOM until verified.

---

## Profile Cache Fix

Current `_profileCache` never invalidates. Fix: add a 5-minute TTL.

```javascript
var _profileCache = null;
var _profileCacheTime = 0;
var CACHE_TTL = 5 * 60 * 1000; // 5 min

window.aikeAuth.getProfile = async function(userId) {
  if (_profileCache && (Date.now() - _profileCacheTime < CACHE_TTL)) {
    return _profileCache;
  }
  // fetch fresh...
  _profileCacheTime = Date.now();
};
```

---

## Error Messages

Parsed via a `parseAuthError(code)` function (same pattern as the app):

| Supabase code | User message |
|---------------|-------------|
| `invalid_credentials` | "Email o password non corretti." |
| `email_not_confirmed` | "Conferma la tua email prima di accedere." |
| `over_email_send_rate_limit` | "Troppi tentativi. Riprova tra qualche minuto." |
| `user_already_exists` | "Un account con questa email esiste già." |
| `weak_password` | "Password troppo debole. Usa almeno 8 caratteri." |
| default | "Errore. Riprova." |

---

## Files Modified

| File | Action |
|------|--------|
| `pages/login.html` | Rebuild from scratch |
| `pages/signup.html` | Rebuild from scratch |
| `pages/admin.html` | Replace admin gate logic (keep dashboard content) |
| `assets/js/auth.js` | Fix profile cache TTL, no other changes |

---

## Google + GitHub Setup (manual steps for user)

After implementation, the user must:

1. **Enable providers in Supabase Dashboard** → Authentication → Providers → enable Google and GitHub
2. **Google:** create OAuth app at console.cloud.google.com → copy Client ID + Secret into Supabase
3. **GitHub:** create OAuth app at github.com/settings/developers → copy Client ID + Secret into Supabase
4. **Set redirect URL** in both providers: `https://<your-site>.pages.dev/pages/login.html`

These steps will be documented in detail in the implementation output.

---

## Responsive

- Desktop (≥768px): split layout, left 45% right 55%
- Mobile (<768px): left panel hidden, right panel full width, centered card with `max-width: 400px`

---

## What is NOT changed

- Supabase client config (`assets/js/config.js`) — no changes
- Cloudflare Functions — no changes (JWT auth already correct)
- Credit system — no changes
- All other pages — no changes
