'use strict';

const notion = require('./client');

const DB_ID = process.env.NOTION_REVENUE_DB_ID;

const VALID_STATUSES = ['Pending', 'Paid', 'Overdue', 'Cancelled'];

/**
 * Update the Status field of a revenue entry (invoice).
 * @param {string} pageId - Notion page ID
 * @param {string} status - One of VALID_STATUSES
 * @returns {Promise<object>} Updated page object
 */
async function updateRevenueStatus(pageId, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`updateRevenueStatus: invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
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
 * Get the total amount of paid invoices for the current calendar month.
 * @returns {Promise<number>} Total paid amount in EUR
 */
async function getCurrentMonthRevenue() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  try {
    let total = 0;
    let hasMore = true;
    let cursor = undefined;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: DB_ID,
        filter: {
          and: [
            { property: 'Status', select: { equals: 'Paid' } },
            { property: 'Invoice Date', date: { on_or_after: startOfMonth } },
            { property: 'Invoice Date', date: { on_or_before: endOfMonth } },
          ],
        },
        page_size: 100,
        start_cursor: cursor,
      });

      for (const page of response.results) {
        const amount = page.properties?.Amount?.number;
        if (typeof amount === 'number') {
          total += amount;
        }
      }

      hasMore = response.has_more;
      cursor = response.next_cursor;
    }

    return total;
  } catch (err) {
    console.error('[notion/revenue] getCurrentMonthRevenue error:', err.message);
    throw err;
  }
}

/**
 * Get all revenue entries (invoices) by status.
 * @param {string} status - One of VALID_STATUSES
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getRevenueByStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
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
 * Get the most recent revenue entries.
 * @param {number} [limit=5] - Number of entries to retrieve
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
 * Get all overdue invoices (status Overdue, sorted by Due Date ascending).
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getOverdueInvoices() {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: 'Status',
        select: { equals: 'Overdue' },
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
 * Extract a plain-object representation from a Notion revenue page.
 * @param {object} page - Notion page object
 * @returns {object}
 */
function extractRevenueData(page) {
  const props = page.properties || {};

  return {
    id: page.id,
    name: props.Name?.title?.[0]?.plain_text || 'Unknown',
    clientName: props['Client Name']?.rich_text?.[0]?.plain_text || props.Name?.title?.[0]?.plain_text || 'Unknown',
    email: props.Email?.email || '',
    amount: props.Amount?.number ?? null,
    status: props.Status?.select?.name || 'Pending',
    invoiceDate: props['Invoice Date']?.date?.start || null,
    dueDate: props['Due Date']?.date?.start || null,
    url: page.url || null,
  };
}

module.exports = {
  updateRevenueStatus,
  getCurrentMonthRevenue,
  getRevenueByStatus,
  getRecentRevenue,
  getOverdueInvoices,
  extractRevenueData,
  VALID_STATUSES,
};
