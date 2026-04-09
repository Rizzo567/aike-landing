'use strict';

const { Client } = require('@notionhq/client');

if (!process.env.NOTION_API_KEY) {
  throw new Error('NOTION_API_KEY is not set in environment variables');
}

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

module.exports = notion;
