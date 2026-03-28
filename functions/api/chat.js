/**
 * AIKE — functions/api/chat.js
 * Cloudflare Pages Function — Howl AI proxy.
 * Routes messages to Anthropic, Google Gemini, or OpenAI.
 *
 * Required env vars (Cloudflare Pages → Settings → Environment variables):
 *   ANTHROPIC_API_KEY  — https://console.anthropic.com
 *   GEMINI_API_KEY     — https://aistudio.google.com/apikey
 *   OPENAI_API_KEY     — https://platform.openai.com/api-keys
 *
 * Streaming modes:
 *   body.stream = true  (or absent) → SSE response with delta chunks
 *   body.stream = false             → JSON { content: "..." }
 */

// ── System prompt ──────────────────────────────────────────────────────────────
const HOWL_SYSTEM = `You are Howl — the AI assistant built into Aike, a premium automation and intelligence platform.

You are not restricted to any single domain. You can help with anything: code, learning, science, philosophy, creativity, daily life, business, strategy, math, writing, research, and more.

Personality:
- Direct, intelligent, confident. No filler. Every sentence carries weight.
- You think before you answer. You don't pad responses to seem thorough.
- You are honest about uncertainty — but you don't hide behind it.
- You have opinions and share them when relevant.

Rules:
- Respond in Italian by default. Switch language naturally if the user writes in another language.
- Structure responses clearly when the topic is complex. Keep it tight when it's simple.
- Never start with "Certo!", "Certamente!", "Assolutamente!" or any hollow affirmation.
- You are Howl. You are part of Aike. That's your identity — don't disclaim it.`;

// ── CORS helpers ───────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

function sseResponse(stream) {
  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ── Cloudflare Pages entry point ───────────────────────────────────────────────
export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
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

  const { model, messages, businessContext, skillContext } = body;
  const useStream = body.stream !== false;

  if (!model || !Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: 'Missing required fields: model, messages' }, 400);
  }

  for (const m of messages) {
    if (!m.role || !m.content || (typeof m.content !== 'string' && !Array.isArray(m.content))) {
      return jsonResponse({ error: 'Each message must have role and content (string or array)' }, 400);
    }
    if (m.role !== 'user' && m.role !== 'assistant') {
      return jsonResponse({ error: 'Message role must be "user" or "assistant"' }, 400);
    }
  }

  // Build dynamic system prompt
  let systemPrompt = HOWL_SYSTEM;
  if (businessContext && typeof businessContext === 'object') {
    const lines = [];
    if (businessContext.company)   lines.push('Azienda: ' + businessContext.company);
    if (businessContext.industry)  lines.push('Settore: ' + businessContext.industry);
    if (businessContext.offering)  lines.push('Offerta: ' + businessContext.offering);
    if (businessContext.teamSize)  lines.push('Team: ' + businessContext.teamSize);
    if (businessContext.challenge) lines.push('Sfida principale: ' + businessContext.challenge);
    if (businessContext.tone)      lines.push('Tono preferito: ' + businessContext.tone);
    if (businessContext.language && businessContext.language !== 'auto') {
      lines.push('Rispondi sempre in: ' + businessContext.language);
    }
    if (lines.length > 0) systemPrompt += '\n\nCONTESTO AZIENDALE:\n' + lines.join('\n');
  }
  if (skillContext && typeof skillContext === 'string' && skillContext.length < 2000) {
    systemPrompt += '\n\nCONTESTO AGGIUNTIVO:\n' + skillContext;
  }

  const ANTHROPIC_MODELS = ['claude-sonnet-4-6'];
  const GEMINI_MODELS    = ['gemini-2.5-flash', 'gemini-2.5-pro'];
  const OPENAI_MODELS    = ['gpt-4o', 'gpt-4.1'];

  // ── Credit check (server-side) ──────────────────────────────────
  const CREDIT_COST = { 'claude-sonnet-4-6': 3, 'gemini-2.5-pro': 3, 'gpt-4.1': 3, 'gemini-2.5-flash': 2, 'gpt-4o': 2 };
  const cost = CREDIT_COST[model] || 1;

  // Only check if Supabase is configured and user has a JWT
  const authHeader = request.headers.get('Authorization') || '';
  const userJwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const supabaseUrl2 = env.SUPABASE_URL;
  const serviceKey2  = env.SUPABASE_SERVICE_ROLE_KEY;

  if (userJwt && supabaseUrl2 && serviceKey2) {
    try {
      // Verify JWT to get user_id
      const verifyR = await fetch(`${supabaseUrl2}/auth/v1/user`, {
        headers: { 'apikey': serviceKey2, 'Authorization': `Bearer ${userJwt}` },
      });
      if (verifyR.ok) {
        const userData = await verifyR.json();
        const userId = userData.id;
        if (userId) {
          // Read credits
          const credR = await fetch(`${supabaseUrl2}/rest/v1/user_credits?user_id=eq.${userId}&select=plan,total,used`, {
            headers: { 'apikey': serviceKey2, 'Authorization': `Bearer ${serviceKey2}` },
          });
          if (credR.ok) {
            const rows = await credR.json();
            const PLAN_LIMITS2 = { free: 30, basic: 300, pro: 1000 };
            if (rows.length > 0) {
              const row = rows[0];
              const limit = PLAN_LIMITS2[row.plan] || row.total;
              if (row.used + cost > limit) {
                return jsonResponse({ error: 'Crediti esauriti. Aggiorna il piano per continuare.', code: 'CREDITS_EXHAUSTED' }, 402);
              }
              // Deduct
              await fetch(`${supabaseUrl2}/rest/v1/user_credits?user_id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                  'apikey': serviceKey2, 'Authorization': `Bearer ${serviceKey2}`,
                  'Content-Type': 'application/json', 'Prefer': 'return=minimal',
                },
                body: JSON.stringify({ used: row.used + cost, updated_at: new Date().toISOString() }),
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('[credits check]', e.message);
      // Don't block on credit check errors — fail open
    }
  }

  // ── Non-streaming path ─────────────────────────────────────────────────────
  if (!useStream) {
    try {
      let content;
      if (ANTHROPIC_MODELS.includes(model)) {
        content = await callAnthropic(messages, systemPrompt, model, env);
      } else if (GEMINI_MODELS.includes(model)) {
        content = await callGemini(messages, systemPrompt, model, env);
      } else if (OPENAI_MODELS.includes(model)) {
        content = await callOpenAI(messages, systemPrompt, model, env);
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

  // ── Streaming path ─────────────────────────────────────────────────────────
  if (!ANTHROPIC_MODELS.includes(model) && !GEMINI_MODELS.includes(model) && !OPENAI_MODELS.includes(model)) {
    return jsonResponse({ error: `Unknown model: ${model}` }, 400);
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const emit = async (data) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const emitDone = async () => {
    await writer.write(encoder.encode('data: [DONE]\n\n'));
    await writer.close();
  };

  (async () => {
    try {
      if (ANTHROPIC_MODELS.includes(model)) {
        await streamAnthropic(messages, systemPrompt, emit, model, env);
      } else if (GEMINI_MODELS.includes(model)) {
        await streamGemini(messages, systemPrompt, emit, model, env);
      } else if (OPENAI_MODELS.includes(model)) {
        await streamOpenAI(messages, systemPrompt, emit, model, env);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Streaming error';
      console.error('[Howl/chat/stream]', message);
      try { await emit({ error: message }); } catch { /* writer closed */ }
    } finally {
      try { await emitDone(); } catch { /* writer closed */ }
    }
  })();

  return sseResponse(readable);
}

// ── Anthropic (Claude) — non-streaming ────────────────────────────────────────
async function callAnthropic(messages, systemPrompt, model = 'claude-sonnet-4-6', env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Chiave API Anthropic non configurata. Aggiungi ANTHROPIC_API_KEY nelle variabili d\'ambiente Cloudflare.');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 1500, system: systemPrompt, messages }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ── Anthropic (Claude) — streaming ────────────────────────────────────────────
async function streamAnthropic(messages, systemPrompt, emit, model = 'claude-sonnet-4-6', env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Chiave API Anthropic non configurata. Aggiungi ANTHROPIC_API_KEY nelle variabili d\'ambiente Cloudflare.');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 1500, system: systemPrompt, messages, stream: true }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text.slice(0, 300)}`);
  }

  await parseSSEStream(response.body, (event) => {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      return emit({ delta: event.delta.text });
    }
  });
}

// ── Google Gemini — non-streaming ─────────────────────────────────────────────
async function callGemini(messages, systemPrompt, model = 'gemini-2.5-flash', env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Chiave API Gemini non configurata. Aggiungi GEMINI_API_KEY nelle variabili d\'ambiente Cloudflare.');

  const contents = buildGeminiContents(messages);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
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

// ── Google Gemini — streaming ─────────────────────────────────────────────────
async function streamGemini(messages, systemPrompt, emit, model = 'gemini-2.5-flash', env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Chiave API Gemini non configurata. Aggiungi GEMINI_API_KEY nelle variabili d\'ambiente Cloudflare.');

  const contents = buildGeminiContents(messages);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { maxOutputTokens: 1500, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${text.slice(0, 300)}`);
  }

  await parseSSEStream(response.body, (event) => {
    const text = event?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return emit({ delta: text });
  });
}

// ── OpenAI (GPT) — non-streaming ──────────────────────────────────────────────
async function callOpenAI(messages, systemPrompt, model = 'gpt-4o', env) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Chiave API OpenAI non configurata. Aggiungi OPENAI_API_KEY nelle variabili d\'ambiente Cloudflare.');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, max_tokens: 1500,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ── OpenAI (GPT) — streaming ──────────────────────────────────────────────────
async function streamOpenAI(messages, systemPrompt, emit, model = 'gpt-4o', env) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Chiave API OpenAI non configurata. Aggiungi OPENAI_API_KEY nelle variabili d\'ambiente Cloudflare.');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, max_tokens: 1500, stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text.slice(0, 300)}`);
  }

  await parseSSEStream(response.body, (event) => {
    if (event === '[DONE]') return;
    const delta = event?.choices?.[0]?.delta?.content;
    if (delta) return emit({ delta });
  });
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
function buildGeminiContents(messages) {
  const contents = [];
  for (const m of messages) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    let parts;
    if (Array.isArray(m.content)) {
      // Multimodal content — convert image_url parts to Gemini inline_data format
      parts = m.content.map(function(part) {
        if (part.type === 'image_url' && part.image_url?.url) {
          const dataUrl = part.image_url.url;
          const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            return { inline_data: { mime_type: match[1], data: match[2] } };
          }
          return { text: '[image]' };
        }
        return { text: part.text || '' };
      });
    } else {
      parts = [{ text: m.content }];
    }
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts.push(...parts);
    } else {
      contents.push({ role, parts });
    }
  }
  return contents;
}

async function parseSSEStream(readableStream, onEvent) {
  const decoder = new TextDecoder();
  const reader = readableStream.getReader();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]' || !payload) continue;

        let parsed;
        try { parsed = JSON.parse(payload); } catch { continue; }

        const result = onEvent(parsed);
        if (result && typeof result.then === 'function') await result;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
