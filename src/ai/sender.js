'use strict';

const bot = require('../bot');
const { escapeMarkdownV2 } = require('../telegram/alerts');

/**
 * Formatta e invia il digest serale su Telegram in formato MarkdownV2.
 * @param {string|number} chatId      - Telegram chat ID dell'operatore
 * @param {string}        digestText  - Testo del digest (da generateDigest)
 * @param {object}        data        - Dati raccolti da collectDailyData() (usati per la data)
 */
async function sendDigest(chatId, digestText, data) {
  const date = data?.date || new Date().toISOString().split('T')[0];
  const escapedDate = escapeMarkdownV2(date);

  // Escape the AI-generated body — Claude may produce any character
  const escapedBody = escapeMarkdownV2(digestText);

  const message =
    `🧠 *Briefing Serale — ${escapedDate}*\n\n` +
    `${escapedBody}\n\n` +
    `────────────────\n` +
    `_Generato da OperationsOS AI_`;

  try {
    await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
  } catch (err) {
    console.error(`[sender] sendDigest error to chat ${chatId}:`, err.message);
    throw err;
  }
}

module.exports = { sendDigest };
