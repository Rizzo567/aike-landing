'use strict';

const notion = require('./client');

const DB_ID = process.env.NOTION_QUOTES_DB_ID;

/**
 * Notion database schema — Quotes
 *
 * Name      → title       (e.g. "Preventivo - Mario Rossi")
 * Client    → rich_text   (nome cliente)
 * Email     → email
 * Amount    → number      (importo in EUR)
 * Status    → select      [Draft, Sent, Accepted, Rejected, Expired]
 * Due Date  → date        (scadenza preventivo)
 * Notes     → rich_text
 * Created   → created_time (automatico Notion)
 */

/**
 * Valid status values for the Quotes DB Status select field.
 */
const VALID_QUOTE_STATUSES = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];

/**
 * Create a new quote record in Notion.
 * @param {object} data
 * @param {string} data.clientName
 * @param {string} data.email
 * @param {number} data.amount       - Amount in EUR
 * @param {string} [data.notes]
 * @param {string} [data.dueDate]    - ISO date string (YYYY-MM-DD)
 * @returns {Promise<object>} The created Notion page object
 */
async function createQuote(data) {
  const { clientName, email, amount, notes, dueDate } = data;

  if (!clientName || !email) {
    throw new Error('createQuote: clientName and email are required');
  }
  if (typeof amount !== 'number' || amount < 0) {
    throw new Error('createQuote: amount must be a non-negative number');
  }

  const properties = {
    Name: {
      title: [{ text: { content: `Preventivo - ${clientName}` } }],
    },
    Client: {
      rich_text: [{ text: { content: clientName.trim().slice(0, 2000) } }],
    },
    Email: {
      email: email,
    },
    Amount: {
      number: amount,
    },
    Status: {
      select: { name: 'Draft' },
    },
  };

  if (dueDate) {
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
    console.error('[notion/quotes] createQuote error:', err.message);
    throw err;
  }
}

/**
 * Update the Status field of a quote.
 * @param {string} pageId - Notion page ID
 * @param {string} status - One of VALID_QUOTE_STATUSES
 * @returns {Promise<object>} Updated page object
 */
async function updateQuoteStatus(pageId, status) {
  if (!VALID_QUOTE_STATUSES.includes(status)) {
    throw new Error(
      `updateQuoteStatus: invalid status "${status}". Must be one of: ${VALID_QUOTE_STATUSES.join(', ')}`
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
    console.error(`[notion/quotes] updateQuoteStatus error for page ${pageId}:`, err.message);
    throw err;
  }
}

/**
 * Get the most recent quotes from the database.
 * @param {number} [limit=5] - Number of quotes to retrieve
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getRecentQuotes(limit = 5) {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: Math.min(limit, 100),
    });
    return response.results;
  } catch (err) {
    console.error('[notion/quotes] getRecentQuotes error:', err.message);
    throw err;
  }
}

/**
 * Get quotes filtered by status.
 * @param {string} status - One of VALID_QUOTE_STATUSES
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getQuotesByStatus(status) {
  if (!VALID_QUOTE_STATUSES.includes(status)) {
    throw new Error(`getQuotesByStatus: invalid status "${status}"`);
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
    console.error(`[notion/quotes] getQuotesByStatus error for status "${status}":`, err.message);
    throw err;
  }
}

/**
 * Get quotes that are overdue: Due Date < today AND Status = 'Sent'.
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getExpiredQuotes() {
  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        and: [
          {
            property: 'Status',
            select: { equals: 'Sent' },
          },
          {
            property: 'Due Date',
            date: { before: today },
          },
        ],
      },
      sorts: [{ property: 'Due Date', direction: 'ascending' }],
    });
    return response.results;
  } catch (err) {
    console.error('[notion/quotes] getExpiredQuotes error:', err.message);
    throw err;
  }
}

/**
 * Extract a plain-object representation from a Notion page for easy use in messages.
 * @param {object} page - Notion page object
 * @returns {object}
 */
function extractQuoteData(page) {
  const props = page.properties || {};

  return {
    id: page.id,
    clientName: props.Client?.rich_text?.[0]?.plain_text || 'Unknown',
    email: props.Email?.email || '',
    amount: props.Amount?.number ?? null,
    status: props.Status?.select?.name || 'Draft',
    dueDate: props['Due Date']?.date?.start || null,
    notes: props.Notes?.rich_text?.[0]?.plain_text || '',
    created: page.created_time || null,
    url: page.url || null,
  };
}

/**
 * Get a count of quotes per status for the summary.
 * @returns {Promise<object>} e.g. { Draft: 1, Sent: 3, Accepted: 2, ... }
 */
async function getQuoteSummary() {
  const summary = {};
  for (const status of VALID_QUOTE_STATUSES) {
    summary[status] = 0;
  }

  try {
    let hasMore = true;
    let cursor = undefined;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: DB_ID,
        page_size: 100,
        start_cursor: cursor,
      });

      for (const page of response.results) {
        const statusValue = page.properties?.Status?.select?.name;
        if (statusValue && Object.prototype.hasOwnProperty.call(summary, statusValue)) {
          summary[statusValue]++;
        }
      }

      hasMore = response.has_more;
      cursor = response.next_cursor;
    }

    return summary;
  } catch (err) {
    console.error('[notion/quotes] getQuoteSummary error:', err.message);
    throw err;
  }
}

module.exports = {
  createQuote,
  updateQuoteStatus,
  getRecentQuotes,
  getQuotesByStatus,
  getExpiredQuotes,
  extractQuoteData,
  getQuoteSummary,
  VALID_QUOTE_STATUSES,
};
