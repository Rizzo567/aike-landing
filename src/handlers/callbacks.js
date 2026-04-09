'use strict';

const { updateLeadStatus, getLeadById, extractLeadData } = require('../notion/leads');
const { updateQuoteStatus } = require('../notion/quotes');
const { updateTaskStatus, extractTaskData } = require('../notion/tasks');
const { formatLeadDetailCard, escapeMarkdownV2 } = require('../telegram/alerts');
const { Markup } = require('telegraf');

/**
 * Parse a Notion page ID from callback data.
 * Callback data format: "action_notionPageId"
 * Notion page IDs may contain hyphens, so we split on the FIRST underscore only.
 * @param {string} callbackData
 * @returns {{ action: string, pageId: string }}
 */
function parseCallbackData(callbackData) {
  const firstUnderscore = callbackData.indexOf('_');
  if (firstUnderscore === -1) {
    throw new Error(`Invalid callback data format: "${callbackData}"`);
  }
  const action = callbackData.slice(0, firstUnderscore);
  const pageId = callbackData.slice(firstUnderscore + 1);
  return { action, pageId };
}

/**
 * Register all inline keyboard callback handlers on the given Telegraf instance.
 * @param {import('telegraf').Telegraf} bot
 */
function registerCallbacks(bot) {
  // qualify_[notionPageId] — mark lead as Qualified
  bot.action(/^qualify_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('⏳ Updating lead status...');
      await updateLeadStatus(pageId, 'Qualified');

      // Edit the original message to remove the buttons and show result
      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (_) {
        // Message may not be editable; ignore silently
      }

      const message =
        `✅ *Lead Qualified*\n\n` +
        `The lead has been marked as *Qualified* in Notion\\.\n` +
        `_You can now move forward with outreach\\._`;

      await ctx.reply(message, {
        parse_mode: 'MarkdownV2',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('👁 View Lead Details', `view_${pageId}`)],
        ]).reply_markup,
      });
    } catch (err) {
      console.error(`[callbacks] qualify error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Failed to update lead. Try again.');
      await ctx.reply('❌ Failed to qualify lead\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // discard_[notionPageId] — mark lead as Cold
  bot.action(/^discard_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('⏳ Updating lead status...');
      await updateLeadStatus(pageId, 'Cold');

      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (_) {
        // Ignore
      }

      const message =
        `🧊 *Lead Discarded*\n\n` +
        `The lead has been marked as *Cold* in Notion\\.\n` +
        `_It will remain in your database for future reference\\._`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] discard error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Failed to update lead. Try again.');
      await ctx.reply('❌ Failed to discard lead\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // convert_[notionPageId] — mark lead as Converted
  bot.action(/^convert_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('🎉 Converting lead...');
      await updateLeadStatus(pageId, 'Converted');

      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (_) {
        // Ignore
      }

      const message =
        `🎉 *Lead Converted\\!*\n\n` +
        `The lead has been marked as *Converted* in Notion\\.\n\n` +
        `✅ Ready to create client record\\.`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] convert error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Failed to convert lead. Try again.');
      await ctx.reply('❌ Failed to convert lead\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // view_[notionPageId] — fetch full lead details from Notion and display
  bot.action(/^view_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('⏳ Fetching lead details...');

      const page = await getLeadById(pageId);
      const lead = extractLeadData(page);
      const detailCard = formatLeadDetailCard(lead);

      // Build action buttons so the operator can still act from the detail view
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Qualify', `qualify_${pageId}`),
          Markup.button.callback('❌ Discard', `discard_${pageId}`),
        ],
        [Markup.button.callback('🎉 Convert to Client', `convert_${pageId}`)],
      ]);

      await ctx.reply(detailCard, {
        parse_mode: 'MarkdownV2',
        ...keyboard,
      });
    } catch (err) {
      console.error(`[callbacks] view error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Failed to fetch lead details. Try again.');
      await ctx.reply('❌ Failed to fetch lead details\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // ─── Module 2: Quote callbacks ────────────────────────────────────────────────

  // quotesend_[pageId] — mark quote as Sent
  bot.action(/^quotesend_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('⏳ Aggiorno il preventivo...');
      await updateQuoteStatus(pageId, 'Sent');

      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (_) {
        // Ignore
      }

      const message =
        `📤 *Preventivo Inviato*\n\n` +
        `Il preventivo è stato marcato come *Sent* in Notion\\.\n` +
        `_Attendi risposta dal cliente\\._`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] quotesend error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update quote\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // quoteaccept_[pageId] — mark quote as Accepted
  bot.action(/^quoteaccept_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('🎉 Preventivo accettato!');
      await updateQuoteStatus(pageId, 'Accepted');

      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (_) {
        // Ignore
      }

      const message =
        `🎉 *Preventivo Accettato\\!*\n\n` +
        `Il preventivo è stato marcato come *Accepted* in Notion\\.\n\n` +
        `✅ Procedi con l'onboarding del cliente\\.`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] quoteaccept error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update quote\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // quotereject_[pageId] — mark quote as Rejected
  bot.action(/^quotereject_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('❌ Preventivo rifiutato.');
      await updateQuoteStatus(pageId, 'Rejected');

      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (_) {
        // Ignore
      }

      const message =
        `❌ *Preventivo Rifiutato*\n\n` +
        `Il preventivo è stato marcato come *Rejected* in Notion\\.\n` +
        `_Rimane nel database per riferimento futuro\\._`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] quotereject error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update quote\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // quoteexpired_[pageId] — mark quote as Expired
  bot.action(/^quoteexpired_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('⏰ Marcato come Expired.');
      await updateQuoteStatus(pageId, 'Expired');

      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (_) {
        // Ignore
      }

      const message =
        `⏰ *Preventivo Scaduto*\n\n` +
        `Il preventivo è stato marcato come *Expired* in Notion\\.`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] quoteexpired error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update quote\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // ─── Module 3: Task callbacks ─────────────────────────────────────────────────

  // taskstart_[pageId] — set status to In Progress
  bot.action(/^taskstart_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('⚙️ Task avviato!');
      await updateTaskStatus(pageId, 'In Progress');

      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (_) {
        // Ignore
      }

      const message =
        `⚙️ *Task Avviato*\n\n` +
        `Il task è stato marcato come *In Progress* in Notion\\.`;

      await ctx.reply(message, {
        parse_mode: 'MarkdownV2',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Done', `taskdone_${pageId}`),
            Markup.button.callback('🚫 Block', `taskblock_${pageId}`),
          ],
        ]).reply_markup,
      });
    } catch (err) {
      console.error(`[callbacks] taskstart error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update task\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // taskdone_[pageId] — set status to Done
  bot.action(/^taskdone_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('✅ Task completato!');
      await updateTaskStatus(pageId, 'Done');

      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (_) {
        // Ignore
      }

      const message =
        `✅ *Task Completato\\!*\n\n` +
        `Il task è stato marcato come *Done* in Notion\\.\n\n` +
        `🎯 Ottimo lavoro\\!`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error(`[callbacks] taskdone error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update task\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // taskblock_[pageId] — set status to Blocked
  bot.action(/^taskblock_(.+)$/, async (ctx) => {
    const pageId = ctx.match[1];

    try {
      await ctx.answerCbQuery('🚫 Task bloccato.');
      await updateTaskStatus(pageId, 'Blocked');

      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      } catch (_) {
        // Ignore
      }

      const message =
        `🚫 *Task Bloccato*\n\n` +
        `Il task è stato marcato come *Blocked* in Notion\\.\n` +
        `_Risolvi il blocco e riavvia con ▶️ Start\\._`;

      await ctx.reply(message, {
        parse_mode: 'MarkdownV2',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('▶️ Start', `taskstart_${pageId}`)],
        ]).reply_markup,
      });
    } catch (err) {
      console.error(`[callbacks] taskblock error for page ${pageId}:`, err.message);
      await ctx.answerCbQuery('❌ Errore. Riprova.');
      await ctx.reply('❌ Failed to update task\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });
}

module.exports = { registerCallbacks };
