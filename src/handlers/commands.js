'use strict';

const { Markup } = require('telegraf');
const { getRecentLeads, getPipelineSummary, extractLeadData } = require('../notion/leads');
const { escapeMarkdownV2 } = require('../telegram/alerts');

/**
 * Register all bot command handlers on the given Telegraf instance.
 * @param {import('telegraf').Telegraf} bot
 */
function registerCommands(bot) {
  // /start — welcome message with quick action buttons
  bot.start(async (ctx) => {
    const firstName = escapeMarkdownV2(ctx.from?.first_name || 'Operator');
    const message =
      `👋 *Welcome back, ${firstName}\\!*\n\n` +
      `I'm your *OperationsOS* assistant\\. I keep your lead pipeline organized and alert you the moment a new lead arrives\\.\n\n` +
      `*Quick Actions:*\n` +
      `• /leads — view your 5 most recent leads\n` +
      `• /pipeline — pipeline summary by status\n` +
      `• /help — full command reference`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('📋 Recent Leads', 'cmd_leads'),
        Markup.button.callback('📊 Pipeline', 'cmd_pipeline'),
      ],
    ]);

    try {
      await ctx.reply(message, { parse_mode: 'MarkdownV2', ...keyboard });
    } catch (err) {
      console.error('[commands] /start error:', err.message);
    }
  });

  // /leads — list the last 5 leads
  bot.command('leads', async (ctx) => {
    try {
      await ctx.reply('⏳ Fetching recent leads\\.\\.\\.', { parse_mode: 'MarkdownV2' });

      const pages = await getRecentLeads(5);

      if (pages.length === 0) {
        return ctx.reply('📭 No leads found in your database\\.', { parse_mode: 'MarkdownV2' });
      }

      const leads = pages.map(extractLeadData);

      let message = `📋 *Last ${leads.length} Lead${leads.length !== 1 ? 's' : ''}*\n\n`;

      leads.forEach((lead, i) => {
        const name = escapeMarkdownV2(lead.name);
        const email = escapeMarkdownV2(lead.email);
        const status = escapeMarkdownV2(lead.status);
        const score = lead.score !== null ? `⭐ ${lead.score}/10` : '⭐ N/A';
        const source = escapeMarkdownV2(lead.source || 'Unknown');

        message += `*${i + 1}\\. ${name}*\n`;
        message += `📧 ${email}\n`;
        message += `🏷 ${source} \\| 📊 ${status} \\| ${score}\n`;
        message += `\n`;
      });

      message += `────────────────\n_Use /pipeline for status breakdown_`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /leads error:', err.message);
      await ctx.reply('❌ Failed to fetch leads\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // /pipeline — show count of leads by status
  bot.command('pipeline', async (ctx) => {
    try {
      await ctx.reply('⏳ Building pipeline summary\\.\\.\\.', { parse_mode: 'MarkdownV2' });

      const summary = await getPipelineSummary();

      const statusEmojis = {
        New: '🆕',
        Contacted: '📞',
        Qualified: '✅',
        Converted: '🎉',
        Cold: '🧊',
        Lost: '❌',
      };

      const total = Object.values(summary).reduce((acc, count) => acc + count, 0);

      let message = `📊 *Pipeline Summary*\n\n`;

      for (const [status, count] of Object.entries(summary)) {
        const emoji = statusEmojis[status] || '•';
        const bar = count > 0 ? '█'.repeat(Math.min(count, 10)) : '░';
        message += `${emoji} *${escapeMarkdownV2(status)}:* ${count} ${escapeMarkdownV2(bar)}\n`;
      }

      message += `\n────────────────\n`;
      message += `📈 *Total Leads:* ${escapeMarkdownV2(String(total))}`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /pipeline error:', err.message);
      await ctx.reply('❌ Failed to fetch pipeline data\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // /help — command reference
  bot.command('help', async (ctx) => {
    const message =
      `🤖 *OperationsOS Bot — Command Reference*\n\n` +
      `*Lead Management*\n` +
      `• /leads — view your 5 most recent leads\n` +
      `• /pipeline — pipeline breakdown by status\n\n` +
      `*Inline Buttons \\(on lead alerts\\)*\n` +
      `• ✅ *Qualify* — marks lead as Qualified\n` +
      `• ❌ *Discard* — marks lead as Cold\n` +
      `• 👁 *View Details* — shows full lead record\n\n` +
      `*How It Works*\n` +
      `When a new lead email arrives, Make\\.com detects it, creates a Notion record, and I send you an alert with action buttons\\.`;

    try {
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /help error:', err.message);
    }
  });

  // Inline button triggers for /start keyboard
  bot.action('cmd_leads', async (ctx) => {
    await ctx.answerCbQuery();
    // Reuse the leads logic by emitting a fake context — simpler to just inline it
    try {
      const pages = await getRecentLeads(5);

      if (pages.length === 0) {
        return ctx.reply('📭 No leads found in your database\\.', { parse_mode: 'MarkdownV2' });
      }

      const leads = pages.map(extractLeadData);
      let message = `📋 *Last ${leads.length} Lead${leads.length !== 1 ? 's' : ''}*\n\n`;

      leads.forEach((lead, i) => {
        const name = escapeMarkdownV2(lead.name);
        const email = escapeMarkdownV2(lead.email);
        const status = escapeMarkdownV2(lead.status);
        const score = lead.score !== null ? `⭐ ${lead.score}/10` : '⭐ N/A';
        const source = escapeMarkdownV2(lead.source || 'Unknown');

        message += `*${i + 1}\\. ${name}*\n`;
        message += `📧 ${email}\n`;
        message += `🏷 ${source} \\| 📊 ${status} \\| ${score}\n\n`;
      });

      message += `────────────────\n_Use /pipeline for status breakdown_`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] cmd_leads action error:', err.message);
      await ctx.reply('❌ Failed to fetch leads\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action('cmd_pipeline', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const summary = await getPipelineSummary();

      const statusEmojis = {
        New: '🆕',
        Contacted: '📞',
        Qualified: '✅',
        Converted: '🎉',
        Cold: '🧊',
        Lost: '❌',
      };

      const total = Object.values(summary).reduce((acc, count) => acc + count, 0);
      let message = `📊 *Pipeline Summary*\n\n`;

      for (const [status, count] of Object.entries(summary)) {
        const emoji = statusEmojis[status] || '•';
        const bar = count > 0 ? '█'.repeat(Math.min(count, 10)) : '░';
        message += `${emoji} *${escapeMarkdownV2(status)}:* ${count} ${escapeMarkdownV2(bar)}\n`;
      }

      message += `\n────────────────\n📈 *Total Leads:* ${escapeMarkdownV2(String(total))}`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] cmd_pipeline action error:', err.message);
      await ctx.reply('❌ Failed to fetch pipeline data\\.', { parse_mode: 'MarkdownV2' });
    }
  });
}

module.exports = { registerCommands };
