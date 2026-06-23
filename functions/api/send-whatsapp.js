// Cloudflare Pages Function — /api/send-whatsapp
// L'agent WhatsApp local ne fonctionne pas en mode cloud.
// Pour activer WhatsApp, intégrez un service comme Twilio.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  return new Response(JSON.stringify({
    ok: true,
    sent: false,
    error: "WhatsApp non disponible en mode cloud. Configurez Twilio ou utilisez l'envoi local."
  }), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
