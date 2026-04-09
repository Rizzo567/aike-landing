'use strict';

const notion = require('./client');

const DB_ID = process.env.NOTION_CLIENTS_DB_ID;

/**
 * Notion database schema — Clients
 *
 * Name          → title
 * Email         → email
 * Status        → select      [Active, Inactive, Churned, Prospect]
 * Health Score  → number      (0–100, calcolato dal sistema)
 * Monthly Value → number      (valore mensile in EUR)
 * Start Date    → date
 * Last Contact  → date
 * Notes         → rich_text
 * Tags          → multi_select (es. ["Premium", "Early Adopter", "At Risk"])
 */

/**
 * Valid status values for the Clients DB Status select field.
 */
const VALID_CLIENT_STATUSES = ['Active', 'Inactive', 'Churned', 'Prospect'];

/**
 * Create a new client record in Notion.
 * @param {object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {number} [data.monthlyValue]
 * @param {string} [data.startDate]   - ISO date string (YYYY-MM-DD)
 * @param {string} [data.notes]
 * @returns {Promise<object>} The created Notion page object
 */
async function createClient(data) {
  const { name, email, monthlyValue, startDate, notes } = data;

  if (!name || !name.trim()) {
    throw new Error('createClient: name is required');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('createClient: valid email is required');
  }

  const properties = {
    Name: {
      title: [{ text: { content: name.trim().slice(0, 2000) } }],
    },
    Email: {
      email: email.trim().toLowerCase(),
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
    console.error('[notion/clients] createClient error:', err.message);
    throw err;
  }
}

/**
 * Update the Status field of a client.
 * @param {string} pageId - Notion page ID
 * @param {string} status - One of VALID_CLIENT_STATUSES
 * @returns {Promise<object>} Updated page object
 */
async function updateClientStatus(pageId, status) {
  if (!VALID_CLIENT_STATUSES.includes(status)) {
    throw new Error(
      `updateClientStatus: invalid status "${status}". Must be one of: ${VALID_CLIENT_STATUSES.join(', ')}`
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
    console.error(`[notion/clients] updateClientStatus error for page ${pageId}:`, err.message);
    throw err;
  }
}

/**
 * Update the Health Score field of a client.
 * @param {string} pageId - Notion page ID
 * @param {number} score  - 0–100
 * @returns {Promise<object>} Updated page object
 */
async function updateHealthScore(pageId, score) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  try {
    const page = await notion.pages.update({
      page_id: pageId,
      properties: {
        'Health Score': { number: clampedScore },
      },
    });
    return page;
  } catch (err) {
    console.error(`[notion/clients] updateHealthScore error for page ${pageId}:`, err.message);
    throw err;
  }
}

/**
 * Update the Last Contact date of a client to today.
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
 * Get the most recent clients from the database.
 * @param {number} [limit=5]
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getRecentClients(limit = 5) {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: Math.min(limit, 100),
    });
    return response.results;
  } catch (err) {
    console.error('[notion/clients] getRecentClients error:', err.message);
    throw err;
  }
}

/**
 * Get clients filtered by status.
 * @param {string} status - One of VALID_CLIENT_STATUSES
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getClientsByStatus(status) {
  if (!VALID_CLIENT_STATUSES.includes(status)) {
    throw new Error(`getClientsByStatus: invalid status "${status}"`);
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
    console.error(`[notion/clients] getClientsByStatus error for status "${status}":`, err.message);
    throw err;
  }
}

/**
 * Find a client by exact email match.
 * @param {string} email
 * @returns {Promise<object|null>} Notion page object or null if not found
 */
async function getClientByEmail(email) {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: 'Email',
        email: { equals: email.trim().toLowerCase() },
      },
    });
    return response.results[0] || null;
  } catch (err) {
    console.error(`[notion/clients] getClientByEmail error for email "${email}":`, err.message);
    throw err;
  }
}

/**
 * Get all Active clients with Health Score < 40.
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
 * Get all Active clients.
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
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 100,
    });
    return response.results;
  } catch (err) {
    console.error('[notion/clients] getAllActiveClients error:', err.message);
    throw err;
  }
}

/**
 * Calculate a health score (0–100) for a client based on recency and value.
 * @param {object} clientData - Plain client object from extractClientData()
 * @returns {number} Health score 0–100
 */
function calculateHealthScore(clientData) {
  let score = 50;

  const today = new Date();

  if (clientData.lastContact) {
    const lastContactDate = new Date(clientData.lastContact);
    const daysDiff = Math.floor((today - lastContactDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      score += 20;
    } else if (daysDiff <= 30) {
      score += 10;
    } else if (daysDiff > 60) {
      score -= 20;
    }
  }

  if (typeof clientData.monthlyValue === 'number' && clientData.monthlyValue > 500) {
    score += 10;
  }

  const hasAtRiskTag = Array.isArray(clientData.tags) && clientData.tags.includes('At Risk');
  if (clientData.status === 'Active' && !hasAtRiskTag) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
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
    startDate: props['Start Date']?.date?.start || null,
    lastContact: props['Last Contact']?.date?.start || null,
    notes: props.Notes?.rich_text?.[0]?.plain_text || '',
    tags: props.Tags?.multi_select?.map((t) => t.name) || [],
    created: page.created_time || null,
    url: page.url || null,
  };
}

module.exports = {
  createClient,
  updateClientStatus,
  updateHealthScore,
  updateLastContact,
  getRecentClients,
  getClientsByStatus,
  getClientByEmail,
  getAtRiskClients,
  getAllActiveClients,
  calculateHealthScore,
  extractClientData,
  VALID_CLIENT_STATUSES,
};
