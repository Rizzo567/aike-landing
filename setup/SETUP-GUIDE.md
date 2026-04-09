# OperationsOS — Complete Setup Guide

**Estimated total time: ~50 minutes**
**What you'll have at the end:** Every new lead email → auto-logged in Notion + Telegram alert with action buttons

---

## Before You Start — Collect These Values

You'll fill in this table as you go. Keep this file open in a second window.

| Variable | What It Is | Your Value |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Your bot's API token | _(fill in Step 1)_ |
| `OPERATOR_CHAT_ID` | Your personal Telegram numeric ID | _(fill in Step 1)_ |
| `NOTION_LEADS_DB_ID` | 32-character database ID | _(fill in Step 2)_ |
| `NOTION_API_KEY` | Notion integration token | _(fill in Step 3)_ |
| `WEBHOOK_SECRET` | Random secret string you invent | _(fill in Step 4)_ |
| `WEBHOOK_URL` | Your bot's public HTTPS URL | _(fill in Step 5)_ |

---

## STEP 1 — Create Your Telegram Bot (5 min)

**1.1** Open Telegram on your phone or at [web.telegram.org](https://web.telegram.org)

**1.2** In the search bar, type `@BotFather` and open the verified account (blue checkmark)

**1.3** Send this message:
```
/newbot
```

**1.4** BotFather will ask for a name. Type:
```
OperationsOS
```

**1.5** BotFather will ask for a username (must end in `_bot`). Type something like:
```
operationsOS_aike_bot
```
(If that's taken, try `ops_aike_bot` or add your name)

**1.6** BotFather replies with your token. It looks like:
```
123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Copy this → save it as **TELEGRAM_BOT_TOKEN**

**1.7** Open a chat with your new bot (click the link BotFather sends) and press **Start** or type `/start`. This activates the chat.

**1.8** Get your personal Telegram Chat ID:
- Search for `@userinfobot` in Telegram
- Open it and press **Start**
- It replies with your numeric ID (e.g. `123456789`)
- Copy that number → save it as **OPERATOR_CHAT_ID**

> Note: OPERATOR_CHAT_ID must be the raw number, not your @username.

---

## STEP 2 — Create the Notion Leads Database (10 min)

**2.1** Open [notion.so](https://notion.so) and log in

**2.2** In the left sidebar, click **+ New page**

**2.3** Type the page name:
```
OperationsOS — Leads
```

**2.4** In the body of the page, type `/database` and select **Database — Full page**

**2.5** Now add the required properties. Click the **+** button at the top of the table to add each one:

| Property Name | Type | Options to Create |
|---|---|---|
| `Name` | Title | _(already exists — rename if needed)_ |
| `Email` | Email | _(no options needed)_ |
| `Status` | Select | New (blue), Contacted (yellow), Qualified (green), Converted (purple), Cold (gray), Lost (red) |
| `Score` | Number | Format: Number |
| `Source` | Select | Website, Instagram, Referral, Cold, Telegram, Email |
| `Last Contact` | Date | _(no options needed)_ |
| `Notes` | Text | _(no options needed)_ |

**To add a Select property:**
- Click **+** → choose "Select"
- Click the property name to rename it
- Click the property again → "Edit property" → add each option and assign a color

**2.6** Get the Database ID:
- Open your Leads database in the browser (not the app)
- The URL looks like: `https://www.notion.so/yourworkspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`
- The part between the last `/` and the `?` is your 32-character Database ID
- Example URL: `https://notion.so/myworkspace/abc123def456abc123def456abc123de?v=...`
- The ID is: `abc123def456abc123def456abc123de`
- Copy it → save as **NOTION_LEADS_DB_ID**

> Tip: If the URL has dashes, include them. If not, that's fine too — the SDK handles both formats.

---

## STEP 3 — Create the Notion Integration (5 min)

**3.1** Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)

**3.2** Click **+ New integration**

**3.3** Fill in:
- Name: `OperationsOS`
- Associated workspace: select your workspace
- Type: Internal integration

**3.4** Click **Save**

**3.5** On the next page, find **Internal Integration Secret** and click **Show** then **Copy**
- It starts with `secret_...`
- Save this as **NOTION_API_KEY**

**3.6** Now connect the integration to your database:
- Go back to your "OperationsOS — Leads" page
- Click the **...** (three dots) menu in the top right
- Click **Connections**
- Click **Connect to** → search for `OperationsOS` → click to add it
- Confirm if prompted

> If you skip 3.6, all Notion API calls will return 404 errors. This is the most commonly missed step.

---

## STEP 4 — Configure the Node.js Bot (5 min)

**4.1** Open a terminal (Command Prompt, PowerShell, or Windows Terminal)

**4.2** Navigate to the project folder:
```bash
cd "C:\Users\manue\Desktop\AIKE FULL\operations-os"
```

**4.3** Copy the example env file:
```bash
copy .env.example .env
```
(On Mac/Linux: `cp .env.example .env`)

**4.4** Open `.env` in any text editor (Notepad, VS Code, etc.) and fill in all values:
```
TELEGRAM_BOT_TOKEN=123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_LEADS_DB_ID=abc123def456abc123def456abc123de
OPERATOR_CHAT_ID=123456789
PORT=3000
WEBHOOK_SECRET=ops_secret_aike_2024_change_this
```

For `WEBHOOK_SECRET`, invent any long random string — it just needs to match what you'll put in Make.com. Example:
```
WEBHOOK_SECRET=ops_secret_aike_2024_x7k9m2p
```

**4.5** Install dependencies (only needed the first time):
```bash
npm install
```

**4.6** Start the bot:
```bash
npm start
```

You should see output like:
```
[bot] OperationsOS bot started
[webhook] Listening on port 3000
```

**4.7** Test the Telegram connection:
- Open Telegram → find your bot → send `/start`
- The bot should reply with a welcome message

If the bot doesn't respond, double-check `TELEGRAM_BOT_TOKEN` and `OPERATOR_CHAT_ID` in your `.env` file.

---

## STEP 5 — Expose the Bot to the Internet (10 min)

Make.com needs to reach your bot via a public HTTPS URL. Choose one option:

---

### Option A — ngrok (best for testing tonight, free)

**5A.1** Install ngrok. Choose one method:

**Method 1 — Download:** Go to [ngrok.com/download](https://ngrok.com/download) → download for Windows → unzip → place `ngrok.exe` somewhere convenient

**Method 2 — npm:**
```bash
npm install -g ngrok
```

**5A.2** Sign up for a free ngrok account at [ngrok.com](https://ngrok.com) (needed for stable URLs)

**5A.3** After signing up, copy your authtoken from the ngrok dashboard and run:
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

**5A.4** With your bot still running in one terminal, open a NEW terminal and run:
```bash
ngrok http 3000
```

**5A.5** ngrok will show something like:
```
Forwarding    https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

**5A.6** Copy the `https://` URL → save as **WEBHOOK_URL**
- Example: `https://abc123xyz.ngrok-free.app`
- Do NOT include a trailing slash

**5A.7** Update your `.env` file with this URL and restart the bot:
```bash
# Stop with Ctrl+C, then restart:
npm start
```

> Warning: Free ngrok URLs change every time you restart ngrok. You'll need to update Make.com each time. For a permanent solution, use Option B.

---

### Option B — Railway (permanent, free tier, recommended)

**5B.1** Create an account at [railway.app](https://railway.app) (free tier available)

**5B.2** Install the Railway CLI:
```bash
npm install -g @railway/cli
```

**5B.3** In your terminal (in the `operations-os` folder), run:
```bash
railway login
```
(Opens browser for OAuth login)

**5B.4** Initialize and deploy:
```bash
railway init
railway up
```

**5B.5** In the Railway dashboard, go to your project → **Variables** and add all your env variables:
```
TELEGRAM_BOT_TOKEN = [your value]
NOTION_API_KEY = [your value]
NOTION_LEADS_DB_ID = [your value]
OPERATOR_CHAT_ID = [your value]
PORT = 3000
WEBHOOK_SECRET = [your value]
```

**5B.6** In the Railway dashboard → your service → **Settings** → **Networking** → **Generate Domain**

**5B.7** Copy the generated URL (e.g. `https://operations-os-production.up.railway.app`) → save as **WEBHOOK_URL**

---

## STEP 6 — Set Up the Make.com Scenario (15 min)

**6.1** Go to [make.com](https://make.com) and create a free account if you haven't already

**6.2** After logging in, click **Scenarios** in the left sidebar

**6.3** Click **Create a new scenario** (blue button, top right)

**6.4** In the empty scenario editor, click the **three-dot menu** (top right of the editor) and select **Import Blueprint**

**6.5** Upload the file:
```
C:\Users\manue\Desktop\AIKE FULL\operations-os\setup\makecom-scenario.json
```

The scenario will load with 5 modules connected.

---

### Configure Module 1 — Gmail Trigger

**6.6** Click the first module (Gmail — Watch Emails)

**6.7** Click **Add** next to the Connection field

**6.8** Click **Sign in with Google** → log in with the Gmail account where leads arrive → grant permissions

**6.9** Set these fields:
- **Folder**: INBOX
- **Maximum number of emails**: 5
- **Criteria**: All mail
- **Mark email message(s) as read when fetched**: OFF (we handle this in step 5)

**6.10** Click **OK**

---

### Configure Module 2 — Filter (Lead Keywords)

The filter should already be configured from the import. To verify:
- Click the small filter icon between module 1 and module 2 (the funnel icon)
- You should see two condition groups (subject OR body) checking for the keywords
- If not configured, add:
  - Condition 1: `Subject` → `Matches pattern (case insensitive)` → `informazioni|preventivo|contatto|servizi|interessato|info|prezzi`
  - Click **Add OR rule**
  - Condition 2: `Text` (body) → `Matches pattern (case insensitive)` → same pattern

---

### Configure Module 3 — Set Variables

This module should already be configured from the import. No changes needed.

To verify, click module 3 and confirm these variables are set:
- `lead_name`: pulls from Gmail sender name
- `lead_email`: pulls from Gmail sender email
- `lead_subject`: email subject
- `lead_body_preview`: first 200 characters of body
- `lead_source`: static value "Email"
- `lead_score`: formula scoring urgent leads as 8, detailed as 6, default as 5

---

### Configure Module 4 — HTTP Request (your bot)

**6.11** Click the HTTP module (module 4)

**6.12** Update the **URL** field:
- Replace `WEBHOOK_URL` with your actual URL
- Full URL must be: `https://your-url-here.com/webhook/new-lead`
- Example: `https://abc123xyz.ngrok-free.app/webhook/new-lead`

**6.13** In the **Headers** section, find the `x-webhook-secret` header:
- Replace `WEBHOOK_SECRET` with the exact value from your `.env` file

**6.14** Verify the Body field contains this JSON (it should be pre-filled from the import):
```json
{
  "name": "{{3.lead_name}}",
  "email": "{{3.lead_email}}",
  "subject": "{{3.lead_subject}}",
  "body_preview": "{{3.lead_body_preview}}",
  "source": "{{3.lead_source}}",
  "score": {{3.lead_score}}
}
```

**6.15** Click **OK**

---

### Configure Module 5 — Gmail Mark as Read

**6.16** Click the last Gmail module

**6.17** In the Connection field, select the same Gmail account you connected in module 1 (should appear in the dropdown)

**6.18** The Email ID field should already reference `{{1.id}}` from the trigger — if not, click the field and select the ID from module 1

**6.19** Click **OK**

---

### Activate the Scenario

**6.20** Click **Save** (floppy disk icon, top right)

**6.21** Click **Scheduling** (clock icon) and set:
- **Run scenario**: Every
- **Every**: 15 minutes

**6.22** Toggle the **ON/OFF** switch to **ON**

**6.23** The scenario is now live and will check your inbox every 15 minutes.

---

## STEP 7 — Test the Full Flow (5 min)

**7.1** Send a test email to your connected Gmail account from any other email address. Use this subject:
```
Informazioni sui vostri servizi
```
And body:
```
Ciao, sono interessato ai vostri servizi di consulenza. Potreste mandarmi un preventivo? Grazie
```

**7.2** Option A — Wait up to 15 minutes for the automatic poll

**7.2b** Option B — Force an immediate run:
- In Make.com, open your scenario
- Click **Run once** (play button)
- Make.com will immediately check Gmail and process any matching emails

**7.3** Check Notion:
- Open your "OperationsOS — Leads" database
- A new record should appear with the sender's name, email, subject, and score

**7.4** Check Telegram:
- You should receive an alert message from your bot with the lead details
- The message should include action buttons: Qualify, Contact, Cold, etc.

**7.5** Tap the **Qualify** button in Telegram
- Go back to Notion and refresh the page
- The lead's Status should have changed to "Qualified"

---

## TROUBLESHOOTING

### Bot not responding to /start in Telegram
- Check `TELEGRAM_BOT_TOKEN` — copy it again from @BotFather to avoid typos
- Make sure the bot is running (`npm start` shows no errors)
- Send `/start` again — the first message sometimes takes a few seconds

### Notion API returns 404
- You forgot to connect the integration to the database (Step 3.6)
- Go back: open the database → `...` → Connections → add OperationsOS

### Notion API returns 401
- `NOTION_API_KEY` is wrong or expired
- Re-copy it from [notion.so/my-integrations](https://notion.so/my-integrations) → click your integration → show token

### Make.com HTTP module returns 401
- `WEBHOOK_SECRET` in Make.com doesn't match `.env`
- Copy the exact string from `.env` → paste into Make.com header (no extra spaces)

### Make.com HTTP module returns connection error / ECONNREFUSED
- Your bot's URL is wrong or the bot isn't running
- Test the URL directly: open `https://YOUR_URL/webhook/new-lead` in browser (expect a 405 or 401, not a connection error)
- If using ngrok, make sure ngrok is running in a separate terminal

### No Telegram alert but Notion record was created
- `OPERATOR_CHAT_ID` is wrong — must be a number, not @username
- Re-check using @userinfobot in Telegram
- Make sure you sent `/start` to your bot before testing

### Make.com filter blocks all emails
- The filter keywords are Italian — if your test email was in English, add "information", "quote", "contact" to the filter pattern
- Or temporarily disable the filter for testing: click the filter icon → toggle OFF

### ngrok URL changed / Make.com stopped working
- This happens after restarting ngrok
- Get the new URL from the ngrok terminal
- Update Make.com: open scenario → click HTTP module → update URL

### Free plan operation limit warning
- At 1,000 ops/month (free plan), with 5 modules per run and every-15-min polling:
  - You have ~200 runs available per month (about 6-7 per day)
  - If no emails are processed, polling still uses ~1 operation per run
  - **Tip:** Turn off the scenario when not actively testing to preserve operations
  - **Upgrade:** Make.com Core plan ($9/month) gives 10,000 ops/month

---

## Summary — What You Built

```
New Email (Gmail)
      ↓  [every 15 min]
Make.com polls inbox
      ↓  [filter: lead keywords in subject or body]
Set Variables (name, email, subject, preview, source, score)
      ↓
POST /webhook/new-lead (with secret header)
      ↓
Node.js bot (operations-os)
      ├→ Creates record in Notion "OperationsOS — Leads"
      └→ Sends Telegram alert with action buttons
            ↓  [tap a button]
      Updates Notion record status
      ↓
Gmail: mark email as read
```

**Files created:**
- `setup/makecom-scenario.json` — import this into Make.com
- `setup/SETUP-GUIDE.md` — this file

**Bot entry point:** `operations-os/src/` (webhook, notion, telegram modules)
**Env template:** `operations-os/.env.example`

---

---

# MODULI AGGIUNTIVI — Blueprint Make.com (Moduli 2–5)

I seguenti scenari estendono OperationsOS con quattro automazioni aggiuntive. I file JSON si trovano in `setup/blueprints/`.

---

## MODULO 2 — Quote Capture (`modulo-2-quotes.json`)

**Scopo:** Intercetta le email di richiesta preventivo e le invia al webhook Node.js per essere salvate in Notion e notificate su Telegram.

```
Gmail (nuova email con "preventivo/quote/proposta")
      ↓  [filter keywords]
Set Variables (nome cliente, email, subject, body preview)
      ↓
POST /webhook/new-quote
      ↓
Gmail: Mark as Read
      ↓ [se errore HTTP]
Gmail: Apply Label "OperationsOS-Error"
```

### Come importarlo in Make.com

1. Vai su [make.com](https://make.com) e accedi al tuo account
2. Nel menu a sinistra clicca **Scenarios**
3. Clicca **Create a new scenario** (pulsante blu in alto a destra)
4. Nel canvas vuoto, clicca il menu **tre punti** (in alto a destra dell'editor) → **Import Blueprint**
5. Carica il file: `C:\Users\manue\Desktop\AIKE FULL\operations-os\setup\blueprints\modulo-2-quotes.json`
6. Lo scenario si carica con 6 moduli. Clicca **Save** temporaneamente.

### Variabili da configurare

Clicca su ogni modulo indicato e sostituisci i segnaposto:

| Modulo | Campo | Valore da inserire |
|---|---|---|
| Modulo 1 — Gmail Trigger | Connection | Connetti il tuo account Gmail |
| Modulo 4 — HTTP Request | URL | `https://TUA-URL/webhook/new-quote` |
| Modulo 4 — HTTP Request | Header `x-webhook-secret` | Il valore di `WEBHOOK_SECRET` nel tuo `.env` |
| Modulo 5 — Mark as Read | Connection | Stesso account Gmail del Modulo 1 |
| Modulo 6 — Add Label | Connection | Stesso account Gmail del Modulo 1 |

**Nota:** Prima di attivare, crea la label `OperationsOS-Error` in Gmail:
- Vai in Gmail → Impostazioni → Etichette → Crea nuova etichetta → digita `OperationsOS-Error`

### Come testarlo

1. Assicurati che il bot Node.js sia in esecuzione (`npm start`)
2. Invia una email al tuo Gmail con oggetto: `Richiesta preventivo consulenza`
3. In Make.com, apri lo scenario e clicca **Run once**
4. Atteso: il modulo HTTP mostra status 200, l'email viene marcata come letta
5. Verifica in Notion: deve apparire un nuovo record nel database Quote/Leads
6. Verifica in Telegram: devi ricevere una notifica con i dettagli

### Troubleshooting comune

**Il filtro blocca tutte le email**
- Controlla che l'oggetto contenga una delle parole chiave: `preventivo`, `quote`, `proposta`, `offerta`
- Per testare senza filtro: clicca l'icona filtro tra modulo 1 e 2 → disabilita temporaneamente

**HTTP restituisce 401 Unauthorized**
- Il `WEBHOOK_SECRET` in Make.com non corrisponde a quello nel file `.env`
- Copia il valore esatto da `.env` → incollalo nel campo header di Make.com (nessuno spazio extra)

**HTTP restituisce connection error**
- Il bot non è in esecuzione, oppure l'URL è sbagliato
- Testa manualmente aprendo `https://TUA-URL/webhook/new-quote` nel browser (atteso: errore 401 o 405, NON un errore di connessione)

---

## MODULO 3 — Task Deadline Reminder (`modulo-3-tasks.json`)

**Scopo:** Ogni giorno alle 07:30 invia un trigger al webhook Node.js, che interroga Notion per i task in scadenza oggi e manda un briefing su Telegram.

```
Schedule (ogni giorno alle 07:30)
      ↓
POST /webhook/task-update { action: "daily_brief_trigger" }
      ↓ [se 200 OK]
Set Variables (status, tasks found, timestamp)
      ↓ [se errore]
Set Variables (log errore — continua senza bloccare)
```

### Come importarlo in Make.com

1. Segui gli stessi passi 1–4 del Modulo 2
2. Carica: `C:\Users\manue\Desktop\AIKE FULL\operations-os\setup\blueprints\modulo-3-tasks.json`
3. Lo scenario si carica con 4 moduli.

### Variabili da configurare

| Modulo | Campo | Valore da inserire |
|---|---|---|
| Modulo 1 — Schedule | Orario trigger | Verifica che sia impostato su 07:30 |
| Modulo 2 — HTTP Request | URL | `https://TUA-URL/webhook/task-update` |
| Modulo 2 — HTTP Request | Header `x-webhook-secret` | Il valore di `WEBHOOK_SECRET` nel tuo `.env` |

**Configurazione scheduling (passaggio obbligatorio in UI):**
- Dopo l'import, clicca l'icona **Scheduling** (orologio in basso a sinistra del canvas)
- Imposta: **Every day** → orario di avvio **07:30**
- Fuso orario: **Europe/Rome** (o il tuo fuso)
- Clicca **OK** poi **Save**

### Come testarlo

1. Assicurati che il bot Node.js sia in esecuzione
2. In Make.com, clicca **Run once** per forzare un'esecuzione immediata
3. Atteso: il modulo HTTP mostra status 200
4. Verifica in Telegram: devi ricevere il briefing giornaliero con i task in scadenza
5. Se non arriva nulla su Telegram ma l'HTTP è 200: nessun task in scadenza oggi (comportamento corretto)

### Troubleshooting comune

**Lo scenario non parte all'orario previsto**
- Verifica che lo scenario sia attivo (toggle ON)
- Controlla il fuso orario nelle impostazioni di Make.com (icona profilo → Settings → Timezone)
- Forza un test con **Run once** per escludere problemi di scheduling

**HTTP restituisce 404 Not Found**
- L'endpoint `/webhook/task-update` non è implementato nel tuo server Node.js
- Verifica che `src/webhook.js` gestisca la route `POST /webhook/task-update`

**Nessuna notifica Telegram ma il webhook risponde 200**
- Il server ha ricevuto il trigger ma non ha trovato task in scadenza oggi — comportamento normale
- Verifica le date di scadenza nel database Notion Tasks

---

## MODULO 4 — Client Health Score Update (`modulo-4-clients.json`)

**Scopo:** Ogni domenica alle 10:00 interroga Notion per tutti i clienti attivi, conta le lead e i task associati, e invia un aggiornamento del punteggio salute per ciascun cliente.

```
Schedule (ogni domenica alle 10:00)
      ↓
Notion: Query Clients (Status = "Active")
      ↓ [per ogni cliente]
Notion: Query Leads (filtra per email cliente)
Notion: Query Tasks (filtra per email cliente)
Set Variables (conteggi)
      ↓
POST /webhook/client-event { action: "health_score_update", ... }
      ↓ [se errore]
Notion: Log errore nel database Clients
```

### Come importarlo in Make.com

1. Segui gli stessi passi 1–4 del Modulo 2
2. Carica: `C:\Users\manue\Desktop\AIKE FULL\operations-os\setup\blueprints\modulo-4-clients.json`
3. Lo scenario si carica con 8 moduli.

### Variabili da configurare

| Modulo | Campo | Valore da inserire |
|---|---|---|
| Modulo 1 — Schedule | Orario trigger | Verifica domenica alle 10:00 |
| Modulo 2 — Notion Query Clients | Connection | Connetti la tua integrazione Notion |
| Modulo 2 — Notion Query Clients | Database ID | ID del tuo database Clients in Notion |
| Modulo 4 — Notion Query Leads | Connection | Stessa integrazione Notion |
| Modulo 4 — Notion Query Leads | Database ID | ID del tuo database Leads in Notion |
| Modulo 5 — Notion Query Tasks | Connection | Stessa integrazione Notion |
| Modulo 5 — Notion Query Tasks | Database ID | ID del tuo database Tasks in Notion |
| Modulo 7 — HTTP Request | URL | `https://TUA-URL/webhook/client-event` |
| Modulo 7 — HTTP Request | Header `x-webhook-secret` | Il valore di `WEBHOOK_SECRET` nel tuo `.env` |
| Modulo 8 — Notion Error Log | Connection | Stessa integrazione Notion |
| Modulo 8 — Notion Error Log | Database ID | ID del database Clients |

**Struttura richiesta nei database Notion:**
- **Clients DB**: campi `Name` (title), `Email` (email), `Status` (select con opzione `Active`), opzionale `Error Log` (rich_text)
- **Leads DB**: campo `Email` (email)
- **Tasks DB**: campi `ClientEmail` (rich_text), `Status` (select con opzione `Done`)

> Adatta i nomi dei campi al tuo schema reale modificando i mapper in Make.com dopo l'import.

### Come testarlo

1. Aggiungi almeno un cliente con Status `Active` nel tuo database Notion Clients
2. Assicurati che il bot Node.js sia in esecuzione
3. In Make.com, clicca **Run once**
4. Atteso: per ogni cliente attivo, il modulo HTTP mostra status 200
5. Verifica in Telegram: devi ricevere un report con i punteggi salute dei clienti

### Troubleshooting comune

**Notion restituisce 404**
- L'integrazione Notion non è collegata al database
- Vai al database in Notion → tre puntini → Connessioni → Aggiungi la tua integrazione OperationsOS

**Il modulo Iterator non elabora nessun cliente**
- Nessun cliente con Status `Active` nel database
- Oppure il nome del campo Status non corrisponde: verifica che si chiami esattamente `Status` con opzione `Active`

**Errore "property not found" nel modulo 6 (Set Variables)**
- I nomi dei campi nel mapper non corrispondono allo schema del tuo database
- Clicca il modulo in Make.com → verifica la mappatura → aggiorna i riferimenti ai campi

---

## MODULO 5 — Invoice Alert + Revenue Tracking (`modulo-5-revenue.json`)

**Scopo:** Intercetta le email di fatture e pagamenti, estrae automaticamente l'importo con regex, e invia i dati al webhook per il tracciamento delle entrate in Notion.

```
Gmail (nuova email con "fattura/invoice/pagamento")
      ↓  [filter keywords]
Set Variables (sender, subject, body preview)
      ↓
Regexp: estrai importo (€1.234,56 / 1234.56€ / EUR)
Set Variables (detected_amount o null)
      ↓
POST /webhook/revenue-event
      ↓ [se 200 OK]
Gmail: Mark as Read + Apply Label "OperationsOS-Revenue"
      ↓ [se errore HTTP]
Gmail: Apply Label "OperationsOS-Error"
```

### Come importarlo in Make.com

1. Segui gli stessi passi 1–4 del Modulo 2
2. Carica: `C:\Users\manue\Desktop\AIKE FULL\operations-os\setup\blueprints\modulo-5-revenue.json`
3. Lo scenario si carica con 9 moduli.

### Variabili da configurare

| Modulo | Campo | Valore da inserire |
|---|---|---|
| Modulo 1 — Gmail Trigger | Connection | Connetti il tuo account Gmail |
| Modulo 6 — HTTP Request | URL | `https://TUA-URL/webhook/revenue-event` |
| Modulo 6 — HTTP Request | Header `x-webhook-secret` | Il valore di `WEBHOOK_SECRET` nel tuo `.env` |
| Modulo 7 — Mark as Read | Connection | Stesso account Gmail del Modulo 1 |
| Modulo 8 — Add Label Revenue | Connection | Stesso account Gmail |
| Modulo 9 — Add Label Error | Connection | Stesso account Gmail |

**Label Gmail da creare prima dell'attivazione:**
- `OperationsOS-Revenue` — per le email elaborate con successo
- `OperationsOS-Error` — per le email con errori di processing

Come creare le label:
1. Apri Gmail → Impostazioni (ingranaggio) → Visualizza tutte le impostazioni
2. Scheda **Etichette** → Crea nuova etichetta → digita il nome → Crea

### Come testarlo

1. Assicurati che il bot Node.js sia in esecuzione
2. Invia una email al tuo Gmail con oggetto: `Fattura #001 — €1.500,00`
3. Nel corpo: `In allegato la fattura per i servizi di gennaio. Totale: €1.500,00`
4. In Make.com, clicca **Run once**
5. Atteso:
   - Modulo 4 (Regexp): trova il valore `1.500,00`
   - Modulo 6 (HTTP): status 200
   - Email marcata come letta con label `OperationsOS-Revenue`
6. Verifica in Notion: deve apparire un record con `detectedAmount: "1.500,00"`
7. Verifica in Telegram: devi ricevere una notifica con l'importo rilevato

### Troubleshooting comune

**`detectedAmount` è sempre null**
- Il formato dell'importo nell'email non corrisponde al pattern regex
- Pattern supportati: `€1.234,56`, `1234,56€`, `1234.56 EUR`
- Formato NON supportato: `1500` (senza decimali) — aggiungi un formato decimale all'importo nel test
- Puoi testare il regex su [regex101.com](https://regex101.com) con il pattern incluso nel blueprint

**Label Gmail non applicata**
- La label non esiste in Gmail — devi crearla manualmente (vedi istruzioni sopra)
- Oppure il nome label nel blueprint non corrisponde esattamente — è case-sensitive

**L'email viene processata due volte**
- Il modulo Mark as Read (7) non viene eseguito perché il filtro "HTTP call succeeded" fallisce
- Verifica che il modulo HTTP (6) restituisca effettivamente 200
- Controlla i log del server Node.js per eventuali errori interni

---

## Riepilogo Blueprint Moduli 2–5

| File | Scenario | Trigger | Endpoint |
|---|---|---|---|
| `modulo-2-quotes.json` | Quote Capture | Gmail ogni 15 min | `POST /webhook/new-quote` |
| `modulo-3-tasks.json` | Task Deadline Reminder | Schedule 07:30 | `POST /webhook/task-update` |
| `modulo-4-clients.json` | Client Health Score | Schedule domenica 10:00 | `POST /webhook/client-event` |
| `modulo-5-revenue.json` | Invoice Alert | Gmail ogni 15 min | `POST /webhook/revenue-event` |

Tutti i blueprint usano l'header `x-webhook-secret` per autenticarsi con il server Node.js.

**Operazioni Make.com stimate per scenario:**
- Modulo 2: ~6 ops per email processata
- Modulo 3: ~4 ops per esecuzione giornaliera
- Modulo 4: ~(3 + n×4) ops dove n = numero clienti attivi
- Modulo 5: ~9 ops per email processata
