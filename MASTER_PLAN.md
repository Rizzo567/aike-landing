# MASTER PLAN — AIKE Website Frontend & Booking System
Data: 2026-04-10

## Obiettivo
Trasformare il sito AIKE da vetrina prodotto/SaaS a sito commerciale operativo che vende 4 servizi (Website Creation, Marketing, Automazioni, AIKE Motion), con booking system funzionante per acquisizione lead.

## Architettura Booking System

### Flusso
```
[booking.html form] 
  → POST /api/leads (server Hetzner :3000)
    → INSERT in Supabase tabella `leads`
    → Invio email notifica a Manuel via SMTP (Resend/Nodemailer)
    → Response 201 al client
```

### Schema tabella `leads`
```sql
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  service TEXT NOT NULL CHECK (service IN ('website_creation', 'marketing', 'automazioni', 'aike_motion')),
  message TEXT,
  source TEXT DEFAULT 'booking_form',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: nessun accesso client diretto. Solo il service_role_key del server scrive.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- Nessuna policy pubblica — accesso solo via service key dal server.

-- Index per query comuni
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

### Endpoint API
- **Metodo:** `POST`
- **Path:** `/api/leads`
- **Host:** `178.104.148.4:3000` (server Hetzner, app in `/root/operations-os/`)
- **Payload (JSON):**
```json
{
  "name": "string (required)",
  "company": "string (optional)",
  "email": "string (required, validated)",
  "service": "string (required, enum: website_creation|marketing|automazioni|aike_motion)",
  "message": "string (optional)"
}
```
- **Response successo:** `201 { "ok": true, "id": "<uuid>" }`
- **Response errore:** `400 { "ok": false, "error": "messaggio" }` / `500 { "ok": false, "error": "Internal server error" }`

### Approccio notifica email
**Scelta: Resend (resend.com) via API HTTP dal server Node.js.**

Motivazione:
- Il server Hetzner ha gia Node.js e pm2 attivi — aggiungere una chiamata HTTP a Resend e banale (nessuna dipendenza pesante, solo `fetch`)
- Resend offre 100 email/giorno gratis — piu che sufficiente per notifiche lead
- Alternativa Supabase Edge Function scartata: richiederebbe configurare SMTP dentro Supabase e aggiungere complessita; il server gia esiste e gestisce OperationsOS
- L'email va a Manuel con oggetto `[AIKE Lead] {servizio} — {nome}` e corpo con tutti i dettagli del lead

## File Ownership

| File / Directory | Agente Owner | Note |
|-----------------|-------------|------|
| `index.html` | FRONTEND | Modifiche contenuto sezioni |
| `pages/solutions.html` | FRONTEND | Riscrittura contenuto per 4 servizi |
| `pages/pricing.html` | FRONTEND | Riscrittura completa — da packages website a overview 4 servizi |
| `pages/booking.html` | FRONTEND + BACKEND | FRONTEND: markup form + stili. BACKEND: JS di submit + endpoint |
| `assets/css/styles.css` | FRONTEND | Solo aggiunte (stili form booking) |
| `assets/js/bundle.js` | NESSUNO | Navigazione invariata |
| `assets/js/config.js` | BACKEND | Aggiungere URL endpoint API leads |
| `supabase/migrations/` | BACKEND | Nuova migration per tabella `leads` |
| Server `/root/operations-os/` | BACKEND | Nuovo endpoint `/api/leads` |

## Modifiche Visive — Pagina per Pagina

### index.html

#### Sezione 1: Hero
**Stato attuale:** Hero con titolo "Intelligent automation for modern businesses", sottotitolo lungo su automazione, form email per "Book your consultation", social proof "187 businesses have already booked a call". Visual con logo AIKE e floating icons (Claude, Notion, etc.).
**Proposta:** Riscrivere il copy del hero per posizionare AIKE come agenzia di servizi digitali AI-first, non come piattaforma SaaS di automazione. Titolo orientato ai 4 servizi. Il form email resta ma il testo CTA diventa "Richiedi preventivo" / "Parla con noi" (no prezzi). Social proof aggiornato.
**Motivazione:** Il hero attuale comunica "piattaforma di automazione" quando AIKE ora vende servizi concreti (siti, marketing, automazioni, motion). Il visitatore deve capire subito cosa AIKE fa per lui.

#### Sezione 2: Website Creation Packages
**Stato attuale:** Sezione "Websites that work for your business" con 3 package cards (Basic / Professional / Custom) che mostrano feature list e CTA "Book a call" / "Start your project". Badge "Website Creation". Nessun prezzo visibile.
**Proposta:** Mantenere questa sezione quasi invariata — e gia allineata (no prezzi, CTA a booking). Aggiornare i CTA link da `pages/booking.html` a `pages/booking.html?service=website_creation` per pre-selezionare il servizio nel form. Aggiungere una frase sotto il titolo che posiziona il servizio nel contesto degli altri 3.
**Motivazione:** Sezione gia ben fatta. Il pre-fill del servizio nel form migliora la UX.

#### Sezione 3: AIKE Sites (Your website, built with AI)
**Stato attuale:** Split layout con CTA a sinistra ("Your website, built with AI. Days, not months.") e pannelli 3D interattivi a destra. Form email per "Get proposal", social proof "50+ websites launched".
**Proposta:** Trasformare questa sezione da "website only" a overview dei servizi AIKE. Invece di ripetere il messaging website (gia coperto sopra), mostrare i 4 servizi in card compatte: Website Creation, Marketing, Automazioni, AIKE Motion (quest'ultimo con badge "Secondario" o presentazione piu discreta). Ogni card ha una breve descrizione + CTA "Scopri di piu" o "Richiedi preventivo".
**Motivazione:** Attualmente la homepage ha 2 sezioni website consecutive — ridondante. Questa sezione diventa il "catalogo servizi" che mostra tutta l'offerta AIKE.

#### Sezione 4: Tech Marquee
**Stato attuale:** Marquee con nomi tech (Claude AI, GPT-4o, etc.).
**Proposta:** Mantenere il marquee come vetrina delle integrazioni.
**Motivazione:** Comunica l'ecosistema tecnologico di AIKE. (Nota 2026-06-11: i prodotti AI standalone citati in versioni precedenti di questo piano sono stati eliminati dall'offerta.)

#### Sezione 5: AIKE Motion
**Stato attuale:** Carousel di video/card con categorie motion (Infografica, Animazione testo, Poster, Presentazione, Da zero). Titolo "CREA CON AIKE MOTION". Floating icons ai lati.
**Proposta:** Mantenere invariato. AIKE Motion e gia presentato correttamente come servizio secondario. Aggiungere solo un CTA sotto il carousel: "Richiedi preventivo per AIKE Motion" che linka a `booking.html?service=aike_motion`.
**Motivazione:** Sezione gia ben costruita. Manca solo il collegamento al booking.

#### Sezione 6: Success Stories
**Stato attuale:** 3 story cards (Marketing Agency, Manufacturing, Founder) con risultati numerici. Link a stories.html.
**Proposta:** Aggiornare le storie per riflettere i 4 servizi venduti: una storia per website creation, una per marketing, una per automazioni. Mantenere lo stesso formato card.
**Motivazione:** Le storie attuali sono tutte generiche su "automazione". Con 4 servizi diversi, le storie devono coprire l'offerta reale.

#### Sezione 7: OperationsOS
**Stato attuale:** Sezione con mockup Telegram, copy su OperationsOS come prodotto per PMI. Prezzi visibili: "Setup unico 1.497 EUR, poi solo 197 EUR/mese". CTA a operations-os.html.
**Proposta:** Rimuovere i prezzi ("Setup unico 1.497 EUR, poi solo 197 EUR/mese") e sostituire con CTA "Richiedi preventivo". Questa sezione rientra nel servizio "Automazioni". Il copy puo restare simile ma il prezzo va eliminato — regola zero prezzi.
**Motivazione:** La regola e "zero prezzi ovunque". OperationsOS fa parte del servizio Automazioni e il preventivo e personalizzato.

---

### pages/solutions.html

#### Sezione 1: Hero
**Stato attuale:** Titolo animato "Intelligent systems for serious operations" con canvas stelle. Sottotitolo su "unified, intelligent architectures". CTA "View plans" che linka a pricing.html.
**Proposta:** Riscrivere il titolo per riflettere i 4 servizi: qualcosa come "Tutto cio che serve al tuo business digitale" o simile (FRONTEND ha liberta creativa). Il sottotitolo introduce i 4 servizi. CTA diventa "Richiedi preventivo" e linka a booking.html.
**Motivazione:** La pagina Solutions deve diventare la panoramica dei 4 servizi, non solo "automazione".

#### Sezione 2: CTA + immagine mascotte
**Stato attuale:** Split layout con tweet card finta (Alex Chen) a sinistra + immagine della mascotte AIKE con floating icons a destra. Titolo "Your business is slow, but you don't notice it".
**Proposta:** Riscrivere come sezione di value proposition generica AIKE. La tweet card puo restare come social proof ma con contenuto piu rilevante ai servizi offerti. L'immagine della mascotte resta — e il mascot AIKE.
**Motivazione:** Il copy attuale e troppo generico e non vende i 4 servizi.

#### Sezione 3: Workspace (ex sezione prodotto rimossa)
**Stato attuale:** Sezione brand AIKE con typing effect, vertical text marquee (websites, automation, workflow, etc.). Sotto: split con CTA "Join the waitlist" + globe 3D rotante.
**Proposta:** Mantenere come sezione workspace/waitlist generica dell'ecosistema AIKE.
**Motivazione:** (Nota 2026-06-11: il prodotto standalone a cui questa sezione era dedicata e stato eliminato dall'offerta; la sezione e stata genericizzata.)

#### Nuova sezione: I 4 Servizi
**Stato attuale:** Non esiste.
**Proposta:** Aggiungere una sezione con 4 card (una per servizio) dopo l'hero. Ogni card ha: icona, titolo servizio, 3-4 bullet point, CTA "Richiedi preventivo" con link a booking.html?service=xxx. AIKE Motion ha un badge "Secondario" e trattamento visivo piu discreto.
**Motivazione:** La pagina Solutions e il posto naturale per presentare tutti i servizi in modo strutturato.

---

### pages/pricing.html

**Stato attuale:** Pagina "Website Packages" con 3 package cards (Basic Website / Professional Website / Custom Solution), sezione processo in 3 step, FAQ su website, CTA finale. Titolo "Websites that work for your business". Nessun prezzo visibile (gia corretto). Solo website creation — nessun riferimento agli altri 3 servizi.
**Proposta:** Riscrivere completamente la pagina come panoramica dei 4 servizi con zero prezzi. Struttura:
1. **Hero:** "I nostri servizi" o simile
2. **4 service cards** (simili alle pkg-card attuali ma per ogni servizio):
   - Website Creation: feature list gia esistente, riutilizzare
   - Marketing: feature list nuova (strategia, contenuti, ads, analytics)
   - Automazioni: feature list nuova (workflow, integrations, CRM, reporting)
   - AIKE Motion: feature list nuova (animazioni ads, motion graphics, video)
   Ogni card ha CTA "Richiedi preventivo" che linka a booking.html?service=xxx
3. **Process section:** mantenere i 3 step (Discovery / Design & Build / Launch) — sono generici e funzionano per tutti i servizi
4. **FAQ:** aggiornare con domande sui 4 servizi (non solo website)
5. **CTA finale:** "Non sai quale servizio fa per te? Parla con noi" con link a booking

**Motivazione:** La pagina pricing attuale copre solo website. Con 4 servizi, deve diventare la pagina "servizi" principale. Il titolo resta "Pricing" nella navbar per non modificare la navigazione.

---

### pages/booking.html

**Stato attuale:** Il file NON ESISTE (`pages/booking.html` non trovato). I link `booking.html` nella navbar e nelle CTA puntano a un file mancante. Probabilmente era un link placeholder o era hostato altrove (es. Calendly embed).
**Proposta:** Creare `pages/booking.html` da zero con:
1. **Hero minimo:** "Parlaci del tuo progetto" o simile
2. **Form di contatto** con campi:
   - Nome (text, required)
   - Azienda (text, optional)
   - Email (email, required)
   - Servizio di interesse (dropdown select, required):
     - Website Creation
     - Marketing
     - Automazioni
     - AIKE Motion
   - Messaggio (textarea, optional)
   - Bottone submit "Invia richiesta"
3. **Pre-fill del servizio** da query parameter `?service=xxx`
4. **JS di submit:** POST a endpoint server, feedback visivo (loading, successo, errore)
5. **Sezione conferma** post-submit: "Grazie! Ti contatteremo entro 24h."
6. **Design:** stile coerente con design system (card form su sfondo #111, input con border rgba, bottone btn-primary pill)

**Motivazione:** Pagina essenziale per il funnel commerciale. Tutti i CTA del sito puntano qui.

---

## File NON da toccare
- `assets/css/styles.css` — solo aggiunte (nuove classi per form booking), mai rimuovere variabili esistenti
- `assets/js/bundle.js` — navigazione invariata (Solutions, Pricing visibili; OperationsOS nascosto con `data-admin-only`)
- `assets/js/auth.js` — sistema auth esistente non va toccato
- `assets/js/config.js` — solo aggiunta URL endpoint leads

## Interfacce API

### POST /api/leads
- **Host:** `178.104.148.4:3000`
- **Content-Type:** `application/json`
- **Rate limiting:** max 5 richieste/minuto per IP (protezione spam)
- **Payload:**
```json
{
  "name": "Mario Rossi",
  "company": "Rossi SRL",
  "email": "mario@rossi.it",
  "service": "website_creation",
  "message": "Vorrei un sito per la mia azienda..."
}
```
- **Validazione server-side:**
  - `name`: stringa non vuota, max 200 char
  - `email`: formato email valido (regex), max 320 char
  - `service`: must be one of `website_creation`, `marketing`, `automazioni`, `aike_motion`
  - `message`: max 2000 char
  - `company`: max 200 char
- **Success response:** `201 { "ok": true, "id": "uuid" }`
- **Error responses:**
  - `400 { "ok": false, "error": "Validation error description" }`
  - `429 { "ok": false, "error": "Too many requests" }`
  - `500 { "ok": false, "error": "Internal server error" }`

### CORS
- Il server deve accettare `Origin: https://aike.com` (o qualunque dominio Cloudflare Pages usato)
- Headers: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`

## Variabili ENV Necessarie

| Variabile | Descrizione | Owner dichiarante |
|-----------|-------------|-------------------|
| `SUPABASE_URL` | URL progetto Supabase (gia esistente sul server) | BACKEND |
| `SUPABASE_SERVICE_KEY` | Service role key Supabase (gia esistente sul server) | BACKEND |
| `RESEND_API_KEY` | API key Resend per invio email notifica | BACKEND |
| `LEAD_NOTIFY_EMAIL` | Email destinatario notifiche lead (Manuel) | BACKEND |
| `ALLOWED_ORIGINS` | Domini consentiti per CORS (es. `https://aike.com`) | BACKEND |

## Branch Names
- BACKEND: `master/website-ux/backend`
- FRONTEND: `master/website-ux/frontend`

## Dipendenze tra Agenti

- **FRONTEND attende da BACKEND:**
  - URL finale dell'endpoint API leads (host + path) da inserire nel JS di submit di booking.html
  - Conferma che l'endpoint e live e testabile (FRONTEND puo sviluppare il form con mock, ma il submit reale richiede endpoint attivo)

- **BACKEND attende da FRONTEND:**
  - Nulla — puo procedere indipendentemente con migration Supabase + endpoint Node.js

- **Ordine consigliato:**
  1. BACKEND crea migration Supabase + endpoint API (parallelizzabile)
  2. FRONTEND crea booking.html con form + stili (parallelizzabile)
  3. FRONTEND aggiorna index.html, solutions.html, pricing.html (parallelizzabile)
  4. FRONTEND integra URL endpoint nel JS di booking.html (dipende da BACKEND step 1)

## Vincoli Tecnici

1. **Stack frontend:** HTML/CSS/JS puro — nessun framework, nessun npm, nessun bundler
2. **Design system:** rispettare rigorosamente i token in `styles.css` (colori, radius, font, spacing)
3. **Font:** Inter only (Outfit per display headings e gia usato — puo continuare)
4. **Dark mode only:** sfondo #111111, nessun light mode
5. **Border radius:** pill (--radius-full) per bottoni, 16px (--radius-md) per card
6. **Zero prezzi:** nessun prezzo visibile in nessuna pagina — solo CTA "Richiedi preventivo"
7. **Navigazione:** la navbar (bundle.js) non va modificata — Solutions e Pricing restano gli unici link pubblici
8. **Sicurezza:** `SUPABASE_SERVICE_KEY` mai esposto lato client — il form fa POST al server Hetzner, non a Supabase direttamente
9. **Supabase RLS:** tabella leads senza policy pubbliche — solo service key puo scrivere/leggere
10. **Deploy:** frontend via push su main (Cloudflare Pages auto-deploy); backend via `scp` + `pm2 restart operations-os` sul server Hetzner
