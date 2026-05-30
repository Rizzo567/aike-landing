# Settings Modal + Email Verification — Design Spec
**Date:** 2026-04-03  
**Status:** Approved

---

## Overview

Sostituisce il modal impostazioni esistente (tab Profilo/Account in `bundle.js`) con un'interfaccia completa a sidebar ispirata alle impostazioni di Claude. Aggiunge verifica email via OTP con badge verificato nell'header.

---

## 1. Modal Structure

**Dimensioni:** `min(900px, 94vw)` × `min(620px, 88vh)`  
**Posizione:** centrato, overlay `rgba(0,0,0,0.7)` con `backdrop-filter: blur(4px)` dietro  
**Animazione:** scale(0.96)+translateY(10px) → scale(1)+translateY(0), 250ms cubic-bezier(0.16,1,0.3,1)  
**Chiusura:** click ✕, click overlay, tasto Escape

**Layout interno:**
- Sidebar sinistra: 200px fissi, `background: #0f0f0f`, border-right 1px
- Contenuto destra: flex:1, padding 28px 32px, overflow-y: auto

**Sidebar nav item (attivo):**
- Background: `rgba(168,85,247,0.1)`
- Border-right: 2px solid `#a855f7`
- Color: `#fff`, font-weight: 600

**Entry point:** voce "Impostazioni" nel dropdown profilo → `openSettings()`. Rimuovere il vecchio modal.

---

## 2. Sezioni

### Generale
- **Lingua:** select IT / EN → salva in `profiles.locale`
- **Notifiche email:** toggle → salva in `profiles.email_notifications`

### Account
- **Avatar:** mostra avatar corrente + bottone "Cambia" → apre picker esistente
- **Nome visualizzato:** input editabile → salva in `profiles.display_name` (bottone Salva)
- **Email:** readonly. Se non verificata: badge rosso "Non verificata" + bottone "Verifica". Se verificata: badge verde "Verificata ✓"
- **Password:** bottone "Cambia password" → invia reset email via Supabase Auth
- **Zona pericolosa:** bottone "Elimina account" → confirm dialog → `auth.admin.deleteUser()`

### Privacy
- **Memoria AI:** toggle → salva in `profiles.ai_memory_enabled`
- **Esporta dati:** bottone → scarica JSON con dati profilo utente
- **Elimina tutti i dati:** bottone rosso → confirm dialog → svuota dati profilo (non elimina account)

### Fatturazione *(solo estetica)*
- **Piano attivo:** badge (Free / Basic / Pro) letto da `profiles.plan`
- **Crediti rimasti:** barra progress + numero, letto da `profiles.credits_used` / plan limit
- **Storico pagamenti:** lista placeholder "Nessun pagamento registrato"

### Funzionalità
- **Suggerimenti AI:** toggle → salva in `profiles.ai_suggestions`
- **Salvataggio automatico (Plane):** toggle → salva in `profiles.plane_autosave`

### Owl
- **Lingua risposta:** select IT / EN → salva in `profiles.owl_language`
- **Tono risposte:** select Formale / Bilanciato / Creativo → salva in `profiles.owl_tone`

### Plane
- **Griglia snap:** toggle → salva in `profiles.plane_snap_grid`
- **Animazioni:** toggle → salva in `profiles.plane_animations`

---

## 3. Persistenza impostazioni

**Tabella Supabase:** `profiles` (già esistente o da creare se assente)

| Colonna | Tipo | Default |
|---------|------|---------|
| `locale` | text | 'it' |
| `email_notifications` | boolean | true |
| `ai_memory_enabled` | boolean | true |
| `ai_suggestions` | boolean | true |
| `plane_autosave` | boolean | true |
| `plane_snap_grid` | boolean | false |
| `plane_animations` | boolean | true |
| `owl_language` | text | 'it' |
| `owl_tone` | text | 'balanced' |
| `email_verified` | boolean | false |
| `display_name` | text | null |

**Pattern salvataggio:** al cambio di ogni controllo → `PATCH /rest/v1/profiles?id=eq.{user_id}` con `Authorization: Bearer {jwt}`.  
**Pattern caricamento:** all'apertura del modal → `GET /rest/v1/profiles?id=eq.{user_id}&select=*`.  
**Client-side only** — nessuna Cloudflare Function necessaria per le impostazioni (il JWT utente ha accesso diretto con RLS).

---

## 4. Email Verification (OTP)

### Flusso utente
1. Sezione Account → email row → badge "Non verificata" + bottone "Verifica"
2. Click "Verifica" → inline OTP form appare sotto la riga email:
   - Campo input 6 cifre (autofocus, solo numeri)
   - Link "Invia di nuovo" con countdown 60s
   - Bottone "Conferma"
3. Click "Verifica" → chiama `POST /api/verify-email` con `{ action: 'send', email }`
4. Utente inserisce OTP → chiama `POST /api/verify-email` con `{ action: 'verify', email, token }`
5. Se valido → Supabase `verifyOtp()` → update `profiles.email_verified = true`
6. Badge header `#auth-avatar-status` diventa visibile (già nel markup)

### Edge Function: `functions/api/verify-email.js`

```
POST /api/verify-email
Body: { action: 'send' | 'verify', email: string, token?: string }
Auth: Bearer JWT (obbligatoria)

send  → supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
verify → supabase.auth.verifyOtp({ email, token, type: 'email' })
        → se ok: PATCH profiles set email_verified=true
```

**ENV:** usa `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` già disponibili.

### Badge header
- `#auth-avatar-status`: già presente nel DOM (SVG checkmark blu)
- Logica: al login e all'apertura modal → legge `profiles.email_verified`
- Se `true` → `style="display:flex"` sull'elemento status
- Se `false` → `style="display:none"`

---

## 5. File da creare/modificare

| File | Azione |
|------|--------|
| `assets/js/bundle.js` | Sostituisce modal impostazioni esistente con nuovo sistema |
| `assets/css/components.css` | Aggiunge stili `.settings-modal`, `.settings-sidebar`, `.settings-nav-item`, `.settings-content`, OTP form |
| `functions/api/verify-email.js` | Nuova edge function OTP |
| *(Supabase)* | Colonne `profiles` da aggiungere se assenti |

---

## 6. Vincoli tecnici

- Stack puro HTML/CSS/JS — nessun framework, nessun npm
- Cloudflare Pages Functions (edge, no Node) per `verify-email.js`
- Design system AIKE: variabili CSS da `styles.css`, nessuna deviazione
- MAI pushare su `main` — branch: `feature/settings-modal`
- Il modal esistente (tab-based) viene **rimosso** e sostituito completamente
