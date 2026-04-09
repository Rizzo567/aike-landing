'use strict';

// Load environment variables first, before any other imports
require('dotenv').config();

const express = require('express');
const cron = require('node-cron');
const bot = require('./src/bot');
const { registerCommands } = require('./src/handlers/commands');
const { registerCallbacks } = require('./src/handlers/callbacks');
const makecomRouter = require('./src/webhook/makecom');
const { getExpiredQuotes, extractQuoteData } = require('./src/notion/quotes');
const { getTasksDueToday, getTasksDueTomorrow, extractTaskData } = require('./src/notion/tasks');
const { sendExpiredQuoteAlert, sendDailyBrief, sendTaskAlert } = require('./src/telegram/alerts');
const { collectDailyData } = require('./src/ai/collector');
const { generateDigest } = require('./src/ai/digest');
const { sendDigest } = require('./src/ai/sender');

const PORT = parseInt(process.env.PORT || '3000', 10);

// ─── Validate required env vars ───────────────────────────────────────────────
const REQUIRED_ENV = [
  'TELEGRAM_BOT_TOKEN',
  'NOTION_API_KEY',
  'NOTION_LEADS_DB_ID',
  'NOTION_QUOTES_DB_ID',
  'NOTION_TASKS_DB_ID',
  'OPERATOR_CHAT_ID',
  'WEBHOOK_SECRET',
  'ANTHROPIC_API_KEY',
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[index] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[index] Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

// ─── Register bot handlers ────────────────────────────────────────────────────
registerCommands(bot);
registerCallbacks(bot);

// ─── Express app ─────────────────────────────────────────────────────────────
const app = express();

// Parse JSON bodies for all routes
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'operations-os-bot',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Make.com webhook ────────────────────────────────────────────────────────
app.use('/webhook', makecomRouter);

// ─── Telegram webhook ────────────────────────────────────────────────────────
// Telegraf handles the /telegram path and processes incoming Telegram updates.
// In production, set your webhook URL via:
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/telegram
app.use(bot.webhookCallback('/telegram'));

// ─── 404 fallback ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[index] Unhandled express error:', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[index] OperationsOS bot server running on port ${PORT}`);
  console.log(`[index] Telegram webhook path: POST /telegram`);
  console.log(`[index] Make.com webhook path: POST /webhook/new-lead`);
  console.log(`[index] Health check: GET /health`);
  console.log(`[index] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ─── Cron schedulers ─────────────────────────────────────────────────────────
const OPERATOR_CHAT_ID = process.env.OPERATOR_CHAT_ID;

/**
 * Daily brief at 08:00 — send all tasks due today.
 */
cron.schedule('0 8 * * *', async () => {
  console.log('[cron] Running daily brief (08:00)');
  try {
    const pages = await getTasksDueToday();
    const tasks = pages.map(extractTaskData);
    await sendDailyBrief(OPERATOR_CHAT_ID, tasks);
    console.log(`[cron] Daily brief sent — ${tasks.length} task(s) due today`);
  } catch (err) {
    console.error('[cron] Daily brief error:', err.message);
  }
}, { timezone: 'Europe/Rome' });

/**
 * Evening reminders at 20:00 — send task alerts for tomorrow's deadlines.
 */
cron.schedule('0 20 * * *', async () => {
  console.log('[cron] Running tomorrow deadline reminders (20:00)');
  try {
    const pages = await getTasksDueTomorrow();
    const tasks = pages.map(extractTaskData);

    if (tasks.length === 0) {
      console.log('[cron] No tasks due tomorrow — skipping alerts');
    } else {
      for (const task of tasks) {
        await sendTaskAlert(OPERATOR_CHAT_ID, task, task.id);
      }
      console.log(`[cron] Tomorrow reminders sent — ${tasks.length} task(s)`);
    }
  } catch (err) {
    console.error('[cron] Tomorrow reminders error:', err.message);
  }
}, { timezone: 'Europe/Rome' });

/**
 * Expired quote check at 09:00 — alert for quotes with Due Date < today and Status = Sent.
 */
cron.schedule('0 9 * * *', async () => {
  console.log('[cron] Running expired quote check (09:00)');
  try {
    const pages = await getExpiredQuotes();
    const quotes = pages.map(extractQuoteData);

    if (quotes.length === 0) {
      console.log('[cron] No expired quotes found');
      return;
    }

    for (const quote of quotes) {
      await sendExpiredQuoteAlert(OPERATOR_CHAT_ID, quote, quote.id);
    }
    console.log(`[cron] Expired quote alerts sent — ${quotes.length} quote(s)`);
  } catch (err) {
    console.error('[cron] Expired quote check error:', err.message);
  }
}, { timezone: 'Europe/Rome' });

// Modulo 6 — AI Daily Digest (ogni sera alle 20:30)
cron.schedule('30 20 * * *', async () => {
  console.log('[cron] Starting AI digest generation...');
  try {
    const data = await collectDailyData();
    const digestText = await generateDigest(data);
    await sendDigest(OPERATOR_CHAT_ID, digestText, data);
    console.log('[cron] AI digest sent successfully');
  } catch (err) {
    console.error('[cron] AI digest failed:', err.message);
  }
}, { timezone: 'Europe/Rome' });

// ─── Graceful shutdown ───────────────────────────────────────────────────────
process.once('SIGINT', () => {
  console.log('[index] SIGINT received — shutting down gracefully');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('[index] SIGTERM received — shutting down gracefully');
  bot.stop('SIGTERM');
  process.exit(0);
});
