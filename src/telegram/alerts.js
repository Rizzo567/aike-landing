'use strict';

const { Markup } = require('telegraf');
const bot = require('../bot');

/**
 * Escape special characters for Telegram MarkdownV2 formatting.
 * Characters that must be escaped: _ * [ ] ( ) ~ ` > # + - = | { } . !
 * @param {string} text
 * @returns {string}
 */
function escapeMarkdownV2(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (char) => `\\${char}`);
}

/**
 * Format a lead record into a clean MarkdownV2 Telegram message card.
 * @param {object} lead - Plain lead object from extractLeadData()
 * @returns {string} MarkdownV2-formatted string
 */
function formatLeadCard(lead) {
  const name = escapeMarkdownV2(lead.name);
  const email = escapeMarkdownV2(lead.email);
  const source = escapeMarkdownV2(lead.source || 'Unknown');
  const score = lead.score !== null ? escapeMarkdownV2(String(lead.score)) : 'N/A';
  const status = escapeMarkdownV2(lead.status || 'New');
  const notes = lead.notes ? escapeMarkdownV2(lead.notes.slice(0, 300)) : null;
  const lastContact = lead.lastContact ? escapeMarkdownV2(lead.lastContact) : 'N/A';

  let card = `🔔 *New Lead Captured*\n\n`;
  card += `👤 *${name}*\n`;
  card += `📧 ${email}\n`;
  card += `🏷 Source: ${source}\n`;
  card += `⭐ Score: ${score}/10\n`;

  if (notes) {
    card += `\n📝 _"${notes}\\.\\.\\."_\n`;
  }

  card += `\n────────────────`;

  return card;
}

/**
 * Format a detailed lead card for the "View Details" callback.
 * @param {object} lead - Plain lead object from extractLeadData()
 * @returns {string} MarkdownV2-formatted string
 */
function formatLeadDetailCard(lead) {
  const name = escapeMarkdownV2(lead.name);
  const email = escapeMarkdownV2(lead.email);
  const source = escapeMarkdownV2(lead.source || 'Unknown');
  const score = lead.score !== null ? escapeMarkdownV2(String(lead.score)) : 'N/A';
  const status = escapeMarkdownV2(lead.status || 'New');
  const notes = lead.notes ? escapeMarkdownV2(lead.notes.slice(0, 500)) : '_No notes_';
  const lastContact = lead.lastContact ? escapeMarkdownV2(lead.lastContact) : 'N/A';
  const created = lead.created
    ? escapeMarkdownV2(new Date(lead.created).toLocaleDateString('en-GB'))
    : 'N/A';

  let card = `📋 *Lead Details*\n\n`;
  card += `👤 *Name:* ${name}\n`;
  card += `📧 *Email:* ${email}\n`;
  card += `🏷 *Source:* ${source}\n`;
  card += `⭐ *Score:* ${score}/10\n`;
  card += `📊 *Status:* ${status}\n`;
  card += `📅 *Last Contact:* ${lastContact}\n`;
  card += `🗓 *Created:* ${created}\n`;
  card += `\n📝 *Notes:*\n${notes}\n`;
  card += `\n────────────────`;

  return card;
}

/**
 * Send a new lead alert to the operator with action buttons.
 * @param {string|number} chatId - Telegram chat ID
 * @param {object} lead - Plain lead object from extractLeadData()
 * @param {string} notionPageId - The Notion page ID (used in callback_data)
 */
async function sendLeadAlert(chatId, lead, notionPageId) {
  const message = formatLeadCard(lead);

  // Notion page IDs contain hyphens; keep them as-is since callback_data
  // parsing uses the last segment after the final underscore prefix.
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Qualify', `qualify_${notionPageId}`),
      Markup.button.callback('❌ Discard', `discard_${notionPageId}`),
    ],
    [Markup.button.callback('👁 View Full Details', `view_${notionPageId}`)],
  ]);

  try {
    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'MarkdownV2',
      ...keyboard,
    });
  } catch (err) {
    console.error(`[telegram/alerts] sendLeadAlert error to chat ${chatId}:`, err.message);
    throw err;
  }
}

/**
 * Send a simple confirmation message to a chat.
 * @param {string|number} chatId
 * @param {string} message - Plain text message (will be escaped)
 */
async function sendConfirmation(chatId, message) {
  try {
    await bot.telegram.sendMessage(chatId, escapeMarkdownV2(message), {
      parse_mode: 'MarkdownV2',
    });
  } catch (err) {
    console.error(`[telegram/alerts] sendConfirmation error to chat ${chatId}:`, err.message);
    throw err;
  }
}

module.exports = {
  sendLeadAlert,
  sendConfirmation,
  formatLeadCard,
  formatLeadDetailCard,
  escapeMarkdownV2,
};
