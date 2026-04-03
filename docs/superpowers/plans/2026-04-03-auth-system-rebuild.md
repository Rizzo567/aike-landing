# Auth System Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild login.html and signup.html with Dark Premium split layout (stars + globe left panel, form right panel), add Google/GitHub OAuth, and fix admin.html gate to never expose admin DOM before verification.

**Architecture:** Pure vanilla HTML/CSS/JS on Cloudflare Pages. No React, no npm, no build step. Supabase JS SDK v2 loaded via CDN. Cobe globe loaded via ESM import. All auth state managed by Supabase SDK (localStorage persistence automatic). Admin protection upgraded: `#admin-app` HTML removed from initial DOM, injected by JS only after server-verified admin check.

**Tech Stack:** HTML5 · CSS3 · Vanilla JS (ES2015+) · Supabase JS v2 (CDN UMD) · Cobe 0.6.3 (ESM CDN) · D3 not used here

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `assets/js/auth.js` | Modify | Add cache TTL, `signInWithOAuth()`, `parseAuthError()` |
| `pages/login.html` | Rebuild | Full Dark Premium split layout — login form |
| `pages/signup.html` | Rebuild | Full Dark Premium split layout — signup form |
| `pages/admin.html` | Modify | Remove `#admin-app` from HTML, inject via JS after gate |

---

## Task 1: Upgrade auth.js — cache TTL, OAuth, error parser

**Files:**
- Modify: `assets/js/auth.js`

- [ ] **Step 1.1 — Add profile cache TTL**

Replace the `_profileCache = null` declaration and `getProfile` method. Find this block in `auth.js` (lines 12–13, 59–69):

```javascript
// BEFORE (lines 12-13):
var _client = null;
var _profileCache = null;

// AFTER:
var _client = null;
var _profileCache = null;
var _profileCacheTime = 0;
var PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

Replace `getProfile` method inside `window.aikeAuth` (lines 59–69):

```javascript
getProfile: async function (userId) {
  var now = Date.now();
  if (_profileCache && (now - _profileCacheTime < PROFILE_CACHE_TTL)) {
    return _profileCache;
  }
  var r = await getClient()
    .from('users')
    .select('is_admin, plan, email')
    .eq('id', userId)
    .maybeSingle();
  if (r.error) console.warn('[aikeAuth] getProfile:', r.error.message);
  _profileCache = r.data || null;
  _profileCacheTime = Date.now();
  return _profileCache;
},
```

- [ ] **Step 1.2 — Add `signInWithOAuth` and `parseAuthError`**

Add these two methods to `window.aikeAuth` (after `getProfile`, before the closing `};`):

```javascript
signInWithOAuth: async function (provider) {
  var redirectTo = window.location.origin + '/pages/login.html';
  var r = await getClient().auth.signInWithOAuth({
    provider: provider,
    options: { redirectTo: redirectTo }
  });
  return r.error ? { error: r.error.message } : { error: null };
},

parseAuthError: function (err) {
  if (!err) return 'Errore sconosciuto. Riprova.';
  var code = err.code || '';
  var msg  = (err.message || '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login'))
    return 'Email o password non corretti.';
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed'))
    return 'Conferma la tua email prima di accedere.';
  if (code === 'over_email_send_rate_limit' || msg.includes('rate limit'))
    return 'Troppi tentativi. Riprova tra qualche minuto.';
  if (code === 'user_already_exists' || msg.includes('already registered'))
    return 'Un account con questa email esiste già.';
  if (code === 'weak_password' || msg.includes('weak password'))
    return 'Password troppo debole. Usa almeno 8 caratteri.';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Errore di rete. Controlla la connessione.';
  return 'Errore. Riprova.';
},
```

- [ ] **Step 1.3 — Also clear cache on signOut (already done in signOut, verify)**

Confirm line 42 of `auth.js` reads `_profileCache = null;` — if so, add `_profileCacheTime = 0;` on the next line:

```javascript
signOut: async function () {
  _profileCache = null;
  _profileCacheTime = 0;          // ← add this line
  await getClient().auth.signOut();
  updateHeader(null, null);
},
```

- [ ] **Step 1.4 — Manual verification**

Open any page of the site in browser. Open DevTools Console. Run:
```javascript
typeof window.aikeAuth.signInWithOAuth   // → "function"
typeof window.aikeAuth.parseAuthError    // → "function"
window.aikeAuth.parseAuthError({ code: 'invalid_credentials' })
// → "Email o password non corretti."
```

- [ ] **Step 1.5 — Commit**

```bash
git add assets/js/auth.js
git commit -m "feat(auth): add cache TTL, signInWithOAuth, parseAuthError"
```

---

## Task 2: Rebuild pages/login.html

**Files:**
- Rebuild: `pages/login.html`

The entire file is replaced. The left panel replicates the shooting stars canvas from `pages/solutions.html` exactly.

- [ ] **Step 2.1 — Write the complete login.html**

Replace the entire content of `pages/login.html` with:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accedi | aike</title>
  <meta name="description" content="Accedi al tuo account AIKE." />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="../assets/css/styles.css?v=5" />

  <style>
    /* ── Reset for auth page ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Suisse Int'l", "Inter", system-ui, sans-serif;
      background: #09090f;
      color: #fff;
      min-height: 100dvh;
      display: flex;
      align-items: stretch;
    }

    /* ── Split layout ── */
    .auth-split {
      display: grid;
      grid-template-columns: 45% 55%;
      min-height: 100dvh;
      width: 100%;
    }

    /* ══ LEFT PANEL ════════════════════════════════════════ */
    .auth-left {
      position: relative;
      overflow: hidden;
      background: #07070e;
      border-right: 1px solid #14141f;
      display: flex;
      flex-direction: column;
      padding: 44px 48px;
      justify-content: space-between;
    }

    #stars-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .left-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
    }

    /* Brand — identical to .header__brand */
    .auth-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .auth-brand-logo {
      height: 32px;
      width: auto;
    }
    .auth-brand-name {
      font-family: "Suisse Int'l", "Inter", system-ui, sans-serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.02em;
      line-height: 1;
    }

    /* CTA block */
    .auth-cta {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 40px 0 32px;
    }
    .auth-cta-text {
      font-size: clamp(1.5rem, 2.2vw, 2rem);
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.03em;
      color: #fff;
      perspective: 800px;
      transform-style: preserve-3d;
    }

    /* sol-line-1 animation (same as solutions.html) */
    .sol-line-1 {
      display: inline-block;
      opacity: 0;
      transform: translateY(60px) scale(0.85) rotateX(-20deg);
      filter: blur(20px);
      transition: opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 1.4s cubic-bezier(0.16, 1, 0.3, 1),
                  filter 1.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .sol-line-1.animate { opacity: 1; transform: translateY(0) scale(1) rotateX(0); filter: blur(0); }

    /* sol-line-2 highlight reveal (same as solutions.html) */
    .sol-line-2 {
      display: inline-block;
      background-color: #3b1d64;
      color: #d9abff;
      padding: 4px 14px;
      border-radius: 6px;
      margin-top: 10px;
      transform: rotate(-2.5deg) translateY(-2px);
      box-shadow: 0 8px 24px rgba(168, 85, 247, 0.15);
      clip-path: inset(0 100% 0 0);
      transition: clip-path 1.2s cubic-bezier(0.77, 0, 0.175, 1);
    }
    .sol-line-2.animate { clip-path: inset(0 0% 0 0); }

    /* Globe */
    .auth-globe-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      height: 200px;
    }
    .auth-globe-glow {
      position: absolute;
      width: 240px;
      height: 240px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.18), transparent 65%);
      border-radius: 50%;
      pointer-events: none;
    }
    #auth-globe { display: block; border-radius: 50%; }

    /* Left footer */
    .auth-left-footer {
      color: #252535;
      font-size: 11px;
      position: relative;
      z-index: 2;
    }

    /* ══ RIGHT PANEL ═══════════════════════════════════════ */
    .auth-right {
      background: #09090f;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 40px;
    }

    .auth-form-wrap {
      width: 100%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .auth-heading { font-size: 24px; font-weight: 600; letter-spacing: -0.03em; color: #f9f9fb; }
    .auth-sub { font-size: 13px; color: #4b5563; margin-top: 4px; }

    /* Social buttons */
    .auth-social-row { display: flex; gap: 10px; }
    .auth-btn-social {
      flex: 1;
      background: #111118;
      border: 1px solid #1e1e30;
      border-radius: 8px;
      padding: 11px 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #d1d5db;
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      text-decoration: none;
    }
    .auth-btn-social:hover { border-color: #2e2e45; background: #13131e; }
    .auth-btn-social:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Divider */
    .auth-divider { display: flex; align-items: center; gap: 12px; }
    .auth-divider-line { flex: 1; height: 1px; background: #1a1a2a; }
    .auth-divider-text { color: #2a2a3e; font-size: 11px; white-space: nowrap; }

    /* Fields */
    .auth-fields { display: flex; flex-direction: column; gap: 14px; }
    .auth-field { display: flex; flex-direction: column; gap: 6px; }
    .auth-label {
      font-size: 11px;
      font-weight: 500;
      color: #4b5563;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .auth-input-wrap { position: relative; }
    .auth-input {
      width: 100%;
      background: #0e0e1a;
      border: 1px solid #1e1e30;
      border-radius: 8px;
      padding: 10px 14px;
      color: #f9f9fb;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
    }
    .auth-input:focus { border-color: #4f4f8a; }
    .auth-input::placeholder { color: #252535; }
    .auth-input.has-toggle { padding-right: 42px; }

    /* Password toggle */
    .auth-pw-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: #4b5563;
      padding: 4px;
      display: flex;
      align-items: center;
    }
    .auth-pw-toggle:hover { color: #9ca3af; }

    /* Field error */
    .auth-field-error {
      font-size: 12px;
      color: #ef4444;
      min-height: 16px;
      display: none;
    }
    .auth-field-error.visible { display: block; }

    /* Submit */
    .auth-btn-submit {
      width: 100%;
      background: #fff;
      color: #09090f;
      border: none;
      border-radius: 8px;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      letter-spacing: -0.01em;
      cursor: pointer;
      transition: opacity 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .auth-btn-submit:hover:not(:disabled) { opacity: 0.9; }
    .auth-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Spinner */
    .auth-spinner {
      width: 15px;
      height: 15px;
      border: 2px solid rgba(0,0,0,0.2);
      border-top-color: #09090f;
      border-radius: 50%;
      animation: auth-spin 0.7s linear infinite;
      display: none;
    }
    @keyframes auth-spin { to { transform: rotate(360deg); } }

    /* Footer link */
    .auth-footer-link { font-size: 12px; color: #4b5563; text-align: center; }
    .auth-footer-link a { color: #8b8ba0; text-decoration: underline; text-underline-offset: 2px; }
    .auth-footer-link a:hover { color: #d1d5db; }

    /* Global error banner */
    .auth-error-banner {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      color: #f87171;
      display: none;
    }
    .auth-error-banner.visible { display: block; }

    /* Success message */
    .auth-success {
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.25);
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 13px;
      color: #4ade80;
      line-height: 1.6;
      display: none;
    }
    .auth-success.visible { display: block; }

    /* ── Mobile: hide left panel ── */
    @media (max-width: 768px) {
      .auth-split { grid-template-columns: 1fr; }
      .auth-left { display: none; }
      .auth-right { padding: 32px 24px; align-items: flex-start; padding-top: 80px; }
    }
  </style>
</head>
<body>

<div class="auth-split">

  <!-- ══ LEFT PANEL ════════════════════════════════════════════ -->
  <div class="auth-left">
    <canvas id="stars-canvas"></canvas>
    <div class="left-content">

      <!-- Brand -->
      <a href="../index.html" class="auth-brand">
        <img class="auth-brand-logo" src="../assets/images/logo.png" alt="Aike Logo">
        <span class="auth-brand-name">aike</span>
      </a>

      <!-- CTA text -->
      <div class="auth-cta">
        <div class="auth-cta-text">
          <span class="sol-line-1">Built for teams that<br>move fast and</span><br>
          <span class="sol-line-2">need results</span>
        </div>
      </div>

      <!-- Globe -->
      <div class="auth-globe-wrap">
        <div class="auth-globe-glow"></div>
        <canvas id="auth-globe" width="180" height="180"></canvas>
      </div>

      <div class="auth-left-footer">© 2025 AIKE</div>
    </div>
  </div>

  <!-- ══ RIGHT PANEL ═══════════════════════════════════════════ -->
  <div class="auth-right">
    <div class="auth-form-wrap">

      <div>
        <div class="auth-heading">Bentornato</div>
        <div class="auth-sub">Accedi al tuo account AIKE.</div>
      </div>

      <!-- Social auth -->
      <div class="auth-social-row">
        <button class="auth-btn-social" id="btn-google" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        <button class="auth-btn-social" id="btn-github" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#d1d5db" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </button>
      </div>

      <div class="auth-divider">
        <div class="auth-divider-line"></div>
        <div class="auth-divider-text">oppure continua con email</div>
        <div class="auth-divider-line"></div>
      </div>

      <!-- Error banner -->
      <div class="auth-error-banner" id="auth-error-banner" role="alert"></div>

      <!-- Form -->
      <form class="auth-fields" id="login-form" novalidate>
        <div class="auth-field">
          <label class="auth-label" for="auth-email">Email</label>
          <div class="auth-input-wrap">
            <input class="auth-input" type="email" id="auth-email" name="email"
              autocomplete="email" placeholder="mario@esempio.it" required>
          </div>
          <div class="auth-field-error" id="err-email"></div>
        </div>

        <div class="auth-field">
          <label class="auth-label" for="auth-password">Password</label>
          <div class="auth-input-wrap">
            <input class="auth-input has-toggle" type="password" id="auth-password"
              name="password" autocomplete="current-password" placeholder="••••••••" required>
            <button type="button" class="auth-pw-toggle" id="pw-toggle" aria-label="Mostra/nascondi password">
              <svg id="pw-eye" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg id="pw-eye-off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
          <div class="auth-field-error" id="err-password"></div>
        </div>

        <button class="auth-btn-submit" type="submit" id="submit-btn">
          <span class="auth-spinner" id="submit-spinner"></span>
          <span id="submit-text">Accedi</span>
        </button>
      </form>

      <div class="auth-footer-link">
        Non hai un account? <a href="signup.html">Registrati</a>
      </div>

    </div>
  </div>

</div>

<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script src="../assets/js/config.js"></script>
<script src="../assets/js/auth.js"></script>

<!-- Stars canvas (identical to solutions.html) -->
<script>
(function () {
  var canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var stars = [];
  var NUM_STARS = 160;
  function heroHeight() { return canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight; }
  function resizeCanvas() { canvas.width = canvas.offsetWidth; canvas.height = heroHeight(); }
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function createStar(forceTop) {
    var angle = rand(35, 45) * Math.PI / 180;
    var speed = rand(0.4, 1.2), length = rand(20, 60), opacity = rand(0.3, 0.8), width = rand(0.5, 1.5);
    var vx = -Math.cos(angle) * speed, vy = Math.sin(angle) * speed, x, y;
    if (forceTop) {
      if (Math.random() < 0.6) { x = rand(0, canvas.width); y = rand(-length, 0); }
      else { x = rand(canvas.width * 0.5, canvas.width + length); y = rand(-canvas.height * 0.1, canvas.height * 0.5); }
    } else {
      if (Math.random() < 0.5) { x = rand(0, canvas.width + canvas.height * Math.tan(angle)); y = -length; }
      else { x = canvas.width + rand(0, length); y = rand(-length, canvas.height * 0.3); }
    }
    return { x: x, y: y, vx: vx, vy: vy, length: length, opacity: opacity, width: width, angle: angle };
  }
  function initStars() { stars = []; for (var i = 0; i < NUM_STARS; i++) stars.push(createStar(true)); }
  function isOffscreen(s) { return s.x < -s.length * 2 || s.y > canvas.height + s.length; }
  function drawStar(s) {
    var nx = s.vx / Math.hypot(s.vx, s.vy), ny = s.vy / Math.hypot(s.vx, s.vy);
    var headX = s.x, headY = s.y, tX = s.x - nx * s.length, tY = s.y - ny * s.length;
    var grad = ctx.createLinearGradient(tX, tY, headX, headY);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(220,230,255,' + s.opacity + ')');
    ctx.beginPath(); ctx.moveTo(tX, tY); ctx.lineTo(headX, headY);
    ctx.strokeStyle = grad; ctx.lineWidth = s.width; ctx.lineCap = 'round'; ctx.stroke();
  }
  function animate() {
    ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < stars.length; i++) {
      stars[i].x += stars[i].vx; stars[i].y += stars[i].vy;
      if (isOffscreen(stars[i])) stars[i] = createStar(false); else drawStar(stars[i]);
    }
    requestAnimationFrame(animate);
  }
  resizeCanvas(); initStars(); animate();
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { resizeCanvas(); initStars(); }, 150); });
})();
</script>

<!-- Text entrance animation -->
<script>
(function () {
  function init() {
    setTimeout(function () { var el = document.querySelector('.sol-line-1'); if (el) el.classList.add('animate'); }, 400);
    setTimeout(function () { var el = document.querySelector('.sol-line-2'); if (el) el.classList.add('animate'); }, 1000);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
</script>

<!-- Cobe globe (ESM) -->
<script type="module">
import createGlobe from 'https://cdn.jsdelivr.net/npm/cobe@0.6.3/+esm';
var canvas = document.getElementById('auth-globe');
if (canvas) {
  var phi = 0;
  createGlobe(canvas, {
    devicePixelRatio: 2, width: 360, height: 360,
    phi: 0, theta: 0.25, dark: 1, diffuse: 1.2,
    mapSamples: 10000, mapBrightness: 6,
    baseColor: [0.18, 0.12, 0.38],
    markerColor: [0.55, 0.25, 0.95],
    glowColor: [0.15, 0.08, 0.3],
    markers: [
      { location: [41.9, 12.5], size: 0.05 },
      { location: [48.8, 2.3],  size: 0.04 },
      { location: [40.7, -74],  size: 0.06 },
      { location: [35.6, 139.7],size: 0.04 }
    ],
    onRender: function (state) { state.phi = phi; phi += 0.004; }
  });
}
</script>

<!-- Login form logic -->
<script>
(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────────
  function showError(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('visible', !!msg);
  }
  function showBanner(msg) {
    var el = document.getElementById('auth-error-banner');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('visible', !!msg);
  }
  function setLoading(on) {
    var btn = document.getElementById('submit-btn');
    var spinner = document.getElementById('submit-spinner');
    var text = document.getElementById('submit-text');
    if (!btn) return;
    btn.disabled = on;
    if (spinner) spinner.style.display = on ? 'block' : 'none';
    if (text) text.textContent = on ? '' : 'Accedi';
    var socials = document.querySelectorAll('.auth-btn-social');
    socials.forEach(function (b) { b.disabled = on; });
  }

  // ── Password toggle ──────────────────────────────────────────
  var pwInput = document.getElementById('auth-password');
  var pwToggle = document.getElementById('pw-toggle');
  var pwEye = document.getElementById('pw-eye');
  var pwEyeOff = document.getElementById('pw-eye-off');
  if (pwToggle) {
    pwToggle.addEventListener('click', function () {
      var isText = pwInput.type === 'text';
      pwInput.type = isText ? 'password' : 'text';
      pwEye.style.display = isText ? 'block' : 'none';
      pwEyeOff.style.display = isText ? 'none' : 'block';
    });
  }

  // ── Social buttons ───────────────────────────────────────────
  document.getElementById('btn-google').addEventListener('click', async function () {
    setLoading(true);
    await window.aikeAuth.signInWithOAuth('google');
    // Page will redirect — no need to reset loading state
  });
  document.getElementById('btn-github').addEventListener('click', async function () {
    setLoading(true);
    await window.aikeAuth.signInWithOAuth('github');
  });

  // ── Email/password form ──────────────────────────────────────
  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    showBanner('');
    showError('err-email', '');
    showError('err-password', '');

    var email = document.getElementById('auth-email').value.trim().toLowerCase();
    var password = document.getElementById('auth-password').value;

    // Client-side validation
    var valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('err-email', 'Inserisci un indirizzo email valido.');
      valid = false;
    }
    if (!password) {
      showError('err-password', 'Inserisci la password.');
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    var sb = window.aikeSupabase.getClient();
    var result = await sb.auth.signInWithPassword({ email: email, password: password });

    if (result.error) {
      setLoading(false);
      showBanner(window.aikeAuth.parseAuthError(result.error));
      return;
    }

    // Success — redirect
    window.location.href = '../index.html';
  });

  // ── Handle OAuth redirect (hash/fragment from Supabase) ──────
  (async function () {
    var sb = window.aikeSupabase.getClient();
    var { data: { session } } = await sb.auth.getSession();
    if (session) {
      // Already logged in (e.g. came back from OAuth)
      window.location.href = '../index.html';
    }
  })();

})();
</script>

</body>
</html>
```

- [ ] **Step 2.2 — Manual verification**

Open `pages/login.html` directly in browser:
- Left panel shows stars animation, owl logo + "aike", CTA text animates in after ~0.4s, globe spins
- Right panel: Google and GitHub buttons visible with logos
- Enter invalid email → error appears below email field
- Enter valid email + wrong password → "Email o password non corretti." banner
- Mobile (<768px): left panel hidden, form centered full width

- [ ] **Step 2.3 — Commit**

```bash
git add pages/login.html
git commit -m "feat(auth): rebuild login.html — dark premium split layout"
```

---

## Task 3: Rebuild pages/signup.html

**Files:**
- Rebuild: `pages/signup.html`

Identical structure to login.html. Differences: heading, fields (+ confirm password), submit text, footer link, form logic (signUp instead of signIn).

- [ ] **Step 3.1 — Write the complete signup.html**

Replace entire content of `pages/signup.html`. The CSS and left panel are identical to login.html — only the right panel content and JS differ:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registrati | aike</title>
  <meta name="description" content="Crea il tuo account AIKE." />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="../assets/css/styles.css?v=5" />

  <style>
    /* [EXACT SAME CSS AS login.html — copy the entire <style> block]
       Only difference: no changes needed, the CSS is identical. */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Suisse Int'l", "Inter", system-ui, sans-serif; background: #09090f; color: #fff; min-height: 100dvh; display: flex; align-items: stretch; }
    .auth-split { display: grid; grid-template-columns: 45% 55%; min-height: 100dvh; width: 100%; }
    .auth-left { position: relative; overflow: hidden; background: #07070e; border-right: 1px solid #14141f; display: flex; flex-direction: column; padding: 44px 48px; justify-content: space-between; }
    #stars-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .left-content { position: relative; z-index: 2; display: flex; flex-direction: column; height: 100%; justify-content: space-between; }
    .auth-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .auth-brand-logo { height: 32px; width: auto; }
    .auth-brand-name { font-family: "Suisse Int'l", "Inter", system-ui, sans-serif; font-size: 1.6rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; line-height: 1; }
    .auth-cta { flex: 1; display: flex; align-items: center; padding: 40px 0 32px; }
    .auth-cta-text { font-size: clamp(1.5rem, 2.2vw, 2rem); font-weight: 800; line-height: 1.2; letter-spacing: -0.03em; color: #fff; perspective: 800px; transform-style: preserve-3d; }
    .sol-line-1 { display: inline-block; opacity: 0; transform: translateY(60px) scale(0.85) rotateX(-20deg); filter: blur(20px); transition: opacity 1.4s cubic-bezier(0.16,1,0.3,1), transform 1.4s cubic-bezier(0.16,1,0.3,1), filter 1.4s cubic-bezier(0.16,1,0.3,1); }
    .sol-line-1.animate { opacity: 1; transform: translateY(0) scale(1) rotateX(0); filter: blur(0); }
    .sol-line-2 { display: inline-block; background-color: #3b1d64; color: #d9abff; padding: 4px 14px; border-radius: 6px; margin-top: 10px; transform: rotate(-2.5deg) translateY(-2px); box-shadow: 0 8px 24px rgba(168,85,247,0.15); clip-path: inset(0 100% 0 0); transition: clip-path 1.2s cubic-bezier(0.77,0,0.175,1); }
    .sol-line-2.animate { clip-path: inset(0 0% 0 0); }
    .auth-globe-wrap { display: flex; justify-content: center; align-items: center; position: relative; height: 200px; }
    .auth-globe-glow { position: absolute; width: 240px; height: 240px; background: radial-gradient(circle, rgba(99,102,241,0.18), transparent 65%); border-radius: 50%; pointer-events: none; }
    #auth-globe { display: block; border-radius: 50%; }
    .auth-left-footer { color: #252535; font-size: 11px; position: relative; z-index: 2; }
    .auth-right { background: #09090f; display: flex; align-items: center; justify-content: center; padding: 48px 40px; }
    .auth-form-wrap { width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 22px; }
    .auth-heading { font-size: 24px; font-weight: 600; letter-spacing: -0.03em; color: #f9f9fb; }
    .auth-sub { font-size: 13px; color: #4b5563; margin-top: 4px; }
    .auth-social-row { display: flex; gap: 10px; }
    .auth-btn-social { flex: 1; background: #111118; border: 1px solid #1e1e30; border-radius: 8px; padding: 11px 14px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #d1d5db; font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; transition: border-color 0.15s, background 0.15s; text-decoration: none; }
    .auth-btn-social:hover { border-color: #2e2e45; background: #13131e; }
    .auth-btn-social:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-divider { display: flex; align-items: center; gap: 12px; }
    .auth-divider-line { flex: 1; height: 1px; background: #1a1a2a; }
    .auth-divider-text { color: #2a2a3e; font-size: 11px; white-space: nowrap; }
    .auth-fields { display: flex; flex-direction: column; gap: 14px; }
    .auth-field { display: flex; flex-direction: column; gap: 6px; }
    .auth-label { font-size: 11px; font-weight: 500; color: #4b5563; letter-spacing: 0.5px; text-transform: uppercase; }
    .auth-input-wrap { position: relative; }
    .auth-input { width: 100%; background: #0e0e1a; border: 1px solid #1e1e30; border-radius: 8px; padding: 10px 14px; color: #f9f9fb; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; }
    .auth-input:focus { border-color: #4f4f8a; }
    .auth-input::placeholder { color: #252535; }
    .auth-input.has-toggle { padding-right: 42px; }
    .auth-pw-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #4b5563; padding: 4px; display: flex; align-items: center; }
    .auth-pw-toggle:hover { color: #9ca3af; }
    .auth-field-error { font-size: 12px; color: #ef4444; min-height: 16px; display: none; }
    .auth-field-error.visible { display: block; }
    .auth-btn-submit { width: 100%; background: #fff; color: #09090f; border: none; border-radius: 8px; padding: 12px 20px; font-size: 14px; font-weight: 600; font-family: inherit; letter-spacing: -0.01em; cursor: pointer; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .auth-btn-submit:hover:not(:disabled) { opacity: 0.9; }
    .auth-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .auth-spinner { width: 15px; height: 15px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #09090f; border-radius: 50%; animation: auth-spin 0.7s linear infinite; display: none; }
    @keyframes auth-spin { to { transform: rotate(360deg); } }
    .auth-footer-link { font-size: 12px; color: #4b5563; text-align: center; }
    .auth-footer-link a { color: #8b8ba0; text-decoration: underline; text-underline-offset: 2px; }
    .auth-footer-link a:hover { color: #d1d5db; }
    .auth-error-banner { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #f87171; display: none; }
    .auth-error-banner.visible { display: block; }
    .auth-success { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #4ade80; line-height: 1.6; display: none; }
    .auth-success.visible { display: block; }
    @media (max-width: 768px) { .auth-split { grid-template-columns: 1fr; } .auth-left { display: none; } .auth-right { padding: 32px 24px; align-items: flex-start; padding-top: 80px; } }
  </style>
</head>
<body>

<div class="auth-split">

  <!-- LEFT PANEL (identical to login.html) -->
  <div class="auth-left">
    <canvas id="stars-canvas"></canvas>
    <div class="left-content">
      <a href="../index.html" class="auth-brand">
        <img class="auth-brand-logo" src="../assets/images/logo.png" alt="Aike Logo">
        <span class="auth-brand-name">aike</span>
      </a>
      <div class="auth-cta">
        <div class="auth-cta-text">
          <span class="sol-line-1">Built for teams that<br>move fast and</span><br>
          <span class="sol-line-2">need results</span>
        </div>
      </div>
      <div class="auth-globe-wrap">
        <div class="auth-globe-glow"></div>
        <canvas id="auth-globe" width="180" height="180"></canvas>
      </div>
      <div class="auth-left-footer">© 2025 AIKE</div>
    </div>
  </div>

  <!-- RIGHT PANEL -->
  <div class="auth-right">
    <div class="auth-form-wrap">

      <div>
        <div class="auth-heading">Crea il tuo account</div>
        <div class="auth-sub">Inizia gratuitamente, senza carta di credito.</div>
      </div>

      <div class="auth-social-row">
        <button class="auth-btn-social" id="btn-google" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        <button class="auth-btn-social" id="btn-github" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#d1d5db" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </button>
      </div>

      <div class="auth-divider">
        <div class="auth-divider-line"></div>
        <div class="auth-divider-text">oppure continua con email</div>
        <div class="auth-divider-line"></div>
      </div>

      <div class="auth-error-banner" id="auth-error-banner" role="alert"></div>
      <div class="auth-success" id="auth-success" role="status"></div>

      <form class="auth-fields" id="signup-form" novalidate>
        <div class="auth-field">
          <label class="auth-label" for="auth-email">Email</label>
          <div class="auth-input-wrap">
            <input class="auth-input" type="email" id="auth-email" name="email"
              autocomplete="email" placeholder="mario@esempio.it" required>
          </div>
          <div class="auth-field-error" id="err-email"></div>
        </div>

        <div class="auth-field">
          <label class="auth-label" for="auth-password">Password</label>
          <div class="auth-input-wrap">
            <input class="auth-input has-toggle" type="password" id="auth-password"
              name="password" autocomplete="new-password" placeholder="Min. 8 caratteri" required>
            <button type="button" class="auth-pw-toggle" id="pw-toggle" aria-label="Mostra/nascondi password">
              <svg id="pw-eye" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg id="pw-eye-off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
          <div class="auth-field-error" id="err-password"></div>
        </div>

        <div class="auth-field">
          <label class="auth-label" for="auth-confirm">Conferma password</label>
          <div class="auth-input-wrap">
            <input class="auth-input" type="password" id="auth-confirm"
              name="confirm" autocomplete="new-password" placeholder="Ripeti la password" required>
          </div>
          <div class="auth-field-error" id="err-confirm"></div>
        </div>

        <button class="auth-btn-submit" type="submit" id="submit-btn">
          <span class="auth-spinner" id="submit-spinner"></span>
          <span id="submit-text">Crea account</span>
        </button>
      </form>

      <div class="auth-footer-link">
        Hai già un account? <a href="login.html">Accedi</a>
      </div>

    </div>
  </div>

</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script src="../assets/js/config.js"></script>
<script src="../assets/js/auth.js"></script>

<!-- Stars canvas (identical to login.html) -->
<script>
(function () {
  var canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d'), stars = [], NUM_STARS = 160;
  function heroHeight() { return canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight; }
  function resizeCanvas() { canvas.width = canvas.offsetWidth; canvas.height = heroHeight(); }
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function createStar(forceTop) {
    var angle = rand(35,45)*Math.PI/180, speed=rand(0.4,1.2), length=rand(20,60), opacity=rand(0.3,0.8), width=rand(0.5,1.5);
    var vx=-Math.cos(angle)*speed, vy=Math.sin(angle)*speed, x, y;
    if (forceTop) { if (Math.random()<0.6){x=rand(0,canvas.width);y=rand(-length,0);}else{x=rand(canvas.width*0.5,canvas.width+length);y=rand(-canvas.height*0.1,canvas.height*0.5);} }
    else { if(Math.random()<0.5){x=rand(0,canvas.width+canvas.height*Math.tan(angle));y=-length;}else{x=canvas.width+rand(0,length);y=rand(-length,canvas.height*0.3);} }
    return {x,y,vx,vy,length,opacity,width};
  }
  function initStars(){stars=[];for(var i=0;i<NUM_STARS;i++)stars.push(createStar(true));}
  function isOff(s){return s.x<-s.length*2||s.y>canvas.height+s.length;}
  function drawStar(s){
    var nx=s.vx/Math.hypot(s.vx,s.vy),ny=s.vy/Math.hypot(s.vx,s.vy);
    var g=ctx.createLinearGradient(s.x-nx*s.length,s.y-ny*s.length,s.x,s.y);
    g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(220,230,255,'+s.opacity+')');
    ctx.beginPath();ctx.moveTo(s.x-nx*s.length,s.y-ny*s.length);ctx.lineTo(s.x,s.y);
    ctx.strokeStyle=g;ctx.lineWidth=s.width;ctx.lineCap='round';ctx.stroke();
  }
  function animate(){
    ctx.fillStyle='rgba(0,0,0,0.03)';ctx.fillRect(0,0,canvas.width,canvas.height);
    for(var i=0;i<stars.length;i++){stars[i].x+=stars[i].vx;stars[i].y+=stars[i].vy;if(isOff(stars[i]))stars[i]=createStar(false);else drawStar(stars[i]);}
    requestAnimationFrame(animate);
  }
  resizeCanvas();initStars();animate();
  var t;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(function(){resizeCanvas();initStars();},150);});
})();
</script>

<script>
(function(){
  function init(){
    setTimeout(function(){var el=document.querySelector('.sol-line-1');if(el)el.classList.add('animate');},400);
    setTimeout(function(){var el=document.querySelector('.sol-line-2');if(el)el.classList.add('animate');},1000);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
</script>

<script type="module">
import createGlobe from 'https://cdn.jsdelivr.net/npm/cobe@0.6.3/+esm';
var canvas = document.getElementById('auth-globe');
if (canvas) {
  var phi = 0;
  createGlobe(canvas, {
    devicePixelRatio:2,width:360,height:360,phi:0,theta:0.25,dark:1,diffuse:1.2,
    mapSamples:10000,mapBrightness:6,baseColor:[0.18,0.12,0.38],
    markerColor:[0.55,0.25,0.95],glowColor:[0.15,0.08,0.3],
    markers:[{location:[41.9,12.5],size:0.05},{location:[48.8,2.3],size:0.04},{location:[40.7,-74],size:0.06}],
    onRender:function(state){state.phi=phi;phi+=0.004;}
  });
}
</script>

<!-- Signup form logic -->
<script>
(function () {
  'use strict';

  function showError(id, msg) { var el=document.getElementById(id); if(!el)return; el.textContent=msg; el.classList.toggle('visible',!!msg); }
  function showBanner(msg) { var el=document.getElementById('auth-error-banner'); if(!el)return; el.textContent=msg; el.classList.toggle('visible',!!msg); }
  function showSuccess(msg) { var el=document.getElementById('auth-success'); if(!el)return; el.textContent=msg; el.classList.toggle('visible',!!msg); }
  function setLoading(on) {
    var btn=document.getElementById('submit-btn'), spinner=document.getElementById('submit-spinner'), text=document.getElementById('submit-text');
    if(!btn)return;
    btn.disabled=on;
    if(spinner)spinner.style.display=on?'block':'none';
    if(text)text.textContent=on?'':'Crea account';
    document.querySelectorAll('.auth-btn-social').forEach(function(b){b.disabled=on;});
  }

  // Password toggle
  var pwInput=document.getElementById('auth-password'),pwToggle=document.getElementById('pw-toggle'),pwEye=document.getElementById('pw-eye'),pwEyeOff=document.getElementById('pw-eye-off');
  if(pwToggle){pwToggle.addEventListener('click',function(){var isText=pwInput.type==='text';pwInput.type=isText?'password':'text';pwEye.style.display=isText?'block':'none';pwEyeOff.style.display=isText?'none':'block';});}

  // Social
  document.getElementById('btn-google').addEventListener('click',async function(){setLoading(true);await window.aikeAuth.signInWithOAuth('google');});
  document.getElementById('btn-github').addEventListener('click',async function(){setLoading(true);await window.aikeAuth.signInWithOAuth('github');});

  // Form
  document.getElementById('signup-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    showBanner(''); showSuccess('');
    ['err-email','err-password','err-confirm'].forEach(function(id){showError(id,'');});

    var email    = document.getElementById('auth-email').value.trim().toLowerCase();
    var password = document.getElementById('auth-password').value;
    var confirm  = document.getElementById('auth-confirm').value;

    var valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('err-email','Inserisci un indirizzo email valido.'); valid=false; }
    if (!password || password.length < 8) { showError('err-password','La password deve essere di almeno 8 caratteri.'); valid=false; }
    if (password !== confirm) { showError('err-confirm','Le password non coincidono.'); valid=false; }
    if (!valid) return;

    setLoading(true);
    var sb = window.aikeSupabase.getClient();
    var result = await sb.auth.signUp({ email: email, password: password });

    if (result.error) {
      setLoading(false);
      showBanner(window.aikeAuth.parseAuthError(result.error));
      return;
    }

    setLoading(false);
    // Hide form, show success
    document.getElementById('signup-form').style.display = 'none';
    document.querySelector('.auth-social-row').style.display = 'none';
    document.querySelector('.auth-divider').style.display = 'none';
    showSuccess('Controlla la tua email — ti abbiamo inviato un link di conferma. Dopo averlo confermato potrai accedere.');
  });

  // Redirect if already logged in
  (async function(){
    var sb=window.aikeSupabase.getClient();
    var {data:{session}}=await sb.auth.getSession();
    if(session)window.location.href='../index.html';
  })();

})();
</script>

</body>
</html>
```

- [ ] **Step 3.2 — Manual verification**

Open `pages/signup.html`:
- Same left panel as login
- Three fields: email, password, confirm password
- Mismatched passwords → "Le password non coincidono." under confirm field
- Password < 8 chars → error under password field
- Successful signup → form hides, green success message appears
- "Hai già un account? Accedi" link goes to login.html

- [ ] **Step 3.3 — Commit**

```bash
git add pages/signup.html
git commit -m "feat(auth): rebuild signup.html — dark premium split layout"
```

---

## Task 4: Fix admin.html — inject UI after auth gate

**Files:**
- Modify: `pages/admin.html` (lines 318–399 and 404–448)

The `#admin-app` div is removed from HTML. After a successful admin verification, `renderAdminApp(user)` injects the dashboard HTML into `#admin-container`.

- [ ] **Step 4.1 — Replace `#admin-app` HTML with empty container**

Find and replace the `#admin-app` div (lines 318–399 in admin.html):

```html
<!-- REMOVE this entire block: -->
  <!-- Admin app — hidden until auth verified -->
  <div id="admin-app">
    <div class="admin-layout">
      ...entire dashboard HTML...
    </div>
  </div>

<!-- REPLACE WITH: -->
  <!-- Admin app injected by JS after auth verification -->
  <div id="admin-container"></div>
```

- [ ] **Step 4.2 — Replace auth gate JS with updated version**

Find the `(async function () {` block starting at line 404 and replace it with:

```javascript
(async function () {
  'use strict';

  var sb = window.supabase.createClient(
    window.AIKE_CONFIG.supabase.url,
    window.AIKE_CONFIG.supabase.anonKey
  );

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── 1. Auth gate (server-verified) ──────────────────────────
  var userResult = await sb.auth.getUser();
  var user = userResult.data && userResult.data.user ? userResult.data.user : null;

  if (!user) { window.location.href = 'login.html'; return; }

  var profileResult = await sb.from('users').select('is_admin, email').eq('id', user.id).maybeSingle();
  var profile = profileResult.data;

  if (!profile) {
    document.getElementById('admin-gate').innerHTML =
      '<div style="text-align:center;padding:2rem;color:#f87171;font-size:0.9rem;max-width:400px;line-height:1.6;">' +
      'Profilo utente mancante.<br><br>Esegui questo nel Supabase SQL Editor:<br>' +
      '<code style="background:#1a1a1a;padding:0.5rem;border-radius:6px;display:block;margin-top:0.75rem;color:#c084fc;font-size:0.8rem;">' +
      'INSERT INTO public.users (id, email, plan, is_admin)<br>' +
      'SELECT id, email, \'free\', true<br>FROM auth.users<br>WHERE email = \'' + escHtml(user.email) + '\';</code></div>';
    return;
  }

  if (!profile.is_admin) { window.location.href = '../index.html'; return; }

  // ── 2. Inject admin UI (only now, after verification) ───────
  renderAdminApp(user);

  function renderAdminApp(u) {
    var email = u.email || '';
    var initial = email.charAt(0).toUpperCase();
    var today = new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    document.getElementById('admin-container').innerHTML =
      '<div class="admin-layout">' +
        '<aside class="admin-sidebar">' +
          '<a href="../index.html" class="admin-brand">' +
            '<img src="../assets/images/logo.png" alt="Aike"/>' +
            '<span>aike</span><span class="admin-tag">Admin</span>' +
          '</a>' +
          '<nav class="admin-nav">' +
            '<a class="admin-nav-item active" href="#"><span class="nav-icon">◈</span> Overview</a>' +
            '<a class="admin-nav-item" href="../index.html"><span class="nav-icon">↗</span> View Site</a>' +
          '</nav>' +
          '<div class="admin-sidebar-footer">' +
            '<button class="admin-logout-btn" id="admin-logout-btn"><span>⇤</span> Log out</button>' +
          '</div>' +
        '</aside>' +
        '<main class="admin-main">' +
          '<div class="admin-header">' +
            '<div>' +
              '<div class="admin-header-title">Dashboard</div>' +
              '<div class="admin-header-sub">' + today + '</div>' +
            '</div>' +
            '<div class="admin-user-chip">' +
              '<div class="admin-avatar">' + escHtml(initial) + '</div>' +
              '<span>' + escHtml(email) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="stats-grid">' +
            '<div class="stat-card"><div class="stat-label">Total Users</div><div class="stat-value" id="stat-users">—</div><div class="stat-sub">registered accounts</div></div>' +
            '<div class="stat-card"><div class="stat-label">Total Visits</div><div class="stat-value" id="stat-visits">—</div><div class="stat-sub">all-time page views</div></div>' +
            '<div class="stat-card"><div class="stat-label">Active Now</div><div class="stat-value purple" id="stat-active">—</div><div class="stat-sub">visits in last 5 min</div></div>' +
          '</div>' +
          '<div class="section-heading">All Users</div>' +
          '<div class="admin-table-wrap">' +
            '<div id="users-loading" class="admin-loading"><div class="admin-spinner"></div><div>Loading users…</div></div>' +
            '<table class="admin-table" id="users-table" style="display:none;">' +
              '<thead><tr><th>Email</th><th>Plan</th><th>Joined</th></tr></thead>' +
              '<tbody id="users-tbody"></tbody>' +
            '</table>' +
          '</div>' +
        '</main>' +
      '</div>';

    // Hide gate, wire logout
    document.getElementById('admin-gate').style.display = 'none';

    document.getElementById('admin-logout-btn').addEventListener('click', async function () {
      await sb.auth.signOut();
      window.location.href = 'login.html';
    });

    // Load dashboard data
    loadStats();
    loadUsers();
  }
```

- [ ] **Step 4.3 — Verify `loadStats` and `loadUsers` functions still exist below**

Search admin.html for `function loadStats` and `function loadUsers`. They should already exist in the script block. If they reference `document.getElementById('admin-gate')` or `document.getElementById('admin-app')` for showing/hiding, those calls are now handled inside `renderAdminApp` — confirm no broken references.

- [ ] **Step 4.4 — Manual verification**

Open `pages/admin.html` in browser:
- Non-logged-in user → redirected to login.html
- Logged-in non-admin → redirected to index.html
- DevTools → Elements tab → search for `admin-layout` → **not present** before auth completes
- Admin user → spinner shown briefly → dashboard renders via JS injection

- [ ] **Step 4.5 — Commit index.html + admin.html**

```bash
git add pages/admin.html index.html
git commit -m "feat(auth): admin gate injects UI via JS; index.html testimonial cards upgrade"
```

---

## Task 5: Push branch and final verification

- [ ] **Step 5.1 — Full end-to-end check**

Open each page and verify:

| Page | Check |
|------|-------|
| `pages/login.html` | Stars animate, globe spins, CTA text reveals, Google/GitHub buttons present with logos |
| `pages/signup.html` | Same left panel, 3 fields, success message on valid signup |
| `pages/admin.html` | DOM has no `admin-layout` before auth; shows spinner; admin-only content injects after gate |
| `index.html` | Testimonial cards: hover per-card, grayscale+overlay effect, verified badge, dicebear avatars |
| `auth.js` | `parseAuthError`, `signInWithOAuth` accessible via `window.aikeAuth` |

- [ ] **Step 5.2 — Push branch**

```bash
git push origin feature/auth-system-rebuild
```

---

## Google + GitHub OAuth Setup (manual — required from user)

After implementation, the user must configure OAuth providers in Supabase. Exact steps are documented in the implementation output after Task 4.

**Summary:**
1. Supabase Dashboard → Authentication → Providers → Google → enable → paste Client ID + Secret
2. Supabase Dashboard → Authentication → Providers → GitHub → enable → paste Client ID + Secret
3. Set Redirect URL in both: `https://[your-domain]/pages/login.html` AND `http://localhost:[port]/pages/login.html` for local dev
4. Add same Redirect URL in Google Cloud Console and GitHub OAuth App settings
