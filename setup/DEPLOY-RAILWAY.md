# Deploy su Railway — Guida Step-by-Step

Questa guida ti porta dal codice a un bot attivo in produzione senza toccare una sola riga di terminale.

---

## Passo 1 — Crea un account Railway

1. Vai su [railway.app](https://railway.app)
2. Clicca **Start a New Project** → **Sign in with GitHub**
3. Autorizza Railway ad accedere al tuo account GitHub
4. Completa la verifica email se richiesta

---

## Passo 2 — Collega il repository GitHub

1. Dalla dashboard Railway, clicca **New Project**
2. Seleziona **Deploy from GitHub repo**
3. Cerca e seleziona il repository `aike-landing` (o il nome esatto del tuo repo)
4. Railway rileverà automaticamente il `Dockerfile` nella cartella `operations-os/`
5. Se il progetto si trova in una sottocartella, imposta **Root Directory** su `operations-os`

> **Nota:** Railway costruisce automaticamente l'immagine Docker ad ogni push sul branch selezionato.

---

## Passo 3 — Configura le variabili d'ambiente

Vai su **Settings → Variables** nel tuo servizio Railway e aggiungi le seguenti variabili una per una:

| Variabile | Descrizione | Dove trovare il valore |
|-----------|-------------|------------------------|
| `TELEGRAM_BOT_TOKEN` | Token del bot Telegram | Da @BotFather su Telegram dopo aver creato il bot con `/newbot` |
| `OPERATOR_CHAT_ID` | Il tuo Chat ID personale Telegram | Scrivi a @userinfobot su Telegram — risponde con il tuo ID numerico |
| `NOTION_API_KEY` | Chiave API di Notion (Integration Token) | Vai su [notion.so/my-integrations](https://notion.so/my-integrations) → crea una nuova integration → copia il token |
| `NOTION_LEADS_DB_ID` | ID del database Leads su Notion | Apri il database Leads in Notion → clicca sui tre puntini → **Copy link** → l'ID è la stringa dopo l'ultimo `/` e prima del `?` |
| `NOTION_CLIENTS_DB_ID` | ID del database Clienti su Notion | Stesso procedimento del database Leads |
| `NOTION_REVENUE_DB_ID` | ID del database Fatture/Revenue su Notion | Stesso procedimento del database Leads |
| `WEBHOOK_SECRET` | Password segreta per proteggere il webhook Make.com | Scegli una stringa casuale lunga almeno 16 caratteri (es. `MySecret2024XYZ`) — usala uguale anche in Make.com |
| `WEBHOOK_URL` | URL pubblico del tuo bot Railway | Railway genera questo URL automaticamente dopo il primo deploy — lo trovi in **Settings → Networking → Public Domain** |
| `PORT` | Porta interna (Railway la gestisce) | Lascia vuoto — Railway imposta `PORT` automaticamente |

> **Importante:** Non mettere mai il token o la chiave API in un file `.env` committato nel repository.

---

## Passo 4 — Primo deploy e verifica

1. Dopo aver aggiunto tutte le variabili, clicca **Deploy** (o Railway parte automaticamente)
2. Vai su **Deployments** e guarda i log in tempo reale
3. Il deploy ha successo quando vedi nei log:
   ```
   [index] OperationsOS bot server running on port 3000
   [index] Telegram webhook path: POST /telegram
   ```
4. Copia il **Public Domain** che Railway assegna (es. `operations-os-xxx.railway.app`)
5. Imposta il webhook Telegram aprendo nel browser:
   ```
   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<TUO-DOMINIO-RAILWAY>/telegram
   ```
   Sostituisci `<TELEGRAM_BOT_TOKEN>` e `<TUO-DOMINIO-RAILWAY>` con i valori reali.
6. Verifica il webhook:
   ```
   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo
   ```
   Dovresti vedere `"url": "https://..."` con il tuo dominio.

---

## Passo 5 — Come vedere i log

1. Apri il tuo progetto su [railway.app](https://railway.app)
2. Clicca sul servizio **operations-os**
3. Vai sulla tab **Logs**
4. I log si aggiornano in tempo reale
5. Puoi filtrare per testo usando la barra di ricerca in alto

---

## Passo 6 — Come riavviare in caso di crash

**Riavvio manuale:**
1. Vai su **Deployments** nel tuo servizio
2. Clicca sui tre puntini del deployment attivo
3. Seleziona **Restart**

**Riavvio automatico:**
Il `railway.json` è già configurato con `restartPolicyType: ON_FAILURE` — il bot si riavvia automaticamente in caso di crash (massimo 5 volte consecutive).

**Redeploy completo:**
Se qualcosa non va, vai su **Deployments** → clicca **Redeploy** sull'ultimo deployment riuscito.

---

## Health Check

Railway verifica automaticamente che il bot sia attivo tramite:
```
GET https://<tuo-dominio>/health
```
Risposta attesa:
```json
{
  "status": "ok",
  "service": "operations-os-bot",
  "timestamp": "...",
  "uptime": 123.45
}
```
Se il health check fallisce per più di 30 secondi, Railway considera il servizio non disponibile e avvia un nuovo deploy.
