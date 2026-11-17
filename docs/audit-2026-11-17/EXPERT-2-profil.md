# Expert 2 : profil participant (/moi), audit du 17/11/2026

Périmètre : `admin/app/moi/page.tsx`, `admin/components/joueur/MesLots.tsx`, `admin/lib/mesLots.ts`,
compte participant (création, connexion, mot de passe oublié), billet joueur (`/nds/billets-partenaires.html`, `/lot.html` côté affichage).
Règles appliquées : `docs/DECISIONS-flowin-event.md` (règles d'interface absolues, tickets gagnants dans le profil,
exception Nuits du Sud 2026, audit du 17/11).

Tests : build de production d'une copie (`next start`, port 3522), Playwright 390 x 844 et 1280 x 800,
mode démo `?demo=1` sur un vrai participant en lecture seule (3 lots NDS non retirés). **0 requête non-GET vers supabase.co**
sur tous les parcours, y compris le clic sur un consentement.
Captures (scratchpad de session, non versionnées car elles montrent un vrai participant) : `audit17/profil/avant-*`, `apres-*`, `planche.png`.

## Constats et corrections

| Gravité | Constat | Preuve | Correction |
|---|---|---|---|
| Bloquant | Les lots Nuits du Sud 2026 s'affichaient **« Expiré »** et **sans QR** alors que la décision du 10/11 dit : pas de date de péremption pour se-nds-2026. `/moi` prenait `super_events.date_f` (18/07/2026) comme date limite. | `avant-accueil-390.png` : « Bon d'achat 30 € · Expiré », compteur « 0 gain à utiliser » pour un joueur qui a 3 lots non retirés. `date_limite_tirage()` en base renvoie null pour se-nds-2026. | `lib/mesLots.ts` : constante `SANS_PEREMPTION = 'se-nds-2026'`, même règle que `date_limite_tirage` ; la carte affiche « Sans date limite ». Après : « 3 lots à utiliser », QR visibles. |
| Majeur | Pas de mot de passe ni de connexion côté participant : l'identité est l'`id` gardé dans le téléphone (`localStorage.flowin_joueur`). Le « mot de passe oublié » de Supabase (Site URL) ne concerne que les pros (`/pro/nouveau-mot-de-passe`). Sur un nouveau téléphone, rien n'expliquait comment retrouver ses lots. | `grep resetPasswordForEmail` : seulement `app/pro/*`. `lib/parcours.ts` : l'identité est résolue par l'e-mail à chaque partie (`email_lower`) puis mémorisée. | « Mon compte » et l'écran sans compte disent : « Pas de mot de passe : rejoue avec le même e-mail, ton compte et tes lots reviennent. » Aucun lien de réinitialisation à créer côté participant. **À trancher par Romain** : connexion par lien magique e-mail (nécessite de relier `joueurs` à `auth.users`), non faite. |
| Majeur | Les choix « rester en contact » (Flowin Event / commerce), à garder absolument, n'étaient ni visibles ni modifiables par le participant. | Aucun écran ; `joueurs.optin` et `clients_commerce.optin` existent en base. | RPC `mes_consentements` / `maj_consentement` (security definer, appliquées en prod, `sql/2026-11-17-joueur-consentements.sql`). Cases dans « Mon compte » + « Tes données ne sont jamais vendues, échangées ni commercialisées. » |
| Majeur | Profil = longue colonne avec 2 onglets ; les notifications 30 j / 15 j / 48 h n'avaient pas d'écran (une seule bannière à la fois) ; rien sur les jeux à proximité. | `avant-accueil-390.png` | Refonte en **5 rubriques**, une par écran, barre d'onglets en bas : Mes lots · Expirent · Près de moi · Alertes · Compte. Pastilles de compte sur les onglets. Défilement de page : **0 px** à 390 et 1280 sur les 5 rubriques (mesuré). |
| Majeur | Montrer le QR en caisse : QR 170 px dans la carte, pas de plein écran. | `avant-accueil-390.png` | Un toucher sur le QR l'ouvre en **plein écran** (QR 320 px, code, validité, Fermer / Échap). Depuis l'ouverture de `/moi` : **1 toucher**. `apres-qr-390.png`. |
| Moyen | Aucun lien vers les commerces où l'on peut encore gagner. | — | « Près de moi » : RPC `carte_commerces_publique` (v2 si présente), triée par distance réelle si la géolocalisation est accordée (jamais demandée à l'ouverture, bouton « Me localiser »), bouton « Y aller » (itinéraire Google Maps), lien vers la carte. Coup de pouce « Un jeu est en cours à X m » si un commerce est à moins de 2 km. |
| Moyen | Pas d'engagement « gaming » dans le profil. | — | Compteurs réels : lots gagnés, commerces visités (stations des tickets + commerces des lots), tickets. Badges sur données réelles : Premier lot, 3 commerces, Généreux (lot offert), 10 tickets, Lot utilisé ; non obtenus en grisé. Aucune donnée inventée. |
| Mineur | Ouvrir « Alertes » marque les notifications comme vues ; un toucher sur une alerte ramène au lot. | `marquer_notifications_vues` | Fait. En mode démo, l'écriture est neutralisée (0 non-GET). |
| Mineur | `/lot.html` affiche « valable jusqu'au 25 octobre 2026 » dans les conditions NDS des partenaires, en contradiction avec l'exception NDS. | `public/lot.html` l. 280-291 | **Non modifié** (page de validation pro, hors périmètre) : à trancher par Romain (conditions des partenaires ou date à retirer). |
| Info | « En faire profiter un ami » : inchangé et fonctionnel (prénom + téléphone ou e-mail, RPC `offrir_ticket_ami_contact`, WhatsApp si non inscrit). | `MesLots.tsx` | Reste sur chaque carte de lot. |
| Info | Aucune notification en base pour l'instant (`joueur_notifications` : 0 ligne) : la fonction de rappel n'est pas planifiée. | requête du 17/11 | Écran vide explicite : « On te prévient ici avant qu'un lot expire. » |

## Modèle et sécurité

- `maj_consentement` fait confiance à `p_joueur_id`, comme `mes_notifications` / `mes_cadeaux` déjà en place
  (identifiant uuid non devinable, connu du seul téléphone du participant). Elle ne touche que `optin` / `optin_date`.
- Aucune suppression, aucun DROP.

## Vérifications

- `npx tsc --noEmit` : OK. `npm run build` : `✓ Compiled successfully`.
- Playwright : 5 rubriques + QR plein écran, 390 et 1280, `scrollHeight == innerHeight`, rubrique interne sans défilement (621/621 px).
- 0 requête POST / PATCH / DELETE vers supabase.co en mode démo.
