'use strict';

const { getRecentLeads, getPipelineSummary, extractLeadData } = require('../notion/leads');
const { getExpiredQuotes, getQuoteSummary } = require('../notion/quotes');
const { getTasksDueToday, getActiveTasks, extractTaskData } = require('../notion/tasks');
const { getAllActiveClients, getAtRiskClients } = require('../notion/clients');
const { getCurrentMonthRevenue, getOverdueInvoices } = require('../notion/revenue');

/**
 * Raccoglie dati da tutti i moduli Notion per costruire il contesto del digest.
 * Ogni chiamata è wrapped in try/catch — se fallisce usa valori default senza crashare.
 * @returns {Promise<object>} Oggetto strutturato con tutti i dati del giorno
 */
async function collectDailyData() {
  const date = new Date().toISOString().split('T')[0];

  // ─── Leads ─────────────────────────────────────────────────────────────────
  let leadsData = {
    total: 0,
    new_today: 0,
    pipeline: { New: 0, Contacted: 0, Qualified: 0, Converted: 0, Cold: 0, Lost: 0 },
    recent: [],
  };

  try {
    const [recentPages, pipelineSummary] = await Promise.all([
      getRecentLeads(5),
      getPipelineSummary(),
    ]);

    const recent = recentPages.map(extractLeadData);

    // Count leads created today
    const todayStr = date;
    const newToday = recent.filter((lead) => {
      if (!lead.created) return false;
      return lead.created.startsWith(todayStr);
    }).length;

    const total = Object.values(pipelineSummary).reduce((sum, n) => sum + n, 0);

    leadsData = {
      total,
      new_today: newToday,
      pipeline: pipelineSummary,
      recent,
    };
  } catch (err) {
    console.error('[collector] leads data error:', err.message);
  }

  // ─── Quotes ────────────────────────────────────────────────────────────────
  let quotesData = {
    expired: 0,
    summary: { Draft: 0, Sent: 0, Accepted: 0, Rejected: 0, Expired: 0 },
  };

  try {
    const [expiredPages, summary] = await Promise.all([getExpiredQuotes(), getQuoteSummary()]);

    quotesData = {
      expired: expiredPages.length,
      summary,
    };
  } catch (err) {
    console.error('[collector] quotes data error:', err.message);
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────
  let tasksData = {
    due_today: 0,
    active: 0,
    by_status: { Todo: 0, 'In Progress': 0, Done: 0, Blocked: 0 },
  };

  try {
    const [dueTodayPages, activeTasks] = await Promise.all([
      getTasksDueToday(),
      getActiveTasks(),
    ]);

    // Count by status from active tasks
    const byStatus = { Todo: 0, 'In Progress': 0, Done: 0, Blocked: 0 };
    for (const task of activeTasks) {
      if (Object.prototype.hasOwnProperty.call(byStatus, task.status)) {
        byStatus[task.status]++;
      }
    }

    tasksData = {
      due_today: dueTodayPages.length,
      active: activeTasks.length,
      by_status: byStatus,
    };
  } catch (err) {
    console.error('[collector] tasks data error:', err.message);
  }

  // ─── Clients ───────────────────────────────────────────────────────────────
  let clientsData = {
    active: 0,
    at_risk: 0,
  };

  try {
    const [activeClients, atRiskClients] = await Promise.all([
      getAllActiveClients(),
      getAtRiskClients(),
    ]);

    clientsData = {
      active: activeClients.length,
      at_risk: atRiskClients.length,
    };
  } catch (err) {
    console.error('[collector] clients data error:', err.message);
  }

  // ─── Revenue ───────────────────────────────────────────────────────────────
  let revenueData = {
    current_month_total: 0,
    overdue_count: 0,
  };

  try {
    const [monthTotal, overduePages] = await Promise.all([
      getCurrentMonthRevenue(),
      getOverdueInvoices(),
    ]);

    revenueData = {
      current_month_total: monthTotal,
      overdue_count: overduePages.length,
    };
  } catch (err) {
    console.error('[collector] revenue data error:', err.message);
  }

  return {
    date,
    leads: leadsData,
    quotes: quotesData,
    tasks: tasksData,
    clients: clientsData,
    revenue: revenueData,
  };
}

module.exports = { collectDailyData };
