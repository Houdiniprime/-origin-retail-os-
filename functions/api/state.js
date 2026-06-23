// Cloudflare Pages Function — /api/state
// GET  → récupère l'état ERP depuis KV
// POST → sauvegarde l'état ERP dans KV

const KV_KEY = "origin_retail_os_state";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    if (request.method === "GET") {
      const raw = await env.ERP_STATE.get(KV_KEY);
      const state = raw ? JSON.parse(raw) : null;
      return new Response(JSON.stringify({ ok: true, state }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    if (request.method === "POST") {
      const payload = await request.json();
      const enriched = {
        ...payload,
        serverSyncedAt: new Date().toISOString()
      };
      await env.ERP_STATE.put(KV_KEY, JSON.stringify(enriched));
      return new Response(JSON.stringify({ ok: true, syncedAt: enriched.serverSyncedAt }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  }
}
