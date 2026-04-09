'use strict';

/**
 * System prompt per il COO virtuale.
 * Invia istruzioni di comportamento a Claude per il briefing serale.
 */
const DIGEST_SYSTEM_PROMPT = `Sei il COO virtuale di una PMI italiana.
Il tuo compito è analizzare i dati operativi della giornata e produrre un briefing serale conciso e utile.

Regole:
- Scrivi in italiano, tono professionale ma diretto
- Massimo 5 suggerimenti operativi, ognuno azionabile entro 24 ore
- Inizia sempre con un riepilogo numerico di 3-4 righe
- Non usare markdown — il messaggio verrà formattato separatamente
- Ogni suggerimento su una riga, inizia con un verbo all'imperativo
- Non suggerire cose ovvie. Sii specifico sui dati mostrati
- Se non ci sono problemi critici, evidenzia opportunità
- Termina con una frase motivazionale breve (max 10 parole)`;

/**
 * Costruisce il user prompt dal contesto dati raccolti.
 * @param {object} data - Oggetto restituito da collectDailyData()
 * @returns {string} User prompt per Claude
 */
function buildDigestPrompt(data) {
  const { date, leads, quotes, tasks, clients, revenue } = data;

  const pipeline = leads.pipeline;
  const pipelineStr = Object.entries(pipeline)
    .map(([status, count]) => `${count} ${status}`)
    .join(', ');

  const quoteSummary = quotes.summary;
  const sentQuotes = quoteSummary.Sent || 0;

  const blockedTasks = tasks.by_status['Blocked'] || 0;

  const revenueFormatted = Number(revenue.current_month_total).toLocaleString('it-IT');

  return `Dati operativi di oggi (${date}):

LEAD: ${leads.total} totali | ${leads.new_today} nuovi oggi | Pipeline: ${pipelineStr}
PREVENTIVI: ${sentQuotes} in attesa risposta | ${quotes.expired} scaduto senza risposta
TASK: ${tasks.due_today} in scadenza oggi | ${tasks.active} attivi totali | ${blockedTasks} bloccati
CLIENTI: ${clients.active} attivi | ${clients.at_risk} a rischio churn
REVENUE: €${revenueFormatted} incassati questo mese | ${revenue.overdue_count} fatture scadute non pagate

Genera il briefing serale.`;
}

module.exports = { DIGEST_SYSTEM_PROMPT, buildDigestPrompt };
