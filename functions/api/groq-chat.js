// ============================================================
// Aike Desktop App — proxy chat Groq (piano Free)
// POST /api/groq-chat  { messages: [{role, content}, ...] }
//
// - Auth JWT Supabase obbligatoria (pattern di chat.js)
// - Limiti Free: 25 msg / finestra rolling 5h, 75 msg / 24h
//   conteggiati su usage_events (insert prima dello stream)
// - Risposta: SSE pass-through da Groq (formato OpenAI)
// - ENV richieste: SUPABASE_URL, SUPABASE_SERVICE_KEY, GROQ_API_KEY
// ============================================================

const WINDOW_LIMIT = 25;     // messaggi per 5 ore
const WINDOW_MINUTES = 300;
const DAILY_LIMIT = 75;      // messaggi per 24 ore
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant';
const MAX_MESSAGES = 30;
const MAX_CHARS_PER_MESSAGE = 8000;

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
  const messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    return json({ error: 'MISSING_MESSAGES' }, 400);
  }
  const clean = messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length > 0,
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_CHARS_PER_MESSAGE),
    }));
  if (clean.length === 0 || clean[clean.length - 1].role !== 'user') {
    return json({ error: 'INVALID_MESSAGES' }, 400);
  }

  // --- 3. Limiti Free su usage_events ---
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
      model: 'groq',
      credits: 0,
      kind: 'chat',
    }),
  });
  if (!insertRes.ok) {
    return json({ error: 'USAGE_TRACKING_FAILED' }, 500, usageHeaders);
  }

  // --- 5. Chiamata Groq (streaming SSE pass-through) ---
  const groqBody = (model) => ({
    model,
    stream: true,
    max_tokens: 2048,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...clean],
  });

  let groqRes = await callGroq(env.GROQ_API_KEY, groqBody(GROQ_MODEL));
  if (!groqRes.ok && (groqRes.status === 429 || groqRes.status >= 500)) {
    groqRes = await callGroq(env.GROQ_API_KEY, groqBody(GROQ_FALLBACK_MODEL));
  }
  if (!groqRes.ok || !groqRes.body) {
    const detail = await groqRes.text().catch(() => '');
    return json(
      { error: 'UPSTREAM_ERROR', status: groqRes.status, detail: detail.slice(0, 300) },
      502,
      usageHeaders,
    );
  }

  return new Response(groqRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...CORS_HEADERS,
      ...{ ...usageHeaders, 'X-Usage-Used': String(windowCount + 1) },
    },
  });
}

async function callGroq(apiKey, body) {
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
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
