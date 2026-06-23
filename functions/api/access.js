// Cloudflare Pages Function — /api/access
// Retourne les informations d'accès à l'ERP

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  return new Response(JSON.stringify({
    ok: true,
    urls: [`${baseUrl}/app.html`],
    cloud: true,
    message: "Origin Retail OS - accessible depuis n'importe quel appareil"
  }), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
