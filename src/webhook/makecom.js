'use strict';

const express = require('express');
const { createLead, extractLeadData } = require('../notion/leads');
const { sendLeadAlert } = require('../telegram/alerts');

const router = express.Router();

const OPERATOR_CHAT_ID = process.env.OPERATOR_CHAT_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * POST /webhook/new-lead
 *
 * Called by Make.com after detecting a new lead email and creating a Notion record.
 *
 * Expected headers:
 *   x-webhook-secret: <WEBHOOK_SECRET>
 *
 * Expected body:
 *   {
 *     name: string,
 *     email: string,
 *     subject?: string,
 *     body_preview?: string,
 *     source?: string,
 *     score?: number
 *   }
 *
 * Flow:
 *   1. Validate secret
 *   2. Create lead in Notion
 *   3. Send Telegram alert to operator
 *   4. Return 200 with created lead ID
 */
router.post('/new-lead', async (req, res) => {
  // --- Secret validation ---
  const incomingSecret = req.headers['x-webhook-secret'];

  if (!WEBHOOK_SECRET) {
    console.error('[webhook/makecom] WEBHOOK_SECRET is not configured — refusing all requests');
    return res.status(500).json({ error: 'Webhook secret not configured on server' });
  }

  if (!incomingSecret || incomingSecret !== WEBHOOK_SECRET) {
    console.warn('[webhook/makecom] Unauthorized request — invalid or missing x-webhook-secret');
    return res.status(401).json({ error: 'Unauthorized: invalid webhook secret' });
  }

  // --- Body validation ---
  const { name, email, subject, body_preview, source, score } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Bad Request: name and email are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Bad Request: invalid email format' });
  }

  if (!OPERATOR_CHAT_ID) {
    console.error('[webhook/makecom] OPERATOR_CHAT_ID is not configured');
    return res.status(500).json({ error: 'Operator chat ID not configured on server' });
  }

  // --- Create lead in Notion ---
  let notionPage;
  try {
    const notes = [subject, body_preview].filter(Boolean).join('\n\n').slice(0, 2000);

    notionPage = await createLead({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      source: source || 'Email',
      score: typeof score === 'number' ? score : null,
      notes,
    });
  } catch (err) {
    console.error('[webhook/makecom] Failed to create Notion lead:', err.message);
    return res.status(502).json({ error: 'Failed to create lead in Notion', detail: err.message });
  }

  // --- Send Telegram alert ---
  const lead = extractLeadData(notionPage);
  // Attach body_preview as notes for display if not already in notes
  if (body_preview && !lead.notes) {
    lead.notes = body_preview;
  }

  try {
    await sendLeadAlert(OPERATOR_CHAT_ID, lead, notionPage.id);
  } catch (err) {
    // Don't fail the request — lead was created; Telegram alert is best-effort
    console.error('[webhook/makecom] Failed to send Telegram alert:', err.message);
    return res.status(207).json({
      status: 'partial',
      message: 'Lead created in Notion but Telegram alert failed',
      notion_page_id: notionPage.id,
      error: err.message,
    });
  }

  console.log(`[webhook/makecom] New lead processed: ${lead.name} (${lead.email}) → Notion page ${notionPage.id}`);

  return res.status(200).json({
    status: 'ok',
    message: 'Lead created and alert sent',
    notion_page_id: notionPage.id,
    lead: {
      name: lead.name,
      email: lead.email,
      status: lead.status,
      source: lead.source,
      score: lead.score,
    },
  });
});

module.exports = router;
