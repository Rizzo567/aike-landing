/**
 * AIKE — functions/api/track.js
 * Cloudflare Pages Function — analytics tracker.
 * Receives POST /api/track, rate-limits by IP, inserts into Supabase.
 *
 * Required env vars (Cloudflare Pages → Settings → Environment variables):
 *   SUPABASE_URL              — e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service_role key (never expose to client)
 */

const WINDOW_MS = 60_000;
const MAX_HITS  = 5;
const _rl = new Map();

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

function evictStale() {
  const cutoff = Date.now() - WINDOW_MS * 2;
  for (const [k, v] of _rl) {
    if (v.windowStart < cutoff) _rl.delete(k);
  }
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Cloudflare provides the real client IP in this header
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

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

  const page = typeof body.page === 'string' ? body.page.slice(0, 255) : '/';

  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return new Response('Server misconfigured', { status: 500 });
  }

  // Direct REST call — no SDK import needed
  await fetch(`${supabaseUrl}/rest/v1/analytics`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ page }),
  });

  return new Response('ok', { status: 200 });
}
