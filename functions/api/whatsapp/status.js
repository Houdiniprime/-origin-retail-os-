// Cloudflare Pages Function — /api/whatsapp/status
// L'agent WhatsApp local ne fonctionne pas en mode cloud.
// Pour utiliser WhatsApp, intégrez un service comme Twilio ou WATI.

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

  return new Response(JSON.stringify({
    ok: true,
    status: {
      enabled: false,
      connected: false,
      message: "Agent WhatsApp non disponible en mode cloud. Utilisez un service comme Twilio WhatsApp API."
    }
  }), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
