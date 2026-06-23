#!/usr/bin/env node
/**
 * PWA Validator — Origin Retail OS
 * Vérifie que tous les assets PWA sont en place, accessibles et valides.
 * Usage: node scripts/pwa-validate.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8082; // Port temporaire pour le test
const ROOT = path.resolve(__dirname, '..');
const SERVER_SCRIPT = path.join(ROOT, 'server.js');

let failures = 0;
let passes = 0;

function check(label, condition, detail) {
  if (condition) {
    passes++;
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.log(`  ✗ ${label} ${detail ? '- ' + detail : ''}`);
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readJson(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
  } catch {
    return null;
  }
}

async function fetchUrl(baseUrl, urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

(async () => {
  console.log('\n🔍 Origin Retail OS — Validation PWA\n');
  console.log('═'.repeat(50));

  // 1. Fichiers statiques
  console.log('\n📁 Fichiers présents:');
  const requiredFiles = [
    ['manifest.json', 'Manifest PWA'],
    ['sw.js', 'Service Worker'],
    ['offline.html', 'Page offline'],
    ['app.html', 'Application shell'],
    ['index.html', 'Page d\'accueil'],
    ['assets/app.css', 'CSS principal'],
    ['assets/app.js', 'JS principal']
  ];
  requiredFiles.forEach(([file, label]) => {
    check(label + ` (${file})`, fileExists(file));
  });

  // 2. Validation manifest.json
  console.log('\n📋 Validation manifest.json:');
  const manifest = readJson('manifest.json');
  check('Manifest JSON valide', manifest !== null, manifest ? '' : 'JSON invalide');
  if (manifest) {
    check('name présent', !!manifest.name);
    check('short_name présent', !!manifest.short_name);
    check('start_url présent', !!manifest.start_url);
    check('display présent', !!manifest.display);
    check('theme_color présent', !!manifest.theme_color);
    check('background_color présent', !!manifest.background_color);
    check('icons tableau non vide', Array.isArray(manifest.icons) && manifest.icons.length > 0);
    if (manifest.icons && manifest.icons.length > 0) {
      const has192 = manifest.icons.some(i => i.sizes === '192x192');
      const has512 = manifest.icons.some(i => i.sizes === '512x512');
      check('Icône 192x192', has192);
      check('Icône 512x512', has512);
    }
    check('categories définies', Array.isArray(manifest.categories) && manifest.categories.length > 0);
    check('lang défini (fr)', manifest.lang === 'fr');
    check('shortcuts présents', Array.isArray(manifest.shortcuts) && manifest.shortcuts.length > 0);
  }

  // 3. Validation Service Worker
  console.log('\n⚙️ Validation sw.js:');
  const swContent = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  check('SW contient "install"', swContent.includes('install'));
  check('SW contient "activate"', swContent.includes('activate'));
  check('SW contient "fetch"', swContent.includes('fetch'));
  check('SW contient CACHE_PREFIX', swContent.includes('CACHE_PREFIX'));
  check('SW contient offline.html', swContent.includes('offline.html'));
  check('SW contient CacheFirst', swContent.includes('cacheFirst') || swContent.includes('CacheFirst'));
  check('SW contient NetworkFirst', swContent.includes('networkFirst') || swContent.includes('NetworkFirst'));
  check('SW gère les API', swContent.includes('/api/'));

  // 4. Validation offline.html
  console.log('\n📴 Validation offline.html:');
  const offlineContent = fs.readFileSync(path.join(ROOT, 'offline.html'), 'utf8');
  check('offline.html contient meta charset', offlineContent.includes('charset'));
  check('offline.html contient theme-color', offlineContent.includes('theme-color'));
  check('offline.html contient bouton réessayer', offlineContent.includes('Réessayer') || offlineContent.includes('reload'));

  // 5. Validation app.html
  console.log('\n🖥️ Validation app.html:');
  const appContent = fs.readFileSync(path.join(ROOT, 'app.html'), 'utf8');
  check('app.html enregistre ServiceWorker', appContent.includes('serviceWorker.register'));
  check('app.html contient link manifest', appContent.includes('manifest.json'));
  check('app.html contient apple-mobile-web-app', appContent.includes('apple-mobile-web-app-capable'));
  check('app.html contient viewport-fit=cover', appContent.includes('viewport-fit=cover'));
  check('app.html contient og:title', appContent.includes('og:title'));

  // 6. Vérification du serveur (démarrage rapide)
  console.log('\n🌐 Test serveur:');
  let serverStarted = false;
  try {
    const { server } = require(SERVER_SCRIPT);
    server.listen(PORT, '0.0.0.0', async () => {
      serverStarted = true;
      const baseUrl = `http://localhost:${PORT}`;

      // Tester les endpoints
      const testRoutes = [
        ['/app.html', 200, 'App shell'],
        ['/offline.html', 200, 'Page offline'],
        ['/manifest.json', 200, 'Manifest'],
        ['/sw.js', 200, 'Service Worker'],
        ['/api/state', 200, 'API state'],
      ];

      for (const [route, expectedStatus, label] of testRoutes) {
        try {
          const res = await fetchUrl(baseUrl, route);
          check(`${label} (${route}) → ${expectedStatus}`, res.status === expectedStatus, `Reçu ${res.status}`);
        } catch (e) {
          check(`${label} (${route}) → ${expectedStatus}`, false, e.message);
        }
      }

      // Rapport final
      console.log('\n' + '═'.repeat(50));
      const total = passes + failures;
      console.log(`\n📊 Résultat: ${passes}/${total} tests OK (${Math.round(passes/total*100)}%)`);
      if (failures === 0) {
        console.log('✅ PWA prête pour le déploiement !');
      } else {
        console.log(`⚠️ ${failures} problème(s) détecté(s)`);
      }

      server.close(() => process.exit(failures > 0 ? 1 : 0));
    });
  } catch (e) {
    console.log(`  ✗ Erreur serveur: ${e.message}`);
    process.exit(1);
  }

  // Timeout de sécurité
  setTimeout(() => {
    if (!serverStarted) {
      console.log('  ✗ Timeout: le serveur n\'a pas démarré');
      process.exit(1);
    }
  }, 10000);
})();
