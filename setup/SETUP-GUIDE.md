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
