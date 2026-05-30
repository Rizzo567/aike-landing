/**
 * AIKE — functions/api/verify-email.js
 * POST /api/verify-email
 * Body: { action: 'send' | 'verify', email: string, token?: string }
 * Auth: Bearer JWT (required)
 *
 * send   → sends OTP to email via Supabase signInWithOtp (shouldCreateUser: false)
 * verify → verifies OTP token, then sets profiles.email_verified = true
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = env.SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server misconfigured' }, 500);
  }

  // ── Auth: verify JWT ───────────────────────────────────────
  const authHeader = request.headers.get('Authorization') || '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!jwt) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // Verify JWT by calling Supabase /auth/v1/user
  const userRes = await fetch(supabaseUrl + '/auth/v1/user', {
    headers: {
      'apikey': serviceKey,
      'Authorization': 'Bearer ' + jwt,
    },
  });

  if (!userRes.ok) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const userData = await userRes.json();
  const userId = userData.id;

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // ── Parse body ────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { action, email, token } = body;

  if (!action || !email) {
    return json({ error: 'Missing action or email' }, 400);
  }

  // ── action: send ──────────────────────────────────────────
  if (action === 'send') {
    const otpRes = await fetch(supabaseUrl + '/auth/v1/otp', {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        create_user: false,
        options: { shouldCreateUser: false },
      }),
    });

    if (!otpRes.ok) {
      let errMsg = 'Failed to send OTP';
      try {
        const errData = await otpRes.json();
        errMsg = errData.message || errData.error || errMsg;
      } catch (e) {}
      return json({ error: errMsg }, 400);
    }

    return json({ ok: true });
  }

  // ── action: verify ────────────────────────────────────────
  if (action === 'verify') {
    if (!token) {
      return json({ error: 'Missing token' }, 400);
    }

    const verifyRes = await fetch(supabaseUrl + '/auth/v1/verify', {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'email',
        email: email,
        token: token,
      }),
    });

    if (!verifyRes.ok) {
      let errMsg = 'Codice non valido o scaduto';
      try {
        const errData = await verifyRes.json();
        errMsg = errData.message || errData.error || errMsg;
      } catch (e) {}
      return json({ error: errMsg }, 400);
    }

    // OTP verified — update profiles.email_verified = true
    const patchRes = await fetch(
      supabaseUrl + '/rest/v1/profiles?id=eq.' + userId,
      {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': 'Bearer ' + serviceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ email_verified: true }),
      }
    );

    if (!patchRes.ok) {
      // Verification succeeded but profile update failed — not critical
      console.warn('[verify-email] Failed to update profiles.email_verified');
    }

    return json({ ok: true });
  }

  return json({ error: 'Invalid action. Use "send" or "verify".' }, 400);
}
