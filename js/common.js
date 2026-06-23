/* common.js – utilities used across the ERP demo */

// Toast helper – displays a temporary message
window.showToast = function(msg) {
  const existing = document.querySelector('.custom-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'custom-toast fixed bottom-24 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg z-[9999] font-bold text-sm animate-bounce';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

// Simple hash for PIN (not cryptographically secure – demo only)
window.hashPin = function(pin) {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer
  }
  return hash;
};

// Authentication check – redirects to login if not authenticated
window.ensureAuth = function() {
  const auth = sessionStorage.getItem('erp_authenticated');
  if (auth !== 'true') {
    window.location.href = '../auth/login.html';
    return false;
  }
  return true;
};

// Role handling – returns current role or defaults to 'owner'
window.getCurrentRole = function() {
  const saved = sessionStorage.getItem('erp_role');
  return saved ? saved : 'owner';
};

// Apply role‑based visibility to module cards (used on index.html)
window.applyRoleFilter = function() {
  const role = document.getElementById('roleSwitcher')?.value || window.getCurrentRole();
  sessionStorage.setItem('erp_role', role);
  const permissions = {
    caissier: ['Interface POS'],
    manager: ['Interface POS', 'Gestion Stocks', 'Gestionnaire Boutique', 'Clôture Caisse', 'Fournisseurs & Achats', 'Audit Inventaire', 'Carnet de Dettes', 'Assistant Virtuel'],
    owner: null // all modules visible
  };
  const allowed = permissions[role];
  const cards = document.querySelectorAll('.module-card');
  cards.forEach(card => {
    const title = card.querySelector('h2')?.innerText.trim();
    if (!title) return;
    if (allowed === null || allowed.includes(title)) {
      card.classList.remove('hidden-by-role');
    } else {
      card.classList.add('hidden-by-role');
    }
  });
};

// Simple mock data generator for KPI dashboards
window.mockKPI = function() {
  return {
    caJour: (Math.random() * 20000 + 5000).toFixed(0),
    caMois: (Math.random() * 200000 + 50000).toFixed(0),
    profit: (Math.random() * 80000 + 20000).toFixed(0),
    ventes: Math.floor(Math.random() * 1500 + 500),
    stockCritique: Math.floor(Math.random() * 30 + 5)
  };
};

// Save entire sessionStorage to JSON (used in backup page)
window.exportSession = function() {
  const data = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    data[key] = sessionStorage.getItem(key);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'erp_backup_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
};

// Import JSON into sessionStorage (used in backup page)
window.importSession = function(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const obj = JSON.parse(e.target.result);
      Object.entries(obj).forEach(([k, v]) => sessionStorage.setItem(k, v));
      window.showToast('✅ Backup importé avec succès');
    } catch (err) {
      window.showToast('⚠️ Erreur lors de l\'import du backup');
    }
  };
  reader.readAsText(file);
};
