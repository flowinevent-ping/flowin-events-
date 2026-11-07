# Audit TECHNIQUE bout-en-bout — Flowin Events — 07/11/2026

Base : Supabase `ywcqtupgoxfzkddqkztk` (lecture seule sauf données qa+ listées en §9), code `main` @ `c3c88b9e`, serveur dev localhost:3000.
Compléments au premier audit (`/tmp/flowin-audit-2026-11-07/`) : les failles déjà documentées (RLS `pros_anon_write`, IDOR `?pro=`, dashboard SA sans auth) ne sont pas refaites, seulement citées quand elles cassent une chaîne.
Captures : `/tmp/flowin-audit-v2/shots/technique/`.

## 0. Trois constats qui expliquent la plupart des chaînes cassées

1. **La moitié des fichiers `sql/` n'est pas appliquée en prod, alors que le code les appelle déjà.** 11 RPC appelées par le code n'existent pas en base (requête `pg_proc` sur les 72 RPC trouvées dans le code) :
   `changer_jeu_station`, `qr_assurer_defauts` (sql/09) · `stats_qr_evenement`, `joueurs_uniques_par_mois`, `liste_gagnants_publique` (sql/2026-11-01) · `enregistrer_resultats_tirage_super`, `mes_resultats_tirage`, `marquer_resultats_vus` (sql/10) · `joueurs_consentants_par_ids` (sql/05) · `pro_definir_droit` (sql/06) · `souscrire_garantie_animation` (sql/08).
   Tables absentes : `jeux_masters`, `positions_joueurs` (2026-10-31), `qr_jeu_journal` (09), `resultats_tirage` (10), `pros_droits_journal` (06) ; colonnes absentes : `qr_stations.code_court/support/type_qr`, `demandes_rattachement_super_event.pack_souhaite/tarif_souhaite_ht` (13).
   Le code a presque partout un repli « dégradé » silencieux, donc **l'écran ne casse pas, mais la fonction n'existe pas** (voir chaînes 4, 5).
2. **4 edge functions du dépôt ne sont pas déployées** (`list_edge_functions` + `OPTIONS` → 404) : `notify-rappel`, `notify-commande-animation`, `send-resultat-tirage`, `send-push`. Or 4 fonctions SQL et 2 pages publiques les appellent.
3. **Le domaine `flowin.events` n'existe pas** (DNS NXDOMAIN, A et MX). Supabase Auth refuse `qa+tech1@flowin.events` (« Email address is invalid »). Conséquences : aucun compte qa+ ne peut être créé par les vrais parcours d'inscription ; et l'adresse d'identité des commits/contacts `romain@flowin.events` ne reçoit rien.

---

## Chaîne 1 — Le pro s'inscrit → Flowin le sait-il ?

```
/pro/inscription ──redirect──► /pro/premiere-fois (PremiereFois.tsx)
   └ auth.signUp (Supabase Auth, email de confirmation Supabase) 
   └ pros.insert (client anon ou session)         ──► table pros
   └ localStorage flowin_am_prefill ──► /bon-commande-animation.html
         └ commandes_animation.insert ─trigger─► net.http_post notify-commande-animation  ✗ 404 (non déployée)
/dashboard/pros  ◄── lit pros (clé anon)          ✓ le pro apparaît s'il est rafraîchi
Notification Flowin à l'inscription               ✗ aucune (pas de trigger sur pros, pas d'appel d'edge function)
```
- **Prouvé OK** : un insert dans `pros` apparaît dans la liste SA (compteur « Pros » de la barre latérale = table `pros`).
- **Prouvé KO** : aucun trigger sur `pros` (liste `pg_trigger` complète), aucun appel réseau dans `PremiereFois.tsx` / `lib/inscriptionPro.ts`. Flowin n'est prévenu **ni à l'inscription, ni à la commande** : `trg_notify_commande_animation_insert` poste vers `notify-commande-animation` qui renvoie 404. `commandes_animation` = 0 ligne en prod, donc jamais exercé en réel.
- **Prouvé** : `auth.users` n'a reçu **aucun nouveau compte depuis le 05/07/2026** alors que 17 pros existent ; **1 seul pro sur 17 a un `auth_id`** → 16 pros réels ne peuvent pas se connecter à `/pro/connexion` (« Compte connecté mais aucun profil pro associé »).
- Effet de bord prouvé : `pros.insert` passe **sans aucun compte** (le signUp a échoué, l'insert anon a réussi, `pro-qa-tech-1` créé avec `auth_id = null`) — conséquence directe de `pros_anon_write` (P0-1 du 1er audit).

## Chaîne 2 — Le pro demande à rejoindre un super event

```
/pro/rejoindre ─► /pro/nouvelle?type=rejoindre ─► ParcoursCreation.tsx (rejoindre)
/rejoindre[?se=] ─► ParcoursCreation mode visiteur (inscrirePro → signUp)
/rejoindre/[se]  ─► redirect /rejoindre?se=   (RejoindreClient.tsx = code mort)
   └ demandes_rattachement_super_event.insert (offre = pack + message libre)
   └ notification Flowin / organisateur            ✗ aucune (pas de trigger, pas d'email)
/dashboard/demandes-rattachement  ✓ la demande apparaît (capture sa-demandes.png)
   └ Approuver : géocodage navigateur → rpc approuver_demande_rattachement
        → events (station) + lots + partenaires (assurer_fiche_commerce) + super_events.events/pros
   └ Refuser : update statut via client anon
/se/[se] carte  ◄── events.super_event_id + lat/lng
/pro/super       ◄── events du pro (hors gabarit) + demandes non validées
Pro prévenu de la validation/refus                 ✗ aucun email ; seulement visible s'il se reconnecte
```
Test réel (§9) : demande `id=8` (pro `pro-qa-tech-1`, super event gabarit `se-master-superevent`, message « QA message… »).
- **OK prouvé** : la demande apparaît dans `/dashboard/demandes-rattachement` avec message, adresse, lots, diffusion demandée.
- **P0 prouvé — n'importe qui peut approuver sa propre demande** : `approuver_demande_rattachement` est `SECURITY DEFINER`, **sans `est_super_admin()`**, `EXECUTE` accordé à `anon`. Appel anon réel → `{"ok":true,"event_id":"ev-master-superevent-qa-tech-1-dd44","lots":1}` : station, lot et fiche partenaire créés sans aucun Super Admin. `ParcoursCreation.tsx:578-580` l'appelle d'ailleurs lui-même via `supabasePublic`.
- **P0 lié** : `demandes_anon_update` (anon, `USING true`) → n'importe qui peut passer n'importe quelle demande en `refusee`/`validee` ou réécrire ses lots/GPS. `/dashboard/demandes-rattachement/page.tsx:78` en dépend.
- **KO prouvé — station invisible sur la carte** : approbation hors écran SA (ou géocodage en échec) → `lat/lng = null` ; l'écran SA lui-même l'annonce « sans GPS : la station n'apparaîtra pas sur la carte ». Le géocodage n'est fait que dans le navigateur, pas dans la RPC.
- **KO** : la station est créée avec `cfg.qrUrl = /parcours/<module>?ev=…` (format ancien, non permanent) et **aucune ligne `qr_stations`** → pas de QR tracé par support pour une station de super event (`qrs = null`).
- **KO** : aucune notification à Flowin à la demande, aucune au pro à la décision (grep : aucun appel d'edge function / email dans ces fichiers ; aucun trigger sur la table).
- Non conclusif : `/pro/super?pro=pro-qa-tech-1` affiche « Vous ne participez à aucun super event » — attendu ici car j'ai choisi le gabarit master (filtré par `sansGabarit`) ; mais cela révèle que **une demande validée disparaît de la liste du pro** (`.neq('statut','validee')`) et qu'il ne la retrouve que si la station est hors gabarit.
- Incohérence de données : `se-master-superevent.events` (tableau) avait 0 entrée alors que 22 events portent `super_event_id = 'se-master-superevent'` ; la carte `/se/se-master-superevent` affiche « 23 commerces ». Deux sources de vérité (tableau `super_events.events` vs colonne `events.super_event_id`) divergent.

## Chaîne 3 — Admin crée un pro / un super event / intègre un pro

- `/dashboard/wizard-pro` → `upsertPro` (`lib/dashboard.ts:112`, client anon, `upsert onConflict id`). **Ne crée aucun compte Auth ni invitation** → le pro créé par le SA ne peut jamais se connecter (prouvé par la logique de `/pro/connexion/page.tsx:35-41` + 16/17 pros sans `auth_id`). S'il s'inscrit ensuite lui-même, `PremiereFois` crée une **deuxième** fiche (`id` suffixé aléatoire si collision, `PremiereFois.tsx:270`) : doublon pro.
- `/dashboard/wizard-super-event` → redirect `/dashboard/wizard-event?type=super` (ParcoursCreation) → `creerSuperEvent` (`lib/nds.ts:449`) insert `super_events`. Non exécuté (aurait créé un super event visible) ; lecture de code seulement.
- Intégrer un pro : chemin SA = même RPC `approuver_demande_rattachement` (testée ci-dessus) → effets en base prouvés (event + lots + partenaire + tableaux du super event), QR non créé, GPS dépendant du navigateur.
- `/rejoindre/[se]` ancien formulaire (RejoindreClient, mort) faisait `pros.upsert` anon sur `id = 'pro-'+slug(email)` : écrasement d'une fiche existante — code mort aujourd'hui, à supprimer avant qu'on le rebranche.

## Chaîne 4 — Lots, tirage, billet, retrait

```
lots / lots_stock ──► tirage (tirage_soir / tirage_super_event / tirer_et_attribuer_lot) ──► tirages (retrait_token, ticket_code)
  └ email gagnant : send-ticket-gagnant (SA, lib/dashboard.ts:464 + dashboard.html:8194)  ou Gmail pré-rempli (mail-gagnant.js)
  └ billet : /lot.html?t=<token>, /nds/billets-partenaires.html?t=
  └ boutique : verifier_pin_pro (client) puis valider_lot(token) ──► tirages.retire_at, lots_stock.utilise
  └ visible : Pro (GagnantsClient), SA (gagnants)
  └ joueur : /moi ← mes_resultats_tirage ✗ ; /gagnants/[ev] ← liste_gagnants_publique ✗
```
- Données prod : 236 tirages, tous avec `retrait_token`, 189 retirés, 65 notifiés, 47 relances, aucune incohérence `statut='retire'` sans `retire_at`.
- **P0 prouvé (code SQL lu) — le PIN commerçant ne protège rien** : la vérification du PIN est faite **côté client** (`GagnantsClient.tsx:267` puis `:273`, `public/lot.html:465` puis `:443`) par `verifier_pin_pro`, puis `valider_lot(p_token)` est appelée **sans PIN**. `valider_lot` (anon EXECUTE, SECURITY DEFINER) ne contrôle le PIN que s'il est fourni, et le compare au **numéro de billet**, pas au `code_pin` du partenaire. Le gagnant, qui possède son token, peut donc marquer lui-même son lot « retiré » et déstocker. De plus `verifier_pin_pro` renvoie `true` quand le tirage n'a pas de partenaire.
- **KO prouvé** : `/gagnants/<ev>` affiche toujours « Liste des gagnants indisponible » (RPC `liste_gagnants_publique` absente) — capture `gagnants-public.png`.
- **KO (code)** : `lib/masters/tickets.ts` appelle `mes_resultats_tirage` / `marquer_resultats_vus` (absentes) → le joueur ne voit jamais ses résultats de tirage dans son espace ; `TirageSuperEvent.tsx` appelle `enregistrer_resultats_tirage_super` (absente) et `send-resultat-tirage` n'est pas déployée → la chaîne « résultat du tirage par email » de sql/10 n'existe pas en prod.
- **KO** : texte `lot.html` « Code professionnel — Reçu par email lors de votre inscription » : aucun email automatique n'envoie le `code_pin` (seulement des modèles Gmail manuels : `PartenaireDrawer`, `BlocsOperations`, `email-partenaire.html`).
- Non vérifié par exécution : stock décrémenté sur un vrai retrait (aurait modifié un vrai tirage).

## Chaîne 5 — QR codes

- **KO prouvé : les QR permanents `/q/<code>` ne fonctionnent pas en prod.** `app/q/[code]/route.ts:64` lit `qr_stations.code_court` : colonne absente (colonnes réelles : `id,event_id,nom,source_qr,publie,created_at`) → tout code → `/q/indisponible?m=inconnu` (capture `q-code-inconnu.png`). `changer_jeu_station` et `qr_assurer_defauts` absentes → « Changer le jeu » renvoie le message « SQL 09 pas encore appliqué » (`lib/qrTraces.ts:124`). L'audit du 01/11 le disait « à appliquer » : toujours pas fait.
- Stats par QR : `stats_qr_evenement` absente → repli (`lib/qrTraces.ts:166`) ; pour les super events `super_event_track_qr(_quotidien)` existe.
- Les stations créées par approbation n'ont aucune ligne `qr_stations` et un `qrUrl` ancien format (chaîne 2).

## 6. Inventaire des emails

| # | Envoi | Déclencheur | Expéditeur | Destinataire | Auto ? | État prod |
|---|---|---|---|---|---|---|
| 1 | Confirmation inscription / reset mot de passe (Supabase Auth) | `signUp` (PremiereFois, inscriptionPro), `resetPasswordForEmail` (/pro/connexion) | SMTP Supabase par défaut | le pro | auto | Quota épuisé au 1er audit ; aucun nouvel utilisateur depuis le 05/07 ; SMTP perso non vérifiable via MCP |
| 2 | `send-ticket-gagnant` | bouton SA (lib/dashboard.ts:464, dashboard.html:8194) | `NOTIFY_FROM_NAME <NOTIFY_FROM_ADDR>` défaut `onboarding@resend.dev` | gagnant | manuel (clic) | Déployée v3, `verify_jwt=false`, **aucune authentification, destinataire / nom d'expéditeur / reply-to libres → relais d'email ouvert sous le nom Flowin/NDS (P0)**. Texte figé « Nuits du Sud 2026 » pour tout event |
| 3 | `notify-souscription` | trigger `partenaires` AFTER INSERT si tag `nds-landing` | défaut `onboarding@resend.dev` | Flowin (`NOTIFY_TO`, défaut flowinevent@gmail.com) | auto | Déployée. Ne se déclenche que pour la landing NDS |
| 4 | `notify-bon-commande` | trigger `bons_commande` | idem | Flowin + client | auto | Déployée |
| 5 | `notify-commande-animation` | triggers INSERT/UPDATE `commandes_animation`, `admin_renvoyer_documents`, `alerte_commandes_en_attente`, `lib/animationMagasin.ts:124` | idem | Flowin + client (facture PJ) | auto | **Non déployée → 404** |
| 6 | `notify-rappel` | formulaire « être rappelé » `plaquette-super-event.html:860`, `plaquette-animation-magasin.html:1386` | idem | Flowin | auto | **Non déployée → 404 ; les demandes de rappel prospects sont perdues** (fetch sans contrôle d'erreur) |
| 7 | `send-resultat-tirage` | sql/10 (non appliqué) | idem | joueurs | auto | **Non déployée** |
| 8 | `send-push` | `trigger_send_push()` (fonction SQL) | — | — | — | Non déployée ; fonction non attachée à un trigger |
| 9 | `cron-cloture-ligue`, `notify-migration-eleve`, `reset-partenaire-revision`, `generer-ia` | — | — | — | — | Déployées, **absentes du dépôt** (code source non versionné) |
| 10 | Gmail pré-remplis (`mail-gagnant.js gmailUrl`, `mailPartenaireUrl`, `lib/messaging.ts`, CrmPro, DiffusionOperation, ParcoursCreation, crm/[id]) | clic | compte Gmail `flowinevent@gmail.com` (authuser) | gagnant / partenaire / contacts | **manuel** | Fonctionne si la personne est connectée à ce Gmail |
| 11 | `mailto:` (≈30 occurrences) | clic | client mail local | Flowin / contact | manuel | — |

Notifications vers Flowin réellement automatiques et fonctionnelles : **uniquement 3 et 4** (flux NDS de juillet). Aucune pour : inscription pro, demande de rattachement, commande d'animation, demande de rappel.
Clés : la valeur/présence de `RESEND_API_KEY` et `NOTIFY_FROM*` n'est pas lisible via MCP. Expéditeur par défaut `onboarding@resend.dev` : chez Resend il n'envoie **qu'à l'adresse du compte Resend** ; si `NOTIFY_FROM_ADDR` n'est pas réglé, tous les emails aux gagnants/clients échouent. Logs : 0 appel d'edge function sur 24 h, `net._http_response` vide → aucune preuve d'envoi récent dans un sens ou dans l'autre.

## 7. Inventaire des fonctions mortes

- **Confirmé** : `app/parcours/{quiz,quizsolo,spin,tombola,vote}/*Client.tsx` — chaque `page.tsx` appelle `versMasterSiBesoin` qui redirige vers `/jouer` sauf `cfg.masterOff === true` ; **0 event sur 65** a ce flag. Atteignables seulement sans `?ev=` (`redirection.ts:15`). Composants partagés associés idem.
- `app/rejoindre/[se]/RejoindreClient.tsx` — plus rendu (la page redirige, commentaire l'avoue).
- Jamais importés : `components/ui/FormCRM.tsx`, `components/ui/PartenairesScreen.tsx`, `components/ui/TicketScreen.tsx`, `lib/partenaires.ts`, `lib/actions.ts`, `lib/landing.ts`.
- `/dashboard/wizard-super-event/ancien` (assistant gardé « le temps de la transition »).
- **Fonctions présentes à l'écran mais mortes en prod** (RPC/tables absentes) : changer de jeu d'un QR, QR permanents, stats par QR (repli), liste publique des gagnants, résultats de tirage côté joueur, enregistrement résultats tirage super event, compteur mensuel pro (`joueurs_uniques_par_mois` → `CompteurMensuel` affiche 0, capture `pro-accueil-qa.png`), droits pro (`pro_definir_droit`), garantie animation (`souscrire_garantie_animation` dans bon-commande-animation.html), contacts consentants (`joueurs_consentants_par_ids` dans Data/DiffusionOperation), masters SA (`jeux_masters`, repli sur valeurs du code), positions joueurs (`positions_joueurs.insert` dans JouerClient.tsx:250 échoue).
- Edge functions appelées mais absentes : 4 (§6).

## 8. Priorités

### P0
1. **Auto-approbation anonyme des rattachements** — `approuver_demande_rattachement` (SQL) : ajouter `if not est_super_admin() then return …'refuse'` + `revoke execute … from anon` ; supprimer l'appel `supabasePublic.rpc` de `ParcoursCreation.tsx:580` (passer par la session SA). Retirer `demandes_anon_update` et faire le refus via une RPC gardée.
2. **Retrait de lot sans PIN** — `valider_lot` : rendre `p_pin` obligatoire et le comparer à `partenaires.code_pin` du `partenaire_du_tirage` côté serveur (fusionner `verifier_pin_pro` dedans) ; adapter `GagnantsClient.tsx:273` et `lot.html:443` pour passer le PIN.
3. **Relais email ouvert `send-ticket-gagnant`** — `verify_jwt=false`, aucun contrôle : exiger un JWT Super Admin (ou ne prendre que `retrait_token` et lire destinataire/lot en base avec la service role), fixer `from_name`/`reply_to` côté serveur.
4. **Migrations du dépôt non appliquées alors que le code est en prod** — sql/05, 06, 08, 09, 10, 13, 2026-10-31, 2026-11-01 : décider fichier par fichier, appliquer (via `apply_migration`, une fois) ou retirer les écrans. Tant que 09 n'est pas appliqué, aucun QR « permanent » ne doit être imprimé.
5. **Aucune notification Flowin sur les flux d'acquisition + 4 edge functions non déployées** — déployer `notify-commande-animation`, `notify-rappel` (formulaires de rappel perdus aujourd'hui), `send-resultat-tirage` ; ajouter un trigger `AFTER INSERT` sur `pros` et sur `demandes_rattachement_super_event` (→ email Flowin), et un email au pro sur changement de `statut`. Vérifier `NOTIFY_FROM_ADDR` sur un domaine vérifié Resend.

### P1
- Pros sans compte : 16/17 pros sans `auth_id`, wizard-pro n'invite pas (`lib/dashboard.ts:112`) → ajouter une invitation (`auth.admin.inviteUserByEmail` via edge function SA) et un rattachement par email à la première inscription pour éviter les doublons (`PremiereFois.tsx:270`).
- Géocodage dans la RPC ou refus d'approuver sans GPS (`demandes-rattachement/page.tsx:52`), sinon station absente de la carte.
- Station de super event sans `qr_stations` et `qrUrl` ancien format (`approuver_demande_rattachement`) → appeler `qr_assurer_defauts` après application de sql/09.
- Domaine `flowin.events` inexistant : enregistrer le domaine ou corriger l'identité/les docs ; prévoir une adresse de test valide pour la QA.
- Deux sources pour l'appartenance au super event (`super_events.events[]` vs `events.super_event_id`) divergentes (gabarit : 0 vs 22).
- 4 edge functions déployées absentes du dépôt (`cron-cloture-ligue`, `notify-migration-eleve`, `reset-partenaire-revision`, `generer-ia`) : récupérer leur source (`get_edge_function`) et versionner.
- `/pro/super` masque les demandes validées : si la station n'est pas listée (gabarit, erreur), le pro ne voit plus rien.

### P2
- Texte `lot.html` « Code professionnel reçu par email » faux (aucun envoi automatique du PIN).
- Supprimer le code mort listé en §7 (ou en-tête explicite + Pattern N dans `docs/patterns-bugs-connus.md`).
- `send-ticket-gagnant` : texte « Nuits du Sud » et « plus de 600 joueurs » figés pour tout event.
- `fetch` vers `notify-rappel` sans gestion d'erreur dans les plaquettes : afficher un échec et proposer un mailto.

## 9. Données qa+ créées (à nettoyer)

Aucun compte Auth créé (signUp refusé : domaine invalide). Aucun email envoyé (le trigger `notify-souscription` ne s'est pas déclenché : condition tag `nds-landing`).

| Table | id | Note |
|---|---|---|
| `pros` | `pro-qa-tech-1` | nom « QA Tech 1 », email qa+tech1@flowin.events, `auth_id` null, créé en anon |
| `demandes_rattachement_super_event` | `8` | statut `validee`, event_id rempli |
| `events` | `ev-master-superevent-qa-tech-1-dd44` | station créée par la RPC (super_event `se-master-superevent`, sans GPS) |
| `lots` | `lot-ev-master-superevent-qa-tech-1-dd44-1` | « QA lot » |
| `partenaires` | `pt-qa-tech-1` | créé par `assurer_fiche_commerce` |
| `super_events` `se-master-superevent` | colonnes `events[]` et `pros[]` | `array_remove` de `ev-master-superevent-qa-tech-1-dd44` et `pro-qa-tech-1` |

Nettoyage proposé (dans l'ordre) : `update super_events set events=array_remove(events,'ev-master-superevent-qa-tech-1-dd44'), pros=array_remove(pros,'pro-qa-tech-1') where id='se-master-superevent'` ; `delete from lots where event_id='ev-master-superevent-qa-tech-1-dd44'` ; `delete from events where id='ev-master-superevent-qa-tech-1-dd44'` ; `delete from demandes_rattachement_super_event where id=8` ; `delete from partenaires where id='pt-qa-tech-1'` ; `delete from pros where id='pro-qa-tech-1'`. Vérifier avant si `trg_event_lier_pro` a écrit ailleurs (non vérifié).

## 10. Non vérifié

- Présence/valeur des secrets Resend (non exposés par le MCP) et succès réel d'un envoi : aucun envoi déclenché volontairement (quota, consigne).
- Parcours d'inscription complet en navigateur (bloqué par le domaine de test invalide) ; création de super event et tirage réel (auraient créé des données visibles publiquement ou modifié de vrais tirages).
- Décrément effectif du stock sur un retrait réel ; affichage du statut « retiré » côté Pro/SA après validation (logique lue, non exécutée).
- Configuration SMTP personnalisée de Supabase Auth.
- Carte SA (`/dashboard/nds-carte`) pour la station QA.
