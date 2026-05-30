# Aike — Claude Code Context

## Model Policy
- Coding, debugging, architettura, ragionamento → **Opus 4.8** (`claude-opus-4-8`) SEMPRE
- Riscrittura testi, azioni ripetitive, formatting → Sonnet 4.6
- Regola permanente dal 2026-05-29, nessuna eccezione

## What This Is

Aike è una SaaS di automazione business premium. Stack statico (HTML/CSS/JS puro, zero framework, zero build tool) su Cloudflare Pages con Supabase per auth + DB e Stripe Checkout per pagamenti.

---

## Stack & File Map

```
index.html                  → Homepage principale
pages/
  owl.html                 → App Owl (chat AI, ~5000 righe — file più grande)
  pricing.html              → Prezzi €14 / €49 / custom
  solutions.html            → Soluzioni
  booking.html              → Prenotazione call
  login.html / signup.html  → Auth pages
  admin.html                → Dashboard admin (protetta)
  stories.html              → Success stories
  owl.html                 → Workspace AI

functions/api/              → Cloudflare Pages Functions (edge, no Node)
  chat.js                   → Chat API con auth JWT + credit deduction
  image.js                  → Image generation con auth JWT + credit deduction
  credits.js                → Credits management con optimistic locking
  track.js                  → Analytics tracking

assets/css/
  styles.css                → Design tokens e reset (FONTE DI VERITA' per variabili CSS)
  home.css                  → Stili homepage
  components.css            → Componenti condivisi
  sections.css              → Sezioni layout
  pages.css                 → Stili pagine interne

assets/js/
  config.js                 → Supabase URL, Stripe payment links, configurazione
  auth.js                   → Sessione utente, login/logout, header injection
  bundle.js                 → Header e footer injettati via template literals
  components.js             → Componenti riutilizzabili
  stripe-checkout.js        → Redirect a Stripe Checkout
  analytics.js              → Tracking visite

netlify/edge-functions/     → Edge functions Netlify (legacy/alternative)
```

---

## Design System (NON DEVIARE MAI)

```css
--color-bg:          #111111      /* sfondo principale */
--color-surface:     #1a1a1a      /* card, panel */
--color-surface-alt: #222222      /* hover states */
--color-border:      rgba(255,255,255,0.08)
--color-primary:     #a855f7      /* Aike purple — colore brand */
--color-text:        #ffffff
--color-text-muted:  #9ca3af
--font-sans:         Inter
--font-display:      Inter (headings 700-800)
--radius-lg:         24px
--radius-md:         16px
--radius-sm:         8px
```

Classi standard riutilizzabili: `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--lg`, `.card`, `.container`, `.section`, `.section-title`, `.section-subtitle`, `.hero__title-highlight` (purple gradient highlight).

---

## Cloudflare Functions — Pattern Obbligatorio

```javascript
export async function onRequest({ request, env }) {
  // Auth JWT obbligatoria su tutti gli endpoint privati
  const jwt = request.headers.get('Authorization')?.replace('Bearer ', '');
  // Verifica via GET /auth/v1/user con service role key
  // Credit deduction con optimistic locking (PATCH filter su used=eq.N)
  // Se 0 righe aggiornate → 409 CONCURRENT_REQUEST
}
```

**ENV vars richieste:** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

---

## Crediti & Piani

```javascript
PLAN_LIMITS = { free: 30, basic: 300, pro: 1000 }
IMAGE_CREDIT_COST = { 'dall-e-3': 3, 'nano-banana-pro': 3, 'nano-banana-2': 2 }
CHAT_CREDIT_COST = 1 // per messaggio
```

---

## Regole Critiche

1. **Non toccare `assets/css/styles.css`** senza motivo — contiene i design token globali
2. **Non usare framework** (React, Vue, etc.) — il progetto è HTML/CSS/JS puro per scelta deliberata
3. **Non introdurre dipendenze npm** — niente package.json, niente bundler
4. **Design system sempre rispettato** — ogni nuovo componente usa le variabili CSS esistenti
5. **Prezzi fissi**: €14 Basic / €49 Pro / custom — consistenti ovunque
6. **Sicurezza**: mai esporre `SUPABASE_SERVICE_KEY` lato client — solo nelle Functions
7. **Optimistic locking** per tutte le operazioni sui crediti — pattern già in chat.js/image.js

---

## Come Deployare

Cloudflare Pages: push su `main` → deploy automatico.
- Functions in `functions/api/` vengono deployate come edge functions automaticamente
- ENV vars configurate nel dashboard Cloudflare

---

## File Grandi — Attenzione al Contesto

- `pages/owl.html` → ~5200 righe. Leggi solo la sezione necessaria con offset/limit.
- `index.html` → ~420 righe. Si può leggere intero.

---

## Branch & Git

- Branch principale: `main`
- **MAI pushare direttamente su main** — lavora sempre su un feature branch
- Workflow obbligatorio:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/<nome-task>` (es. `feature/owl-hero`, `feature/homepage-nav`)
  3. Fai il lavoro
  4. `git add -A && git commit -m "feat(scope): descrizione"`
  5. `git push origin feature/<nome-task>`
  6. Il merge su main lo fa l'utente manualmente
- Commit con prefisso: `feat(scope):`, `fix(scope):`, `refactor(scope):`
- Agenti paralleli: ognuno su branch separato per evitare conflitti
