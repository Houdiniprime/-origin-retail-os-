# FAQ — Agent WhatsApp BantouMind AI / Meshes & Co.

> **Document destiné au développeur et au client.**  
> Ce fichier décrit TOUS les types de questions que l'agent WhatsApp peut traiter  
> et exactement comment il doit y répondre.

---

## 📋 SOMMAIRE DES INTENTIONS (Intent Detection)

| # | Intention | Déclencheurs (mots-clés) | Qui | Priorité |
|---|-----------|--------------------------|-----|----------|
| 1 | **greeting** | bonjour, salut, bonsoir, hello, hi, coucou, hey, cc, salam | Tous | Haute |
| 2 | **debt** | dette, solde, crédit, payer, paiement, dois, montant, reste | Clients | Haute |
| 3 | **product** | produit, prix, catalogue, article, stock, perruque, bonnet, colle, etc. | Tous | Haute |
| 4 | **recommend** | conseil, recommander, proposer, suggestion, besoin, cherche | Tous | Haute |
| 5 | **loyalty** | point, fidélité, carte, fidèle, réduction, promo, offre | Clients | Moyenne |
| 6 | **objection** | cher, trop cher, pas besoin, plus tard, revendre, réfléchir | Tous | Moyenne |
| 7 | **order** | commander, commande, acheter, réserver, acompte, urgence | Tous | Haute |
| 8 | **complaint** | problème, plainte, réclamation, insatisfait, rembourser | Clients | Haute |
| 9 | **hours** | horaire, ouvert, fermé, quand, heure, dimanche, samedi | Tous | Basse |
| 10 | **thanks** | merci, merci beaucoup, super, génial, parfait, top | Tous | Basse |
| 11 | **goodbye** | au revoir, bonne journée, à bientôt, ciao, bye | Tous | Basse |
| 12 | **unknown** | Aucun mot-clé reconnu | Tous | Fallback |

---

## 1️⃣ ACCUEIL / SALUTATION (greeting)

**Quand :** L'utilisateur dit bonjour/salut sans autre intention claire.

**Comment l'agent répond :**
- Si c'est la **1ère visite** : message de bienvenue chaleureux + présentation des services
- Si le client a un **solde impayé** : le mentionner tout de suite après la salutation
- Si le client est **fidèle** (points > 0) : mentionner ses points
- Si c'est un **retour** : dire "Ravi de vous revoir", mentionner le dernier achat

**Exemples :**
```
Client : "Bonjour"
Agent : "Bonjour Houdini ! 😊 Ravi de vous revoir. Votre dernier achat remonte à il y a 2j. Que puis-je pour vous aujourd'hui ?"

Prospect : "Salut"
Agent : "Bonjour ! 😊 Bienvenue sur l'assistant Meshes & Co. [...] Dites-moi ce qui vous interesse !"
```

**Variations :** 6 variantes de salutation + 5 variantes de suivi pour les clients connus.

---

## 2️⃣ DETTE / SOLDE CLIENT (debt)

**Quand :** Le client demande son solde, sa dette, ou dit "payer".

**Comment l'agent répond :**
- **Solde = 0** : Féliciter, proposer le catalogue
- **Solde > 0 (dette)** : 
  - Montrer le montant exact + échéance
  - Si > 50 000 FCFA : proposer un échelonnement
  - Si > 10 000 FCFA : proposer Mobile Money ou passage en boutique
  - Si < 10 000 FCFA : proposer de passer en boutique
- **Solde < 0 (avoir)** : Annoncer la bonne nouvelle, proposer le catalogue
- Si des articles < 5 000 FCFA existent : les mentionner en suggestion

**Exemples :**
```
Client : "Quel est mon solde ?"
Agent : "Houdini, voici le détail de votre compte :
💰 Solde actuel : 25 000 FCFA
📅 Échéance : 30 Juin 2026

Si vous souhaitez régler cette somme, passez en boutique ou faites un mobile money. Je reste à votre disposition !"
```

---

## 3️⃣ PRODUITS / CATALOGUE (product)

**Quand :** L'utilisateur demande les produits, les prix, ou cherche un article spécifique.

**Comment l'agent répond :**
- Cherche un mot-clé dans le message (perruque, bonnet, colle, bande, pot, flacon, etc.)
- Filtre le catalogue par ce mot-clé
- Affiche jusqu'à 5 produits avec prix
- Si promo : afficher le prix promo barré
- Si stock bas (< 3) : mentionner "Plus que X en stock"
- Si plus de 5 produits : dire combien d'autres existent
- 5 variantes de présentation différentes

**Exemples :**
```
Client : "Vous avez des perruques ?"
Agent : "Alors voilà ce que j'ai pour vous Houdini :
1. Perruque lace premium — 22 000 FCFA
2. Bonnet wig cap — 1 500 FCFA

Ca vous interesse ? Dites-moi lequel et je vous donne plus de détails !"

Client : "Montre moi le catalogue"
Agent : "Houdini regardez un peu ce que j'ai pour vous :
• Perruque lace premium — 22 000 FCFA
• Bonnet wig cap — 1 500 FCFA
..."
```

**Détection intelligente :** Si le message contient à la fois "bonjour" ET des mots de catalogue, l'agent va directement au catalogue (ignore l'intention greeting).

---

## 4️⃣ RECOMMANDATION / CONSEIL (recommend)

**Quand :** L'utilisateur demande un conseil, une suggestion.

**Comment l'agent répond :**
- 5 variantes de présentation
- Priorise les promos et les articles abordables
- Mentionne les points de fidélité si le client en a
- Propose des articles au hasard (tri aléatoire)

**Exemples :**
```
Client : "Qu'est-ce que tu me conseilles ?"
Agent : "Alors Houdini, la bonne nouvelle c'est qu'on a des promos en ce moment ! 😊
• Bonnet wig cap : 1 200 FCFA au lieu de 1 500 (20% de réduction)
...
Ca vous tente quelque chose en particulier ?"
```

---

## 5️⃣ FIDÉLITÉ (loyalty)

**Quand :** Le client demande ses points, sa carte de fidélité.

**Comment l'agent répond :**
- Affiche le niveau (Bronze/Argent/Or/Platine) avec icône
- Affiche le nombre de points
- Calcule et affiche combien de points manquent pour le niveau supérieur
- Si le client a ≥ 100 pts : propose l'équivalent en réduction
- Explique que chaque 1 000 FCFA d'achat = 1 point

**Barème :**
| Niveau | Points | Description |
|--------|--------|-------------|
| 🟤 Bronze | 0-499 | Nouveau client |
| 🥈 Argent | 500-1 999 | Bon client |
| ⭐ Or | 2 000-4 999 | Client fidèle |
| 👑 Platine | 5 000+ | VIP premium |

---

## 6️⃣ GESTION DES OBJECTIONS (objection)

**Quand :** Le client trouve les prix trop chers, veut réfléchir, ou dit "pas besoin".

**Comment l'agent répond :**
- **Prix trop cher** : Propose les articles les moins chers (≤ 3 000 FCFA), mentionne les points de fidélité
- **Veut réfléchir** : "Prenez tout votre temps", propose de réserver un article
- **Pas besoin** : Comprend, laisse la porte ouverte

**Exemples :**
```
Client : "C'est trop cher"
Agent : "Je comprends Houdini, le budget est important ! 😊
Nous avons justement des articles très accessibles à partir de 550 FCFA.
..."
```

---

## 7️⃣ COMMANDE (order) — FLOW COMPLET

**Quand :** L'utilisateur veut commander ou acheter.

### Flow en 3 étapes :

**Étape 1 — Choix du produit :**
- Affiche le catalogue (8 articles max)
- L'utilisateur choisit par numéro ("le 3") ou par nom ("la perruque")
- 3 variantes de présentation du catalogue

**Étape 2 — Quantité :**
- Demande combien d'unités
- Vérifie le stock disponible
- Si quantité > stock : afficher les alternatives disponibles

**Étape 3 — Confirmation :**
- Affiche le récapitulatif (produit, quantité, total, boutique de retrait)
- L'utilisateur confirme par "oui" ou annule par "non"
- Si confirmé : crée la commande dans l'ERP, message de confirmation avec 3 variantes
- Si annulé : message sans pression, 3 variantes

### Cas spéciaux :
- **Prospect non enregistré** : Demande d'abord le prénom, enregistre automatiquement avec 50 pts de bienvenue, puis continue la commande
- **Stock insuffisant** : Propose des alternatives avec les stocks disponibles
- **Pas de produit trouvé** : Redemande ou propose le catalogue

**Exemples :**
```
Client : "Je veux commander 20 perruques"
Agent : "Bon choix Houdini ! Perruque lace premium à 22 000 FCFA l'unité.
Il nous en reste 16 en stock. Combien vous en faut-il ?"

Client : "20"
Agent : "Désolé Houdini, nous n'avons que 16 unités en stock.
Choisissez une autre quantité ou un autre produit :
1. Perruque lace premium — 22 000 FCFA (Stock: 16)
2. Bonnet wig cap — 1 500 FCFA (Stock: 42)
..."

Client : "16"
Agent : "Récapitulatif de votre commande Houdini :
📦 Produit : Perruque lace premium
🔢 Quantité : 16
💰 Total : 352 000 FCFA
📍 Retrait : Meshes et Accessoires
Pour confirmer, répondez "oui" ou "confirme"."
```

---

## 8️⃣ PLAINTE / RÉCLAMATION (complaint)

**Quand :** Le client se plaint d'un produit ou service.

**Comment l'agent répond :**
- S'excuse sincèrement (4 variantes)
- Donne le numéro de la gérante
- Invite à passer en boutique avec l'article

**Exemple :**
```
Client : "Le produit est défectueux"
Agent : "Je suis vraiment désolé d'apprendre cela Houdini ! 😔
Je vous invite à contacter directement la gérante au +237XXXXXXXX pour qu'on résolve cela ensemble rapidement."
```

---

## 9️⃣ HORAIRES (hours)

**Quand :** L'utilisateur demande les horaires d'ouverture.

**Comment l'agent répond :**
- 3 variantes de présentation
- Affiche : Lun-Ven 9h-18h30, Sam 9h-17h, Dim fermé
- Mentionne les 2 boutiques
- Propose le catalogue en fin de message

---

## 🔟 REMERCIEMENTS (thanks)

**Quand :** L'utilisateur dit merci.

**Réponse :** 5 variantes chaleureuses, propose de tenir au courant des nouveautés.

---

## 1️⃣1️⃣ AU REVOIR (goodbye)

**Quand :** L'utilisateur dit au revoir.

**Réponse :** 5 variantes, invite à revenir, mentionne les nouveautés.

---

## 1️⃣2️⃣ INCONNU / FALLBACK (unknown)

**Quand :** Aucune intention détectée.

**Comment l'agent répond :**
- **1ère visite** : Se présente et liste ses capacités (4 variantes)
- **Visites suivantes** : Redemande ce que l'utilisateur veut (5 variantes)

---

## 👥 PARTIE EMPLOYÉS (Staff / Management)

L'agent détecte automatiquement si le numéro est celui d'un employé et bascule en mode staff.

### Commandes employés :

| Intention | Commande | Niveau requis | Réponse |
|-----------|----------|---------------|---------|
| **Rapport** | "rapport", "bilan", "chiffre" | Tous | CA, marge, stock, ventes, crédits, dépenses |
| **Stock** | "stock", "alerte", "rupture" | Tous | Produits en stock critique avec niveau de gravité |
| **Caisse** | "caisse", "clôture", "session" | Tous | Opérations du jour, dernières clôtures |
| **Ventes** | "ventes", "CA", "recette" | Tous | Dernières ventes, résumé du jour par moyen de paiement |
| **Clients** | "clients", "dettes", "recouvrement" | Manager+ | Liste des débiteurs, top clients fidélité |
| **Produits** | "produits", "catalogue" | Tous | Catalogue complet avec prix et stocks |
| **Fournisseurs** | "fournisseurs", "commande fournisseur" | Manager+ | Liste fournisseurs, commandes en cours |
| **Employés** | "employés", "équipe" | Propriétaire+ | Liste de l'équipe avec rôles |
| **Tâches** | "tâches", "à faire" | Manager+ | Commandes en attente, commandes fournisseurs |
| **Paramètres** | "paramètres", "config" | Propriétaire+ | Infos boutique, devise, utilisateurs |
| **Audit** | "audit", "historique" | Manager+ | 10 dernières actions |
| **Dépenses** | "dépenses", "coût", "frais" | Manager+ | Total dépenses par catégorie |
| **Aide** | "aide", "que faire" | Tous | Liste des capacités selon le rôle |

### Hiérarchie des rôles :
| Rôle | Niveau | Accès |
|------|--------|-------|
| 👤 Caissière | 1 | Rapport, stock, caisse, ventes, produits, aide |
| 👤 Gérante | 2 | Tout sauf employés, paramètres |
| 👑 Propriétaire | 3 | Tout sauf audit |
| 🛡️ Super User | 4 | Tout |

---

## 📬 MESSAGES PROACTIFS (Envoyés automatiquement par l'agent)

L'agent peut envoyer des messages spontanés aux clients et employés :

### Pour les clients :
- **Rappel de dette** (solde > 10 000 FCFA, pas de contact depuis 24h)
- **Rappel points fidélité** (≥ 200 pts inutilisés)
- **Réengagement** (pas d'achat depuis 30 jours)

### Pour les employés :
- **Alerte stock** (≥ 2 produits en stock critique)

### Anti-flood :
- Maximum 5 messages par minute par utilisateur
- Au-delà : message "Doucement ! Laissez-moi répondre un par un"

---

## 🆕 AUTO-ENREGISTREMENT DES PROSPECTS

Quand un numéro inconnu écrit, l'agent :

1. Détecte les intentions (produits, prix, horaires, etc.)
2. Répond sans demander d'abord l'identité
3. Si le prospect veut commander : demande le prénom, enregistre automatiquement avec 50 pts de bienvenue
4. Si le prospect dit "je suis X" ou donne son prénom : enregistre automatiquement

**Déclencheurs d'auto-enregistrement :**
- "Je m'appelle X"
- "Mon nom est X"
- "Je suis X" (si X n'est pas un mot-outil)
- Appelle-moi X

**Bonus bienvenue :** 50 points = 500 FCFA de réduction, crédités automatiquement.

---

## 🧠 PSYCHOLOGIE DE VENTE (Patterns utilisés)

L'agent utilise plusieurs techniques de vente :

| Technique | Où ? | Exemple |
|-----------|------|---------|
| **Preuve sociale** | Recommandation | "Nos articles les plus populaires..." |
| **Rareté** | Stock bas | "Plus que 3 en stock !" |
| **Urgence** | Promos | "En promotion cette semaine !" |
| **Prix d'ancrage** | Promos | "22 000 FCFA au lieu de 25 000" |
| **Objection→Solution** | Objection prix | "Compris, voici nos petits prix..." |
| **Fidélisation** | Après achat | "Avec vos points, vous économisez..." |
| **Closing en douceur** | Fin des messages | "Ca vous interesse ? Dites-moi lequel !" |

---

## 📝 RÈGLES DE RÉDACTION

- Toujours utiliser le prénom du client (effet personnalisation)
- Varier les formulations (jamais 2 fois la même réponse)
- Utiliser des émojis modérément 😊
- Toujours terminer par une question ouverte (engagement)
- Ne jamais être insistant (si "non" → accepter)
- Adapter le ton selon l'intention
- Maximum 4 000 caractères par message (contrainte WhatsApp)

---

## 📊 DÉTECTION D'INTENTION AMÉLIORÉE

Le système utilise un système de scoring pondéré :

1. Chaque mot-clé a un **poids** (3-10)
2. Plus un mot-clé est spécifique, plus son poids est élevé
3. L'intention avec le score total le plus haut est choisie
4. En cas d'égalité : **détection contextuelle intelligente**
   - "Bonjour + mots produit" → catalogue (pas salutation)
   - "Bonjour + mots solde" → compte (pas salutation)
   - "Je veux commander X" → commande (même avec mots produit)

---

*Document généré le 19/06/2026 — Origin Retail OS / BantouMind AI Agent*
