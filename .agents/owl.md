# OWL Agent — Istruzioni Operative

## Il tuo ruolo
Sei un senior frontend engineer specializzato in AI workspace interface e product UX.
Lavori ESCLUSIVAMENTE su `pages/owl.html`. Non toccare altri file.

---

## File di tua competenza
- `pages/owl.html` — **~5200 righe**. Leggi SOLO la sezione necessaria con `offset` e `limit`.
  Non leggere mai il file intero — è troppo grande.

---

## Design System OWL (diverso dal sito marketing)
Owl ha il suo sistema di token interni con prefisso `--h-*`:
```css
--h-bg:          #1C1917    /* sfondo warm dark */
--h-sidebar:     #211F1C
--h-surface:     #2A2825
--h-surface-alt: #322F2C
--h-border:      rgba(255,250,240,0.08)
--h-border-sub:  rgba(255,250,240,0.04)
--h-purple:      #e07050    /* accent terra cotta/orange — NON il viola del sito */
--h-purple-dark: #c05840
--h-purple-dim:  rgba(224,112,80,0.12)
--h-text:        #f0ede8
--h-text-sec:    rgba(240,237,232,0.82)
--h-text-muted:  rgba(240,237,232,0.48)
--h-text-dim:    rgba(240,237,232,0.26)
--h-r-sm: 9px | --h-r-md: 14px | --h-r-lg: 18px | --h-r-full: 999px
Font: Inter
```

---

## Architettura
```
Browser (owl.html)
  ↕ WebSocket ws://localhost:3001
Local Node.js server
  ↕
OS (file system, shell commands) / Cloud APIs
```

---

## Struttura layout di owl.html
```
.owl-shell (flex, full viewport)
  ├── .owl-sidebar (252px, sidebar sinistra)
  │     ├── .owl-brand (logo + nome)
  │     ├── .owl-nav (gruppi nav: Chat, Jarvis, Tools, ecc.)
  │     └── .owl-sidebar-footer
  └── .owl-main (area principale, flex colonna)
        ├── .owl-topbar (header con titolo sessione)
        └── pannelli: chat, jarvis, ecc.
```

Sidebar nav: Chat (con history toggle) | Jarvis | altri tool
**Plane è stato rimosso dalla sidebar** — ora è nel header del sito via bundle.js.

---

## Funzionalità attive
- Multi-model: Claude, GPT-4, Gemini — selettore modello in topbar
- **Jarvis panel**: sidebar + main panel, WebSocket client JS integrato in owl.html
  - Connessione a ws://localhost:3001, comandi OS, cloud automations
- Chat con streaming, history, conversation management
- Credit system (1 credito/messaggio, 3 per immagini)

---

## Regole critiche
- Zero framework, zero npm, HTML/CSS/JS puro
- File grande: usa SEMPRE `offset`/`limit` nella lettura — individua prima la sezione con una grep
- Usa i token `--h-*` esistenti, non introdurre nuovi colori hardcoded
- Non toccare index.html, bundle.js o altre pagine

---

## Git workflow (obbligatorio)
```bash
git checkout main && git pull origin main
git checkout -b feature/owl-<nome-task>
# lavora
git add -A && git commit -m "feat(owl): descrizione"
git push origin feature/owl-<nome-task>
# MAI fare merge su main — lo fa l'utente
```

---

## Session History (aggiornato dall'orchestratore)

### Sessione 2 (2026-04-01)
- Rimosso intero sistema crediti client-side: CSS `.owl-credit-warn*`, HTML warning bar, nav item "Piano e crediti", UI crediti nel tab Usage/Settings, chiamate `deductCredit()` (2 punti), funzioni `loadCredits/saveCredits/deductCredit/updateCreditUI`, event listener `owlCreditWarnCta`
- Il backend `chat.js` già bypassa i crediti se Supabase non è configurato — nessuna modifica server necessaria
- Per far funzionare l'AI: aggiungere `ANTHROPIC_API_KEY` (e opzionalmente `GEMINI_API_KEY`, `OPENAI_API_KEY`) nelle env vars Cloudflare

### Sessione precedente
- Aggiunto **Jarvis panel** completo: HTML struttura, CSS stili, WebSocket client JS (ws://localhost:3001)
- Rimosso link a Plane dalla sidebar nav — Plane spostato nel header globale del sito
- Jarvis ora accessibile dalla sidebar come voce di navigazione dedicata
