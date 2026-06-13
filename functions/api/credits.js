/**
 * AIKE — functions/api/credits.js
 * GET  /api/credits  → returns { total, used, plan } for the authenticated user
 * POST /api/credits/deduct → deducts credits (called internally by chat.js)
 *
 * Supabase table required (run in Supabase SQL editor):
 *   CREATE TABLE IF NOT EXISTS user_credits (
 *     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 *     plan       text NOT NULL DEFAULT 'free',
 *     total      int  NOT NULL DEFAULT 30,
 *     used       int  NOT NULL DEFAULT 0,
 *     reset_at   timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
 *     updated_at timestamptz DEFAULT now(),
 *     UNIQUE(user_id)
 *   );
 *   ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users can read own credits"  ON user_credits FOR SELECT USING (auth.uid() = user_id);
 *   -- Service role bypasses RLS for writes
 */

// Crediti per ciclo mensile per piano (allineati a docs/monetization/CREDIT_SYSTEM.md).
// Free usa Groq (0 crediti Claude); 'basic' resta come alias legacy = Pro.
const PLAN_LIMITS = { free: 0, basic: 350, pro: 350, max: 1200 };

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const corsH = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsH });

  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500, headers: { ...corsH, 'Content-Type': 'application/json' } });
  }

  // Extract JWT from Authorization header to identify user
  const authHeader = request.headers.get('Authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Verify JWT and get user_id
  let userId = null;
  if (jwt) {
    try {
      const verifyResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${jwt}` },
      });
      if (verifyResp.ok) {
        const userData = await verifyResp.json();
        userId = userData.id;
      }
    } catch {}
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsH, 'Content-Type': 'application/json' } });
  }

  // Ensure row exists (upsert default on first access)
  await fetch(`${supabaseUrl}/rest/v1/user_credits`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({ user_id: userId, plan: 'free', total: 30, used: 0, reset_at: new Date(Date.now() + 30*24*60*60*1000).toISOString() }),
  });

  // Auto-reset if reset_at has passed
  await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${userId}&reset_at=lt.${new Date().toISOString()}`, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ used: 0, reset_at: new Date(Date.now() + 30*24*60*60*1000).toISOString() }),
  });

  if (request.method === 'GET') {
    const resp = await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${userId}&select=plan,total,used,reset_at`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
    });
    const rows = await resp.json();
    const row  = rows[0] || { plan: 'free', total: 30, used: 0 };
    // Apply plan limits (in case plan was upgraded)
    if (row.plan && PLAN_LIMITS[row.plan] && row.total !== PLAN_LIMITS[row.plan]) {
      row.total = PLAN_LIMITS[row.plan];
    }
    return new Response(JSON.stringify({ total: row.total, used: row.used, plan: row.plan, reset_at: row.reset_at }), {
      status: 200, headers: { ...corsH, 'Content-Type': 'application/json' },
    });
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: corsH }); }

    const cost = Number(body.cost) || 1;

    // Read current state
    const readResp = await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${userId}&select=plan,total,used`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
    });
    const rows2 = await readResp.json();
    const row2  = rows2[0];
    if (!row2) return new Response(JSON.stringify({ error: 'Credits not found' }), { status: 404, headers: corsH });

    const total = PLAN_LIMITS[row2.plan] || row2.total;
    if (row2.used + cost > total) {
      return new Response(JSON.stringify({ error: 'Crediti esauriti. Aggiorna il piano per continuare.', code: 'CREDITS_EXHAUSTED' }), {
        status: 402, headers: { ...corsH, 'Content-Type': 'application/json' },
      });
    }

    // Deduct with optimistic locking — filter on current used value to prevent race conditions
    const patchR = await fetch(`${supabaseUrl}/rest/v1/user_credits?user_id=eq.${userId}&used=eq.${row2.used}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json', 'Prefer': 'return=representation',
      },
      body: JSON.stringify({ used: row2.used + cost, updated_at: new Date().toISOString() }),
    });

    const updated = await patchR.json();
    if (!Array.isArray(updated) || updated.length === 0) {
      return new Response(JSON.stringify({ error: 'Richiesta concorrente rilevata. Riprova.', code: 'CONCURRENT_REQUEST' }), {
        status: 409, headers: { ...corsH, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, remaining: total - row2.used - cost }), {
      status: 200, headers: { ...corsH, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
