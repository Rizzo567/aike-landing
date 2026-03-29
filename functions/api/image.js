/**
 * AIKE — functions/api/image.js
 * POST /api/image
 * Generates images via DALL·E 3 (OpenAI) or Nano Banana models.
 *
 * Required env vars:
 *   OPENAI_API_KEY             — for dall-e-3
 *   NANO_BANANA_API_KEY        — for nano-banana-2 / nano-banana-pro (set when available)
 *   NANO_BANANA_API_URL        — base URL for Nano Banana API
 *   SUPABASE_URL               — for JWT verification and credit checks
 *   SUPABASE_SERVICE_ROLE_KEY  — service role key for server-side Supabase access
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const IMAGE_CREDIT_COST = {
  'dall-e-3':       3,
  'nano-banana-pro': 3,
  'nano-banana-2':   2,
};

const PLAN_LIMITS = { free: 30, basic: 300, pro: 1000 };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

/**
 * Verify JWT and deduct credits atomically (optimistic locking).
 * Returns { userId } on success, or throws with a descriptive message.
 */
async function verifyAndDeductCredits(jwt, cost, supabaseUrl, serviceKey) {
  // 1. Verify JWT → get user_id
  const verifyR = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${jwt}` },
  });
  if (!verifyR.ok) throw { status: 401, message: 'Token non valido o scaduto.' };

  const userData = await verifyR.json();
  const userId = userData.id;
  if (!userId) throw { status: 401, message: 'Utente non trovato.' };

  // 2. Ensure credits row exists
  await fetch(`${supabaseUrl}/rest/v1/user_credits`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({ user_id: userId, plan: 'free', total: 30, used: 0, reset_at: new Date(Date.now() + 30*24*60*60*1000).toISOString() }),
  });

  // 3. Auto-reset if monthly period has passed
  await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${userId}&reset_at=lt.${new Date().toISOString()}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ used: 0, reset_at: new Date(Date.now() + 30*24*60*60*1000).toISOString() }),
  });

  // 4. Read current credits
  const credR = await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${userId}&select=plan,total,used`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
  });
  if (!credR.ok) throw { status: 500, message: 'Errore lettura crediti.' };

  const rows = await credR.json();
  if (!rows.length) throw { status: 404, message: 'Record crediti non trovato.' };

  const row = rows[0];
  const limit = PLAN_LIMITS[row.plan] || row.total;

  if (row.used + cost > limit) {
    throw { status: 402, message: 'Crediti esauriti. Aggiorna il piano per continuare.', code: 'CREDITS_EXHAUSTED' };
  }

  // 5. Deduct with optimistic locking — filter on current used value to prevent race conditions
  const patchR = await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${userId}&used=eq.${row.used}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', 'Prefer': 'return=representation',
    },
    body: JSON.stringify({ used: row.used + cost, updated_at: new Date().toISOString() }),
  });

  const updated = await patchR.json();
  if (!Array.isArray(updated) || updated.length === 0) {
    // Another concurrent request already modified the row — reject this one
    throw { status: 409, message: 'Richiesta concorrente rilevata. Riprova.' };
  }

  return { userId };
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // ── Auth: require valid JWT ────────────────────────────────────────
  const authHeader = request.headers.get('Authorization') || '';
  const userJwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!userJwt) return json({ error: 'Autenticazione richiesta.' }, 401);

  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return json({ error: 'Server misconfigured' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { model, prompt, size = '1024x1024', quality = 'standard' } = body;

  if (!model || !prompt) return json({ error: 'model and prompt required' }, 400);
  if (typeof prompt !== 'string' || prompt.length > 4000) return json({ error: 'prompt too long' }, 400);

  const cost = IMAGE_CREDIT_COST[model] || 3;

  // ── Credit check + deduction ──────────────────────────────────────
  try {
    await verifyAndDeductCredits(userJwt, cost, supabaseUrl, serviceKey);
  } catch (e) {
    const status  = e.status  || 500;
    const payload = { error: e.message || 'Errore autenticazione.' };
    if (e.code) payload.code = e.code;
    return json(payload, status);
  }

  // ── DALL·E 3 ──────────────────────────────────────────────────────
  if (model === 'dall-e-3') {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: 'OpenAI API key non configurata' }, 500);

    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: ['1024x1024','1792x1024','1024x1792'].includes(size) ? size : '1024x1024',
        quality: quality === 'hd' ? 'hd' : 'standard',
        response_format: 'url',
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return json({ error: `OpenAI error (${resp.status}): ${err.slice(0, 200)}` }, resp.status);
    }

    const data = await resp.json();
    const url  = data?.data?.[0]?.url;
    if (!url) return json({ error: 'No image URL returned' }, 500);

    return json({ url, model, revised_prompt: data?.data?.[0]?.revised_prompt || prompt });
  }

  // ── Nano Banana 2 / Pro ───────────────────────────────────────────
  if (model === 'nano-banana-2' || model === 'nano-banana-pro') {
    const apiKey = env.NANO_BANANA_API_KEY;
    const apiUrl = env.NANO_BANANA_API_URL;

    if (!apiKey || !apiUrl) {
      return json({ error: 'Nano Banana API non ancora configurata. Aggiungi NANO_BANANA_API_KEY e NANO_BANANA_API_URL nelle variabili d\'ambiente Cloudflare.' }, 503);
    }

    const nbResp = await fetch(`${apiUrl}/generate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model === 'nano-banana-pro' ? 'pro' : 'v2', prompt, size }),
    });

    if (!nbResp.ok) {
      const err = await nbResp.text();
      return json({ error: `Nano Banana error (${nbResp.status}): ${err.slice(0, 200)}` }, nbResp.status);
    }

    const nbData = await nbResp.json();
    const url = nbData.url || nbData.image_url || nbData.output?.[0];
    if (!url) return json({ error: 'No image URL returned from Nano Banana' }, 500);

    return json({ url, model });
  }

  return json({ error: `Unknown image model: ${model}` }, 400);
}
