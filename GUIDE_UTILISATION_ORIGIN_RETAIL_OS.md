# Guide d'utilisation - Origin Retail OS

## 1. Demarrage du poste principal

Le poste principal est l'ordinateur de la boutique qui lance l'ERP.

### Installation sur ordinateur vide

1. Copier tout le dossier projet sur l'ordinateur du client.
2. Ouvrir le dossier.
3. Double-cliquer sur `INSTALLER_CLIENT.exe`.
4. Autoriser l'installation si Windows demande une confirmation.
5. L'installateur:
   - verifie Node.js;
   - installe Node.js si absent;
   - installe les dependances ERP;
   - cree le raccourci bureau `Origin Retail OS`;
   - lance l'application.

Si Windows bloque l'executable, cliquer sur `Informations complementaires`, puis `Executer quand meme`.

### Lancement quotidien

1. Ouvrir le dossier du projet.
2. Double-cliquer sur `OriginRetailOS.exe`.
3. Le navigateur s'ouvre automatiquement sur l'adresse locale:

```text
http://localhost:8080/app.html
```

4. Le terminal affiche aussi:
   - le lien local pour telephone/tablette sur le meme Wi-Fi;
   - le lien distant HTTPS;
   - un QR code.

Important: garder la fenetre du terminal ouverte. Si elle est fermee, l'ERP et le lien distant s'arretent.

## 2. Connexion des utilisateurs

Chaque utilisateur choisit son profil et entre son code d'acces.

Codes initiaux:

| Profil | Code |
|---|---:|
| Super User | `0000` |
| Proprietaire | `9000` |
| Gerante Meshes | `2201` |
| Gerante Packaging | `2202` |
| Caissiere Meshes 1 | `1101` |
| Caissiere Meshes 2 | `1102` |
| Caissiere Packaging 1 | `1201` |
| Caissiere Packaging 2 | `1202` |

Apres connexion, un message de bienvenue avec le prenom apparait.

## 3. Proprietaire / Super User

Acces complet:

- Dashboard global multi-boutiques.
- Caisse POS.
- Operations.
- Stocks.
- Clients et dettes.
- Fournisseurs.
- Depenses.
- Rapports.
- Assistant IA.
- Parametres.

Actions recommandees chaque jour:

1. Verifier le dashboard global.
2. Controler les ventes par boutique.
3. Lire les alertes de stock.
4. Controler les dettes clients.
5. Verifier les clotures de caisse.
6. Exporter ou sauvegarder les rapports.

Actions sensibles reservees:

- Creer/modifier/supprimer les comptes.
- Modifier les codes d'acces.
- Supprimer les donnees test.
- Restaurer une sauvegarde.
- Modifier les parametres boutique.

## 4. Gerante de boutique

La gerante pilote sa boutique.

Elle peut:

- voir le dashboard de sa boutique;
- suivre les ventes;
- verifier le stock;
- suivre les clients et dettes;
- enregistrer les depenses;
- gerer les taches equipe;
- suivre les clotures caisse;
- utiliser l'assistant IA.

Routine recommandee:

1. Ouvrir le dashboard en debut de journee.
2. Verifier les produits en alerte stock.
3. Donner les taches aux caissieres.
4. Controler les ventes dans la journee.
5. Valider la cloture caisse en fin de journee.
6. Envoyer le recap au proprietaire si besoin.

## 5. Caissiere

La caissiere travaille principalement dans `Caisse POS`.

Vente simple:

1. Aller dans `Caisse POS`.
2. Chercher le produit.
3. Cliquer sur le produit pour l'ajouter au panier.
4. Choisir le client si necessaire.
5. Choisir le mode de paiement.
6. Cliquer sur `Valider la vente`.

Prix special:

1. Ajouter le produit au panier.
2. Dans la ligne panier, modifier `Prix vendu`.
3. Cliquer sur `OK prix`.
4. Verifier le nouveau total.
5. Valider la vente.

Mix produit:

Exemple: vendre une bouteille avec le couvercle d'une autre bouteille.

1. Ajouter le produit principal au panier.
2. Dans la ligne panier, choisir l'accessoire ou le composant dans `Ajouter couvercle / accessoire`.
3. Indiquer la quantite.
4. Cliquer sur `Mixer`.
5. Verifier la note de mix.
6. Valider la vente.

Le stock du produit principal et du composant est automatiquement retire.

## 6. Cloture de caisse

La cloture se fait dans `Operations`.

1. Ouvrir `Operations`.
2. Ouvrir une session caisse en debut de journee si elle n'est pas encore ouverte.
3. En fin de journee, entrer:
   - fond de caisse;
   - cash compte;
   - MTN MoMo terminal;
   - Orange Money terminal;
   - note de cloture.
4. Cliquer sur `Cloturer maintenant`.
5. L'ecart est calcule automatiquement.

## 7. Responsable stock

Acces principal: `Stocks`.

Actions:

- Ajouter un produit.
- Modifier les quantites.
- Ajouter les photos produit.
- Suivre les seuils critiques.
- Verifier les mouvements apres ventes.
- Utiliser la recherche par photo.

Bonnes pratiques:

- Renseigner SKU, categorie, boutique, cout et prix.
- Ajouter une photo pour faciliter la vente en caisse.
- Corriger les stocks apres inventaire physique.

## 8. Clients et dettes

Dans `Clients & dettes`:

- ajouter un client;
- suivre son solde;
- enregistrer les dettes;
- consulter les echeances;
- preparer les relances.

Pour une vente a credit:

1. Selectionner le client dans le POS.
2. Choisir `Credit client`.
3. Valider la vente.
4. La dette est ajoutee automatiquement au client.

## 9. Rapports Excel et IA

Dans `Rapports`:

- exporter les ventes;
- exporter le stock;
- exporter clients et depenses;
- importer un rapport Excel, CSV, TSV ou JSON;
- archiver un rapport physique.

Import Excel:

1. Aller dans `Rapports > Import IA Excel`.
2. Choisir le fichier.
3. L'IA lit les colonnes et met a jour:
   - produits;
   - clients;
   - ventes;
   - depenses.
4. Les KPI et graphes sont recalcules.

## 10. Assistant IA

L'assistant IA donne:

- alertes stock;
- recommandations ventes;
- anomalies;
- priorites;
- recap boutique.

Il aide a lire rapidement l'etat de l'activite.

## 11. Agent WhatsApp

L'agent WhatsApp repond selon le niveau d'acces.

Exemples de messages:

```text
rapport du jour
stock critique
cloture caisse
dernieres ventes
dettes clients
prix produits
```

Avant usage:

1. Lancer le mode WhatsApp si active.
2. Scanner le QR code WhatsApp.
3. Cliquer dans l'ERP sur `Synchroniser ERP`.

## 12. Telephones et tablettes

Meme Wi-Fi:

1. Lancer `OriginRetailOS.exe`.
2. Scanner le QR code local affiche dans le terminal.
3. Se connecter avec son code.

A distance:

1. Lancer `OriginRetailOS.exe`.
2. Copier le lien HTTPS distant affiche.
3. Envoyer le lien aux utilisateurs autorises.
4. Chaque utilisateur se connecte avec son code.

## 13. Sauvegarde

Chaque fin de journee:

1. Cliquer sur `Backup JSON`.
2. Garder le fichier sur l'ordinateur.
3. Copier aussi le fichier dans Google Drive ou une cle USB.

Avant grosse modification:

- faire un backup;
- verifier que le fichier est bien telecharge.

## 14. Regles de securite

- Ne jamais partager le code `0000` sauf avec le responsable systeme.
- Chaque caissiere doit utiliser son propre code.
- Changer les codes si une personne quitte l'equipe.
- Ne pas fermer le terminal pendant l'utilisation.
- Faire un backup avant suppression de donnees.
- Ne donner le lien distant qu'aux personnes autorisees.

## 15. Depannage rapide

Le navigateur ne s'ouvre pas:

- ouvrir manuellement `http://localhost:8080/app.html`.

Le telephone ne se connecte pas:

- verifier le meme Wi-Fi;
- scanner le QR code local;
- autoriser Node.js dans le pare-feu Windows.

Le lien distant ne marche pas:

- verifier Internet;
- garder le terminal ouvert;
- relancer `OriginRetailOS.exe`.

Le POS ne valide pas:

- verifier le stock;
- verifier le mode de paiement;
- pour credit, selectionner un client.

Les donnees semblent anciennes:

- cliquer sur `Backup JSON`;
- recharger la page;
- verifier que le bon ordinateur serveur est utilise.
