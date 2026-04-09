'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { DIGEST_SYSTEM_PROMPT, buildDigestPrompt } = require('./prompts');

/**
 * Genera il digest serale con Claude API.
 * Se Claude API fallisce, genera un digest di fallback senza AI.
 * @param {object} data - Oggetto restituito da collectDailyData()
 * @returns {Promise<string>} Testo del digest
 */
async function generateDigest(data) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: DIGEST_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildDigestPrompt(data) }],
    });

    const text = message.content[0]?.text;
    if (!text) {
      throw new Error('Claude returned empty response');
    }

    return text;
  } catch (err) {
    console.error('[digest] Claude API error, falling back to local digest:', err.message);
    return generateFallbackDigest(data);
  }
}

/**
 * Genera un riepilogo testuale senza AI, basato sui dati raccolti.
 * Usato come fallback quando Claude API non è disponibile.
 * @param {object} data - Oggetto restituito da collectDailyData()
 * @returns {string} Testo del digest di fallback
 */
function generateFallbackDigest(data) {
  const { date, leads, quotes, tasks, clients, revenue } = data;
  const revenueFormatted = Number(revenue.current_month_total).toLocaleString('it-IT');

  return `📊 Riepilogo serale — ${date}

Lead: ${leads.total} totali, ${leads.new_today} nuovi oggi
Preventivi: ${quotes.summary.Sent || 0} in attesa, ${quotes.expired} scaduti
Task: ${tasks.due_today} in scadenza, ${tasks.active} attivi
Clienti: ${clients.active} attivi, ${clients.at_risk} a rischio
Revenue: €${revenueFormatted} questo mese, ${revenue.overdue_count} fatture scadute

⚠️ AI digest non disponibile — riepilogo automatico`;
}

module.exports = { generateDigest, generateFallbackDigest };
