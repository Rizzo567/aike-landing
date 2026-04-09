'use strict';

const express = require('express');
const { createLead, extractLeadData } = require('../notion/leads');
const { createRevenueEntry, extractRevenueData } = require('../notion/revenue');
const { getClientByEmail, extractClientData, calculateHealthScore, updateHealthScore } = require('../notion/clients');
const { sendLeadAlert, sendRevenueAlert } = require('../telegram/alerts');

const router = express.Router();
const OPERATOR_CHAT_ID = process.env.OPERATOR_CHAT_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// POST /webhook/new-lead
router.post('/new-lead', async (req, res) => {
  const incomingSecret = req.headers['x-webhook-secret'];
  if (!WEBHOOK_SECRET) { console.error('[webhook/makecom] WEBHOOK_SECRET is not configured'); return res.status(500).json({ error: 'Webhook secret not configured on server' }); }
  if (!incomingSecret || incomingSecret !== WEBHOOK_SECRET) { console.warn('[webhook/makecom] Unauthorized request'); return res.status(401).json({ error: 'Unauthorized: invalid webhook secret' }); }
  const { name, email, subject, body_preview, source, score } = req.body;
  if (!name || !email) { return res.status(400).json({ error: 'Bad Request: name and email are required' }); }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) { return res.status(400).json({ error: 'Bad Request: invalid email format' }); }
  if (!OPERATOR_CHAT_ID) { console.error('[webhook/makecom] OPERATOR_CHAT_ID is not configured'); return res.status(500).json({ error: 'Operator chat ID not configured on server' }); }
  let notionPage;
  try {
    const notes = [subject, body_preview].filter(Boolean).join("\n\n").slice(0, 2000);
    notionPage = await createLead({ name: name.trim(), email: email.trim().toLowerCase(), source: source || "Email", score: typeof score === "number" ? score : null, notes });
  } catch (err) { console.error('[webhook/makecom] Failed to create Notion lead:', err.message); return res.status(502).json({ error: 'Failed to create lead in Notion', detail: err.message }); }
  const lead = extractLeadData(notionPage);
  if (body_preview && !lead.notes) { lead.notes = body_preview; }
  try { await sendLeadAlert(OPERATOR_CHAT_ID, lead, notionPage.id); }
  catch (err) { console.error('[webhook/makecom] Failed to send Telegram alert:', err.message); return res.status(207).json({ status: 'partial', message: 'Lead created in Notion but Telegram alert failed', notion_page_id: notionPage.id, error: err.message }); }
  console.log(`[webhook/makecom] New lead processed: ${lead.name} (${lead.email}) → Notion page ${notionPage.id}`);
  return res.status(200).json({ status: 'ok', message: 'Lead created and alert sent', notion_page_id: notionPage.id, lead: { name: lead.name, email: lead.email, status: lead.status, source: lead.source, score: lead.score } });
});

// POST /webhook/client-event
router.post('/client-event', async (req, res) => {
  const incomingSecret = req.headers['x-webhook-secret'];
  if (!WEBHOOK_SECRET) { return res.status(500).json({ error: 'Webhook secret not configured on server' }); }
  if (!incomingSecret || incomingSecret !== WEBHOOK_SECRET) { return res.status(401).json({ error: 'Unauthorized: invalid webhook secret' }); }
  const { action, clientId, clientEmail } = req.body;
  if (!action) { return res.status(400).json({ error: 'Bad Request: action is required' }); }
  if (action === 'health_score_update') {
    let clientPage = null;
    if (clientId) {
      try { const notion = require('../notion/client'); clientPage = await notion.pages.retrieve({ page_id: clientId }); }
      catch (err) { console.error('[webhook/makecom] /client-event retrieve error:', err.message); return res.status(502).json({ error: 'Failed to retrieve client from Notion', detail: err.message }); }
    } else if (clientEmail) {
      try { clientPage = await getClientByEmail(clientEmail); }
      catch (err) { console.error('[webhook/makecom] /client-event getClientByEmail error:', err.message); return res.status(502).json({ error: 'Failed to search client in Notion', detail: err.message }); }
    } else { return res.status(400).json({ error: 'Bad Request: clientId or clientEmail is required' }); }
    if (!clientPage) { return res.status(404).json({ error: 'Client not found in Notion' }); }
    const client = extractClientData(clientPage);
    const newScore = calculateHealthScore(client);
    try { await updateHealthScore(client.id, newScore); }
    catch (err) { console.error('[webhook/makecom] /client-event updateHealthScore error:', err.message); return res.status(502).json({ error: 'Failed to update health score in Notion', detail: err.message }); }
    console.log(`[webhook/makecom] Health score updated for client ${client.name}: ${newScore}`);
    return res.status(200).json({ status: 'ok', message: 'Health score updated', client_id: client.id, health_score: newScore });
  }
  return res.status(400).json({ error: `Unknown action: "${action}"` });
});

// POST /webhook/revenue-event
router.post('/revenue-event', async (req, res) => {
  const incomingSecret = req.headers['x-webhook-secret'];
  if (!WEBHOOK_SECRET) { return res.status(500).json({ error: 'Webhook secret not configured on server' }); }
  if (!incomingSecret || incomingSecret !== WEBHOOK_SECRET) { return res.status(401).json({ error: 'Unauthorized: invalid webhook secret' }); }
  const { senderName, senderEmail, subject, body_preview, detectedAmount } = req.body;
  if (!senderName) { return res.status(400).json({ error: 'Bad Request: senderName is required' }); }
  if (!OPERATOR_CHAT_ID) { console.error('[webhook/makecom] OPERATOR_CHAT_ID is not configured'); return res.status(500).json({ error: 'Operator chat ID not configured on server' }); }
  const notes = [subject, body_preview].filter(Boolean).join("\n\n").slice(0, 2000);
  let notionPage;
  try {
    notionPage = await createRevenueEntry({ clientName: senderName.trim(), email: senderEmail ? senderEmail.trim().toLowerCase() : undefined, amount: typeof detectedAmount === 'number' && detectedAmount > 0 ? detectedAmount : undefined, notes: notes || undefined });
  } catch (err) { console.error('[webhook/makecom] /revenue-event createRevenueEntry error:', err.message); return res.status(502).json({ error: 'Failed to create revenue entry in Notion', detail: err.message }); }
  const entry = extractRevenueData(notionPage);
  try { await sendRevenueAlert(OPERATOR_CHAT_ID, entry, notionPage.id); }
  catch (err) { console.error('[webhook/makecom] /revenue-event Telegram alert failed:', err.message); return res.status(207).json({ status: 'partial', message: 'Revenue entry created in Notion but Telegram alert failed', notion_page_id: notionPage.id, error: err.message }); }
  console.log(`[webhook/makecom] Revenue event processed: ${entry.clientName} → Notion page ${notionPage.id}`);
  return res.status(200).json({ status: 'ok', message: 'Revenue entry created and alert sent', notion_page_id: notionPage.id, entry: { clientName: entry.clientName, email: entry.email, amount: entry.amount, status: entry.status } });
});

module.exports = router;