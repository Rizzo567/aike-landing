# Settings Modal + Email Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing tab-based settings modal with a full sidebar-layout modal (7 sections, Supabase-backed) and add OTP email verification with verified badge in the header.

**Architecture:** New `assets/js/settings.js` holds all settings logic (load/save to Supabase `user_settings` table, OTP flow). `bundle.js` provides the new modal HTML and is the only file that needs its old settings HTML replaced. `functions/api/verify-email.js` handles OTP send/verify as a Cloudflare edge function. The verified badge (`#auth-avatar-status`) is already in the DOM — `auth.js` just needs to show/hide it based on `user_settings.email_verified`.

**Tech Stack:** Vanilla JS, CSS custom properties, Supabase JS v2 (already loaded), Cloudflare Pages Functions (edge)

---

## Branch

All work on `feature/settings-modal`. Create it before starting:

```bash
cd "C:/Users/manue/Desktop/AIKE FULL/WEBSITE/aike-website"
git checkout main && git pull origin main
git checkout -b feature/settings-modal
```

---

## Task 1: Supabase `user_settings` table

**Files:**
- No code file — SQL to run in Supabase SQL editor

- [ ] **Step 1: Run this SQL in the Supabase dashboard SQL editor**

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  locale               text    NOT NULL DEFAULT 'it',
  email_notifications  boolean NOT NULL DEFAULT true,
  ai_memory_enabled    boolean NOT NULL DEFAULT true,
  ai_suggestions       boolean NOT NULL DEFAULT true,
  plane_autosave       boolean NOT NULL DEFAULT true,
  plane_snap_grid      boolean NOT NULL DEFAULT false,
  plane_animations     boolean NOT NULL DEFAULT true,
  owl_language         text    NOT NULL DEFAULT 'it',
  owl_tone             text    NOT NULL DEFAULT 'balanced',
  email_verified       boolean NOT NULL DEFAULT false,
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Verify table exists**

In Supabase Table Editor, confirm `user_settings` appears with the columns above.

---

## Task 2: CSS — replace old settings styles, add sidebar modal styles

**Files:**
- Modify: `assets/css/components.css` lines 594–900 (old settings block)

- [ ] **Step 1: Delete old settings CSS block**

In `components.css`, find and delete everything from:
```
/* ── Settings Overlay ────────────────────────────────────────── */
```
down to (and including) the closing `@media (max-width: 480px)` block that ends with `}` at line ~900.

- [ ] **Step 2: Append new settings CSS at end of components.css**

Add the following block at the very end of the file:

```css
/* ══════════════════════════════════════════════════════════════
   Settings Modal — sidebar layout
   ══════════════════════════════════════════════════════════════ */

/* Overlay */
#aike-settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
#aike-settings-overlay.overlay-open {
  opacity: 1;
  pointer-events: auto;
}

/* Dialog box */
.sm-dialog {
  position: relative;
  display: flex;
  width: min(900px, 94vw);
  height: min(620px, 88vh);
  background: #141414;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.75);
  transform: scale(0.96) translateY(10px);
  transition: transform 0.25s cubic-bezier(0.16,1,0.3,1);
}
#aike-settings-overlay.overlay-open .sm-dialog {
  transform: scale(1) translateY(0);
}

/* Close button */
.sm-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: background 0.15s, color 0.15s;
  z-index: 10;
  flex-shrink: 0;
}
.sm-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

/* Sidebar */
.sm-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #0f0f0f;
  border-right: 1px solid rgba(255,255,255,0.07);
  padding: 24px 0 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.sm-sidebar-title {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  padding: 0 18px 16px;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
.sm-nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 18px;
  font-size: 0.83rem;
  color: #9ca3af;
  cursor: pointer;
  border-right: 2px solid transparent;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  flex-shrink: 0;
}
.sm-nav-item:hover { color: #e5e5e5; background: rgba(255,255,255,0.04); }
.sm-nav-item.active {
  color: #fff;
  font-weight: 600;
  background: rgba(168,85,247,0.1);
  border-right-color: #a855f7;
}
.sm-nav-item svg { opacity: 0.55; flex-shrink: 0; transition: opacity 0.15s; }
.sm-nav-item.active svg { opacity: 1; }

/* Content pane */
.sm-content {
  flex: 1;
  padding: 28px 32px;
  overflow-y: auto;
}
.sm-content::-webkit-scrollbar { width: 4px; }
.sm-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

/* Section panels */
.sm-panel { display: none; }
.sm-panel.active { display: block; }

.sm-section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 20px;
  letter-spacing: -0.02em;
}
.sm-sub-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 20px 0 10px;
}

/* Settings row */
.sm-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.sm-row:last-child { border-bottom: none; }
.sm-row-left { flex: 1; min-width: 0; }
.sm-row-label { font-size: 0.875rem; font-weight: 600; color: #e5e5e5; }
.sm-row-sub { font-size: 0.78rem; color: #6b7280; margin-top: 3px; line-height: 1.5; }
.sm-row-right { flex-shrink: 0; display: flex; align-items: center; gap: 8px; }

/* Separator */
.sm-sep { height: 1px; background: rgba(255,255,255,0.06); margin: 16px 0; }

/* Toggle switch */
.sm-toggle {
  position: relative;
  width: 38px;
  height: 21px;
  cursor: pointer;
  flex-shrink: 0;
}
.sm-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.sm-toggle-track {
  position: absolute;
  inset: 0;
  border-radius: 21px;
  background: #374151;
  transition: background 0.2s;
}
.sm-toggle input:checked + .sm-toggle-track { background: #a855f7; }
.sm-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.2s;
  pointer-events: none;
}
.sm-toggle input:checked ~ .sm-toggle-thumb { left: 20px; }

/* Select */
.sm-select {
  background: #1e1e1e;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 7px 28px 7px 11px;
  color: #e5e5e5;
  font-size: 0.82rem;
  font-family: inherit;
  appearance: none;
  cursor: pointer;
  min-width: 140px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  outline: none;
  transition: border-color 0.15s;
}
.sm-select:focus { border-color: rgba(168,85,247,0.5); }

/* Input */
.sm-input {
  background: #1e1e1e;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 7px 12px;
  color: #fff;
  font-size: 0.82rem;
  font-family: inherit;
  outline: none;
  width: 200px;
  transition: border-color 0.15s;
}
.sm-input:focus { border-color: rgba(168,85,247,0.5); }

/* Button */
.sm-btn {
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff;
  cursor: pointer;
  background: #1e1e1e;
  font-family: inherit;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
}
.sm-btn:hover { background: #2a2a2a; }
.sm-btn-primary { background: #a855f7; border-color: transparent; }
.sm-btn-primary:hover { background: #9333ea; }
.sm-btn-danger { border-color: rgba(239,68,68,0.3); color: #ef4444; }
.sm-btn-danger:hover { background: rgba(239,68,68,0.08); }

/* Save feedback */
.sm-save-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.sm-save-feedback {
  font-size: 0.78rem;
  color: #22c55e;
  display: none;
  align-items: center;
  gap: 5px;
  margin-right: 10px;
}
.sm-save-feedback.visible { display: flex; }

/* Email verified badge */
.sm-verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
}
.sm-verified-badge.verified {
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.25);
  color: #4ade80;
}
.sm-verified-badge.unverified {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  color: #f87171;
}

/* OTP inline form */
.sm-otp-form {
  display: none;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
  padding: 14px;
  background: rgba(168,85,247,0.06);
  border: 1px solid rgba(168,85,247,0.15);
  border-radius: 10px;
}
.sm-otp-form.visible { display: flex; }
.sm-otp-input {
  background: #1e1e1e;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fff;
  font-size: 1.2rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.4em;
  text-align: center;
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
}
.sm-otp-input:focus { border-color: rgba(168,85,247,0.5); }
.sm-otp-hint { font-size: 0.75rem; color: #6b7280; }
.sm-otp-hint a { color: #a855f7; cursor: pointer; text-decoration: underline; }
.sm-otp-error { font-size: 0.75rem; color: #f87171; display: none; }
.sm-otp-error.visible { display: block; }
.sm-otp-actions { display: flex; gap: 8px; }

/* Avatar grid (reused from old settings) */
.sm-avatar-preview {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #a855f7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}
.sm-avatar-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 12px;
}
.sm-avatar-option {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, transform 0.15s;
}
.sm-avatar-option:hover { transform: scale(1.1); }
.sm-avatar-option.selected { border-color: #a855f7; }

/* Billing aesthetic */
.sm-plan-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba(168,85,247,0.12);
  border: 1px solid rgba(168,85,247,0.25);
  color: #a855f7;
}
.sm-credits-bar-wrap { flex: 1; min-width: 120px; }
.sm-credits-bar-bg {
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}
.sm-credits-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #a855f7);
  border-radius: 3px;
  transition: width 0.4s ease;
}
.sm-credits-label { font-size: 0.72rem; color: #6b7280; }

/* Danger zone */
.sm-danger-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #ef4444;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 20px 0 10px;
}

/* Responsive */
@media (max-width: 640px) {
  .sm-dialog {
    flex-direction: column;
    height: min(90vh, 680px);
    width: 95vw;
  }
  .sm-sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding: 10px 0 0;
    border-right: none;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .sm-sidebar-title { display: none; }
  .sm-nav-item {
    padding: 8px 14px;
    border-right: none;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .sm-nav-item.active { border-right-color: transparent; border-bottom-color: #a855f7; }
  .sm-content { padding: 20px 18px; }
}
```

- [ ] **Step 3: Commit**

```bash
git add assets/css/components.css
git commit -m "style(settings): replace tab modal CSS with sidebar modal CSS"
```

---

## Task 3: New settings modal HTML in bundle.js

**Files:**
- Modify: `assets/js/bundle.js` — replace `getSettingsOverlayHTML()` function (lines ~199–264) and `initSettingsOverlay()` (lines ~337–472)

The avatar definitions are reused. The old `getSettingsOverlayHTML` and `initSettingsOverlay` functions are fully replaced. `openSettings` / `closeSettings` stay as `window.aikeOpenSettings`.

- [ ] **Step 1: Replace `getSettingsOverlayHTML()` in bundle.js**

Find this line in bundle.js:
```javascript
function getSettingsOverlayHTML() {
```
Delete the entire function (from `function getSettingsOverlayHTML() {` through its closing `}`).

Replace it with:

```javascript
var AVATAR_DEFS = [
  { id: 1,  emoji: '🦊', color: '#f97316' },
  { id: 2,  emoji: '🐺', color: '#6366f1' },
  { id: 3,  emoji: '🦁', color: '#eab308' },
  { id: 4,  emoji: '🐉', color: '#22c55e' },
  { id: 5,  emoji: '🦅', color: '#3b82f6' },
  { id: 6,  emoji: '🐬', color: '#06b6d4' },
  { id: 7,  emoji: '🦄', color: '#a855f7' },
  { id: 8,  emoji: '🐻‍❄️', color: '#94a3b8' },
  { id: 9,  emoji: '🦋', color: '#ec4899' },
  { id: 10, emoji: '⚡', color: '#f59e0b' }
];

function getSettingsOverlayHTML() {
  var avatarGridHTML = AVATAR_DEFS.map(function(a) {
    return '<button class="sm-avatar-option" data-avatar-id="' + a.id +
           '" data-emoji="' + a.emoji + '" data-color="' + a.color +
           '" style="background:' + a.color + ';" aria-label="Avatar ' + a.emoji + '">' +
           a.emoji + '</button>';
  }).join('');

  return '<div id="aike-settings-overlay" role="dialog" aria-modal="true" aria-label="Impostazioni">' +
    '<div class="sm-dialog">' +
      '<button class="sm-close" id="sm-close-btn" aria-label="Chiudi">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +

      '<!-- Sidebar -->' +
      '<nav class="sm-sidebar" aria-label="Sezioni impostazioni">' +
        '<div class="sm-sidebar-title">Impostazioni</div>' +
        '<button class="sm-nav-item active" data-panel="generale">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
          'Generale' +
        '</button>' +
        '<button class="sm-nav-item" data-panel="account">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
          'Account' +
        '</button>' +
        '<button class="sm-nav-item" data-panel="privacy">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
          'Privacy' +
        '</button>' +
        '<button class="sm-nav-item" data-panel="fatturazione">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' +
          'Fatturazione' +
        '</button>' +
        '<button class="sm-nav-item" data-panel="funzionalita">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' +
          'Funzionalità' +
        '</button>' +
        '<button class="sm-nav-item" data-panel="owl">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>' +
          'Owl' +
        '</button>' +
        '<button class="sm-nav-item" data-panel="plane">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>' +
          'Plane' +
        '</button>' +
      '</nav>' +

      '<!-- Content -->' +
      '<div class="sm-content">' +

        '<!-- Generale -->' +
        '<div class="sm-panel active" id="sm-panel-generale">' +
          '<div class="sm-section-title">Generale</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Lingua</div><div class="sm-row-sub">Lingua dell\'interfaccia AIKE</div></div>' +
            '<div class="sm-row-right">' +
              '<select class="sm-select" id="sm-locale">' +
                '<option value="it">🇮🇹 Italiano</option>' +
                '<option value="en">🇬🇧 English</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Notifiche email</div><div class="sm-row-sub">Ricevi aggiornamenti e novità via email</div></div>' +
            '<div class="sm-row-right"><label class="sm-toggle"><input type="checkbox" id="sm-email-notifications"><span class="sm-toggle-track"></span><span class="sm-toggle-thumb"></span></label></div>' +
          '</div>' +
          '<div class="sm-save-row"><span class="sm-save-feedback" id="sm-generale-feedback">✓ Salvato</span><button class="sm-btn sm-btn-primary" id="sm-save-generale">Salva</button></div>' +
        '</div>' +

        '<!-- Account -->' +
        '<div class="sm-panel" id="sm-panel-account">' +
          '<div class="sm-section-title">Account</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left" style="display:flex;align-items:center;gap:14px;">' +
              '<div class="sm-avatar-preview" id="sm-avatar-preview">🦅</div>' +
              '<div><div class="sm-row-label">Avatar</div><div class="sm-row-sub">Il tuo avatar nelle app AIKE</div></div>' +
            '</div>' +
            '<div class="sm-row-right"><button class="sm-btn" id="sm-avatar-toggle-btn">Cambia</button></div>' +
          '</div>' +
          '<div id="sm-avatar-grid-wrap" style="display:none;padding-bottom:8px;">' +
            '<div class="sm-avatar-grid" id="sm-avatar-grid">' + avatarGridHTML + '</div>' +
          '</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Nome visualizzato</div><div class="sm-row-sub">Viene mostrato nelle app AIKE</div></div>' +
            '<div class="sm-row-right"><input type="text" class="sm-input" id="sm-display-name" placeholder="Il tuo nome..." maxlength="40" autocomplete="name"></div>' +
          '</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left">' +
              '<div class="sm-row-label">Email</div>' +
              '<div class="sm-row-sub" id="sm-email-value">—</div>' +
            '</div>' +
            '<div class="sm-row-right" style="flex-direction:column;align-items:flex-end;gap:8px;">' +
              '<span class="sm-verified-badge unverified" id="sm-verified-badge">✗ Non verificata</span>' +
              '<button class="sm-btn" id="sm-verify-btn" style="display:none;">Verifica email</button>' +
            '</div>' +
          '</div>' +
          '<div class="sm-otp-form" id="sm-otp-form">' +
            '<div class="sm-row-label" style="font-size:0.82rem;">Inserisci il codice a 6 cifre inviato alla tua email</div>' +
            '<input type="text" class="sm-otp-input" id="sm-otp-input" maxlength="6" placeholder="000000" inputmode="numeric" autocomplete="one-time-code">' +
            '<div class="sm-otp-error" id="sm-otp-error">Codice errato o scaduto. Riprova.</div>' +
            '<div class="sm-otp-hint">Non hai ricevuto il codice? <a id="sm-otp-resend">Invia di nuovo</a> <span id="sm-otp-countdown"></span></div>' +
            '<div class="sm-otp-actions">' +
              '<button class="sm-btn sm-btn-primary" id="sm-otp-confirm">Conferma</button>' +
              '<button class="sm-btn" id="sm-otp-cancel">Annulla</button>' +
            '</div>' +
          '</div>' +
          '<div class="sm-save-row"><span class="sm-save-feedback" id="sm-account-feedback">✓ Salvato</span><button class="sm-btn sm-btn-primary" id="sm-save-account">Salva</button></div>' +
          '<div class="sm-sep"></div>' +
          '<div class="sm-sub-title">Sicurezza</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Password</div><div class="sm-row-sub">Ricevi un\'email per reimpostare la password</div></div>' +
            '<div class="sm-row-right"><button class="sm-btn" id="sm-reset-password-btn">Cambia password</button></div>' +
          '</div>' +
          '<div class="sm-sep"></div>' +
          '<div class="sm-danger-title">Zona pericolosa</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Elimina account</div><div class="sm-row-sub">Rimuove definitivamente account e tutti i dati</div></div>' +
            '<div class="sm-row-right"><button class="sm-btn sm-btn-danger" id="sm-delete-account-btn">Elimina</button></div>' +
          '</div>' +
        '</div>' +

        '<!-- Privacy -->' +
        '<div class="sm-panel" id="sm-panel-privacy">' +
          '<div class="sm-section-title">Privacy</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Memoria AI</div><div class="sm-row-sub">Permetti all\'AI di ricordare il contesto delle conversazioni</div></div>' +
            '<div class="sm-row-right"><label class="sm-toggle"><input type="checkbox" id="sm-ai-memory"><span class="sm-toggle-track"></span><span class="sm-toggle-thumb"></span></label></div>' +
          '</div>' +
          '<div class="sm-sep"></div>' +
          '<div class="sm-sub-title">Dati</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Esporta i tuoi dati</div><div class="sm-row-sub">Scarica un file JSON con le tue impostazioni</div></div>' +
            '<div class="sm-row-right"><button class="sm-btn" id="sm-export-data-btn">Esporta</button></div>' +
          '</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Elimina tutti i dati</div><div class="sm-row-sub">Azzera impostazioni e preferenze (account non eliminato)</div></div>' +
            '<div class="sm-row-right"><button class="sm-btn sm-btn-danger" id="sm-delete-data-btn">Elimina dati</button></div>' +
          '</div>' +
          '<div class="sm-save-row"><span class="sm-save-feedback" id="sm-privacy-feedback">✓ Salvato</span><button class="sm-btn sm-btn-primary" id="sm-save-privacy">Salva</button></div>' +
        '</div>' +

        '<!-- Fatturazione (estetica) -->' +
        '<div class="sm-panel" id="sm-panel-fatturazione">' +
          '<div class="sm-section-title">Fatturazione</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Piano attivo</div></div>' +
            '<div class="sm-row-right"><span class="sm-plan-badge" id="sm-plan-label">Free</span></div>' +
          '</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left">' +
              '<div class="sm-row-label">Crediti rimanenti</div>' +
              '<div class="sm-credits-bar-wrap">' +
                '<div class="sm-credits-bar-bg"><div class="sm-credits-bar-fill" id="sm-credits-fill" style="width:0%"></div></div>' +
                '<div class="sm-credits-label" id="sm-credits-label">— / — crediti</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="sm-sep"></div>' +
          '<div class="sm-sub-title">Storico pagamenti</div>' +
          '<div style="padding:20px 0;color:#4b5563;font-size:0.85rem;text-align:center;">Nessun pagamento registrato</div>' +
        '</div>' +

        '<!-- Funzionalità -->' +
        '<div class="sm-panel" id="sm-panel-funzionalita">' +
          '<div class="sm-section-title">Funzionalità</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Suggerimenti AI</div><div class="sm-row-sub">Mostra suggerimenti intelligenti durante l\'utilizzo</div></div>' +
            '<div class="sm-row-right"><label class="sm-toggle"><input type="checkbox" id="sm-ai-suggestions"><span class="sm-toggle-track"></span><span class="sm-toggle-thumb"></span></label></div>' +
          '</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Salvataggio automatico (Plane)</div><div class="sm-row-sub">Salva automaticamente il canvas ogni 30 secondi</div></div>' +
            '<div class="sm-row-right"><label class="sm-toggle"><input type="checkbox" id="sm-plane-autosave"><span class="sm-toggle-track"></span><span class="sm-toggle-thumb"></span></label></div>' +
          '</div>' +
          '<div class="sm-save-row"><span class="sm-save-feedback" id="sm-funzionalita-feedback">✓ Salvato</span><button class="sm-btn sm-btn-primary" id="sm-save-funzionalita">Salva</button></div>' +
        '</div>' +

        '<!-- Owl -->' +
        '<div class="sm-panel" id="sm-panel-owl">' +
          '<div class="sm-section-title">Owl</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Lingua risposta</div><div class="sm-row-sub">Lingua in cui Owl risponde</div></div>' +
            '<div class="sm-row-right">' +
              '<select class="sm-select" id="sm-owl-language">' +
                '<option value="it">🇮🇹 Italiano</option>' +
                '<option value="en">🇬🇧 English</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Tono risposte</div><div class="sm-row-sub">Stile di comunicazione di Owl</div></div>' +
            '<div class="sm-row-right">' +
              '<select class="sm-select" id="sm-owl-tone">' +
                '<option value="formal">Formale</option>' +
                '<option value="balanced">Bilanciato</option>' +
                '<option value="creative">Creativo</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="sm-save-row"><span class="sm-save-feedback" id="sm-owl-feedback">✓ Salvato</span><button class="sm-btn sm-btn-primary" id="sm-save-owl">Salva</button></div>' +
        '</div>' +

        '<!-- Plane -->' +
        '<div class="sm-panel" id="sm-panel-plane">' +
          '<div class="sm-section-title">Plane</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Griglia snap</div><div class="sm-row-sub">Aggancia elementi alla griglia durante il trascinamento</div></div>' +
            '<div class="sm-row-right"><label class="sm-toggle"><input type="checkbox" id="sm-plane-snap"><span class="sm-toggle-track"></span><span class="sm-toggle-thumb"></span></label></div>' +
          '</div>' +
          '<div class="sm-row">' +
            '<div class="sm-row-left"><div class="sm-row-label">Animazioni</div><div class="sm-row-sub">Abilita transizioni animate nel canvas</div></div>' +
            '<div class="sm-row-right"><label class="sm-toggle"><input type="checkbox" id="sm-plane-animations"><span class="sm-toggle-track"></span><span class="sm-toggle-thumb"></span></label></div>' +
          '</div>' +
          '<div class="sm-save-row"><span class="sm-save-feedback" id="sm-plane-feedback">✓ Salvato</span><button class="sm-btn sm-btn-primary" id="sm-save-plane">Salva</button></div>' +
        '</div>' +

      '</div>' + // .sm-content
    '</div>' + // .sm-dialog
  '</div>';  // #aike-settings-overlay
}
```

- [ ] **Step 2: Delete `initSettingsOverlay()` in bundle.js**

Find the entire function from `function initSettingsOverlay() {` through its closing `}` and delete it. Also delete `window.aikeOpenSettings = openSettings;` if it's outside the function.

- [ ] **Step 3: Commit**

```bash
git add assets/js/bundle.js
git commit -m "feat(settings): new sidebar modal HTML (7 sections)"
```

---

## Task 4: settings.js — controller + Supabase load/save

**Files:**
- Create: `assets/js/settings.js`

This file initializes the modal, wires all controls, loads settings from Supabase, and saves on button click.

- [ ] **Step 1: Create `assets/js/settings.js`**

```javascript
/**
 * AIKE — settings.js
 * Sidebar settings modal controller + Supabase persistence.
 * Loaded after bundle.js. Depends on: window.aikeSupabase, window.applyAvatarToHeader,
 * window.applyDisplayNameToDropdown (from bundle.js), window.aikeAuth (from auth.js).
 */

(function () {
  'use strict';

  var PLAN_LIMITS = { free: 30, basic: 300, pro: 1000 };

  // ── Supabase helpers ──────────────────────────────────────────

  async function getSettings(userId) {
    var sb = window.aikeSupabase.getClient();
    var r = await sb.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
    return r.data || null;
  }

  async function upsertSettings(userId, fields) {
    var sb = window.aikeSupabase.getClient();
    var r = await sb.from('user_settings').upsert(
      Object.assign({ user_id: userId, updated_at: new Date().toISOString() }, fields),
      { onConflict: 'user_id' }
    );
    return !r.error;
  }

  // ── Avatar localStorage (fast, no latency) ────────────────────

  function loadAvatar() {
    try { return JSON.parse(localStorage.getItem('aike_avatar') || 'null'); } catch(e) { return null; }
  }
  function saveAvatarLocal(obj) {
    try { localStorage.setItem('aike_avatar', JSON.stringify(obj)); } catch(e) {}
  }
  function loadDisplayName() {
    try { return localStorage.getItem('aike_display_name') || ''; } catch(e) { return ''; }
  }
  function saveDisplayNameLocal(n) {
    try { localStorage.setItem('aike_display_name', n); } catch(e) {}
  }

  // ── Show save feedback ────────────────────────────────────────

  function showFeedback(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('visible');
    setTimeout(function () { el.classList.remove('visible'); }, 2000);
  }

  // ── Populate UI from settings row ─────────────────────────────

  function populateUI(settings, user, profile) {
    // Generale
    var localeEl = document.getElementById('sm-locale');
    var notifEl  = document.getElementById('sm-email-notifications');
    if (localeEl) localeEl.value = (settings && settings.locale) || 'it';
    if (notifEl)  notifEl.checked = settings ? !!settings.email_notifications : true;

    // Account — avatar
    var avatar = loadAvatar();
    var previewEl = document.getElementById('sm-avatar-preview');
    if (previewEl && avatar) {
      previewEl.style.background = avatar.color;
      previewEl.textContent = avatar.emoji;
    }
    markSelectedAvatar(avatar ? avatar.id : -1);

    // Account — name
    var nameEl = document.getElementById('sm-display-name');
    if (nameEl) nameEl.value = loadDisplayName();

    // Account — email + verified badge
    var emailEl = document.getElementById('sm-email-value');
    var badgeEl = document.getElementById('sm-verified-badge');
    var verifyBtn = document.getElementById('sm-verify-btn');
    var email = user ? user.email : '';
    if (emailEl) emailEl.textContent = email;
    var isVerified = settings && settings.email_verified;
    if (badgeEl) {
      badgeEl.textContent = isVerified ? '✓ Verificata' : '✗ Non verificata';
      badgeEl.className = 'sm-verified-badge ' + (isVerified ? 'verified' : 'unverified');
    }
    if (verifyBtn) verifyBtn.style.display = isVerified ? 'none' : 'inline-flex';

    // Privacy
    var memEl = document.getElementById('sm-ai-memory');
    if (memEl) memEl.checked = settings ? !!settings.ai_memory_enabled : true;

    // Fatturazione (aesthetic)
    var planLabel = document.getElementById('sm-plan-label');
    var creditsFill = document.getElementById('sm-credits-fill');
    var creditsLabel = document.getElementById('sm-credits-label');
    var plan = (profile && profile.plan) || 'free';
    var limit = PLAN_LIMITS[plan] || 30;
    var used = (profile && profile.credits_used) || 0;
    if (planLabel) {
      planLabel.textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
    }
    if (creditsFill) creditsFill.style.width = Math.min(100, Math.round(used / limit * 100)) + '%';
    if (creditsLabel) creditsLabel.textContent = (limit - used) + ' / ' + limit + ' crediti';

    // Funzionalità
    var sugEl = document.getElementById('sm-ai-suggestions');
    var autosaveEl = document.getElementById('sm-plane-autosave');
    if (sugEl) sugEl.checked = settings ? !!settings.ai_suggestions : true;
    if (autosaveEl) autosaveEl.checked = settings ? !!settings.plane_autosave : true;

    // Owl
    var owlLangEl = document.getElementById('sm-owl-language');
    var owlToneEl = document.getElementById('sm-owl-tone');
    if (owlLangEl) owlLangEl.value = (settings && settings.owl_language) || 'it';
    if (owlToneEl) owlToneEl.value = (settings && settings.owl_tone) || 'balanced';

    // Plane
    var snapEl = document.getElementById('sm-plane-snap');
    var animEl = document.getElementById('sm-plane-animations');
    if (snapEl) snapEl.checked = settings ? !!settings.plane_snap_grid : false;
    if (animEl) animEl.checked = settings ? !!settings.plane_animations : true;
  }

  // ── Avatar grid ───────────────────────────────────────────────

  function markSelectedAvatar(id) {
    var grid = document.getElementById('sm-avatar-grid');
    if (!grid) return;
    grid.querySelectorAll('.sm-avatar-option').forEach(function(btn) {
      btn.classList.toggle('selected', parseInt(btn.dataset.avatarId) === id);
    });
  }

  // ── Init ──────────────────────────────────────────────────────

  async function initSettings() {
    var overlay = document.getElementById('aike-settings-overlay');
    if (!overlay) return;

    var user = await window.aikeAuth.getSessionUser();
    var settings = null;
    var profile = null;

    // ── Nav switching ─────────────────────────────────────────
    var navItems = overlay.querySelectorAll('.sm-nav-item');
    var panels   = overlay.querySelectorAll('.sm-panel');

    navItems.forEach(function(item) {
      item.addEventListener('click', function() {
        navItems.forEach(function(n) { n.classList.remove('active'); });
        panels.forEach(function(p) { p.classList.remove('active'); });
        item.classList.add('active');
        var panel = document.getElementById('sm-panel-' + item.dataset.panel);
        if (panel) panel.classList.add('active');
      });
    });

    // ── Open / Close ─────────────────────────────────────────
    function closeSettings() {
      overlay.classList.remove('overlay-open');
      document.body.style.overflow = '';
    }

    async function openSettings() {
      overlay.classList.add('overlay-open');
      document.body.style.overflow = 'hidden';

      // Reset to first panel
      navItems.forEach(function(n) { n.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      var firstNav = overlay.querySelector('.sm-nav-item');
      if (firstNav) firstNav.classList.add('active');
      var firstPanel = document.getElementById('sm-panel-generale');
      if (firstPanel) firstPanel.classList.add('active');

      // Load user + settings fresh
      user = await window.aikeAuth.getSessionUser();
      if (user) {
        settings = await getSettings(user.id);
        profile  = await window.aikeAuth.getProfile(user.id);
      }
      populateUI(settings, user, profile);
    }

    var closeBtn = document.getElementById('sm-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeSettings);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeSettings();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('overlay-open')) closeSettings();
    });

    window.aikeOpenSettings = openSettings;

    // ── Avatar toggle ─────────────────────────────────────────
    var avatarToggleBtn = document.getElementById('sm-avatar-toggle-btn');
    var avatarGridWrap  = document.getElementById('sm-avatar-grid-wrap');
    if (avatarToggleBtn) {
      avatarToggleBtn.addEventListener('click', function() {
        var open = avatarGridWrap.style.display === 'block';
        avatarGridWrap.style.display = open ? 'none' : 'block';
        avatarToggleBtn.textContent = open ? 'Cambia' : 'Chiudi';
      });
    }

    var avatarGrid = document.getElementById('sm-avatar-grid');
    if (avatarGrid) {
      avatarGrid.addEventListener('click', function(e) {
        var btn = e.target.closest('.sm-avatar-option');
        if (!btn) return;
        var avatarObj = {
          id: parseInt(btn.dataset.avatarId),
          emoji: btn.dataset.emoji,
          color: btn.dataset.color
        };
        markSelectedAvatar(avatarObj.id);
        var previewEl = document.getElementById('sm-avatar-preview');
        if (previewEl) {
          previewEl.style.background = avatarObj.color;
          previewEl.textContent = avatarObj.emoji;
        }
        // Persist locally immediately
        saveAvatarLocal(avatarObj);
        if (window.applyAvatarToHeader) {
          var emailForHeader = user ? user.email : '';
          window.applyAvatarToHeader(avatarObj, emailForHeader);
        }
      });
    }

    // ── Save: Generale ────────────────────────────────────────
    var saveGenerale = document.getElementById('sm-save-generale');
    if (saveGenerale) {
      saveGenerale.addEventListener('click', async function() {
        if (!user) return;
        var locale = document.getElementById('sm-locale').value;
        var emailNotif = document.getElementById('sm-email-notifications').checked;
        // Apply locale via i18n
        if (window.aikeI18n && window.aikeI18n.setLang) window.aikeI18n.setLang(locale);
        var ok = await upsertSettings(user.id, { locale: locale, email_notifications: emailNotif });
        if (ok) showFeedback('sm-generale-feedback');
      });
    }

    // ── Save: Account (name only — avatar saved on pick) ─────
    var saveAccount = document.getElementById('sm-save-account');
    if (saveAccount) {
      saveAccount.addEventListener('click', async function() {
        if (!user) return;
        var name = (document.getElementById('sm-display-name').value || '').trim();
        saveDisplayNameLocal(name);
        if (window.applyDisplayNameToDropdown) {
          window.applyDisplayNameToDropdown(name, user.email);
        }
        showFeedback('sm-account-feedback');
      });
    }

    // ── Password reset ────────────────────────────────────────
    var resetPwBtn = document.getElementById('sm-reset-password-btn');
    if (resetPwBtn) {
      resetPwBtn.addEventListener('click', async function() {
        if (!user) return;
        var sb = window.aikeSupabase.getClient();
        var r = await sb.auth.resetPasswordForEmail(user.email, {
          redirectTo: window.location.origin + '/pages/login.html'
        });
        if (!r.error) {
          resetPwBtn.textContent = 'Email inviata ✓';
          resetPwBtn.disabled = true;
          setTimeout(function() {
            resetPwBtn.textContent = 'Cambia password';
            resetPwBtn.disabled = false;
          }, 5000);
        }
      });
    }

    // ── Delete account ────────────────────────────────────────
    var deleteAccountBtn = document.getElementById('sm-delete-account-btn');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', function() {
        if (!confirm('Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.')) return;
        // Requires service role — inform user to contact support for now
        alert('Per eliminare l\'account contatta support@aike.ai');
      });
    }

    // ── Save: Privacy ─────────────────────────────────────────
    var savePrivacy = document.getElementById('sm-save-privacy');
    if (savePrivacy) {
      savePrivacy.addEventListener('click', async function() {
        if (!user) return;
        var aiMemory = document.getElementById('sm-ai-memory').checked;
        var ok = await upsertSettings(user.id, { ai_memory_enabled: aiMemory });
        if (ok) showFeedback('sm-privacy-feedback');
      });
    }

    // ── Export data ───────────────────────────────────────────
    var exportBtn = document.getElementById('sm-export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', async function() {
        if (!user) return;
        var data = { email: user.email, settings: settings };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'aike-data.json'; a.click();
        URL.revokeObjectURL(url);
      });
    }

    // ── Delete data ───────────────────────────────────────────
    var deleteDataBtn = document.getElementById('sm-delete-data-btn');
    if (deleteDataBtn) {
      deleteDataBtn.addEventListener('click', async function() {
        if (!user) return;
        if (!confirm('Eliminare tutte le impostazioni? L\'account non verrà eliminato.')) return;
        var sb = window.aikeSupabase.getClient();
        await sb.from('user_settings').delete().eq('user_id', user.id);
        settings = null;
        populateUI(null, user, profile);
        alert('Dati eliminati.');
      });
    }

    // ── Save: Funzionalità ────────────────────────────────────
    var saveFunz = document.getElementById('sm-save-funzionalita');
    if (saveFunz) {
      saveFunz.addEventListener('click', async function() {
        if (!user) return;
        var ok = await upsertSettings(user.id, {
          ai_suggestions:  document.getElementById('sm-ai-suggestions').checked,
          plane_autosave:  document.getElementById('sm-plane-autosave').checked
        });
        if (ok) showFeedback('sm-funzionalita-feedback');
      });
    }

    // ── Save: Owl ─────────────────────────────────────────────
    var saveOwl = document.getElementById('sm-save-owl');
    if (saveOwl) {
      saveOwl.addEventListener('click', async function() {
        if (!user) return;
        var ok = await upsertSettings(user.id, {
          owl_language: document.getElementById('sm-owl-language').value,
          owl_tone:     document.getElementById('sm-owl-tone').value
        });
        if (ok) showFeedback('sm-owl-feedback');
      });
    }

    // ── Save: Plane ───────────────────────────────────────────
    var savePlane = document.getElementById('sm-save-plane');
    if (savePlane) {
      savePlane.addEventListener('click', async function() {
        if (!user) return;
        var ok = await upsertSettings(user.id, {
          plane_snap_grid:   document.getElementById('sm-plane-snap').checked,
          plane_animations:  document.getElementById('sm-plane-animations').checked
        });
        if (ok) showFeedback('sm-plane-feedback');
      });
    }

    // ── OTP flow (see Task 6 for edge function) ───────────────
    window._smInitOTP = function(userRef, settingsRef) {
      // Injected by Task 6 initialization block below
    };
  }

  // ── Boot ──────────────────────────────────────────────────────

  function boot() {
    var overlay = document.getElementById('aike-settings-overlay');
    if (overlay) {
      initSettings();
    } else {
      // Wait for bundle.js to inject the modal
      var observer = new MutationObserver(function(_, obs) {
        if (document.getElementById('aike-settings-overlay')) {
          obs.disconnect();
          initSettings();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/settings.js
git commit -m "feat(settings): settings.js controller with Supabase load/save"
```

---

## Task 5: Edge function — verify-email.js

**Files:**
- Create: `functions/api/verify-email.js`

- [ ] **Step 1: Create `functions/api/verify-email.js`**

```javascript
/**
 * AIKE — functions/api/verify-email.js
 * POST /api/verify-email
 * Body: { action: 'send' | 'verify', email: string, token?: string }
 * Auth: Bearer JWT required
 *
 * send   → sends OTP via Supabase signInWithOtp (no new user created)
 * verify → validates OTP, marks email_verified=true in user_settings
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  var supabaseUrl = env.SUPABASE_URL;
  var serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return json({ error: 'Server misconfigured' }, 500);

  // ── Auth: verify JWT ──────────────────────────────────────────
  var authHeader = request.headers.get('Authorization') || '';
  var jwt = authHeader.replace('Bearer ', '').trim();
  if (!jwt) return json({ error: 'Unauthorized' }, 401);

  var userRes = await fetch(supabaseUrl + '/auth/v1/user', {
    headers: { Authorization: 'Bearer ' + jwt, apikey: serviceKey }
  });
  if (!userRes.ok) return json({ error: 'Unauthorized' }, 401);
  var userData = await userRes.json();
  var userId = userData.id;
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  // ── Parse body ────────────────────────────────────────────────
  var body;
  try { body = await request.json(); } catch(e) { return json({ error: 'Invalid JSON' }, 400); }
  var action = body.action;
  var email  = body.email;
  var token  = body.token;

  if (!action || !email) return json({ error: 'Missing action or email' }, 400);

  // ── Send OTP ──────────────────────────────────────────────────
  if (action === 'send') {
    var sendRes = await fetch(supabaseUrl + '/auth/v1/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: 'Bearer ' + serviceKey
      },
      body: JSON.stringify({
        email: email,
        create_user: false,
        options: { shouldCreateUser: false }
      })
    });
    if (!sendRes.ok) {
      var errData = await sendRes.json().catch(function() { return {}; });
      // Rate limit
      if (sendRes.status === 429) return json({ error: 'rate_limit' }, 429);
      return json({ error: errData.msg || 'Failed to send OTP' }, 500);
    }
    return json({ ok: true });
  }

  // ── Verify OTP ────────────────────────────────────────────────
  if (action === 'verify') {
    if (!token) return json({ error: 'Missing token' }, 400);

    var verifyRes = await fetch(supabaseUrl + '/auth/v1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: 'Bearer ' + serviceKey
      },
      body: JSON.stringify({ type: 'magiclink', email: email, token: token })
    });

    if (!verifyRes.ok) return json({ error: 'invalid_token' }, 400);

    // Mark email_verified = true in user_settings
    await fetch(supabaseUrl + '/rest/v1/user_settings?user_id=eq.' + userId, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: 'Bearer ' + serviceKey,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ email_verified: true, updated_at: new Date().toISOString() })
    });

    return json({ ok: true, verified: true });
  }

  return json({ error: 'Unknown action' }, 400);
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/verify-email.js
git commit -m "feat(settings): verify-email edge function (OTP send/verify)"
```

---

## Task 6: OTP UI wiring in settings.js

**Files:**
- Modify: `assets/js/settings.js` — replace the `window._smInitOTP` stub with full OTP logic

- [ ] **Step 1: In `settings.js`, find the line:**

```javascript
    window._smInitOTP = function(userRef, settingsRef) {
      // Injected by Task 6 initialization block below
    };
```

Replace it with:

```javascript
    // ── OTP flow ──────────────────────────────────────────────
    var otpForm      = document.getElementById('sm-otp-form');
    var otpInput     = document.getElementById('sm-otp-input');
    var otpError     = document.getElementById('sm-otp-error');
    var otpConfirm   = document.getElementById('sm-otp-confirm');
    var otpCancel    = document.getElementById('sm-otp-cancel');
    var otpResend    = document.getElementById('sm-otp-resend');
    var otpCountdown = document.getElementById('sm-otp-countdown');
    var verifyBtn    = document.getElementById('sm-verify-btn');
    var verifyBadge  = document.getElementById('sm-verified-badge');
    var countdownTimer = null;

    function startCountdown(seconds) {
      clearInterval(countdownTimer);
      otpResend.style.pointerEvents = 'none';
      otpResend.style.opacity = '0.4';
      var remaining = seconds;
      otpCountdown.textContent = '(' + remaining + 's)';
      countdownTimer = setInterval(function() {
        remaining--;
        if (remaining <= 0) {
          clearInterval(countdownTimer);
          otpCountdown.textContent = '';
          otpResend.style.pointerEvents = '';
          otpResend.style.opacity = '';
        } else {
          otpCountdown.textContent = '(' + remaining + 's)';
        }
      }, 1000);
    }

    async function sendOTP() {
      if (!user) return;
      var sb = window.aikeSupabase.getClient();
      var session = await sb.auth.getSession();
      var jwt = session.data && session.data.session ? session.data.session.access_token : '';
      var inPages = window.location.pathname.includes('/pages/');
      var base = inPages ? '../' : '';
      try {
        var r = await fetch(base + 'api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
          body: JSON.stringify({ action: 'send', email: user.email })
        });
        var data = await r.json();
        if (!r.ok) {
          if (data.error === 'rate_limit') {
            otpError.textContent = 'Troppi tentativi. Aspetta qualche minuto.';
            otpError.classList.add('visible');
          }
          return false;
        }
        return true;
      } catch(e) { return false; }
    }

    if (verifyBtn) {
      verifyBtn.addEventListener('click', async function() {
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Invio...';
        otpError.classList.remove('visible');
        var sent = await sendOTP();
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verifica email';
        if (sent) {
          otpForm.classList.add('visible');
          otpInput.value = '';
          otpInput.focus();
          startCountdown(60);
        }
      });
    }

    if (otpResend) {
      otpResend.addEventListener('click', async function() {
        otpError.classList.remove('visible');
        await sendOTP();
        startCountdown(60);
      });
    }

    if (otpCancel) {
      otpCancel.addEventListener('click', function() {
        otpForm.classList.remove('visible');
        otpInput.value = '';
        otpError.classList.remove('visible');
        clearInterval(countdownTimer);
      });
    }

    if (otpConfirm) {
      otpConfirm.addEventListener('click', async function() {
        var token = (otpInput.value || '').trim();
        if (token.length !== 6) {
          otpError.textContent = 'Inserisci un codice a 6 cifre.';
          otpError.classList.add('visible');
          return;
        }
        otpConfirm.disabled = true;
        otpConfirm.textContent = 'Verifica...';
        otpError.classList.remove('visible');

        var sb = window.aikeSupabase.getClient();
        var session = await sb.auth.getSession();
        var jwt = session.data && session.data.session ? session.data.session.access_token : '';
        var inPages = window.location.pathname.includes('/pages/');
        var base = inPages ? '../' : '';

        try {
          var r = await fetch(base + 'api/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
            body: JSON.stringify({ action: 'verify', email: user.email, token: token })
          });
          var data = await r.json();
          if (r.ok && data.verified) {
            // Success
            clearInterval(countdownTimer);
            otpForm.classList.remove('visible');
            if (verifyBadge) {
              verifyBadge.textContent = '✓ Verificata';
              verifyBadge.className = 'sm-verified-badge verified';
            }
            if (verifyBtn) verifyBtn.style.display = 'none';
            // Show header badge
            var statusEl = document.getElementById('auth-avatar-status');
            if (statusEl) statusEl.style.display = 'flex';
            // Update local settings cache
            if (settings) settings.email_verified = true;
          } else {
            otpError.textContent = 'Codice errato o scaduto. Riprova.';
            otpError.classList.add('visible');
          }
        } catch(e) {
          otpError.textContent = 'Errore di rete. Riprova.';
          otpError.classList.add('visible');
        }

        otpConfirm.disabled = false;
        otpConfirm.textContent = 'Conferma';
      });
    }

    // Only allow digits
    if (otpInput) {
      otpInput.addEventListener('input', function() {
        otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 6);
      });
    }
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/settings.js
git commit -m "feat(settings): OTP email verification UI wiring"
```

---

## Task 7: Verified badge in auth.js

**Files:**
- Modify: `assets/js/auth.js` — `updateHeader()` function to show/hide `#auth-avatar-status`

- [ ] **Step 1: In `auth.js`, inside `updateHeader(user, profile)`, after the line:**

```javascript
      var isAdmin = profile && profile.is_admin;
```

Add:

```javascript
      // Show/hide verified badge — read from user_settings
      (async function() {
        try {
          var sb = window.aikeSupabase.getClient();
          var r = await sb.from('user_settings')
            .select('email_verified')
            .eq('user_id', user.id)
            .maybeSingle();
          var statusEl = document.getElementById('auth-avatar-status');
          if (statusEl) {
            statusEl.style.display = (r.data && r.data.email_verified) ? 'flex' : 'none';
          }
        } catch(e) {}
      })();
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/auth.js
git commit -m "feat(settings): show verified badge in header from user_settings"
```

---

## Task 8: Add settings.js to all pages

**Files:**
- Modify: `index.html` and all files in `pages/*.html` (except `admin.html`, `admin-preview.html`, `success.html`)

Pages to update: `index.html`, `pages/owl.html`, `pages/plane.html`, `pages/pricing.html`, `pages/solutions.html`, `pages/stories.html`, `pages/login.html`, `pages/signup.html`, `pages/privacy.html`

- [ ] **Step 1: In `index.html`, after the line `<script src="assets/js/bundle.js"></script>`, add:**

```html
<script src="assets/js/settings.js"></script>
```

- [ ] **Step 2: In each `pages/*.html` listed above, after `<script src="../assets/js/bundle.js"></script>`, add:**

```html
<script src="../assets/js/settings.js"></script>
```

- [ ] **Step 3: Verify the settings button in the dropdown calls `window.aikeOpenSettings()`**

In `bundle.js`, find the `#auth-settings-btn` click handler. It should call `window.aikeOpenSettings()`. Find the section around line 48 in the header HTML:

```javascript
'<button id="auth-settings-btn" role="menuitem" class="dropdown-item">
```

In `bundle.js` find where `auth-settings-btn` click is wired (search for `auth-settings-btn` in the controller section). Ensure it calls `window.aikeOpenSettings && window.aikeOpenSettings()`. If it currently calls the old function, update it.

- [ ] **Step 4: Commit**

```bash
git add index.html pages/owl.html pages/plane.html pages/pricing.html pages/solutions.html pages/stories.html pages/login.html pages/signup.html pages/privacy.html assets/js/bundle.js
git commit -m "feat(settings): wire settings.js into all pages"
```

---

## Task 9: Manual test checklist + push

- [ ] **Step 1: Open `index.html` locally, log in, click profile icon → Impostazioni**
  - Modal opens with sidebar layout
  - All 7 sections are clickable and switch content

- [ ] **Step 2: Test Generale**
  - Change language → click Salva → feedback "✓ Salvato" appears
  - Reload page → open settings again → language select shows saved value

- [ ] **Step 3: Test Account**
  - Change avatar → header updates immediately
  - Change name → click Salva → dropdown name updates
  - Click "Verifica email" → OTP form appears
  - Enter 6-digit code → success → badge shows "✓ Verificata"
  - Reload → header shows verified checkmark badge

- [ ] **Step 4: Test Privacy, Funzionalità, Owl, Plane**
  - Toggle switches → click Salva → "✓ Salvato" appears
  - Reload → values persist

- [ ] **Step 5: Push branch**

```bash
git push origin feature/settings-modal
```

---

## Self-Review Notes

- **Spec coverage:** All 7 sections implemented ✓. OTP flow ✓. Verified badge ✓. Fatturazione aesthetic ✓. Avatar picker ✓.
- **Env var:** Edge function uses `SUPABASE_SERVICE_ROLE_KEY` (matching existing `credits.js` pattern) ✓
- **Table name:** `user_settings` throughout (consistent) ✓
- **Base path:** OTP fetch uses `inPages` check to resolve `../api/` vs `api/` correctly ✓
- **No placeholders:** All steps have complete code ✓
- **Delete account:** Deferred to support email — service role key not exposed client-side ✓ (per security rules)
