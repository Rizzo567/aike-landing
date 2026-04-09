'use strict';

const { updateLeadStatus, getLeadById, extractLeadData } = require('../notion/leads');
const { updateQuoteStatus } = require('../notion/quotes');
const { updateTaskStatus, extractTaskData } = require('../notion/tasks');
const { updateClientStatus, updateLastContact } = require('../notion/clients');
const { updateRevenueStatus } = require('../notion/revenue');
const { formatLeadDetailCard, escapeMarkdownV2 } = require('../telegram/alerts');
const { Markup } = require('telegraf');

function registerCallbacks(bot) {

  // Module 1: Lead callbacks

  bot.action(/^qualify_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('⏳ Updating lead status...');
      await updateLeadStatus(pageId, 'Qualified');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      const msg = '✅ *Lead Qualified*\n\nThe lead has been marked as *Qualified* in Notion\\.\n_You can now move forward with outreach\\._';
      await ctx.reply(msg, { parse_mode: 'MarkdownV2', reply_markup: Markup.inlineKeyboard([[Markup.button.callback('👁 View Lead Details', `view_${pageId}`)]]).reply_markup });
    } catch (err) {
      console.error(`[callbacks] qualify error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Failed to update lead. Try again.');
      await ctx.reply('❌ Failed to qualify lead\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^discard_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('⏳ Updating lead status...');
      await updateLeadStatus(pageId, 'Cold');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('🧊 *Lead Discarded*\n\nThe lead has been marked as *Cold* in Notion\\.\n_It will remain in your database for future reference\\._', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] discard error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Failed to update lead. Try again.');
      await ctx.reply('❌ Failed to discard lead\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^convert_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('🎉 Converting lead...');
      await updateLeadStatus(pageId, 'Converted');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('🎉 *Lead Converted\\!*\n\nThe lead has been marked as *Converted* in Notion\\.\n\n✅ Ready to create client record\\.', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] convert error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Failed to convert lead. Try again.');
      await ctx.reply('❌ Failed to convert lead\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^view_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('⏳ Fetching lead details...');
      const page = await getLeadById(pageId);
      const lead = extractLeadData(page);
      const detailCard = formatLeadDetailCard(lead);
      const keyboard = Markup.inlineKeyboard([[Markup.button.callback('✅ Qualify', `qualify_${pageId}`), Markup.button.callback('❌ Discard', `discard_${pageId}`)], [Markup.button.callback('🎉 Convert to Client', `convert_${pageId}`)]]);
      await ctx.reply(detailCard, { parse_mode: 'MarkdownV2', ...keyboard });
    } catch (err) {
      console.error(`[callbacks] view error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Failed to fetch lead details. Try again.');
      await ctx.reply('❌ Failed to fetch lead details\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  // Module 2: Quote callbacks

  bot.action(/^quotesend_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('⏳ Aggiorno il preventivo...');
      await updateQuoteStatus(pageId, 'Sent');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('📤 *Preventivo Inviato*\n\nIl preventivo è stato marcato come *Sent* in Notion\\.\n_Attendi risposta dal cliente\\._', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] quotesend error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update quote\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^quoteaccept_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('🎉 Preventivo accettato!');
      await updateQuoteStatus(pageId, 'Accepted');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply("🎉 *Preventivo Accettato\\!*\n\nIl preventivo è stato marcato come *Accepted* in Notion\\.\n\n✅ Procedi con l'onboarding del cliente\\.", { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] quoteaccept error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update quote\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^quotereject_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('❌ Preventivo rifiutato.');
      await updateQuoteStatus(pageId, 'Rejected');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('❌ *Preventivo Rifiutato*\n\nIl preventivo è stato marcato come *Rejected* in Notion\\.\n_Rimane nel database per riferimento futuro\\._', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] quotereject error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update quote\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^quoteexpired_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('⏰ Marcato come Expired.');
      await updateQuoteStatus(pageId, 'Expired');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('⏰ *Preventivo Scaduto*\n\nIl preventivo è stato marcato come *Expired* in Notion\\.', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] quoteexpired error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update quote\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  // Module 3: Task callbacks

  bot.action(/^taskstart_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('⚙️ Task avviato!');
      await updateTaskStatus(pageId, 'In Progress');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('⚙️ *Task Avviato*\n\nIl task è stato marcato come *In Progress* in Notion\\.', { parse_mode: 'MarkdownV2', reply_markup: Markup.inlineKeyboard([[Markup.button.callback('✅ Done', `taskdone_${pageId}`), Markup.button.callback('🚫 Block', `taskblock_${pageId}`)]]).reply_markup });
    } catch (err) {
      console.error(`[callbacks] taskstart error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update task\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^taskdone_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('✅ Task completato!');
      await updateTaskStatus(pageId, 'Done');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('✅ *Task Completato\\!*\n\nIl task è stato marcato come *Done* in Notion\\.\n\n🎯 Ottimo lavoro\\!', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] taskdone error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update task\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^taskblock_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('🚫 Task bloccato.');
      await updateTaskStatus(pageId, 'Blocked');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('🚫 *Task Bloccato*\n\nIl task è stato marcato come *Blocked* in Notion\\.\n_Risolvi il blocco e riavvia con ▶️ Start\\._', { parse_mode: 'MarkdownV2', reply_markup: Markup.inlineKeyboard([[Markup.button.callback('▶️ Start', `taskstart_${pageId}`)]]).reply_markup });
    } catch (err) {
      console.error(`[callbacks] taskblock error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update task\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  // Module 4: Client callbacks

  bot.action(/^clientactivate_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('✅ Attivazione in corso...');
      await updateClientStatus(pageId, 'Active');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('✅ *Cliente Attivato*\n\nIl cliente è stato marcato come *Active* in Notion\\.', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] clientactivate error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update client\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^clientchurn_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('💀 Marcato come Churned.');
      await updateClientStatus(pageId, 'Churned');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('💀 *Cliente Churned*\n\nIl cliente è stato marcato come *Churned* in Notion\\.\n_Analizza le cause del churn per migliorare la retention\\._', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] clientchurn error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update client\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^clientcontact_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('📞 Registrando contatto...');
      await updateLastContact(pageId);
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      const today = new Date().toISOString().split('T')[0];
      await ctx.reply(`📞 *Contatto Registrato\\!*\n\nIl campo *Last Contact* è stato aggiornato a *${escapeMarkdownV2(today)}* in Notion\\.`, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] clientcontact error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update client\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  // Module 5: Revenue callbacks

  bot.action(/^revpaid_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('💶 Pagamento registrato!');
      await updateRevenueStatus(pageId, 'Paid');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('✅ *Fattura Pagata\\!*\n\nLa fattura è stata marcata come *Paid* in Notion\\.\n\n💶 Incasso registrato\\! 🎉', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] revpaid error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update invoice\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^revoverdue_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('⚠️ Marcata come Overdue.');
      await updateRevenueStatus(pageId, 'Overdue');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('⚠️ *Fattura Scaduta*\n\nLa fattura è stata marcata come *Overdue* in Notion\\.\n_Contatta il cliente per il pagamento\\._', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] revoverdue error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update invoice\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action(/^revcancel_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];
    try {
      await ctx.answerCbQuery('❌ Fattura annullata.');
      await updateRevenueStatus(pageId, 'Cancelled');
      try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
      await ctx.reply('❌ *Fattura Annullata*\n\nLa fattura è stata marcata come *Cancelled* in Notion\\.', { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] revcancel error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update invoice\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });
}

module.exports = { registerCallbacks };