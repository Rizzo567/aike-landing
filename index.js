'use strict';

// Load environment variables first, before any other imports
require('dotenv').config();

const express = require('express');
const bot = require('./src/bot');
const { registerCommands } = require('./src/handlers/commands');
const { registerCallbacks } = require('./src/handlers/callbacks');
const makecomRouter = require('./src/webhook/makecom');

const PORT = parseInt(process.env.PORT || '3000', 10);

// ─── Validate required env vars ───────────────────────────────────────────────
const REQUIRED_ENV = [
  'TELEGRAM_BOT_TOKEN',
  'NOTION_API_KEY',
  'NOTION_LEADS_DB_ID',
  'OPERATOR_CHAT_ID',
  'WEBHOOK_SECRET',
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
