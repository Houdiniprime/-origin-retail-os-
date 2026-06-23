const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const dataDir = path.join(root, "data");
const stateFile = path.join(dataDir, "erp-state.json");
const whatsappStatusFile = path.join(dataDir, "whatsapp-status.json");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

function resolveSafe(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "") || "app.html";
  const resolved = path.resolve(root, cleanPath);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(payload));
}

function networkUrls(portNumber = port) {
  const urls = [`http://localhost:${portNumber}/app.html`];
  const interfaces = os.networkInterfaces();
  Object.values(interfaces).flat().filter(Boolean).forEach((entry) => {
    if (entry.family === "IPv4" && !entry.internal) urls.push(`http://${entry.address}:${portNumber}/app.html`);
  });
  return [...new Set(urls)];
}

function printAccessUrls(portNumber = port) {
  const urls = networkUrls(portNumber);
  const lanUrl = urls.find((url) => !url.includes("localhost")) || urls[0];
  console.log("");
  console.log("Origin Retail OS demarre");
  console.log(`Ordinateur: http://localhost:${portNumber}/app.html`);
  console.log(`Telephone/tablette meme Wi-Fi: ${lanUrl}`);
  console.log("Pour acces a distance: npm.cmd run remote");
  try {
    const qr = require("qrcode-terminal");
    console.log("");
    console.log("QR code telephone/tablette:");
    qr.generate(lanUrl, { small: true });
  } catch {
    console.log("QR code indisponible: installer qrcode-terminal.");
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8 * 1024 * 1024) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleApi(req, res) {
  fs.mkdirSync(dataDir, { recursive: true });
  if (req.method === "GET" && req.url === "/api/access") {
    return sendJson(res, 200, { ok: true, urls: networkUrls(), remote: "npm.cmd run remote" });
  }
  if (req.method === "GET" && req.url === "/api/state") {
    if (!fs.existsSync(stateFile)) return sendJson(res, 200, { ok: true, state: null });
    return sendJson(res, 200, { ok: true, state: JSON.parse(fs.readFileSync(stateFile, "utf8")) });
  }
  if (req.method === "POST" && req.url === "/api/state") {
    const payload = JSON.parse(await readBody(req));
    fs.writeFileSync(stateFile, JSON.stringify({ ...payload, serverSyncedAt: new Date().toISOString() }, null, 2));
    return sendJson(res, 200, { ok: true, syncedAt: new Date().toISOString() });
  }
  if (req.method === "GET" && req.url === "/api/whatsapp/status") {
    const status = fs.existsSync(whatsappStatusFile)
      ? JSON.parse(fs.readFileSync(whatsappStatusFile, "utf8"))
      : { enabled: false, connected: false, message: "Agent WhatsApp non demarre" };
    return sendJson(res, 200, { ok: true, status });
  }
  if (req.method === "POST" && req.url === "/api/send-reset") {
    const { email, tempPwd, name } = JSON.parse(await readBody(req));
    if (!email) return sendJson(res, 400, { ok: false, error: "Email requis" });
    if (!_nodemailer) return sendJson(res, 200, { ok: true, sent: false, msg: "Nodemailer non installe. Voir les parametres pour configurer SMTP." });
    try {
      const cfg = JSON.parse(fs.readFileSync(stateFile, "utf8")).settings?.smtp || {};
      if (!cfg.host || !cfg.user || !cfg.pass) return sendJson(res, 200, { ok: true, sent: false, msg: "SMTP non configure. Allez dans Parametres > Email SMTP." });
      const transporter = _nodemailer.createTransport({ host: cfg.host, port: cfg.port || 587, secure: cfg.secure || false, auth: { user: cfg.user, pass: cfg.pass } });
      await transporter.verify();
      await transporter.sendMail({
        from: `"Origin Retail OS" <${cfg.user}>`,
        to: email,
        subject: "Reinitialisation mot de passe - Origin Retail OS",
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #ddd;border-radius:8px">
          <h2 style="color:#131921">Origin Retail OS</h2>
          <p>Bonjour <strong>${name || 'Utilisateur'}</strong>,</p>
          <p>Votre mot de passe a ete reinitialise. Utilisez le code temporaire ci-dessous :</p>
          <div style="background:#fef3c7;text-align:center;padding:20px;border-radius:8px;font-size:36px;font-weight:900;letter-spacing:6px;color:#b45309;margin:16px 0">${tempPwd}</div>
          <p style="color:#666;font-size:13px">Ce code expire apres utilisation. Connectez-vous avec ce code et changez-le dans Parametres.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
          <p style="color:#999;font-size:12px">Origin Retail OS - ERP boutique intelligent</p>
        </div>`
      });
      return sendJson(res, 200, { ok: true, sent: true });
    } catch (e) {
      return sendJson(res, 200, { ok: true, sent: false, error: e.message });
    }
  }

  if (req.method === "POST" && req.url === "/api/send-whatsapp") {
    const { phone, text } = JSON.parse(await readBody(req));
    if (!phone || !text) return sendJson(res, 400, { ok: false, error: "Telephone et texte requis" });
    try {
      const wa = require("./whatsapp-agent");
      const result = await wa.sendWhatsAppMessage(phone, text);
      return sendJson(res, 200, { ok: true, sent: result.sent, error: result.error });
    } catch (e) {
      return sendJson(res, 200, { ok: true, sent: false, error: e.message });
    }
  }
  return false;
}

const server = http.createServer((req, res) => {
  if ((req.url || "").startsWith("/api/")) {
    handleApi(req, res).catch((error) => sendJson(res, 500, { ok: false, error: error.message }));
    return;
  }
  let filePath = resolveSafe(req.url || "/");
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(root, "app.html");
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": types[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600",
    "X-Content-Type-Options": "nosniff"
  });
  fs.createReadStream(filePath).pipe(res);
});

if (require.main === module) {
  server.listen(port, "0.0.0.0", () => {
    printAccessUrls(port);
    if (process.env.WHATSAPP_ENABLED !== "true") {
      console.log("");
      console.log("Agent WhatsApp desactive.");
      console.log("Pour l\'activer: set WHATSAPP_ENABLED=true && node server.js");
      console.log("Ou: npm run start:whatsapp");
    } else {
      console.log("");
      console.log("Agent WhatsApp en cours de demarrage...");
      console.log("Scannez le QR code dans le terminal avec votre WhatsApp.");
    }
  });
  if (process.env.WHATSAPP_ENABLED === "true") {
    require("./whatsapp-agent").startWhatsAppAgent({ root, stateFile, statusFile: whatsappStatusFile });
  }
}

module.exports = { server, networkUrls, printAccessUrls };
