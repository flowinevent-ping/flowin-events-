# Mémoire : produit-ergonomie (créée le 21/11/2026 ; ≤120 lignes)

## Déjà fait et décidé (dates)
- 08/11 : méthode (cadrage, un écran à 10/10 validé sur téléphone puis reproduit), police ≥ 13 px, zones ≥ 44 px, cartes blanches, couleur de catégorie seulement sur pictogramme / puce / bouton (`docs/DECISIONS-flowin-event.md`).
- 09-10/11 : espace pro aux couleurs plaquette (bleu #3B5CC4, logo Flowin Event) ; configurateur en carrousel jusqu'à « Valider mon bon de commande » ; publication sans scroll ; QR SEPA ; moins de champs à l'inscription (`4bd55ea4`, `11bf48dc`).
- 10/11 : espace pro v2 / v3 : « Mon profil » en carrousel, rapport d'activité en carrousel (chiffres clés d'abord, Hommes / Femmes, chalandise en %, égaliseur des flashs par QR), plus de violet, super admin en bleu (`6514ace8`, `5617d00a`, `33a47d59`, `e173d7df`).
- 10/11 : mode démo global `?demo=1` (aucune écriture, champs « Démo », bandeau) et page de validation sans login (`5f89ff26`, `450bc57b`).
- 17/11 audit des 5 experts (`docs/audit-2026-11-17/`) : jeux (tombola débloquée, démo sans écriture, gestes du flash au ticket : quiz + bonus 29 vers 21, quiz solo 22 vers 14, roue 13 vers 10, tombola vers 10), coordonnées en 2 volets sans défilement, profil /moi en 5 rubriques (QR plein écran en 1 toucher), carte MapLibre + OpenFreeMap (Autour de moi, itinéraire Waze / Plans / Google Maps), cohérence app / films / plaquettes, pro et SA mobiles (tableaux en cartes par 10, cibles 44 px, kanban en carrousel).
- 17/11 : parrainage en fin de parcours et dans le profil ; connexion joueur par lien e-mail ; roue des films identique à l'app.
- 19/11 : scanner caméra dans /pro/scanner (jsQR), écran organisateur « Les phases » (carrousel), annonces des commerces (carrousel 3 écrans).
- 20/11 : correctifs de l'E2E : listes pro fraîches, historique à une animation, animation sans paiement en ligne, création de Super Event avec session, texte du bouton « Terminer le tirage », « Pas de lot cette fois » dans /moi.

## Règles de conception retenues
- Carrousel ou rubriques, jamais de longue page ; une idée par écran ; moins de 40 mots par écran (proposition `docs/audit-2026-11-08/visuel/`, à valider).
- Jeux : gagner en fonctionnel (moins d'étapes, réactivité, effet de gain) sans changer le graphisme validé ; haptique ajoutée.
- Consentement et collecte des coordonnées : inchangés (3 cases, aucune cochée, phrase « jamais vendues… »).
- Dashboard SA vanilla : boutons, champs, menus ≥ 44 px sur téléphone, aucun débordement horizontal ; miroir MD5 identique ; Acorn 2020, `var`, `.indexOf()`.
- Le jeu côté joueur prend les couleurs du commerçant ; pro et admin gardent la palette Flowin.

## Pièges connus
- Mode démo : toute redirection doit conserver `demo=1` ; en démo montrer le résultat sans écrire (billet de la roue, profil fictif).
- Data Cache Next : liste vide ou périmée après création = `no-store` côté serveur.
- Inventaire avant / après : une régression de l'audit (détail des tickets par commerce réduit à un total) a été retrouvée par comparaison.
- Listes sans clic et boutons `cursor:pointer` sans `onClick` (`docs/patterns-bugs-connus.md`) ; compteur = table de faits, jamais longueur d'une liste paginée.
- `NDS2026Client.tsx` et `nds2026Design.ts` intouchables ; surcharges white-theme seulement dans `NDS2026Client.tsx` (`!important` sous `.ndsbody`).
- Textes de tirage affichés sur un jeu à gain immédiat (corrigé dans le code, non revérifié).
- Pas d'emoji (garde-fou `admin/scripts/verifier-emojis.mjs`).

## Sources et standards utiles
- WCAG 2.2 : cible tactile 24 px minimum (nous visons 44 px, recommandation Apple HIG) ; contraste AA ; Material / HIG pour carrousels et gestes.
- Tokens : `docs/DESIGN-TOKENS-flowin.md`, `admin/lib/charte.ts`.

## Ouvert
- Valider une charte couleurs définitive bleu / orange (REGISTRE L11, attente Romain).
- Restent proposés (expert 5) : filtres du CRM pro repliables ; banques et lots NDS regroupés par rubrique.
- Autres cartes encore en Leaflet (`nds-carte`, `dashboard.html`, `nds-parcours.html`) ; NDS2026 intouchable.
- `lot.html` : conditions NDS « valable jusqu'au 25 octobre 2026 » alors que NDS n'a pas de date limite : décision de Romain en attente.
- Affichage « Commerce partenaire — » sur `lot.html` pour un pro sans partenaire (cosmétique).
- 8 animations sans position sur la carte : pas urgent (19/11), rien à faire.
- Parcours d'inscription pro : validation par Flowin manuelle (voulu) : message clair à vérifier.
- 23/11 CRM pro : une cellule de tableau = un seul bloc (TablesMobiles la met en grille titre / valeur sur téléphone) ; coordonnées masquées = « Contact non partagé » (TEXTE_NON_PARTAGE, lib/crmPro.ts) ; normaliserContact() nettoie les lignes de crm_pro ; écrans SA qui lisent des coordonnées : SessionSAExpiree, jamais une liste vide ; sa-alert + gras = classe texte.
