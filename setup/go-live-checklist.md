# OperationsOS — Go-Live Checklist

Completa ogni fase in ordine. Spunta ogni voce solo quando è effettivamente completata.

---

## Fase 1 — Setup Notion

Crea i 5 database Notion con le proprietà corrette. Ogni database deve essere connesso all'integration OperationsOS.

### Database 1: Leads

- [ ] Crea un nuovo database full-page su Notion chiamato **Leads**
- [ ] Aggiungi la proprietà **Name** (tipo: Title) — nome del lead
- [ ] Aggiungi la proprietà **Email** (tipo: Email) — email del lead
- [ ] Aggiungi la proprietà **Status** (tipo: Select) con opzioni: `New`, `Contacted`, `Qualified`, `Lost`
- [ ] Aggiungi la proprietà **Source** (tipo: Select) con opzioni: `Gmail`, `Manual`, `Referral`, `Other`
- [ ] Aggiungi la proprietà **Notes** (tipo: Text) — note libere
- [ ] Aggiungi la proprietà **Created** (tipo: Created time) — data di arrivo automatica
- [ ] Connetti l'integration: clicca i tre puntini del database → **Add connections** → seleziona **OperationsOS**
- [ ] Copia l'ID del database (vedi guida in DEPLOY-RAILWAY.md, Passo 3) e salvalo come `NOTION_LEADS_DB_ID`

### Database 2: Clienti

- [ ] Crea un nuovo database full-page chiamato **Clienti**
- [ ] Aggiungi la proprietà **Name** (tipo: Title) — nome del cliente
- [ ] Aggiungi la proprietà **Email** (tipo: Email)
- [ ] Aggiungi la proprietà **Status** (tipo: Select) con opzioni: `Active`, `At-Risk`, `Churned`, `Prospect`
- [ ] Aggiungi la proprietà **Last Contact** (tipo: Date) — ultima volta che è stato contattato
- [ ] Aggiungi la proprietà **Monthly Value** (tipo: Number, formato: Euro) — valore mensile del contratto
- [ ] Connetti l'integration OperationsOS al database
- [ ] Salva l'ID come `NOTION_CLIENTS_DB_ID`

### Database 3: Revenue / Fatture

- [ ] Crea un nuovo database full-page chiamato **Revenue**
- [ ] Aggiungi la proprietà **Name** (tipo: Title) — descrizione della fattura
- [ ] Aggiungi la proprietà **Amount** (tipo: Number, formato: Euro) — importo
- [ ] Aggiungi la proprietà **Status** (tipo: Select) con opzioni: `Pending`, `Paid`, `Overdue`, `Cancelled`
- [ ] Aggiungi la proprietà **Due Date** (tipo: Date) — data di scadenza
- [ ] Aggiungi la proprietà **Client** (tipo: Text) — nome del cliente
- [ ] Connetti l'integration OperationsOS al database
- [ ] Salva l'ID come `NOTION_REVENUE_DB_ID`

### Database 4: Tasks (opzionale)

- [ ] Crea un database **Tasks** se vuoi gestire attività operative
- [ ] Proprietà minime: **Name** (Title), **Status** (Select: `Todo`, `In Progress`, `Done`), **Due Date** (Date)
- [ ] Connetti l'integration OperationsOS

### Database 5: AI Digest / Log (opzionale)

- [ ] Crea un database **AI Log** se vuoi tracciare i digest settimanali AI
- [ ] Proprietà minime: **Name** (Title), **Date** (Date), **Content** (Text)
- [ ] Connetti l'integration OperationsOS

---

## Fase 2 — Setup Telegram

- [ ] Apri Telegram e cerca **@BotFather**
- [ ] Scrivi `/newbot` e segui le istruzioni:
  - Scegli un nome visibile (es. `OperationsOS Bot`)
  - Scegli uno username che finisce in `bot` (es. `operationsOS_bot`)
- [ ] BotFather ti risponde con il **token** — copialo e salvalo come `TELEGRAM_BOT_TOKEN`
  - Formato: `1234567890:ABCdefGHIjklmNOPqrsTUVwxyz`
- [ ] Cerca **@userinfobot** su Telegram e scrivici qualcosa
- [ ] userinfobot ti risponde con il tuo **ID numerico** — salvalo come `OPERATOR_CHAT_ID`
  - Formato: `427943786`
- [ ] Apri il bot che hai appena creato su Telegram e premi **Start** (questo attiva la conversazione)
- [ ] Verifica che il bot risponda al comando `/start` dopo il deploy

---

## Fase 3 — Setup Make.com

- [ ] Crea un account su [make.com](https://make.com) se non ce l'hai
- [ ] Vai su **Scenarios** → **Import Blueprint**
- [ ] Importa il file `setup/makecom-scenario.json` presente nel repository
- [ ] Configura il **Gmail Watcher**:
  - [ ] Connetti il tuo account Gmail quando Make.com lo richiede
  - [ ] Imposta il filtro email (es. oggetto contiene "lead" o mittente specifico)
  - [ ] Testa la connessione con una email di esempio
- [ ] Configura il modulo **HTTP → Make a request** (webhook verso il bot):
  - [ ] URL: `https://<TUO-DOMINIO-RAILWAY>/webhook/new-lead`
  - [ ] Metodo: `POST`
  - [ ] Header: `x-webhook-secret: <WEBHOOK_SECRET>` (stessa stringa usata in Railway)
  - [ ] Body (JSON): mappa i campi Gmail → nome, email, messaggio
- [ ] Attiva lo scenario (toggle ON in alto a sinistra)
- [ ] Fai un test end-to-end: manda una email di test → verifica che arrivi notifica su Telegram

---

## Fase 4 — Deploy & Test

### Deploy Railway

- [ ] Segui la guida completa in `setup/DEPLOY-RAILWAY.md`
- [ ] Verifica che il deploy sia completato senza errori nei log
- [ ] Copia il Public Domain di Railway (es. `operations-os-xxx.railway.app`)
- [ ] Salva il dominio come `WEBHOOK_URL` nelle variabili Railway

### Imposta il webhook Telegram

- [ ] Apri nel browser (sostituendo i valori):
  ```
  https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<DOMINIO>/telegram
  ```
- [ ] Dovresti vedere la risposta: `{"ok":true,"result":true,...}`
- [ ] Verifica il webhook:
  ```
  https://api.telegram.org/bot<TOKEN>/getWebhookInfo
  ```

### Test funzionale — Modulo per Modulo

- [ ] **Modulo 1 — Nuovo Lead:** Invia una email di test → verifica notifica Telegram con dati del lead
- [ ] **Modulo 1 — Registra lead:** Nel bot Telegram, rispondi alla notifica del lead → verifica che compaia su Notion nel database Leads
- [ ] **Modulo 2 — Nuova task:** Usa il comando `/task` su Telegram → verifica che la task appaia su Notion
- [ ] **Modulo 3 — Nuovo cliente:** Usa il comando `/cliente` → verifica registrazione su Notion database Clienti
- [ ] **Modulo 4 — At-risk check:** Verifica che domenica mattina alle 10:00 (fuso orario Rome) arrivino gli alert clienti a rischio (oppure testa manualmente con un cliente con stato `At-Risk`)
- [ ] **Modulo 5 — Fatture scadute:** Verifica che ogni mattina alle 09:30 arrivino alert per fatture `Overdue` (oppure aggiungi manualmente una fattura con `Due Date` nel passato)
- [ ] **Modulo 5 — Report mensile:** Il report arriva il 1° del mese alle 08:00 — verifica la logica nei log
- [ ] **Health check:** Apri `https://<DOMINIO>/health` → deve rispondere `{"status":"ok",...}`

### Verifica finale

- [ ] Il bot risponde ai comandi Telegram in meno di 3 secondi
- [ ] I dati appaiono correttamente su Notion dopo ogni azione
- [ ] Railway mostra il servizio come **Active** (punto verde)
- [ ] Nessun errore rosso nei log delle ultime 24 ore

---

**OperationsOS e' pronto!**

Per supporto: controlla i log su Railway (tab Logs) e cerca righe che iniziano con `[ERROR]` o `error`.
