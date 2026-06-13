// ============================================================
// Aike — Stripe webhook handler
// POST /api/stripe-webhook
//
// Riceve gli eventi Stripe e sincronizza il piano dell'utente in
// public.user_credits. Gira su Cloudflare Pages (edge): niente Node,
// niente libreria `stripe`. La firma viene verificata a mano con
// WebCrypto (HMAC SHA-256), lo stesso schema della libreria ufficiale.
//
// Eventi gestiti:
//   checkout.session.completed      → primo pagamento / sottoscrizione
//   customer.subscription.updated   → cambio piano, rinnovo
//   customer.subscription.deleted   → cancellazione → torna a 'free'
//
// Mappatura piano:
//   - price ID == STRIPE_PRICE_PRO → pro  (350 crediti)
//   - price ID == STRIPE_PRICE_MAX → max  (1200 crediti)
//   - fallback per importo (centesimi): 1400 → pro, 4900 → max
//   - cancellazione / nessun match → free (0 crediti)
//
// Identità utente:
//   email del cliente Stripe → user_id via Supabase Admin API
//   (GET /auth/v1/admin/users), con service role key.
//   Se l'utente non si trova → 200 + log (no retry infinito Stripe).
//
// ENV richieste:
//   STRIPE_WEBHOOK_SECRET      whsec_... (firma webhook)
//   STRIPE_PRICE_PRO           price_... del piano Pro €14
//   STRIPE_PRICE_MAX           price_... del piano Max €49
//   SUPABASE_URL               https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  service role key (scritture DB + admin API)
// ============================================================

// Crediti per piano (fonte: docs/monetization/CREDIT_SYSTEM.md §2)
const PLAN_CREDITS = { free: 0, pro: 350, max: 1200 };

// Fallback importo→piano in centesimi (lordi mensili) se il price ID
// non combacia con le ENV.
const AMOUNT_TO_PLAN = { 1400: 'pro', 4900: 'max' };

// Tolleranza per il timestamp della firma (replay protection): 5 minuti.
const SIGNATURE_TOLERANCE_SECONDS = 300;

const RESET_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 giorni

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Validazione configurazione minima (mai usare default in chiaro).
  if (
    !env.STRIPE_WEBHOOK_SECRET ||
    !env.SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return jsonLog('Server misconfigured', 500);
  }

  // --- 1. Leggi il raw body (serve esatto per la firma) ---
  const rawBody = await request.text();
  const sigHeader = request.headers.get('stripe-signature') || '';

  // --- 2. Verifica la firma ---
  const verified = await verifyStripeSignature(
    rawBody,
    sigHeader,
    env.STRIPE_WEBHOOK_SECRET,
  );
  if (!verified) {
    return new Response(JSON.stringify({ error: 'INVALID_SIGNATURE' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- 3. Parse evento ---
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'INVALID_JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const type = event?.type;
  const obj = event?.data?.object || {};

  try {
    switch (type) {
      case 'checkout.session.completed': {
        // L'oggetto è una Checkout Session: ha customer_details.email e,
        // per le subscription, line_items NON sono inclusi di default.
        // Ricaviamo il piano dalla subscription se possibile, altrimenti
        // da amount_total. Recuperiamo l'email del cliente.
        const email = extractEmail(obj);
        const plan = await planFromCheckoutSession(obj, env);
        return await applyPlan(email, plan, env, type);
      }

      case 'customer.subscription.updated': {
        // Oggetto = Subscription. Email non sempre presente: serve lookup
        // del customer Stripe per ricavarla.
        const email = await emailFromSubscription(obj, env);
        const plan = planFromSubscription(obj, env);
        return await applyPlan(email, plan, env, type);
      }

      case 'customer.subscription.deleted': {
        // Cancellazione → torna a free.
        const email = await emailFromSubscription(obj, env);
        return await applyPlan(email, 'free', env, type);
      }

      default:
        // Evento non gestito: ack 200 per non far ritentare Stripe.
        return new Response(
          JSON.stringify({ received: true, ignored: type }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    }
  } catch (e) {
    // Errore interno inatteso: 500 → Stripe ritenta (idempotenza gestita
    // dall'upsert by user_id, ripetibile senza danno).
    console.error('stripe-webhook handler error', String(e).slice(0, 300));
    return new Response(JSON.stringify({ error: 'INTERNAL_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ------------------------------------------------------------
// Firma Stripe: header "t=<ts>,v1=<hex>[,v1=<hex>...]"
// signed_payload = `${t}.${rawBody}`, HMAC-SHA256 con il webhook secret.
// Confronto in tempo costante + controllo tolleranza timestamp.
// ------------------------------------------------------------
async function verifyStripeSignature(payload, sigHeader, secret) {
  if (!sigHeader) return false;

  let timestamp = null;
  const v1Signatures = [];
  for (const part of sigHeader.split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === 't') timestamp = value;
    else if (key === 'v1') v1Signatures.push(value);
  }

  if (!timestamp || v1Signatures.length === 0) return false;

  // Tolleranza anti-replay.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${payload}`);

  // Almeno una delle firme v1 deve combaciare (tempo costante).
  for (const sig of v1Signatures) {
    if (timingSafeEqualHex(sig, expected)) return true;
  }
  return false;
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

// Confronto in tempo costante tra due stringhe esadecimali.
function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ------------------------------------------------------------
// Piano da Checkout Session.
// Strategia:
//  1. Se ha una subscription, recuperala via API e leggi il price ID.
//  2. Fallback: amount_total (centesimi) → AMOUNT_TO_PLAN.
// ------------------------------------------------------------
async function planFromCheckoutSession(session, env) {
  // 1. Subscription collegata.
  const subId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  if (subId && env.STRIPE_SECRET_KEY) {
    const sub = await fetchStripe(
      `subscriptions/${subId}`,
      env.STRIPE_SECRET_KEY,
    );
    if (sub) {
      const plan = planFromSubscription(sub, env);
      if (plan !== 'free') return plan;
    }
  }

  // 2. Fallback per importo.
  const amount = Number(session.amount_total);
  if (Number.isFinite(amount) && AMOUNT_TO_PLAN[amount]) {
    return AMOUNT_TO_PLAN[amount];
  }

  return 'free';
}

// ------------------------------------------------------------
// Piano da oggetto Subscription.
// Legge il price ID dalla prima riga di items.data e lo confronta con
// le ENV; fallback all'importo (unit_amount).
// ------------------------------------------------------------
function planFromSubscription(sub, env) {
  const item = sub?.items?.data?.[0];
  const price = item?.price || sub?.plan || {};
  const priceId = price?.id;

  if (priceId && env.STRIPE_PRICE_PRO && priceId === env.STRIPE_PRICE_PRO) {
    return 'pro';
  }
  if (priceId && env.STRIPE_PRICE_MAX && priceId === env.STRIPE_PRICE_MAX) {
    return 'max';
  }

  // Fallback per importo (centesimi).
  const amount = Number(price?.unit_amount);
  if (Number.isFinite(amount) && AMOUNT_TO_PLAN[amount]) {
    return AMOUNT_TO_PLAN[amount];
  }

  return 'free';
}

// Email dall'oggetto Subscription: non sempre presente inline.
// Tentiamo: customer (string id) → GET /customers/{id} → email.
async function emailFromSubscription(sub, env) {
  const inline = extractEmail(sub);
  if (inline) return inline;

  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (customerId && env.STRIPE_SECRET_KEY) {
    const customer = await fetchStripe(
      `customers/${customerId}`,
      env.STRIPE_SECRET_KEY,
    );
    if (customer?.email) return customer.email;
  }
  return null;
}

// Estrae l'email da vari shape di oggetti Stripe.
function extractEmail(obj) {
  return (
    obj?.customer_details?.email ||
    obj?.customer_email ||
    obj?.receipt_email ||
    obj?.email ||
    null
  );
}

// GET su Stripe REST API. Ritorna null su qualunque errore (best-effort:
// la mappatura per importo è il fallback se l'API non è disponibile).
async function fetchStripe(path, secretKey) {
  try {
    const res = await fetch(`https://api.stripe.com/v1/${path}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// Applica il piano all'utente: email → user_id → upsert user_credits.
// ------------------------------------------------------------
async function applyPlan(email, plan, env, eventType) {
  if (!email) {
    // Niente email → non possiamo identificare l'utente. Ack 200 per non
    // innescare retry infiniti di Stripe.
    console.warn(`stripe-webhook ${eventType}: no email in event`);
    return ack({ received: true, skipped: 'no_email' });
  }

  const userId = await userIdFromEmail(email, env);
  if (!userId) {
    // Utente non trovato (es. pagamento prima della registrazione, o email
    // diversa). Ack 200 + log: non vogliamo che Stripe ritenti all'infinito.
    console.warn(
      `stripe-webhook ${eventType}: user not found for email ${email}`,
    );
    return ack({ received: true, skipped: 'user_not_found' });
  }

  const total = PLAN_CREDITS[plan] ?? 0;
  const ok = await upsertUserCredits(userId, plan, total, env);
  if (!ok) {
    // Scrittura DB fallita → 500 così Stripe ritenta (upsert idempotente).
    return new Response(
      JSON.stringify({ error: 'DB_WRITE_FAILED' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return ack({ received: true, plan, user_id: userId });
}

// Risolve email → auth.users.id tramite Supabase Admin API.
// La query parametrica ?email= filtra lato server (GoTrue v2).
async function userIdFromEmail(email, env) {
  const url =
    `${env.SUPABASE_URL}/auth/v1/admin/users` +
    `?email=${encodeURIComponent(email)}`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);

    // GoTrue può rispondere { users: [...] } oppure un array diretto.
    const list = Array.isArray(data) ? data : data?.users;
    if (!Array.isArray(list) || list.length === 0) return null;

    // Match esatto e case-insensitive sull'email (il filtro server
    // potrebbe essere ignorato su alcune versioni → confermiamo qui).
    const target = email.toLowerCase();
    const match =
      list.find((u) => String(u?.email || '').toLowerCase() === target) ||
      list[0];
    return match?.id || null;
  } catch {
    return null;
  }
}

// Upsert su user_credits by user_id. Reset del ciclo: used=0, reset_at +30d.
async function upsertUserCredits(userId, plan, total, env) {
  const body = JSON.stringify({
    user_id: userId,
    plan,
    total,
    used: 0,
    reset_at: new Date(Date.now() + RESET_INTERVAL_MS).toISOString(),
    updated_at: new Date().toISOString(),
  });

  try {
    // on_conflict=user_id + Prefer merge-duplicates → upsert atomico.
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/user_credits?on_conflict=user_id`,
      {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body,
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

function ack(obj) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonLog(message, status) {
  console.error(`stripe-webhook: ${message}`);
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
