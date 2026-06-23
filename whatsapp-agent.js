const fs = require("fs");
const path = require("path");

// ─── Constantes ─────────────────────────────────────────────────────────────

const ROLE_LABELS = { super: "Super User", owner: "Proprietaire", manager: "Gerante", cashier: "Caissiere", client: "Client" };

const SHOPS = ["Meshes et Accessoires", "Packaging et Accessoires Cosmetiques"];

const CLIENT_INTENTS = [
  { id:"greeting", keywords:["bonjour","salut","bonsoir","hello","hi","coucou","hey","cc","salam","bien le bonjour"], weight:10 },
  { id:"debt", keywords:["dette","solde","credit","payer","paiement","dois","montant","reste","echeance","facture","impaye"], weight:9 },
  { id:"product", keywords:["produit","prix","catalogue","article","disponible","avoir","stock","vente","acheter","commander","tarif","combien","cout","prix","perruque","bonnet","colle","bande","pot","flacon","etiquette","spatule","creme","serum","cosmetique","wig","lace","cap","articles","collection","nouveaute","catalog","catalo","presente","montre"], weight:8 },
  { id:"recommend", keywords:["conseil","recommander","proposer","suggestion","besoin","cherche","quel","idee","avis","quoi","conseille"], weight:7 },
  { id:"loyalty", keywords:["point","fidelite","carte","fidele","reduction","promo","offre","bon plan","avantage","fidelite"], weight:6 },
  { id:"objection", keywords:["cher","trop cher","pas besoin","plus tard","revendre","reflechir","voir","peut-etre","apres","reflechis"], weight:5 },
  { id:"order", keywords:["livraison","commander","commande","acheter","reserver","depot","acompte","urgence","rapide","precommande"], weight:6 },
  { id:"complaint", keywords:["probleme","plainte","reclamation","insatisfait","rembourser","defectueux","casse","erreur","abimer"], weight:7 },
  { id:"hours", keywords:["horaire","ouvert","ferme","quand","acces","heure","dimanche","samedi"], weight:5 },
  { id:"thanks", keywords:["merci","merci beaucoup","merci bien","grace","super","genial","parfait","top"], weight:3 },
  { id:"goodbye", keywords:["au revoir","bonne journee","bonne soiree","a bientot","ciao","bye","a plus","bonne nuit","bonne continuation"], weight:4 }
];

const EMPLOYEE_INTENTS = [
  { id:"rapport", keywords:["rapport","resume","dashboard","bilan","kpi","chiffre","performance","recap","synthese","panorama"], weight:10 },
  { id:"stock", keywords:["stock","rupture","alerte","quantite","inventaire","manque","epuise","reapprovisionner","seuil"], weight:9 },
  { id:"caisse", keywords:["caisse","cloture","session","ecart","fond","shift","ouvert","ferme","encaisse"], weight:8 },
  { id:"ventes", keywords:["vente","ca","chiffre","recette","cash","momo","orange","transaction","journal"], weight:8 },
  { id:"clients", keywords:["client","dette","recouvrement","impaye","debiteur","solde","relance","recouvrer"], weight:7 },
  { id:"produits", keywords:["produit","prix","catalogue","article","categorie","marque","gamme"], weight:7 },
  { id:"fournisseurs", keywords:["fournisseur","commande","achat","livraison","approvisionnement","appro"], weight:6 },
  { id:"employes", keywords:["employe","personnel","equipe","caissiere","gerante","utilisateur","role","acces"], weight:5 },
  { id:"taches", keywords:["tache","a faire","todo","priorite","rappel","echeance","urgent"], weight:5 },
  { id:"parametres", keywords:["parametre","config","boutique","magasin","theme","sauvegarde","backup"], weight:4 },
  { id:"audit", keywords:["audit","historique","journal","connexion","activite","trace","log"], weight:5 },
  { id:"depenses", keywords:["depense","cout","frais","loyer","electricite","charge"], weight:6 },
  { id:"help", keywords:["aide","help","que faire","commandes","possible","fonctionnalite","tuto"], weight:3 }
];

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function digits(v) { return String(v||"").replace(/\D/g,""); }

function money(v) {
  return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"XAF",maximumFractionDigits:0}).format(Number(v||0));
}

function esc(v) { return String(v??"").replace(/[&<>"']/g,(m)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[m]); }

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function truncate(str, max) { return str.length > max ? str.slice(0,max-3)+"..." : str; }

function fullName(name) { return String(name||"").trim() || "Client"; }

function firstName(name) { return String(name||"").trim().split(/\s+/)[0] || "vous"; }

function timeSince(ts) {
  const min = Math.round((Date.now()-new Date(ts).getTime())/60000);
  if (min < 1) return "a l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min/60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h/24)}j`;
}

// ─── State helpers ──────────────────────────────────────────────────────────

function readState(stateFile) {
  if (!fs.existsSync(stateFile)) return null;
  try { return JSON.parse(fs.readFileSync(stateFile,"utf8")); }
  catch { return null; }
}

function writeStatus(statusFile, payload) {
  fs.mkdirSync(path.dirname(statusFile),{recursive:true});
  fs.writeFileSync(statusFile,JSON.stringify({...payload,at:new Date().toISOString()},null,2));
}

function findIdentity(state, phone) {
  if (!state) return { type:"unknown" };
  const number = digits(phone);
  const users = state.settings?.users || [];
  const user = users.find(u => digits(u.phone) && number.endsWith(digits(u.phone).slice(-8)));
  if (user) return { type:"employee", user, role:user.role, shop:user.shop };
  const client = (state.clients||[]).find(c => digits(c.phone) && number.endsWith(digits(c.phone).slice(-8)));
  if (client) return { type:"client", client, role:"client", shop:"client" };
  return { type:"unknown", role:"unknown", shop:"unknown" };
}

// ─── Scoped data ────────────────────────────────────────────────────────────

function scopedProducts(state, identity) {
  const products = state.products || [];
  if (["super","owner"].includes(identity.role)) return products;
  if (identity.shop && identity.shop !== "all" && identity.shop !== "client")
    return products.filter(p => p.shop === identity.shop);
  return products;
}

function scopedSales(state, identity) {
  const products = scopedProducts(state, identity);
  const productIds = new Set(products.map(p => p.id));
  return (state.sales || []).map(sale => {
    const items = sale.items.filter(item => productIds.has(item.id));
    return {...sale, items, total: items.reduce((s,i) => s+i.price*i.qty, 0)};
  }).filter(sale => sale.items.length);
}

function metrics(state, identity) {
  const products = scopedProducts(state, identity);
  const sales = scopedSales(state, identity);
  const salesTotal = sales.reduce((s,v) => s+v.total, 0);
  const stockValue = products.reduce((s,p) => s+p.qty*p.cost, 0);
  const margin = sales.reduce((s,sale) => s + sale.items.reduce((x,i) => x+(i.price-i.cost)*i.qty,0), 0);
  const low = products.filter(p => p.qty <= (state.settings?.lowStock||5));
  return { salesTotal, stockValue, margin, low, products, sales };
}

// ─── Loyalty tier ───────────────────────────────────────────────────────────

function loyaltyTier(pts) {
  if (pts >= 5000) return { label:"Platine", icon:"👑", desc:"VIP premium" };
  if (pts >= 2000) return { label:"Or", icon:"⭐", desc:"Client fidele" };
  if (pts >= 500) return { label:"Argent", icon:"🥈", desc:"Bon client" };
  return { label:"Bronze", icon:"🟤", desc:"Nouveau client" };
}

// ─── Conversation Memory ─────────────────────────────────────────────────────

const convMemory = new Map();

function getContext(phone) {
  if (!convMemory.has(phone)) {
    convMemory.set(phone, {
      topic: null,
      history: [],
      visitCount: 0,
      firstVisit: Date.now(),
      lastInteraction: null,
      pendingAction: null,
      name: null,
      temp: {}
    });
  }
  return convMemory.get(phone);
}

function updateContext(phone, data) {
  const ctx = getContext(phone);
  Object.assign(ctx, data);
  ctx.lastInteraction = Date.now();
  ctx.history.push({ at: new Date().toISOString(), ...data });
  if (ctx.history.length > 50) ctx.history = ctx.history.slice(-50);
}

// Clean old contexts every 10 min
setInterval(() => {
  const now = Date.now();
  for (const [phone, ctx] of convMemory) {
    if (ctx.lastInteraction && now - ctx.lastInteraction > 7200000) { // 2h
      convMemory.delete(phone);
    }
  }
}, 600000);

// ─── Intent Detection ───────────────────────────────────────────────────────

function detectIntent(intents, message) {
  const msg = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  let scores = [];
  for (const intent of intents) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (msg.includes(kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""))) {
        score += intent.weight;
      }
    }
    if (score > 0) scores.push({ id: intent.id, score });
  }
  scores.sort((a,b) => b.score - a.score);
  return scores.length ? scores[0].id : "unknown";
}

// ─── CLIENT AGENT ────────────────────────────────────────────────────────────
// Psychologie de vente : mirroring, preuve sociale, rareté, closing

function clientReply(state, client, message, ctx) {
  const msg = message.toLowerCase();
  const intent = detectIntent(CLIENT_INTENTS, msg);
  const name = firstName(client.name);
  const full = fullName(client.name);
  ctx.visitCount++;

  // Check if in the middle of an ordering flow
  if (ctx.temp.orderStep) {
    return clientNewOrder(state, client, message, ctx);
  }

  // Check if user wants to create a new order (vs view existing)
  const wantsToOrder = /veux commander|veux acheter|voudrais commander|voudrais acheter|passer commande|je commande|je prends|j achete|nouvelle commande/.test(msg) ||
    (intent === "order" && /commander|acheter|prendre|reserver|precommander/.test(msg));

  // ─── DÉTECTION INTELLIGENTE ──────────────────────────────────────────────
  // Si le message contient "bonjour" MAIS aussi des mots du catalogue,
  // on ne bloque pas sur l'intention greeting — on detecte le vrai besoin
  const productKeywords = ["catalogue","produit","prix","article","stock","perruque","bonnet","colle","bande","pot","flacon","etiquette","spatule","creme","serum","cosmetique","wig","lace","cap","presente","montre","voir","avoir","collection","nouveaute","disponible","combien","tarif","cout","coute","articles","achat","acheter","commander","catalog","catalo","vente","accessoire","chose","dispo","existe","presenter","liste","reference","choix","gamme","selection","article","model","type","marque","categorie"];
  const hasProductIntent = msg.length > 3 && productKeywords.some(kw => msg.includes(kw));

  // Si greeting + mots produits → direction catalogue direct
  const effectiveIntent = (intent === "greeting" && hasProductIntent) ? "product" : intent;

  // Si greeting + mots fidelite/solde → direction compte
  const hasAccountIntent = /solde|compte|avoir|fidelite|point|carte|credits/i.test(msg);
  const effectiveIntentV2 = (effectiveIntent === "greeting" && hasAccountIntent) ? "debt" : effectiveIntent;
  
  // Utiliser l'intention finale (tient compte des surcharges)
  // Si le message veut commander, on FORCE l'intention order (même si produits détecté)
  const finalIntent = wantsToOrder ? "order" : effectiveIntentV2;

  const handlers = {
    greeting: () => clientGreeting(state, client, ctx),
    debt: () => clientDebt(state, client, ctx),
    product: () => clientProducts(state, client, msg, ctx),
    recommend: () => clientRecommend(state, client, ctx),
    loyalty: () => clientLoyalty(state, client, ctx),
    objection: () => clientObjection(state, client, msg, ctx),
    order: () => wantsToOrder ? clientNewOrder(state, client, msg, ctx) : clientOrder(state, client, ctx),
    complaint: () => clientComplaint(state, client, msg, ctx),
    hours: () => clientHours(state, ctx),
    thanks: () => pick([
      `Avec plaisir ${name} ! N'hesitez surtout pas si vous avez d'autres questions, je suis la. 😊`,
      `Merci a vous ${name} ! C'est toujours un plaisir de vous aider. A tres vite !`,
      `Je vous en prie ${name} ! Si vous voulez, je peux aussi vous tenir au courant de nos nouvelles arrivees.`,
      `Tout le plaisir est pour moi ${name} ! Passez une excellente journee.`,
      `De rien ${name} ! N'hesitez pas si vous avez besoin de quoi que ce soit. 😊`
    ]),
    goodbye: () => pick([
      `Au revoir ${name} ! Revenez quand vous voulez, je suis la pour vous. 😊`,
      `Bonne journee ${name} ! N'oubliez pas, nous avons des nouveautes chaque semaine. A bientot !`,
      `A bientot ${name} ! Prenez soin de vous.`,
      `A tres vite ${name} ! Passez une excellente journee.😊`,
      `Au plaisir de vous revoir ${name} ! Si vous avez des questions, je suis la.`
    ]),
    unknown: () => {
      if (ctx.visitCount === 1) {
        return pick([
          `Bonjour ${name} ! Je suis l'assistant de Meshes & Co. 😊 Je peux vous renseigner sur nos produits, vos achats, votre solde ou vous conseiller selon vos besoins. Qu'est-ce qui vous interesse ?`,
          `${name}, bonjour et bienvenue ! Je suis votre conseillere boutique. Besoin de voir notre catalogue, de connaître vos points de fidelite ou de passer une commande ?`,
          `Bienvenue ${name} ! Ravi de vous compter parmi nos clients. Dites-moi ce que je peux faire pour vous : consulter nos produits, verifier votre solde ou obtenir des conseils personnalises ?`,
          `${name} ! Un plaisir de vous accueillir. Je suis votre assistante boutique. Besoin d'informations sur nos produits, votre compte ou les horaires ? Dites-moi ! 😊`
        ]);
      }
      return pick([
        `${name}! Je suis la pour vous aider. Voulez-vous voir nos produits, verifier votre solde ou decouvrir nos offres du moment ?`,
        `Oui ${name} ? 😊 Dites-moi tout, je vous ecoute.`,
        `Je vous ecoute ${name} ! N'hesitez pas a me demander ce dont vous avez besoin.`,
        `${name} ! Qu'est-ce que je peux faire pour vous aujourd'hui 😊 ?`
      ]);
    }
  };

  const reply = (handlers[finalIntent] || handlers.unknown)();
  updateContext(phoneFromClient(client), { topic: finalIntent, lastIntent: finalIntent });
  return truncate(reply, 4000);
}

// Helper to get phone from client object
function phoneFromClient(client) {
  return digits(client.phone) || "unknown";
}

function clientGreeting(state, client, ctx) {
  const name = firstName(client.name);
  const tier = loyaltyTier(client.points || 0);
  const lastSale = state.sales?.filter(s => s.clientName === client.name)[0];
  const ago = lastSale ? timeSince(lastSale.at) : null;

  const greetingVariant = Math.floor(Math.random() * 6);
  let msg;

  if (ctx.visitCount <= 1) {
    if (greetingVariant === 0) {
      msg = `Bonjour ${name} ! 😊 Bienvenue sur l'assistant Meshes & Co. `;
    } else if (greetingVariant === 1) {
      msg = `${name}, ravie de vous retrouver ! 😊 Bienvenue. `;
    } else if (greetingVariant === 2) {
      msg = `Bonjour ${name} ! 😊 Content de vous voir. `;
    } else if (greetingVariant === 3) {
      msg = `Heureuse de vous accueillir ${name} ! 😊 Bienvenue chez Meshes & Co. `;
    } else if (greetingVariant === 4) {
      msg = `${name}, bonjour ! 😊 Merci d'avoir pris contact avec nous. `;
    } else {
      msg = `Bonjour ${name} ! 😊 Ravi(e) de vous compter parmi nous. `;
    }
    if (client.balance > 0) {
      msg += pick([
        `Je vois que vous avez un solde de ${money(client.balance)}. Voulez-vous en parler ou decouvrir nos nouveautes ?`,
        `J'ai note que vous avez ${money(client.balance)} de solde. On en discute ou je vous montre nos nouveaux articles ?`,
        `Au fait, il y a un solde de ${money(client.balance)} sur votre compte. Rien de pressant, mais on peut en parler si vous voulez. Sinon, j'ai des nouveaux produits a vous montrer !`
      ]);
    } else {
      msg += pick([
        `Nous avons de superbes nouveautes en ce moment. Voulez-vous que je vous presente notre catalogue ?`,
        `Des nouvelles collections viennent d'arriver, ca vous dirait de jeter un oeil ?`,
        `J'ai des articles qui viennent tout juste d'arriver en boutique. Je vous montre ?`,
        `Notre nouveau stock vient d'etre mis a jour, avec de belles surprises ! Vous voulez voir ?`,
        `Je viens de recevoir des articles fraichement arrives qui pourraient vous plaire. Je vous les presente ?`
      ]);
    }
  } else {
    msg = pick([
      `Rebonjour ${name} ! 😊 Ravi de vous revoir. `,
      `${name} ! 😊 Content de vous retrouver. `,
      `Bonjour ${name} ! 😊 C'est toujours un plaisir. `,
      `${name} ! 😊 De retour parmi nous, super ! `,
      `Et voila notre fidele ${name} ! 😊 Bonjour ! `
    ]);
    if (ago && ctx.visitCount > 1) {
      msg += pick([
        `Votre dernier achat remonte a ${ago}, j'espere que tout va bien avec. `,
        `Ca faisait ${ago} qu'on ne s'etait pas parlés ! `,
        `Je crois que votre derniere visite remonte a ${ago}, non ? `,
        `Il y a ${ago} de cela, vous faisiez vos dernieres emplettes ! `,
        `Ca remonte a ${ago} votre dernier passage ! `
      ]);
    }
    msg += pick([
      `Que puis-je pour vous aujourd'hui ?`,
      `Qu'est-ce qui vous amene ?`,
      `En quoi puis-je vous aider ?`,
      `Que puis-je faire pour vous aujourd'hui ?`,
      `Qu'est-ce qui vous ferait plaisir aujourd'hui ?`
    ]);
  }
  if ((client.points||0) > 0) {
    msg += `\n\nVous avez ${client.points} pts fidelite (${tier.label} ${tier.icon}).`;
  }
  return msg;
}

function clientDebt(state, client, ctx) {
  const name = firstName(client.name);
  const balance = Math.abs(client.balance || 0);
  const hasDebt = client.balance > 0;
  const hasCredit = client.balance < 0; // credit en faveur du client

  if (balance === 0) {
    return pick([
      `Bonjour ${name} ! Votre compte est tout a fait a jour, aucun solde en cours. 👍\n\nC'est le moment de decouvrir nos nouveautes ! Voulez-vous voir notre catalogue ?`,
      `${name}, vous etes a jour sur tous vos paiements ! 👍\n\nEnvie de voir les nouveaux articles qui viennent d'arriver ?`,
      `Tout est en regle ${name}, aucun solde impaye. 😊\n\nJ'ai des nouveautes qui pourraient vous interesser, je vous montre ?`
    ]);
  } else if (hasDebt) {
    const detailVariant = Math.floor(Math.random() * 2);
    let msg;
    if (detailVariant === 0) {
      msg = `${name}, voici le detail de votre compte :\n💰 Solde actuel : ${money(balance)}\n📅 Echeance : ${client.dueDate || "A convenir avec la boutique"}\n\n`;
    } else {
      msg = `${name}, voila pour votre solde :\n💳 Montant : ${money(balance)}\n📅 ${client.dueDate ? `Echeance : ${client.dueDate}` : "Date a convenir avec la boutique"}\n\n`;
    }

    if (balance > 50000) {
      msg += pick([
        `Je vois que le montant est consequent. Pas d'inquietude, on peut trouver ensemble une solution de paiement echelonne si besoin. Voulez-vous qu'on en parle ? 😊`,
        `Le montant est un peu eleve, je comprends. On peut voir ensemble comment echelonner si ca vous arrange. Qu'est-ce que vous en pensez ?`
      ]);
    } else if (balance > 10000) {
      msg += pick([
        `Si vous souhaitez reguler cette somme, passez en boutique ou faites un mobile money au numero de la gerante. Je reste a votre disposition !`,
        `Vous pouvez passer en boutique ou faire un virement Mobile Money quand vous voulez. La gerante est disponible pour vous arranger si besoin.`
      ]);
    } else {
      msg += pick([
        `Un petit geste et c'est regle ! Vous pouvez passer en boutique quand vous passez dans le coin.`,
        `C'est un petit montant, vous pouvez le regler en passant nous voir en boutique 😊`
      ]);
    }

    const cheap = (state.products||[]).filter(p => p.qty > 0 && p.price < 5000).slice(0,2);
    if (cheap.length && Math.random() > 0.4) {
      msg += `\n\nEn passant, nous avons des accessoires a partir de ${money(cheap[0].price)} qui pourraient vous interesser.`;
    }
    return msg;

  } else {
    return pick([
      `${name} ! Vous avez un avoir de ${money(balance)} en votre faveur. 🎉\nProfitez-en pour decouvrir nos nouvelles collections ! Voulez-vous voir ce qui est disponible ?`,
      `Bonne nouvelle ${name} ! Vous avez ${money(balance)} de credit sur votre compte. 🎉\nC'est le moment de faire le plein de nouveautes !`,
      `${name}, vous avez ${money(balance)} d'avoir a utiliser ! 😊\nJ'ai de beaux articles qui viennent d'arriver, voulez-vous jeter un oeil ?`
    ]);
  }
}

function clientProducts(state, client, message, ctx) {
  const name = firstName(client.name);
  const msg = message.toLowerCase();

  let products = (state.products||[]).filter(p => p.qty > 0);

  // Try to extract a search term
  const searchTerms = ["perruque","bonnet","colle","bande","pot","flacon","etiquette","spatule","creme","serum","cosmetique","wig","lace","cap"];
  let foundTerm = null;
  for (const term of searchTerms) {
    if (msg.includes(term)) {
      foundTerm = term;
      products = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      );
      break;
    }
  }

  if (products.length === 0) {
    if (foundTerm) {
      return pick([
        `Ah desole ${name}, je n'ai rien en "${foundTerm}" pour l'instant. Par contre j'ai d'autres trucs sympa si vous voulez jeter un oeil ?`,
        `${name}, malheureusement je n'ai plus de ${foundTerm} en stock en ce moment. Mais j'ai d'autres articles qui pourraient vous plaire, voulez-vous voir ?`
      ]);
    }
    return pick([
      `Desole ${name}, je suis en rupture de stock sur tout pour l'instant. Nouvelle livraison prevue la semaine prochaine, repassez me voir 😊`,
      `Oups, tout est ecoule ${name} ! Je attends une livraison fraiche dans quelques jours, je vous redis quand c'est la ?`
    ]);
  }

  const show = products.slice(0, 5);

  // Plusieurs facons de presenter -> variation naturelle
  const variant = Math.floor(Math.random() * 5);
  let reply;

  if (variant === 0) {
    reply = `Alors voila ce que j'ai pour vous ${name} :\n\n`;
    show.forEach((p, i) => {
      if (p.promoPrice && p.promoPrice < p.price) {
        reply += `${i+1}. ${p.name} — ${money(p.promoPrice)} au lieu de ${money(p.price)} (promo 😉)\n`;
      } else {
        reply += `${i+1}. ${p.name} — ${money(p.price)}\n`;
      }
    });
    if (products.length > 5) reply += `\n... et encore ${products.length - 5} autres articles.`;
    reply += `\n\nCa vous interesse ? Dites-moi lequel et je vous donne plus de details !`;

  } else if (variant === 1) {
    const promos = show.filter(p => p.promoPrice && p.promoPrice < p.price);
    reply = `${name} regardez un peu ce que j'ai pour vous :\n\n`;
    show.forEach((p, i) => {
      const priceStr = p.promoPrice && p.promoPrice < p.price ? `${money(p.promoPrice)} (au lieu de ${money(p.price)})` : `${money(p.price)}`;
      reply += `• ${p.name} — ${priceStr}\n`;
    });
    if (promos.length > 0) reply += `\nY'a des promos qui dechirent en ce moment ! 👀`;
    if (products.length > 5) reply += `\n\nJ'ai ${products.length} articles en tout si vous voulez voir plus.`;
    reply += `\n\nVous voulez qu'on regarde un article en particulier ?`;

  } else if (variant === 2) {
    reply = `Avec plaisir ${name} ! Voici ce qui est dispo :\n\n`;
    show.forEach((p, i) => {
      reply += `${i+1}. ${p.name}`;
      if (p.promoPrice && p.promoPrice < p.price) {
        reply += ` — en promo ! ${money(p.promoPrice)} au lieu de ${money(p.price)}`;
      } else {
        reply += ` — ${money(p.price)}`;
      }
      reply += `\n`;
    });
    const lowStock = products.filter(p => p.qty <= 3);
    if (lowStock.length > 0 && Math.random() > 0.5) reply += `\nPsst : ${lowStock[0].name} n'en reste plus beaucoup si vous voulez etre sur d'en avoir.`;
    if (products.length > 5) reply += `\n\nJ'ai ${products.length - 5} autres references si vous voulez voir.`;
    reply += `\n\nDites-moi lequel vous interesse ?`;

  } else if (variant === 3) {
    reply = `${name}, je vous montre ce qui est disponible en ce moment :\n\n`;
    show.forEach((p, i) => {
      const price = p.promoPrice && p.promoPrice < p.price ? `~~${money(p.price)}~~ ${money(p.promoPrice)} (promo)` : `${money(p.price)}`;
      reply += `  ▸ ${p.name} — ${price}\n`;
    });
    if (products.length > 5) reply += `\nIl m'en reste ${products.length - 5} en stock si vous voulez tout voir.`;
    reply += `\n\nUn de ces articles vous fait de l'oeil ?`;

  } else {
    reply = `Voila ${name} ce que j'ai sous la main :\n\n`;
    show.forEach((p, i) => {
      const stock = p.qty <= 3 ? ` ⚡(plus que ${p.qty})` : '';
      if (p.promoPrice && p.promoPrice < p.price) {
        reply += `• ${p.name} : ${money(p.promoPrice)} au lieu de ${money(p.price)}${stock}\n`;
      } else {
        reply += `• ${p.name} : ${money(p.price)}${stock}\n`;
      }
    });
    if (products.length > 5) reply += `\nEt j'ai egalement ${products.length - 5} autres articles.`;
    reply += `\n\nVous voulez des infos sur l'un d'entre eux ?`;
  }

  return reply;
}

function clientRecommend(state, client, ctx) {
  const name = firstName(client.name);
  const products = (state.products||[]).filter(p => p.qty > 0);

  if (products.length === 0) {
    return pick([
      `Ah ${name}, je n'ai rien en stock pour l'instant. Mais je vous previens des qu'on est reapprovisionne ! 😊`,
      `Malheureusement je suis en rupture la ${name}. Revenez dans la semaine, j'aurai du nouveau !`
    ]);
  }

  const affordable = products.filter(p => p.price <= 3000).sort((a,b) => a.price - b.price);
  const promos = products.filter(p => p.promoPrice && p.promoPrice < p.price);
  const hasPoints = (client.points||0) > 0;

  // Variations naturelles
  const variant = Math.floor(Math.random() * 5);
  let reply;

  if (variant === 0 && promos.length > 0) {
    reply = `Alors ${name}, la bonne nouvelle c'est qu'on a des promos en ce moment ! 😊\n\n`;
    promos.slice(0, 3).forEach(p => {
      const reduction = Math.round((1 - p.promoPrice/p.price)*100);
      reply += `• ${p.name} : ${money(p.promoPrice)} au lieu de ${money(p.price)} (${reduction}% de reduction)\n`;
    });
    if (affordable.length > 0) reply += `\nSinon j'ai aussi des petits accessoires a partir de ${money(affordable[0].price)} si vous voulez quelque chose de leger.`;
    if (hasPoints) reply += `\n\nEt avec vos ${client.points} points de fidelite, vous pouvez avoir une reduction en plus !`;
    reply += `\n\nCa vous tente quelque chose en particulier ?`;

  } else if (variant === 1 && affordable.length > 0) {
    reply = `${name}, laissez-moi vous montrer ce qui est abordable et sympa en ce moment :\n\n`;
    affordable.slice(0, 4).forEach(p => {
      reply += `• ${p.name} — seulement ${money(p.price)}\n`;
    });
    if (promos.length > 0) {
      reply += `\nY'a aussi des promos qui pourraient vous interesser, vous voulez voir ?`;
    } else {
      reply += `\nDes petites choses qui font plaisir sans se ruiner ! Vous voulez plus d'infos sur un article ?`;
    }

  } else if (variant === 2) {
    reply = `${name}, voila ce que j'ai qui pourrait vous plaire :\n\n`;
    const picks = products.sort(() => Math.random() - 0.5).slice(0, 5);
    picks.forEach(p => {
      if (p.promoPrice && p.promoPrice < p.price) {
        reply += `• ${p.name} — ${money(p.promoPrice)} (promo, une affaire !)\n`;
      } else {
        reply += `• ${p.name} — ${money(p.price)}\n`;
      }
    });
    if (hasPoints) reply += `\nPsst : vous avez ${client.points} points de fidelite qui dorment, vous pouvez les utiliser pour payer moins cher !`;
    reply += `\n\nVous voulez qu'on regarde un de ces articles ensemble ?`;

  } else if (variant === 3) {
    reply = `${name}, voici mes coups de coeur du moment :\n\n`;
    const picks = products.sort(() => Math.random() - 0.5).slice(0, 4);
    picks.forEach(p => {
      if (p.promoPrice && p.promoPrice < p.price) {
        reply += `  ▸ ${p.name} — ${money(p.promoPrice)} (au lieu de ${money(p.price)}, une belle affaire !)\n`;
      } else {
        reply += `  ▸ ${p.name} — ${money(p.price)}\n`;
      }
    });
    if (promos.length > 0 && !picks.some(pp => pp.promoPrice && pp.promoPrice < pp.price)) {
      const onePromo = promos[0];
      reply += `\nJ'ai aussi ${onePromo.name} en promo si ca peut vous interesser.`;
    }
    reply += `\n\nVous voulez que je vous en dise plus sur un article ?`;

  } else {
    reply = `${name}, si je devais vous recommander quelque chose :\n\n`;
    const picks = products.sort(() => Math.random() - 0.5).slice(0, 4);
    picks.forEach(p => {
      const tag = p.promoPrice && p.promoPrice < p.price ? ` (en promo, une occasion !)` : p.qty <= 3 ? ` (stock limite)` : '';
      reply += `  ✓ ${p.name} : ${money(p.price)}${tag}\n`;
    });
    if (hasPoints) reply += `\nAvec vos ${client.points} points de fidelite, vous pouvez economiser pas mal !`;
    reply += `\n\nCa vous parle ?`;
  }

  return reply;
}

function clientLoyalty(state, client, ctx) {
  const name = firstName(client.name);
  const pts = client.points || 0;
  const tier = loyaltyTier(pts);
  const nextTiers = { Bronze: 500, Argent: 2000, Or: 5000, Platine: 0 };
  const nextPts = nextTiers[tier.label];
  const gap = nextPts > 0 ? nextPts - pts : 0;

  let reply = `🎯 *Votre programme de fidelite ${name}*\n\n`;
  reply += `Niveau : ${tier.label} ${tier.icon}\n`;
  reply += `Points : *${pts} pts*\n`;
  reply += `Status : ${tier.desc}\n`;

  if (gap > 0 && nextPts > 0) {
    reply += `\n🚀 Plus que ${gap} points pour atteindre le niveau ${Object.keys(nextTiers)[Object.values(nextTiers).indexOf(nextPts)+1]} !`;
    reply += `\nChaque 1000 FCFA d'achat vous rapporte 1 point.`;
  } else if (tier.label === "Platine") {
    reply += `\n👑 Vous etes notre client le plus fidele ! Vous beneficiez de tous nos avantages VIP.`;
  }

  if (pts >= 100) {
    const rachat = Math.floor(pts/10) * 10;
    const value = rachat * 10;
    reply += `\n\n💎 *Vous pouvez utiliser vos points !* ${rachat} pts = ${money(value)} de reduction sur vos achats.`;
  }

  reply += `\n\nDes questions sur votre fidelite ?`;
  return reply;
}

function clientObjection(state, client, message, ctx) {
  const name = firstName(client.name);
  const msg = message.toLowerCase();

  // Handle price objection
  if (/cher|trop|prix|cout|depense/.test(msg)) {
    const affordable = (state.products||[]).filter(p => p.qty > 0 && p.price <= 3000);
    if (affordable.length > 0) {
      return pick([
        `Je comprends ${name}, le budget est important ! 😊\n\nNous avons justement des articles tres accessibles a partir de ${money(affordable[0].price)}. Par exemple :\n${affordable.slice(0,4).map(p => `• ${p.name} — ${money(p.price)}`).join("\n")}\n\nCertains de nos produits vous permettent aussi de cumuler des points de fidelite pour vos prochains achats. Voulez-vous que je vous les presente ?`,
        `Tout a fait ${name}, je comprends. On a des options vraiment abordables !\n\nA partir de ${money(affordable[0].price)} vous avez :\n${affordable.slice(0,3).map(p => `  • ${p.name} (${money(p.price)})`).join("\n")}\n\nEt avec le programme de fidelite, chaque achat compte. Ca vous interesse ?`
      ]);
    }
    return pick([
      `Je comprends tout a fait ${name}. N'hesitez pas a passer en boutique, nous avons des offres et des conseils personnalises qui pourraient vous convenir. Et avec notre programme de fidelite, chaque achat vous rapporte des points ! 😊`,
      `Je vois ${name}. Le rapport qualite-prix est important pour nous aussi. Passez nous voir en boutique, on trouvera quelque chose qui correspond a votre budget. Et avec nos points fidelite, vous economisez sur le long terme !`
    ]);
  }

  // Handle "later / thinking"
  if (/plus tard|reflechir|apres|voir|peut-etre/.test(msg)) {
    return pick([
      `Pas de souci ${name}, prenez tout votre temps ! 😊\n\nSachez juste que certains de nos articles les plus populaires partent vite. Si vous voulez, je peux vous reserver un article et vous prevenir des qu'il est disponible. Qu'en pensez-vous ?`,
      `Bien sur ${name}, reflechissez tranquillement ! 😊\n\nSi un article vous interesse, dites-le moi et je peux le mettre de cote pour vous le temps que vous decidiez.`,
      `Prenez le temps qu'il faut ${name} ! 😊 N'hesitez pas a revenir vers moi quand vous serez decide. Je suis la 24h/24.`
    ]);
  }

  // Handle "don't need"
  if (/pas besoin|pas interesse|non merci/.test(msg)) {
    return pick([
      `D'accord ${name}, je comprends tout a fait. 😊\n\nSi jamais vous changez d'avis ou si vous avez besoin de quoi que ce soit, je suis toujours la. Passez une excellente journee !`,
      `Pas de probleme ${name} ! 😊 Merci d'avoir pris le temps d'echanger. Si le besoin se presente un jour, n'hesitez pas a revenir vers moi. Bonne journee !`
    ]);
  }

  // Generic objection handling
  return pick([
    `Je comprends ${name}. Y a-t-il quelque chose en particulier qui vous gene ? Je suis la pour vous aider a trouver ce qui vous convient le mieux. 😊`,
    `D'accord ${name}. Dites-moi ce qui ne va pas, je suis la pour vous aider a trouver votre bonheur 😊`,
    `Je vois ${name}. Qu'est-ce qui vous ferait plaisir alors ? On a beaucoup de choix, je suis sur qu'on trouvera votre bonheur !`
  ]);
}

function clientOrder(state, client, ctx) {
  const name = firstName(client.name);
  const orders = (state.orders||[]).filter(o =>
    o.clientName === client.name ||
    o.clientId === client.id ||
    digits(o.phone || "") === digits(client.phone || "")
  );

  if (orders.length === 0) {
    return pick([
      `Vous n'avez pas de commande en cours ${name}. Voulez-vous en passer une ? Je vous montre notre catalogue ! 😊`,
      `${name}, vous n'avez aucune commande en ce moment. C'est le moment de craquer pour quelque chose ! Voulez-vous voir nos articles ?`,
      `Aucune commande en cours ${name} 😊 On a de belles nouveautes, voulez-vous jeter un oeil ?`
    ]);
  }

  const active = orders.filter(o => !["completed","cancelled"].includes(o.status));
  const completed = orders.filter(o => o.status === "completed");

  const orderVariant = Math.floor(Math.random() * 2);
  let reply;

  if (orderVariant === 0) {
    reply = `📋 *Vos commandes ${name}*\n\n`;
  } else {
    reply = `📦 *Suivi commandes ${name}*\n\n`;
  }

  if (active.length > 0) {
    reply += `🔄 *En cours (${active.length})*\n`;
    active.forEach(o => {
      const statusEmoji = { pending:"⏳", confirmed:"✅", completed:"📦", cancelled:"❌" };
      reply += `${statusEmoji[o.status]||"📄"} ${o.items} — ${money(o.total)} (${o.status})\n`;
      if (o.deposit > 0) reply += `   Acompte verse: ${money(o.deposit)}\n`;
      reply += `\n`;
    });
  }

  if (completed.length > 0) {
    reply += `✅ *Commandes livrees (${completed.length})*\n`;
    completed.slice(0, 3).forEach(o => {
      reply += `   📦 ${o.items} — ${money(o.total)} — ${new Date(o.at).toLocaleDateString("fr-FR")}\n`;
    });
  }

  if (active.length === 0) {
    reply += pick([
      `Aucune commande en cours. Envie de decouvrir nos nouveautes ?`,
      `Rien en cours pour le moment. Voulez-vous decouvrir ce qu'on a de nouveau ?`,
      `Pas de commande en attente. C'est le moment de craquer ! Voulez-vous voir notre catalogue ?`
    ]);
  } else {
    reply += pick([
      `\nDes questions sur vos commandes ? Je suis la pour vous aider.`,
      `\nBesoin de plus d'infos sur une commande ? N'hesitez pas.`,
      `\nVous voulez modifier ou suivre une commande ? Dites-moi !`
    ]);
  }

  return reply;
}

function clientComplaint(state, client, message, ctx) {
  const name = firstName(client.name);
  const managerPhone = state.settings?.users?.find(u => u.role === "manager")?.phone || "numero de la boutique";
  return pick([
    `Je suis vraiment desole d'apprendre cela ${name} ! 😔 Ce n'est pas du tout l'experience que nous voulons vous offrir.\n\nJe vous invite a contacter directement la gerante au ${managerPhone} pour qu'on resolve cela ensemble rapidement. Vous pouvez aussi passer en boutique avec l'article concerne.`,
    `Oh ${name}, je suis navre(e) d'entendre ça ! 😕 Votre satisfaction est notre priorite.\n\nPour resoudre ce probleme au plus vite, contactez notre gerante qui s'occupera personnellement de vous. Presentez-vous en boutique avec l'article concerne ou appelez-nous.`,
    `Je suis desole ${name} ! 😔 Ce n'est pas normal et nous allons arranger ça.\n\nContactez la gerante au ${managerPhone} ou passez en boutique avec l'article. Elle s'occupera de vous personnellement.`,
    `Toutes mes excuses ${name} ! 😕 Nous prenons cela tres au serieux.\n\nLa gerante vous attend au ${managerPhone} ou en boutique pour trouver une solution ensemble.`
  ]);
}

function clientHours(state, ctx) {
  const hoursVariant = Math.floor(Math.random() * 3);
  let reply;
  if (hoursVariant === 0) {
    reply = `Nos horaires d'ouverture :\n\n📅 *Lundi - Vendredi :* 9h - 18h30\n📅 *Samedi :* 9h - 17h\n📅 *Dimanche :* Ferme\n\n📍 Nous avons deux boutiques :\n• Meshes et Accessoires\n• Packaging et Accessoires Cosmetiques\n\nDes questions sur nos produits en attendant votre visite ? 😊`;
  } else if (hoursVariant === 1) {
    reply = `Voici quand vous pouvez nous trouver :\n\n🕐 *Lun-Ven :* 9h - 18h30\n🕐 *Sam :* 9h - 17h\n🕐 *Dim :* Ferme\n\n📍 *Adresses :*\n• Meshes et Accessoires\n• Packaging et Accessoires Cosmetiques\n\nEnvie de jeter un oeil a notre catalogue avant de venir ?`;
  } else {
    reply = `Nos horaires 😊\n\n*Lundi a Vendredi* : 9h - 18h30\n*Samedi* : 9h - 17h\n*Dimanche* : Ferme\n\n*Deux boutiques:* Meshes et Accessoires & Packaging Cosmetiques\n\nOn vous attend ! Voulez-vous voir nos produits en attendant ?`;
  }
  return reply;
}

// ─── EMPLOYEE AGENT ──────────────────────────────────────────────────────────
// Respect strict des roles : cashier < manager < owner < super

const ROLE_HIERARCHY = { cashier: 1, manager: 2, owner: 3, super: 4 };

function employeeReply(state, identity, message, ctx) {
  const user = identity.user;
  const name = firstName(user.name);
  const role = identity.role;
  const roleLevel = ROLE_HIERARCHY[role] || 0;
  const scope = identity.shop === "all" ? "toutes les boutiques" : identity.shop;

  const m = metrics(state, identity);

  // First check role-based access and function
  const intent = detectIntent(EMPLOYEE_INTENTS, message);

  const levelGates = {
    rapport: 1, stock: 1, caisse: 1, ventes: 1,
    clients: 2, produits: 1, fournisseurs: 2,
    employes: 3, taches: 2, parametres: 3,
    audit: 2, depenses: 2, help: 1
  };

  const requiredLevel = levelGates[intent] || 1;
  if (roleLevel < requiredLevel) {
    return `Desole ${name}, cette information necessite un niveau d'acces plus eleve. Contactez la direction si vous avez besoin de ces donnees.`;
  }

  const handlers = {
    rapport: () => employeeRapport(state, identity, m),
    stock: () => employeeStock(state, identity, m),
    caisse: () => employeeCaisse(state, identity, m),
    ventes: () => employeeVentes(state, identity, m),
    clients: () => employeeClients(state, identity),
    produits: () => employeeProduits(state, identity, m),
    fournisseurs: () => employeeFournisseurs(state, identity),
    employes: () => employeeEmployes(state, identity),
    taches: () => employeeTaches(state, identity),
    parametres: () => employeeParametres(state, identity),
    audit: () => employeeAudit(state, identity),
    depenses: () => employeeDepenses(state, identity),
    help: () => employeeHelp(state, identity),
    unknown: () => employeeHelp(state, identity)
  };

  let reply = (handlers[intent] || handlers.unknown)();
  // Append daily summary for managers+ if they're asking broadly
  if (intent === "unknown" && roleLevel >= 2) {
    reply += `\n\n💡 *Astuce :* Vous pouvez aussi me demander le rapport du jour, les stocks critiques, les ventes ou les dettes clients.`;
  }
  updateContext(phoneFromUser(user), { topic: intent });
  return truncate(reply, 4000);
}

function phoneFromUser(user) { return digits(user.phone) || "unknown"; }

function employeeRapport(state, identity, m) {
  const scope = identity.shop === "all" ? "toutes les boutiques" : identity.shop;
  const salesCount = m.sales.length;
  const debtTotal = (state.clients||[]).reduce((s,c) => s+Number(c.balance||0), 0);
  const debtCount = (state.clients||[]).filter(c => c.balance > 0).length;

  let reply = `📊 *Rapport ${scope}*\n\n`;
  reply += `📈 Chiffre d'affaires: ${money(m.salesTotal)}\n`;
  reply += `💰 Marge brute: ${money(m.margin)}\n`;
  reply += `📦 Stock valorise: ${money(m.stockValue)}\n`;
  reply += `📋 Nombre de ventes: ${salesCount}\n`;
  reply += `⚠️ Alertes stock: ${m.low.length} produits\n`;
  reply += `💳 Credits clients: ${money(debtTotal)} (${debtCount} debiteurs)\n`;
  reply += `📅 Depenses: ${money((state.expenses||[]).reduce((s,e) => s+e.amount, 0))}\n`;

  if (m.low.length > 0) {
    reply += `\n🔴 *Produits critiques :*\n`;
    m.low.slice(0,5).forEach(p => {
      reply += `• ${p.name}: ${p.qty} unites restantes\n`;
    });
  }
  return reply;
}

function employeeStock(state, identity, m) {
  const scope = identity.shop === "all" ? "toutes les boutiques" : identity.shop;
  const name = firstName(identity.user.name);

  if (m.low.length === 0) {
    return `${name}, aucun stock critique a signaler sur ${scope}. Tous les niveaux sont corrects. 👍`;
  }

  let reply = `⚠️ *Alertes stock ${scope}*\n\n`;
  m.low.forEach((p, i) => {
    const danger = p.qty <= 2 ? "🔴 CRITIQUE" : "🟡 Attention";
    reply += `${i+1}. ${p.name} — *${p.qty}* unites — ${danger}\n`;
    reply += `   ${p.shop} | SKU: ${p.sku}\n\n`;
  });

  // Suggestions for reorder
  const urgent = m.low.filter(p => p.qty <= 2);
  if (urgent.length > 0) {
    reply += `⚡ *Recommandation :* ${urgent.length} produit(s) necessitent un reapprovisionnement urgent. Contactez vos fournisseurs rapidement.`;
  }
  return reply;
}

function employeeCaisse(state, identity, m) {
  const name = firstName(identity.user.name);
  const today = state.sales?.filter(s => new Date(s.at).toDateString() === new Date().toDateString()) || [];
  const todayTotal = today.reduce((s,v) => s+v.total, 0);
  const closures = state.closures || [];
  const lastClosure = closures[0];
  const shifts = (state.shifts||[]).filter(s => s.status === "open");

  let reply = `💵 *Operations caisse*\n\n`;
  reply += `📅 Aujourd'hui: ${money(todayTotal)} (${today.length} ventes)\n`;
  reply += `🔄 Sessions ouvertes: ${shifts.length}\n\n`;

  if (lastClosure) {
    const ecart = (lastClosure.cashCounted||lastClosure.cash||0) - (lastClosure.expectedCash||0);
    reply += `*Derniere cloture :*\n`;
    reply += `   Date: ${new Date(lastClosure.at).toLocaleString("fr-FR")}\n`;
    reply += `   Attendu: ${money(lastClosure.expectedCash||0)}\n`;
    reply += `   Compte: ${money(lastClosure.cashCounted||lastClosure.cash||0)}\n`;
    reply += `   Ecart: ${ecart >= 0 ? "+" : ""}${money(ecart)}\n`;
    reply += `   Note: ${lastClosure.note || "Aucune"}\n`;
  } else {
    reply += `Aucune cloture enregistree.\n`;
  }

  if (closures.length > 0) {
    reply += `\n📋 *Totaux generaux :*\n`;
    const ca = state.sales?.reduce((s,v) => s+v.total, 0) || 0;
    reply += `   CA total: ${money(ca)}\n`;
  }
  return reply;
}

function employeeVentes(state, identity, m) {
  const scope = identity.shop === "all" ? "toutes les boutiques" : identity.shop;
  const name = firstName(identity.user.name);
  const sales = m.sales.slice(0, 8);

  if (sales.length === 0) {
    return `Aucune vente enregistree sur ${scope} pour le moment.`;
  }

  let reply = `💳 *Dernieres ventes ${scope}*\n\n`;
  sales.forEach(s => {
    const date = new Date(s.at).toLocaleString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
    reply += `• ${date} — ${s.clientName || "Comptoir"}\n`;
    reply += `  ${money(s.total)} via ${s.method}\n`;
  });

  // Daily summary
  const today = m.sales.filter(s => new Date(s.at).toDateString() === new Date().toDateString());
  const todayTotal = today.reduce((s,v) => s+v.total, 0);
  reply += `\n📊 *Resume du jour :* ${today.length} ventes = ${money(todayTotal)}`;

  const cash = today.filter(s => s.method === "Cash").reduce((s,v) => s+v.total, 0);
  const momo = today.filter(s => s.method.includes("MoMo")).reduce((s,v) => s+v.total, 0);
  const om = today.filter(s => s.method.includes("Orange")).reduce((s,v) => s+v.total, 0);
  reply += `\n💵 Cash: ${money(cash)} | 📱 MoMo: ${money(momo)} | 🟠 OM: ${money(om)}`;

  return reply;
}

function employeeClients(state, identity) {
  const name = firstName(identity.user.name);
  const clients = state.clients || [];
  const debtors = clients.filter(c => c.balance > 0).sort((a,b) => b.balance - a.balance);
  const totalDebt = debtors.reduce((s,c) => s+Number(c.balance||0), 0);
  const topClients = [...clients].sort((a,b) => (b.points||0) - (a.points||0)).slice(0, 5);

  let reply = `👥 *Clients et dettes*\n\n`;

  if (debtors.length > 0) {
    reply += `💳 *Debiteurs (${debtors.length}) — Total: ${money(totalDebt)}*\n\n`;
    debtors.slice(0, 8).forEach(c => {
      const tier = loyaltyTier(c.points||0);
      reply += `• ${c.name}\n`;
      reply += `  💰 ${money(c.balance)} | ${c.phone || "Pas de tel"}\n`;
      if (c.points) reply += `  ${tier.icon} ${c.points} pts\n`;
    });
    reply += `\n`;
  } else {
    reply += `✅ Aucun client debiteur. Tout est en ordre !\n\n`;
  }

  reply += `🏆 *Top clients fidelite :*\n`;
  topClients.forEach((c, i) => {
    reply += `${i+1}. ${c.name} — ${c.points||0} pts\n`;
  });

  if (debtors.length > 0 && identity.role !== "cashier") {
    reply += `\n📌 *Relance recommandee :* ${debtors[0].name} (${money(debtors[0].balance)})`;
  }
  return reply;
}

function employeeProduits(state, identity, m) {
  const scope = identity.shop === "all" ? "toutes les boutiques" : identity.shop;
  const name = firstName(identity.user.name);
  const products = m.products.filter(p => p.qty > 0).slice(0, 10);

  if (products.length === 0) {
    return `${name}, il n'y a pas de produits en stock sur ${scope} actuellement.`;
  }

  let reply = `📦 *Catalogue produits ${scope}*\n\n`;
  products.forEach(p => {
    const promo = p.promoPrice && p.promoPrice < p.price ? ` 🔥 Promo: ${money(p.promoPrice)}` : "";
    reply += `• ${p.name}\n`;
    reply += `  ${money(p.price)} | Stock: ${p.qty} | ${p.shop}${promo}\n`;
  });

  if (m.products.length > 10) {
    reply += `\n... et ${m.products.length - 10} autres articles.`;
  }
  return reply;
}

function employeeFournisseurs(state, identity) {
  const name = firstName(identity.user.name);
  const suppliers = state.suppliers || [];
  const orders = state.purchaseOrders || [];

  let reply = `🚚 *Fournisseurs et commandes*\n\n`;

  reply += `*Fournisseurs (${suppliers.length})*\n`;
  suppliers.forEach(s => {
    reply += `• ${s.name}\n`;
    reply += `  ${s.contact || "Pas de contact"} | ${s.city || "Ville inconnue"}\n`;
    reply += `  Produits: ${s.products || "Non precise"}\n\n`;
  });

  const pendingOrders = orders.filter(o => o.status2 !== "received" && o.status2 !== "cancelled");
  if (pendingOrders.length > 0) {
    reply += `*Commandes en cours (${pendingOrders.length})*\n`;
    pendingOrders.slice(0, 5).forEach(o => {
      reply += `• ${o.supplier}: ${o.items} — ${money(o.total)} (${o.status2})\n`;
    });
  } else {
    reply += `✅ Aucune commande en cours.`;
  }
  return reply;
}

function employeeEmployes(state, identity) {
  const users = state.settings?.users || [];
  const name = firstName(identity.user.name);

  let reply = `👤 *Equipe (${users.length} membres)*\n\n`;
  users.forEach(u => {
    const isYou = u.id === identity.user.id ? " ← Vous" : "";
    reply += `• ${u.name} — ${ROLE_LABELS[u.role] || u.role}${isYou}\n`;
    reply += `  Boutique: ${u.shop} | Tel: ${u.phone || "Non defini"}\n`;
  });
  return reply;
}

function employeeTaches(state, identity) {
  const name = firstName(identity.user.name);
  // Utilise les commandes en attente comme taches
  const pendingOrders = (state.orders||[]).filter(o =>
    o.status !== "completed" && o.status !== "cancelled" &&
    (identity.shop === "all" || o.shop === identity.shop || true)
  );
  const pendingPO = (state.purchaseOrders||[]).filter(o =>
    o.status2 !== "received" && o.status2 !== "cancelled"
  );

  if (pendingOrders.length === 0 && pendingPO.length === 0) {
    return `${name}, aucune tache en cours. Tout est sous controle ! 👍`;
  }

  let reply = `📋 *Taches en cours*\n\n`;
  if (pendingOrders.length > 0) {
    reply += `📦 *Commandes clients (${pendingOrders.length})*\n`;
    pendingOrders.slice(0, 5).forEach(o => {
      const urg = o.notes?.toLowerCase().includes("urgent") ? "🔴" : "🟡";
      reply += `${urg} ${o.clientName} — ${o.items} (${o.status})\n`;
    });
    reply += `\n`;
  }
  if (pendingPO.length > 0) {
    reply += `🚚 *Commandes fournisseurs (${pendingPO.length})*\n`;
    pendingPO.slice(0, 5).forEach(po => {
      reply += `• ${po.supplier}: ${po.items} — ${money(po.total)} (${po.status2})\n`;
    });
  }
  return reply;
}

function employeeParametres(state, identity) {
  return `⚙️ *Parametres boutique*\n\n📛 Nom: ${state.settings?.boutique || "Origin Retail OS"}\n💱 Devise: ${state.settings?.currency || "XAF"}\n🏪 Boutiques: ${SHOPS.join(", ")}\n🔢 Seuil stock bas: ${state.settings?.lowStock || 5}\n👥 Utilisateurs: ${(state.settings?.users||[]).length}\n📦 Produits: ${(state.products||[]).length}\n👤 Clients: ${(state.clients||[]).length}\n\n*Acces autorise:* Super User et Proprietaire uniquement.`;
}

function employeeAudit(state, identity) {
  const name = firstName(identity.user.name);
  const audit = state.audit || [];
  const recent = audit.slice(0, 10);

  let reply = `📜 *Journal d'audit (10 dernieres actions)*\n\n`;
  recent.forEach(a => {
    const date = new Date(a.at).toLocaleString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
    reply += `• ${date}\n`;
    reply += `  ${a.user}: ${a.action} — ${a.detail}\n\n`;
  });
  return reply;
}

function employeeDepenses(state, identity) {
  const name = firstName(identity.user.name);
  const expenses = state.expenses || [];
  const total = expenses.reduce((s,e) => s+e.amount, 0);
  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category]||0) + e.amount; });

  let reply = `💸 *Depenses*\n\n`;
  reply += `Total: ${money(total)}\n`;
  reply += `Nombre d'ecritures: ${expenses.length}\n\n`;

  if (Object.keys(byCat).length > 0) {
    reply += `*Par categorie:*\n`;
    Object.entries(byCat).sort((a,b) => b[1]-a[1]).forEach(([cat,amt]) => {
      reply += `• ${cat}: ${money(amt)}\n`;
    });
  } else {
    reply += `Aucune depense enregistree.`;
  }
  return reply;
}

function employeeHelp(state, identity) {
  const name = firstName(identity.user.name);
  const roleLevel = ROLE_HIERARCHY[identity.role] || 0;

  let reply = `🤖 *Assistant Origin — Aide*\n\nBonjour ${name}, voici ce que je peux faire pour vous :\n\n`;

  reply += `📊 *Indicateurs* — \"rapport\", \"stock\", \"ventes\"\n`;
  reply += `💵 *Caisse* — \"caisse\", \"cloture\"\n`;

  if (roleLevel >= 2) {
    reply += `👥 *Clients* — \"clients\", \"dettes\", \"recouvrement\"\n`;
    reply += `🚚 *Fournisseurs* — \"fournisseurs\", \"commandes\"\n`;
    reply += `📋 *Taches* — \"taches\", \"a faire\"\n`;
    reply += `💰 *Depenses* — \"depenses\", \"cout\"\n`;
  }
  if (roleLevel >= 3) {
    reply += `👤 *Equipe* — \"employes\", \"equipe\"\n`;
    reply += `⚙️ *Configuration* — \"parametres\"\n`;
  }
  if (roleLevel >= 4) {
    reply += `📜 *Audit* — \"audit\", \"historique\"\n`;
  }

  reply += `\nExemple : \"Donne-moi le rapport du jour\" ou \"Quels sont les stocks critiques ?\"`;
  return reply;
}

// ─── PROACTIVE ENGINE ────────────────────────────────────────────────────────
// Messages envoyes spontanement (relances, alertes)

function shouldSendProactive(state, phone, ctx) {
  // Only send if at least 24h since last interaction
  if (!ctx.lastInteraction) return true;
  return (Date.now() - ctx.lastInteraction) > 86400000; // 24h
}

function generateProactiveMessage(state, identity, ctx) {
  if (identity.type === "unknown") return null;
  if (!state) return null;

  if (identity.type === "client") {
    const client = identity.client;
    const hasDebt = client.balance > 0;
    const hasPoints = (client.points||0) > 0;
    const lastSale = (state.sales||[]).filter(s => s.clientName === client.name)[0];

    // Debt reminder
    if (hasDebt && client.balance > 10000 && shouldSendProactive(state, phoneFromClient(client), ctx)) {
      const name = firstName(client.name);
      return pick([
        `${name}, petit rappel amical : il vous reste ${money(client.balance)} a regular. 😊\n\nPas d'inquietude, on peut trouver une solution ensemble si besoin. Et en passant, nous avons des nouveautes qui viennent d'arriver en boutique !`,
        `Bonjour ${name} ! 👋 Je passais juste vous dire qu'il y a un solde de ${money(client.balance)} sur votre compte. Rien d'urgent, mais si vous voulez qu'on trouve un arrangement ensemble, je suis la. Et j'ai aussi des nouveaux articles a vous montrer !`,
        `Petit message pour vous ${name} 😊 Il reste ${money(client.balance)} a regular sur votre compte. On peut echelonner si vous voulez, pas de pression. Au fait, de belles nouveautes viennent d'arriver en boutique, ca vous dit ?`
      ]);
    }

    // Points reminder
    if (hasPoints && client.points >= 200) {
      const name = firstName(client.name);
      const value = Math.floor(client.points/10) * 10 * 10;
      return pick([
        `🎁 ${name}, saviez-vous que vous avez ${client.points} points de fidelite ? Cela represente ${money(value)} de reduction !\n\nPour les utiliser, passez en boutique ou commandez via WhatsApp. A bientot ! 😊`,
        `${name} ! Vous avez ${client.points} points de fidelite qui vous attendent 😊 Cela fait ${money(value)} d'economie sur vos prochains achats. Pensez a les utiliser avant qu'ils n'expirent !`,
        `Psst ${name} ! 👀 Vous avez ${client.points} points sur votre carte de fidelite, soit ${money(value)} de reduction. Vous les avez bien merites ! Passez nous voir ou commandez en ligne pour les utiliser 😊`
      ]);
    }

    // Re-engagement after 30 days
    if (lastSale && (Date.now() - new Date(lastSale.at).getTime()) > 2592000000) {
      const name = firstName(client.name);
      return pick([
        `Ca faisait longtemps ${name} ! 😊 J'espere que tout va bien. Nous avons des nouveautes qui pourraient vous interesser. Voulez-vous que je vous les presente ?`,
        `Cela faisait un moment ${name} ! J'espere que vous allez bien. 😊 De nouveaux articles sont arrives, je pense que certains pourraient vous plaire. Vous voulez jeter un oeil ?`,
        `${name} ! Ca faisait longtemps qu'on ne s'etait pas vus. 😊 J'ai pensé a vous car nous avons recu de nouvelles collections. Si vous voulez, je vous montre ce qui a change depuis votre derniere visite !`
      ]);
    }
  }

  if (identity.type === "employee") {
    const m = metrics(state, identity);
    if (m.low.length > 2) {
      const name = firstName(identity.user?.name);
      const alertVariant = Math.floor(Math.random() * 3);
      if (alertVariant === 0) {
        return `⚠️ *Alerte stock ${identity.shop === "all" ? "generale" : identity.shop}*\n\n${m.low.length} produits sont en stock critique. Les plus urgents :\n${m.low.slice(0,3).map(p => `• ${p.name}: ${p.qty} unites`).join("\n")}\n\nPensez a reapprovisionner !`;
      } else if (alertVariant === 1) {
        return `🔴 *Urgence reapprovisionnement ${identity.shop === "all" ? "toutes boutiques" : identity.shop}*\n\n${m.low.length} references atteignent le seuil critique. Voici les plus concerne(e)s :\n${m.low.slice(0,3).map(p => `🔸 ${p.name} — plus que ${p.qty} en stock`).join("\n")}\n\nJe vous recommande de passer commande des maintenant.`;
      } else {
        return `${name ? name + ', ' : ''}petite alerte stock ! ⚠️\n\nNous avons ${m.low.length} produits qui commencent a manquer :\n${m.low.slice(0,3).map(p => `• ${p.name} (${p.qty} restants)`).join("\n")}\n\nUn coup d'oeil aux fournisseurs ?`;
      }
    }
  }

  return null;
}

// ─── AUTO-REGISTRATION ──────────────────────────────────────────────────
// Permet aux prospects de s'enregistrer directement depuis WhatsApp

function registerProspect(phone, name) {
  try {
    const fPath = _stateFile || path.join(__dirname, "data", "erp-state.json");
    if (!fs.existsSync(fPath)) return null;
    const data = JSON.parse(fs.readFileSync(fPath, "utf8"));
    const clients = data.clients || [];

    // Check if phone already registered
    const existing = clients.find(c => digits(c.phone) === digits(phone));
    if (existing) return existing; // Already registered

    // Create new client
    const newClient = {
      id: "wa_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,6),
      name: name.trim(),
      phone: phone.startsWith("+") ? phone : "+" + phone,
      balance: 0,
      points: 50, // Bonus de bienvenue
      at: new Date().toISOString(),
      source: "whatsapp"
    };

    clients.push(newClient);
    data.clients = clients;

    // Add audit log
    const audit = data.audit || [];
    audit.unshift({
      id: "a_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,6),
      at: new Date().toISOString(),
      user: "WhatsApp",
      action: "Client auto-enregistre",
      detail: name + " (via WhatsApp)"
    });
    data.audit = audit;

    fs.writeFileSync(fPath, JSON.stringify(data, null, 2), "utf8");
    return newClient;
  } catch (e) {
    console.log("❌ Erreur auto-enregistrement:", e.message);
    return null;
  }
}

// ─── ORDER CREATION ──────────────────────────────────────────────────────
// Cree une commande client et la sauvegarde dans l'ERP

function createOrder(state, client, productName, qty, notes) {
  try {
    const fPath = _stateFile || path.join(__dirname, "data", "erp-state.json");
    if (!fs.existsSync(fPath)) return null;
    const data = JSON.parse(fs.readFileSync(fPath, "utf8"));
    const orders = data.orders || [];

    const product = (data.products||[]).find(p =>
      p.name.toLowerCase() === productName.toLowerCase() ||
      p.name.toLowerCase().includes(productName.toLowerCase())
    );
    if (!product) return null;

    const total = product.price * qty;
    const newOrder = {
      id: "ord_wa_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,6),
      at: new Date().toISOString(),
      clientId: client.id,
      clientName: client.name,
      phone: client.phone,
      items: `${qty}x ${product.name}`,
      total: total,
      deposit: 0,
      status: "pending",
      notes: notes || "Commande WhatsApp"
    };

    orders.unshift(newOrder);
    data.orders = orders;

    // Audit
    const audit = data.audit || [];
    audit.unshift({
      id: "a_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,6),
      at: new Date().toISOString(),
      user: "WhatsApp",
      action: "Commande WhatsApp",
      detail: client.name + ": " + newOrder.items + " (" + money(total) + ")"
    });
    data.audit = audit;

    fs.writeFileSync(fPath, JSON.stringify(data, null, 2), "utf8");
    return newOrder;
  } catch (e) {
    console.log("❌ Erreur creation commande:", e.message);
    return null;
  }
}

// Flow de commande multi-etapes
function clientNewOrder(state, client, message, ctx) {
  const name = firstName(client.name);
  const products = (state.products||[]).filter(p => p.qty > 0);
  const msg = message.toLowerCase().trim();

  // ─── Etape 1: Choix du produit ───────────────────────────────────────
  if (!ctx.temp.orderStep || ctx.temp.orderStep === "product") {
    ctx.temp.orderStep = "product";

    // Si le message contient deja un nom de produit, essaie de le trouver
    let found = null;

    // 1. Recherche par numero ("le 3")
    if (/^\d{1,2}$/.test(msg.trim())) {
      const idx = parseInt(msg.trim()) - 1;
      if (idx >= 0 && idx < products.length) found = products[idx];
    }

    // 2. Recherche par nom (message contient le debut du nom)
    if (!found) {
      found = products.find(p => msg.includes(p.name.toLowerCase().slice(0, 6)));
    }

    // 3. Recherche par mots-cles
    if (!found) {
      const searchTerms = ["perruque","bonnet","colle","bande","pot","flacon","etiquette","spatule","creme","serum"];
      const matchedTerm = searchTerms.find(t => msg.includes(t));
      if (matchedTerm) {
        found = products.find(p => p.name.toLowerCase().includes(matchedTerm));
      }
    }

    if (found) {
      ctx.temp.orderProduct = found;
      ctx.temp.orderStep = "quantity";
      return pick([
      `Excellent choix ${name} ! Le ${found.name} est a ${money(found.price)} l'unite.\n\n📦 Stock disponible: ${found.qty} unites\n\nCombien d'unites voulez-vous commander ?`,
      `Bon choix ${name} ! ${found.name} a ${money(found.price)} l'unite. Il nous en reste ${found.qty} en stock. Combien vous en faut-il ?`,
      `${found.name} — ${money(found.price)} l'unite et ${found.qty} en stock. Dites-moi la quantite que vous voulez ${name} !`
    ]);
    }

    // Show catalog and ask
    const catalogVariant = Math.floor(Math.random() * 3);
    let reply;
    if (catalogVariant === 0) {
      reply = `Avec plaisir ${name} ! 😊 Voici notre catalogue. Dites-moi le numero ou le nom du produit qui vous interesse :\n\n`;
      products.slice(0,8).forEach((p, i) => {
        reply += `${i+1}. ${p.name} — ${money(p.price)} (Stock: ${p.qty})\n`;
      });
      if (products.length > 8) reply += `\n... et ${products.length-8} autres articles.`;
      reply += `\n\n💬 *Exemple :* dites \"le numero 3\" ou \"je veux la perruque\"`;
    } else if (catalogVariant === 1) {
      reply = `Bien sur ${name} ! 😊 Voici ce que j'ai en catalogue :\n\n`;
      products.slice(0,8).forEach((p, i) => {
        const promo = p.promoPrice && p.promoPrice < p.price ? ` (${money(p.promoPrice)} en promo)` : '';
        reply += `• ${i+1}. ${p.name} : ${money(p.price)}${promo} — Stock: ${p.qty}\n`;
      });
      if (products.length > 8) reply += `\nIl y a encore ${products.length-8} autres articles.`;
      reply += `\n\nDites \"le 1\", \"le 2\" ou le nom de l'article qui vous interesse 😊`;
    } else {
      reply = `Pas de souci ${name} ! Je vous presente notre selection :\n\n`;
      products.slice(0,6).forEach((p, i) => {
        reply += `${i+1}. ${p.name} — ${money(p.price)}\n`;
      });
      if (products.length > 6) reply += `\nJ'en ai ${products.length-6} de plus si vous voulez.`;
      reply += `\n\nDites-moi celui qui vous interesse !`;
    }
    return reply;
  }

  // ─── Etape 2: Quantite ───────────────────────────────────────────────
  if (ctx.temp.orderStep === "quantity") {
    const product = ctx.temp.orderProduct;
    // Parse quantity from message, default to 1
    const qtyMatch = msg.match(/(\d+)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;

    if (qty < 1) {
      return `La quantite doit etre d'au moins 1 ${name}. Combien d'unites voulez-vous ?`;
    }
    if (qty > (product.qty || 999)) {
      ctx.temp.orderStep = "product"; // Reset to product selection
      return `Desole ${name}, nous n'avons que ${product.qty} unites de ${product.name} en stock. Choisissez un autre produit ou une quantite plus petite :\n\n${products.slice(0,6).map((p,i) => `${i+1}. ${p.name} — ${money(p.price)} (Stock: ${p.qty})`).join("\n")}`;
    }

    ctx.temp.orderQty = qty;
    const total = product.price * qty;
    ctx.temp.orderStep = "confirm";

    return pick([
      `Recapitulatif de votre commande ${name} :\n\n📦 *Produit :* ${product.name}\n🔢 *Quantite :* ${qty}\n💰 *Total :* ${money(total)}\n📍 *Retrait :* ${product.shop}\n\nPour confirmer, repondez \"oui\" ou \"confirme\". Pour annuler, dites \"non\" ou \"annule\". 😊`,
      `${name}, voila le recapitulatif :\n\n• ${product.name} x${qty}\n• Total : ${money(total)}\n• Retrait : ${product.shop}\n\nJe confirme ou j'annule ? 😊`,
      `Resumons ${name} :\n\n✅ ${qty}x ${product.name}\n💰 ${money(total)}\n📍 ${product.shop}\n\nCa vous va ? Dites \"oui\" pour confirmer ou \"non\" pour annuler.`
    ]);
  }

  // ─── Etape 3: Confirmation ────────────────────────────────────────────
  if (ctx.temp.orderStep === "confirm") {
    if (/oui|confirme|yes|valide|ok|d accord|commander/i.test(msg)) {
      const product = ctx.temp.orderProduct;
      const qty = ctx.temp.orderQty;
      const total = product.price * qty;

      const order = createOrder(state, client, product.name, qty, "Commande WhatsApp");
      if (order) {
        ctx.temp.orderStep = null;
        ctx.temp.orderProduct = null;
        ctx.temp.orderQty = null;
        return pick([
          `✅ *Commande confirmee ${name}!* 🎉\n\n${qty}x ${product.name}\n💰 Total: ${money(total)}\n📍 Retrait: ${product.shop}\n\nLa gerante vous contactera sur WhatsApp pour confirmer la disponibilite et organiser le retrait ou la livraison.\n\nMerci pour votre confiance ! 😊 Avez-vous besoin d'autre chose ?`,
          `🎉 *Commande prise en compte ${name}!*\n\n📦 ${qty}x ${product.name}\n💰 ${money(total)}\n📍 A retirer chez ${product.shop}\n\nLa boutique va vous contacter pour finaliser. Merci pour votre commande ! 😊 Avez-vous besoin d'autre chose ?`,
          `${name}, votre commande est confirmee ! 🎉\n\n✅ ${qty}x ${product.name}\n💰 ${money(total)}\n📍 ${product.shop}\n\nVous serez contacte(e) par la gerante pour la suite. Merci de votre confiance ! 😊 Autre chose ?`
        ]);
      }
      return `Desole ${name}, je n'ai pas pu enregistrer votre commande pour le moment. Reessayez dans quelques instants ou contactez la boutique directement 😊`;
    }
    if (/non|annule|pas maintenant|plus tard/i.test(msg)) {
      ctx.temp.orderStep = null;
      ctx.temp.orderProduct = null;
      ctx.temp.orderQty = null;
      return pick([
        `Pas de souci ${name}, commande annulee. 😊 Si vous voulez, je peux vous montrer d'autres produits ou vous conseiller. Qu'est-ce qui vous ferait plaisir ?`,
        `Commande annulee ${name}, aucun probleme. 😊 Si vous changez d'avis ou voulez voir d'autres articles, je suis la !`,
        `Tres bien ${name}, j'annule tout. 😊 N'hesitez pas a revenir quand vous voulez, je suis la pour vous !`
      ]);
    }

    // If unclear, repeat the confirmation prompt
    return `Desole ${name}, je n'ai pas compris. Voulez-vous confirmer cette commande ?\n\n📦 ${ctx.temp.orderProduct.name} x${ctx.temp.orderQty} = ${money(ctx.temp.orderProduct.price * ctx.temp.orderQty)}\n\nRepondez \"oui\" pour confirmer ou \"non\" pour annuler.`;
  }

  // Fallback: reset
  ctx.temp.orderStep = null;
  return `Que voulez-vous commander ${name} ? Voici notre catalogue :\n\n${products.slice(0,6).map((p,i) => `${i+1}. ${p.name} — ${money(p.price)}`).join("\n")}`;
}

// ─── MAIN REPLY ENGINE ──────────────────────────────────────────────────────

function naturalReply(state, identity, text, phone) {
  const ctx = getContext(String(phone || ""));
  const msg = text.toLowerCase().trim();

  if (!state) {
    return "Bonjour ! L'ERP n'est pas encore synchronise. Ouvrez le dashboard sur l'ordinateur et enregistrez une action pour activer la connexion.";
  }

  // ─── UNKNOWN / PROSPECT HANDLER ──────────────────────────────────────
  // Un numero inconnu = un prospect ! On ne le repousse jamais.
  // On accueille, on conseille, on vend. L'enregistrement vient APRES l'engagement.
  if (identity.type === "unknown") {
    // Detect intent for prospects too
    const prospectIntent = detectIntent(CLIENT_INTENTS, msg);
    const products = (state.products||[]).filter(p => p.qty > 0);
    const visitCount = ctx.visitCount || 0;
    ctx.visitCount++;

    // ─── AUTO-ENREGISTREMENT / DETECTION DU PRENOM ──────────────────────
    // L'utilisateur donne explicitement son prénom → auto-enregistrement direct
    const NON_NAME_WORDS = ["intéresse","intéressé","intéressée","interesse","interessé","interessée","là","la","client","cliente","venu","venue","nouveau","nouvelle","content","contente","ravi","ravie","sûr","sure","sur","prêt","prête","pret","prete","désolé","desole","navrée","navré","navree","navre","fière","fiere","libre","prête","prete","occupé","occupée","occupe","occupée","preneuse","capable","obligé","obligée","oblige","obligee","certain","certaine","satisfait","satisfaite","prêt","prete","prête","désireux","désireuse","desireux","desireuse","censé","censée","cense","censee"];
    const jeSuisMatch = msg.match(/^je suis\s+([a-zA-ZÀ-ÿ]+)/i);
    const jeSuisValidName = jeSuisMatch && (() => {
      const nw = jeSuisMatch[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if (nw.length < 2) return false;
      return !NON_NAME_WORDS.some(w => {
        const wn = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
        return wn.length > 0 && nw.startsWith(wn);
      });
    })();
    
    // Mots qui ne sont PAS des prénoms (pour le flux awaitingName)
    const NON_NAME_WORDS_PROSPECT = new Set(["oui","non","bonjour","salut","merci","bonsoir","hello","hi","ok","daccord","super","genial","parfait","top","cool","peutetre","apres","plus","rien","quoi","voila","voici","cest","cetait","tres","bien","mal","mieux","moins","aussi","encore","desole","desolé","navre","navré","excuse","pardon","allo","help","aide","stop","arrete","attends","attendez","jai","je","tu","il","elle","nous","vous","ils","elles","veux","voudrais","et","ou","mais","donc","car","ni","or"]);
    
    // Fonction: extraire un vrai prénom (vérifie que le message est juste un prénom, pas un mot-outil)
    const tryRegisterName = (rawName) => {
      const clean = rawName.replace(/[^a-zA-ZÀ-ÿ\-\s]/g, "").trim();
      const firstWord = clean.split(/\s+/)[0];
      if (!firstWord || firstWord.length < 2) return null;
      const lower = firstWord.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      // Vérifier que ce n'est pas un mot-outil (bonjour, oui, non, merci, etc.)
      if (NON_NAME_WORDS_PROSPECT.has(lower)) return null;
      // Vérifier que ce n'est pas un verbe commun après "je suis"
      if (NON_NAME_WORDS.some(w => {
        const wn = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
        return wn.length > 0 && lower.startsWith(wn);
      })) return null;
      const niceName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
      const newClient = registerProspect(phone, niceName);
      if (newClient) {
        ctx.temp.requestedName = niceName;
        return newClient;
      }
      return null;
    };

    // 1. Auto-enregistrement explicite ("je m'appelle X", "mon nom est X", "je suis X")
    if (/je m'appelle|mon nom est|appelle-moi/i.test(msg) || (jeSuisValidName)) {
      let rawName = msg.replace(/.*je m'appelle|.*mon nom est|.*appelle-moi|^je suis\s+/i, "").trim();
      rawName = rawName.replace(/[^a-zA-ZÀ-ÿ\-\s]/g, "").trim();
      const firstNameWord = rawName.split(/\s+/)[0];
      if (firstNameWord && firstNameWord.length > 1) {
        const niceName = firstNameWord.charAt(0).toUpperCase() + firstNameWord.slice(1).toLowerCase();
        const newClient = registerProspect(phone, niceName);
        if (newClient) {
          ctx.temp.requestedName = niceName;
          ctx.temp.freshRegistration = true;

          // Vérifier si on était en train d'attendre un prénom pour commander
          if (ctx.temp.pendingOrderMsg) {
            const originalMsg = ctx.temp.pendingOrderMsg;
            ctx.temp.pendingOrderMsg = null;
            ctx.temp.awaitingName = false;
            const reply = clientNewOrder(state, newClient, originalMsg, ctx);
            updateContext(phone, { topic: "order" });
            return reply;
          }

          const registerVariant = Math.floor(Math.random() * 5);
          const variants = [
            `${niceName} ! Ravie de faire votre connaissance 😊\n\nJe viens de vous ajouter dans notre carnet clients. Bienvenue officiellement chez Meshes & Co. ! 🎉\n\nEn cadeau de bienvenue, je vous ai offert 50 points de fidelite — ca vous donne ${money(500)} de reduction sur vos achats, directement !\n\nAlors, qu'est-ce que je vous montre en premier ? Notre catalogue, les promos du moment, ou un conseil personnalise ?`,
            `Bienvenue chez Meshes & Co., ${niceName} ! 😊\n\nVous etes desormais officiellement l'un(e) de nos clients. 🎉 J'ai prepare votre dossier avec 50 points de fidelite rien que pour vous (${money(500)} d'avantage).\n\nMaintenant, dites-moi ce qui vous ferait plaisir :\n🛍️ Voir notre catalogue\n💰 Decouvrir nos promos\n💬 Un conseil personnalise\n\nJe suis tout ouie !`,
            `${niceName}, vous faites partie de la famille Meshes & Co. maintenant ! 🎉😊\n\nJe viens de vous enregistrer avec 50 points de bienvenue (${money(500)} d'economie). Bienvenue a vous !\n\nPour bien commencer, je vous montre ce qui est disponible ? On a des perruques, bonnets, colles, accessoires... tout ce qu'il vous faut. Vous cherchez quelque chose en particulier ?`,
            `Bonjour ${niceName} et bienvenue chez Meshes & Co. ! 🎉\n\nC'est officiel, vous etes desormais dans notre carnet. J'ai ajoute 50 points de fidelite sur votre compte rien que pour vous accueillir (${money(500)}).\n\nJe suis votre conseillere personnelle desormais. N'hesitez jamais a m'ecrire pour :\n• Voir nos articles disponibles\n• Connaitre vos points et soldes\n• Passer commande\n• Ou juste un conseil !\n\nPar quoi on commence ? 😊`,
            `Felicitation ${niceName}, vous etes officiellement client(e) Meshes & Co. ! 🎉😊\n\nJe viens de creer votre dossier avec un petit quelque chose : 50 points de bienvenue (${money(500)}). Juste pour vous dire merci de nous rejoindre !\n\nAlors, qu'est-ce que je peux faire pour vous ? Un petit tour du catalogue, les nouveautes, ou vous avez deja une idee en tete ? Dites-moi tout !`
          ];
          return pick(variants);
        }
        return `Desole ${niceName}, je n'ai pas pu vous enregistrer pour le moment. Reessayez dans quelques instants ou passez en boutique 😊`;
      }
    }

    // ─── FLUX COMMANDE POUR PROSPECTS ───────────────────────────────────
    // Détecter si le prospect veut commander (même sans être enregistré)
    const wantsToOrder = /veux commander|veux acheter|voudrais commander|voudrais acheter|passer commande|je commande|je prends|j achete|nouvelle commande/.test(msg) ||
      /^je veux\s+\d+/i.test(msg) || /^je voudrais\s+\d+/i.test(msg);

    if (wantsToOrder) {
      // Si on attendait un prénom pour la commande, on essaie d'extraire le prénom
      // MAIS on ignore si le message ressemble à une autre commande ("je veux acheter X")
      if (ctx.temp.awaitingName) {
        // N'essaie PAS d'extraire un prénom si le message ressemble à une commande
        if (/^je\s+(veux|voudrais|suis)\s|^mon nom est/i.test(msg)) {
          // Laisser le bloc auto-enregistrement ci-dessus gérer "je suis X"/"mon nom est"
          // ou retomber dans awaitingName ci-dessous
        } else {
          const newClient = tryRegisterName(msg);
          if (newClient) {
            ctx.temp.awaitingName = false;
            const originalMsg = ctx.temp.pendingOrderMsg || msg;
            ctx.temp.pendingOrderMsg = null;
            const reply = clientNewOrder(state, newClient, originalMsg, ctx);
            updateContext(phone, { topic: "order" });
            return reply;
          }
        }
        // Ne pas reset awaitingName ici — laisser l'utilisateur réessayer
        updateContext(phone, { topic: "order" });
        return pick([
          `Desole, je n'ai pas bien compris. Quel est votre prenom ? 😊`,
          `Je n'ai pas saisi votre prenom. Pouvez-vous me le dire ? (ex: \"Je suis Paul\" ou juste \"Paul\")`,
          `Je ne suis pas sure d'avoir compris. C'est quoi votre prenom ?`
        ]);
      }

      // Prospect non enregistré → d'abord demander le prénom
      ctx.temp.awaitingName = true;
      ctx.temp.pendingOrderMsg = msg;
      updateContext(phone, { topic: "order" });
      return `Super, vous voulez commander ! 😊\n\nAvant cela, dites-moi votre prenom pour que je prepare votre commande et vous offre 50 points de bienvenue. C'est quoi votre prenom ?`;
    }

    // Si on attendait un prénom (fallback pour les messages simples comme "Houdini")
    if (ctx.temp.awaitingName) {
      // Timeout: si ça fait plus de 5 messages, on abandonne l'attente
      const awaitingAge = ctx.temp.awaitingAge || 1;
      ctx.temp.awaitingAge = awaitingAge + 1;
      if (awaitingAge > 5) {
        ctx.temp.awaitingName = false;
        ctx.temp.pendingOrderMsg = null;
        ctx.temp.awaitingAge = 0;
      } else {
        const newClient = tryRegisterName(msg);
        if (newClient) {
          ctx.temp.awaitingName = false;
          ctx.temp.awaitingAge = 0;
          const originalMsg = ctx.temp.pendingOrderMsg || msg;
          ctx.temp.pendingOrderMsg = null;
          const reply = clientNewOrder(state, newClient, originalMsg, ctx);
          updateContext(phone, { topic: "order" });
          return reply;
        }
        updateContext(phone, { topic: "order" });
        return pick([
          `Desole, je n'ai pas bien compris. Quel est votre prenom ? 😊`,
          `Je n'ai pas saisi votre prenom. Pouvez-vous me le dire ? (ex: \"Je suis Paul\" ou juste \"Paul\")`,
          `Je ne suis pas sure d'avoir compris. C'est quoi votre prenom ?`
        ]);
      }
    }

    // Intent: products / catalog / prices
    if (prospectIntent === "product") {
      const searchTerms = ["perruque","bonnet","colle","bande","pot","flacon","etiquette","spatule","creme","serum","cosmetique","wig","lace","cap"];
      let foundTerm = null;
      let filtered = products;
      for (const term of searchTerms) {
        if (msg.includes(term)) {
          foundTerm = term;
          filtered = products.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term)
          );
          break;
        }
      }
      if (filtered.length > 0) {
        const show = filtered.slice(0, 5);
        const variant = Math.floor(Math.random() * 5);
        let reply;
        if (variant === 0) {
          reply = `Avec plaisir ! Voila ce que j'ai pour le moment :\n\n`;
          show.forEach((p,i) => {
            if (p.promoPrice && p.promoPrice < p.price) {
              reply += `${i+1}. ${p.name} — ${money(p.promoPrice)} (au lieu de ${money(p.price)} en promo)\n`;
            } else {
              reply += `${i+1}. ${p.name} — ${money(p.price)}\n`;
            }
          });
          if (filtered.length > 5) reply += `\nJ'en ai ${filtered.length - 5} autres si vous voulez voir.`;
          reply += `\n\nVous voulez plus d'infos sur un article en particulier ? Je suis la pour ca !`;
        } else if (variant === 1) {
          reply = `Bien sur ! Voici ce qui est dispo :\n\n`;
          show.forEach((p,i) => {
            reply += `• ${p.name} — ${money(p.price)}`;
            if (p.promoPrice && p.promoPrice < p.price) reply += ` (en promo 😉)`;
            reply += `\n`;
          });
          if (filtered.length > 5) reply += `\nEt j'ai encore ${filtered.length - 5} references.`;
          reply += `\n\nDites-moi ce qui vous interesse, je vous donne tous les details !`;
        } else if (variant === 2) {
          reply = `Oui tout a fait ! Voici ce que j'ai en rayon :\n\n`;
          show.forEach((p,i) => {
            const promo = p.promoPrice && p.promoPrice < p.price ? ` (prix promo: ${money(p.promoPrice)})` : '';
            reply += `  ▸ ${p.name} : ${money(p.price)}${promo}\n`;
          });
          if (filtered.length > 5) reply += `\nIl y en a ${filtered.length - 5} de plus si vous voulez tout voir.`;
          reply += `\n\nEst-ce qu'il y a un article qui vous interesse ?`;
        } else if (variant === 3) {
          reply = `Regardez un peu ce que j'ai en stock :\n\n`;
          show.forEach((p,i) => {
            const promo = p.promoPrice && p.promoPrice < p.price ? ` (en promo, ${money(p.promoPrice)})` : '';
            reply += `  ✓ ${p.name} : ${money(p.price)}${promo}\n`;
          });
          if (filtered.length > 5) reply += `\nIl y a aussi ${filtered.length - 5} articles supplementaires.`;
          reply += `\n\nUn de ceux-ci vous interesse ?`;
        } else {
          reply = `Je vous envoie ce qui est disponible :\n\n`;
          show.forEach((p,i) => {
            if (p.promoPrice && p.promoPrice < p.price) {
              reply += `${i+1}. ${p.name} : ${money(p.promoPrice)} au lieu de ${money(p.price)} (profitez-en !)\n`;
            } else {
              reply += `${i+1}. ${p.name} : ${money(p.price)}\n`;
            }
          });
          if (filtered.length > 5) reply += `\nEt j'en ai ${filtered.length - 5} en stock supplementaires.`;
          reply += `\n\nN'hesitez pas a me demander plus d'infos sur un article !`;
        }
        updateContext(phone, { topic: "product" });
        return reply;
      }
      // If no products at all OR no matches for the search term
      if (foundTerm) {
        updateContext(phone, { topic: "product" });
        return pick([
          `Ah desole, je n'ai rien en "${foundTerm}" pour l'instant. Par contre j'ai d'autres articles sympa si vous voulez jeter un oeil ?`,
          `Malheureusement je n'ai plus de ${foundTerm} en stock en ce moment. Mais j'ai d'autres references qui pourraient vous plaire !`,
          `Plus de ${foundTerm} pour l'instant desole. Par contre, j'ai d'autres choses interessantes ! Vous voulez voir ?`
        ]);
      }
      // Fallback if no products exist at all
      updateContext(phone, { topic: "product" });
      return `Je suis desole, notre catalogue est en cours de mise a jour pour le moment. 😊 Mais vous pouvez quand meme nous rendre visite en boutique ! Nos horaires : Lun-Ven 9h-18h30, Sam 9h-17h. A bientot !`;
    }

    // Intent: hours
    if (prospectIntent === "hours") {
      updateContext(phone, { topic: "hours" });
      return `Nos horaires d'ouverture :\n\n📅 *Lundi - Vendredi :* 9h - 18h30\n📅 *Samedi :* 9h - 17h\n📅 *Dimanche :* Ferme\n\n📍 *Deux boutiques :*\n• Meshes et Accessoires\n• Packaging et Accessoires Cosmetiques\n\nEnvie de jeter un oeil a notre catalogue avant de venir ? 😊`;
    }

    // Intent: recommendation / advice
    if (prospectIntent === "recommend" || /conseil|besoin|cherche|idee|quoi/i.test(msg)) {
      const affordable = products.filter(p => p.price <= 3000).slice(0,3);
      const promos = products.filter(p => p.promoPrice && p.promoPrice < p.price).slice(0,3);
      const recoVariant = Math.floor(Math.random() * 3);
      let reply;
      if (recoVariant === 0) {
        reply = `Avec plaisir ! Laissez-moi vous guider 😊\n\n`;
        if (promos.length > 0) {
          reply += `🔥 *En promotion cette semaine :*\n`;
          promos.forEach(p => {
            const reduction = Math.round((1-p.promoPrice/p.price)*100);
            reply += `   • ${p.name} : ~~${money(p.price)}~~ ${money(p.promoPrice)} (-${reduction}%)\n`;
          });
          reply += `\n`;
        }
        if (affordable.length > 0) {
          reply += `💫 *Nos petits prix :*\n`;
          affordable.forEach(p => reply += `   • ${p.name} — seulement ${money(p.price)} ! (${p.shop})\n`);
          reply += `\n`;
        }
        reply += `💬 Dites-moi ce que vous cherchez : meshes, accessoires, packaging cosmetique ? Je vous trouve exactement ce qu'il vous faut !`;
      } else if (recoVariant === 1) {
        reply = `Voila, je vous donne quelques pistes 😊\n\n`;
        if (promos.length > 0) {
          reply += `Cote promos, on a du beau monde :\n${promos.map(p => `  ▸ ${p.name} a ${money(p.promoPrice)} au lieu de ${money(p.price)}`).join("\n")}\n\n`;
        }
        if (affordable.length > 0) {
          reply += `Et cote budget, voici ce qui est doux :\n${affordable.map(p => `  ✓ ${p.name} : ${money(p.price)}`).join("\n")}\n\n`;
        }
        reply += `Qu'est-ce qui vous attire le plus parmi tout ça ? Je vous conseille selon vos gouts !`;
      } else {
        reply = `Laissez-moi voir ce qui pourrait vous plaire... 😊\n\n`;
        const picks = products.sort(() => Math.random() - 0.5).slice(0, 4);
        picks.forEach(p => {
          const tag = p.promoPrice && p.promoPrice < p.price ? ` (en promo !)` : '';
          reply += `  • ${p.name} : ${money(p.price)}${tag}\n`;
        });
        reply += `\nVoila quelques idees ! Dites-moi votre style, je peux affiner 😊`;
      }
      updateContext(phone, { topic: "recommend" });
      return reply;
    }

    // Intent: price / budget question - more comprehensive detection
    if (/prix|combien|cout|tarif|budget|payment|payer|coute|montant|facture|€|f cfa|franc/i.test(msg)) {
      const cheapest = products.sort((a,b) => a.price-b.price).slice(0,5);
      const priceVariant = Math.floor(Math.random() * 3);
      let reply;
      if (priceVariant === 0) {
        reply = `Voici nos articles les plus abordables 😊\n\n`;
        cheapest.forEach((p,i) => reply += `${i+1}. ${p.name} — ${money(p.price)} (${p.shop})\n`);
        reply += `\nNous avons aussi des options plus premium si vous cherchez quelque chose de particulier. Qu'est-ce qui vous interesse ?`;
      } else if (priceVariant === 1) {
        reply = `Bien sur, voila un apercu de nos prix les plus doux :\n\n`;
        cheapest.forEach(p => reply += `  • ${p.name} : ${money(p.price)} (${p.shop})\n`);
        reply += `\nTout est abordable et de bonne qualite ! Vous cherchez quelque chose en particulier ?`;
      } else {
        reply = `Pas de probleme, je vous donne les tarifs :\n\n`;
        cheapest.slice(0,4).forEach((p,i) => {
          const promo = p.promoPrice && p.promoPrice < p.price ? ` (en promo: ${money(p.promoPrice)})` : '';
          reply += `${i+1}. ${p.name} : ${money(p.price)}${promo}\n`;
        });
        reply += `\nOn a de tout, pour tous les budgets. Qu'est-ce qui pourrait vous interesser ?`;
      }
      updateContext(phone, { topic: "price" });
      return reply;
    }

    // Intent: greeting or first message → warm welcome with catalog teaser
    // Note: les intents product/recommend/price sont deja traites avant,
    // donc ici on accueille uniquement les vrais greetings ou inconnus
    if (prospectIntent === "greeting" || (visitCount <= 1 && prospectIntent === "unknown")) {
      const cheapCount = products.filter(p => p.price <= 3000).length;
      const promoCount = products.filter(p => p.promoPrice && p.promoPrice < p.price).length;
      const greetingVariant = Math.floor(Math.random() * 3);
      if (products.length > 0) {
        let reply;
        if (greetingVariant === 0) {
          reply = `Bonjour ! 😊 Bienvenue sur l'assistant Meshes & Co.\n\nJe suis votre conseillere boutique. Meme si vous n'etes pas encore dans notre fichier, je peux deja vous renseigner !\n\n🛍️ *Ce que je peux faire pour vous :*\n• Vous montrer notre catalogue de ${products.length} articles\n${promoCount > 0 ? `• Vous parler de nos ${promoCount} articles en promotion 🔥\n` : ''}${cheapCount > 0 ? `• Vous conseiller des accessoires a partir de ${money(3000)}\n` : ''}• Vous donner nos horaires et adresses\n\n💬 *Dites-moi ce que vous cherchez :* perruques, bonnets, colles, cosmetiques, ou juste un conseil ? Je suis la pour vous ! 😊`;
        } else if (greetingVariant === 1) {
          reply = `Bonjour ! 😊 Bienvenue chez Meshes & Co.\n\nJe suis votre conseillere. Meme sans etre dans notre fichier, je peux deja vous aider.\n\nJ'ai ${products.length} articles en catalogue, ${promoCount > 0 ? `dont ${promoCount} en promo, ` : ''}et des accessoires pour tous les budgets.\n\nDites-moi ce qui vous interesse : perruques, bonnets, colles, packaging cosmetique ? Je vous guide ! 😊`;
        } else {
          reply = `Bonjour ! 😊 Bienvenue sur Meshes & Co.\n\nJe suis la pour vous renseigner avant meme votre inscription. Au programme :\n\n📦 ${products.length} articles en stock\n${promoCount > 0 ? `🔥 ${promoCount} articles en promotion\n` : ''}📍 Meshes et Accessoires & Packaging Cosmetiques\n\nQu'est-ce que je peux vous montrer ? Je suis tout ouie ! 😊`;
        }
        updateContext(phone, { topic: "greeting" });
        return reply;
      } else {
        const noStockVariant = Math.floor(Math.random() * 2);
        let reply;
        if (noStockVariant === 0) {
          reply = `Bonjour ! 😊 Bienvenue sur l'assistant Meshes & Co.\n\nJe suis votre conseillere boutique. Notre catalogue est en cours de mise a jour, mais je peux deja vous renseigner !\n\n📅 *Nos horaires :* Lun-Ven 9h-18h30, Sam 9h-17h\n📍 *Adresse :* Meshes et Accessoires & Packaging Cosmetiques\n\n💬 Dites-moi ce que vous cherchez, je vous reponds des que les produits sont disponibles. Ou laissez-moi votre prenom pour etre prevenu des nouveautes ! 😊`;
        } else {
          reply = `Bonjour ! 😊\n\nNotre catalogue est en train d'etre mise a jour, mais je peux deja vous donner nos infos pratiques :\n\n📅 Lun-Ven 9h-18h30, Sam 9h-17h\n📍 Meshes et Accessoires & Packaging Cosmetiques\n\nLaissez-moi votre prenom, je vous previens des que les nouveaux produits arrivent ! 😊`;
        }
        updateContext(phone, { topic: "greeting" });
        return reply;
      }
    }

    // Intent: objection ("c'est cher", "pas besoin")
    if (prospectIntent === "objection") {
      updateContext(phone, { topic: "objection" });
      return pick([
        `Je comprends tout a fait ! 😊 Nous avons des articles pour tous les budgets. Par exemple, certains de nos accessoires demarrent a des prix tres doux. Et avec notre programme de fidelite, chaque achat vous rapporte des points pour vos prochains achats. Dites-moi quel budget vous avez en tete, je vous trouve quelque chose !`,
        `Pas de souci ! 😊 Chez Meshes & Co., on a des produits pour toutes les bourses. Si vous voulez, je vous montre ce qu'on a dans les petits prix ? Vous risquez d'etre surpris(e) !`,
        `Je vois ! 😊 Le budget est important, je comprends. On a justement des accessoires a partir de 500 FCFA qui sont tres sympa. Voulez-vous que je vous les presente ?`
      ]);
    }

    // Intent: thanks / goodbye — friendly
    if (prospectIntent === "thanks") {
      updateContext(phone, { topic: "thanks" });
      return pick([
        `Avec plaisir ! 😊 N'hesitez pas a revenir quand vous voulez. Si vous voulez qu'on vous tienne au courant des nouveautes, donnez-nous votre prenom et on vous ajoute a notre liste !`,
        `Merci a vous ! 😊 C'est un plaisir de vous renseigner. Si vous avez besoin de quoi que ce soit, je suis la 24h/24.`,
        `Je vous en prie ! 😊 Vous pouvez aussi consulter notre catalogue a tout moment en m'ecrivant. Belle journee !`
      ]);
    }
    if (prospectIntent === "goodbye") {
      updateContext(phone, { topic: "goodbye" });
      return pick([
        `Au revoir ! 😊 Passez une excellente journee. Et si vous avez des questions plus tard, je suis la 24h/24 pour vous repondre !`,
        `A bientot ! 😊 N'hesitez pas a revenir quand vous voulez. Si vous voulez qu'on vous tienne au courant des promos, donnez-nous votre prenom !`,
        `Bonne journee ! 😊 Au plaisir de vous revoir sur Meshes & Co.`
      ]);
    }

    // Intent: debt/order/complaint/loyalty — can't help without account, but redirect warmly
    if (["debt","order","complaint","loyalty"].includes(prospectIntent)) {
      updateContext(phone, { topic: prospectIntent });
      return pick([
        `Pour vous renseigner sur ce sujet, j'aurais besoin de vous identifier. Donnez-moi votre prenom et je vous enregistre deja dans mon carnet ! En attendant, voulez-vous jeter un oeil a notre catalogue ? 😊`,
        `Je peux vous aider avec ça ! D'abord, quel est votre prenom ? Comme ça, je peux preparer votre dossier et vous montrer nos produits en meme temps 😊`
      ]);
    }

    // Fallback for any other message from a prospect
    updateContext(phone, { topic: "unknown" });
    return pick([
      `Je suis votre conseillere Meshes & Co. 😊 Je peux vous montrer notre catalogue, vous conseiller selon vos besoins ou vous donner les infos pratiques. Qu'est-ce qui vous ferait plaisir ?`,
      `Merci pour votre message ! 😊 Je suis la pour vous aider a trouver ce qu'il vous faut. Jetez un oeil a nos produits ou dites-moi ce que vous cherchez, je vous guide !`,
      `Bonjour ! 😊 Bienvenue chez Meshes & Co. Besoin de decouvrir nos collections, de connaître nos horaires, ou de recevoir des conseils personnalises ? Je suis votre assistante !`
    ]);
  }

  // Client flow
  if (identity.type === "client") {
    return clientReply(state, identity.client, msg, ctx);
  }

  // Employee flow
  if (identity.type === "employee") {
    return employeeReply(state, identity, msg, ctx);
  }

  // Fallback
  return "Bonjour ! Je suis l'assistant de Meshes & Co. Pour interagir avec moi, assurez-vous d'etre enregistre comme client ou employe.";
}

// ─── WHATSAPP INTEGRATION (Baileys) ─────────────────────────────────────────

let _waSock = null;
let _stateFile = null;
let _statusFile = null;

async function sendWhatsAppMessage(phone, text) {
  if (!_waSock) return { sent: false, error: "WhatsApp non connecte" };
  var jid = phone.includes("@s.whatsapp.net") ? phone : phone + "@s.whatsapp.net";
  try {
    await _waSock.sendMessage(jid, { text: String(text) });
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e.message };
  }
}

async function sendProactiveIfNeeded(phone, identity) {
  if (!_stateFile || !_waSock) return;
  const state = readState(_stateFile);
  const ctx = getContext(phone);
  const msg = generateProactiveMessage(state, identity, ctx);
  if (msg) {
    const jid = phone.includes("@s.whatsapp.net") ? phone : phone + "@s.whatsapp.net";
    try {
      await _waSock.sendMessage(jid, { text: msg });
      updateContext(phone, { proactive: true, msg });
    } catch (e) {
      // Silently fail for proactive
    }
  }
}

async function startWhatsAppAgent({ stateFile, statusFile }) {
  _stateFile = stateFile;
  _statusFile = statusFile;

  try {
    const baileys = require("@whiskeysockets/baileys");
    const qrcode = require("qrcode-terminal");
    const pino = require("pino");
    const { state, saveCreds } = await baileys.useMultiFileAuthState(path.join(path.dirname(stateFile), "wa-auth"));
    const sock = baileys.default({
      auth: state,
      logger: pino({ level: "silent" }),
      syncFullHistory: false,
      markOnlineOnConnect: false
    });
    _waSock = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, qr, lastDisconnect }) => {
      const errMsg = lastDisconnect?.error?.message || lastDisconnect?.error?.toString?.() || "";
      console.log("📡 WhatsApp status:", connection || "connecting...", errMsg ? "(" + errMsg.slice(0,60) + ")" : "");

      if (qr) {
        console.log("\n⬆️  SCANNEZ LE QR CODE AVEC VOTRE WHATSAPP");
        qrcode.generate(qr, { small: true });
        console.log("\n⬆️  SCANNEZ LE QR CODE CI-DESSUS");
        writeStatus(statusFile, { enabled: true, connected: false, message: "QR code affiche dans le terminal" });
      }
      if (connection === "open") {
        console.log("\n✅ Agent WhatsApp connecte !");
        writeStatus(statusFile, { enabled: true, connected: true, message: "Agent WhatsApp connecte" });

        // Send proactive messages after connection (with progressive delay)
        const sendWithDelay = (arr, identityFn, delayMs) => {
          arr.forEach((item, idx) => {
            setTimeout(() => {
              const identity = identityFn(item);
              const contactPhone = digits(item.phone);
              if (contactPhone) sendProactiveIfNeeded(contactPhone, identity);
            }, delayMs * (idx + 1));
          });
        };
        setTimeout(() => {
          const st = readState(stateFile);
          if (st) {
            sendWithDelay(st.settings?.users || [], u => ({
              type: "employee", user: u, role: u.role, shop: u.shop
            }), 3000);
            sendWithDelay(st.clients || [], c => ({
              type: "client", client: c
            }), 6000);
          }
        }, 5000);
      }
      if (connection === "close") {
        const isAuthFail = lastDisconnect?.error?.output?.statusCode === 401 || errMsg.includes("401") || errMsg.includes("not authorized");
        const shouldReconnect = !isAuthFail;
        writeStatus(statusFile, { enabled: true, connected: false, message: "Connexion WhatsApp fermee" });
        if (!shouldReconnect) {
          console.log("🔴 Erreur d'authentification WhatsApp. Supprimez le dossier wa-auth et relancez.");
        } else {
          console.log("Connexion WhatsApp fermee, reconnexion dans 5s...");
          setTimeout(() => startWhatsAppAgent({ stateFile, statusFile }), 5000);
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
      const msg = messages[0];
      if (!msg || msg.key.fromMe || !msg.message) return;

      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      if (!text.trim()) return;

      const phone = msg.key.remoteJid.split("@")[0];
      const erpState = readState(stateFile);
      const identity = findIdentity(erpState, phone);
      const ctx = getContext(phone);

      console.log(`💬 [${identity.type}] ${phone}: ${text.slice(0, 80)}`);

      // Check for anti-flood (max 5 msg/min)
      const recentMsgs = ctx.history.filter(h =>
        h.at && (Date.now() - new Date(h.at).getTime()) < 60000
      );
      if (recentMsgs.length > 5) {
        const floodMessages = [
          "Doucement ! Je prends note de toutes vos questions, mais laissez-moi repondre a chaque message un par un, d'accord ? 😊",
          "Je vois que vous avez beaucoup de choses a dire ! Je vais tout lire et vous repondre, mais un message a la fois pour etre sur de ne rien rater 😊",
          "Pas si vite ! 😊 Je prends le temps de bien vous repondre. Envoyez-moi vos questions une par une, je suis la pour ca !"
        ];
        await sock.sendMessage(msg.key.remoteJid, {
          text: pick(floodMessages)
        });
        return;
      }

      const reply = naturalReply(erpState, identity, text, phone);
      await sock.sendMessage(msg.key.remoteJid, { text: String(reply) });

      updateContext(phone, { name: identity.client?.name || identity.user?.name || null });
    });

    // Proactive check every 30 minutes
    setInterval(() => {
      if (!_waSock) return;
      const state = readState(stateFile);
      if (!state) return;

      // Send proactive to clients with debts > 10000 and no recent interaction
      (state.clients||[]).forEach(c => {
        if (!c.phone) return;
        const phone = digits(c.phone);
        if (!phone) return;
        const ctx = getContext(phone);
        if (c.balance > 10000 && ctx.lastInteraction && (Date.now() - ctx.lastInteraction) > 604800000) { // 7 days
          const identity = { type: "client", client: c };
          const msg = generateProactiveMessage(state, identity, ctx);
          if (msg) {
            const jid = phone + "@s.whatsapp.net";
            _waSock.sendMessage(jid, { text: msg }).catch(() => {});
            updateContext(phone, { proactive: true });
          }
        }
      });
    }, 1800000); // 30 min

  } catch (error) {
    writeStatus(statusFile, {
      enabled: false,
      connected: false,
      message: `Erreur: ${error.message}. Installez les dependances: npm install @whiskeysockets/baileys qrcode-terminal pino`
    });
    console.log("❌ WhatsApp agent disabled:", error.message);
  }
}

module.exports = { startWhatsAppAgent, sendWhatsAppMessage, naturalReply, findIdentity };
