const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { server, printAccessUrls } = require("../server");

const port = Number(process.env.PORT || 8080);
const dataDir = path.join(__dirname, "..", "data");
const remoteFile = path.join(dataDir, "remote-access.json");
let tunnelUrl = "";
let browserOpened = false;

function openLocalBrowser() {
  if (browserOpened || process.env.OPEN_BROWSER === "false") return;
  browserOpened = true;
  const url = `http://localhost:${port}/app.html`;
  const command = process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    spawn(command, args, { detached: true, stdio: "ignore", shell: false }).unref();
    console.log(`Navigateur local ouvert: ${url}`);
  } catch {
    console.log(`Ouvrir dans le navigateur: ${url}`);
  }
}

function printRemote(url) {
  tunnelUrl = url;
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(remoteFile, JSON.stringify({ url, port, at: new Date().toISOString() }, null, 2));
  console.log("");
  console.log("ACCES DISTANT ACTIF");
  console.log(url);
  console.log("Ouvrir ce lien sur telephone, tablette ou PC distant.");
  console.log("Garder cette fenetre ouverte pendant l'utilisation.");
  try {
    const qr = require("qrcode-terminal");
    console.log("");
    console.log("QR code acces distant:");
    qr.generate(url, { small: true });
  } catch {}
}

function startTunnel() {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  let child;
  try {
    child = spawn(command, ["--yes", "cloudflared@latest", "tunnel", "--url", `http://127.0.0.1:${port}`], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32"
    });
  } catch (error) {
    console.error("Tunnel distant impossible a lancer:", error.message);
    console.error("Verifier Internet, puis relancer: npm.cmd run remote");
    return;
  }

  const parse = (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match && !tunnelUrl) printRemote(match[0]);
  };

  child.stdout.on("data", parse);
  child.stderr.on("data", parse);
  child.on("error", (error) => {
    console.error("Tunnel distant impossible a lancer:", error.message);
    console.error("Installer cloudflared ou verifier Internet, puis relancer: npm.cmd run remote");
  });
  child.on("exit", (code) => {
    if (!tunnelUrl) {
      console.error("");
      console.error("Le tunnel distant n'a pas pu etre cree automatiquement.");
      console.error("Verifier la connexion Internet, puis relancer: npm.cmd run remote");
    }
    process.exit(code || 0);
  });

  readline.createInterface({ input: process.stdin, output: process.stdout }).on("SIGINT", () => {
    child.kill("SIGINT");
    server.close(() => process.exit(0));
  });
}

server.listen(port, "0.0.0.0", () => {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(remoteFile, JSON.stringify({ url: "", port, status: "starting", at: new Date().toISOString() }, null, 2));
  printAccessUrls(port);
  openLocalBrowser();
  console.log("");
  console.log("Creation automatique du lien distant securise...");
  startTunnel();
});
