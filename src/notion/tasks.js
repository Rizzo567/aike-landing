'use strict';

const notion = require('./client');

const DB_ID = process.env.NOTION_TASKS_DB_ID;

/**
 * Notion database schema — Tasks
 *
 * Name        → title
 * Description → rich_text
 * Status      → select      [Todo, In Progress, Done, Blocked]
 * Priority    → select      [High, Medium, Low]
 * Due Date    → date
 * Assigned To → rich_text   (nome operatore)
 * Created     → created_time (automatico Notion)
 */

/**
 * Valid status values for the Tasks DB Status select field.
 */
const VALID_TASK_STATUSES = ['Todo', 'In Progress', 'Done', 'Blocked'];

/**
 * Valid priority values for the Tasks DB Priority select field.
 */
const VALID_TASK_PRIORITIES = ['High', 'Medium', 'Low'];

/**
 * Priority sort order for display (lower index = shown first).
 */
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

/**
 * Create a new task record in Notion.
 * @param {object} data
 * @param {string} data.name
 * @param {string} [data.description]
 * @param {string} [data.priority]     - One of VALID_TASK_PRIORITIES
 * @param {string} [data.dueDate]      - ISO date string (YYYY-MM-DD)
 * @param {string} [data.assignedTo]   - Operator name
 * @returns {Promise<object>} The created Notion page object
 */
async function createTask(data) {
  const { name, description, priority, dueDate, assignedTo } = data;

  if (!name || !name.trim()) {
    throw new Error('createTask: name is required');
  }

  const resolvedPriority = VALID_TASK_PRIORITIES.includes(priority) ? priority : 'Medium';

  const properties = {
    Name: {
      title: [{ text: { content: name.trim().slice(0, 2000) } }],
    },
    Status: {
      select: { name: 'Todo' },
    },
    Priority: {
      select: { name: resolvedPriority },
    },
  };

  if (description && description.trim()) {
    properties.Description = {
      rich_text: [{ text: { content: description.trim().slice(0, 2000) } }],
    };
  }

  if (dueDate) {
    properties['Due Date'] = { date: { start: dueDate } };
  }

  if (assignedTo && assignedTo.trim()) {
    properties['Assigned To'] = {
      rich_text: [{ text: { content: assignedTo.trim().slice(0, 2000) } }],
    };
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: DB_ID },
      properties,
    });
    return page;
  } catch (err) {
    console.error('[notion/tasks] createTask error:', err.message);
    throw err;
  }
}

/**
 * Update the Status field of a task.
 * @param {string} pageId - Notion page ID
 * @param {string} status - One of VALID_TASK_STATUSES
 * @returns {Promise<object>} Updated page object
 */
async function updateTaskStatus(pageId, status) {
  if (!VALID_TASK_STATUSES.includes(status)) {
    throw new Error(
      `updateTaskStatus: invalid status "${status}". Must be one of: ${VALID_TASK_STATUSES.join(', ')}`
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
    console.error(`[notion/tasks] updateTaskStatus error for page ${pageId}:`, err.message);
    throw err;
  }
}

/**
 * Get the most recent tasks from the database.
 * @param {number} [limit=5] - Number of tasks to retrieve
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getRecentTasks(limit = 5) {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: Math.min(limit, 100),
    });
    return response.results;
  } catch (err) {
    console.error('[notion/tasks] getRecentTasks error:', err.message);
    throw err;
  }
}

/**
 * Get tasks filtered by status.
 * @param {string} status - One of VALID_TASK_STATUSES
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getTasksByStatus(status) {
  if (!VALID_TASK_STATUSES.includes(status)) {
    throw new Error(`getTasksByStatus: invalid status "${status}"`);
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
    console.error(`[notion/tasks] getTasksByStatus error for status "${status}":`, err.message);
    throw err;
  }
}

/**
 * Get tasks due today (Due Date = today) that are not Done.
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getTasksDueToday() {
  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        and: [
          {
            property: 'Due Date',
            date: { equals: today },
          },
          {
            property: 'Status',
            select: { does_not_equal: 'Done' },
          },
        ],
      },
      sorts: [{ property: 'Priority', direction: 'ascending' }],
    });
    return response.results;
  } catch (err) {
    console.error('[notion/tasks] getTasksDueToday error:', err.message);
    throw err;
  }
}

/**
 * Get tasks due tomorrow that are not Done.
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function getTasksDueTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        and: [
          {
            property: 'Due Date',
            date: { equals: tomorrowStr },
          },
          {
            property: 'Status',
            select: { does_not_equal: 'Done' },
          },
        ],
      },
      sorts: [{ property: 'Priority', direction: 'ascending' }],
    });
    return response.results;
  } catch (err) {
    console.error('[notion/tasks] getTasksDueTomorrow error:', err.message);
    throw err;
  }
}

/**
 * Get all active tasks (not Done), sorted by priority then due date.
 * @returns {Promise<Array>} Array of plain task objects, sorted
 */
async function getActiveTasks() {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: 'Status',
        select: { does_not_equal: 'Done' },
      },
      page_size: 100,
    });

    // Sort by priority order, then due date ascending
    const tasks = response.results.map(extractTaskData);
    tasks.sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 99;
      const pb = PRIORITY_ORDER[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    return tasks;
  } catch (err) {
    console.error('[notion/tasks] getActiveTasks error:', err.message);
    throw err;
  }
}

/**
 * Search tasks by name (case-insensitive contains).
 * @param {string} name
 * @returns {Promise<Array>} Array of Notion page objects
 */
async function searchTasksByName(name) {
  try {
    const response = await notion.databases.query({
      database_id: DB_ID,
      filter: {
        property: 'Name',
        title: { contains: name },
      },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });
    return response.results;
  } catch (err) {
    console.error(`[notion/tasks] searchTasksByName error for name "${name}":`, err.message);
    throw err;
  }
}

/**
 * Extract a plain-object representation from a Notion page for easy use in messages.
 * @param {object} page - Notion page object
 * @returns {object}
 */
function extractTaskData(page) {
  const props = page.properties || {};

  return {
    id: page.id,
    name: props.Name?.title?.[0]?.plain_text || 'Untitled',
    description: props.Description?.rich_text?.[0]?.plain_text || '',
    status: props.Status?.select?.name || 'Todo',
    priority: props.Priority?.select?.name || 'Medium',
    dueDate: props['Due Date']?.date?.start || null,
    assignedTo: props['Assigned To']?.rich_text?.[0]?.plain_text || '',
    created: page.created_time || null,
    url: page.url || null,
  };
}

module.exports = {
  createTask,
  updateTaskStatus,
  getRecentTasks,
  getTasksByStatus,
  getTasksDueToday,
  getTasksDueTomorrow,
  getActiveTasks,
  searchTasksByName,
  extractTaskData,
  VALID_TASK_STATUSES,
  VALID_TASK_PRIORITIES,
};
