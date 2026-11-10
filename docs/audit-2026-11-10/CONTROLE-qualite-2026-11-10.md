# Contrôle qualité du 10/11/2026 (espace pro)

Périmètre : commits sur `main` depuis le 10/11 08:00 (37 commits), espace pro, pages joueur et publiques.
Méthode : `tsc --noEmit`, `next build` (copie scratchpad), Playwright sur `next start` en mode démo `?demo=1`
(pro-charvolin, pro-qa-tech-1), 33 écrans x 2 tailles (390x844, 1280x900), écoute `page.on('request')`.
Base : lecture seule (SELECT information_schema / pg_proc), aucune écriture.

## Résultat global
- `tsc` : 0 erreur. `next build` : « ✓ Compiled successfully ».
- 66 visites, **0 requête non-GET vers supabase.co** (mode démo étanche), 0 erreur JavaScript de page.
- Mots interdits : aucun « signer » ni « ancien format » visible dans l'espace pro ; « Valider mon bon de commande » partout côté pro.
- Tables et RPC ajoutées aujourd'hui (crm_retours, tirages, clients_commerce, mes_cadeaux, offrir_ticket_ami, pro_relancer_lots, carte_commerces_publique, accepter_ticket_expire...) : toutes présentes en base.
- qr_stations : lu en `select('*')`, insertion avec repli sans `support/type_qr` : fonctionne avec ou sans la migration QR en cours.

## Constats
| Gravité | Constat | Preuve | Correction |
|---|---|---|---|
| Haute | Mon profil > Enregistrer « ne fait rien » : un clic avant l'hydratation React est perdu, et le retour (petit texte à droite du bouton, bas d'une page de 1 473 px) n'était pas visible. | Playwright : 1er clic sans effet, aucun appel ; clics suivants OK mais message hors écran | Bouton inactif tant que la page n'est pas prête, bandeau de retour fixe au-dessus de la barre du bas, texte démo explicite (EntrepriseForm.tsx) |
| Haute | Mode démo : le remplissage automatique remplaçait le logo existant par une image factice (upload intercepté, URL cassée, logo disparu). | journal démo : POST storage au chargement de Mon profil | flowin-demo.js : aucun fichier injecté si une image est déjà affichée (Acorn 2020 OK) |
| Moyenne | Débordement de 44 px de l'espace pro à 1280x900 (barre latérale 100dvh + padding sans border-box). | scrollHeight - clientHeight = 44 sur tous les écrans | ProShell : box-sizing border-box, hauteur tenant compte du bandeau démo ; 0 px après |
| Moyenne | Le bandeau « Mode démo » masquait le haut de l'espace pro (fil d'Ariane). | captures avant | body décalé de 24 px en démo, variable `--flowin-demo-h` |
| Moyenne | Colonne `pros.droits` absente en prod : requête en erreur 400 répétée jusqu'à 5 fois par écran. | HTTP 400 `pros?select=droits` | lib/droitsPro.ts : absence mémorisée pour la session, lectures partagées (1 seule par session). SQL à appliquer : voir ci-dessous |
| Basse | RPC `joueurs_uniques_par_mois` et `stats_qr_evenement` absentes (404) ; replis client en place et justes. | HTTP 404 rpc | Aucune côté code ; SQL listé |
| Moyenne | Violet restant dans l'espace pro : lien « Ouvrir en plein écran » (aperçu jeu, Rejoindre), puce active des écrans d'aperçu, bandeau des fiches « Animation » (COULEURS_ETAPES.event). | détection couleur #7A4FE0 | Passés en bleu #3B5CC4 / #2B47A8 |
| Moyenne | Mon profil : 1 473 px de défilement à 390 px, onglets sur 3 lignes. | mesure Playwright | Blocs en carrousel latéral sur téléphone, Enregistrer toujours visible, onglets sur une ligne de 44 px ; 308 px restants (bloc logo) |
| Moyenne | Rapport d'activité illisible (11 petites tuiles, chiffres clés noyés). | capture avant | Chiffres clés d'abord (personnes venues, parties, gains, femmes/hommes, flashs QR), origine par QR/support, détail replié ; onglet renommé « Rapport d'activité » |
| Basse | Accueil : noms d'animation tronqués, 5 boutons sur 3 lignes, raccourcis < 44 px. | capture avant | Action principale en premier, rangée défilante, cibles 44 px, raccourcis « QR et diffusion / Rapport / Gagnants / Lots » |
| Basse | Fiche animation : 4 chiffres empilés sur téléphone, onglets 36 px. | capture avant | Grille 2x2, onglets 44 px |
| Info | Carte publique : bouton « Les deux » violet. | détection couleur | Volontaire (couleur de donnée documentée), hors espace pro |
| Info | Mode démo : +24 px de défilement sur les pages publiques (décalage du bandeau). | mesure | Démo uniquement, accepté |

## Reste à faire (base de données uniquement)
`sql/2026-11-10-controle.sql` (aucune nouvelle DDL : il pointe `sql/06-droits-pro.sql` et les deux fonctions de `sql/2026-11-01-tirage-auto-liste-gagnants.sql`, avec la requête de vérification). Non appliqué.

## Preuves
Captures avant / après et planche : `admin/public/validation/captures/espace-pro-v2.jpg` (onglet Parcours pro du hub de validation).
