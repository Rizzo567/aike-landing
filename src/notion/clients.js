'use strict';

const notion = require('./client');

const DB_ID = process.env.NOTION_CLIENTS_DB_ID;

const VALID_STATUSES = ['Active', 'Churned', 'Prospect'];

/**
 * Create a new client record in Notion.
 * @param {object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {number} [data.monthlyValue]
 * @param {string} [data.startDate] - ISO date string YYYY-MM-DD
 * @returns {Promise<object>} The created Notion page object
 */
async function createClient(data) {
  const { name, email, monthlyValue, startDate } = data;

  if (!name || !email) {
    throw new Error('createClient: name and email are required');
  }

  const properties = {
    Name: {
      title: [{ text: { content: name } }],
    },
    Email: {
      email: email,
    },
    Status: {
      select: { name: 'Active' },
    },
    'Last Contact': {
      date: { start: new Date().toISOString().split('T')[0] },
    },
  };

  if (typeof monthlyValue === 'number' && monthlyValue >= 0) {
    properties['Monthly Value'] = { number: monthlyValue };
  }

  if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    properties['Start Date'] = { date: { start: startDate } };
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: DB_ID },
      properties,
    });
    return page;
  } catch (err) {
    console.error('[notion/clients] createClient error:', err.message);
    throw err;
  }
}

/**
 * Update the Status field of a client.
 * @param {string} pageId - Notion page ID
 * @param {string} status - One of VALID_STATUSES
 * @returns {Promise<object>} Updated page object
 */
async function updateClientStatus(pageId, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`updateClientStatus: invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
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
    console.error(`[notion/clients] updateClientStatus error for page ${pageId}:`, err.message);
    throw err;
  }
}

/**
 * Update the Last Contact date to today.
 * @param {string} pageId - Notion page ID
 * @returns {Promise<object>} Updated page object
 */
async function updateLastContact(pageId) {
  const today = new Date().toISOString().split('T')[0];

  try {
    const page = await notion.pages.update({
      page_id: pageId,
      properties: {
        'Last Contact': { date: { start: today } },
      },
    });
    return page;
  } catch (err) {
    console.error(`[notion/clients] updateLastContact error for page ${pageId}:`, err.message);
    throw err;
  }
}

/**
 * Get all active clients.
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getAllActiveClients() {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: 'Status',
        select: { equals: 'Active' },
      },
      sorts: [{ property: 'Name', direction: 'ascending' }],
    });
    return response.results;
  } catch (err) {
    console.error('[notion/clients] getAllActiveClients error:', err.message);
    throw err;
  }
}

/**
 * Get clients at risk of churn — Health Score below 40.
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getAtRiskClients() {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        and: [
          {
            property: 'Status',
            select: { equals: 'Active' },
          },
          {
            property: 'Health Score',
            number: { less_than: 40 },
          },
        ],
      },
      sorts: [{ property: 'Health Score', direction: 'ascending' }],
    });
    return response.results;
  } catch (err) {
    console.error('[notion/clients] getAtRiskClients error:', err.message);
    throw err;
  }
}

/**
 * Extract a plain-object representation from a Notion page.
 * @param {object} page - Notion page object
 * @returns {object}
 */
function extractClientData(page) {
  const props = page.properties || {};

  return {
    id: page.id,
    name: props.Name?.title?.[0]?.plain_text || 'Unknown',
    email: props.Email?.email || '',
    status: props.Status?.select?.name || 'Active',
    healthScore: props['Health Score']?.number ?? null,
    monthlyValue: props['Monthly Value']?.number ?? null,
    lastContact: props['Last Contact']?.date?.start || null,
    startDate: props['Start Date']?.date?.start || null,
    url: page.url || null,
  };
}

module.exports = {
  createClient,
  updateClientStatus,
  updateLastContact,
  getAllActiveClients,
  getAtRiskClients,
  extractClientData,
  VALID_STATUSES,
};
