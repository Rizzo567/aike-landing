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

// ─── Module 2: Quote Alerts ───────────────────────────────────────────────────

/**
 * Format a quote record into a MarkdownV2 Telegram message card.
 * @param {object} quote - Plain quote object from extractQuoteData()
 * @returns {string} MarkdownV2-formatted string
 */
function formatQuoteCard(quote) {
  const clientName = escapeMarkdownV2(quote.clientName);
  const email = escapeMarkdownV2(quote.email);
  const amount =
    quote.amount !== null
      ? escapeMarkdownV2(`€${Number(quote.amount).toLocaleString('it-IT')}`)
      : 'N/A';
  const status = escapeMarkdownV2(quote.status || 'Draft');
  const dueDate = quote.dueDate ? escapeMarkdownV2(quote.dueDate) : 'N/A';
  const notes = quote.notes ? escapeMarkdownV2(quote.notes.slice(0, 300)) : null;

  let card = `📄 *Nuovo Preventivo*\n\n`;
  card += `👤 *${clientName}*\n`;
  card += `📧 ${email}\n`;
  card += `💶 Importo: *${amount}*\n`;
  card += `📊 Status: ${status}\n`;
  card += `📅 Scadenza: ${dueDate}\n`;

  if (notes) {
    card += `\n📝 _"${notes}\\.\\.\\."_\n`;
  }

  card += `\n────────────────`;

  return card;
}

/**
 * Send a quote alert to the operator with action buttons.
 * @param {string|number} chatId
 * @param {object} quote - Plain quote object from extractQuoteData()
 * @param {string} notionPageId - Notion page ID
 */
async function sendQuoteAlert(chatId, quote, notionPageId) {
  const message = formatQuoteCard(quote);

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('📤 Send', `quotesend_${notionPageId}`),
      Markup.button.callback('✅ Accept', `quoteaccept_${notionPageId}`),
      Markup.button.callback('❌ Reject', `quotereject_${notionPageId}`),
    ],
  ]);

  try {
    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'MarkdownV2',
      ...keyboard,
    });
  } catch (err) {
    console.error(`[telegram/alerts] sendQuoteAlert error to chat ${chatId}:`, err.message);
    throw err;
  }
}

/**
 * Send an expired quote alert to the operator.
 * @param {string|number} chatId
 * @param {object} quote - Plain quote object from extractQuoteData()
 * @param {string} notionPageId - Notion page ID
 */
async function sendExpiredQuoteAlert(chatId, quote, notionPageId) {
  const clientName = escapeMarkdownV2(quote.clientName);
  const amount =
    quote.amount !== null
      ? escapeMarkdownV2(`€${Number(quote.amount).toLocaleString('it-IT')}`)
      : 'N/A';
  const dueDate = quote.dueDate ? escapeMarkdownV2(quote.dueDate) : 'N/A';

  let message = `⚠️ *Preventivo Scaduto*\n\n`;
  message += `👤 *${clientName}*\n`;
  message += `💶 Importo: ${amount}\n`;
  message += `📅 Scaduto il: ${dueDate}\n\n`;
  message += `_Aggiorna lo stato o contatta il cliente\\._\n`;
  message += `────────────────`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Accept', `quoteaccept_${notionPageId}`),
      Markup.button.callback('❌ Reject', `quotereject_${notionPageId}`),
    ],
    [Markup.button.callback('🔄 Mark Expired', `quoteexpired_${notionPageId}`)],
  ]);

  try {
    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'MarkdownV2',
      ...keyboard,
    });
  } catch (err) {
    console.error(
      `[telegram/alerts] sendExpiredQuoteAlert error to chat ${chatId}:`,
      err.message
    );
    throw err;
  }
}

// ─── Module 3: Task Alerts ────────────────────────────────────────────────────

/**
 * Format a task record into a MarkdownV2 Telegram message card.
 * @param {object} task - Plain task object from extractTaskData()
 * @returns {string} MarkdownV2-formatted string
 */
function formatTaskCard(task) {
  const priorityEmojis = { High: '🔴', Medium: '🟡', Low: '🟢' };

  const name = escapeMarkdownV2(task.name);
  const status = escapeMarkdownV2(task.status || 'Todo');
  const priority = escapeMarkdownV2(task.priority || 'Medium');
  const priorityEmoji = priorityEmojis[task.priority] || '⚪';
  const dueDate = task.dueDate ? escapeMarkdownV2(task.dueDate) : 'N/A';
  const description = task.description ? escapeMarkdownV2(task.description.slice(0, 300)) : null;

  let card = `📌 *Task Alert*\n\n`;
  card += `*${name}*\n`;
  card += `${priorityEmoji} Priority: *${priority}*\n`;
  card += `📊 Status: ${status}\n`;
  card += `📅 Due: ${dueDate}\n`;

  if (description) {
    card += `\n📝 ${description}\n`;
  }

  card += `\n────────────────`;

  return card;
}

/**
 * Send a task alert to the operator with action buttons.
 * @param {string|number} chatId
 * @param {object} task - Plain task object from extractTaskData()
 * @param {string} notionPageId - Notion page ID
 */
async function sendTaskAlert(chatId, task, notionPageId) {
  const message = formatTaskCard(task);

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('▶️ Start', `taskstart_${notionPageId}`),
      Markup.button.callback('✅ Done', `taskdone_${notionPageId}`),
      Markup.button.callback('🚫 Block', `taskblock_${notionPageId}`),
    ],
  ]);

  try {
    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'MarkdownV2',
      ...keyboard,
    });
  } catch (err) {
    console.error(`[telegram/alerts] sendTaskAlert error to chat ${chatId}:`, err.message);
    throw err;
  }
}

/**
 * Send a daily brief with all tasks due today.
 * @param {string|number} chatId
 * @param {Array} tasks - Array of plain task objects from extractTaskData()
 */
async function sendDailyBrief(chatId, tasks) {
  const priorityEmojis = { High: '🔴', Medium: '🟡', Low: '🟢' };
  const today = escapeMarkdownV2(new Date().toLocaleDateString('it-IT'));

  if (tasks.length === 0) {
    const message =
      `☀️ *Daily Brief — ${today}*\n\n` +
      `✅ Nessun task in scadenza oggi\\.\n` +
      `Buona giornata\\! 🎯`;

    try {
      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[telegram/alerts] sendDailyBrief error to chat ${chatId}:`, err.message);
      throw err;
    }
    return;
  }

  let message = `☀️ *Daily Brief — ${today}*\n\n`;
  message += `📋 *${escapeMarkdownV2(String(tasks.length))} task${tasks.length !== 1 ? 's' : ''} in scadenza oggi:*\n\n`;

  tasks.forEach((task, i) => {
    const name = escapeMarkdownV2(task.name);
    const priority = escapeMarkdownV2(task.priority || 'Medium');
    const status = escapeMarkdownV2(task.status || 'Todo');
    const priorityEmoji = priorityEmojis[task.priority] || '⚪';

    message += `*${i + 1}\\. ${name}*\n`;
    message += `${priorityEmoji} ${priority} \\| 📊 ${status}\n\n`;
  });

  message += `────────────────\n_Usa /tasks per vedere tutti i task attivi_`;

  try {
    await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
  } catch (err) {
    console.error(`[telegram/alerts] sendDailyBrief error to chat ${chatId}:`, err.message);
    throw err;
  }
}

module.exports = {
  sendLeadAlert,
  sendConfirmation,
  formatLeadCard,
  formatLeadDetailCard,
  escapeMarkdownV2,
  // Module 2 — Quotes
  sendQuoteAlert,
  sendExpiredQuoteAlert,
  formatQuoteCard,
  // Module 3 — Tasks
  sendTaskAlert,
  sendDailyBrief,
  formatTaskCard,
};
