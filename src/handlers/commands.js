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
const {
  getAllActiveClients,
  getAtRiskClients,
  createClient,
  extractClientData,
} = require('../notion/clients');
const {
  getCurrentMonthRevenue,
  getRevenueByStatus,
  getRecentRevenue,
  getOverdueInvoices,
  extractRevenueData,
} = require('../notion/revenue');
const {
  escapeMarkdownV2,
  sendQuoteAlert,
  sendTaskAlert,
  sendClientAlert,
} = require('../telegram/alerts');

// In-memory wizard state Map<chatId, { type: 'quote'|'task'|'client', step, data }>
const wizardState = new Map();

/**
 * Register all bot command handlers on the given Telegraf instance.
 * @param {import('telegraf').Telegraf} bot
 */
function registerCommands(bot) {
  // /start — welcome message
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
      await ctx.reply('⏳ Fetching recent leads\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
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
      console.error('[commands] /leads error:', err.message);
      await ctx.reply('❌ Failed to fetch leads\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  // /pipeline — pipeline summary
  bot.command('pipeline', async (ctx) => {
    try {
      await ctx.reply('⏳ Building pipeline summary\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
      const summary = await getPipelineSummary();
      const statusEmojis = { New: '🆕', Contacted: '📞', Qualified: '✅', Converted: '🎉', Cold: '🧊', Lost: '❌' };
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
      console.error('[commands] /pipeline error:', err.message);
      await ctx.reply('❌ Failed to fetch pipeline data\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
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
      `*Client Management*\n` +
      `• /clients — active clients with health score\n` +
      `• /client — create a new client \\(guided form\\)\n` +
      `• /client\\_health — clients at risk \\(score < 40\\)\n\n` +
      `*Revenue Tracking*\n` +
      `• /revenue — current month revenue \\+ breakdown\n` +
      `• /invoices — last 5 invoices with status\n` +
      `• /invoice\\_overdue — overdue invoices\n\n` +
      `*Inline Buttons \\(on alerts\\)*\n` +
      `• Leads: ✅ Qualify / ❌ Discard / 👁 View Details\n` +
      `• Quotes: 📤 Send / ✅ Accept / ❌ Reject\n` +
      `• Tasks: ▶️ Start / ✅ Done / 🚫 Block\n` +
      `• Clients: 📞 Contact / 💀 Churn\n` +
      `• Invoices: ✅ Paid / ⚠️ Overdue / ❌ Cancel\n\n` +
      `*Schedulers*\n` +
      `• Daily brief at 08:00 — today's tasks\n` +
      `• Reminders at 20:00 — tomorrow's deadlines\n` +
      `• Expired quote alerts at 09:00\n` +
      `• Overdue invoice alerts at 09:30\n` +
      `• At\\-risk client alerts Sundays at 10:00\n` +
      `• Monthly revenue report on 1st at 08:00`;
    try {
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /help error:', err.message);
    }
  });

  // ─── Module 2: Quote commands ─────────────────────────────────────────────

  bot.command('quotes', async (ctx) => {
    try {
      await ctx.reply('⏳ Fetching recent quotes\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
      const pages = await getRecentQuotes(5);
      if (pages.length === 0) { return ctx.reply('📭 No quotes found in your database\\.', { parse_mode: 'MarkdownV2' }); }
      const quotes = pages.map(extractQuoteData);
      const statusEmojis = { Draft: '📝', Sent: '📤', Accepted: '✅', Rejected: '❌', Expired: '⏰' };
      let message = `📄 *Last ${quotes.length} Quote${quotes.length !== 1 ? 's' : ''}*\n\n`;
      quotes.forEach((quote, i) => {
        const clientName = escapeMarkdownV2(quote.clientName);
        const amount = quote.amount !== null ? escapeMarkdownV2(`€${Number(quote.amount).toLocaleString('it-IT')}`) : 'N/A';
        const status = escapeMarkdownV2(quote.status);
        const emoji = statusEmojis[quote.status] || '•';
        const dueDate = quote.dueDate ? escapeMarkdownV2(quote.dueDate) : 'N/A';
        message += `*${i + 1}\\. ${clientName}*\n💶 ${amount} \\| ${emoji} ${status}\n📅 Scadenza: ${dueDate}\n\n`;
      });
      message += `────────────────\n_Usa /quote\\_summary per il riepilogo_`;
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /quotes error:', err.message);
      await ctx.reply('❌ Failed to fetch quotes\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.command('quote_summary', async (ctx) => {
    try {
      await ctx.reply('⏳ Building quote summary\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
      const summary = await getQuoteSummary();
      const statusEmojis = { Draft: '📝', Sent: '📤', Accepted: '✅', Rejected: '❌', Expired: '⏰' };
      const total = Object.values(summary).reduce((acc, count) => acc + count, 0);
      let message = `📊 *Quote Summary*\n\n`;
      for (const [status, count] of Object.entries(summary)) {
        const emoji = statusEmojis[status] || '•';
        const bar = count > 0 ? '█'.repeat(Math.min(count, 10)) : '░';
        message += `${emoji} *${escapeMarkdownV2(status)}:* ${count} ${escapeMarkdownV2(bar)}\n`;
      }
      message += `\n────────────────\n📈 *Total Quotes:* ${escapeMarkdownV2(String(total))}`;
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /quote_summary error:', err.message);
      await ctx.reply('❌ Failed to fetch quote summary\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.command('quote', async (ctx) => {
    const chatId = String(ctx.chat.id);
    wizardState.set(chatId, { type: 'quote', step: 'clientName', data: {} });
    await ctx.reply(`📄 *Nuovo Preventivo*\n\nStep 1/4 — Inserisci il *nome del cliente*:`, { parse_mode: 'MarkdownV2' });
  });

  // ─── Module 3: Task commands ──────────────────────────────────────────────

  bot.command('tasks', async (ctx) => {
    try {
      await ctx.reply('⏳ Fetching active tasks\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
      const tasks = await getActiveTasks();
      if (tasks.length === 0) { return ctx.reply('✅ Nessun task attivo\\. Ottimo lavoro\\! 🎉', { parse_mode: 'MarkdownV2' }); }
      const priorityEmojis = { High: '🔴', Medium: '🟡', Low: '🟢' };
      const statusEmojis = { Todo: '📋', 'In Progress': '⚙️', Blocked: '🚫' };
      let message = `📌 *Active Tasks \\(${escapeMarkdownV2(String(tasks.length))}\\)*\n\n`;
      tasks.forEach((task, i) => {
        const name = escapeMarkdownV2(task.name);
        const priority = escapeMarkdownV2(task.priority || 'Medium');
        const status = escapeMarkdownV2(task.status || 'Todo');
        const priorityEmoji = priorityEmojis[task.priority] || '⚪';
        const statusEmoji = statusEmojis[task.status] || '📋';
        const dueDate = task.dueDate ? escapeMarkdownV2(task.dueDate) : 'N/A';
        message += `*${i + 1}\\. ${name}*\n${priorityEmoji} ${priority} \\| ${statusEmoji} ${status}\n📅 Due: ${dueDate}\n\n`;
      });
      message += `────────────────\n_Usa /task per creare un nuovo task_`;
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /tasks error:', err.message);
      await ctx.reply('❌ Failed to fetch tasks\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.command('task', async (ctx) => {
    const chatId = String(ctx.chat.id);
    wizardState.set(chatId, { type: 'task', step: 'name', data: {} });
    await ctx.reply(`📌 *Nuovo Task*\n\nStep 1/3 — Inserisci il *nome del task*:`, { parse_mode: 'MarkdownV2' });
  });

  bot.command('done', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!args) { return ctx.reply('❌ Specifica il nome del task\\. Esempio: `/done Meeting con cliente`', { parse_mode: 'MarkdownV2' }); }
    try {
      await ctx.reply(`⏳ Cerco il task _"${escapeMarkdownV2(args)}"_\\.\\.\\.`, { parse_mode: 'MarkdownV2' });
      const pages = await searchTasksByName(args);
      if (pages.length === 0) { return ctx.reply(`📭 Nessun task trovato con nome _"${escapeMarkdownV2(args)}"_\\.`, { parse_mode: 'MarkdownV2' }); }
      if (pages.length === 1) {
        const task = extractTaskData(pages[0]);
        await updateTaskStatus(task.id, 'Done');
        return ctx.reply(`✅ *Task completato\\!*\n\n*${escapeMarkdownV2(task.name)}* è stato marcato come *Done* in Notion\\.`, { parse_mode: 'MarkdownV2' });
      }
      const tasks = pages.slice(0, 5).map(extractTaskData);
      let message = `🔍 *Trovati ${escapeMarkdownV2(String(tasks.length))} task* con quel nome\\.\nSeleziona quello da completare:\n\n`;
      tasks.forEach((task, i) => { message += `${i + 1}\\. *${escapeMarkdownV2(task.name)}* \\(${escapeMarkdownV2(task.status)}\\)\n`; });
      const buttons = tasks.map((task) => [Markup.button.callback(`✅ ${task.name.slice(0, 30)}`, `taskdone_${task.id}`)]);
      await ctx.reply(message, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(buttons) });
    } catch (err) {
      console.error('[commands] /done error:', err.message);
      await ctx.reply('❌ Failed to search tasks\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  // ─── Module 4: Client commands ────────────────────────────────────────────

  bot.command('clients', async (ctx) => {
    try {
      await ctx.reply('⏳ Fetching active clients\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
      const pages = await getAllActiveClients();
      if (pages.length === 0) { return ctx.reply('📭 Nessun cliente attivo trovato\\.', { parse_mode: 'MarkdownV2' }); }
      const clients = pages.map(extractClientData);
      let message = `👥 *Clienti Attivi \\(${escapeMarkdownV2(String(clients.length))}\\)*\n\n`;
      clients.forEach((client, i) => {
        const name = escapeMarkdownV2(client.name);
        const score = client.healthScore !== null ? client.healthScore : null;
        const monthly = client.monthlyValue !== null ? escapeMarkdownV2(`€${Number(client.monthlyValue).toLocaleString('it-IT')}`) : 'N/A';
        const scoreEmoji = score === null ? '⚪' : score > 70 ? '🟢' : score >= 40 ? '🟡' : '🔴';
        const scoreStr = score !== null ? String(score) : 'N/A';
        message += `*${i + 1}\\. ${name}*\n${scoreEmoji} Score: ${escapeMarkdownV2(scoreStr)} \\| 💶 ${monthly}\n\n`;
      });
      message += `────────────────\n_Usa /client\\_health per i clienti a rischio_`;
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /clients error:', err.message);
      await ctx.reply('❌ Failed to fetch clients\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.command('client', async (ctx) => {
    const chatId = String(ctx.chat.id);
    wizardState.set(chatId, { type: 'client', step: 'name', data: {} });
    await ctx.reply(`👤 *Nuovo Cliente*\n\nStep 1/4 — Inserisci il *nome del cliente*:`, { parse_mode: 'MarkdownV2' });
  });

  bot.command('client_health', async (ctx) => {
    try {
      await ctx.reply('⏳ Checking at\\-risk clients\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
      const pages = await getAtRiskClients();
      if (pages.length === 0) { return ctx.reply('✅ Nessun cliente a rischio\\. Tutti i clienti stanno bene\\! 🎉', { parse_mode: 'MarkdownV2' }); }
      const clients = pages.map(extractClientData);
      let message = `🚨 *Clienti a Rischio Churn \\(${escapeMarkdownV2(String(clients.length))}\\)*\n\n`;
      clients.forEach((client, i) => {
        const name = escapeMarkdownV2(client.name);
        const score = client.healthScore !== null ? escapeMarkdownV2(String(client.healthScore)) : 'N/A';
        const lastContact = client.lastContact ? escapeMarkdownV2(client.lastContact) : 'mai';
        message += `*${i + 1}\\. ${name}*\n🔴 Health Score: ${score}/100\n📅 Ultimo contatto: ${lastContact}\n\n`;
      });
      message += `────────────────\n_Usa /clients per tutti i clienti attivi_`;
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /client_health error:', err.message);
      await ctx.reply('❌ Failed to fetch at\\-risk clients\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  // ─── Module 5: Revenue commands ───────────────────────────────────────────

  bot.command('revenue', async (ctx) => {
    try {
      await ctx.reply('⏳ Calcolando revenue del mese\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
      const [total, pendingPages, paidPages, overduePages, cancelledPages] = await Promise.all([
        getCurrentMonthRevenue(),
        getRevenueByStatus('Pending'),
        getRevenueByStatus('Paid'),
        getRevenueByStatus('Overdue'),
        getRevenueByStatus('Cancelled'),
      ]);
      const now = new Date();
      const monthLabel = escapeMarkdownV2(now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }));
      const totalStr = escapeMarkdownV2(`€${Number(total).toLocaleString('it-IT')}`);
      let message = `💶 *Revenue — ${monthLabel}*\n\n`;
      message += `✅ *Totale incassato: ${totalStr}*\n\n`;
      message += `📊 *Breakdown:*\n`;
      message += `✅ Pagate: ${escapeMarkdownV2(String(paidPages.length))}\n`;
      message += `⏳ In attesa: ${escapeMarkdownV2(String(pendingPages.length))}\n`;
      message += `🚨 Scadute: ${escapeMarkdownV2(String(overduePages.length))}\n`;
      message += `❌ Annullate: ${escapeMarkdownV2(String(cancelledPages.length))}\n`;
      message += `\n────────────────\n_Usa /invoices per le ultime fatture_`;
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /revenue error:', err.message);
      await ctx.reply('❌ Failed to fetch revenue data\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.command('invoices', async (ctx) => {
    try {
      await ctx.reply('⏳ Fetching recent invoices\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
      const pages = await getRecentRevenue(5);
      if (pages.length === 0) { return ctx.reply('📭 Nessuna fattura trovata\\.', { parse_mode: 'MarkdownV2' }); }
      const entries = pages.map(extractRevenueData);
      const statusEmojis = { Pending: '⏳', Paid: '✅', Overdue: '🚨', Cancelled: '❌' };
      let message = `💳 *Ultime ${entries.length} Fatture*\n\n`;
      entries.forEach((entry, i) => {
        const clientName = escapeMarkdownV2(entry.clientName || entry.name);
        const amount = entry.amount !== null ? escapeMarkdownV2(`€${Number(entry.amount).toLocaleString('it-IT')}`) : 'N/A';
        const status = escapeMarkdownV2(entry.status);
        const emoji = statusEmojis[entry.status] || '•';
        const dueDate = entry.dueDate ? escapeMarkdownV2(entry.dueDate) : 'N/A';
        message += `*${i + 1}\\. ${clientName}*\n💶 ${amount} \\| ${emoji} ${status}\n⏰ Scadenza: ${dueDate}\n\n`;
      });
      message += `────────────────\n_Usa /invoice\\_overdue per le fatture scadute_`;
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /invoices error:', err.message);
      await ctx.reply('❌ Failed to fetch invoices\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.command('invoice_overdue', async (ctx) => {
    try {
      await ctx.reply('⏳ Checking overdue invoices\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
      const pages = await getOverdueInvoices();
      if (pages.length === 0) { return ctx.reply('✅ Nessuna fattura scaduta\\. Ottimo\\! 🎉', { parse_mode: 'MarkdownV2' }); }
      const entries = pages.map(extractRevenueData);
      let message = `🚨 *Fatture Scadute \\(${escapeMarkdownV2(String(entries.length))}\\)*\n\n`;
      entries.forEach((entry, i) => {
        const clientName = escapeMarkdownV2(entry.clientName || entry.name);
        const amount = entry.amount !== null ? escapeMarkdownV2(`€${Number(entry.amount).toLocaleString('it-IT')}`) : 'N/A';
        const dueDate = entry.dueDate ? escapeMarkdownV2(entry.dueDate) : 'N/A';
        message += `*${i + 1}\\. ${clientName}*\n💶 ${amount} \\| 📅 Scaduta: ${dueDate}\n\n`;
      });
      message += `────────────────\n_Usa /revenue per il riepilogo mensile_`;
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] /invoice_overdue error:', err.message);
      await ctx.reply('❌ Failed to fetch overdue invoices\\. Please try again\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  // ─── Wizard text handler ──────────────────────────────────────────────────
  bot.on('text', async (ctx) => {
    const chatId = String(ctx.chat.id);
    const state = wizardState.get(chatId);
    if (!state || ctx.message.text.startsWith('/')) return;
    const input = ctx.message.text.trim();

    // Quote wizard
    if (state.type === 'quote') {
      if (state.step === 'clientName') {
        state.data.clientName = input; state.step = 'email';
        await ctx.reply(`Step 2/4 — Inserisci l'*email* del cliente:`, { parse_mode: 'MarkdownV2' }); return;
      }
      if (state.step === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
          await ctx.reply('❌ Email non valida\\. Reinserisci un indirizzo email corretto:', { parse_mode: 'MarkdownV2' }); return;
        }
        state.data.email = input; state.step = 'amount';
        await ctx.reply(`Step 3/4 — Inserisci l'*importo* in EUR \\(solo numero, es\\. 1500\\):`, { parse_mode: 'MarkdownV2' }); return;
      }
      if (state.step === 'amount') {
        const amount = parseFloat(input.replace(',', '.'));
        if (isNaN(amount) || amount < 0) {
          await ctx.reply('❌ Importo non valido\\. Inserisci un numero positivo \\(es\\. 1500\\):', { parse_mode: 'MarkdownV2' }); return;
        }
        state.data.amount = amount; state.step = 'dueDate';
        await ctx.reply(`Step 4/4 — Inserisci la *data di scadenza* \\(formato YYYY\\-MM\\-DD, es\\. 2026\\-05\\-01\\)\\.\nScrivi \`skip\` per saltare:`, { parse_mode: 'MarkdownV2' }); return;
      }
      if (state.step === 'dueDate') {
        let dueDate = null;
        if (input.toLowerCase() !== 'skip') {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            await ctx.reply('❌ Formato data non valido\\. Usa YYYY\\-MM\\-DD oppure scrivi `skip`:', { parse_mode: 'MarkdownV2' }); return;
          }
          dueDate = input;
        }
        state.data.dueDate = dueDate;
        wizardState.delete(chatId);
        await ctx.reply('⏳ Creo il preventivo in Notion\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
        try {
          const page = await createQuote(state.data);
          const quote = extractQuoteData(page);
          const cn = escapeMarkdownV2(quote.clientName);
          const am = escapeMarkdownV2(`€${Number(quote.amount).toLocaleString('it-IT')}`);
          const dd = quote.dueDate ? escapeMarkdownV2(quote.dueDate) : 'N/A';
          const msg = `✅ *Preventivo creato\\!*\n\n👤 *${cn}*\n💶 ${am}\n📅 Scadenza: ${dd}\n📊 Status: Draft\n\n_Usa i bottoni qui sotto per aggiornare lo stato\\._`;
          const kb = Markup.inlineKeyboard([[Markup.button.callback('📤 Send', `quotesend_${quote.id}`), Markup.button.callback('✅ Accept', `quoteaccept_${quote.id}`), Markup.button.callback('❌ Reject', `quotereject_${quote.id}`)]]);
          await ctx.reply(msg, { parse_mode: 'MarkdownV2', ...kb });
          const opChatId = process.env.OPERATOR_CHAT_ID;
          if (opChatId && opChatId !== chatId) { await sendQuoteAlert(opChatId, quote, quote.id); }
        } catch (err) {
          console.error('[commands] quote wizard error:', err.message);
          await ctx.reply('❌ Errore nella creazione del preventivo\\. Riprova\\.', { parse_mode: 'MarkdownV2' });
        }
        return;
      }
    }

    // Task wizard
    if (state.type === 'task') {
      if (state.step === 'name') {
        state.data.name = input; state.step = 'priority';
        const kb = Markup.inlineKeyboard([[Markup.button.callback('🔴 High', `wizpriority_${chatId}_High`), Markup.button.callback('🟡 Medium', `wizpriority_${chatId}_Medium`), Markup.button.callback('🟢 Low', `wizpriority_${chatId}_Low`)]]);
        await ctx.reply(`Step 2/3 — Seleziona la *priorità*:`, { parse_mode: 'MarkdownV2', ...kb }); return;
      }
      if (state.step === 'dueDate') {
        let dueDate = null;
        if (input.toLowerCase() !== 'skip') {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            await ctx.reply('❌ Formato data non valido\\. Usa YYYY\\-MM\\-DD oppure scrivi `skip`:', { parse_mode: 'MarkdownV2' }); return;
          }
          dueDate = input;
        }
        state.data.dueDate = dueDate;
        wizardState.delete(chatId);
        await ctx.reply('⏳ Creo il task in Notion\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
        try {
          const page = await createTask(state.data);
          const task = extractTaskData(page);
          const tn = escapeMarkdownV2(task.name);
          const pr = escapeMarkdownV2(task.priority);
          const dd = task.dueDate ? escapeMarkdownV2(task.dueDate) : 'N/A';
          const pe = { High: '🔴', Medium: '🟡', Low: '🟢' }[task.priority] || '⚪';
          const msg = `✅ *Task creato\\!*\n\n📌 *${tn}*\n${pe} Priority: ${pr}\n📅 Due: ${dd}\n📊 Status: Todo\n\n_Usa i bottoni per aggiornare lo stato\\._`;
          const kb = Markup.inlineKeyboard([[Markup.button.callback('▶️ Start', `taskstart_${task.id}`), Markup.button.callback('✅ Done', `taskdone_${task.id}`), Markup.button.callback('🚫 Block', `taskblock_${task.id}`)]]);
          await ctx.reply(msg, { parse_mode: 'MarkdownV2', ...kb });
          const opChatId = process.env.OPERATOR_CHAT_ID;
          if (opChatId && opChatId !== chatId) { await sendTaskAlert(opChatId, task, task.id); }
        } catch (err) {
          console.error('[commands] task wizard error:', err.message);
          await ctx.reply('❌ Errore nella creazione del task\\. Riprova\\.', { parse_mode: 'MarkdownV2' });
        }
        return;
      }
    }

    // Client wizard
    if (state.type === 'client') {
      if (state.step === 'name') {
        state.data.name = input; state.step = 'email';
        await ctx.reply(`Step 2/4 — Inserisci l'*email* del cliente:`, { parse_mode: 'MarkdownV2' }); return;
      }
      if (state.step === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
          await ctx.reply('❌ Email non valida\\. Reinserisci un indirizzo email corretto:', { parse_mode: 'MarkdownV2' }); return;
        }
        state.data.email = input; state.step = 'monthlyValue';
        await ctx.reply(`Step 3/4 — Inserisci il *valore mensile* in EUR \\(solo numero, es\\. 500\\)\\.\nScrivi \`skip\` per saltare:`, { parse_mode: 'MarkdownV2' }); return;
      }
      if (state.step === 'monthlyValue') {
        if (input.toLowerCase() !== 'skip') {
          const value = parseFloat(input.replace(',', '.'));
          if (isNaN(value) || value < 0) {
            await ctx.reply('❌ Valore non valido\\. Inserisci un numero positivo oppure scrivi `skip`:', { parse_mode: 'MarkdownV2' }); return;
          }
          state.data.monthlyValue = value;
        }
        state.step = 'startDate';
        await ctx.reply(`Step 4/4 — Inserisci la *data di inizio* rapporto \\(formato YYYY\\-MM\\-DD, es\\. 2026\\-01\\-01\\)\\.\nScrivi \`skip\` per saltare:`, { parse_mode: 'MarkdownV2' }); return;
      }
      if (state.step === 'startDate') {
        let startDate = null;
        if (input.toLowerCase() !== 'skip') {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            await ctx.reply('❌ Formato data non valido\\. Usa YYYY\\-MM\\-DD oppure scrivi `skip`:', { parse_mode: 'MarkdownV2' }); return;
          }
          startDate = input;
        }
        state.data.startDate = startDate;
        wizardState.delete(chatId);
        await ctx.reply('⏳ Creo il cliente in Notion\\.\\.\\.\\.',  { parse_mode: 'MarkdownV2' });
        try {
          const page = await createClient(state.data);
          const client = extractClientData(page);
          const cn = escapeMarkdownV2(client.name);
          const em = escapeMarkdownV2(client.email);
          const mv = client.monthlyValue !== null ? escapeMarkdownV2(`€${Number(client.monthlyValue).toLocaleString('it-IT')}`) : 'N/A';
          const msg = `✅ *Cliente creato\\!*\n\n👤 *${cn}*\n📧 ${em}\n💶 Valore mensile: ${mv}\n📊 Status: Active\n\n_Usa i bottoni per gestire il cliente\\._`;
          const kb = Markup.inlineKeyboard([[Markup.button.callback('📞 Contact', `clientcontact_${client.id}`), Markup.button.callback('💀 Churn', `clientchurn_${client.id}`)]]);
          await ctx.reply(msg, { parse_mode: 'MarkdownV2', ...kb });
          const opChatId = process.env.OPERATOR_CHAT_ID;
          if (opChatId && opChatId !== chatId) { await sendClientAlert(opChatId, client, client.id); }
        } catch (err) {
          console.error('[commands] client wizard error:', err.message);
          await ctx.reply('❌ Errore nella creazione del cliente\\. Riprova\\.', { parse_mode: 'MarkdownV2' });
        }
        return;
      }
    }
  });

  // Wizard priority callback
  bot.action(/^wizpriority_(\d+)_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const chatId = ctx.match[1];
    const priority = ctx.match[2];
    const state = wizardState.get(chatId);
    if (!state || state.type !== 'task' || state.step !== 'priority') {
      return ctx.reply('⚠️ Nessun task in corso\\. Usa /task per iniziare\\.', { parse_mode: 'MarkdownV2' });
    }
    state.data.priority = priority;
    state.step = 'dueDate';
    try { await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); } catch (_) {}
    await ctx.reply(`Step 3/3 — Inserisci la *data di scadenza* \\(formato YYYY\\-MM\\-DD, es\\. 2026\\-05\\-01\\)\\.\nScrivi \`skip\` per saltare:`, { parse_mode: 'MarkdownV2' });
  });

  // Inline button shortcuts for /start keyboard
  bot.action('cmd_leads', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const pages = await getRecentLeads(5);
      if (pages.length === 0) { return ctx.reply('📭 No leads found in your database\\.', { parse_mode: 'MarkdownV2' }); }
      const leads = pages.map(extractLeadData);
      let message = `📋 *Last ${leads.length} Lead${leads.length !== 1 ? 's' : ''}*\n\n`;
      leads.forEach((lead, i) => {
        message += `*${i + 1}\\. ${escapeMarkdownV2(lead.name)}*\n📧 ${escapeMarkdownV2(lead.email)}\n🏷 ${escapeMarkdownV2(lead.source || 'Unknown')} \\| 📊 ${escapeMarkdownV2(lead.status)} \\| ${lead.score !== null ? `⭐ ${lead.score}/10` : '⭐ N/A'}\n\n`;
      });
      message += `────────────────\n_Use /pipeline for status breakdown_`;
      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      console.error('[commands] cmd_leads error:', err.message);
      await ctx.reply('❌ Failed to fetch leads\\.', { parse_mode: 'MarkdownV2' });
    }
  });

  bot.action('cmd_pipeline', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const summary = await getPipelineSummary();
      const statusEmojis = { New: '🆕', Contacted: '📞', Qualified: '✅', Converted: '🎉', Cold: '🧊', Lost: '❌' };
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
      console.error('[commands] cmd_pipeline error:', err.message);
      await ctx.reply('❌ Failed to fetch pipeline data\\.', { parse_mode: 'MarkdownV2' });
    }
  });
}

module.exports = { registerCommands };
