// ============================================================
// Aike Desktop App — proxy chat agent (Anthropic Messages API)
// POST /api/chat-agent
//   { model?, system?, messages: [...], tools?: [...] }
//
// - Auth JWT Supabase obbligatoria (pattern di groq-chat.js)
// - Limiti Free per CONTEGGIO eventi: 25 / finestra rolling 5h,
//   75 / 24h su usage_events (insert prima dello stream).
//   I crediti pesati (haiku=1, sonnet=3, opus=8) sono registrati
//   nel campo `credits` ma NON usati per i limiti (coerenza con Free).
// - Risposta: SSE con protocollo SEMPLIFICATO (vedi sotto), ottenuto
//   trasformando lo stream nativo Anthropic.
// - ENV richieste: SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
//
// Protocollo SSE emesso (ogni evento: `data: {json}\n\n`):
//   { "type":"text", "delta":"..." }
//   { "type":"tool_use", "id":"...", "name":"...", "input":{...} }
//   { "type":"done", "stop_reason":"end_turn"|"tool_use"|... }
//   { "type":"error", "message":"..." }
//   poi `data: [DONE]`
// ============================================================

const WINDOW_LIMIT = 25;     // eventi per 5 ore
const WINDOW_MINUTES = 300;
const DAILY_LIMIT = 75;      // eventi per 24 ore
const MAX_MESSAGES = 30;
const MAX_TOKENS = 4096;

// Mappa alias modello → ID Anthropic + crediti pesati
const MODELS = {
  haiku:  { id: 'claude-haiku-4-5',  credits: 1 },
  sonnet: { id: 'claude-sonnet-4-6', credits: 3 },
  opus:   { id: 'claude-opus-4-8',   credits: 8 },
};
const DEFAULT_MODEL = 'sonnet';

const SYSTEM_PROMPT = `You are Aike, the AI agent of Aike (aikeautomation.com), a premium business automation platform.
You help business owners run and grow their companies: strategy, marketing, operations, copywriting, analysis.
Identity rule: you are Aike. If asked what model you are, say you are Aike. Never mention other product names.
Style: sharp, direct, genuinely useful. Reply in the user's language (default Italian). Use markdown when it helps.`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Expose-Headers':
    'X-Usage-Used, X-Usage-Limit, X-Usage-Reset-Minutes',
};

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extra },
  });
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  // --- 1. Auth JWT (obbligatoria) ---
  const jwt = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!jwt) return json({ error: 'UNAUTHORIZED' }, 401);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${jwt}`, apikey: env.SUPABASE_SERVICE_KEY },
  });
  if (!userRes.ok) return json({ error: 'UNAUTHORIZED' }, 401);
  const user = await userRes.json();
  if (!user?.id) return json({ error: 'UNAUTHORIZED' }, 401);

  // --- 2. Validazione input ---
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'INVALID_JSON' }, 400);
  }

  const modelAlias = typeof body?.model === 'string' ? body.model : DEFAULT_MODEL;
  const modelCfg = MODELS[modelAlias] || MODELS[DEFAULT_MODEL];

  const rawMessages = Array.isArray(body?.messages) ? body.messages : null;
  if (!rawMessages || rawMessages.length === 0) {
    return json({ error: 'MISSING_MESSAGES' }, 400);
  }
  // content può essere stringa o array di content blocks Anthropic.
  const clean = rawMessages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        (typeof m.content === 'string' || Array.isArray(m.content)) &&
        (typeof m.content === 'string'
          ? m.content.length > 0
          : m.content.length > 0),
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content }));

  if (clean.length === 0 || clean[clean.length - 1].role !== 'user') {
    return json({ error: 'INVALID_MESSAGES' }, 400);
  }

  // System: base "sei Aike…" + eventuale extra dal body (knowledge/memory).
  const extraSystem =
    typeof body?.system === 'string' && body.system.trim().length > 0
      ? body.system.trim()
      : null;
  const systemPrompt = extraSystem
    ? `${SYSTEM_PROMPT}\n\n${extraSystem}`
    : SYSTEM_PROMPT;

  // Tools (opzionale): passa così com'è nel formato Anthropic.
  const tools = Array.isArray(body?.tools) && body.tools.length > 0
    ? body.tools
    : null;

  // --- 3. Limiti Free su usage_events (per CONTEGGIO) ---
  const rest = `${env.SUPABASE_URL}/rest/v1/usage_events`;
  const svcHeaders = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
  };

  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const dayStart = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  const [windowCount, dayCount, oldestInWindow] = await Promise.all([
    countEvents(rest, svcHeaders, user.id, windowStart),
    countEvents(rest, svcHeaders, user.id, dayStart),
    oldestEvent(rest, svcHeaders, user.id, windowStart),
  ]);

  const resetMinutes = oldestInWindow
    ? Math.max(
        1,
        WINDOW_MINUTES -
          Math.floor((Date.now() - new Date(oldestInWindow).getTime()) / 60_000),
      )
    : 0;

  const usageHeaders = {
    'X-Usage-Used': String(Math.min(windowCount, WINDOW_LIMIT)),
    'X-Usage-Limit': String(WINDOW_LIMIT),
    'X-Usage-Reset-Minutes': String(resetMinutes),
  };

  if (windowCount >= WINDOW_LIMIT) {
    return json({ error: 'LIMIT_REACHED', scope: 'window' }, 429, usageHeaders);
  }
  if (dayCount >= DAILY_LIMIT) {
    return json({ error: 'LIMIT_REACHED', scope: 'daily' }, 429, usageHeaders);
  }

  // --- 4. Registra l'evento di utilizzo PRIMA dello stream ---
  const insertRes = await fetch(rest, {
    method: 'POST',
    headers: {
      ...svcHeaders,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: user.id,
      model: modelCfg.id,
      credits: modelCfg.credits,
      kind: 'chat',
    }),
  });
  if (!insertRes.ok) {
    return json({ error: 'USAGE_TRACKING_FAILED' }, 500, usageHeaders);
  }

  // --- 5. Chiamata Anthropic (streaming) ---
  const anthropicBody = {
    model: modelCfg.id,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: clean,
    stream: true,
  };
  if (tools) anthropicBody.tools = tools;

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(anthropicBody),
    });
  } catch (e) {
    return json(
      { error: 'UPSTREAM_ERROR', detail: String(e).slice(0, 300) },
      502,
      usageHeaders,
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return json(
      { error: 'UPSTREAM_ERROR', status: upstream.status, detail: detail.slice(0, 300) },
      502,
      usageHeaders,
    );
  }

  // --- 6. Trasforma lo stream Anthropic → protocollo semplificato ---
  const stream = transformAnthropicStream(upstream.body);

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...CORS_HEADERS,
      ...{ ...usageHeaders, 'X-Usage-Used': String(windowCount + 1) },
    },
  });
}

// ------------------------------------------------------------
// Stream transformer: Anthropic SSE → protocollo semplificato.
//
// Eventi Anthropic rilevanti:
//   content_block_start  (può iniziare un blocco tool_use → cattura id+name)
//   content_block_delta  (text_delta → testo; input_json_delta → accumula JSON tool)
//   content_block_stop   (chiude il blocco; se tool_use → emetti evento completo)
//   message_delta        (porta stop_reason in delta.stop_reason)
//   message_stop         (fine)
//   error                (errore upstream durante lo stream)
// ------------------------------------------------------------
function transformAnthropicStream(upstreamBody) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // Stato per indice di content block (Anthropic invia "index").
  const blocks = new Map(); // index → { type, id, name, jsonBuf }
  let stopReason = null;
  let buffer = '';

  function emit(controller, obj) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
  }

  function handleEvent(controller, eventName, dataStr) {
    if (!dataStr) return;
    let data;
    try {
      data = JSON.parse(dataStr);
    } catch {
      return;
    }
    const type = data.type || eventName;

    switch (type) {
      case 'content_block_start': {
        const idx = data.index;
        const blk = data.content_block || {};
        if (blk.type === 'tool_use') {
          blocks.set(idx, {
            type: 'tool_use',
            id: blk.id,
            name: blk.name,
            jsonBuf: '',
          });
        } else {
          blocks.set(idx, { type: blk.type || 'text' });
        }
        break;
      }
      case 'content_block_delta': {
        const idx = data.index;
        const delta = data.delta || {};
        if (delta.type === 'text_delta' && typeof delta.text === 'string') {
          emit(controller, { type: 'text', delta: delta.text });
        } else if (delta.type === 'input_json_delta') {
          const blk = blocks.get(idx);
          if (blk && blk.type === 'tool_use') {
            blk.jsonBuf += delta.partial_json || '';
          }
        }
        break;
      }
      case 'content_block_stop': {
        const idx = data.index;
        const blk = blocks.get(idx);
        if (blk && blk.type === 'tool_use') {
          let input = {};
          if (blk.jsonBuf.trim().length > 0) {
            try {
              input = JSON.parse(blk.jsonBuf);
            } catch {
              input = {};
            }
          }
          emit(controller, {
            type: 'tool_use',
            id: blk.id,
            name: blk.name,
            input,
          });
        }
        blocks.delete(idx);
        break;
      }
      case 'message_delta': {
        if (data.delta && data.delta.stop_reason) {
          stopReason = data.delta.stop_reason;
        }
        break;
      }
      case 'message_stop': {
        emit(controller, { type: 'done', stop_reason: stopReason || 'end_turn' });
        break;
      }
      case 'error': {
        const msg =
          (data.error && data.error.message) || 'upstream stream error';
        emit(controller, { type: 'error', message: msg });
        break;
      }
      default:
        // message_start, ping, ecc. → ignorati
        break;
    }
  }

  const reader = upstreamBody.getReader();

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          // Flush eventuale buffer residuo (raro), poi chiudi.
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });

        // SSE: eventi separati da doppio newline.
        let sep;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);

          let eventName = null;
          let dataStr = '';
          for (const line of rawEvent.split('\n')) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr += line.slice(5).trim();
            }
          }
          handleEvent(controller, eventName, dataStr);
        }
      } catch (e) {
        emit(controller, { type: 'error', message: String(e).slice(0, 300) });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

async function countEvents(rest, headers, userId, sinceIso) {
  const url =
    `${rest}?user_id=eq.${userId}` +
    `&kind=eq.chat&created_at=gte.${encodeURIComponent(sinceIso)}&select=id`;
  const res = await fetch(url, {
    method: 'HEAD',
    headers: { ...headers, Prefer: 'count=exact' },
  });
  const range = res.headers.get('content-range'); // es. "0-9/10"
  const total = range?.split('/')[1];
  return total && total !== '*' ? Number(total) : 0;
}

async function oldestEvent(rest, headers, userId, sinceIso) {
  const url =
    `${rest}?user_id=eq.${userId}` +
    `&kind=eq.chat&created_at=gte.${encodeURIComponent(sinceIso)}` +
    `&select=created_at&order=created_at.asc&limit=1`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return rows?.[0]?.created_at ?? null;
}
