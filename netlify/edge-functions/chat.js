/**
 * AIKE — netlify/edge-functions/chat.js
 * Howl AI proxy — routes messages to Anthropic, Google Gemini, or OpenAI.
 *
 * Required Netlify env vars (Netlify UI → Site settings → Environment variables):
 *   ANTHROPIC_API_KEY  — from https://console.anthropic.com
 *   GEMINI_API_KEY     — from https://aistudio.google.com/apikey
 *   OPENAI_API_KEY     — from https://platform.openai.com/api-keys
 *
 * Only the keys for the models you want to enable need to be set.
 * If a key is missing, that model returns a clear error message.
 */

// ── System prompt ─────────────────────────────────────────────────────────────
const HOWL_SYSTEM = `You are Howl — the AI operational director of Aike, a premium business automation platform.

Your role: help entrepreneurs and business operators with business data analysis, automation design, CRM management, revenue tracking, reporting, and operational workflows.

Rules:
- Be concise, direct, and actionable. No filler sentences.
- Structure responses with clear sections when answering complex questions.
- When you lack specific data (integrations not connected), acknowledge it briefly and explain what would unlock the answer.
- Respond in Italian by default. Switch language if the user writes in English or another language.
- You are not a generic assistant. You are a precision operational tool.`;

// ── CORS helpers ──────────────────────────────────────────────────────────────
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(), 'Content-Type': 'application/json' },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { model, messages } = body;

  if (!model || !Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: 'Missing required fields: model, messages' }, 400);
  }

  // Validate message structure
  for (const m of messages) {
    if (!m.role || !m.content || typeof m.content !== 'string') {
      return jsonResponse({ error: 'Each message must have role and content (string)' }, 400);
    }
    if (m.role !== 'user' && m.role !== 'assistant') {
      return jsonResponse({ error: 'Message role must be "user" or "assistant"' }, 400);
    }
  }

  try {
    let content;

    if (model === 'claude-sonnet-4-6') {
      content = await callAnthropic(messages);
    } else if (model === 'gemini-2.0-flash') {
      content = await callGemini(messages);
    } else if (model === 'gpt-4o') {
      content = await callOpenAI(messages);
    } else {
      return jsonResponse({ error: `Unknown model: ${model}` }, 400);
    }

    return jsonResponse({ content });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[Howl/chat]', message);
    return jsonResponse({ error: message }, 500);
  }
}

// ── Anthropic (Claude) ────────────────────────────────────────────────────────
async function callAnthropic(messages) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error(
      'Chiave API Anthropic non configurata. Aggiungi ANTHROPIC_API_KEY nelle variabili d\'ambiente Netlify.'
    );
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: HOWL_SYSTEM,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ── Google Gemini ─────────────────────────────────────────────────────────────
async function callGemini(messages) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error(
      'Chiave API Gemini non configurata. Aggiungi GEMINI_API_KEY nelle variabili d\'ambiente Netlify.'
    );
  }

  // Gemini requires alternating user/model roles — enforce this
  const contents = [];
  for (const m of messages) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    // Merge consecutive same-role messages (Gemini requirement)
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n' + m.content;
    } else {
      contents.push({ role, parts: [{ text: m.content }] });
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      system_instruction: { parts: [{ text: HOWL_SYSTEM }] },
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini returned no candidates. The message may have been blocked by safety filters.');
  }

  return data.candidates[0].content.parts[0].text;
}

// ── OpenAI (GPT) ──────────────────────────────────────────────────────────────
async function callOpenAI(messages) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error(
      'Chiave API OpenAI non configurata. Aggiungi OPENAI_API_KEY nelle variabili d\'ambiente Netlify.'
    );
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: HOWL_SYSTEM },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
