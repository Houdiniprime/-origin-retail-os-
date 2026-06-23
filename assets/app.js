(function () {
  "use strict";

  const STORE_KEY = "origin_retail_os_state_v3";
  const FCFA = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 });
  function getShops() {
    return [state.settings?.boutique || "Ma boutique"];
  }
  function getCategories() {
    if (!state) return ["Meshes", "Accessoires", "Packaging"];
    return state.settings?.categories?.length ? state.settings.categories : ["Meshes", "Accessoires", "Packaging"];
  }
  const ROLE_LABELS = { super: "Super User", owner: "Proprietaire", manager: "Gerante", cashier: "Caissiere" };
  const ACCESS = {
    super: ["dashboard", "pos", "operations", "stock", "suppliers", "clients", "reports", "settings", "ai", "orders", "expenses", "promotions", "users"],
    owner: ["dashboard", "pos", "operations", "stock", "suppliers", "clients", "reports", "settings", "ai", "orders", "expenses", "promotions", "users"],
    manager: ["dashboard", "pos", "operations", "stock", "suppliers", "clients", "reports", "ai", "orders", "expenses", "promotions"],
    cashier: ["pos", "operations", "stock", "clients", "ai", "expenses"]
  };
  const USERS = [
    { id: "super", name: "Super User", role: "super", code: "0000", shop: "all", email: "super@originretail.com", phone: "+237600000000" },
    { id: "owner", name: "Proprietaire", role: "owner", code: "9000", shop: "all", email: "proprietaire@originretail.com", phone: "+237600000001" },
    { id: "gm", name: "Gerante", role: "manager", code: "2201", shop: "all", email: "gerante@originretail.com", phone: "+237600000002" },
    { id: "cm1", name: "Caissiere 1", role: "cashier", code: "1101", shop: "all", phone: "+237600000004" },
    { id: "cm2", name: "Caissiere 2", role: "cashier", code: "1102", shop: "all", phone: "+237600000005" },
    { id: "cp1", name: "Caissiere 3", role: "cashier", code: "1201", shop: "all", phone: "+237600000006" },
    { id: "cp2", name: "Caissiere 4", role: "cashier", code: "1202", shop: "all", phone: "+237600000007" }
  ];
  const ICONS = {
    dashboard: "fa-gauge-high", pos: "fa-cash-register", operations: "fa-arrows-rotate",
    stock: "fa-boxes-stacked", clients: "fa-users", reports: "fa-chart-simple",    settings: "fa-gear", ai: "fa-robot", orders: "fa-clipboard-list", returns: "fa-arrow-left", transfers: "fa-arrows-left-right",
    expenses: "fa-money-bill-wave", promotions: "fa-tags", users: "fa-user-gear", search: "fa-magnifying-glass"
  };
  const nav = [
    ["dashboard", "Dashboard"],
    ["pos", "Caisse POS"],
    ["operations", "Operations"],
    ["stock", "Stocks"],
    ["suppliers", "Fournisseurs"],
    ["clients", "Clients & dettes"],
    ["reports", "Rapports"],
    ["ai", "Assistant IA"],
    ["orders", "Commandes"],
    ["expenses", "Depenses"],
    ["promotions", "Promotions"],
    ["users", "Utilisateurs"],
    ["settings", "Parametres"]
  ];
  const seed = {
    auth: null,
    theme: "light",
    settings: { boutique: "Origin Retail", gmail: "boutique@example.com", users: USERS, lowStock: 5, shops: ["Origin Retail"],
      categories: ["Meshes", "Accessoires cheveux", "Accessoires cosmetiques", "Packaging", "Bijoux", "Soins visage", "Parfums"] },
    products: [],
    clients: [],
    loyaltyTiers: ["Bronze", "Argent", "Or", "Platine"],
    loyaltyPoints: 0,
    transferHistory: [],
    reportSchedule: null,
    orders: [],
    suppliers: [],
    purchaseOrders: [],
    expenses: [],
    shifts: [],
    closures: [],
    sales: [],
    cart: [],
    audit: [],
    notifications: []
  };

  let state = load();
  let active = state.auth?.role === "cashier" ? "pos" : "dashboard";
  let filter = "";
  let shopFilter = "all"; // conservé pour compatibilité
  let orderFilter = "all";
  let clientFilter = "";
  let supplierFilter = "";
  let catFilter = "all";
  let dateFrom = "";
  let dateTo = "";

  function uid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`; }
  function money(v) { return FCFA.format(Number(v || 0)); }
  function esc(v) { return String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])); }
  function firstName(name) { return String(name || "").trim().split(/\s+/)[0] || "vous"; }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? migrate(JSON.parse(raw)) : structuredClone(seed);
    } catch { return structuredClone(seed); }
  }
  function migrate(data) {
    const next = { ...structuredClone(seed), ...data };
    next.settings = { ...seed.settings, ...(data.settings || {}) };
    next.settings.users = next.settings.users?.length ? next.settings.users : USERS;
    next.cart = next.cart || [];
    next.audit = next.audit || [];
    next.notifications = next.notifications || [];
    next.theme = next.theme || "light";
    next.transferHistory = next.transferHistory || [];
    next.reportSchedule = next.reportSchedule || null;
    next.orders = next.orders || [];
    next.expenses = next.expenses || [];
    next.promos = next.promos || [];
    (next.products || []).forEach(p => { if (p.promoPrice === undefined) p.promoPrice = 0; });
    (next.settings || {}).currency = next.settings?.currency || 'XAF';
    (next.settings || {}).logo = next.settings?.logo || '';
    (next.settings || {}).autoBackup = next.settings?.autoBackup || false;
    (next.settings || {}).reportSchedule = next.settings?.reportSchedule || null;
    (next.settings || {}).themeColor = next.settings?.themeColor || '#131921';
    (next.purchaseOrders || []).forEach(o => { if (o.status2 === undefined) o.status2 = 'pending'; });
    delete next.promos;
    (next.settings || {}).dashWidgets = next.settings?.dashWidgets || ['ca','marge','stock','credits'];
    (next.settings || {}).autoBackup = next.settings?.autoBackup || false;
    (next.settings || {}).backupInterval = next.settings?.backupInterval || 5;
    (next.settings || {}).lastBackup = next.settings?.lastBackup || null;
    (next.settings || {}).themeColor = next.settings?.themeColor || '#131921';
    (next.settings || {}).logoText = next.settings?.logoText || 'OR';
    (next.settings || {}).boutique = next.settings?.boutique || 'Origin Retail OS';
    (next.settings || {}).shops = next.settings?.shops?.length ? next.settings.shops : ["Origin Retail"];
    (next.settings || {}).categories = next.settings?.categories?.length ? next.settings.categories : ["Meshes", "Accessoires", "Packaging"];
    (next.clients || []).forEach(c => { if (c.points === undefined) c.points = 0; });
    return next;
    }
  /* ─────────── P7.1: Sync serveur pour persistance ─────────── */
  function syncFromServer(force, silent) {
    fetch('/api/state').then(r=>r.json()).then(data => {
      if (!data.ok || !data.state) return;
      const srv = data.state;
      state.settings.lastSync = Date.now();
      state.settings.serverSyncedAt = srv.serverSyncedAt || null;
      // Préserver la session active et le panier (propres à chaque téléphone)
      const currentAuth = state.auth;
      const currentCart = state.cart;
      // Toujours fusionner les données du serveur (produits, clients, ventes)
      // pour que tous les téléphones soient synchronisés
      const hasServerData = srv.products?.length || srv.clients?.length || srv.sales?.length;
      if (force || hasServerData) {
        const merged = {
          products: srv.products || state.products,
          clients: srv.clients || state.clients,
          sales: srv.sales || state.sales,
          suppliers: srv.suppliers || state.suppliers,
          purchaseOrders: srv.purchaseOrders || state.purchaseOrders,
          orders: srv.orders || state.orders,
          expenses: srv.expenses || state.expenses,
          closures: srv.closures || state.closures,
          shifts: srv.shifts || state.shifts,
          audit: srv.audit || state.audit,
          transferHistory: srv.transferHistory || state.transferHistory,
          notifications: srv.notifications || state.notifications
        };
        Object.assign(state, migrate({ ...srv, ...merged }));
        // Restaurer session et panier (propres à ce téléphone)
        state.auth = currentAuth;
        state.cart = currentCart || [];
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        if (!silent) {
          const hasData = srv.products?.length || srv.clients?.length || srv.sales?.length;
          if (hasData) toast('Donnees synchronisees');
          render();
        }
      }
    }).catch(() => {});
  }
  /* ─────────── P7.4: Notifications récurrentes ─────────── */
  function checkDailyReminders() {
    if (!state.auth) return;
    const todayClosed = state.closures?.some(cl => new Date(cl.at).toDateString() === new Date().toDateString());
    if (!todayClosed && state.sales?.length > 0) {
      addNotification('Rappel cloture', 'Pensez a clore la caisse aujourd\'hui avant de partir.');
      save();
    }
    if (state.clients?.filter(c => c.balance > 0).length > 0) {
      const debtors30 = state.clients.filter(c => c.balance > 0 && c.balance > 10000);
      if (debtors30.length) {
        addNotification('Relance dette', `${debtors30.length} clients ont des dettes > 10 000 FCFA.`);
        save();
      }
    }
  }
  let _savePending = false;
  function save(message) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    if (!_savePending) {
      _savePending = true;
      fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) })
        .then(() => { _savePending = false; })
        .catch(() => { _savePending = false; });
    }
    if (message) toast(message);
  }
  function toast(message) {
    document.querySelector(".toast")?.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
  function audit(action, detail) {
    state.audit.unshift({ id: uid("a"), at: new Date().toISOString(), user: state.auth?.name || "system", action, detail });
    state.audit = state.audit.slice(0, 120);
  }
  function can(screen) { return ACCESS[state.auth?.role || "owner"].includes(screen); }
  function scopedProducts() { return state.products.filter((p) => (p.name + p.sku + p.category).toLowerCase().includes(filter.toLowerCase()) && (catFilter === "all" || p.category === catFilter)); }
  function metrics() {
    const salesTotal = state.sales.reduce((s, v) => s + v.total, 0);
    const margin = state.sales.reduce((s, sale) => s + sale.items.reduce((x, i) => x + (i.price - i.cost) * i.qty, 0), 0);
    const stockValue = state.products.reduce((s, p) => s + p.cost * p.qty, 0);
    const debt = state.clients.reduce((s, c) => s + Number(c.balance || 0), 0);
    return { salesTotal, margin, stockValue, debt };
  }
  function getFilteredSales() {
    let filtered = state.sales;
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0,0,0,0);
      filtered = filtered.filter(s => new Date(s.at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23,59,59,999);
      filtered = filtered.filter(s => new Date(s.at) <= to);
    }
    return filtered;
  }

  let _startupDone = false;
  function render() {
    const app = document.getElementById("app");
    if (!state.auth) {
      app.innerHTML = loginView();
      bindLogin();
      return;
    }
    if (!getShops().length) {
      app.innerHTML = wizardView();
      bindWizard();
      return;
    }
    if (!can(active)) active = ACCESS[state.auth.role][0];
    app.innerHTML = shell();
    bindGlobal();
    bindScreen();
    if (!_startupDone) {
      _startupDone = true;
      setTimeout(() => { syncFromServer(true); checkDailyReminders(); }, 200);
      // Sync automatique toutes les 15 secondes pour multi-smartphone
      setInterval(() => { if (state.auth) syncFromServer(false, true); }, 15000);
    }
  }

  function loginView() {
    const ls = state.settings.loginBgStyle || 'dark';
    const bgMap = { dark: 'linear-gradient(110deg,rgba(19,25,33,.98),rgba(35,47,62,.92))', purple: 'linear-gradient(135deg,#1e1b4b,#4c1d95,#7c3aed)', blue: 'linear-gradient(135deg,#0c4a6e,#0369a1,#0ea5e9)', green: 'linear-gradient(135deg,#064e3b,#047857,#10b981)', warm: 'linear-gradient(135deg,#78350f,#b45309,#f59e0b)' };
    const bgGrad = bgMap[ls] || bgMap.dark;
    const welcome = state.settings.loginWelcomeText || 'Caisse intelligente, stock, dettes, cloture, rapports et acces distant.';

    const loginTab = state._loginTab || 'login';
    const attempts = state._loginAttempts || 0;
    const locked = state._loginLockedUntil && Date.now() < state._loginLockedUntil;
    const lockedMsg = state._loginLockedUntil ? Math.ceil((state._loginLockedUntil - Date.now())/1000) + 's' : '';
    return '<main class="login-page"><section class="login-card">' +
      '<div class="login-brand"><div class="login-mark">OR</div><div><strong>Origin Retail OS</strong><span>ERP boutique intelligent</span></div></div>' +
      '<div class="login-tabs"><button class="login-tab ' + (loginTab === 'login' ? 'active' : '') + '" data-login-tab="login"><i class="fa-solid fa-right-to-bracket"></i> Connexion</button><button class="login-tab ' + (loginTab === 'register' ? 'active' : '') + '" data-login-tab="register"><i class="fa-solid fa-user-plus"></i> Nouveau compte</button></div>' +
      (loginTab === 'login' ? (
        '<form id="loginForm">' +
        (locked ? '<div class="login-locked"><i class="fa-solid fa-lock"></i> Trop de tentatives. Reessayez dans ' + lockedMsg + '</div>' : '') +
        '<label>Email ou Telephone<input name="identifier" type="text" placeholder="email@exemple.com ou +237XXXXXXXXX" required' + (locked ? ' disabled' : '') + '></label>' +
        '<label>Code d\'acces ou mot de passe<input name="password" type="password" placeholder="Votre code PIN ou mot de passe" required' + (locked ? ' disabled' : '') + '></label>' +
        (attempts > 0 ? '<p style="color:var(--bad);font-size:12px;margin:4px 0">Tentative ' + attempts + '/5</p>' : '') +
        '<button class="btn primary full"' + (locked ? ' disabled' : '') + '><i class="fa-solid fa-right-to-bracket"></i> Se connecter</button>' +
        '<p style="text-align:center;margin:8px 0 0"><button type="button" class="btn-link" onclick="showForgotPassword()" style="background:none;border:0;color:var(--accent);font-weight:700;cursor:pointer;font-size:13px;text-decoration:underline"><i class="fa-solid fa-key"></i> Mot de passe oublie ?</button></p>' +
        '</form>'
      ) : (
        '<form id="registerForm">' +
        '<label>Nom complet<input name="name" placeholder="Votre nom" required></label>' +
        '<div class="grid two"><label>Email<input name="email" type="email" placeholder="email@exemple.com"></label><label>Telephone<input name="phone" type="tel" placeholder="+237XXXXXXXXX"></label></div>' +
        '<label>Role<select name="role" required>' +
          Object.entries(ROLE_LABELS).filter(([k]) => k !== 'super').map(function(kv) {
            var k = kv[0], v = kv[1];
            return '<option value="' + esc(k) + '">' + esc(v) + '</option>';
          }).join('') +
        '</select></label>' +
        '<div class="grid two"><label>Mot de passe<input name="password" type="password" placeholder="Minimum 4 caracteres" required minlength="4"></label><label>Confirmer<input name="confirm" type="password" placeholder="Confirmer le mot de passe" required minlength="4"></label></div>' +
        '<button class="btn primary full"><i class="fa-solid fa-user-plus"></i> Creer mon compte</button>' +
        '</form>'
      )) +
    '</section><section class="login-aside"><h1>Origin Retail OS</h1><p>Caisse intelligente, stock, dettes, cloture, rapports et acces distant. Connectez-vous avec votre email ou telephone.</p></section></main>';
  }
  function bindLogin() {
    // Tab switching
    document.querySelectorAll('[data-login-tab]').forEach(function(b) {
      b.addEventListener('click', function() {
        state._loginTab = b.dataset.loginTab;
        state._registerRole = state._registerRole || 'manager';
        render();
      });
    });
    // Role change in register form shows/hides shop field
    var roleSel = document.querySelector('#registerForm [name="role"]');
    if (roleSel) {
      roleSel.addEventListener('change', function() {
        state._registerRole = roleSel.value;
        var shopField = document.querySelector('.register-shop-field');
        if (shopField) shopField.style.display = roleSel.value === 'cashier' ? 'none' : 'block';
      });
    }
    // Login form submit
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Check lockout
        if (state._loginLockedUntil && Date.now() < state._loginLockedUntil) {
          var secs = Math.ceil((state._loginLockedUntil - Date.now())/1000);
          return toast('Trop de tentatives. Reessayez dans ' + secs + 's');
        }
        var data = Object.fromEntries(new FormData(e.currentTarget));
        var identifier = (data.identifier || '').trim().toLowerCase();
        var password = data.password || '';
        if (!identifier) return toast('Entrez votre email ou telephone');
        if (!password) return toast('Entrez votre code ou mot de passe');
        // Find user by email, phone, or direct code match
        var user = state.settings.users.find(function(u) {
          return (u.email && u.email.toLowerCase() === identifier) ||
                 (u.phone && u.phone.replace(/[\s\-]/g,'') === identifier.replace(/[\s\-]/g,'')) ||
                 u.code === identifier;
        });
        if (!user) {
          state._loginAttempts = (state._loginAttempts || 0) + 1;
          if (state._loginAttempts >= 5) {
            state._loginLockedUntil = Date.now() + 30000;
            state._loginAttempts = 0;
            save(); render();
            return toast('Trop de tentatives. Reessayez dans 30s');
          }
          save(); render();
          return toast('Identifiant ou mot de passe incorrect (tentative ' + state._loginAttempts + '/5)');
        }
        // Verify password: check code (for existing users) OR stored password (for registered users)
        var pwOk = user.code === password || (user.password && user.password === btoa(password));
        if (!pwOk) {
          state._loginAttempts = (state._loginAttempts || 0) + 1;
          if (state._loginAttempts >= 5) {
            state._loginLockedUntil = Date.now() + 30000;
            state._loginAttempts = 0;
            save(); render();
            return toast('Trop de tentatives. Reessayez dans 30s');
          }
          save(); render();
          return toast('Identifiant ou mot de passe incorrect (tentative ' + state._loginAttempts + '/5)');
        }
        // Success
        state._loginAttempts = 0;
        state._loginLockedUntil = null;
        state.auth = { ...user, at: new Date().toISOString() };
        shopFilter = 'all';
        active = user.role === 'cashier' ? 'pos' : 'dashboard';
        audit('Connexion', user.name);
        save();
        render();
        toast('Bienvenue ' + firstName(user.name));
      });
    }
    // Register form submit
    var regForm = document.getElementById('registerForm');
    if (regForm) {
      regForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var data = Object.fromEntries(new FormData(e.currentTarget));
        // Validate
        if (!data.name || !data.password) return toast('Nom et mot de passe requis');
        if (data.password.length < 4) return toast('Mot de passe: minimum 4 caracteres');
        if (data.password !== data.confirm) return toast('Les mots de passe ne correspondent pas');
        if (!data.email && !data.phone) return toast('Email ou telephone requis');
        // Check uniqueness
        if (data.email && state.settings.users.some(function(u) { return u.email && u.email.toLowerCase() === data.email.toLowerCase(); })) {
          return toast('Cet email est deja utilise');
        }
        if (data.phone && state.settings.users.some(function(u) { return u.phone && u.phone.replace(/[\s\-]/g,'') === data.phone.replace(/[\s\-]/g,''); })) {
          return toast('Ce telephone est deja utilise');
        }
        // Create user
        var newId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
        state.settings.users.push({
          id: newId,
          name: data.name,
          role: data.role || 'cashier',
          code: Math.floor(1000 + Math.random()*9000).toString(),
          shop: 'all',
          email: data.email || '',
          phone: data.phone || '',
          password: btoa(data.password),
          createdAt: new Date().toISOString()
        });
        // Auto-login
        var newUser = state.settings.users.find(function(u) { return u.id === newId; });
        state._loginTab = 'login';
        state._loginAttempts = 0;
        state.auth = { ...newUser, at: new Date().toISOString() };
        shopFilter = 'all';
        active = newUser.role === 'cashier' ? 'pos' : 'dashboard';
        audit('Inscription', newUser.name);
        save();
        render();
        toast('Bienvenue ' + firstName(newUser.name) + ' ! Compte cree avec succes.');
      });
    }
  }
function saveSmtpConfig() {
  var host = document.getElementById('smtpHost')?.value;
  var port = parseInt(document.getElementById('smtpPort')?.value) || 587;
  var user = document.getElementById('smtpUser')?.value;
  var pass = document.getElementById('smtpPass')?.value;
  if (!state.settings.smtp) state.settings.smtp = {};
  state.settings.smtp.host = host;
  state.settings.smtp.port = port;
  state.settings.smtp.user = user;
  state.settings.smtp.pass = pass;
  state.settings.smtp.secure = port === 465;
  save('Configuration SMTP enregistree'); render();
}
function showForgotPassword() {
  var panel = document.createElement('div');
  panel.className = 'modal-overlay';
  panel.innerHTML = '<div class="modal-box" style="max-width:400px"><h2><i class="fa-solid fa-key"></i> Mot de passe oublie</h2>' +
    '<p style="color:var(--muted);margin-bottom:12px">Entrez votre email ou telephone pour reinitialiser votre mot de passe.</p>' +
    '<form id="resetPwdForm">' +
    '<label>Email ou telephone<input name="resetId" type="text" placeholder="email@exemple.com ou +237XXXXXXXXX" required></label>' +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
    '<button class="btn primary full"><i class="fa-solid fa-paper-plane"></i> Envoyer</button>' +
    '<button type="button" class="btn full" data-close>Fermer</button></div></form>' +
    '<div id="resetResult" style="margin-top:12px"></div></div>';
  document.body.appendChild(panel);
  panel.querySelector('[data-close]')?.addEventListener('click', function() { panel.remove(); });
  panel.addEventListener('click', function(e) { if (e.target === panel) panel.remove(); });
  panel.querySelector('#resetPwdForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    var data = Object.fromEntries(new FormData(e.currentTarget));
    var id = (data.resetId || '').trim().toLowerCase();
    if (!id) return toast('Entrez votre email ou telephone');
    var user = state.settings.users.find(function(u) {
      return (u.email && u.email.toLowerCase() === id) ||
             (u.phone && u.phone.replace(/[\s\-]/g,'') === id.replace(/[\s\-]/g,''));
    });
    var resultDiv = document.getElementById('resetResult');
    if (!user) {
      resultDiv.innerHTML = '<p style="color:var(--bad);font-weight:700">Aucun compte trouve avec cet identifiant.</p>';
      return;
    }
    var tempPwd = Math.floor(1000 + Math.random()*9000).toString();
    user.password = btoa(tempPwd);
    user.code = tempPwd;
    save();
    resultDiv.innerHTML = '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;text-align:center">' +
      '<p style="color:var(--good);font-weight:700;margin:0 0 8px"><i class="fa-solid fa-check-circle"></i> Mot de passe reinitialise !</p>' +
      '<p style="font-size:13px;color:var(--muted);margin:0 0 4px">Votre nouveau code temporaire :</p>' +
      '<p style="font-size:28px;font-weight:900;letter-spacing:4px;color:var(--bad);margin:4px 0">' + tempPwd + '</p>' +
      '<p style="font-size:12px;color:var(--muted);margin:8px 0 0">Utilisez ce code pour vous connecter.</p></div>';
    toast('Nouveau mot de passe genere pour ' + user.name);
    // Try to send reset email if user has email
    if (user.email) {
      fetch('/api/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, tempPwd: tempPwd, name: user.name })
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.sent) toast('Email envoye a ' + user.email);
        else if (data.msg) toast(data.msg);
      }).catch(function() {});
    }
    // Try to send via WhatsApp if user has phone
    if (user.phone) {
      fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, text: "Origin Retail OS - Votre nouveau code temporaire: " + tempPwd })
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.sent) toast('WhatsApp envoye a ' + user.phone);
      }).catch(function() {});
    }
  });
}

  
  window.showForgotPassword = showForgotPassword;
  window.showShopManager = showShopManager;
  window.showCategoryManager = showCategoryManager;
  window.saveLoginTheme = saveLoginTheme;
  window.saveSmtpConfig = saveSmtpConfig;
function notifyCount() {
    const n = (state.notifications || []).filter((x) => !x.read).length;
    return n > 0 ? `<span class="notif-badge">${n > 99 ? '99+' : n}</span>` : '';
  }
  function syncIcon() {
    const ls = state.settings?.lastSync;
    if (!ls) return '<i class="fa-solid fa-cloud" style="color:var(--muted)" title="Non synchronise"></i>';
    const ago = Math.round((Date.now()-ls)/60000);
    return `<i class="fa-solid ${ago < 5 ? 'fa-cloud-check' : 'fa-cloud'}" style="color:${ago < 5 ? 'var(--good)' : 'var(--accent)'};margin-right:4px" title="Sync il y a ${ago} min"></i>`;
  }
  function shell() {
    const mainNav = nav.filter(([k]) => can(k));
    const mobileItems = ['pos','dashboard','stock','clients','settings'].filter(k => can(k));
    return `<div class="app-shell" data-theme="${state.theme || 'light'}">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">OR</div><div><strong>Origin Retail OS</strong><span>${esc(state.auth.name)} / ${esc(ROLE_LABELS[state.auth.role])}</span></div></div>
        <nav>${mainNav.map(([k, label]) => `<button class="nav-item ${active === k ? "active" : ""}" data-nav="${k}"><i class="fa-solid ${ICONS[k]}"></i><span>${esc(label)}</span></button>`).join("")}</nav>
        <div class="sidebar-footer">
          <button class="nav-item" data-action="theme-toggle"><i class="fa-solid ${state.theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i><span>${state.theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span></button>
        </div>
      </aside>
      <main>
        <header class="topbar"><div><h1>${title()}</h1><p>${subtitle()}</p></div><div class="actions">
          <button class="btn-icon notif-btn" data-action="notifications" title="Notifications"><i class="fa-solid fa-bell"></i>${notifyCount()}</button>
          <button class="btn sm" data-action="sync-now">${syncIcon()} Sync</button>
          <button class="btn sm" data-action="backup"><i class="fa-solid fa-download"></i> Backup</button>
          <button class="btn bad" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i> Quitter</button>
        </div></header>
        <section class="content">${screen()}</section>
      </main>
      <nav class="mobile-bottom-nav">${mobileItems.map(k => {
        const label = nav.find(([id]) => id === k)?.[1] || k;
        const icon = ICONS[k] || 'fa-circle';
        return `<button class="nav-item ${active === k ? 'active' : ''}" data-nav="${k}"><i class="fa-solid ${icon}"></i><span>${esc(label)}</span></button>`;
      }).join('')}</nav>
    </div>`;
  }
  function title() { return nav.find(([k]) => k === active)?.[1] || "Dashboard"; }
  function subtitle() {
    return { dashboard: "Pilotage boutique", pos: "Vente cash, mobile money, credit, prix special", operations: "Ouverture et cloture caisse", stock: "Inventaire et photos produit", suppliers: "Fournisseurs et commandes", clients: "Dettes et relances", reports: "Exports et audit", ai: "Assistant intelligent pour votre boutique",    orders: "Precommandes et reservations clients",
    expenses: "Saisie et suivi des depenses",
    promotions: "Soldes, prix promo et offres",
    users: "Gestion des utilisateurs et acces",
    settings: "Comptes et configuration" }[active] || "";
  }
  function screen() {
    return { dashboard: dashboardView, pos: posView, operations: operationsView, stock: stockView, suppliers: suppliersView, clients: clientsView, reports: reportsView, ai: aiView,    orders: ordersView, expenses: expensesView, promotions: promotionsView, users: usersView, settings: settingsView }[active]();
  }
  function bindGlobal() {
    document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => { active = b.dataset.nav; render(); }));
    document.querySelectorAll("[data-action]").forEach((b) => b.addEventListener("click", () => handleAction(b.dataset.action)));
  }
  function handleAction(action) {
    if (action === "logout") {
      const name = state.auth.name;
      audit("Deconnexion", name);
      state.auth = null;
      save();
      render();
      toast(`Aurevoir ${name}`);
    }
    if (action === "backup") download(`origin_retail_backup_${Date.now()}.json`, JSON.stringify(state, null, 2), "application/json");
    if (action === "clear-cart") { state.cart = []; save("Panier vide"); render(); }
    if (action === "open-shift") openShift();
    if (action === "checkout") checkout();
    if (action === "export-sales") download("ventes.csv", csv([["date", "client", "methode", "total"], ...state.sales.map((s) => [s.at, s.clientName, s.method, s.total])]), "text/csv");
    if (action === "theme-toggle") {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      save(state.theme === 'dark' ? 'Mode sombre active' : 'Mode clair active');
      render();
    }
    if (action === "notifications") showNotifications();
    if (action === "clear-notifs") {
      (state.notifications || []).forEach(n => n.read = true);
      save('Notifications marquees comme lues');
      render();
    }
    if (action === "print-receipt") printReceipt();
    if (action === "export-debts") download("debiteurs.csv", csv([["nom","telephone","solde"], ...state.clients.filter(c=>c.balance>0).map(c=>[c.name,c.phone,c.balance])]), "text/csv");
    if (action === "report-day") generateReport('jour');
    if (action === "report-week") generateReport('semaine');
    if (action === "report-month") generateReport('mois');
    if (action === "new-order") showNewOrderModal();
    if (action === "new-expense") showNewExpenseModal();
    if (action === "new-promo") showNewPromoModal();
    if (action === "new-user") showNewUserModal();
    if (action === "voir-plus-sales") { salesLimit += 50; render(); }
    if (action === "voir-plus-audit") { auditLimit += 50; render(); }
    if (action === "global-search") showGlobalSearch();
    if (action === "customize-dash") showDashCustomizeModal();
    if (action === "filter-dates") {
      dateFrom = document.getElementById('dateFrom')?.value || '';
      dateTo = document.getElementById('dateTo')?.value || '';
      render();
    }
    if (action === "filter-dash-dates") {
      dateFrom = document.getElementById('dashDateFrom')?.value || '';
      dateTo = document.getElementById('dashDateTo')?.value || '';
      render();
    }
    if (action === "reset-dash-dates") {
      dateFrom = '';
      dateTo = '';
      render();
    }
    if (action === "set-dep-rate") {
      const v = Number(document.getElementById('depRate')?.value) || 10;
      state.settings.depreciationRate = Math.max(0, Math.min(100, v));
      save("Taux d\u2019amortissement " + state.settings.depreciationRate + "%");
      render();
    }
    if (action === "sync-now") { toast('Sync en cours...'); syncFromServer(true); }
    if (action === "return-sale") { showReturnModal(document.activeElement?.dataset?.saleId); }
    if (action === "new-transfer") { showTransferModal(); }
    if (action === "do-inventory") { showInventoryModal(); }
    // toggle-widget unused — dashboard customization uses customize-dash modal
  }

  function dashboardView() {
    const m = metrics();
    const low = state.products.filter((p) => p.qty <= state.settings.lowStock);
    const last30 = state.sales.filter(s => Date.now() - new Date(s.at).getTime() < 30*86400000);
    const prevMonth = new Date(); prevMonth.setMonth(prevMonth.getMonth()-1);
    const prevSales = state.sales.filter(s => new Date(s.at).getTime() < prevMonth.getTime() && new Date(s.at).getTime() > new Date(prevMonth.getTime()-30*86400000).getTime());
    const prevTotal = prevSales.reduce((s,v) => s+v.total, 0);
    const evo = prevTotal > 0 ? Math.round((m.salesTotal - prevTotal) / prevTotal * 100) : 0;
    const evoClass = evo >= 0 ? 'evo-up' : 'evo-down';
    const widgets = state.settings.dashWidgets || ['ca','marge','stock','credits'];
    const widgetMap = {
      ca: metric("Chiffre d'affaires", money(m.salesTotal), `<span class="${evoClass}">${evo >= 0 ? '▲' : '▼'} ${Math.abs(evo)}% vs mois prec.</span>`),
      marge: metric("Marge brute", money(m.margin), `<span>${((m.margin/(m.salesTotal||1))*100).toFixed(1)}% de marge</span>`),
      stock: metric("Stock valorise", money(m.stockValue), `${state.products.reduce((s,p) => s+p.qty,0)} unites`),
      credits: metric("Credits clients", money(m.debt), `${state.clients.filter(c=>c.balance>0).length} debiteurs`),
      depenses: metric("Depenses", money(state.expenses.reduce((s,e) => s+e.amount, 0)), `${state.expenses.length} ecritures`),
      caMo: metric("CA 30j", money(last30.reduce((s,v) => s+v.total, 0)), `${last30.length} ventes`)
    };
    return `<section class="hero"><h2>Direction commerciale boutique</h2><p>Tout est horodate: ventes, stock, dettes, clotures et actions utilisateurs. <button class="btn sm" data-action="customize-dash" style="margin-left:8px"><i class="fa-solid fa-sliders"></i> Personnaliser</button></p></section>
      <div class="kpis">${widgets.map(w => widgetMap[w] || '').join('')}</div>
      <div class="stats-bar">${['ca','marge','stock','credits'].map(k => {
        const cur = {ca: m.salesTotal, marge: m.margin, stock: m.stockValue, credits: m.debt}[k];
        const prevMargeCalc = prevSales.reduce((s, sale) => s + sale.items.reduce((x, i) => x + (i.price - i.cost) * i.qty, 0), 0);
        const prev = {ca: prevTotal, marge: prevMargeCalc, stock: 0, credits: 0}[k];
        const pct = prev > 0 ? Math.round((cur - prev) / prev * 100) : 0;
        return `<div class="stat-evo ${pct >= 0 ? 'evo-up' : 'evo-down'}"><b>${k === 'ca' ? 'CA' : k === 'marge' ? 'Marge' : k === 'stock' ? 'Stock' : 'Credits'}</b><span>${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}%</span></div>`;
      }).join('')}</div>
      <div class="dash-date-filter">
        <label style="font-size:12px;font-weight:700;text-transform:uppercase;margin:0;display:flex;align-items:center;gap:6px">
          <i class="fa-solid fa-calendar"></i> Du
          <input type="date" id="dashDateFrom" value="${esc(dateFrom)}" style="width:auto;min-height:36px;padding:4px 8px;margin-left:4px">
        </label>
        <label style="font-size:12px;font-weight:700;text-transform:uppercase;margin:0;display:flex;align-items:center;gap:6px">
          Au
          <input type="date" id="dashDateTo" value="${esc(dateTo)}" style="width:auto;min-height:36px;padding:4px 8px;margin-left:4px">
        </label>
        <button class="btn sm" data-action="filter-dash-dates"><i class="fa-solid fa-filter"></i> Filtrer graphiques</button>
        ${dateFrom || dateTo ? '<button class="btn sm" data-action="reset-dash-dates" style="background:var(--bad);color:#fff;border-color:var(--bad)"><i class="fa-solid fa-xmark"></i> Effacer filtre</button>' : ''}
      </div>
      <div class="charts-row"><div class="panel chart-panel"><h2><i class="fa-solid fa-chart-line"></i> Evolution ventes (30 jours)</h2><canvas id="salesChart"></canvas></div><div class="panel chart-panel"><h2><i class="fa-solid fa-chart-pie"></i> Par methode de paiement</h2><canvas id="methodChart"></canvas></div></div>
      <div class="charts-row"><div class="panel chart-panel"><h2><i class="fa-solid fa-ranking-star"></i> Top produits vendus</h2><canvas id="topProductsChart"></canvas></div><div class="panel chart-panel"><h2><i class="fa-solid fa-chart-simple"></i> Ventes par categorie</h2><canvas id="categoryChart"></canvas></div></div>
      <div class="charts-row"><div class="panel chart-panel"><h2><i class="fa-solid fa-chart-line"></i> Evolution par categorie (30 jours)</h2><canvas id="categoryTrendChart"></canvas></div></div>
      <div class="grid two"><section class="panel"><h2><i class="fa-solid fa-clock-rotate-left"></i> Ventes recentes</h2>${paginate(state.sales, 6).map((s) => `<div class="row"><b style="flex:1">${esc(s.clientName)}</b><span>${money(s.total)}</span><button class="btn-icon-sm" data-action="return-sale" data-sale-id="${esc(s.id)}" title="Retour"><i class="fa-solid fa-arrow-left" style="color:var(--bad)"></i></button></div>`).join("") || empty("Aucune vente")}</section>
      <section class="panel"><h2><i class="fa-solid fa-triangle-exclamation"></i> Alertes stock (${low.length})</h2>${low.length ? low.map((p) => `<div class="row alert-row"><b>${esc(p.name)}</b><span class="badge-warn">${p.qty} unites</span><small style="color:var(--muted)">Réappro: +${Math.max(state.settings.lowStock*2 - p.qty, 1)}</small></div>`).join('') : empty("Aucune alerte")}</section></div>`;
  }
  function metric(label, value, sub) { return `<article class="metric"><span>${label}</span><strong>${value}</strong>${sub ? `<small class="metric-sub">${sub}</small>` : ''}</article>`; }


  function posView() {
    const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const options = state.products.map((p) => `<option value="${esc(p.id)}">${esc(p.name)} - ${esc(p.sku)} (${p.qty})</option>`).join("");
    return `<div class="pos-layout"><section class="panel"><div class="section-title"><h2><i class="fa-solid fa-store"></i> Catalogue</h2><input placeholder="Rechercher produit..." value="${esc(filter)}" data-filter></div><div class="products">${scopedProducts().map(productCard).join("")}</div></section>
      <aside class="panel cart"><div class="section-title"><h2><i class="fa-solid fa-cart-shopping"></i> Panier</h2><button class="btn sm" data-action="clear-cart">Vider</button></div>${state.cart.length ? state.cart.map((i) => cartLine(i, options)).join("") : empty("Panier vide")}
      <div class="total"><span>Total a payer</span><strong>${money(total)}</strong></div><label>Client<select id="client"><option value="">Client comptoir</option>${state.clients.map((c) => `<option value="${esc(c.id)}">${esc(c.name)} - ${esc(c.phone)}</option>`).join("")}</select></label><label>Paiement<select id="method"><option>Cash</option><option>MTN MoMo</option><option>Orange Money</option><option>Credit client</option></select></label>
      <label class="points-option" id="pointsOption" style="display:none"><input type="checkbox" id="usePoints"> Utiliser mes points fidelite en reduction</label>
      <div class="pos-actions"><button class="btn primary full" data-action="checkout" ${!state.cart.length ? "disabled" : ""}><i class="fa-solid fa-check"></i> Valider la vente</button>
      <button class="btn full" data-action="print-receipt" ${!state.sales.length ? "disabled" : ""}><i class="fa-solid fa-print"></i> Imprimer dernier recu</button></div></aside></div>`;
  }
  function productCard(p) {
    const img = p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}" class="product-img">` : `<div class="photo">${esc(p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join(""))}</div>`;
    return `<button class="product" data-add="${esc(p.id)}" ${p.qty <= 0 ? "disabled" : ""}>${img}<strong>${esc(p.name)}</strong><small>${esc(p.sku)}</small><b>${money(p.price)}</b><small>Stock: ${p.qty}</small></button>`;
  }
  function cartKey(i) { if (!i.key) i.key = uid("cart"); return i.key; }
  function cartLine(i, options) {
    const key = cartKey(i);
    return `<div class="cart-line"><div><b>${esc(i.name)}</b><small>${money(i.price)} / piece</small>${i.mixNote ? `<small class="mix-note">${esc(i.mixNote)}</small>` : ""}${i.components?.length ? `<div class="chips">${i.components.map((c, idx) => `<span>${esc(c.name)} x${c.qty}<button data-mix-remove="${key}" data-index="${idx}">x</button></span>`).join("")}</div>` : ""}</div><div class="qty"><button data-dec="${key}">-</button><b>${i.qty}</b><button data-inc="${key}">+</button></div><div class="price-tools"><label>Prix vendu</label><input type="number" value="${i.price}" data-price="${key}"><button class="btn sm" data-price-ok="${key}">OK prix</button><strong>${money(i.price * i.qty)}</strong></div><div class="mix-tools"><select data-mix="${key}"><option value="">Ajouter couvercle / accessoire</option>${options}</select><input type="number" min="1" value="1" data-mix-qty="${key}"><button class="btn sm" data-mix-ok="${key}">Mixer</button><input placeholder="Note mix" value="${esc(i.mixNote || "")}" data-note="${key}"></div></div>`;
  }
  function bindPos() {
    document.querySelector("[data-filter]")?.addEventListener("input", (e) => { filter = e.target.value; render(); });
    document.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => addCart(b.dataset.add)));
    document.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => updateQty(b.dataset.inc, 1)));
    document.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => updateQty(b.dataset.dec, -1)));
    document.querySelectorAll("[data-price-ok]").forEach((b) => b.addEventListener("click", () => updatePrice(b.dataset.priceOk)));
    document.querySelectorAll("[data-note]").forEach((i) => i.addEventListener("change", () => { findCart(i.dataset.note).mixNote = i.value; save(); render(); }));
    document.querySelectorAll("[data-mix-ok]").forEach((b) => b.addEventListener("click", () => addMix(b.dataset.mixOk)));
    document.querySelectorAll("[data-mix-remove]").forEach((b) => b.addEventListener("click", () => { findCart(b.dataset.mixRemove).components.splice(Number(b.dataset.index), 1); save("Composant retire"); render(); }));
    /* Feature 1: Afficher option points quand client selectionne */
    document.getElementById('client')?.addEventListener('change', (e) => {
      const opt = document.getElementById('pointsOption');
      if (!opt) return;
      const c = state.clients.find(x => x.id === e.target.value);
      if (c && c.points > 0) { opt.style.display = 'flex'; } else { opt.style.display = 'none'; document.getElementById('usePoints').checked = false; }
    });
  }
  function findCart(key) { return state.cart.find((i) => cartKey(i) === key || i.id === key); }
  function addCart(id) {
    const p = state.products.find((x) => x.id === id);
    if (!p || p.qty <= 0) return toast("Stock insuffisant");
    state.cart.push({ key: uid("cart"), id: p.id, name: p.name, price: p.price, originalPrice: p.price, cost: p.cost, qty: 1, components: [], mixNote: "" });
    save(); render();
  }
  function updateQty(key, delta) {
    const line = findCart(key);
    const p = state.products.find((x) => x.id === line?.id);
    if (!line || !p) return;
    line.qty += delta;
    if (line.qty > p.qty) line.qty = p.qty;
    if (line.qty <= 0) state.cart = state.cart.filter((i) => cartKey(i) !== cartKey(line));
    save(); render();
  }
  function updatePrice(key) {
    const line = findCart(key);
    const input = document.querySelector(`[data-price="${CSS.escape(key)}"]`);
    if (!line || !input) return;
    line.price = Math.max(0, Number(input.value || 0));
    audit("Prix POS modifie", `${line.name}: ${money(line.price)}`);
    save("Prix special applique"); render();
  }
  function addMix(key) {
    const line = findCart(key);
    const select = document.querySelector(`[data-mix="${CSS.escape(key)}"]`);
    const qty = Math.max(1, Number(document.querySelector(`[data-mix-qty="${CSS.escape(key)}"]`)?.value || 1));
    const p = state.products.find((x) => x.id === select?.value);
    if (!line || !p) return toast("Choisir un accessoire a mixer");
    if (p.qty < qty) return toast(`Stock composant insuffisant: ${p.name}`);
    line.components.push({ id: p.id, name: p.name, sku: p.sku, qty, cost: p.cost });
    line.mixNote = line.mixNote || `${line.name} + ${p.name}`;
    audit("Mix POS", line.mixNote);
    save("Mix ajoute au panier"); render();
  }
  function checkout() {
    if (!state.cart.length) return;
    const client = state.clients.find((c) => c.id === document.getElementById("client").value);
    const method = document.getElementById("method").value;
    const needs = {};
    for (const item of state.cart) {
      needs[item.id] = (needs[item.id] || 0) + item.qty;
      (item.components || []).forEach((c) => { needs[c.id] = (needs[c.id] || 0) + c.qty; });
    }
    for (const [id, qty] of Object.entries(needs)) {
      const p = state.products.find((x) => x.id === id);
      if (!p || p.qty < qty) return toast(`Stock insuffisant: ${p?.name || id}`);
    }
    const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
    Object.entries(needs).forEach(([id, qty]) => { const p = state.products.find((x) => x.id === id); p.qty -= qty; });
    if (method === "Credit client") {
      if (!client) return toast("Selectionner un client pour credit");
      client.balance += total;
    }
    const items = structuredClone(state.cart).map((i) => ({ ...i, cost: i.cost + (i.components || []).reduce((s, c) => s + c.cost * c.qty, 0) / Math.max(1, i.qty) }));
    /* Feature 1: Rachat points fidelite */
    const usePoints = document.getElementById('usePoints')?.checked;
    const ptsCost = usePoints && client ? Math.min(client.points || 0, total) : 0;
    const ptsDiscount = ptsCost * 10;
    const finalTotal = total - ptsDiscount;
    if (usePoints && client) {
      client.points = (client.points || 0) - ptsCost;
      audit('Fidelite rachat', `${client.name} utilise ${ptsCost} pts (${money(ptsDiscount)} de reduction)`);
    }
    state.sales.unshift({ id: uid("v"), at: new Date().toISOString(), cashier: state.auth.name, clientName: client?.name || "Client comptoir", method, total: finalTotal, items });
    state.cart = [];
    if (client && !usePoints) {
      const pts = Math.floor(finalTotal / 1000);
      client.points = (client.points || 0) + pts;
      audit('Fidelite', `${client.name} gagne ${pts} pts (total: ${client.points})`);
    }
    audit("Vente", `${method} / ${money(finalTotal)}`);
    save(`Vente enregistree: ${money(finalTotal)}`);
    active = "pos"; render();
  }

  function operationsView() {
    const open = state.shifts.find((s) => s.status === "open" && s.user === state.auth.name);
    const todaySales = state.sales.filter(s => new Date(s.at).toDateString() === new Date().toDateString());
    const totalCash = todaySales.filter(s => s.method === 'Cash').reduce((s,v) => s+v.total, 0);
    const totalMoMo = todaySales.filter(s => s.method === 'MTN MoMo').reduce((s,v) => s+v.total, 0);
    const totalOM = todaySales.filter(s => s.method === 'Orange Money').reduce((s,v) => s+v.total, 0);
    const totalCredit = todaySales.filter(s => s.method === 'Credit client').reduce((s,v) => s+v.total, 0);
    const totalAll = totalCash + totalMoMo + totalOM + totalCredit;
    return `<div class="grid two"><section class="panel"><h2><i class="fa-solid fa-cash-register"></i> Session caisse</h2>
      <p>${open ? "Ouverte depuis " + new Date(open.at).toLocaleString("fr-FR") : "Aucune session ouverte"}</p>
      <button class="btn primary" data-action="open-shift">${open ? "Session deja ouverte" : "Ouvrir session"}</button>
    </section><section class="panel">
      <h2><i class="fa-solid fa-file-invoice"></i> Cloture detaillee du ${new Date().toLocaleDateString('fr-FR')}</h2>
      <div class="table" style="margin-bottom:12px">
        <div class="tr"><b>Ventes Cash</b><span>${money(totalCash)}</span></div>
        <div class="tr"><b>MTN MoMo</b><span>${money(totalMoMo)}</span></div>
        <div class="tr"><b>Orange Money</b><span>${money(totalOM)}</span></div>
        <div class="tr"><b>Credit client</b><span>${money(totalCredit)}</span></div>
        <div class="tr" style="font-weight:700;border-top:2px solid var(--accent)"><b>Total du jour</b><span>${money(totalAll)}</span></div>
      </div>
      <form id="closure" style="margin-bottom:8px">
        <label>Cash compte en caisse FCFA<input name="cash" type="number" value="${totalCash}" required></label>
        <label>Observation<textarea name="note" rows="2"></textarea></label>
        <button class="btn primary full"><i class="fa-solid fa-check"></i> Cloturer la caisse</button>
      </form>
    </section>
    <section class="panel" style="grid-column:1/-1">
      <h2><i class="fa-solid fa-clock-rotate-left"></i> Historique des clotures</h2>
      <div class="table">${(state.closures||[]).slice(0,10).map(cl => {
        const ecart = (cl.cashCounted||cl.cash||0) - (cl.expectedCash||0);
        return `<div class="tr"><b>${new Date(cl.at).toLocaleDateString('fr-FR')}</b><span>Attendu: ${money(cl.expectedCash||0)}</span><span>Compte: ${money(cl.cashCounted||cl.cash||0)}</span><span style="color:${ecart >= 0 ? 'var(--good)' : 'var(--bad)'};font-weight:700">${ecart >= 0 ? '+' : ''}${money(ecart)}</span><small>${esc(cl.note||'')}</small></div>`;
      }).join('') || empty('Aucune cloture')}
    </section></div>`;
  }
  function openShift() {
    if (state.shifts.some((s) => s.status === "open" && s.user === state.auth.name)) return toast("Session deja ouverte");
    state.shifts.unshift({ id: uid("sh"), at: new Date().toISOString(), user: state.auth.name, status: "open" });
    save("Session caisse ouverte"); render();
  }
  function bindOperations() {
    document.getElementById("closure")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      const cashCounted = Number(d.cash || 0);
      const todaySales = state.sales.filter(s => new Date(s.at).toDateString() === new Date().toDateString());
      const expectedCash = todaySales.filter(s => s.method === 'Cash').reduce((s,v) => s+v.total, 0);
      state.closures.unshift({ id: uid("cl"), at: new Date().toISOString(), user: state.auth.name, cash: cashCounted, cashCounted, expectedCash, note: d.note });
      state.shifts.forEach((s) => { if (s.user === state.auth.name) s.status = "closed"; });
      const ecart = cashCounted - expectedCash;
      const msg = ecart !== 0 ? ` (ecart: ${ecart > 0 ? '+' : ''}${money(ecart)})` : '';
      save("Caisse cloturee" + msg); render();
    });
  }
  function stockView() {
    const cats = getCategories().map(c => `<option value="${esc(c)}" ${catFilter === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
    const catCounts = {};
    const catSalesQty = {};
    state.products.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
    state.sales.forEach(s => (s.items||[]).forEach(item => {
      const p = state.products.find(x => x.id === item.id);
      if (p && p.category) catSalesQty[p.category] = (catSalesQty[p.category]||0) + item.qty;
    }));
    const totalProds = state.products.length;
    const catStats = getCategories().map(c => `<span class="cat-stat ${catFilter === c ? 'active' : ''}" data-cat-stat="${esc(c)}">${esc(c)}: <strong>${catCounts[c] || 0}</strong> <small class="sales-count">${catSalesQty[c]||0} vendus</small></span>`).join('');
    return `<section class="panel"><div class="section-title"><h2><i class="fa-solid fa-boxes-stacked"></i> Stocks</h2><input placeholder="Recherche produit..." value="${esc(filter)}" data-filter><select class="cat-filter" data-cat-filter><option value="all">Toutes catégories</option>${cats}</select><button class="btn sm" data-action="new-transfer" title="Transfert stock"><i class="fa-solid fa-arrows-left-right"></i></button><button class="btn sm" data-action="do-inventory" title="Inventaire"><i class="fa-solid fa-clipboard-list"></i></button></div><div class="cat-stats"><span class="cat-stat ${catFilter === 'all' ? 'active' : ''}" data-cat-stat="all">Tous: <strong>${totalProds}</strong></span>${catStats}</div><form id="productForm" class="grid three"><input name="sku" placeholder="SKU" required><input name="name" placeholder="Produit" required><select name="category">${cats}</select><input name="qty" type="number" placeholder="Stock" required><input name="cost" type="number" placeholder="Cout" required><input name="price" type="number" placeholder="Prix" required><input name="photo" placeholder="URL photo" style="grid-column:span 2"><button class="btn primary">Ajouter</button></form><div class="table">${state.products.map((p) => `<div class="tr-stock" data-prod-id="${esc(p.id)}"><div class="stock-photo-thumb">${p.photo ? `<img src="${esc(p.photo)}">` : '<i class="fa-solid fa-image"></i>'}</div><b>${esc(p.name)}</b><span class="prod-cat">${esc(p.category||'')}</span><span>${esc(p.sku)}</span><span>${p.qty}</span><span>${money(p.price)}</span><div class="actions-row">
        <button class="btn-icon-sm" data-edit-prod="${esc(p.id)}" title="Modifier"><i class="fa-solid fa-pen-to-square" style="color:var(--accent)"></i></button>
        <button class="btn-icon-sm" data-del-prod="${esc(p.id)}" title="Supprimer"><i class="fa-solid fa-trash-can" style="color:var(--bad)"></i></button>
      </div></div>`).join("")}</div></section>
      <div class="section-title" style="margin-top:20px"><h2><i class="fa-solid fa-clock-rotate-left"></i> Transferts & inventaires</h2></div>
      <div class="table">${(state.transferHistory||[]).slice(0,15).map(t => `<div class="tr"><b>${esc(t.product)}</b><span>${t.qty > 0 ? t.qty + " unites" : ""}</span><span>${esc(t.from)} <i class="fa-solid fa-arrow-right"></i> ${esc(t.to)}</span><small>${new Date(t.at).toLocaleDateString("fr-FR")}</small></div>`).join("") || empty("Aucun mouvement")}</div>
    </section>`;
  }
  function bindStock() {
    document.querySelector("[data-cat-filter]")?.addEventListener("change", (e) => { catFilter = e.target.value; render(); });
    document.querySelectorAll("[data-cat-stat]").forEach(b => b.addEventListener("click", () => { catFilter = b.dataset.catStat; render(); }));
    document.getElementById("productForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      state.products.unshift({ id: uid("p"), sku: d.sku, name: d.name, category: d.category || getCategories()[0], shop: getShops()[0], qty: Number(d.qty), cost: Number(d.cost), price: Number(d.price), promoPrice: 0, photo: d.photo || "" });
      save("Produit ajoute"); render();
    });
    /* Feature 3+14: CRUD produits */
    document.querySelectorAll('[data-edit-prod]').forEach(b => {
      b.addEventListener('click', () => showEditProductModal(b.dataset.editProd));
    });
    document.querySelectorAll('[data-del-prod]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.delProd;
        const p = state.products.find(x => x.id === id);
        if (!p || !confirm(`Supprimer definitivement ${p.name} ?`)) return;
        state.products = state.products.filter(x => x.id !== id);
        audit('Produit supprime', p.name);
        save('Produit supprime'); render();
      });
    });
  }
  function showEditProductModal(id) {
    const p = state.products.find(x => x.id === id);
    if (!p) return;
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box">
      <h2><i class="fa-solid fa-pen-to-square"></i> Modifier produit</h2>
      <form id="editProdForm">
        <div class="grid two">
          <label>Nom<input name="name" value="${esc(p.name)}" required></label>
          <label>SKU<input name="sku" value="${esc(p.sku)}" required></label>
        </div>
        <div class="grid two">
          <label>Categorie<select name="category">${getCategories().map(c => `<option value="${esc(c)}" ${p.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
          <label>Quantite<input name="qty" type="number" value="${p.qty}" required></label>
        </div>
        <div class="grid two">
          <label>Prix revient<input name="cost" type="number" value="${p.cost}" required></label>
          <label>Prix vente<input name="price" type="number" value="${p.price}" required></label>
        </div>
        <label>URL photo<input name="photo" value="${esc(p.photo)}"></label>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn primary full"><i class="fa-solid fa-check"></i> Enregistrer</button>
          <button type="button" class="btn full" data-close>Annuler</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#editProdForm').addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      p.name = d.name; p.sku = d.sku; p.category = d.category || p.category; p.qty = Number(d.qty);
      p.cost = Number(d.cost); p.price = Number(d.price); p.photo = d.photo || p.photo;
      audit('Produit modifie', p.name);
      save('Produit modifie'); panel.remove(); render();
    });
  }
  function loyaltyTier(pts) {
    if (pts >= 5000) return { label: 'Platine', icon: 'fa-crown', color: '#8B5CF6' };
    if (pts >= 2000) return { label: 'Or', icon: 'fa-star', color: '#F59E0B' };
    if (pts >= 500) return { label: 'Argent', icon: 'fa-medal', color: '#94A3B8' };
    return { label: 'Bronze', icon: 'fa-certificate', color: '#CD7F32' };
  }
  function clientsView() {
    const filteredDebtors = state.clients.filter(c => c.balance > 0 && (c.name + (c.phone||'')).toLowerCase().includes(clientFilter.toLowerCase()));
    const filteredAll = state.clients.filter(c => (c.name + (c.phone||'')).toLowerCase().includes(clientFilter.toLowerCase()));
    return `<section class="panel"><div class="section-title"><h2><i class="fa-solid fa-users"></i> Clients & dettes</h2><input placeholder="Rechercher client..." value="${esc(clientFilter)}" data-client-filter style="max-width:260px"></div><form id="clientForm" class="grid three"><input name="name" placeholder="Nom client" required><input name="phone" placeholder="Telephone"><input name="balance" type="number" placeholder="Solde"><button class="btn primary">Ajouter client</button></form>
    <div class="section-title" style="margin-top:16px"><h2><i class="fa-solid fa-hand-holding-dollar"></i> Debiteurs</h2><button class="btn sm" data-action="export-debts"><i class="fa-solid fa-download"></i> CSV</button></div>
    <div class="table" id="debtorsList">${filteredDebtors.map((c) => `<div class="tr" data-client-id="${esc(c.id)}"><b>${esc(c.name)}</b><span>${esc(c.phone)}</span><span style="color:var(--bad);font-weight:700">${money(c.balance)}</span><div class="actions-row"><button class="btn-icon-sm remind-btn" title="Relancer WhatsApp"><i class="fa-brands fa-whatsapp" style="color:#25D366"></i></button><button class="btn-icon-sm" data-edit-client="${esc(c.id)}" title="Modifier"><i class="fa-solid fa-pen-to-square" style="color:var(--accent)"></i></button><button class="btn-icon-sm" data-del-client="${esc(c.id)}" title="Supprimer"><i class="fa-solid fa-trash-can" style="color:var(--bad)"></i></button></div></div>`).join('') || empty('Aucun debiteur')}</div>
    <div class="section-title" style="margin-top:16px"><h2><i class="fa-solid fa-gift"></i> Fidelite & points</h2></div>
    <div class="table">${filteredAll.map((c) => {
      const t = loyaltyTier(c.points || 0);
      return `<div class="tr" data-client-id="${esc(c.id)}"><b>${esc(c.name)}</b><span>${esc(c.phone)}</span><span>${money(c.balance)}</span><span class="loyalty-badge loyalty-${t.label.toLowerCase()}"><i class="fa-solid ${t.icon}" style="color:${t.color}"></i> ${t.label} <small>${c.points || 0} pts</small></span><div class="actions-row"><button class="btn-icon-sm" data-edit-client="${esc(c.id)}" title="Modifier"><i class="fa-solid fa-pen-to-square" style="color:var(--accent)"></i></button><button class="btn-icon-sm" data-del-client="${esc(c.id)}" title="Supprimer"><i class="fa-solid fa-trash-can" style="color:var(--bad)"></i></button></div></div>`;
    }).join('')}</div></section>`;
  }
  function bindClients() {
    document.getElementById("clientForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      state.clients.unshift({ id: uid("c"), name: d.name, phone: d.phone, balance: Number(d.balance || 0) });
      save("Client ajoute"); render();
    });
    document.querySelectorAll('.remind-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tr = btn.closest('[data-client-id]');
        const c = state.clients.find(x => x.id === tr?.dataset.clientId);
        if (c) remindDebt(c);
      });
    });
    /* Feature 3: CRUD clients */
    document.querySelectorAll('[data-edit-client]').forEach(b => {
      b.addEventListener('click', () => showEditClientModal(b.dataset.editClient));
    });
    document.querySelectorAll('[data-del-client]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.delClient;
        const c = state.clients.find(x => x.id === id);
        if (!c || !confirm(`Supprimer definitivement ${c.name} ?`)) return;
        state.clients = state.clients.filter(x => x.id !== id);
        audit('Client supprime', c.name);
        save('Client supprime'); render();
      });
    });
    document.querySelector('[data-client-filter]')?.addEventListener('input', e => {
      clientFilter = e.target.value;
      render();
    });
  }
  function showEditClientModal(id) {
    const c = state.clients.find(x => x.id === id);
    if (!c) return;
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box">
      <h2><i class="fa-solid fa-pen-to-square"></i> Modifier client</h2>
      <form id="editClientForm">
        <label>Nom<input name="name" value="${esc(c.name)}" required></label>
        <div class="grid two"><label>Telephone<input name="phone" value="${esc(c.phone||'')}"></label><label>Solde<input name="balance" type="number" value="${c.balance}"></label></div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn primary full"><i class="fa-solid fa-check"></i> Enregistrer</button>
          <button type="button" class="btn full" data-close>Annuler</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#editClientForm').addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      c.name = d.name; c.phone = d.phone; c.balance = Number(d.balance);
      audit('Client modifie', c.name);
      save('Client modifie'); panel.remove(); render();
    });
  }
  let salesLimit = 15;
  let auditLimit = 12;
  function reportsView() {
    let dateFilteredSales = state.sales;
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0,0,0,0);
      dateFilteredSales = dateFilteredSales.filter(s => new Date(s.at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23,59,59,999);
      dateFilteredSales = dateFilteredSales.filter(s => new Date(s.at) <= to);
    }
    const showSales = dateFilteredSales.slice(0, salesLimit);
    const showAudit = state.audit.slice(0, auditLimit);
    return `<div class="grid two"><section class="panel"><h2><i class="fa-solid fa-file-export"></i> Rapports</h2><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <button class="btn" data-action="report-day"><i class="fa-solid fa-sun"></i> Jour</button>
      <button class="btn" data-action="report-week"><i class="fa-solid fa-calendar-week"></i> Semaine</button>
      <button class="btn" data-action="report-month"><i class="fa-solid fa-calendar-alt"></i> Mois</button>
      <button class="btn" data-action="export-sales"><i class="fa-solid fa-download"></i> CSV</button>
    </div><div class="table">${showSales.map((s) => `<div class="tr"><b>${new Date(s.at).toLocaleString("fr-FR")}</b><span>${esc(s.clientName)}</span><span>${esc(s.method)}</span><span>${money(s.total)}${s.returned?.length ? ` <span style="color:var(--bad);font-size:11px">(${s.returned.reduce((a,r) => a+r.qty,0)} retours)</span>` : ''}</span><span>${s.returned?.length ? `<button class="btn-icon-sm" data-action="return-sale" data-sale-id="${esc(s.id)}"><i class="fa-solid fa-rotate-left" style="color:var(--bad)"></i></button>` : `<button class="btn-icon-sm" data-action="return-sale" data-sale-id="${esc(s.id)}"><i class="fa-solid fa-arrow-left" style="color:var(--muted)"></i></button>`}</span></div>`).join("") || empty("Aucune vente")}
    </div>
    <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap">
      <label style="font-size:12px;font-weight:700;text-transform:uppercase;margin:0">Du <input type="date" id="dateFrom" value="${esc(dateFrom)}" style="width:auto;min-height:32px;padding:4px 8px;margin-left:4px"></label>
      <label style="font-size:12px;font-weight:700;text-transform:uppercase;margin:0">Au <input type="date" id="dateTo" value="${esc(dateTo)}" style="width:auto;min-height:32px;padding:4px 8px;margin-left:4px"></label>
      <button class="btn sm" data-action="filter-dates"><i class="fa-solid fa-filter"></i> Filtrer</button>
    </div></div>
    ${dateFilteredSales.length > salesLimit ? `<button class="btn sm full" data-action="voir-plus-sales" style="margin-top:8px">Voir plus (${dateFilteredSales.length - salesLimit} cachees)</button>` : ''}
    </section>
    
    <section class="panel"><h2><i class="fa-solid fa-chart-line"></i> Amortissement & valeur residuelle du stock</h2>
      <p style="color:var(--muted);font-size:12px;margin-bottom:10px">Taux d'amortissement annuel: <input type="number" id="depRate" value="${state.settings.depreciationRate||10}" min="0" max="100" style="width:70px;min-height:32px;padding:4px 8px;display:inline-block;font-weight:700;text-align:center">% <button class="btn sm" data-action="set-dep-rate" style="min-height:32px"><i class="fa-solid fa-check"></i></button> Valeur calculee sur le cout de revient.</p>
      <div class="table amort-table" style="margin-bottom:10px">
        <div class="tr" style="grid-template-columns:1.5fr 80px 80px 80px 80px;font-weight:700;background:var(--bg);border-bottom:2px solid var(--accent)">
          <b>Produit</b><b>Categorie</b><b style="text-align:right">Qte</b><b style="text-align:right">Cout unit.</b><b style="text-align:right">Val. residuelle</b>
        </div>
        ${state.products.filter(p => p.qty > 0).map(p => {
          const unitCost = p.cost || 0;
          const totalCost = unitCost * p.qty;
          const rate = (state.settings.depreciationRate || 10) / 100;
          const residual = Math.max(0, totalCost * (1 - rate));
          return `<div class="tr" style="grid-template-columns:1.5fr 80px 80px 80px 80px;font-size:12px">
            <b>${esc(p.name)}</b><span class="prod-cat">${esc(p.category||'')}</span><span style="text-align:right">${p.qty}</span><span style="text-align:right">${money(unitCost)}</span><span style="text-align:right;${residual < totalCost * 0.5 ? 'color:var(--bad);font-weight:700' : 'color:var(--good);font-weight:700'}">${money(Math.round(residual))}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="row" style="font-weight:700;border-top:2px solid var(--accent);padding-top:10px">
        <b>Total stock (cout)</b>
        <span>${money(state.products.reduce((s,p) => s + (p.cost||0) * p.qty, 0))}</span>
      </div>
      <div class="row" style="font-weight:700">
        <b>Valeur residuelle estimee</b>
        <span style="color:var(--good);font-size:16px">${money(state.products.reduce((s,p) => s + Math.max(0, (p.cost||0) * p.qty * (1 - ((state.settings.depreciationRate||10)/100))), 0))}</span>
      </div>
      <div class="row" style="font-size:12px;color:var(--muted)">
        <b>Perte de valeur annuelle</b>
        <span style="color:var(--bad)">-${money(state.products.reduce((s,p) => s + (p.cost||0) * p.qty * ((state.settings.depreciationRate||10)/100), 0))}</span>
      </div>
      <p style="color:var(--muted);font-size:11px;margin-top:8px">* L'amortissement est calcule sur une base lineaire annuelle. Ajustez le taux dans Parametres.</p>
    </section>
    <section class="panel"><h2><i class="fa-solid fa-clock-rotate-left"></i> Audit horodate</h2>${showAudit.map((a) => `<div class="row"><b>${esc(a.action)}</b><span>${new Date(a.at).toLocaleString("fr-FR")}</span></div>`).join("")}
    ${state.audit.length > auditLimit ? `<button class="btn sm full" data-action="voir-plus-audit" style="margin-top:8px">Voir plus (${state.audit.length - auditLimit} cachees)</button>` : ''}
      <h2 style="margin-top:16px"><i class="fa-solid fa-arrows-left-right"></i> Transferts recents</h2>${(state.transferHistory||[]).slice(0, 10).map(t => `<div class="row"><span>${esc(t.product)} x${t.qty}</span><span>${esc(t.from)} <i class="fa-solid fa-arrow-right"></i> ${esc(t.to)}</span><small>${new Date(t.at).toLocaleDateString('fr-FR')}</small></div>`).join('') || empty('Aucun transfert')}</section></div>`;
  }
  function settingsView() {      return `<div class="grid two"><section class="panel"><h2><i class="fa-solid fa-gear"></i> Parametres</h2><p>Comptes, roles et preferences.</p>
      <button class="btn primary sm" onclick="showCategoryManager();return false" style="margin:0 0 12px"><i class="fa-solid fa-tags"></i> Gérer mes catégories (${getCategories().length})</button><div class="table">${state.settings.users.map((u) => `<div class="tr"><b>${esc(u.name)}</b><span>${esc(ROLE_LABELS[u.role])}</span>${canSeeCodes() ? `<strong>${esc(u.code)}</strong>` : `<strong style="color:var(--muted);letter-spacing:2px">••••</strong>`}</div>`).join("")}</div></section><section class="panel">
      <h2><i class="fa-solid fa-palette"></i> Theme personnalisable</h2>
      <div class="theme-switch">
        <span><i class="fa-solid ${state.theme === 'dark' ? 'fa-moon' : 'fa-sun'}"></i> ${state.theme === 'dark' ? 'Sombre' : 'Clair'}</span>
        <label class="toggle"><input type="checkbox" id="themeCheck" ${state.theme === 'dark' ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <div style="margin-top:12px;display:grid;gap:8px">
        <label>Couleur du theme<input type="color" id="themeColor" value="${esc(state.settings.themeColor||'#131921')}" style="height:44px;padding:4px"></label>
        <label>Logo (texte)<input id="logoText" value="${esc(state.settings.logoText||'OR')}" maxlength="4" style="font-weight:900;font-size:20px;text-align:center;letter-spacing:2px"></label>
        <label>Nom boutique<input id="boutiqueName" value="${esc(state.settings.boutique||'Origin Retail OS')}"></label>
        <button class="btn" id="saveTheme"><i class="fa-solid fa-floppy-disk"></i> Appliquer le theme</button>
      </div>
      <h2 style="margin-top:20px"><i class="fa-solid fa-cloud-arrow-up"></i> Sauvegarde automatique</h2>
      <div class="theme-switch">
        <span>Backup auto toutes les ${state.settings.backupInterval || 5} min</span>
        <label class="toggle"><input type="checkbox" id="autoBackupCheck" ${state.settings.autoBackup ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <p style="color:var(--muted);font-size:12px;margin:8px 0">${state.settings.lastBackup ? 'Dernier backup: ' + new Date(state.settings.lastBackup).toLocaleString('fr-FR') : 'Aucun backup automatique'}</p>
      <h2 style="margin-top:20px"><i class="fa-solid fa-cloud"></i> Synchronisation serveur</h2>
      <p style="color:var(--muted);font-size:13px">${state.settings.lastSync ? 'Derniere sync: ' + new Date(state.settings.lastSync).toLocaleString('fr-FR') : 'Jamais synchronise'}</p>
      <p style="color:var(--muted);font-size:13px">${state.settings.serverSyncedAt ? 'Donnees serveur: ' + new Date(state.settings.serverSyncedAt).toLocaleString('fr-FR') : 'Serveur: aucune donnee'}</p>
      <button class="btn" data-action="sync-now"><i class="fa-solid fa-arrows-rotate"></i> Sync maintenant</button>
      <h2 style="margin-top:20px"><i class="fa-solid fa-cloud"></i> Application en ligne</h2>
      <p style="color:var(--muted);font-size:13px">Votre ERP est accessible depuis n'importe quel appareil connecté à Internet :</p>
      <ul style="font-size:13px;color:var(--muted);margin:8px 0;padding-left:16px">
        <li>Les serveuses ouvrent simplement l'URL sur leur téléphone</li>
        <li>Elles se connectent avec leur code personnel <strong>1101</strong>, <strong>1102</strong>, <strong>1201</strong>, <strong>1202</strong></li>
        <li>Les données sont synchronisées en temps réel entre tous les appareils</li>
      </ul>
      <h2 style="margin-top:20px"><i class="fa-solid fa-paint-roller"></i> Page de connexion</h2>
      <label>Couleur du fond<select id="loginBgStyle" onchange="saveLoginTheme()">
        <option value="dark">Fonce classique</option>
        <option value="purple">Violet elegant</option>
        <option value="blue">Bleu professionnel</option>
        <option value="green">Vert nature</option>
        <option value="warm">Chaud soleil</option>
      </select></label>
      <label>Texte d'accueil<input id="loginWelcomeText" value="' + esc(state.settings.loginWelcomeText||'') + '" placeholder="Caisse intelligente, stock, dettes..." onchange="saveLoginTheme()"></label>
      <button class="btn" onclick="saveLoginTheme()"><i class="fa-solid fa-check"></i> Appliquer</button>
      <h2 style="margin-top:20px"><i class="fa-solid fa-envelope"></i> Email SMTP</h2>
      <p style='color:var(--muted);font-size:12px;margin-bottom:8px'>Configurez un serveur SMTP pour envoyer les emails de reinitialisation de mot de passe.</p>
      <label>Serveur SMTP<input id='smtpHost' value='${esc(state.settings.smtp?.host||'')}' placeholder='smtp.gmail.com'></label>
      <div class='grid two'>
      <label>Port<input id='smtpPort' type='number' value='${esc(state.settings.smtp?.port||587)}' placeholder='587'></label>
      <label>Email expediteur<input id='smtpUser' value='${esc(state.settings.smtp?.user||'')}' placeholder='votre@email.com'></label>
      </div>
      <label>Mot de passe SMTP<input id='smtpPass' type='password' value='${esc(state.settings.smtp?.pass||'')}' placeholder='Mot de passe application'></label>
      <button class='btn' onclick='saveSmtpConfig()'><i class='fa-solid fa-floppy-disk'></i> Enregistrer SMTP</button>
      <p style='color:var(--muted);font-size:12px'>Pour Gmail: activez les "Mots de passe d'application" dans votre compte Google.</p>
      <h2 style="margin-top:20px"><i class="fa-solid fa-triangle-exclamation"></i> Notifications</h2>
      <button class="btn" data-action="clear-notifs" style="margin-top:8px"><i class="fa-solid fa-check-double"></i> Tout marquer comme lu</button>
    </section></div>`;
  }
  function suppliersView() {
    const filteredSuppliers = state.suppliers.filter(s => (s.name + (s.contact||'') + (s.city||'') + (s.products||'')).toLowerCase().includes(supplierFilter.toLowerCase()));
    return `<div class="grid two"><section class="panel"><h2><i class="fa-solid fa-truck"></i> Fournisseurs</h2><input placeholder="Rechercher fournisseur..." value="${esc(supplierFilter)}" data-supplier-filter style="width:100%;margin-bottom:8px"><form id="supplierForm" class="grid two" style="margin-bottom:12px"><input name="name" placeholder="Nom fournisseur" required><input name="contact" placeholder="Contact telephone"><input name="city" placeholder="Ville"><input name="products" placeholder="Produits fournis"><button class="btn primary">Ajouter fournisseur</button></form><div class="table">${filteredSuppliers.map(s => `<div class="tr" data-supp-id="${esc(s.id)}"><b>${esc(s.name)}</b><span>${esc(s.contact)}</span><span>${esc(s.city)}</span><span style="grid-column:span 2">${esc(s.products)}</span><div class="actions-row"><button class="btn-icon-sm" data-edit-supp="${esc(s.id)}" title="Modifier"><i class="fa-solid fa-pen-to-square" style="color:var(--accent)"></i></button><button class="btn-icon-sm" data-del-supp="${esc(s.id)}" title="Supprimer"><i class="fa-solid fa-trash-can" style="color:var(--bad)"></i></button></div></div>`).join('')}</div></section>
    <section class="panel"><h2><i class="fa-solid fa-cart-plus"></i> Nouvelle commande</h2><form id="orderForm" class="grid two"><select name="sname" required>${state.suppliers.map(s => `<option>${esc(s.name)}</option>`).join('')}</select><input name="items" placeholder="Articles commandes" required><input name="total" type="number" placeholder="Montant FCFA" required><input name="status" placeholder="Statut (ex: En cours)" value="En cours"><button class="btn primary">Enregistrer commande</button></form><h2 style="margin-top:16px"><i class="fa-solid fa-clock-rotate-left"></i> Historique commandes</h2><div class="table">${(state.purchaseOrders || []).map(o => {
      const status = SUPPLIER_STATUS[o.status2] || o.status || 'En attente';
      const color = SUPPLIER_COLORS[o.status2] || '#F59E0B';
      return `<div class="tr" data-po-id="${esc(o.id)}"><b>${esc(o.supplier)}</b><span>${esc(o.items)}</span><span>${money(o.total)}</span><span class="order-status" style="background:${color}20;color:${color};border:1px solid ${color}">${status}</span><small>${new Date(o.at).toLocaleDateString('fr-FR')}</small>
      <div class="actions-row">
        ${o.status2 === 'pending' ? `<button class="btn-icon-sm" data-po-action="ordered" title="Commander"><i class="fa-solid fa-truck-fast" style="color:${SUPPLIER_COLORS.ordered}"></i></button><button class="btn-icon-sm" data-po-action="cancelled" title="Annuler"><i class="fa-solid fa-xmark" style="color:${SUPPLIER_COLORS.cancelled}"></i></button>` : ''}
        ${o.status2 === 'ordered' ? `<button class="btn-icon-sm" data-po-action="shipped" title="Envoyee"><i class="fa-solid fa-ship" style="color:${SUPPLIER_COLORS.shipped}"></i></button><button class="btn-icon-sm" data-po-action="cancelled" title="Annuler"><i class="fa-solid fa-xmark" style="color:${SUPPLIER_COLORS.cancelled}"></i></button>` : ''}
        ${o.status2 === 'shipped' ? `<button class="btn-icon-sm" data-po-action="received" title="Recue"><i class="fa-solid fa-check-circle" style="color:${SUPPLIER_COLORS.received}"></i></button></button>` : ''}
        ${o.status2 === 'received' ? `<span style="color:${SUPPLIER_COLORS.received};font-size:12px"><i class="fa-solid fa-circle-check"></i> Recue</span>` : ''}
        ${o.status2 === 'cancelled' ? `<span style="color:${SUPPLIER_COLORS.cancelled};font-size:12px"><i class="fa-solid fa-circle-xmark"></i> Annulee</span>` : ''}
      </div></div>`;
    }).join('') || empty('Aucune commande')}</div></section></div>`;
  }
  function bindSuppliers() {
    document.getElementById('supplierForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      state.suppliers.unshift({ id: uid('s'), name: d.name, contact: d.contact, city: d.city, products: d.products });
      save('Fournisseur ajoute'); render();
    });
    document.getElementById('orderForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      state.purchaseOrders.unshift({ id: uid('po'), at: new Date().toISOString(), supplier: d.sname, items: d.items, total: Number(d.total), status: d.status, status2: 'pending' });
      addNotification('Commande fournisseur', `Nouvelle commande chez ${d.sname}: ${d.items}`);
      save('Commande enregistree'); render();
    });
    /* Feature 5: Statut commandes fournisseurs */
    document.querySelectorAll('[data-po-action]').forEach(b => {
      b.addEventListener('click', () => {
        const row = b.closest('[data-po-id]');
        const po = state.purchaseOrders.find(o => o.id === row?.dataset.poId);
        if (!po) return;
        po.status2 = b.dataset.poAction;
        po.status = SUPPLIER_STATUS[po.status2] || po.status;
        // Auto-ajuster le stock quand la commande est re├ºue
        if (po.status2 === 'received') {
          const items = (po.items || '').split(',').map(s => s.trim());
          items.forEach(item => {
            const match = item.match(/^(\d+)x\s+(.+)/i);
            if (match) {
              const qty = Number(match[1]);
              const name = match[2].toLowerCase();
              const prod = state.products.find(p => p.name.toLowerCase().includes(name));
              if (prod) prod.qty += qty;
            }
          });
          addNotification('Commande re├ºue', `Stock mis ├  jour pour ${po.items}`);
        }
        addNotification('Commande fournisseur', `${SUPPLIER_STATUS[po.status2]}: ${po.supplier}`);
        audit('Commande fournisseur', `${po.supplier}: ${SUPPLIER_STATUS[po.status2]}`);
        save(); render();
      });
    });
    /* Feature 3: CRUD fournisseurs */
    document.querySelectorAll('[data-edit-supp]').forEach(b => {
      b.addEventListener('click', () => showEditSupplierModal(b.dataset.editSupp));
    });
    document.querySelectorAll('[data-del-supp]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.delSupp;
        const s = state.suppliers.find(x => x.id === id);
        if (!s || !confirm(`Supprimer definitivement ${s.name} ?`)) return;
        state.suppliers = state.suppliers.filter(x => x.id !== id);
        audit('Fournisseur supprime', s.name);
        save('Fournisseur supprime'); render();
      });
    });
    document.querySelector('[data-supplier-filter]')?.addEventListener('input', e => {
      supplierFilter = e.target.value;
      render();
    });
  }
  function showEditSupplierModal(id) {
    const s = state.suppliers.find(x => x.id === id);
    if (!s) return;
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box">
      <h2><i class="fa-solid fa-pen-to-square"></i> Modifier fournisseur</h2>
      <form id="editSuppForm" class="grid two">
        <label>Nom<input name="name" value="${esc(s.name)}" required></label>
        <label>Contact<input name="contact" value="${esc(s.contact||'')}"></label>
        <label>Ville<input name="city" value="${esc(s.city||'')}"></label>
        <label>Produits fournis<input name="products" value="${esc(s.products||'')}"></label>
        <div style="display:flex;gap:8px;grid-column:1/-1">
          <button class="btn primary full"><i class="fa-solid fa-check"></i> Enregistrer</button>
          <button type="button" class="btn full" data-close>Annuler</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#editSuppForm').addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      s.name = d.name; s.contact = d.contact; s.city = d.city; s.products = d.products;
      audit('Fournisseur modifie', s.name);
      save('Fournisseur modifie'); panel.remove(); render();
    });
  }

  function aiView() {
    const m = metrics();
    const low = state.products.filter(p => p.qty <= state.settings.lowStock);
    const debtors = state.clients.filter(c => c.balance > 0);
    const lastSale = state.sales[0];
    const topClient = [...state.clients].sort((a,b) => (b.points||0) - (a.points||0))[0];
    const insights = [
      { icon: 'fa-coins', title: `CA total: ${money(m.salesTotal)}`, desc: `Sur ${state.sales.length} ventes. Marge: ${money(m.margin)}` },
      { icon: 'fa-box', title: `Stock: ${state.products.reduce((s,p) => s+p.qty,0)} unites`, desc: `Valorise a ${money(m.stockValue)}. ${low.length} alertes stock faible.` },
      { icon: 'fa-hand-holding-dollar', title: `Credits: ${money(m.debt)}`, desc: `${debtors.length} clients debiteurs` },
      { icon: 'fa-crown', title: topClient ? `Meilleur client: ${topClient.name}` : 'Aucun client fidele', desc: topClient ? `${topClient.points} pts fidelite` : '' }
    ];
    return `<div class="grid two"><section class="panel ai-chat-panel">
      <h2><i class="fa-solid fa-robot"></i> Assistant intelligent</h2>
      <div class="ai-messages" id="aiMessages">
        <div class="ai-msg ai"><i class="fa-solid fa-robot"></i><div><b>Assistant Origin</b><p>Bonjour ${firstName(state.auth.name)} ! Je suis votre assistant boutique. Posez-moi des questions sur vos ventes, stocks, clients ou conseils.</p></div></div>
      </div>
      <div class="ai-input"><input id="aiInput" placeholder="Posez votre question..."><button id="aiSend" class="btn primary"><i class="fa-solid fa-paper-plane"></i></button></div>
      <div class="ai-quick">
        <button class="btn sm" data-ai="resume">Resume du jour</button>
        <button class="btn sm" data-ai="alerte">Alertes stock</button>
        <button class="btn sm" data-ai="fidelite">Top clients</button>
        <button class="btn sm" data-ai="conseil">Conseil du jour</button>
        <button class="btn sm" data-ai="ventes">Dernieres ventes</button>
      </div>
    </section><section class="panel">
      <h2><i class="fa-solid fa-chart-simple"></i> Analyse rapide</h2>
      ${insights.map(i => `<div class="ai-insight"><i class="fa-solid ${i.icon}"></i><div><b>${i.title}</b><p>${i.desc}</p></div></div>`).join('')}
      <div style="margin-top:16px"><h2><i class="fa-solid fa-calendar-check"></i> Rapport periodique</h2>
      <p style="color:var(--muted);font-size:13px">Recevez un resume de votre activite par WhatsApp ou email.</p>
      <div class="ai-input" style="gap:8px"><button class="btn" data-action="report-day"><i class="fa-solid fa-sun"></i> Rapport jour</button>
      <button class="btn" data-action="report-week"><i class="fa-solid fa-calendar-week"></i> Rapport semaine</button>
      <button class="btn" data-action="report-month"><i class="fa-solid fa-calendar-alt"></i> Rapport mois</button></div></div>
    </section></div>`;
  }
  function aiReply(question) {
    const q = question.toLowerCase();
    const m = metrics();
    const low = state.products.filter(p => p.qty <= state.settings.lowStock);
    const debtors = state.clients.filter(c => c.balance > 0);
    const last30 = state.sales.filter(s => Date.now() - new Date(s.at).getTime() < 30*86400000);
    const todaySales = state.sales.filter(s => new Date(s.at).toDateString() === new Date().toDateString());
    let reply = '';
    if (q.includes('resume') || q.includes('jour') || q.includes('today')) {
      const todayTotal = todaySales.reduce((s,v) => s+v.total, 0);
      reply = `📊 <b>Resume du ${new Date().toLocaleDateString('fr-FR')}</b><br>Ventes: ${money(todayTotal)} (${todaySales.length} transactions)<br>Stock bas: ${low.length} produits<br>Credits: ${money(m.debt)} (${debtors.length} clients)<br>Marge: ${money(m.margin)}`;
    } else if (q.includes('stock') || q.includes('alerte') || q.includes('rupture')) {
      reply = low.length ? `⚠️ <b>Alertes stock (${low.length})</b><br>${low.map(p => `• ${esc(p.name)}: <b>${p.qty}</b> unites restantes (seuil: ${state.settings.lowStock})`).join('<br>')}` : '✅ Tous les stocks sont suffisants. Aucune alerte.';
    } else if (q.includes('vente') || q.includes('ca') || q.includes('chiffre')) {
      reply = `💰 <b>Analyse ventes</b><br>CA total: ${money(m.salesTotal)}<br>30 jours: ${money(last30.reduce((s,v) => s+v.total, 0))} (${last30.length} ventes)<br>Panier moyen: ${last30.length ? money(last30.reduce((s,v) => s+v.total, 0)/last30.length) : '0'}<br>Marge brute: ${money(m.margin)}`;
    } else if (q.includes('client') || q.includes('fidele') || q.includes('fidelite') || q.includes('top')) {
      const top = [...state.clients].sort((a,b) => (b.points||0) - (a.points||0)).slice(0, 3);
      reply = `🏆 <b>Top clients fidelite</b><br>${top.map((c,i) => `${i+1}. ${esc(c.name)} — ${c.points||0} pts (${loyaltyTier(c.points||0).label})`).join('<br>') || 'Aucun client fidele'}`;
    } else if (q.includes('conseil') || q.includes('idee') || q.includes('ameliorer')) {
      const tips = [
        'Relancez les clients debiteurs chaque semaine pour reduire les impayes.',
        'Utilisez le programme fidelite pour encourager les achats reguliers.',
        'Verifiez les stocks critiques chaque matin avant douvrir la caisse.',
        'Exportez vos rapports chaque mois pour suivre votre progression.',
        'Formez vos caissieres a utiliser le mix de produits pour augmenter le panier moyen.',
        'Utilisez les rapports pour suivre les performances de votre boutique chaque mois.'
      ];
      reply = `💡 <b>Conseil du jour</b><br>${tips[Math.floor(Math.random()*tips.length)]}`;
    } else if (q.includes('credit') || q.includes('dette') || q.includes('debiteur')) {
      reply = `📋 <b>Credits clients</b><br>Total du: ${money(m.debt)}<br>Debiteurs: ${debtors.map(c => `• ${esc(c.name)}: ${money(c.balance)}`).join('<br>') || 'Aucun'}`;
    } else if (q.includes('boutique') || q.includes('magasin') || q.includes('shop')) {
      const byShop = {};
      state.products.forEach(p => { byShop[p.shop] = (byShop[p.shop]||0) + p.qty; });
      reply = `🏪 <b>Repartition par boutique</b><br>${Object.entries(byShop).map(([s,q]) => `• ${esc(s)}: ${q} unites en stock`).join('<br>')}`;
    } else {
      reply = `🤖 Je peux vous aider avec:<br>• <b>Resume du jour</b> — chiffres du jour<br>• <b>Alertes stock</b> — produits en rupture<br>• <b>Ventes / CA</b> — analyse du chiffre daffaires<br>• <b>Top clients</b> — classement fidelite<br>• <b>Credits / Dettes</b> — suivi des debiteurs<br>• <b>Conseil</b> — astuces pour votre boutique<br>• <b>Boutiques</b> — repartition par magasin`;
    }
    return reply;
  }
  const EXPENSE_CATEGORIES = ['Loyer', 'Electricite', 'Eau', 'Transport', 'Fournitures', 'Salaire', 'Marketing', 'Entretien', 'Impots', 'Divers'];
  const SUPPLIER_STATUS = { pending: 'En attente', ordered: 'Commandee', shipped: 'Envoyee', received: 'Recue', cancelled: 'Annulee' };
  const SUPPLIER_COLORS = { pending: '#F59E0B', ordered: '#3B82F6', shipped: '#8B5CF6', received: '#22C55E', cancelled: '#EF4444' };
  const ORDER_STATUS = { pending: 'En attente', confirmed: 'Confirmee', completed: 'Livree', cancelled: 'Annulee' };
  const ORDER_COLORS = { pending: '#F59E0B', confirmed: '#3B82F6', completed: '#22C55E', cancelled: '#EF4444' };


  function showReturnModal(saleId) {
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) return toast("Vente introuvable");
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box" style="max-width:500px">
      <h2><i class="fa-solid fa-arrow-left"></i> Retour / Remboursement</h2>
      <p style="color:var(--muted);font-size:13px">Vente du ${new Date(sale.at).toLocaleDateString('fr-FR')} - ${esc(sale.clientName)} - ${money(sale.total)}</p>
      <form id="returnForm">
        <label>Articles retournés<select name="itemIndex" required>
          ${(sale.items||[]).map((item, i) => `<option value="${i}">${esc(item.name)} x${item.qty} - ${money(item.price*item.qty)}</option>`).join('')}
        </select></label>
        <div class="grid two">
          <label>Quantité à retourner<input name="qty" type="number" value="1" min="1" required></label>
          <label>Type<select name="type"><option value="refund">Remboursement</option><option value="exchange">Échange</option><option value="return">Retour simple</option></select></label>
        </div>
        <label>Motif<textarea name="reason" rows="2" placeholder="Motif du retour..." required></textarea></label>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn primary full"><i class="fa-solid fa-check"></i> Valider le retour</button>
          <button type="button" class="btn full" data-close>Annuler</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#returnForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      const idx = Number(d.itemIndex);
      const item = sale.items?.[idx];
      if (!item) return toast("Article introuvable");
      const qty = Math.min(Number(d.qty), item.qty);
      const p = state.products.find(x => x.id === item.id);
      if (p) p.qty += qty;
      const refund = item.price * qty;
      sale.total = Math.max(0, sale.total - refund);
      sale.returned = (sale.returned || []).concat([{ itemIndex: idx, name: item.name, qty, type: d.type, reason: d.reason, at: new Date().toISOString(), refund }]);
      save(`Retour: ${qty}x ${item.name} (${d.type})`);
      audit('Retour', `${qty}x ${item.name} - ${d.type} - ${d.reason}`);
      panel.remove(); render();
    });
  }

  function ordersView() {
    const list = state.orders || [];
    return `<section class="panel"><div class="section-title"><h2><i class="fa-solid fa-clipboard-list"></i> Commandes clients (${list.length})</h2><button class="btn primary" data-action="new-order"><i class="fa-solid fa-plus"></i> Nouvelle commande</button></div>
      <div class="order-filters">${Object.entries(ORDER_STATUS).map(([k,v]) => `<button class="btn sm" data-filter-order="${k}" style="${orderFilter === k ? 'background:var(--accent);color:#111' : ''}">${v}</button>`).join('')}<button class="btn sm" data-filter-order="all" style="${orderFilter === 'all' ? 'background:var(--accent);color:#111' : ''}">Toutes</button></div>
      <div class="table">${list.length ? list.filter(o => orderFilter === 'all' || o.status === orderFilter).map(o => {
        const status = ORDER_STATUS[o.status] || 'En attente';
        const color = ORDER_COLORS[o.status] || '#F59E0B';
        return `<div class="order-row" data-order-id="${esc(o.id)}">
          <div class="order-info"><b>${esc(o.clientName)}</b><span class="order-status" style="background:${color}20;color:${color};border:1px solid ${color}">${status}</span></div>
          <div class="order-items">${esc(o.items || '—')}</div>
          <div class="order-meta"><span>${money(o.total)}</span>${o.deposit > 0 ? `<span class="badge-warn">Acompte: ${money(o.deposit)}</span>` : ''}<small>${new Date(o.at).toLocaleDateString('fr-FR')}</small></div>
          <div class="order-actions">
            <button class="btn-icon-sm" data-edit-order="${esc(o.id)}" title="Modifier"><i class="fa-solid fa-pen-to-square" style="color:var(--accent)"></i></button>
            ${o.status === 'pending' ? `<button class="btn-icon-sm" data-order-action="confirmed" title="Confirmer"><i class="fa-solid fa-check" style="color:${ORDER_COLORS.confirmed}"></i></button><button class="btn-icon-sm" data-order-action="cancelled" title="Annuler"><i class="fa-solid fa-xmark" style="color:${ORDER_COLORS.cancelled}"></i></button>` : ''}${o.status === 'confirmed' ? `<button class="btn-icon-sm" data-order-action="completed" title="Livrer"><i class="fa-solid fa-truck" style="color:${ORDER_COLORS.completed}"></i></button><button class="btn-icon-sm" data-order-action="cancelled" title="Annuler"><i class="fa-solid fa-xmark" style="color:${ORDER_COLORS.cancelled}"></i></button>` : ''}${o.status === 'completed' ? `<span style="color:${ORDER_COLORS.completed};font-size:12px"><i class="fa-solid fa-circle-check"></i> Livree</span>` : ''}${o.status === 'cancelled' ? `<span style="color:${ORDER_COLORS.cancelled};font-size:12px"><i class="fa-solid fa-circle-xmark"></i> Annulee</span>` : ''}</div>
        </div>`;
      }).join('') : empty('Aucune commande')}</div></section>`;
  }

  function showNewOrderModal() {
    const options = state.products.map(p => `<option value="${esc(p.id)}">${esc(p.name)} - ${money(p.price)} (${esc(p.shop)})</option>`).join('');
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box" style="max-width:560px">
      <h2><i class="fa-solid fa-clipboard-list"></i> Nouvelle commande</h2>
      <form id="newOrderForm">
        <div class="grid two">
          <label>Client<select name="clientId" required><option value="">Selectionner</option>${state.clients.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>
          <label>Telephone<input name="phone" placeholder="Optionnel" value=""></label>
        </div>
        <label>Produit commande<select name="productId" required>${options}</select></label>
        <div class="grid two">
          <label>Quantite<input name="qty" type="number" value="1" min="1" required></label>
          <label>Acompte FCFA<input name="deposit" type="number" value="0" min="0"></label>
        </div>
        <label>Notes / instructions<textarea name="notes" rows="2" placeholder="Modele, couleur, delai..."></textarea></label>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn primary full"><i class="fa-solid fa-check"></i> Creer la commande</button>
          <button type="button" class="btn full" data-close>Annuler</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#newOrderForm').addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      const client = state.clients.find(c => c.id === d.clientId);
      const product = state.products.find(p => p.id === d.productId);
      if (!client || !product) return toast('Client ou produit introuvable');
      const qty = Math.max(1, Number(d.qty));
      const deposit = Math.max(0, Number(d.deposit || 0));
      const total = product.price * qty;
      state.orders.unshift({
        id: uid('ord'), at: new Date().toISOString(),
        clientId: client.id, clientName: client.name, phone: d.phone || client.phone,
        items: `${qty}x ${product.name}`, total, deposit,
        status: 'pending', notes: d.notes || ''
      });
      addNotification('Commande client', `Nouvelle commande: ${client.name} - ${d.qty}x ${product.name}`);
      audit('Commande', `${client.name}: ${qty}x ${product.name} (${money(total)})`);
      save('Commande creee');
      active = 'orders'; panel.remove(); render();
    });
  }

  
  function showTransferModal() {
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box">
      <h2><i class="fa-solid fa-arrows-left-right"></i> Transfert de stock</h2>
      <form id="transferForm">
        <div class="grid two">
          <label>Produit<select name="productId" required>${state.products.map(p => `<option value="${esc(p.id)}">${esc(p.name)} - Stock: ${p.qty}</option>`).join('')}</select></label>
          <label>Quantite<input name="qty" type="number" value="1" min="1" required></label>
        </div>
        <div class="grid two">
          <label>De<select name="from" required>${state.settings.shops.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
          <label>Vers<select name="to" required>${state.settings.shops.map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
        </div>
        <label>Note (optionnel)<input name="note" placeholder="Motif du transfert..."></label>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn primary full"><i class="fa-solid fa-check"></i> Transferer</button>
          <button type="button" class="btn full" data-close>Annuler</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#transferForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      if (d.from === d.to) return toast("Selectionnez deux boutiques differentes");
      const qty = Number(d.qty);
      const p = state.products.find(x => x.id === d.productId);
      if (!p) return toast("Produit introuvable");
      if (p.qty < qty) return toast("Stock insuffisant: " + p.name + " (" + p.qty + ")");
      p.qty -= qty;
      state.transferHistory.unshift({ id: uid('tr'), at: new Date().toISOString(), product: p.name, qty, from: d.from, to: d.to, note: d.note, user: state.auth.name });
      audit('Transfert stock', qty + "x " + p.name + ": " + d.from + " -> " + d.to);
      save("Transfert: " + qty + "x " + p.name);
      active = 'stock'; panel.remove(); render();
    });
  }


  function showInventoryModal() {
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box" style="max-width:600px">
      <h2><i class="fa-solid fa-clipboard-list"></i> Inventaire physique</h2>
      <p style="color:var(--muted);font-size:13px">Saisissez la quantite reelle pour chaque produit. L'ecart sera calcule automatiquement.</p>
      <form id="inventoryForm">
        <div class="table" style="max-height:400px;overflow-y:auto">${state.products.map(p => `
          <div class="tr" style="grid-template-columns:1fr 60px 60px">
            <b>${esc(p.name)} (${esc(p.sku)})</b>
            <span style="text-align:center">${p.qty}</span>
            <input type="number" data-inv-id="${esc(p.id)}" value="${p.qty}" min="0" style="width:60px;min-height:36px;padding:4px;text-align:center">
          </div>`).join('')}</div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn primary full"><i class="fa-solid fa-check"></i> Valider l'inventaire</button>
          <button type="button" class="btn full" data-close>Annuler</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#inventoryForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const adjustments = [];
      panel.querySelectorAll('[data-inv-id]').forEach(input => {
        const id = input.dataset.invId;
        const actual = Number(input.value);
        const p = state.products.find(x => x.id === id);
        if (!p) return;
        const diff = actual - p.qty;
        if (diff !== 0) {
          p.qty = actual;
          adjustments.push({ name: p.name, sku: p.sku, before: p.qty - diff, after: actual, diff });
        }
      });
      if (adjustments.length) {
        state.transferHistory.unshift({ id: uid('inv'), at: new Date().toISOString(), product: 'Inventaire', qty: adjustments.length, from: 'Ajustement', to: 'Stock', note: adjustments.map(a => a.name + ": " + a.before + "->" + a.after).join(', '), user: state.auth.name });
        audit('Inventaire', adjustments.length + " produits ajustes");
        save("Inventaire: " + adjustments.length + " produits modifies");
      } else {
        toast('Aucun ecart detecte');
      }
      panel.remove(); render();
    });
  }

/* ─────────── Feature 6: Dépenses ─────────── */
  function expensesView() {
    const total = state.expenses.reduce((s,e) => s+e.amount, 0);
    const byCat = {};
    state.expenses.forEach(e => { byCat[e.category] = (byCat[e.category]||0) + e.amount; });
    return `<div class="grid two"><section class="panel">
      <h2><i class="fa-solid fa-money-bill-wave"></i> Depenses (${money(total)})</h2>
      <button class="btn primary" data-action="new-expense" style="margin-bottom:12px"><i class="fa-solid fa-plus"></i> Nouvelle depense</button>
      <div class="table">${state.expenses.length ? state.expenses.map(e => `<div class="tr" data-exp-id="${esc(e.id)}">
        <b>${esc(e.category)}</b><span style="color:var(--bad);font-weight:700">${money(e.amount)}</span><span>${esc(e.note||'')}</span><small>${new Date(e.at).toLocaleDateString('fr-FR')}</small>
        <button class="btn-icon-sm" data-del-exp="${esc(e.id)}" title="Supprimer"><i class="fa-solid fa-trash-can" style="color:var(--bad)"></i></button>
      </div>`).join('') : empty('Aucune depense')}</div>
    </section><section class="panel">
      <h2><i class="fa-solid fa-chart-pie"></i> Repartition par categorie</h2>
      ${Object.entries(byCat).map(([cat,amt]) => `<div class="row"><b>${esc(cat)}</b><span>${money(amt)}</span></div>`).join('') || empty('Aucune donnee')}
      <div class="row" style="font-weight:700;border-top:2px solid var(--accent);margin-top:8px"><b>Total</b><span style="color:var(--bad)">${money(total)}</span></div>
    </section></div>`;
  }
  function showNewExpenseModal() {
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box">
      <h2><i class="fa-solid fa-plus-circle"></i> Nouvelle depense</h2>
      <form id="expenseForm">
        <label>Categorie<select name="category" required>${EXPENSE_CATEGORIES.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
        <label>Montant FCFA<input name="amount" type="number" required min="1"></label>
        <label>Note / description<textarea name="note" rows="2"></textarea></label>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn primary full"><i class="fa-solid fa-check"></i> Enregistrer</button>
          <button type="button" class="btn full" data-close>Annuler</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#expenseForm').addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      state.expenses.unshift({ id: uid('exp'), at: new Date().toISOString(), category: d.category, amount: Number(d.amount), note: d.note, user: state.auth.name });
      addNotification('Depense', `${d.category}: ${money(Number(d.amount))}`);
      audit('Depense', `${d.category}: ${money(Number(d.amount))}`);
      save('Depense enregistree');
      panel.remove(); active='expenses'; render();
    });
  }
  function bindExpenses() {
    const m = document.getElementById('expenseForm');
    if (m) m.addEventListener('submit', e => { e.preventDefault(); showNewExpenseModal(); });
    document.querySelectorAll('[data-del-exp]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.delExp;
        if (!confirm('Supprimer cette depense ?')) return;
        state.expenses = state.expenses.filter(e => e.id !== id);
        save('Depense supprimee'); render();
      });
    });
  }

  /* ─────────── Feature 7: Promotions & soldes ─────────── */
  function promotionsView() {
    const activePromos = state.products.filter(p => p.promoPrice && p.promoPrice < p.price);
    return `<div class="grid two"><section class="panel">
      <h2><i class="fa-solid fa-tags"></i> Promotions actives (${activePromos.length})</h2>
      <button class="btn primary" data-action="new-promo" style="margin-bottom:12px"><i class="fa-solid fa-plus"></i> Creer une promotion</button>
      <div class="table">${activePromos.length ? activePromos.map(p => {
        const reduction = Math.round((1 - p.promoPrice/p.price)*100);
        return `<div class="tr"><b>${esc(p.name)}</b><span style="text-decoration:line-through;color:var(--muted)">${money(p.price)}</span><span style="color:var(--good);font-weight:700">${money(p.promoPrice)}</span><span class="badge-discount">-${reduction}%</span><button class="btn-icon-sm" data-remove-promo="${esc(p.id)}" title="Retirer promo"><i class="fa-solid fa-xmark" style="color:var(--bad)"></i></button></div>`;
      }).join('') : empty('Aucune promotion active')}</div>
      <h2 style="margin-top:16px"><i class="fa-solid fa-clock-rotate-left"></i> Historique des promos expirees</h2>
      <p style="color:var(--muted);font-size:13px">Les prix promo sont geres directement depuis la fiche produit.</p>
    </section><section class="panel">
      <h2><i class="fa-solid fa-lightbulb"></i> Produits recommandés pour promo</h2>
      ${state.products.filter(p => p.qty > state.settings.lowStock*2 && (!p.promoPrice || p.promoPrice >= p.price)).slice(0,5).map(p =>
        `<div class="row"><b>${esc(p.name)}</b><span>Stock: ${p.qty}</span><span>${money(p.price)}</span></div>`
      ).join('') || empty('Aucune recommandation')}
    </section></div>`;
  }
  function showNewPromoModal() {
    const options = state.products.filter(p => !p.promoPrice || p.promoPrice >= p.price).map(p => `<option value="${esc(p.id)}">${esc(p.name)} - ${money(p.price)} (${esc(p.shop)})</option>`).join('');
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box">
      <h2><i class="fa-solid fa-tag"></i> Creer une promotion</h2>
      <form id="promoForm">
        <label>Produit<select name="productId" required><option value="">Selectionner</option>${options}</select></label>
        <label>Prix promotionnel FCFA<input name="promoPrice" type="number" required min="1"></label>
        <label>Reduction suggeree</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn sm" data-preset="10">-10%</button>
          <button type="button" class="btn sm" data-preset="20">-20%</button>
          <button type="button" class="btn sm" data-preset="30">-30%</button>
          <button type="button" class="btn sm" data-preset="50">-50%</button>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn primary full"><i class="fa-solid fa-check"></i> Appliquer la promo</button>
          <button type="button" class="btn full" data-close>Annuler</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelectorAll('[data-preset]').forEach(b => {
      b.addEventListener('click', () => {
        const sel = panel.querySelector('[name="productId"]');
        const p = state.products.find(x => x.id === sel?.value);
        if (!p) return toast('Selectionner d\'abord un produit');
        const reduction = Number(b.dataset.preset);
        const promo = Math.round(p.price * (100 - reduction) / 100);
        panel.querySelector('[name="promoPrice"]').value = promo;
      });
    });
    panel.querySelector('#promoForm').addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      const p = state.products.find(x => x.id === d.productId);
      if (!p) return toast('Produit introuvable');
      p.promoPrice = Math.max(1, Math.min(Number(d.promoPrice), p.price - 1));
      addNotification('Promotion', `Nouveau prix promo: ${p.name} a ${money(p.promoPrice)}`);
      audit('Promotion', `${p.name}: ${money(p.price)} -> ${money(p.promoPrice)}`);
      save('Promotion creee');
      panel.remove(); active='promotions'; render();
    });
  }
  function bindPromotions() {
    document.querySelectorAll('[data-remove-promo]').forEach(b => {
      b.addEventListener('click', () => {
        const p = state.products.find(x => x.id === b.dataset.removePromo);
        if (!p || !confirm('Retirer la promotion sur ce produit ?')) return;
        p.promoPrice = 0;
        audit('Promotion retiree', p.name);
        save('Promotion retiree'); render();
      });
    });
  }

  /* ─────────── Feature 9: Admin utilisateurs ─────────── */
  function usersView() {
    return `<section class="panel">
      <h2><i class="fa-solid fa-user-gear"></i> Gestion des utilisateurs</h2>
      <button class="btn primary" data-action="new-user" style="margin-bottom:12px"><i class="fa-solid fa-plus"></i> Nouvel utilisateur</button>
      <div class="table">${state.settings.users.map(u => `<div class="tr" data-user-id="${esc(u.id)}">
        <b>${esc(u.name)}</b><span class="user-role-badge role-${esc(u.role)}">${esc(ROLE_LABELS[u.role])}</span><span>${esc(u.shop)}</span>${canSeeCodes() ? `<strong>${esc(u.code)}</strong>` : `<strong style="color:var(--muted);letter-spacing:2px">....</strong>`}
        <div class="actions-row">
          <button class="btn-icon-sm" data-edit-user="${esc(u.id)}" title="Modifier"><i class="fa-solid fa-pen-to-square" style="color:var(--accent)"></i></button>
          <button class="btn-icon-sm" data-reset-pwd="${esc(u.id)}" title="Reinitialiser mot de passe"><i class="fa-solid fa-key" style="color:var(--accent)"></i></button>
          <button class="btn-icon-sm" data-del-user="${esc(u.id)}" title="Supprimer" ${u.id === 'super' ? 'disabled' : ''}><i class="fa-solid fa-trash-can" style="color:var(--bad)"></i></button>
        </div>
      </div>`).join('')}</div>
      <p style="color:var(--muted);font-size:12px;margin-top:12px">Le Super User (0000) ne peut pas etre supprime.</p>
    </section>`;
  }
  function showNewUserModal(editId) {
    const existing = editId ? state.settings.users.find(u => u.id === editId) : null;
    const avatar = existing ? existing.name.charAt(0).toUpperCase() : '👤';
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box">
      <h2><i class="fa-solid ${existing ? 'fa-pen-to-square' : 'fa-user-plus'}"></i> ${existing ? 'Modifier' : 'Nouvel'} utilisateur</h2>
      <form id="userForm">
        <label>Nom complet<input name="name" value="${esc(existing?.name||'')}" required></label>
        <div class="grid two">
          <label>Email<input name="email" type="email" value="${esc(existing?.email||'')}" placeholder="email@exemple.com"></label>
          <label>Telephone<input name="phone" type="tel" value="${esc(existing?.phone||'')}" placeholder="+237XXXXXXXXX"></label>
        </div>
        <div class="grid two">
          <label>Role<select name="role" required>${Object.entries(ROLE_LABELS).filter(([k]) => state.auth.role === 'super' || k !== 'super').map(([k,v]) => `<option value="${esc(k)}" ${existing?.role === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>

        </div>
        <label>Code d'acces (4 chiffres)<input name="code" type="password" value="${esc(existing?.code||'')}" required minlength="4" maxlength="4" pattern="[0-9]{4}"></label>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn primary full"><i class="fa-solid fa-check"></i> ${existing ? 'Enregistrer' : 'Creer'}</button>
          <button type="button" class="btn full" data-close>Annuler</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#userForm').addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.currentTarget));
      if (existing) {
        existing.name = d.name;
        existing.email = d.email || '';
        existing.phone = d.phone || '';
        existing.role = d.role;
        existing.shop = d.shop;
        existing.code = d.code;
        audit('Utilisateur modifie', existing.name);
        save('Utilisateur modifie');
      } else {
        const id = uid('usr');
        state.settings.users.push({ id, name: d.name, email: d.email || '', phone: d.phone || '', role: d.role, code: d.code, shop: d.shop });
        audit('Utilisateur cree', d.name);
        save('Utilisateur cree');
      }
      panel.remove(); active='users'; render();
    });
  }
  function bindUsers() {
    document.querySelectorAll('[data-edit-user]').forEach(b => {
      b.addEventListener('click', () => showNewUserModal(b.dataset.editUser));
    });
    document.querySelectorAll('[data-del-user]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.delUser;
        if (id === 'super' || id === state.auth?.id) return toast('Impossible de supprimer ce compte');
        if (!confirm('Supprimer definitivement cet utilisateur ?')) return;
        state.settings.users = state.settings.users.filter(u => u.id !== id);
        audit('Utilisateur supprime', id);
        save('Utilisateur supprime'); render();
      });
    });
  }

    document.querySelectorAll('[data-reset-pwd]').forEach(b => {
      b.addEventListener('click', () => {
        const u = state.settings.users.find(x => x.id === b.dataset.resetPwd);
        if (!u) return;
        const newCode = Math.floor(1000 + Math.random()*9000).toString();
        u.code = newCode;
        if (u.password) u.password = btoa(newCode);
        audit('Mot de passe reinitialise', u.name);
        toast('Nouveau code pour ' + u.name + ': ' + newCode);
        save(); render();
      });
    });
  /* ─────────── Feature 10: Recherche globale ─────────── */
  function showGlobalSearch() {
    if (!state.auth) return;
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box" style="max-width:800px">
      <h2><i class="fa-solid fa-magnifying-glass"></i> Recherche globale</h2>
      <input id="globalSearchInput" placeholder="Produit, client, vente..." autofocus style="margin-bottom:12px;font-size:16px;padding:12px">
      <div id="globalSearchResults"></div>
      <button type="button" class="btn full" data-close style="margin-top:8px">Fermer</button>
    </div>`;
    document.body.appendChild(panel);
    const input = panel.querySelector('#globalSearchInput');
    const results = panel.querySelector('#globalSearchResults');
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (!q) { results.innerHTML = '<p style="color:var(--muted)">Tapez pour rechercher...</p>'; return; }
      const foundProducts = state.products.filter(p => (p.name+p.sku+p.category+p.shop).toLowerCase().includes(q)).slice(0,10);
      const foundClients = state.clients.filter(c => (c.name+(c.phone||'')).toLowerCase().includes(q)).slice(0,10);
      const foundSales = state.sales.filter(s => (s.clientName+s.method).toLowerCase().includes(q) || String(s.total).includes(q)).slice(0,10);
      let html = '';
      if (foundProducts.length) html += `<h3 style="font-size:14px;margin:8px 0 4px;color:var(--accent)"><i class="fa-solid fa-box"></i> Produits</h3>${foundProducts.map(p => `<div class="search-result" data-nav="stock"><b>${esc(p.name)}</b><span>${esc(p.sku)}</span><span>${esc(p.shop)}</span><span>${money(p.price)}</span></div>`).join('')}`;
      if (foundClients.length) html += `<h3 style="font-size:14px;margin:8px 0 4px;color:var(--accent)"><i class="fa-solid fa-users"></i> Clients</h3>${foundClients.map(c => `<div class="search-result" data-nav="clients"><b>${esc(c.name)}</b><span>${esc(c.phone)}</span><span>${money(c.balance)}</span></div>`).join('')}`;
      if (foundSales.length) html += `<h3 style="font-size:14px;margin:8px 0 4px;color:var(--accent)"><i class="fa-solid fa-receipt"></i> Ventes</h3>${foundSales.map(s => `<div class="search-result" data-nav="reports"><b>${new Date(s.at).toLocaleDateString('fr-FR')}</b><span>${esc(s.clientName)}</span><span>${esc(s.method)}</span><span>${money(s.total)}</span></div>`).join('')}`;
      if (!html) html = '<p style="color:var(--muted)">Aucun resultat</p>';
      results.innerHTML = html;
      results.querySelectorAll('.search-result').forEach(el => {
        el.addEventListener('click', () => { active = el.dataset.nav; panel.remove(); render(); });
      });
    });
    setTimeout(() => input?.focus(), 100);
  }

  function bindOrders() {
    document.querySelectorAll('[data-order-action]').forEach(b => {
      b.addEventListener('click', () => {
        const row = b.closest('[data-order-id]');
        const order = state.orders.find(o => o.id === row?.dataset.orderId);
        if (!order) return;
        const newStatus = b.dataset.orderAction;
        order.status = newStatus;
        const label = ORDER_STATUS[newStatus] || newStatus;
        addNotification('Commande', `Commande ${label.toLowerCase()} : ${order.clientName}`);
        audit('Commande', `${order.clientName}: ${label}`);
        save(`Commande ${label.toLowerCase()}`);
        render();
      });
    });
    document.querySelectorAll('[data-filter-order]').forEach(b => {
      b.addEventListener('click', () => {
        orderFilter = b.dataset.filterOrder;
        render();
      });
    });
    /* Feature 4: Edition commandes clients */
    document.querySelectorAll('[data-edit-order]').forEach(b => {
      b.addEventListener('click', () => {
        const order = state.orders.find(o => o.id === b.dataset.editOrder);
        if (!order) return;
        const panel = document.createElement('div');
        panel.className = 'modal-overlay';
        panel.innerHTML = `<div class="modal-box">
          <h2><i class="fa-solid fa-pen-to-square"></i> Modifier commande</h2>
          <form id="editOrderForm">
            <div class="grid two">
              <label>Client<b>${esc(order.clientName)}</b></label>
              <label>Telephone<input name="phone" value="${esc(order.phone||'')}"></label>
            </div>
            <label>Articles<textarea name="items" rows="2">${esc(order.items||'')}</textarea></label>
            <div class="grid two">
              <label>Total FCFA<input name="total" type="number" value="${order.total}"></label>
              <label>Acompte FCFA<input name="deposit" type="number" value="${order.deposit||0}"></label>
            </div>
            <label>Notes<textarea name="notes" rows="2">${esc(order.notes||'')}</textarea></label>
            <div style="display:flex;gap:8px;margin-top:12px">
              <button class="btn primary full"><i class="fa-solid fa-check"></i> Enregistrer</button>
              <button type="button" class="btn full" data-close>Annuler</button>
            </div>
          </form>
        </div>`;
        document.body.appendChild(panel);
        panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
        panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
        panel.querySelector('#editOrderForm').addEventListener('submit', e2 => {
          e2.preventDefault();
          const d = Object.fromEntries(new FormData(e2.currentTarget));
          order.phone = d.phone; order.items = d.items; order.total = Number(d.total);
          order.deposit = Number(d.deposit||0); order.notes = d.notes;
          addNotification('Commande', `Commande modifiee: ${order.clientName}`);
          audit('Commande modifiee', `${order.clientName}: ${order.items}`);
          save('Commande modifiee'); panel.remove(); render();
        });
      });
    });
  }

  function bindAi() {
    const input = document.getElementById('aiInput');
    const send = document.getElementById('aiSend');
    const msgs = document.getElementById('aiMessages');
    if (!input || !send || !msgs) return;
    const ask = (text) => {
      if (!text.trim()) return;
      msgs.innerHTML += `<div class="ai-msg user"><i class="fa-solid fa-user"></i><div><p>${esc(text)}</p></div></div>`;
      const reply = aiReply(text);
      setTimeout(() => {
        msgs.innerHTML += `<div class="ai-msg ai"><i class="fa-solid fa-robot"></i><div><p>${reply}</p></div></div>`;
        msgs.scrollTop = msgs.scrollHeight;
      }, 300);
      input.value = '';
      msgs.scrollTop = msgs.scrollHeight;
    };
    send.addEventListener('click', () => ask(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') ask(input.value); });
    document.querySelectorAll('[data-ai]').forEach(b => b.addEventListener('click', () => ask(b.dataset.ai)));
  }
  function saveSettingsTheme() {
    const color = document.getElementById('themeColor')?.value || state.settings.themeColor;
    const logo = document.getElementById('logoText')?.value || '';
    const name = document.getElementById('boutiqueName')?.value || state.settings.boutique;
    state.settings.themeColor = color;
    state.settings.logoText = logo || 'OR';
    state.settings.boutique = name;
    state.settings.autoBackup = document.getElementById('autoBackupCheck')?.checked || false;
    const root = document.documentElement;
    root.style.setProperty('--brand', state.settings.themeColor);
    root.style.setProperty('--hero-from', state.settings.themeColor);
    save('Theme mis a jour'); render();
  }
  let _backupInterval = null;
  function initAutoBackup() {
    if (_backupInterval) { clearInterval(_backupInterval); _backupInterval = null; }
    if (state.settings.autoBackup) {
      const interval = (state.settings.backupInterval || 5) * 60 * 1000;
      _backupInterval = setInterval(() => {
        localStorage.setItem(STORE_KEY + '_backup', JSON.stringify(state));
        state.settings.lastBackup = Date.now();
        save();
        audit('Backup auto', 'Sauvegarde automatique effectuee');
      }, interval);
    }
  }
  function bindScreen() {
    bindPos(); bindOperations(); bindStock(); bindSuppliers(); bindClients(); bindAi(); bindOrders(); bindExpenses(); bindPromotions(); bindUsers();
    document.getElementById('saveTheme')?.addEventListener('click', saveSettingsTheme);
    document.getElementById('themeColor')?.addEventListener('input', (e) => {
      document.querySelector('.brand-mark')?.style.setProperty('background', e.target.value);
    });
    document.getElementById('autoBackupCheck')?.addEventListener('change', (e) => {
      state.settings.autoBackup = e.target.checked;
      if (e.target.checked) initAutoBackup();
      save();
    });
  }
  function paginate(arr, n) { return arr.slice(0, n); }
  function showDashCustomizeModal() {
    const allWidgets = [
      ['ca', 'Chiffre d\'affaires'], ['marge', 'Marge brute'], ['stock', 'Stock valorise'],
      ['credits', 'Credits clients'], ['depenses', 'Depenses'], ['caMo', 'CA 30 jours']
    ];
    const current = state.settings.dashWidgets || ['ca','marge','stock','credits'];
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box" style="max-width:480px">
      <h2><i class="fa-solid fa-sliders"></i> Personnaliser le dashboard</h2>
      <p style="color:var(--muted);font-size:13px;margin-bottom:12px">Choisissez les indicateurs a afficher sur le tableau de bord.</p>
      ${allWidgets.map(([k,v]) => `<label class="widget-toggle"><input type="checkbox" data-widget="${k}" ${current.includes(k) ? 'checked' : ''}> ${v}</label>`).join('')}
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn primary full" id="saveWidgets"><i class="fa-solid fa-check"></i> Enregistrer</button>
        <button type="button" class="btn full" data-close>Annuler</button>
      </div>
    </div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#saveWidgets').addEventListener('click', () => {
      const checked = [...panel.querySelectorAll('[data-widget]:checked')].map(cb => cb.dataset.widget);
      state.settings.dashWidgets = checked.length ? checked : ['ca'];
      save('Dashboard personnalise'); panel.remove(); render();
    });
  }
  function empty(text) { return `<div class="empty">${esc(text)}</div>`; }
  function csv(rows) { return rows.map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n"); }
  function download(name, content, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function showNotifications() {
    const notifs = state.notifications || [];
    if (!notifs.length) return toast('Aucune notification');
    const panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.innerHTML = `<div class="notif-header"><h3>Notifications</h3><button class="btn sm" data-action="clear-notifs">Tout lu</button></div>
      ${notifs.map(n => `<div class="notif-item ${n.read ? 'read' : ''}"><b>${esc(n.title)}</b><p>${esc(n.message)}</p><small>${new Date(n.at).toLocaleString('fr-FR')}</small></div>`).join('')}`;
    document.body.appendChild(panel);
    panel.querySelector('[data-action="clear-notifs"]')?.addEventListener('click', () => {
      notifs.forEach(n => n.read = true); save(); panel.remove(); render();
    });
    setTimeout(() => panel.remove(), 5000);
    panel.addEventListener('click', (e) => { if (e.target === panel) panel.remove(); });
  }

  function canSeeCodes() { return state.auth && (state.auth.role === "super" || state.auth.role === "owner"); }
function addNotification(title, message) {
    state.notifications.unshift({ id: uid('n'), at: new Date().toISOString(), title, message, read: false });
    if (state.notifications.length > 50) state.notifications.length = 50;
  }

  function printReceipt() {
    const sale = state.sales[0];
    if (!sale) return toast('Aucune vente a imprimer');
    const w = window.open('', '_blank', 'width=380,height=600');
    w.document.write(`<!DOCTYPE html><html><head><title>Reçu</title><style>
      body{font-family:monospace;padding:16px;max-width:320px;margin:auto}
      h1{font-size:18px;text-align:center;margin:0 0 4px}
      .header{text-align:center;font-size:11px;color:#555;margin-bottom:12px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{padding:4px 0;text-align:left}
      .line{border-top:1px dashed #999}
      .total{font-size:16px;font-weight:bold;text-align:center;margin:12px 0}
      .footer{text-align:center;font-size:10px;color:#888;margin-top:16px}
    </style></head><body>
      <h1>Origin Retail OS</h1>
      <div class="header">${esc(state.settings.boutique)}<br>${new Date(sale.at).toLocaleString('fr-FR')}<br>Caissier: ${esc(sale.cashier)}</div>
      <table><tr><th>Qté</th><th>Article</th><th style="text-align:right">Prix</th></tr>`);
    sale.items.forEach(i => {
      w.document.write(`<tr><td>${i.qty}x</td><td>${esc(i.name)}</td><td style="text-align:right">${money(i.price * i.qty)}</td></tr>`);
    });
    w.document.write(`</table><div class="line"></div><div class="total">Total: ${money(sale.total)}</div>
      <div class="footer">Mode: ${sale.method}<br>Merci de votre visite !</div>
    </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  let _chartInstances = [];
  function renderCharts() {
    if (typeof Chart === 'undefined') return;
    _chartInstances.forEach(c => c.destroy());
    _chartInstances = [];
    const canvas1 = document.getElementById('salesChart');
    const canvas2 = document.getElementById('methodChart');
    if (!canvas1 && !canvas2) return;
    if (canvas1) {
      const days = [];
      const vals = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('fr-FR');
        days.push(key);
        vals.push(getFilteredSales().filter(s => new Date(s.at).toLocaleDateString('fr-FR') === key).reduce((s, v) => s + v.total, 0));
      }
      _chartInstances.push(new Chart(canvas1, {
        type: 'line',
        data: { labels: days, datasets: [{ label: 'Ventes (FCFA)', data: vals, borderColor: '#ff9900', backgroundColor: 'rgba(255,153,0,0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      }));
    }
    if (canvas2) {
      const methods = {};
      getFilteredSales().forEach(s => { methods[s.method] = (methods[s.method] || 0) + s.total; });
      const colors = ['#ff9900', '#0058be', '#2E7D32', '#ba1a1a'];
      _chartInstances.push(new Chart(canvas2, {
        type: 'doughnut',
        data: { labels: Object.keys(methods), datasets: [{ data: Object.values(methods), backgroundColor: colors }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      }));
    }
  }

  function renderMoreCharts() {
    if (typeof Chart === 'undefined') return;
    const c3 = document.getElementById('topProductsChart');
    const c4 = document.getElementById('shopChart');
    const c5 = document.getElementById('categoryChart');
    if (!c3 && !c4 && !c5) return;
    if (c3) {
      const pc = {};
      getFilteredSales().forEach(s => (s.items||[]).forEach(item => { pc[item.name] = (pc[item.name]||0) + item.qty; }));
      const sorted = Object.entries(pc).sort((a,b) => b[1]-a[1]).slice(0,8);
      const cl = ['#ff9900','#0058be','#2E7D32','#ba1a1a','#8B5CF6','#EC4899','#14B8A6','#F59E0B'];
      _chartInstances.push(new Chart(c3, {
        type: 'bar',
        data: { labels: sorted.map(([n]) => n.length>16 ? n.slice(0,14)+'...' : n), datasets: [{ label: 'Quantite', data: sorted.map(([,q]) => q), backgroundColor: cl.slice(0,sorted.length) }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
      }));
    }
    if (c4) {
      const sc = {};
      getFilteredSales().forEach(s => (s.items||[]).forEach(item => {
        const p = state.products.find(x => x.id === item.id);
        sc[p ? p.shop : 'Inconnue'] = (sc[p ? p.shop : 'Inconnue']||0) + item.price * item.qty;
      }));
      _chartInstances.push(new Chart(c4, {
        type: 'bar',
        data: { labels: Object.keys(sc), datasets: [{ label: 'CA (FCFA)', data: Object.values(sc), backgroundColor: ['#0058be','#ff9900','#2E7D32'] }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
      }));
    }
    if (c5) {
      const catSales = {};
      getFilteredSales().forEach(s => (s.items||[]).forEach(item => {
        const p = state.products.find(x => x.id === item.id);
        const cat = p ? p.category : 'Sans categorie';
        catSales[cat] = (catSales[cat]||0) + item.price * item.qty;
      }));
      const catColors = ['#ff9900','#0058be','#2E7D32','#ba1a1a','#8B5CF6','#EC4899','#14B8A6','#F59E0B','#6366F1','#F43F5E'];
      _chartInstances.push(new Chart(c5, {
        type: 'doughnut',
        data: { labels: Object.keys(catSales), datasets: [{ data: Object.values(catSales), backgroundColor: catColors }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      }));
    }
    const c6 = document.getElementById('categoryTrendChart');
    if (c6) {
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString('fr-FR'));
      }
      const catData = {};
      getFilteredSales().forEach(s => {
        const dayKey = new Date(s.at).toLocaleDateString('fr-FR');
        (s.items||[]).forEach(item => {
          const p = state.products.find(x => x.id === item.id);
          const cat = p ? p.category : 'Sans categorie';
          if (!catData[cat]) catData[cat] = {};
          catData[cat][dayKey] = (catData[cat][dayKey]||0) + item.price * item.qty;
        });
      });
      const sortedCats = Object.entries(catData).sort((a,b) => {
        const sumA = Object.values(a[1]).reduce((s,v) => s+v, 0);
        const sumB = Object.values(b[1]).reduce((s,v) => s+v, 0);
        return sumB - sumA;
      });
      const topCats = sortedCats.slice(0, 5);
      const colors = ['#ff9900','#0058be','#2E7D32','#ba1a1a','#8B5CF6'];
      const datasets = topCats.map(([cat, dayMap], i) => ({
        label: cat,
        data: days.map(d => dayMap[d]||0),
        borderColor: colors[i],
        backgroundColor: colors[i]+'22',
        fill: true,
        tension: 0.3
      }));
      _chartInstances.push(new Chart(c6, {
        type: 'line',
        data: { labels: days, datasets },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } } }, scales: { y: { beginAtZero: true } } }
      }));
    }
  }

    function generateReport(period) {
    const m = metrics();
    const now = new Date();
    const filter = period === 'jour' ? d => d.toDateString() === now.toDateString() :
      period === 'semaine' ? d => { const w = new Date(); w.setDate(w.getDate()-7); return d >= w; } :
      d => { const mo = new Date(); mo.setMonth(mo.getMonth()-1); return d >= mo; };
    const filtered = state.sales.filter(s => filter(new Date(s.at)));
    const total = filtered.reduce((s,v) => s+v.total, 0);
    const margin = filtered.reduce((s, sale) => s + sale.items.reduce((x, i) => x + (i.price - i.cost) * i.qty, 0), 0);
    const byMethod = {};
    filtered.forEach(s => { byMethod[s.method] = (byMethod[s.method]||0) + s.total; });
    const low = state.products.filter(p => p.qty <= state.settings.lowStock);
    const debtors = state.clients.filter(c => c.balance > 0);
    const top = [...state.clients].sort((a,b) => (b.points||0)-(a.points||0)).slice(0,3);
    // Top products
    const pc = {};
    filtered.forEach(s => (s.items||[]).forEach(item => { pc[item.name] = (pc[item.name]||0) + item.qty; }));
    const topProducts = Object.entries(pc).sort((a,b) => b[1]-a[1]).slice(0,8);
    // Category sales
    const catSales = {};
    filtered.forEach(s => (s.items||[]).forEach(item => {
      const p = state.products.find(x => x.id === item.id);
      const cat = p ? (p.category||'Autre') : 'Autre';
      catSales[cat] = (catSales[cat]||0) + item.price * item.qty;
    }));
    const periodLabel = { jour: 'Journalier', semaine: 'Hebdomadaire', mois: 'Mensuel' }[period] || period;
    const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rapport ${periodLabel} — ${esc(state.settings.boutique)}</title>
<style>
  @page { margin: 15mm 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 20px; font-size: 13px; line-height: 1.5; }
  .report-header { text-align: center; border-bottom: 3px solid #ff9900; padding-bottom: 16px; margin-bottom: 20px; }
  .report-header h1 { font-size: 24px; color: #131921; margin-bottom: 4px; }
  .report-header .brand { font-size: 12px; color: #888; }
  .report-meta { display: flex; justify-content: space-between; color: #666; font-size: 12px; margin-bottom: 16px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .kpi-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 12px; text-align: center; }
  .kpi-card .label { font-size: 10px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px; }
  .kpi-card .value { font-size: 20px; font-weight: 900; color: #131921; margin-top: 4px; }
  .kpi-card .value.good { color: #007600; }
  .kpi-card .value.bad { color: #b12704; }
  .section { margin-bottom: 20px; }
  .section h2 { font-size: 15px; color: #131921; border-left: 4px solid #ff9900; padding-left: 10px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #131921; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 7px 10px; border-bottom: 1px solid #e9ecef; }
  tr:nth-child(even) td { background: #f8f9fa; }
  .bar-cell { display: flex; align-items: center; gap: 8px; }
  .bar { height: 14px; border-radius: 3px; background: #ff9900; min-width: 4px; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #131921; text-align: center; font-size: 11px; color: #888; }
  .btn-row { text-align: center; margin-bottom: 20px; }
  .btn-row button { background: #ff9900; border: 0; color: #111; padding: 10px 24px; border-radius: 6px; font-weight: 700; font-size: 14px; cursor: pointer; margin: 0 6px; }
  .btn-row button.wa { background: #25D366; color: #fff; }
  .btn-row button:hover { opacity: 0.9; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
  .badge-warn { background: #fef3c7; color: #92400e; }
  .badge-good { background: #d1fae5; color: #065f46; }
  .badge-bad { background: #fee2e2; color: #991b1b; }
  @media print {
    .btn-row { display: none; }
    body { padding: 0; font-size: 11px; }
    .kpi-grid { grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .kpi-card { padding: 8px; }
    .kpi-card .value { font-size: 16px; }
    .section h2 { font-size: 13px; }
    th { padding: 5px 8px; font-size: 10px; }
    td { padding: 5px 8px; font-size: 11px; }
    @page { margin: 10mm 8mm; }
  }
</style>
</head>
<body>
  <div class="report-header">
    <h1>${esc(state.settings.boutique)}</h1>
    <div class="brand">Origin Retail OS — Rapport ${periodLabel}</div>
  </div>
  <div class="report-meta">
    <span>📅 ${dateStr}</span>
    <span>👤 ${esc(state.auth.name)}</span>
    <span>🆔 Rapport #${uid('R').toUpperCase()}</span>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><div class="label">Chiffre d'affaires</div><div class="value good">${money(total)}</div><div style="font-size:11px;color:#888;margin-top:2px">${filtered.length} ventes</div></div>
    <div class="kpi-card"><div class="label">Marge brute</div><div class="value good">${money(margin)}</div><div style="font-size:11px;color:#888;margin-top:2px">${total ? Math.round(margin/total*100) : 0}% de marge</div></div>
    <div class="kpi-card"><div class="label">Stock valorise</div><div class="value">${money(m.stockValue)}</div><div style="font-size:11px;color:#888;margin-top:2px">${state.products.reduce((s,p) => s+p.qty,0)} unites</div></div>
    <div class="kpi-card"><div class="label">Credits clients</div><div class="value bad">${money(m.debt)}</div><div style="font-size:11px;color:#888;margin-top:2px">${debtors.length} debiteurs</div></div>
  </div>

  <div class="section">
    <h2>Ventes par methode de paiement</h2>
    <table>${Object.keys(byMethod).length ? `
      <tr><th>Methode</th><th>Montant</th><th>Part</th></tr>
      ${Object.entries(byMethod).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${money(v)}</td><td><div class="bar-cell"><div class="bar" style="width:${Math.round(v/total*100)}%"></div>${Math.round(v/total*100)}%</div></td></tr>`).join('')}` : '<tr><td style="text-align:center;color:#888">Aucune vente</td></tr>'}</table>
  </div>

  ${topProducts.length ? `<div class="section">
    <h2>Top produits vendus</h2>
    <table><tr><th>#</th><th>Produit</th><th>Quantite</th><th>%</th></tr>
    ${topProducts.map(([name,qty], i) => `<tr><td>${i+1}</td><td>${esc(name)}</td><td>${qty}</td><td><div class="bar-cell"><div class="bar" style="width:${Math.round(qty/topProducts[0][1]*100)}%"></div>${Math.round(qty/topProducts[0][1]*100)}%</div></td></tr>`).join('')}</table>
  </div>` : ''}

  ${Object.keys(catSales).length ? `<div class="section">
    <h2>Ventes par categorie</h2>
    <table><tr><th>Categorie</th><th>Chiffre d'affaires</th><th>Part</th></tr>
    ${Object.entries(catSales).sort((a,b) => b[1]-a[1]).map(([cat,v]) => `<tr><td>${esc(cat)}</td><td>${money(v)}</td><td><div class="bar-cell"><div class="bar" style="width:${Math.round(v/total*100)}%"></div>${Math.round(v/total*100)}%</div></td></tr>`).join('')}</table>
  </div>` : ''}

  <div class="section">
    <h2>Resume</h2>
    <table>
      ${low.length ? `<tr><td>⚠️ Alertes stock</td><td><span class="badge badge-warn">${low.length} produits</span></td></tr>` : '<tr><td>✅ Stock</td><td><span class="badge badge-good">Aucune alerte</span></td></tr>'}
      <tr><td>👥 Debiteurs</td><td><span class="badge ${debtors.length ? 'badge-bad' : 'badge-good'}">${debtors.length} clients (${money(m.debt)})</span></td></tr>
      <tr><td>💰 Depenses periode</td><td>${state.expenses.filter(e => filter(new Date(e.at))).reduce((s,e) => s+e.amount, 0) > 0 ? money(state.expenses.filter(e => filter(new Date(e.at))).reduce((s,e) => s+e.amount, 0)) : 'Aucune depense'}</td></tr>
      ${top.length ? `<tr><td>🏆 Top client</td><td>${esc(top[0].name)} — ${top[0].points||0} pts</td></tr>` : ''}
      <tr><td>📦 Produits en stock</td><td>${state.products.length} produits (${state.products.reduce((s,p) => s+p.qty,0)} unites)</td></tr>
    </table>
  </div>

  <div class="footer">
    <p>Origin Retail OS — Rapport genere le ${dateStr}</p>
    <p style="margin-top:4px;font-size:10px">Ce rapport est horodate et certifie par le systeme d'audit</p>
  </div>

  <div class="btn-row">
    <button onclick="window.print()"><i class="fa-solid fa-file-pdf"></i> 📄 Exporter en PDF</button>
    <button class="wa" onclick="window.open('https://wa.me/?text=${encodeURIComponent('Rapport ' + periodLabel + ' — ' + esc(state.settings.boutique) + ': CA ' + money(total) + ', ' + filtered.length + ' ventes')}')"><i class="fa-brands fa-whatsapp"></i> 📤 Partager WhatsApp</button>
  </div>
</body>
</html>`;

    addNotification('Rapport', `Rapport ${period} genere avec succes`);
    audit('Rapport', `Rapport ${period} genere`);
    const w = window.open('', '_blank', 'width=800,height=700');
    w.document.write(html);
    w.document.close();
    toast(`Rapport ${period} genere`);
  }
  function remindDebt(client) {
    const msg = encodeURIComponent(`Bonjour ${client.name}, Origin Retail OS vous rappelle votre solde de ${money(client.balance)}. Merci de regulariser au plus tot.`);
    if (client.phone) window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g,'')}?text=${msg}`, '_blank');
    else toast('Numero manquant pour ce client');
    audit('Relance WhatsApp', `${client.name}: ${money(client.balance)}`);
  }
  window.remindDebt = remindDebt;

  /* Feature 2: Transfert stock multi-produits */
  function transferStockAdvanced() {
    const html = `<div class="panel">
      <h2><i class="fa-solid fa-arrows-left-right"></i> Transfert stock multi-produits</h2>
      <div id="transferItems">
        <div class="transfer-item">
          <select name="product" class="transfer-product" required><option value="">Produit</option>${state.products.map(p => `<option value="${esc(p.id)}">${esc(p.name)} (${esc(p.shop)}: ${p.qty})</option>`).join('')}</select>
          <input name="qty" type="number" placeholder="Qté" required min="1" class="transfer-qty">
          <button type="button" class="btn-icon-sm" data-del-transfer title="Retirer"><i class="fa-solid fa-xmark" style="color:var(--bad)"></i></button>
        </div>
      </div>
      <button type="button" class="btn sm" id="addTransferItem" style="margin:8px 0"><i class="fa-solid fa-plus"></i> Ajouter un produit</button>
      <div class="grid two" style="margin-top:8px">
        <select id="transferFrom" required><option value="">De (boutique source)</option>${getShops().map(s => `<option>${esc(s)}</option>`).join('')}</select>
        <select id="transferTo" required><option value="">Vers (boutique destination)</option>${getShops().map(s => `<option>${esc(s)}</option>`).join('')}</select>
      </div>
      <button class="btn primary full" id="executeTransfer" style="margin-top:12px"><i class="fa-solid fa-check"></i> Effectuer le transfert</button>
    </div>`;
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `<div class="modal-box">${html}<button class="btn" data-close style="margin-top:8px">Fermer</button></div>`;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', () => panel.remove());
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    panel.querySelector('#addTransferItem')?.addEventListener('click', () => {
      const items = panel.querySelector('#transferItems');
      const div = document.createElement('div');
      div.className = 'transfer-item';
      div.innerHTML = `<select name="product" class="transfer-product" required><option value="">Produit</option>${state.products.map(p => `<option value="${esc(p.id)}">${esc(p.name)} (${esc(p.shop)}: ${p.qty})</option>`).join('')}</select>
        <input name="qty" type="number" placeholder="Qté" class="transfer-qty" required min="1">
        <button type="button" class="btn-icon-sm" data-del-transfer title="Retirer"><i class="fa-solid fa-xmark" style="color:var(--bad)"></i></button>`;
      items.appendChild(div);
    });
    panel.addEventListener('click', e => {
      if (e.target.closest('[data-del-transfer]')) e.target.closest('.transfer-item')?.remove();
    });
    panel.querySelector('#executeTransfer')?.addEventListener('click', () => {
      const from = panel.querySelector('#transferFrom').value;
      const to = panel.querySelector('#transferTo').value;
      if (!from || !to) return toast('Selectionner boutique source et destination');
      if (from === to) return toast('La source et la destination doivent etre differentes');
      const items = panel.querySelectorAll('.transfer-item');
      let transferred = 0;
      items.forEach(item => {
        const pid = item.querySelector('.transfer-product')?.value;
        const qty = Number(item.querySelector('.transfer-qty')?.value || 0);
        if (!pid || qty <= 0) return;
        const p = state.products.find(x => x.id === pid);
        if (!p || qty > p.qty) return toast(`Stock insuffisant pour ${p?.name || 'produit'}`);
        p.qty -= qty;
        const clone = { ...p, id: uid('p'), shop: to, qty };
        state.products.unshift(clone);
        state.transferHistory.unshift({ id: uid('tr'), at: new Date().toISOString(), user: state.auth.name, product: p.name, qty, from, to });
        addNotification('Transfert stock', `${qty}x ${p.name}: ${from} -> ${to}`);
        audit('Transfert stock', `${qty}x ${p.name}: ${from} -> ${to}`);
        transferred += qty;
      });
      if (!transferred) return toast('Aucun produit valide a transferer');
      save('Transfert effectue');
      toast(`✓ ${transferred} unites transferees vers ${to}`);
      panel.remove(); render();
    });
  }

  document.addEventListener('keydown', e => {
    if (!state.auth) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === 'F2') { e.preventDefault(); active = 'pos'; render(); }
    else if (e.key === 'F3') { e.preventDefault(); active = 'dashboard'; render(); }
    else if (e.key === 'F5') { e.preventDefault(); active = 'stock'; render(); }
    else if (e.key === 'F6') { e.preventDefault(); active = 'clients'; render(); }
    else if (e.key === 'F9') { e.preventDefault(); active = 'suppliers'; render(); }
    else if (e.key === 'F10') { e.preventDefault(); active = 'reports'; render(); }
    else if (e.key === 'F12') { e.preventDefault(); active = 'settings'; render(); }
    else if (e.key === 'F4') { e.preventDefault(); active = 'expenses'; render(); }
    else if (e.key === 'F7') { e.preventDefault(); active = 'promotions'; render(); }
    else if (e.key === 'F8') { e.preventDefault(); active = 'users'; render(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); showGlobalSearch(); }
    else if (e.key === 'Escape') { document.querySelector('.modal-overlay, .notif-panel')?.remove(); }
  });

  function saveLoginTheme() {
  var sel = document.getElementById('loginBgStyle');
  if (sel) state.settings.loginBgStyle = sel.value;
  var txt = document.getElementById('loginWelcomeText');
  if (txt) state.settings.loginWelcomeText = txt.value;
  save('Theme login mis a jour');
  render();
}

  const _origRender = render;
  render = function() {
    _origRender();
    setTimeout(() => {
      renderCharts();
      const cb = document.getElementById('themeCheck');
      renderMoreCharts();
      if (cb) cb.onchange = () => { state.theme = cb.checked ? 'dark' : 'light'; save(); render(); };
    }, 50);
  };

    render();
  setTimeout(initAutoBackup, 1000);


  /* ─────────── Wizard 1ère configuration ─────────── */
  function wizardView() {
    return '<main class="login-page"><section class="login-card" style="max-width:520px">' +
      '<div class="login-brand"><div class="login-mark">OR</div><div><strong>Origin Retail OS</strong><span>Configuration initiale</span></div></div>' +
      '<h2 style="text-align:center;margin:16px 0 4px"><i class="fa-solid fa-store"></i> Créez votre première boutique</h2>' +
      '<p style="text-align:center;color:var(--muted);font-size:13px;margin:0 0 16px">Vous pourrez ajouter, renommer ou supprimer des boutiques à tout moment dans les Paramètres.</p>' +
      '<form id="wizardForm">' +
      '<label>Nom de la boutique<input name="shopName" placeholder="Ex: Meshes et Accessoires" required autofocus></label>' +
      '<div id="wizardExtraShops"></div>' +
      '<input type="hidden" name="shopCount" value="1">' +
      '<h3 style="margin-top:20px"><i class="fa-solid fa-tags"></i> Categories de produits</h3>' +
      '<p style="margin:4px 0 8px;font-size:14px;color:var(--text2)">Ajoutez vos categories de produits (ex: Perruques, Accessoires, Cosmetiques)</p>' +
      '<div style="display:flex;gap:8px">' +
      '<input id="wizardCategoryInput" placeholder="Nouvelle categorie" style="flex:1">' +
      '<button class="btn" id="wizardAddCatBtn" type="button"><i class="fa-solid fa-plus"></i></button>' +
      '</div>' +
      '<div id="wizardExtraCats"></div>' +
      '<div style="margin-top:12px"><button class="btn primary full"><i class="fa-solid fa-check"></i> Commencer avec cette boutique</button></div>' +
      '</form>' +
      '<button type="button" class="btn sm full" id="wizardAddBtn" style="margin-top:8px"><i class="fa-solid fa-plus"></i> Ajouter une autre boutique</button>' +
    '</section></main>';
  }

  function bindWizard() {
    var form = document.getElementById('wizardForm');
    var container = document.getElementById('wizardExtraShops');
    document.getElementById('wizardAddCatBtn')?.addEventListener('click', function() {
      var inp = document.getElementById('wizardCategoryInput');
      var name = inp.value.trim();
      if (!name) return;
      var container = document.getElementById('wizardExtraCats');
      var div = document.createElement('div');
      div.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 0';
      div.innerHTML = '<span>' + name + '</span> <button type="button" class="btn sm" onclick="this.parentElement.remove()" style="color:var(--bad)"><i class="fa-solid fa-xmark"></i></button>';
      container.appendChild(div);
      inp.value = '';
      inp.focus();
    });
    document.getElementById('wizardCategoryInput')?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('wizardAddCatBtn')?.click(); }
    });
    var addBtn = document.getElementById('wizardAddBtn');
    var counter = 1;
    function refresh() {
      var h = '';
      for (var i = 2; i <= counter; i++) {
        h += '<label style="margin-top:8px">Boutique ' + i + '<input name="shopName' + i + '" placeholder="Ex: Packaging et Accessoires"></label>';
      }
      if (container) container.innerHTML = h;
      var ci = form && form.querySelector('[name="shopCount"]');
      if (ci) ci.value = counter;
    }
    if (addBtn) addBtn.addEventListener('click', function() {
      counter++;
      refresh();
      if (counter >= 10 && addBtn) addBtn.style.display = 'none';
    });
    if (form) form.addEventListener('submit', function(e) {
      e.preventDefault();
      var d = Object.fromEntries(new FormData(e.currentTarget));
      var shops = [];
      if (d.shopName && d.shopName.trim()) shops.push(d.shopName.trim());
      for (var i = 2; i <= 10; i++) {
        var name = d['shopName' + i];
        if (name && name.trim()) shops.push(name.trim());
      }
      if (!state.settings) state.settings = {};
      state.settings.shops = shops;
      var catEls = document.querySelectorAll('#wizardExtraCats span');
      var cats = [];
      catEls.forEach(function(el) { var t = el.textContent.trim(); if (t) cats.push(t); });
      if (cats.length === 0) cats = ['Meshes', 'Accessoires', 'Packaging'];
      state.settings.categories = cats;
      save('Boutique(s) configurée(s) avec succès');
      render();
    });
  }

  /* ─────────── Gestion boutiques (modal) ─────────── */
  function showShopManager() {
    if (!["super","owner","manager"].includes(state.auth?.role)) return toast("Acces reserve aux gerants et proprietaires");
    var shops = getShops();
    var panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = '<div class="modal-box" style="max-width:520px">' +
      '<h2><i class="fa-solid fa-store"></i> Gérer mes boutiques (' + shops.length + ')</h2>' +
      '<p style="color:var(--muted);font-size:13px;margin-bottom:12px">Ajoutez, renommez ou supprimez vos boutiques. Les produits et utilisateurs liés seront automatiquement mis à jour.</p>' +
      '<div id="shopList">' + shops.map(function(s, i) {
        return '<div class="shop-edit-row" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">' +
          '<input value="' + esc(s) + '" data-se="' + i + '" style="flex:1;min-height:36px;font-weight:700">' +
          '<button class="btn-icon-sm" data-sr="' + i + '" title="Renommer"><i class="fa-solid fa-check" style="color:var(--good)"></i></button>' +
          (shops.length > 1 ? '<button class="btn-icon-sm" data-sd="' + i + '" title="Supprimer"><i class="fa-solid fa-trash-can" style="color:var(--bad)"></i></button>' : '<span style="font-size:11px;color:var(--muted)">Min. 1</span>') +
        '</div>';
      }).join('') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<input id="newShopInput" placeholder="Nouvelle boutique..." style="flex:1;min-height:36px">' +
      '<button class="btn sm" id="shopAddBtn"><i class="fa-solid fa-plus"></i> Ajouter</button>' +
      '</div>' +
      '<button class="btn full" data-close style="margin-top:12px">Fermer</button>' +
    '</div>';
    document.body.appendChild(panel);
    panel.querySelector('[data-close]')?.addEventListener('click', function() { panel.remove(); });
    panel.addEventListener('click', function(e) { if (e.target === panel) panel.remove(); });
    panel.querySelector('#shopAddBtn')?.addEventListener('click', function() {
      var name = (panel.querySelector('#newShopInput')?.value || '').trim();
      if (!name) return;
      if (getShops().indexOf(name) >= 0) return toast('Cette boutique existe déjà');
      state.settings.shops.push(name);
      save('Boutique ajoutée');
      panel.remove();
      showShopManager();
    });
    panel.querySelectorAll('[data-sr]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var i = Number(btn.dataset.sr);
        var oldName = getShops()[i];
        var newName = (panel.querySelector('[data-se="' + i + '"]')?.value || '').trim();
        if (!newName || newName === oldName) return;
        if (getShops().some(function(s, j) { return j !== i && s === newName; })) return toast('Ce nom existe déjà');
        state.settings.shops[i] = newName;
        state.products.forEach(function(p) { if (p.shop === oldName) p.shop = newName; });
        (state.settings.users || []).forEach(function(u) { if (u.shop === oldName) u.shop = newName; });
        save('Boutique renommée');
        panel.remove();
        showShopManager();
      });
    });
    panel.querySelectorAll('[data-sd]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var i = Number(btn.dataset.sd);
        var name = getShops()[i];
        if (getShops().length <= 1) return toast('Au moins une boutique requise');
        var fallback = getShops()[0] === name ? getShops()[1] : getShops()[0];
        if (!confirm('Supprimer "' + name + '" ?\nLes produits et utilisateurs seront réassignés à "' + fallback + '".')) return;
        state.products.forEach(function(p) { if (p.shop === name) p.shop = fallback; });
        (state.settings.users || []).forEach(function(u) { if (u.shop === name) u.shop = fallback; });
        state.settings.shops = state.settings.shops.filter(function(_, j) { return j !== i; });
        save('Boutique supprimée');
        panel.remove();
        showShopManager();
      });
    });
  }
  function showCategoryManager() {
    if (!["super","owner","manager"].includes(state.auth?.role)) return toast("Acces reserve aux gerants et proprietaires");
    var p = document.getElementById('panelOverlay');
    if (!p) { render(); p = document.getElementById('panelOverlay'); }
    if (!p) return toast('Erreur: panelOverlay introuvable');
    function renderCatList() {
      var cats = getCategories();
      p.innerHTML = '<div class="panel"><div class="section-title"><h2><i class="fa-solid fa-tags"></i> Gerer les categories</h2><button class="btn" onclick="panelOverlay.innerHTML=\'\';return false"><i class="fa-solid fa-xmark"></i></button></div>' +
        '<p style="margin:8px 0;color:var(--text2)">Ajoutez, renommez ou supprimez des categories de produits. Les produits lies seront automatiquement mis a jour.</p>' +
        '<div id="catList">' + cats.map(function(s, i) {
          return '<div style="display:flex;align-items:center;gap:8px;margin:6px 0;padding:6px 8px;background:var(--bg);border-radius:6px">' +
            '<span style="flex:1;font-weight:600">' + esc(s) + '</span>' +
            '<button class="btn sm" data-ce="' + i + '"><i class="fa-solid fa-pen"></i></button>' +
            (cats.length > 1 ? '<button class="btn sm" data-cd="' + i + '" style="color:var(--bad)"><i class="fa-solid fa-trash-can"></i></button>' : '<span style="font-size:11px;color:var(--muted)">Min. 1</span>') +
            '</div>';
        }).join('') +
        '<div style="display:flex;gap:8px;margin-top:12px"><input id="catNewName" placeholder="Nouvelle categorie" style="flex:1"><button class="btn primary" id="catAddBtn"><i class="fa-solid fa-plus"></i> Ajouter</button></div>' +
        '<p style="margin-top:8px;font-size:12px;color:var(--text2)"><i class="fa-solid fa-info-circle"></i> Les produits lies sont automatiquement reassignes.</p></div>';
      p.querySelectorAll('[data-ce]').forEach(function(btn) {
        btn.onclick = function() {
          var idx = Number(this.dataset.ce);
          var cats = getCategories();
          var newName = prompt('Nouveau nom pour "' + cats[idx] + '":', cats[idx]);
          if (!newName || newName.trim() === '' || newName.trim() === cats[idx]) return;
          var oldName = cats[idx];
          state.settings.categories[idx] = newName.trim();
          state.products.forEach(function(pr) { if (pr.category === oldName) pr.category = newName.trim(); });
          save();
          renderCatList();
        };
      });
      p.querySelectorAll('[data-cd]').forEach(function(btn) {
        btn.onclick = function() {
          var idx = Number(this.dataset.cd);
          var cats = getCategories();
          if (cats.length <= 1) { toast('Il faut au moins une categorie'); return; }
          if (!confirm('Supprimer "' + cats[idx] + '" ? Les produits seront reassignes a la premiere categorie.')) return;
          var oldName = cats[idx];
          state.settings.categories.splice(idx, 1);
          state.products.forEach(function(pr) { if (pr.category === oldName) pr.category = state.settings.categories[0]; });
          save();
          renderCatList();
        };
      });
      document.getElementById('catAddBtn').onclick = function() {
        var inp = document.getElementById('catNewName');
        var name = inp.value.trim();
        if (!name) { toast('Entrez un nom de categorie'); return; }
        state.settings.categories.push(name);
        inp.value = '';
        save();
        renderCatList();
      };
      document.getElementById('catNewName').onkeydown = function(e) {
        if (e.key === 'Enter') document.getElementById('catAddBtn').click();
      };
    }
    renderCatList();
  }

})();
