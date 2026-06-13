// ============================================================
// Aike — chat Free (Groq / Llama)  ·  POST /api/groq-chat
//   Body: { messages: [{ role, content }] }
//
// È l'endpoint della chat del piano FREE: usa i modelli gratuiti di
// Groq (Llama), nessun costo API per noi, nessun credito speso.
// I piani a pagamento usano invece /api/chat-agent (Claude).
//
// - Auth JWT Supabase obbligatoria (stesso pattern di chat-agent.js).
// - Limiti Free per CONTEGGIO eventi su usage_events:
//     25 / finestra rolling 5h, 75 / 24h.
// - Groq espone un'API OpenAI-compatibile in streaming: la sua risposta
//   SSE è già nel formato { choices:[{ delta:{ content } }] } che il client
//   (src/lib/chatApi.ts → parseSse) si aspetta. Quindi facciamo passthrough
//   dello stream, aggiungendo solo gli header di usage.
//
// ENV richieste: GROQ_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ENV opzionale: GROQ_MODEL (default: llama-3.3-70b-versatile)
// ============================================================

const WINDOW_LIMIT = 25;     // eventi per 5 ore
const WINDOW_MINUTES = 300;
const DAILY_LIMIT = 75;      // eventi per 24 ore
const MAX_MESSAGES = 30;
const MAX_INPUT_TOKENS = 8000;
const CHARS_PER_TOKEN = 4;

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

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

function countContentChars(content) {
  if (typeof content === 'string') return content.length;
  if (Array.isArray(content)) {
    return content.reduce((sum, b) => {
      if (typeof b === 'string') return sum + b.length;
      if (b && typeof b.text === 'string') return sum + b.text.length;
      if (b && typeof b.content === 'string') return sum + b.content.length;
      return sum;
    }, 0);
  }
  return 0;
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
  }

  // --- 1. Auth JWT ---
  const jwt = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!jwt) return json({ error: 'UNAUTHORIZED' }, 401);

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${jwt}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) return json({ error: 'UNAUTHORIZED' }, 401);
  const user = await userRes.json();
  if (!user?.id) return json({ error: 'UNAUTHORIZED' }, 401);

  // --- 2. Input ---
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'INVALID_JSON' }, 400);
  }

  const rawMessages = Array.isArray(body?.messages) ? body.messages : null;
  if (!rawMessages || rawMessages.length === 0) {
    return json({ error: 'MISSING_MESSAGES' }, 400);
  }
  const clean = rawMessages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length > 0,
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content }));

  if (clean.length === 0 || clean[clean.length - 1].role !== 'user') {
    return json({ error: 'INVALID_MESSAGES' }, 400);
  }

  // Cap input (guardrail coerente con chat-agent.js)
  const inputChars =
    SYSTEM_PROMPT.length +
    clean.reduce((sum, m) => sum + countContentChars(m.content), 0);
  if (Math.ceil(inputChars / CHARS_PER_TOKEN) > MAX_INPUT_TOKENS) {
    return json({ error: 'INPUT_TOO_LARGE', max_tokens: MAX_INPUT_TOKENS }, 413);
  }

  // --- 3. Limiti Free su usage_events ---
  const rest = `${env.SUPABASE_URL}/rest/v1/usage_events`;
  const svcHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
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

  // --- 4. Registra l'evento PRIMA dello stream ---
  const insertRes = await fetch(rest, {
    method: 'POST',
    headers: { ...svcHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ user_id: user.id, model: 'groq', credits: 0, kind: 'chat' }),
  });
  if (!insertRes.ok) {
    return json({ error: 'USAGE_TRACKING_FAILED' }, 500, usageHeaders);
  }

  // --- 5. Chiamata Groq (streaming, formato OpenAI) ---
  const model = env.GROQ_MODEL || DEFAULT_MODEL;
  let upstream;
  try {
    upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...clean],
      }),
    });
  } catch (e) {
    return json({ error: 'UPSTREAM_ERROR', detail: String(e).slice(0, 300) }, 502, usageHeaders);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return json(
      { error: 'UPSTREAM_ERROR', status: upstream.status, detail: detail.slice(0, 300) },
      502,
      usageHeaders,
    );
  }

  // Groq emette già SSE in formato OpenAI ({choices:[{delta:{content}}]} + [DONE]):
  // passthrough diretto, è esattamente ciò che il client si aspetta.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...CORS_HEADERS,
      ...usageHeaders,
      'X-Usage-Used': String(windowCount + 1),
    },
  });
}

async function countEvents(rest, headers, userId, sinceIso) {
  const url =
    `${rest}?user_id=eq.${userId}` +
    `&kind=eq.chat&created_at=gte.${encodeURIComponent(sinceIso)}&select=id`;
  const res = await fetch(url, { method: 'HEAD', headers: { ...headers, Prefer: 'count=exact' } });
  const range = res.headers.get('content-range');
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
