/**
 * AIKE — netlify/edge-functions/analytics.js
 * Receives POST /api/track, rate-limits by IP (5 req/min per edge instance),
 * then inserts into Supabase analytics table via service role key.
 *
 * Required Netlify env vars (set in Netlify UI → Site settings → Env variables):
 *   SUPABASE_URL              — e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key (never expose to client)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Rate-limit state (per edge instance, resets on cold start) ──────────────
// Provides burst protection without an external store.
// Limit: MAX_HITS requests per IP within WINDOW_MS milliseconds.
const WINDOW_MS = 60_000; // 1 minute
const MAX_HITS  = 5;
const _rl = new Map(); // ip → { count, windowStart }

function isRateLimited(ip) {
  const now   = Date.now();
  const entry = _rl.get(ip) || { count: 0, windowStart: now };

  if (now - entry.windowStart > WINDOW_MS) {
    _rl.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= MAX_HITS) return true;
  _rl.set(ip, { count: entry.count + 1, windowStart: entry.windowStart });
  return false;
}

// Evict stale entries to prevent unbounded Map growth
function evictStale() {
  const cutoff = Date.now() - WINDOW_MS * 2;
  for (const [k, v] of _rl) {
    if (v.windowStart < cutoff) _rl.delete(k);
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(request, context) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const ip = context.ip || 'unknown';

  evictStale();

  if (isRateLimited(ip)) {
    return new Response('Rate limited', { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const page = typeof body.page === 'string'
    ? body.page.slice(0, 255)
    : '/';

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    return new Response('Server misconfigured', { status: 500 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  await sb.from('analytics').insert({ page });

  return new Response('ok', { status: 200 });
}
