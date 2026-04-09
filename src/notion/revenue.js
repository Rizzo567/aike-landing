'use strict';

const notion = require('./client');

const DB_ID = process.env.NOTION_REVENUE_DB_ID;

/**
 * Notion database schema — Revenue
 *
 * Name         → title       (es. "Fattura #001 - Mario Rossi")
 * Client       → rich_text   (nome cliente)
 * Email        → email       (email cliente)
 * Amount       → number      (importo in EUR)
 * Status       → select      [Pending, Paid, Overdue, Cancelled]
 * Invoice Date → date
 * Due Date     → date        (scadenza pagamento)
 * Notes        → rich_text
 */

/**
 * Valid status values for the Revenue DB Status select field.
 */
const VALID_REVENUE_STATUSES = ['Pending', 'Paid', 'Overdue', 'Cancelled'];

/**
 * Create a new revenue entry in Notion.
 * @param {object} data
 * @param {string} data.clientName
 * @param {string} [data.email]
 * @param {number} [data.amount]
 * @param {string} [data.invoiceDate] - ISO date string (YYYY-MM-DD)
 * @param {string} [data.dueDate]     - ISO date string (YYYY-MM-DD)
 * @param {string} [data.notes]
 * @returns {Promise<object>} The created Notion page object
 */
async function createRevenueEntry(data) {
  const { clientName, email, amount, invoiceDate, dueDate, notes } = data;

  if (!clientName || !clientName.trim()) {
    throw new Error('createRevenueEntry: clientName is required');
  }

  // Auto-generate a title if not provided
  const today = new Date().toISOString().split('T')[0];
  const titleName = `Fattura - ${clientName.trim()} - ${invoiceDate || today}`;

  const properties = {
    Name: {
      title: [{ text: { content: titleName.slice(0, 2000) } }],
    },
    Client: {
      rich_text: [{ text: { content: clientName.trim().slice(0, 2000) } }],
    },
    Status: {
      select: { name: 'Pending' },
    },
  };

  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    properties.Email = { email: email.trim().toLowerCase() };
  }

  if (typeof amount === 'number' && amount >= 0) {
    properties.Amount = { number: amount };
  }

  if (invoiceDate && /^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) {
    properties['Invoice Date'] = { date: { start: invoiceDate } };
  } else {
    properties['Invoice Date'] = { date: { start: today } };
  }

  if (dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    properties['Due Date'] = { date: { start: dueDate } };
  }

  if (notes && notes.trim()) {
    properties.Notes = {
      rich_text: [{ text: { content: notes.trim().slice(0, 2000) } }],
    };
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: DB_ID },
      properties,
    });
    return page;
  } catch (err) {
    console.error('[notion/revenue] createRevenueEntry error:', err.message);
    throw err;
  }
}

/**
 * Update the Status field of a revenue entry.
 * @param {string} pageId - Notion page ID
 * @param {string} status - One of VALID_REVENUE_STATUSES
 * @returns {Promise<object>} Updated page object
 */
async function updateRevenueStatus(pageId, status) {
  if (!VALID_REVENUE_STATUSES.includes(status)) {
    throw new Error(
      `updateRevenueStatus: invalid status "${status}". Must be one of: ${VALID_REVENUE_STATUSES.join(', ')}`
    );
  }

  try {
    const page = await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: { select: { name: status } },
      },
    });
    return page;
  } catch (err) {
    console.error(`[notion/revenue] updateRevenueStatus error for page ${pageId}:`, err.message);
    throw err;
  }
}

/**
 * Get the most recent revenue entries.
 * @param {number} [limit=5]
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getRecentRevenue(limit = 5) {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: Math.min(limit, 100),
    });
    return response.results;
  } catch (err) {
    console.error('[notion/revenue] getRecentRevenue error:', err.message);
    throw err;
  }
}

/**
 * Get revenue entries filtered by status.
 * @param {string} status - One of VALID_REVENUE_STATUSES
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getRevenueByStatus(status) {
  if (!VALID_REVENUE_STATUSES.includes(status)) {
    throw new Error(`getRevenueByStatus: invalid status "${status}"`);
  }

  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: 'Status',
        select: { equals: status },
      },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });
    return response.results;
  } catch (err) {
    console.error(`[notion/revenue] getRevenueByStatus error for status "${status}":`, err.message);
    throw err;
  }
}

/**
 * Get overdue invoices — Due Date < today and Status = 'Pending'.
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getOverdueInvoices() {
  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        and: [
          {
            property: 'Due Date',
            date: { before: today },
          },
          {
            property: 'Status',
            select: { equals: 'Pending' },
          },
        ],
      },
      sorts: [{ property: 'Due Date', direction: 'ascending' }],
    });
    return response.results;
  } catch (err) {
    console.error('[notion/revenue] getOverdueInvoices error:', err.message);
    throw err;
  }
}

/**
 * Get the total revenue for a specific month (only entries with Status = 'Paid').
 * @param {number} year  - Full year (e.g. 2026)
 * @param {number} month - 1-based month (1 = January, 12 = December)
 * @returns {Promise<number>} Total amount in EUR
 */
async function getMonthlyTotal(year, month) {
  // Build the first and last day of the month in YYYY-MM-DD
  const paddedMonth = String(month).padStart(2, '0');
  const firstDay = `${year}-${paddedMonth}-01`;

  const lastDayDate = new Date(year, month, 0); // Day 0 of next month = last day of current month
  const lastDay = lastDayDate.toISOString().split('T')[0];

  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        and: [
          {
            property: 'Status',
            select: { equals: 'Paid' },
          },
          {
            property: 'Invoice Date',
            date: { on_or_after: firstDay },
          },
          {
            property: 'Invoice Date',
            date: { on_or_before: lastDay },
          },
        ],
      },
      page_size: 100,
    });

    const total = response.results.reduce((sum, page) => {
      const amount = page.properties?.Amount?.number;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);

    return total;
  } catch (err) {
    console.error(`[notion/revenue] getMonthlyTotal error for ${year}-${paddedMonth}:`, err.message);
    throw err;
  }
}

/**
 * Get revenue total for the current calendar month.
 * @returns {Promise<number>} Total amount in EUR
 */
async function getCurrentMonthRevenue() {
  const now = new Date();
  return getMonthlyTotal(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Extract a plain-object representation from a Notion page.
 * @param {object} page - Notion page object
 * @returns {object}
 */
function extractRevenueData(page) {
  const props = page.properties || {};

  return {
    id: page.id,
    name: props.Name?.title?.[0]?.plain_text || 'Untitled',
    clientName: props.Client?.rich_text?.[0]?.plain_text || '',
    email: props.Email?.email || '',
    amount: props.Amount?.number ?? null,
    status: props.Status?.select?.name || 'Pending',
    invoiceDate: props['Invoice Date']?.date?.start || null,
    dueDate: props['Due Date']?.date?.start || null,
    notes: props.Notes?.rich_text?.[0]?.plain_text || '',
    created: page.created_time || null,
    url: page.url || null,
  };
}

module.exports = {
  createRevenueEntry,
  updateRevenueStatus,
  getRecentRevenue,
  getRevenueByStatus,
  getOverdueInvoices,
  getMonthlyTotal,
  getCurrentMonthRevenue,
  extractRevenueData,
  VALID_REVENUE_STATUSES,
};
