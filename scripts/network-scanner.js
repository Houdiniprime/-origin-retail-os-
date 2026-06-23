/**
 * Network Scanner — Origin Retail OS
 * 
 * Scanne le réseau local pour détecter les machines actives
 * et permet de les configurer pour accéder à l'ERP.
 * 
 * Utilisation : node scripts/network-scanner.js
 */

const { execSync, spawn } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");
const http = require("http");

const PORT = 8080;
const TIMEOUT = 2000; // 2 secondes par machine

// ─── Obtenir le réseau local ────────────────────────────────────────────────

function getLocalNetwork() {
  const interfaces = os.networkInterfaces();
  const results = [];

  for (const [name, entries] of Object.entries(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === "IPv4" && !entry.internal) {
        const subnet = entry.address.split(".").slice(0, 3).join(".");
        results.push({
          interface: name,
          address: entry.address,
          netmask: entry.netmask,
          subnet: subnet,
          cidr: entry.cidr
        });
      }
    }
  }
  return results;
}

// ─── Ping une machine ───────────────────────────────────────────────────────

function pingHost(ip) {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const cmd = isWindows
      ? `ping -n 1 -w ${TIMEOUT} ${ip}`
      : `ping -c 1 -W ${Math.ceil(TIMEOUT / 1000)} ${ip}`;

    try {
      const stdout = execSync(cmd, { timeout: TIMEOUT + 500, stdio: ["ignore", "pipe", "ignore"] });
      const success = isWindows
        ? stdout.toString().includes("TTL=") || stdout.toString().includes("réponse")
        : stdout.toString().includes("1 received") || stdout.toString().includes("ttl=");
      resolve({ ip, alive: success });
    } catch {
      resolve({ ip, alive: false });
    }
  });
}

// ─── Scan ARP table (Windows) ───────────────────────────────────────────────

function getArpTable() {
  try {
    const stdout = execSync("arp -a", { timeout: 5000, encoding: "utf8" });
    const lines = stdout.split("\n");
    const entries = [];

    for (const line of lines) {
      const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F-]{17})\s+/);
      if (match) {
        entries.push({
          ip: match[1],
          mac: match[2].toUpperCase().replace(/-/g, ":")
        });
      }
    }
    return entries;
  } catch {
    return [];
  }
}

// ─── Vérifie si le port ERP est ouvert sur une machine ──────────────────────

function checkErpPort(ip) {
  return new Promise((resolve) => {
    const req = http.get(`http://${ip}:${PORT}/api/access`, { timeout: 1500 }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          resolve({ ip, hasErp: true, name: result.ok ? "Origin Retail OS" : "Unknown" });
        } catch {
          resolve({ ip, hasErp: true, name: "ERP (port 8080)" });
        }
      });
    });
    req.on("error", () => resolve({ ip, hasErp: false, name: null }));
    req.on("timeout", () => { req.destroy(); resolve({ ip, hasErp: false, name: null }); });
  });
}

// ─── Scan rapide (ARP uniquement) ──────────────────────────────────────────

function quickScan() {
  console.log("\n🔍 Scan réseau rapide (ARP table)...");
  const arp = getArpTable();
  console.log(`   ${arp.length} machines trouvées dans la table ARP`);

  if (arp.length === 0) {
    console.log("   ℹ️  Aucune machine trouvée. Essayez le scan complet.");
  } else {
    console.log("\n📋 Machines détectées sur le réseau :");
    console.log("   " + "-".repeat(55));
    console.log("   ${'IP'.padEnd(16)} ${'MAC'.padEnd(18)}");
    console.log("   " + "-".repeat(55));

    for (const entry of arp) {
      const isLocal = entry.ip === getLocalNetwork()[0]?.address;
      const marker = isLocal ? " ← (Cette machine)" : "";
      console.log(`   ${entry.ip.padEnd(16)} ${entry.mac.padEnd(18)}${marker}`);
    }
  }

  return arp;
}

// ─── Scan complet (ARP + Ping sweep) ────────────────────────────────────────

async function fullScan(showProgress = true) {
  console.log("\n🔍 Scan réseau complet (ping sweep)...");
  const networks = getLocalNetwork();

  if (networks.length === 0) {
    console.log("❌ Aucune interface réseau active trouvée.");
    return [];
  }

  const subnet = networks[0].subnet;
  console.log(`   Réseau: ${subnet}.0/24`);
  console.log(`   Interface: ${networks[0].interface} (${networks[0].address})`);
  console.log("");

  // Ping de 1 à 254
  const hosts = [];
  const batchSize = 20;
  const allIps = [];

  for (let i = 1; i <= 254; i++) {
    allIps.push(`${subnet}.${i}`);
  }

  for (let i = 0; i < allIps.length; i += batchSize) {
    const batch = allIps.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(ip => pingHost(ip)));

    for (const r of results) {
      if (r.alive) {
        hosts.push(r.ip);
        if (showProgress) {
          process.stdout.write(`   ✓ ${r.ip}\n`);
        }
      }
    }

    if (showProgress && i % 100 === 0) {
      process.stdout.write(`   Progression: ${Math.min(i + batchSize, 254)}/254\n`);
    }
  }

  // Vérifier le port ERP sur chaque machine alive
  console.log(`\n📡 ${hosts.length} machines actives trouvées. Vérification du port ERP...`);
  const erpMachines = [];

  for (const ip of hosts) {
    const erp = await checkErpPort(ip);
    if (erp.hasErp) {
      erpMachines.push(erp);
      console.log(`   ✅ ${ip} → ${erp.name} (port ${PORT} ouvert)`);
    }
  }

  return { hosts, erpMachines, subnet };
}

// ─── Affiche les URLs d'accès ───────────────────────────────────────────────

function showAccessUrls() {
  console.log("\n🌐 URLs d'accès à l'ERP :");
  const interfaces = os.networkInterfaces();

  console.log(`   Local: http://localhost:${PORT}/app.html`);

  for (const [name, entries] of Object.entries(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === "IPv4" && !entry.internal) {
        console.log(`   ${name.padEnd(12)}: http://${entry.address}:${PORT}/app.html`);
      }
    }
  }
  console.log("");
}

// ─── Configurer une machine distante (affiche les instructions) ─────────────

function showSetupGuide(ip) {
  console.log(`\n📋 Instructions pour configurer ${ip} :`);
  console.log("   " + "=".repeat(50));
  console.log("   Méthode 1: Navigateur web");
  console.log(`   Ouvrez http://${ip}:${PORT}/app.html sur la machine`);
  console.log("");
  console.log("   Méthode 2: Client portable");
  console.log("   Copiez le dossier du projet sur une clé USB et exécutez");
  console.log(`   le fichier OriginRetailOS.exe sur la machine ${ip}`);
  console.log("");
  console.log("   Méthode 3: Accès distant");
  console.log("   Utilisez 'npm run remote' sur le serveur pour obtenir");
  console.log("   un lien HTTPS public sécurisé via Cloudflare Tunnel");
  console.log("");
}

// ─── MENU PRINCIPAL ─────────────────────────────────────────────────────────

async function showMenu() {
  console.log("");
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║       Origin Retail OS — Scan réseau         ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");
  console.log("Cette machine: " + (getLocalNetwork()[0]?.address || "Inconnu"));
  console.log("Port ERP: " + PORT);
  console.log("");

  console.log("Options disponibles :");
  console.log("   1. Scan rapide (ARP table)");
  console.log("   2. Scan complet (ping sweep + vérification ERP)");
  console.log("   3. Afficher les URLs d'accès");
  console.log("   4. Scanner et configurer les machines du réseau");
  console.log("   5. Quitter");
  console.log("");

  return new Promise((resolve) => {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("   Votre choix (1-5): ", async (choice) => {
      rl.close();
      resolve(choice.trim());
    });
  });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const autoMode = args.includes("--quick") || args.includes("-q");

  if (autoMode) {
    // Mode automatique (appelé par le launcher)
    const arp = quickScan();
    const networks = getLocalNetwork();
    console.log("\n📡 URLs d'accès disponibles :");
    if (networks.length > 0) {
      console.log(`   http://${networks[0].address}:${PORT}/app.html`);
    }
    console.log("");
    return;
  }

  while (true) {
    const choice = await showMenu();

    if (choice === "1") {
      quickScan();
      const rl = require("readline").createInterface({
        input: process.stdin, output: process.stdout
      });
      await new Promise(r => { rl.question("\nAppuyez sur Entrée pour continuer...", () => { rl.close(); r(); }); });

    } else if (choice === "2") {
      await fullScan(true);
      const rl = require("readline").createInterface({
        input: process.stdin, output: process.stdout
      });
      await new Promise(r => { rl.question("\nAppuyez sur Entrée pour continuer...", () => { rl.close(); r(); }); });

    } else if (choice === "3") {
      showAccessUrls();
      const rl = require("readline").createInterface({
        input: process.stdin, output: process.stdout
      });
      await new Promise(r => { rl.question("\nAppuyez sur Entrée pour continuer...", () => { rl.close(); r(); }); });

    } else if (choice === "4") {
      const result = await fullScan(true);
      console.log(`\n✅ Scan terminé. ${result.hosts.length} machines actives, ${result.erpMachines.length} avec ERP.`);
      if (result.erpMachines.length === 0 && result.hosts.length > 0) {
        console.log("\n📝 Machines pouvant accéder à l'ERP via navigateur :");
        for (const ip of result.hosts) {
          showSetupGuide(ip);
        }
      } else if (result.erpMachines.length > 0) {
        console.log("\n✅ Machines ayant déjà l'ERP :");
        for (const m of result.erpMachines) {
          console.log(`   - ${m.ip}`);
        }
      }
      const rl = require("readline").createInterface({
        input: process.stdin, output: process.stdout
      });
      await new Promise(r => { rl.question("\nAppuyez sur Entrée pour continuer...", () => { rl.close(); r(); }); });

    } else if (choice === "5") {
      console.log("\nAu revoir !\n");
      process.exit(0);
    } else {
      console.log("\n❌ Choix invalide. Essayez 1-5.");
    }
  }
}

// ─── Export pour le launcher ─────────────────────────────────────────────────

module.exports = { quickScan, fullScan, getArpTable, pingHost, checkErpPort, showAccessUrls, getLocalNetwork };

if (require.main === module) {
  main().catch(console.error);
}
