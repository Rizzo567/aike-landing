/**
 * AIKE — functions/api/image.js
 * POST /api/image
 * Generates images via DALL·E 3 (OpenAI) or Nano Banana models.
 *
 * Required env vars:
 *   OPENAI_API_KEY         — for dall-e-3
 *   NANO_BANANA_API_KEY    — for nano-banana-2 / nano-banana-pro (set when available)
 *   NANO_BANANA_API_URL    — base URL for Nano Banana API
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { model, prompt, size = '1024x1024', quality = 'standard' } = body;

  if (!model || !prompt) return json({ error: 'model and prompt required' }, 400);
  if (typeof prompt !== 'string' || prompt.length > 4000) return json({ error: 'prompt too long' }, 400);

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
