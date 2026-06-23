// Cloudflare Pages Function — /api/send-reset
// Note: L'envoi d'email SMTP nécessite un service externe.
// Actuellement, le code est affiché directement à l'écran.
// Pour activer les emails: ajoutez un binding Email ou utilisez SendGrid.

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

  try {
    const body = await request.json();
    return new Response(JSON.stringify({
      ok: true,
      sent: false,
      msg: "Mode cloud: le code de réinitialisation est affiché à l'écran. Configurez un service email (SendGrid) dans Cloudflare pour activer l'envoi par email."
    }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  }
}
