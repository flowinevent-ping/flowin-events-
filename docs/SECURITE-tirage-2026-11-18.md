# Sécurité du tirage au sort — 18/11/2026

Pour Romain. Constat de départ : `docs/audit-2026-11-17/TEST-TIRAGE-2026-11-18.md` (constats A et E).
Fichier SQL à appliquer : **`sql/2026-11-18-tirage-correctifs.sql`** (NON appliqué à ce jour).

## 1. Le risque
Six fonctions d'écriture sont exécutables par `anon`, sans aucun contrôle (droits lus en prod le 18/11) :
`attribuer_gain_joueur`, `tirage_super_event`, `annuler_tirage`, `marquer_notifie`, `tirage_lot`, `tirage_soir`.
La clé publique est dans chaque page. N'importe qui peut donc :
- se créer un **billet gagnant valable** (`attribuer_gain_joueur`, prouvé par l'audit : id 270, statut actif, jeton de retrait) ;
- lancer un tirage NDS à la place de l'équipe (`tirage_soir`, `tirage_lot`, `tirage_super_event`) ;
- **annuler un gagnant** non confirmé (`annuler_tirage`) ou le confirmer / dé-confirmer (`marquer_notifie`).

## 2. Appelants : avant / après
| Appelant | Fonction(s) | Contexte | Avant | Après (ce commit) |
|---|---|---|---|---|
| `admin/public/tirage-nds.html` | tirage_soir, tirage_lot, marquer_notifie | SA (outil Flowin) | jeton SA déjà envoyé | inchangé ; refus 401/403 → message « reconnectez-vous » au lieu d'un code HTTP |
| `admin/public/dashboard.html` + miroir `static/` | marquer_notifie (`gwMarquerNotifie`, `ptRpc`) | SA | **clé publique** en `Authorization` | jeton SA (`FLOWIN_AUTH`) ; 401/403 → toast « reconnectez-vous » |
| `admin/public/dashboard.html` (reset v30 au chargement) | toutes | SA | **effaçait `flowin_admin_session` à chaque chargement** : toutes les requêtes du dashboard partaient en anon | la session admin est conservée |
| `admin/lib/nds.ts` (`confirmerGagnant`, `annulerEtRetirer`) | marquer_notifie, annuler_tirage, tirage_lot | SA (`/dashboard/nds-lots`, PartenaireDrawer) | client supabase (jeton SA injecté sur /dashboard) | idem + sans session : message de connexion, aucun appel |
| `admin/lib/dashboard.ts` (`enregistrerTirage`) via `GagnantsClient` | attribuer_gain_joueur | pro (session supabase-js) | partait en anon si le pro n'était pas connecté | sans session : « Connexion requise… » affiché, aucun appel |
| `admin/components/operations/BlocsOperations.tsx` | marquer_notifie | pro (peut être en lien `?pro=` sans connexion) ou SA | idem | sans session : alerte « Connexion requise… », aucun appel |
| `admin/components/dashboard/TirageSuperEvent.tsx` | tirage_super_event | SA | jeton SA injecté | idem + message si pas de session ; compteur « déjà tirés » lit `lots.nom` ET `lots.titre` |
| SQL `appliquer_regle_gain` (gains immédiats joueurs, anon) | attribuer_gain_joueur | joueur anonyme | appel direct | SECURITY DEFINER (propriétaire postgres, vérifié) ; appelle désormais `_attribuer_gain_interne` (non exposé) : **les joueurs gardent leurs gains immédiats** |

Aide commune : `sessionPourTirage()` et `MESSAGE_CONNEXION_TIRAGE` dans `admin/lib/supabase.ts`
(vrai en démo, avec une session SA sur /dashboard, ou avec une session pro).
**Avant application du SQL, tout continue de marcher** : les utilisateurs connectés envoient leur jeton, accepté
aujourd'hui comme demain ; seul l'appel sans aucune session est désormais arrêté côté écran avec un message clair.

## 3. Ce que fait le SQL (une transaction, idempotent)
0. `_tirage_un_gain_par_joueur(contexte)` — **paramètre à trancher** : `tirage` = true (un gain par joueur et par
   animation au tirage), `gain_immediat` = **false** (en attente de ta décision ; la règle existante « un gain par jour »
   des gains immédiats reste).
1. `_tirage_acces(event, super_event, partenaire)` : vrai si `est_super_admin()`, ou pro propriétaire
   (`pros.auth_id = auth.uid()` et `events.pro_id` / `super_events.pro_id` / `pros.partenaire_id`), ou appel interne
   (éditeur SQL, pg_cron, service_role).
2. `revoke execute … from public, anon` sur les six ; `grant … to authenticated, service_role`.
3. `_attribuer_gain_interne` (non exposé) : verrou par animation, quantité du lot respectée (nom ou titre), règle
   « un gain » selon le paramètre. `attribuer_gain_joueur` = contrôle d'accès + appel du cœur. `appliquer_regle_gain`
   recréée à l'identique sauf l'appel final.
4. `tirage_super_event` : contrôle d'accès, verrou par lot, nom du lot = `lots.nom` d'abord (les anciens gagnants
   enregistrés sous `titre` restent comptés).
5. `annuler_tirage`, `marquer_notifie` : contrôle sur l'animation / super event / partenaire du tirage.
6. `tirage_lot`, `tirage_soir` : corps NDS **non réécrit** — renommés `_tirage_lot_interne` / `_tirage_soir_interne`
   (non exposés) avec une enveloppe contrôlée de même signature. `tirage_soir` = super admin seulement.
7. Requête de contrôle des droits ; section ROLLBACK commentée en fin de fichier.

Accès refusé = erreur `42501` « Accès refusé : connectez-vous… » (PostgREST renvoie 401/403).

## 4. Comment appliquer
1. Relire le fichier, trancher le paramètre de la section 0 (laisser tel quel = prudence).
2. Supabase → SQL Editor (projet `ywcqtupgoxfzkddqkztk`) → coller **tout** `sql/2026-11-18-tirage-correctifs.sql` → Run.
   (Le script commence par `begin;` et finit par `commit;` : tout ou rien.)
3. Lancer la requête de la section 7 : `anon` ne doit plus figurer sur les six fonctions ni sur les `_…interne`,
   et rester sur `appliquer_regle_gain`.

## 5. Tests réalisés (avant application, sans écrire en prod)
- **SQL** : rejoué deux fois de suite (idempotence) sur un PostgreSQL 16 local avec un schéma minimal reproduisant les
  tables et les définitions prod lues le 18/11. Résultats : anon → `permission denied` sur les six ; anon
  `appliquer_regle_gain` → `gagne: true` (deux gains immédiats du même joueur sur deux jours : autorisés, paramètre off) ;
  pro propriétaire → tirage OK, 2ᵉ gain du même joueur au tirage → 0 ligne ; pro non propriétaire → `Accès refusé` sur
  attribuer / annuler / marquer ; pro → `tirage_soir` refusé, SA → OK ; quantité 2 → 3ᵉ gagnant refusé ;
  `authenticated` → `_attribuer_gain_interne` refusé ; service_role → OK.
- **Navigateur** (Playwright, build de prod local, port 4317, toute requête non-GET vers supabase.co interceptée, aucune
  n'est partie) : `/pro/tirage`, `/pro/super`, `/pro/lots` en `?demo=1` → 200, aucune erreur JS.
  En-têtes interceptés : `dashboard.html` `marquer_notifie` ×2 → `Bearer <jeton SA>` (avant : clé publique) ;
  `tirage-nds.html` `tirage_soir`, `tirage_lot`, `marquer_notifie` → `Bearer <jeton SA>` ; `/dashboard/nds-lots` →
  jeton SA ; `/pro/tirage` avec session pro → `Bearer <jeton pro>`.
- Acorn `ecmaVersion 2020` : 0 erreur (dashboard.html, miroir, tirage-nds.html) ; MD5 miroir identique ; `tsc` OK ;
  `next build` « Compiled successfully ».

## 6. Plan de test APRÈS application
1. Anonyme (terminal) : `curl -X POST …/rest/v1/rpc/attribuer_gain_joueur -H "apikey: <publique>" -H "Authorization: Bearer <publique>" -d '{…}'` → 401/403.
2. Joueur : jouer une animation à gain immédiat → le gain et le billet apparaissent (appliquer_regle_gain).
3. Pro connecté : Gagnants & tirage → tirer, confirmer → OK ; même joueur une 2ᵉ fois → refus.
4. Pro en lien `?pro=` sans connexion → message « Connexion requise… ».
5. SA : dashboard.html → fiche gagnant → marquer l'envoi ; `/dashboard/nds-lots` → confirmer / re-tirer ;
   super event → tirage ; `tirage-nds.html` → tirage du soir et par lot.
6. En cas de blocage en festival : section ROLLBACK du fichier SQL (rouvre la faille, à n'utiliser qu'en urgence).
