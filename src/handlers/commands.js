'use strict';

const { Markup } = require('telegraf');
const { getRecentLeads, getPipelineSummary, extractLeadData } = require('../notion/leads');
const {
  getRecentQuotes,
  getQuoteSummary,
  createQuote,
  extractQuoteData,
} = require('../notion/quotes');
const {
  getActiveTasks,
  createTask,
  searchTasksByName,
  updateTaskStatus,
  extractTaskData,
} = require('../notion/tasks');
const { escapeMarkdownV2, sendQuoteAlert, sendTaskAlert } = require('../telegram/alerts');

// ─── In-memory wizard state ───────────────────────────────────────────────────
// Map<chatId, { type: 'quote'|'task', step: string, data: object }>
const wizardState = new Map();

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
      `*Quote Pipeline*\n` +
      `• /quote — create a new quote \\(guided form\\)\n` +
      `• /quotes — list last 5 quotes\n` +
      `• /quote\\_summary — quotes breakdown by status\n\n` +
      `*Task System*\n` +
      `• /task — create a new task \\(guided form\\)\n` +
      `• /tasks — list all active tasks \\(not Done\\)\n` +
      `• /done \\[name\\] — mark a task as Done\n\n` +
      `*Inline Buttons \\(on alerts\\)*\n` +
      `• Leads: ✅ Qualify / ❌ Discard / 👁 View Details\n` +
      `• Quotes: 📤 Send / ✅ Accept / ❌ Reject\n` +
      `• Tasks: ▶️ Start / ✅ Done / 🚫 Block\n\n` +
      `*Schedulers*\n` +
      `• Daily brief at 08:00 — today's tasks\n` +
      `• Reminders at 20:00 — tomorrow's deadlines\n` +
      `• Expired quote alerts at 09:00`;

    try {
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /help error:', err.message);
    }
  });

  // ─── Module 2: Quote commands ───────────────────────────────────────────────

  // /quotes — list last 5 quotes with status and amount
  bot.command('quotes', async (ctx) => {
    try {
      await ctx.reply('⏳ Fetching recent quotes\\.\\.\\.', { parse_mode: 'MarkdownV2' });

      const pages = await getRecentQuotes(5);

      if (pages.length === 0) {
        return ctx.reply('📭 No quotes found in your database\\.', { parse_mode: 'MarkdownV2' });
      }

      const quotes = pages.map(extractQuoteData);

      const statusEmojis = {
        Draft: '📝',
        Sent: '📤',
        Accepted: '✅',
        Rejected: '❌',
        Expired: '⏰',
      };

      let message = `📄 *Last ${quotes.length} Quote${quotes.length !== 1 ? 's' : ''}*\n\n`;

      quotes.forEach((quote, i) => {
        const clientName = escapeMarkdownV2(quote.clientName);
        const amount =
          quote.amount !== null
            ? escapeMarkdownV2(`€${Number(quote.amount).toLocaleString('it-IT')}`)
            : 'N/A';
        const status = escapeMarkdownV2(quote.status);
        const emoji = statusEmojis[quote.status] || '•';
        const dueDate = quote.dueDate ? escapeMarkdownV2(quote.dueDate) : 'N/A';

        message += `*${i + 1}\\. ${clientName}*\n`;
        message += `💶 ${amount} \\| ${emoji} ${status}\n`;
        message += `📅 Scadenza: ${dueDate}\n\n`;
      });

      message += `────────────────\n_Usa /quote\\_summary per il riepilogo_`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /quotes error:', err.message);
      await ctx.reply('❌ Failed to fetch quotes\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // /quote_summary — breakdown per status
  bot.command('quote_summary', async (ctx) => {
    try {
      await ctx.reply('⏳ Building quote summary\\.\\.\\.', { parse_mode: 'MarkdownV2' });

      const summary = await getQuoteSummary();

      const statusEmojis = {
        Draft: '📝',
        Sent: '📤',
        Accepted: '✅',
        Rejected: '❌',
        Expired: '⏰',
      };

      const total = Object.values(summary).reduce((acc, count) => acc + count, 0);

      let message = `📊 *Quote Summary*\n\n`;

      for (const [status, count] of Object.entries(summary)) {
        const emoji = statusEmojis[status] || '•';
        const bar = count > 0 ? '█'.repeat(Math.min(count, 10)) : '░';
        message += `${emoji} *${escapeMarkdownV2(status)}:* ${count} ${escapeMarkdownV2(bar)}\n`;
      }

      message += `\n────────────────\n`;
      message += `📈 *Total Quotes:* ${escapeMarkdownV2(String(total))}`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /quote_summary error:', err.message);
      await ctx.reply('❌ Failed to fetch quote summary\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // /quote — form guidato per creare un nuovo preventivo
  bot.command('quote', async (ctx) => {
    const chatId = String(ctx.chat.id);
    wizardState.set(chatId, { type: 'quote', step: 'clientName', data: {} });

    await ctx.reply(
      `📄 *Nuovo Preventivo*\n\nStep 1/4 — Inserisci il *nome del cliente*:`,
      { parse_mode: 'MarkdownV2' }
    );
  });

  // ─── Module 3: Task commands ──────────────────────────────────────────────────

  // /tasks — lista task attivi (non Done) ordinati per priority + due date
  bot.command('tasks', async (ctx) => {
    try {
      await ctx.reply('⏳ Fetching active tasks\\.\\.\\.', { parse_mode: 'MarkdownV2' });

      const tasks = await getActiveTasks();

      if (tasks.length === 0) {
        return ctx.reply(
          '✅ Nessun task attivo\\. Ottimo lavoro\\! 🎉',
          { parse_mode: 'MarkdownV2' }
        );
      }

      const priorityEmojis = { High: '🔴', Medium: '🟡', Low: '🟢' };
      const statusEmojis = {
        Todo: '📋',
        'In Progress': '⚙️',
        Blocked: '🚫',
      };

      let message = `📌 *Active Tasks \\(${escapeMarkdownV2(String(tasks.length))}\\)*\n\n`;

      tasks.forEach((task, i) => {
        const name = escapeMarkdownV2(task.name);
        const priority = escapeMarkdownV2(task.priority || 'Medium');
        const status = escapeMarkdownV2(task.status || 'Todo');
        const priorityEmoji = priorityEmojis[task.priority] || '⚪';
        const statusEmoji = statusEmojis[task.status] || '📋';
        const dueDate = task.dueDate ? escapeMarkdownV2(task.dueDate) : 'N/A';

        message += `*${i + 1}\\. ${name}*\n`;
        message += `${priorityEmoji} ${priority} \\| ${statusEmoji} ${status}\n`;
        message += `📅 Due: ${dueDate}\n\n`;
      });

      message += `────────────────\n_Usa /task per creare un nuovo task_`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /tasks error:', err.message);
      await ctx.reply('❌ Failed to fetch tasks\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // /task — crea nuovo task (form guidato)
  bot.command('task', async (ctx) => {
    const chatId = String(ctx.chat.id);
    wizardState.set(chatId, { type: 'task', step: 'name', data: {} });

    await ctx.reply(
      `📌 *Nuovo Task*\n\nStep 1/3 — Inserisci il *nome del task*:`,
      { parse_mode: 'MarkdownV2' }
    );
  });

  // /done [task_name] — cerca task per nome e lo marca Done
  bot.command('done', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1).join(' ').trim();

    if (!args) {
      return ctx.reply(
        '❌ Specifica il nome del task\\. Esempio: `/done Meeting con cliente`',
        { parse_mode: 'MarkdownV2' }
      );
    }

    try {
      await ctx.reply(
        `⏳ Cerco il task _"${escapeMarkdownV2(args)}"_\\.\\.\\.`,
        { parse_mode: 'MarkdownV2' }
      );

      const pages = await searchTasksByName(args);

      if (pages.length === 0) {
        return ctx.reply(
          `📭 Nessun task trovato con nome _"${escapeMarkdownV2(args)}"_\\.`,
          { parse_mode: 'MarkdownV2' }
        );
      }

      if (pages.length === 1) {
        const task = extractTaskData(pages[0]);
        await updateTaskStatus(task.id, 'Done');

        const name = escapeMarkdownV2(task.name);
        const message =
          `✅ *Task completato\\!*\n\n` +
          `*${name}* è stato marcato come *Done* in Notion\\.`;

        return ctx.reply(message, { parse_mode: 'MarkdownV2' });
      }

      // Ambiguous — show list with buttons
      const tasks = pages.slice(0, 5).map(extractTaskData);

      let message = `🔍 *Trovati ${escapeMarkdownV2(String(tasks.length))} task* con quel nome\\.\n`;
      message += `Seleziona quello da completare:\n\n`;

      tasks.forEach((task, i) => {
        const name = escapeMarkdownV2(task.name);
        const status = escapeMarkdownV2(task.status);
        message += `${i + 1}\\. *${name}* \\(${status}\\)\n`;
      });

      const buttons = tasks.map((task) => [
        Markup.button.callback(
          `✅ ${task.name.slice(0, 30)}`,
          `taskdone_${task.id}`
        ),
      ]);

      await ctx.reply(message, {
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard(buttons),
      });
    } catch (err) {
      console.error('[commands] /done error:', err.message);
      await ctx.reply('❌ Failed to search tasks\\. Please try again\\.', {
        parse_mode: 'MarkdownV2',
      });
    }
  });

  // ─── Wizard text handler ─────────────────────────────────────────────────────
  // Processes sequential form inputs for /quote and /task wizards
  bot.on('text', async (ctx) => {
    const chatId = String(ctx.chat.id);
    const state = wizardState.get(chatId);

    // Only process if there's an active wizard and it's not a command
    if (!state || ctx.message.text.startsWith('/')) return;

    const input = ctx.message.text.trim();

    // ─── Quote wizard ──────────────────────────────────────────────────────────
    if (state.type === 'quote') {
      if (state.step === 'clientName') {
        state.data.clientName = input;
        state.step = 'email';
        await ctx.reply(
          `Step 2/4 — Inserisci l'*email* del cliente:`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      if (state.step === 'email') {
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
          await ctx.reply(
            '❌ Email non valida\\. Reinserisci un indirizzo email corretto:',
            { parse_mode: 'MarkdownV2' }
          );
          return;
        }
        state.data.email = input;
        state.step = 'amount';
        await ctx.reply(
          `Step 3/4 — Inserisci l'*importo* in EUR \\(solo numero, es\\. 1500\\):`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      if (state.step === 'amount') {
        const amount = parseFloat(input.replace(',', '.'));
        if (isNaN(amount) || amount < 0) {
          await ctx.reply(
            '❌ Importo non valido\\. Inserisci un numero positivo \\(es\\. 1500\\):',
            { parse_mode: 'MarkdownV2' }
          );
          return;
        }
        state.data.amount = amount;
        state.step = 'dueDate';
        await ctx.reply(
          `Step 4/4 — Inserisci la *data di scadenza* \\(formato YYYY\\-MM\\-DD\\, es\\. 2026\\-05\\-01\\)\\.\nScrivi \`skip\` per saltare:`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      if (state.step === 'dueDate') {
        let dueDate = null;
        if (input.toLowerCase() !== 'skip') {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            await ctx.reply(
              '❌ Formato data non valido\\. Usa YYYY\\-MM\\-DD \\(es\\. 2026\\-05\\-01\\) oppure scrivi `skip`:',
              { parse_mode: 'MarkdownV2' }
            );
            return;
          }
          dueDate = input;
        }
        state.data.dueDate = dueDate;
        state.step = 'confirm';

        // Show summary and create
        wizardState.delete(chatId);

        await ctx.reply('⏳ Creo il preventivo in Notion\\.\\.\\.', { parse_mode: 'MarkdownV2' });

        try {
          const page = await createQuote(state.data);
          const quote = extractQuoteData(page);
          const clientName = escapeMarkdownV2(quote.clientName);
          const amount = escapeMarkdownV2(
            `€${Number(quote.amount).toLocaleString('it-IT')}`
          );
          const dueDateStr = quote.dueDate ? escapeMarkdownV2(quote.dueDate) : 'N/A';

          const message =
            `✅ *Preventivo creato\\!*\n\n` +
            `👤 *${clientName}*\n` +
            `💶 ${amount}\n` +
            `📅 Scadenza: ${dueDateStr}\n` +
            `📊 Status: Draft\n\n` +
            `_Usa i bottoni qui sotto per aggiornare lo stato\\._`;

          const keyboard = Markup.inlineKeyboard([
            [
              Markup.button.callback('📤 Send', `quotesend_${quote.id}`),
              Markup.button.callback('✅ Accept', `quoteaccept_${quote.id}`),
              Markup.button.callback('❌ Reject', `quotereject_${quote.id}`),
            ],
          ]);

          await ctx.reply(message, { parse_mode: 'MarkdownV2', ...keyboard });

          // Also alert the operator chat if different from current chat
          const operatorChatId = process.env.OPERATOR_CHAT_ID;
          if (operatorChatId && operatorChatId !== chatId) {
            await sendQuoteAlert(operatorChatId, quote, quote.id);
          }
        } catch (err) {
          console.error('[commands] quote wizard createQuote error:', err.message);
          await ctx.reply('❌ Errore nella creazione del preventivo\\. Riprova\\.', {
            parse_mode: 'MarkdownV2',
          });
        }
        return;
      }
    }

    // ─── Task wizard ───────────────────────────────────────────────────────────
    if (state.type === 'task') {
      if (state.step === 'name') {
        state.data.name = input;
        state.step = 'priority';
        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback('🔴 High', `wizpriority_${chatId}_High`),
            Markup.button.callback('🟡 Medium', `wizpriority_${chatId}_Medium`),
            Markup.button.callback('🟢 Low', `wizpriority_${chatId}_Low`),
          ],
        ]);
        await ctx.reply(
          `Step 2/3 — Seleziona la *priorità*:`,
          { parse_mode: 'MarkdownV2', ...keyboard }
        );
        return;
      }

      if (state.step === 'dueDate') {
        let dueDate = null;
        if (input.toLowerCase() !== 'skip') {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            await ctx.reply(
              '❌ Formato data non valido\\. Usa YYYY\\-MM\\-DD \\(es\\. 2026\\-05\\-01\\) oppure scrivi `skip`:',
              { parse_mode: 'MarkdownV2' }
            );
            return;
          }
          dueDate = input;
        }
        state.data.dueDate = dueDate;
        wizardState.delete(chatId);

        await ctx.reply('⏳ Creo il task in Notion\\.\\.\\.', { parse_mode: 'MarkdownV2' });

        try {
          const page = await createTask(state.data);
          const task = extractTaskData(page);
          const taskName = escapeMarkdownV2(task.name);
          const priority = escapeMarkdownV2(task.priority);
          const dueDateStr = task.dueDate ? escapeMarkdownV2(task.dueDate) : 'N/A';
          const priorityEmojis = { High: '🔴', Medium: '🟡', Low: '🟢' };
          const priorityEmoji = priorityEmojis[task.priority] || '⚪';

          const message =
            `✅ *Task creato\\!*\n\n` +
            `📌 *${taskName}*\n` +
            `${priorityEmoji} Priority: ${priority}\n` +
            `📅 Due: ${dueDateStr}\n` +
            `📊 Status: Todo\n\n` +
            `_Usa i bottoni per aggiornare lo stato\\._`;

          const keyboard = Markup.inlineKeyboard([
            [
              Markup.button.callback('▶️ Start', `taskstart_${task.id}`),
              Markup.button.callback('✅ Done', `taskdone_${task.id}`),
              Markup.button.callback('🚫 Block', `taskblock_${task.id}`),
            ],
          ]);

          await ctx.reply(message, { parse_mode: 'MarkdownV2', ...keyboard });

          // Alert operator chat if different
          const operatorChatId = process.env.OPERATOR_CHAT_ID;
          if (operatorChatId && operatorChatId !== chatId) {
            await sendTaskAlert(operatorChatId, task, task.id);
          }
        } catch (err) {
          console.error('[commands] task wizard createTask error:', err.message);
          await ctx.reply('❌ Errore nella creazione del task\\. Riprova\\.', {
            parse_mode: 'MarkdownV2',
          });
        }
        return;
      }
    }
  });

  // ─── Wizard priority selection callback (inline keyboard during task creation)
  bot.action(/^wizpriority_(\d+)_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const chatId = ctx.match[1];
    const priority = ctx.match[2];
    const state = wizardState.get(chatId);

    if (!state || state.type !== 'task' || state.step !== 'priority') {
      return ctx.reply('⚠️ Nessun task in corso\\. Usa /task per iniziare\\.', {
        parse_mode: 'MarkdownV2',
      });
    }

    state.data.priority = priority;
    state.step = 'dueDate';

    try {
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    } catch (_) {
      // Ignore
    }

    await ctx.reply(
      `Step 3/3 — Inserisci la *data di scadenza* \\(formato YYYY\\-MM\\-DD\\, es\\. 2026\\-05\\-01\\)\\.\nScrivi \`skip\` per saltare:`,
      { parse_mode: 'MarkdownV2' }
    );
  });

  // ─── Inline button triggers for /start keyboard ──────────────────────────────
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
