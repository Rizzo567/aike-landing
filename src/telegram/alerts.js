'use strict';

const { Markup } = require('telegraf');
const bot = require('../bot');

function escapeMarkdownV2(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (char) => `\\${char}`);
}

function formatLeadCard(lead) {
  const name = escapeMarkdownV2(lead.name);
  const email = escapeMarkdownV2(lead.email);
  const source = escapeMarkdownV2(lead.source || 'Unknown');
  const score = lead.score !== null ? escapeMarkdownV2(String(lead.score)) : 'N/A';
  const notes = lead.notes ? escapeMarkdownV2(lead.notes.slice(0, 300)) : null;
  let card = `🔔 *New Lead Captured*\n\n`;
  card += `👤 *${name}*\n`;
  card += `📧 ${email}\n`;
  card += `🏷 Source: ${source}\n`;
  card += `⭐ Score: ${score}/10\n`;
  if (notes) { card += `\n📝 _"${notes}\\.\\.\\..."`; }
  card += `\n────────────────`;
  return card;
}

function formatLeadDetailCard(lead) {
  const name = escapeMarkdownV2(lead.name);
  const email = escapeMarkdownV2(lead.email);
  const source = escapeMarkdownV2(lead.source || 'Unknown');
  const score = lead.score !== null ? escapeMarkdownV2(String(lead.score)) : 'N/A';
  const status = escapeMarkdownV2(lead.status || 'New');
  const notes = lead.notes ? escapeMarkdownV2(lead.notes.slice(0, 500)) : '_No notes_';
  const lastContact = lead.lastContact ? escapeMarkdownV2(lead.lastContact) : 'N/A';
  const created = lead.created ? escapeMarkdownV2(new Date(lead.created).toLocaleDateString('en-GB')) : 'N/A';
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

async function sendLeadAlert(chatId, lead, notionPageId) {
  const message = formatLeadCard(lead);
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("✅ Qualify", `qualify_${notionPageId}`), Markup.button.callback("❌ Discard", `discard_${notionPageId}`)],
    [Markup.button.callback("👁 View Full Details", `view_${notionPageId}`)],
  ]);
  try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2', ...keyboard }); }
  catch (err) { console.error(`[telegram/alerts] sendLeadAlert error to chat ${chatId}:`, err.message); throw err; }
}

async function sendConfirmation(chatId, message) {
  try { await bot.telegram.sendMessage(chatId, escapeMarkdownV2(message), { parse_mode: 'MarkdownV2' }); }
  catch (err) { console.error(`[telegram/alerts] sendConfirmation error to chat ${chatId}:`, err.message); throw err; }
}

// Module 2: Quote Alerts

function formatQuoteCard(quote) {
  const clientName = escapeMarkdownV2(quote.clientName);
  const email = escapeMarkdownV2(quote.email);
  const amount = quote.amount !== null ? escapeMarkdownV2(`€${Number(quote.amount).toLocaleString('it-IT')}`) : 'N/A';
  const status = escapeMarkdownV2(quote.status || 'Draft');
  const dueDate = quote.dueDate ? escapeMarkdownV2(quote.dueDate) : 'N/A';
  const notes = quote.notes ? escapeMarkdownV2(quote.notes.slice(0, 300)) : null;
  let card = `📄 *Nuovo Preventivo*\n\n`;
  card += `👤 *${clientName}*\n📧 ${email}\n💶 Importo: *${amount}*\n📊 Status: ${status}\n📅 Scadenza: ${dueDate}\n`;
  if (notes) { card += `\n📝 _"${notes}\\.\\.\\..."`; }
  card += `\n────────────────`;
  return card;
}

async function sendQuoteAlert(chatId, quote, notionPageId) {
  const message = formatQuoteCard(quote);
  const keyboard = Markup.inlineKeyboard([[
    Markup.button.callback("📤 Send", `quotesend_${notionPageId}`),
    Markup.button.callback("✅ Accept", `quoteaccept_${notionPageId}`),
    Markup.button.callback("❌ Reject", `quotereject_${notionPageId}`),
  ]]);
  try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2', ...keyboard }); }
  catch (err) { console.error(`[telegram/alerts] sendQuoteAlert error to chat ${chatId}:`, err.message); throw err; }
}

async function sendExpiredQuoteAlert(chatId, quote, notionPageId) {
  const clientName = escapeMarkdownV2(quote.clientName);
  const amount = quote.amount !== null ? escapeMarkdownV2(`€${Number(quote.amount).toLocaleString('it-IT')}`) : 'N/A';
  const dueDate = quote.dueDate ? escapeMarkdownV2(quote.dueDate) : 'N/A';
  let message = `⚠️ *Preventivo Scaduto*\n\n👤 *${clientName}*\n💶 Importo: ${amount}\n📅 Scaduto il: ${dueDate}\n\n_Aggiorna lo stato o contatta il cliente\\._\n────────────────`;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("✅ Accept", `quoteaccept_${notionPageId}`), Markup.button.callback("❌ Reject", `quotereject_${notionPageId}`)],
    [Markup.button.callback("🔄 Mark Expired", `quoteexpired_${notionPageId}`)],
  ]);
  try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2', ...keyboard }); }
  catch (err) { console.error(`[telegram/alerts] sendExpiredQuoteAlert error to chat ${chatId}:`, err.message); throw err; }
}

// Module 3: Task Alerts

function formatTaskCard(task) {
  const priorityEmojis = { High: '🔴', Medium: '🟡', Low: '🟢' };
  const name = escapeMarkdownV2(task.name);
  const status = escapeMarkdownV2(task.status || 'Todo');
  const priority = escapeMarkdownV2(task.priority || 'Medium');
  const priorityEmoji = priorityEmojis[task.priority] || '⚪';
  const dueDate = task.dueDate ? escapeMarkdownV2(task.dueDate) : 'N/A';
  const description = task.description ? escapeMarkdownV2(task.description.slice(0, 300)) : null;
  let card = `📌 *Task Alert*\n\n*${name}*\n${priorityEmoji} Priority: *${priority}*\n📊 Status: ${status}\n📅 Due: ${dueDate}\n`;
  if (description) { card += `\n📝 ${description}\n`; }
  card += `\n────────────────`;
  return card;
}

async function sendTaskAlert(chatId, task, notionPageId) {
  const message = formatTaskCard(task);
  const keyboard = Markup.inlineKeyboard([[
    Markup.button.callback("▶️ Start", `taskstart_${notionPageId}`),
    Markup.button.callback("✅ Done", `taskdone_${notionPageId}`),
    Markup.button.callback("🚫 Block", `taskblock_${notionPageId}`),
  ]]);
  try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2', ...keyboard }); }
  catch (err) { console.error(`[telegram/alerts] sendTaskAlert error to chat ${chatId}:`, err.message); throw err; }
}

async function sendDailyBrief(chatId, tasks) {
  const priorityEmojis = { High: '🔴', Medium: '🟡', Low: '🟢' };
  const today = escapeMarkdownV2(new Date().toLocaleDateString('it-IT'));
  if (tasks.length === 0) {
    const message = `☀️ *Daily Brief — ${today}*\n\n✅ Nessun task in scadenza oggi\\.\nBuona giornata\\! 🎯`;
    try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' }); }
    catch (err) { console.error(`[telegram/alerts] sendDailyBrief error to chat ${chatId}:`, err.message); throw err; }
    return;
  }
  let message = `☀️ *Daily Brief — ${today}*\n\n📋 *${escapeMarkdownV2(String(tasks.length))} task${tasks.length !== 1 ? 's' : ''} in scadenza oggi:*\n\n`;
  tasks.forEach((task, i) => {
    const name = escapeMarkdownV2(task.name);
    const priority = escapeMarkdownV2(task.priority || 'Medium');
    const status = escapeMarkdownV2(task.status || 'Todo');
    const priorityEmoji = priorityEmojis[task.priority] || '⚪';
    message += `*${i + 1}\\. ${name}*\n${priorityEmoji} ${priority} \\| 📊 ${status}\n\n`;
  });
  message += `────────────────\n_Usa /tasks per vedere tutti i task attivi_`;
  try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' }); }
  catch (err) { console.error(`[telegram/alerts] sendDailyBrief error to chat ${chatId}:`, err.message); throw err; }
}

// Module 4: Client Alerts

async function sendClientAlert(chatId, client, notionPageId) {
  const name = escapeMarkdownV2(client.name);
  const email = escapeMarkdownV2(client.email);
  const status = escapeMarkdownV2(client.status || 'Active');
  const score = client.healthScore !== null ? escapeMarkdownV2(String(client.healthScore)) : 'N/A';
  const monthly = client.monthlyValue !== null ? escapeMarkdownV2(`€${Number(client.monthlyValue).toLocaleString('it-IT')}`) : 'N/A';
  let message = `👤 *Cliente — ${name}*\n\n📧 ${email}\n📊 Status: ${status}\n❤️ Health Score: ${score}/100\n💶 Valore mensile: ${monthly}\n\n────────────────`;
  const keyboard = Markup.inlineKeyboard([[
    Markup.button.callback("📞 Contact", `clientcontact_${notionPageId}`),
    Markup.button.callback("💀 Churn", `clientchurn_${notionPageId}`),
  ]]);
  try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2', ...keyboard }); }
  catch (err) { console.error(`[telegram/alerts] sendClientAlert error to chat ${chatId}:`, err.message); throw err; }
}

async function sendAtRiskAlert(chatId, client, notionPageId) {
  const name = escapeMarkdownV2(client.name);
  const email = escapeMarkdownV2(client.email);
  const score = client.healthScore !== null ? escapeMarkdownV2(String(client.healthScore)) : 'N/A';
  const monthly = client.monthlyValue !== null ? escapeMarkdownV2(`€${Number(client.monthlyValue).toLocaleString('it-IT')}`) : 'N/A';
  const lastContact = client.lastContact ? escapeMarkdownV2(client.lastContact) : 'mai';
  let message = `🚨 *CLIENTE A RISCHIO CHURN*\n\n👤 *${name}*\n📧 ${email}\n🔴 Health Score: *${score}/100*\n💶 Valore mensile: ${monthly}\n📅 Ultimo contatto: ${lastContact}\n\n_Intervieni subito prima di perderlo\\!_\n────────────────`;
  const keyboard = Markup.inlineKeyboard([[
    Markup.button.callback("📞 Contact Now", `clientcontact_${notionPageId}`),
    Markup.button.callback("💀 Churn", `clientchurn_${notionPageId}`),
  ]]);
  try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2', ...keyboard }); }
  catch (err) { console.error(`[telegram/alerts] sendAtRiskAlert error to chat ${chatId}:`, err.message); throw err; }
}

// Module 5: Revenue Alerts

async function sendRevenueAlert(chatId, entry, notionPageId) {
  const clientName = escapeMarkdownV2(entry.clientName || entry.name);
  const email = escapeMarkdownV2(entry.email);
  const amount = entry.amount !== null ? escapeMarkdownV2(`€${Number(entry.amount).toLocaleString('it-IT')}`) : 'N/A';
  const status = escapeMarkdownV2(entry.status || 'Pending');
  const dueDate = entry.dueDate ? escapeMarkdownV2(entry.dueDate) : 'N/A';
  const invoiceDate = entry.invoiceDate ? escapeMarkdownV2(entry.invoiceDate) : 'N/A';
  let message = `💳 *Nuova Fattura*\n\n👤 *${clientName}*\n📧 ${email}\n💶 Importo: *${amount}*\n📊 Status: ${status}\n📅 Data fattura: ${invoiceDate}\n⏰ Scadenza: ${dueDate}\n\n────────────────`;
  const keyboard = Markup.inlineKeyboard([[
    Markup.button.callback("✅ Paid", `revpaid_${notionPageId}`),
    Markup.button.callback("⚠️ Overdue", `revoverdue_${notionPageId}`),
    Markup.button.callback("❌ Cancel", `revcancel_${notionPageId}`),
  ]]);
  try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2', ...keyboard }); }
  catch (err) { console.error(`[telegram/alerts] sendRevenueAlert error to chat ${chatId}:`, err.message); throw err; }
}

async function sendOverdueAlert(chatId, entry, notionPageId) {
  const clientName = escapeMarkdownV2(entry.clientName || entry.name);
  const email = escapeMarkdownV2(entry.email);
  const amount = entry.amount !== null ? escapeMarkdownV2(`€${Number(entry.amount).toLocaleString('it-IT')}`) : 'N/A';
  const dueDate = entry.dueDate ? escapeMarkdownV2(entry.dueDate) : 'N/A';
  const daysPastDue = entry.dueDate ? Math.floor((new Date() - new Date(entry.dueDate)) / (1000 * 60 * 60 * 24)) : null;
  const delayStr = daysPastDue !== null ? escapeMarkdownV2(`${daysPastDue} giorni di ritardo`) : 'data sconosciuta';
  let message = `🚨 *FATTURA SCADUTA*\n\n👤 *${clientName}*\n📧 ${email}\n💶 Importo: *${amount}*\n📅 Scaduta il: ${dueDate}\n⏱ Ritardo: *${delayStr}*\n\n_Contatta il cliente immediatamente\\!_\n────────────────`;
  const keyboard = Markup.inlineKeyboard([[
    Markup.button.callback("✅ Paid", `revpaid_${notionPageId}`),
    Markup.button.callback("❌ Cancel", `revcancel_${notionPageId}`),
  ]]);
  try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2', ...keyboard }); }
  catch (err) { console.error(`[telegram/alerts] sendOverdueAlert error to chat ${chatId}:`, err.message); throw err; }
}

async function sendMonthlyRevenueReport(chatId, total, breakdown) {
  const now = new Date();
  const monthLabel = escapeMarkdownV2(now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }));
  const totalStr = escapeMarkdownV2(`€${Number(total).toLocaleString('it-IT')}`);
  const pending = escapeMarkdownV2(String(breakdown.pending || 0));
  const paid = escapeMarkdownV2(String(breakdown.paid || 0));
  const overdue = escapeMarkdownV2(String(breakdown.overdue || 0));
  const cancelled = escapeMarkdownV2(String(breakdown.cancelled || 0));
  let message = `📊 *Report Revenue — ${monthLabel}*\n\n💶 *Totale incassato: ${totalStr}*\n\n📋 *Breakdown:*\n✅ Pagate: ${paid}\n⏳ In attesa: ${pending}\n🚨 Scadute: ${overdue}\n❌ Annullate: ${cancelled}\n\n────────────────\n_Usa /revenue per i dettagli_`;
  try { await bot.telegram.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' }); }
  catch (err) { console.error(`[telegram/alerts] sendMonthlyRevenueReport error to chat ${chatId}:`, err.message); throw err; }
}

module.exports = {
  sendLeadAlert, sendConfirmation, formatLeadCard, formatLeadDetailCard, escapeMarkdownV2,
  // Module 2 — Quotes
  sendQuoteAlert, sendExpiredQuoteAlert, formatQuoteCard,
  // Module 3 — Tasks
  sendTaskAlert, sendDailyBrief, formatTaskCard,
  // Module 4 — Clients
  sendClientAlert, sendAtRiskAlert,
  // Module 5 — Revenue
  sendRevenueAlert, sendOverdueAlert, sendMonthlyRevenueReport,
};