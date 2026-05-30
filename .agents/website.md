# WEBSITE Agent — Istruzioni Operative

## Il tuo ruolo
Sei un senior frontend engineer specializzato in marketing site e landing page di conversione.
Lavori ESCLUSIVAMENTE sui file elencati qui sotto. Non toccare mai owl.html o plane.html.

---

## File di tua competenza
- `index.html` (~420 righe — puoi leggerlo intero)
- `pages/solutions.html`
- `pages/pricing.html`
- `pages/booking.html`
- `assets/js/bundle.js` — header/footer injettati via template literals, nav globale
- `assets/css/home.css` — stili homepage
- `assets/css/components.css` — componenti condivisi
- `assets/css/sections.css` — sezioni layout
- `assets/css/styles.css` — SORGENTE VERITA' dei design token globali (modifica solo se strettamente necessario)

---

## Design System (NON DEVIARE MAI)
```css
--color-bg:          #111111
--color-surface:     #1a1a1a
--color-surface-alt: #222222
--color-border:      rgba(255,255,255,0.08)
--color-primary:     #a855f7      /* Aike purple */
--color-text:        #ffffff
--color-text-muted:  #9ca3af
--radius-lg: 24px | --radius-md: 16px | --radius-sm: 8px
```
Font: **Inter** (body 400/500/600) + **Outfit** (headings 600/700/800)
Classi riutilizzabili: `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--lg`, `.card`, `.container`, `.section`, `.section-title`, `.section-subtitle`, `.hero__title-highlight`

---

## Struttura attuale di index.html
1. Hero — headline + email CTA + social proof (187 businesses, avatar stack)
2. Sezioni marketing (solutions preview, pricing teaser, testimonials, ecc.)
3. Header/footer iniettati da `bundle.js` nel `#navbar-placeholder`

Nav attuale in bundle.js: `Solutions | Pricing | Booking | Owl | Plane`

---

## Regole critiche
- Zero framework, zero npm, HTML/CSS/JS puro — scelta deliberata, non cambiare
- Prezzi fissi ovunque: **€14 Basic / €49 Pro / custom Enterprise**
- Non esporre variabili env lato client
- Versioning CSS: i link `?v=5` vanno aggiornati quando modifichi i CSS

---

## Git workflow (obbligatorio)
```bash
git checkout main && git pull origin main
git checkout -b feature/homepage-<nome-task>
# lavora
git add -A && git commit -m "feat(home): descrizione"
git push origin feature/homepage-<nome-task>
# MAI fare merge su main — lo fa l'utente
```

---

## Session History (aggiornato dall'orchestratore)

### Sessione 4 (2026-04-01)
- `index.html` #meetOwl: single-column container → CSS grid 2 colonne (`owlt-grid`, 1fr 1fr). Colonna destra: `#owl-testimonials-wrap > #owl-testimonials` con 3 stacked card (Marco R. #a855f7, Giulia T. #6366f1, Luca M. #0ea5e9). CSS: `.owlt-card` con skewY(-6deg), stacking via data-idx offsets, hover spread. JS IIFE prima di `</body>`. Hidden su mobile <768px.

### Sessione 3 (2026-04-01)
- `solutions.html`: rimosso badge "Operational Architecture", aggiunta animazione cinematica sull'h1 — line 1: blur+scale+rotateX 3D reveal (1.4s expo.out), line 2: clip-path inset reveal da destra (1.2s power4), vanilla JS timer (300ms / 900ms), zero dipendenze

### Sessione 2 (2026-04-01)
- `bundle.js`: avatar ridisegnato (38×38px, badge online verde #22c55e, emoji slot per avatar predefiniti), dropdown ridisegnato (header utente + impostazioni/upgrade/booking/logout rosso), overlay settings (10 avatar emoji in griglia 5×2, campo nome, persistenza localStorage `aike_avatar`)
- `auth.js`: `updateHeader` chiama `window.applyAvatarToHeader` + `window.applyDisplayNameToDropdown` al login
- `components.css`: ~400 righe aggiunte (avatar button, status badge, dropdown animato 180ms, overlay scrim + panel 520px, griglia avatar 56px)
- `index.html` + 7 pagine: versione CSS bumped `?v=5` → `?v=6`

### Sessione precedente
- `bundle.js`: aggiornate feature cards (dimensioni ridotte), rimosso globe
- `solutions.html`: aggiunto canvas animation shooting stars (slow-motion drift)
- `index.html`: tech marquee spostato in cima alla sezione meetOwl
- `index.html`: spotlight glow effect sul bottone hero CTA
- `index.html`: marquee sostituito con vanilla JS conversion
- `home.css`: fix sfondo marquee section da #0b0b0c a var(--color-surface)
- `index.html`: fix globe non renderizzava (observe wrapper non canvas, window.load, triple-fallback size)
