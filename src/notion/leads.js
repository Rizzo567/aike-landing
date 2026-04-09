'use strict';

const notion = require('./client');

const DB_ID = process.env.NOTION_LEADS_DB_ID;

/**
 * Valid status values for the Leads DB Status select field.
 */
const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Cold', 'Lost'];

/**
 * Valid source values for the Leads DB Source select field.
 */
const VALID_SOURCES = ['Website', 'Instagram', 'Referral', 'Cold', 'Telegram', 'Email'];

/**
 * Create a new lead record in Notion.
 * @param {object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} [data.source]
 * @param {number} [data.score]
 * @param {string} [data.notes]
 * @returns {Promise<object>} The created Notion page object
 */
async function createLead(data) {
  const { name, email, source, score, notes } = data;

  if (!name || !email) {
    throw new Error('createLead: name and email are required');
  }

  const resolvedSource = VALID_SOURCES.includes(source) ? source : 'Email';
  const resolvedScore = typeof score === 'number' && score >= 1 && score <= 10 ? score : null;

  const properties = {
    Name: {
      title: [{ text: { content: name } }],
    },
    Email: {
      email: email,
    },
    Status: {
      select: { name: 'New' },
    },
    Source: {
      select: { name: resolvedSource },
    },
    'Last Contact': {
      date: { start: new Date().toISOString().split('T')[0] },
    },
  };

  if (resolvedScore !== null) {
    properties.Score = { number: resolvedScore };
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
    console.error('[notion/leads] createLead error:', err.message);
    throw err;
  }
}

/**
 * Update the Status field of a lead.
 * @param {string} pageId - Notion page ID
 * @param {string} status - One of VALID_STATUSES
 * @returns {Promise<object>} Updated page object
 */
async function updateLeadStatus(pageId, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`updateLeadStatus: invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  try {
    const page = await notion.pages.update({
      page_id: pageId,
      properties: {
        Status: { select: { name: status } },
        'Last Contact': { date: { start: new Date().toISOString().split('T')[0] } },
      },
    });
    return page;
  } catch (err) {
    console.error(`[notion/leads] updateLeadStatus error for page ${pageId}:`, err.message);
    throw err;
  }
}

/**
 * Get the most recent leads from the database.
 * @param {number} [limit=5] - Number of leads to retrieve
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getRecentLeads(limit = 5) {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: Math.min(limit, 100),
    });
    return response.results;
  } catch (err) {
    console.error('[notion/leads] getRecentLeads error:', err.message);
    throw err;
  }
}

/**
 * Get a single lead by Notion page ID.
 * @param {string} pageId
 * @returns {Promise<object>} Notion page object
 */
async function getLeadById(pageId) {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    return page;
  } catch (err) {
    console.error(`[notion/leads] getLeadById error for page ${pageId}:`, err.message);
    throw err;
  }
}

/**
 * Get leads filtered by status.
 * @param {string} status - One of VALID_STATUSES
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getLeadsByStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`getLeadsByStatus: invalid status "${status}"`);
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
    console.error(`[notion/leads] getLeadsByStatus error for status "${status}":`, err.message);
    throw err;
  }
}

/**
 * Get a count of leads per status for the pipeline summary.
 * @returns {Promise<object>} e.g. { New: 3, Qualified: 1, Converted: 2, ... }
 */
async function getPipelineSummary() {
  const summary = {};
  for (const status of VALID_STATUSES) {
    summary[status] = 0;
  }

  try {
    // Paginate through all leads to build the summary
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
        if (statusValue && summary.hasOwnProperty(statusValue)) {
          summary[statusValue]++;
        }
      }

      hasMore = response.has_more;
      cursor = response.next_cursor;
    }

    return summary;
  } catch (err) {
    console.error('[notion/leads] getPipelineSummary error:', err.message);
    throw err;
  }
}

/**
 * Extract a plain-object representation from a Notion page for easy use in messages.
 * @param {object} page - Notion page object
 * @returns {object}
 */
function extractLeadData(page) {
  const props = page.properties || {};

  return {
    id: page.id,
    name: props.Name?.title?.[0]?.plain_text || 'Unknown',
    email: props.Email?.email || '',
    status: props.Status?.select?.name || 'New',
    score: props.Score?.number ?? null,
    source: props.Source?.select?.name || '',
    lastContact: props['Last Contact']?.date?.start || null,
    notes: props.Notes?.rich_text?.[0]?.plain_text || '',
    created: page.created_time || null,
    url: page.url || null,
  };
}

module.exports = {
  createLead,
  updateLeadStatus,
  getRecentLeads,
  getLeadById,
  getLeadsByStatus,
  getPipelineSummary,
  extractLeadData,
  VALID_STATUSES,
};
