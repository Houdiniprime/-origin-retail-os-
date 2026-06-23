# Stitch Boutique ERP

Application locale complete pour boutique:

Guide complet d'utilisation par poste:

```text
GUIDE_UTILISATION_ORIGIN_RETAIL_OS.md
```

Installation chez un client sur ordinateur vide:

```text
INSTALLER_CLIENT.exe
```

Double-cliquer dessus. L'installateur verifie Node.js, l'installe si absent, installe les dependances, cree le raccourci bureau `Origin Retail OS`, puis lance l'application.

- Caisse POS: ventes cash, MTN MoMo, Orange Money, credit client.
- Stock: inventaire, seuil critique, ajustements, reception fournisseur.
- Clients: dettes, paiements, relance WhatsApp, export Google Calendar `.ics`.
- Fournisseurs: achats, dettes fournisseur, message WhatsApp.
- Depenses: sorties de caisse.
- Rapports: KPI, exports CSV, backup/restauration JSON, audit.
- Assistant IA local: recommandations calculees sans API externe.
- Dashboard moderne: KPI colores, courbe 7 jours, CA par boutique, repartition categories, produits moteurs.
- Acces multi-role: proprietaire, deux gerantes, plusieurs caissieres.
- Super user systeme avec code `0000`.
- Creation de comptes avec generation automatique de code et dashboard selon poste.
- Edition des codes, roles, postes, boutiques et numeros WhatsApp depuis Parametres.
- Personnalisation boutique avancee: slogan, logo, couleurs, adresse, fiscalite, prefixe facture, pied de ticket, politique backup.
- Suppression propre des donnees test tout en gardant comptes et parametres.
- Archivage de rapports physiques Excel/PDF/Image de la boutique avec date, type, note et telechargement.
- Produits avec photos, recherche par photo, filtre boutique global.
- Journal d'audit horodate par utilisateur, role et boutique.
- Assistant IA central: recommandations, anomalies, recap Gmail.
- Agent WhatsApp connecte a l'ERP avec reconnaissance employes/clients par numero et reponses selon niveau d'acces.
- Cockpit Operations: ouverture session caisse, cloture caisse, ecarts, retours/avoirs, transferts inter-boutiques, commandes fournisseurs et taches equipe.
- Import IA de rapports Excel `.xlsx`, CSV, TSV ou JSON pour mettre a jour produits, clients, ventes et depenses.
- Modele d'import CSV telechargeable depuis `Rapports > Modele import IA`.

Boutiques configurees:

- Meshes et Accessoires
- Packaging et Accessoires Cosmetiques

## Codes demo

- Super User: `0000`
- Proprietaire: `9000`
- Gerante Meshes: `2201`
- Gerante Packaging: `2202`
- Caissieres Meshes: `1101`, `1102`
- Caissieres Packaging: `1201`, `1202`

Les nouveaux comptes peuvent etre crees depuis l'ecran d'accueil ou depuis `Parametres > Creer un acces`.

## Import IA Excel

Aller dans `Rapports > Import IA Excel`, choisir un fichier `.xlsx`, `.csv`, `.tsv` ou `.json`.

Colonnes reconnues automatiquement: `type`, `date`, `sku`, `produit`, `categorie`, `boutique`, `quantite`, `cout`, `prix`, `client`, `telephone`, `solde`, `methode`, `montant`, `libelle`.

L'import met a jour la base locale, recalcule les KPI, les graphes, les alertes stock et le plan IA.

## Agent WhatsApp ERP

Installer les dependances puis lancer:

```bash
npm.cmd install
npm.cmd run start:whatsapp
```

Scanner le QR code dans le terminal avec WhatsApp. Ensuite:

- un numero employe reconnu recoit les informations autorisees par son role;
- une caissiere voit surtout caisse, stock, clients utiles;
- une gerante voit sa boutique;
- le proprietaire et le super user voient toutes les boutiques;
- un client reconnu voit son solde, les prix et disponibilites;
- un numero inconnu est bloque et invite a etre rattache a un profil.

Avant utilisation, ouvrir l'ERP et cliquer `Parametres > Synchroniser ERP` pour envoyer la base locale au serveur WhatsApp.

Exemples de messages:

- `rapport du jour`
- `stock critique`
- `cloture caisse`
- `taches ouvertes`
- `prix produits`
- `dernieres ventes`
- `dettes clients`

## Demarrage local

```bash
npm start
```

Ouvrir `http://localhost:8080`.

Sur Windows, double-cliquer directement:

```text
OriginRetailOS.exe
```

Puis choisir:

- `1` pour le mode local boutique;
- `2` pour le mode distant avec lien HTTPS public.

Au demarrage, le terminal affiche automatiquement:

- le lien de l'ordinateur;
- le lien telephone/tablette sur le meme Wi-Fi;
- un QR code a scanner.

## Acces a distance automatique

```bash
npm.cmd run remote
```

Sur Windows, double-cliquer directement:

```text
demarrer-distance.bat
```

Cette commande:

- lance l'ERP sur le port `8080`;
- cree automatiquement un lien HTTPS public via Cloudflare Tunnel;
- affiche le lien distant et un QR code;
- permet aux telephones, tablettes ou PC hors boutique de se connecter.
- enregistre aussi le lien dans `data/remote-access.json`.

Garder le terminal ouvert. Quand le terminal est ferme, le lien distant s'arrete.

Les utilisateurs doivent toujours entrer leur code d'acces ERP (`0000`, gerante, caissiere, etc.).

## Docker

```bash
docker compose up --build
```

## Cloud Run

```bash
docker build -t stitch-boutique-erp .
docker run -p 8080:8080 stitch-boutique-erp
```

Pour GCP, pousser l'image vers Artifact Registry puis deployer sur Cloud Run avec le port `8080`.

## Donnees

Les donnees sont stockees dans `localStorage` du navigateur. Utiliser `Backup JSON` chaque fin de journee et conserver le fichier sur Google Drive.
