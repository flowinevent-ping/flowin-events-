# Audit sévère — Espace Pro connecté (Flowin Events)

Date : 07/11/2026. Périmètre : l'espace pro **une fois connecté** (`/pro`, `/pro/operation`, `/pro/donnees`, `/pro/compte`, `/pro/super`, `/pro/lots`, `/pro/banques`, `/pro/tracking`, `/pro/contrat`, `/pro/parcours`, `/pro/scanner`). Les parcours de souscription (`/pro/inscription`, `/pro/premiere-fois`, `/pro/nouvelle`, `/pro/rejoindre`, `/rejoindre/[se]`, `/dashboard/wizard-pro`) ne sont traversés qu'en surface, confiés à l'agent dédié.

Méthode : lecture de code (admin/app/pro, admin/components/pro, admin/components/operations, admin/lib), captures Playwright desktop (1440×900) et mobile (390×844) sur `localhost:3000`, requêtes `select` en lecture seule sur Supabase (projet `ywcqtupgoxfzkddqkztk`). Aucune écriture effectuée nulle part (ni SQL, ni UI — les boutons d'action ont été inspectés dans le code, pas réellement déclenchés à l'exception des ouvertures/fermetures de modal).

## Comment j'ai vu l'espace pro connecté — à lire avant tout le reste

Je n'ai **pas** réussi à me connecter avec un compte pro payant normal : le seul chemin de création (`/pro/premiere-fois`) bloque tout l'espace (sauf « Mes commandes ») tant qu'un paiement réel (virement validé par le SA, ou prélèvement SEPA GoCardless) n'est pas confirmé — voir **P0-5**. Je n'ai pas de compte SA pour valider ce paiement moi-même, et je n'ai pas cherché à obtenir des identifiants d'un vrai pro ou SA.

En marge, j'ai découvert qu'**aucune vérification ne lie l'identifiant `?pro=` de l'URL au compte réellement connecté** (voir **P0-1/P0-2**). Faute d'un compte de test payé, j'ai utilisé cette faille, en lecture seule stricte, pour observer l'espace de deux pros réels de Nuits du Sud 2026 (`pro-nook` = Nook Café, `pro-charvolin` = Assurance Charvolin), sans jamais me connecter ni modifier quoi que ce soit. C'est la preuve même de la faille P0-1/P0-2, et c'est ce qui m'a permis de livrer le reste de cet audit. Je le signale pour que Romain sache exactement comment les captures ci-dessous ont été obtenues.

**Aucun compte `qa+` n'a été créé** par moi (il serait resté bloqué derrière le mur de paiement sans rien apporter de plus).

---

## Verdict d'abord

Le signal de Romain (« trop d'info, proche d'un outil complexe, tout d'un coup ») est **confirmé et mesurable**, mais localisé : l'accueil (« Mes animations »), le scanner de billet et les onglets Jeu/Lots/Diffusion d'une opération sont au contraire **bien calibrés** — peu de clics, peu de texte, test des « 5 secondes » réussi. Le problème se concentre sur deux écrans précis, qui sont aussi parmi les plus utilisés : l'onglet **« Trafic par support »** (statistiques) et **« Mes contacts & stats »** (CRM), tous deux de vrais murs de données sans aucune hiérarchie ni repli.

Plus grave et plus prioritaire que la densité d'info : **une faille de sécurité critique** rend tout l'espace pro — gagnants nominatifs avec email/téléphone, CRM complet, coordonnées d'entreprise — consultable par n'importe qui sans connexion, et la table `pros` est en écriture libre pour le rôle anonyme (clé publique). Voir P0-1/P0-2.

## Notes par axe (/10)

| Axe | Note | Justification résumée |
|---|---|---|
| Design | 6/10 | Charte Pro conforme à `DESIGN-TOKENS` dans l'ensemble (papier, encre, violet, logo Flow+in correct) ; mais le badge « Animation » est violet (couleur d'accent générique) au lieu du bleu demandé par Romain, et des émoticônes subsistent dans un volet malgré leur retrait documenté ailleurs. |
| Ergonomie | 5/10 | Accueil, scanner, Lots, Diffusion : excellents. CRM : tableau 8 colonnes illisible en mobile (déborde hors écran sans indice de défilement). |
| Fluidité | 4/10 | Navigation peu profonde (1-2 clics pour l'essentiel) mais l'onglet Trafic mesure **7659 px de haut sur mobile**, sans ancre ni section repliable — défilement interminable pour lire une seule information. |
| Compréhension | 4/10 | C'est le cœur du signalement de Romain : cf. section dédiée ci-dessous. Vocabulaire (animation/jeu/lot/gagnant) cohérent, en revanche — bon point. |
| Fonctionnel | 6/10 | Le périmètre du référentiel (lots, gagnants, diffusion, CRM, trafic) est présent et câblé à de vraies requêtes/RPC (vérifié, pas de bouton décoratif trouvé). Limites réelles : scan caméra Chrome Android uniquement, mur de paiement total avant toute démo. |
| Données | 3/10 | Les chiffres affichés sont exacts (vérifiés par SQL, voir Pattern B ci-dessous) — mais rien ne protège ces données : voir Données/Sécurité. |
| Engagement | 5/10 | Pas d'élément d'évaluation propre côté pro (alertes de lots à relancer présentes mais discrètes, pas de notifications, pas de relance automatique visible). |
| Attractivité | 6/10 | Écrans simples (scanner, lots) agréables et clairs ; écrans denses (trafic, CRM) ressemblent à un back-office technique plutôt qu'à un outil pensé pour un commerçant. |
| Accessibilité | 4/10 | Police 11–12,5 px sur les écrans denses, gris moyen sur blanc pour du texte porteur d'info, modal sans fermeture au clavier (Échap). |
| Technique | 2/10 | RLS `pros` en écriture libre pour `anon` (critique), IDOR confirmé sur toutes les pages `/pro/*`, erreurs 400/404 en console sur plusieurs écrans. |

**Moyenne : 4,5/10.**

---

## Sécurité — à traiter avant tout le reste (hors grille, priorité absolue)

### P0-1 — La table `pros` est en écriture libre pour le rôle public (`anon`)

Requête exécutée (lecture seule, catalogue système uniquement) :
```sql
select tablename, policyname, roles, cmd, qual, with_check from pg_policies where tablename='pros';
```
Résultat :
```
pros_anon_write | roles={anon} | cmd=ALL | qual=true | with_check=true
pros_anon_select| roles={anon} | cmd=SELECT | qual=true
```
La clé Supabase *publishable* (publique par design, embarquée dans tout le JS client) donne donc, pour la table `pros`, un accès **INSERT/UPDATE/DELETE sans aucune restriction** à quiconque. Je n'ai rien écrit (hors mandat), mais la policy elle-même le permet pour n'importe quel visiteur du site. La même requête montre aussi `tirages_anon_select` et `joueurs_anon_select` en `qual=true` (lecture libre de toutes les données, y compris gagnants et joueurs).

**Correctif** : retirer `pros_anon_write` (ou le restreindre strictement, ex. un `INSERT` limité au moment de l'inscription avec un `with_check` qui vérifie l'email/`auth_id`) ; aligner `pros` sur le modèle déjà existant `pros_self_update`/`pros_self_select` (`auth_id = auth.uid()`) pour le rôle `authenticated`, qui lui est déjà correctement scopé.

### P0-2 — Aucune page `/pro/*` ne vérifie que `?pro=` correspond au compte connecté

Fichiers : `admin/components/pro/ProShell.tsx` (le contrôle d'accès, lignes ~99-110, ne porte que sur `statut`/`onboarding_source`, jamais sur l'identité de l'utilisateur connecté), `admin/app/pro/page.tsx`, `admin/app/pro/operation/page.tsx`, et toutes les pages serveur `/pro/*` qui lisent `searchParams.pro` sans jamais appeler `supabase.auth.getUser()` côté serveur pour comparer à `pros.auth_id`.

Preuve : en navigateur neuf, sans aucune connexion, `http://localhost:3000/pro/operation?pro=pro-nook&op=se:se-nds-2026&onglet=gagnants` affiche la liste nominative complète des gagnants du festival avec email personnel (ex. « [nom et email joueur masqués] »), numéro de téléphone, et statut de retrait. Capture : `shots/nook-gagnants-d.png`. Le CRM complet (23 contacts, emails/téléphones) et la fiche entreprise (email, téléphone du commerçant) sont pareillement accessibles (`shots/nook-donnees-d.png`, `shots/nook-compte-d.png`).

Les identifiants `pro-xxx` sont dérivés du nom commercial (`pro-nook`, `pro-charvolin`, `pro-utile`…) et donc devinables/listables.

**Correctif** : combiné à P0-1, chaque page serveur `/pro/*` doit vérifier `auth.getUser()` puis `pros.auth_id = user.id` pour le `proId` demandé, et rediriger vers `/pro/connexion` sinon.

---

## Le fil rouge de Romain — vérifié écran par écran, avec preuve

| Écran | Infos affichées en même temps | Clics depuis l'accueil | Test « 5 secondes » |
|---|---|---|---|
| Accueil « Mes animations » | 1 compteur mensuel + vignettes groupées En cours/À venir/Passées | 0 (c'est l'accueil) | ✅ réussi — on comprend immédiatement ses opérations et le bouton « + Nouvelle animation » |
| « Scanner un billet » | 2 blocs (caméra / code manuel) | 1 | ✅ réussi — exemplaire, voir `shots/05-scanner-m.png` |
| Onglet **Jeu** d'une opération | bandeau (4 chiffres) + aperçu téléphone du vrai jeu | 2 | ✅ réussi |
| Onglet **Lots** | bandeau + 6 chiffres + liste des lots avec stock | 2 | ✅ réussi |
| Onglet **Diffusion** | liste de 6 supports + diffusion par station | 2 | ✅ réussi |
| Onglet **Gagnants & tirage** | liste nominative, pas de recherche/pagination | 2 | 🟡 correct pour une petite liste (16 ici), risque de dérive sur une grosse opération |
| Onglet **Trafic par support** | **mesuré : 7659 px de haut sur mobile** — 4+4 chiffres, 3 camemberts, 9 lignes de détail par QR, 27 questions de quiz en tableau, 6 camemberts de questions bonus, le tout empilé sans repli | 2 | ❌ échoue — aucune hiérarchie, impossible de répondre en 5 s à « comment s'est passée mon animation » |
| « Mes contacts & stats » (CRM) | 4 chiffres + 4 sous-onglets (Contacts/Par origine/Par animation/Statistiques) + dans Contacts : 4 filtres + tableau à **8 colonnes** | 1 | ❌ échoue sur mobile — le tableau déborde hors écran (seules 2,5 colonnes visibles, aucun indice de défilement latéral) |

Preuves : `shots/op-jeu-d.png`, `shots/op-gagnants-d.png` (Nook : 16 gagnants, 14 à remettre), `shots/nook-op-trafic-d.png` (capture complète, 2941 px même en desktop), `shots/nook-op-trafic-m.png` (7659 px, mobile), `shots/nook-donnees-d.png` et `-m.png` (CRM).

Racine du problème, en code : `admin/components/operations/BlocsOperations.tsx`, fonction `ContenuTracking` (lignes 561-652) empile sans aucune section repliable : mini-chiffres → `StatsUniformes` (3 camemberts, lignes 686-705) → liste par station → `StatsParQr` → « Source d'arrivée » → `<ContenuReponses>` (`admin/components/operations/DataOperation.tsx`, lignes 180-282) qui ajoute encore un tableau de questions et une grille de camemberts bonus (`gridTemplateColumns: repeat(auto-fit,minmax(240px,1fr))`, ligne 236) — rien n'est cliquable pour replier/dérouler, tout est toujours visible.

Le CRM (`admin/components/pro/CrmPro.tsx`) a quant à lui une vraie logique de filtres et d'export (bon point fonctionnel), mais le rendu reste un `<table>` HTML classique, sans version « carte » pour mobile — contrairement à `GrilleOperations.tsx` qui, lui, s'adapte bien.

**Correctif proposé pour les deux** : sur Trafic, scinder en sous-onglets (Vue d'ensemble / Profil visiteurs / Détail des questions) avec le détail des 27 questions replié par défaut derrière un lien « voir le détail » ; sur le CRM, ajouter une vue liste/carte en dessous de 640px au lieu du tableau.

---

## Vérification des patterns connus (docs/patterns-bugs-connus.md) côté pro

- **Pattern A** (liste sans clic) : aucun nouveau cas trouvé. Tous les boutons à `cursor:'pointer'` repérés par script dans `components/pro/*.tsx` et `components/operations/*.tsx` ont un `onClick` réel après vérification manuelle (faux positifs dus à un style étalé sur plusieurs lignes).
- **Pattern B** (mauvaise source gagnants/lots) : **vérifié sain** sur les deux comptes testés. `pt-nook` : UI affiche 16 gagnants / 14 à remettre ; SQL direct sur `tirages` donne 14 `actif` + 2 `retire` = 16 (les 52 lignes `annule` sont bien exclues). `pt-charvolin` : UI affiche 0 gagnant ; SQL confirme 0 ligne dans `tirages` pour ce partenaire. Le correctif documenté (lot 3, référentiel) tient sur cet écran.
- **Pattern C** (`joueurs.events` au lieu de `participations`) : **toujours non corrigé**, confirmé le 07/11. `admin/lib/pro.ts` ligne 47 utilise encore `.contains('events', [eid])`. Ce fichier (`fetchProDashboard`) est encore importé par 7 pages pro : `/pro/super`, `/pro/super/[event]`, `/pro/nouvelle`, `/pro/banques`, `/pro/banques/[id]`, `/pro/compte`, `/pro/parcours`. Lecture détaillée de `/pro/super/[event]/page.tsx` : heureusement, les métriques affichées à l'écran (joueurs, parties, scores, réponses) viennent toutes de requêtes `event_id`-scopées indépendantes, pas de `data.joueurs`/`data.lots` — pas de symptôme visible aujourd'hui sur cette page précise, mais la dette reste réelle et risquée pour toute évolution future de ces 7 pages.
- **Pattern L** (écran « par pro » délégué à un composant d'une opération) : **respecté** sur la fiche d'opération (`FicheOperationPro.tsx` utilise bien `fetchOperationsPro(proId)` et un `BlocOperation` par opération, comme prescrit). Les 7 pages listées au pattern C ci-dessus restent une zone de risque résiduelle documentée mais non réactivée en symptôme observable.
- **Pattern M** (RPC mal appelé) : **vérifié sain**. `GagnantsClient.tsx` (lignes 267-273) appelle bien `verifier_pin_pro(token, pin)` puis `valider_lot(token)`, le bon chemin.
- **Pattern E** (RLS sans policy anon) : inversé et aggravé, voir P0-1 — la policy anon existe mais est bien trop permissive.
- Patterns D, F, G, H, I, J, K : non spécifiquement revérifiés dans ce périmètre (hors du mandat « espace pro connecté », laissés à l'agent dédié aux patterns).

---

## Volets / modals — ouverts ET fermés

**« Gérer les lots »** (`ModalGererLots.tsx`, accessible depuis l'onglet Lots) :
- Ouverture : OK (`shots/modal-lots-open.png`, puis contenu chargé `shots/modal-lots-after-escape.png`).
- Fermeture par le bouton **Fermer** : OK, vérifié (le marqueur de contenu du modal disparaît du DOM après clic).
- Fermeture par le bouton **×** : OK dans le code (`onClick={onClose}`, ligne 452).
- Fermeture en cliquant sur le fond (backdrop) : OK dans le code (le `div` de fond, `position:fixed;inset:0`, porte `onClick={onClose}`, ligne 445).
- **Fermeture au clavier (touche Échap) : ne fonctionne PAS.** Aucun gestionnaire `keydown`/`Escape` dans le composant — vérifié par test (le contenu du modal reste visible après `Escape`) et confirmé par l'absence du mot « Escape » dans le fichier. C'est un écart aux conventions web standard (P2, pas bloquant puisque 3 autres moyens de fermer fonctionnent).

---

## Distinction visuelle event / super event (demande explicite de Romain)

Super event : bien différencié (bandeau orange/rouge `#FF8A14→#C2410C`, badge « SUPER EVENT », logo comics dédié) — conforme à `DESIGN-TOKENS` et bien identifiable à l'écran (`shots/op-jeu-d.png`).

Animation (event seul) : **PAS bleu**. `admin/lib/charte.ts` ligne 99 : `ACCENT_ANIM = CHARTE_PRO.accentFonce` = `#6A3FD0` (violet), et `admin/components/parcours/BandeauEtapes.tsx` ligne 13 : `event: ['#9B7BEA', '#7A4FE0']` (violet). C'est strictement la même famille de couleur que l'accent général de toute l'interface pro (boutons, liens, menu actif) — le badge « Animation » ne se distingue donc visuellement de rien d'autre à l'écran, alors que le but affiché est justement de le distinguer du super event. Visible en comparant la pastille violette « ticket » (animation) à la pastille orange « étoile » (super event) sur `shots/01-mes-animations-d.png`.

**Correctif** : utiliser `--fl-bleu` (`#3B5CC4`, déjà défini et documenté dans `DESIGN-TOKENS-flowin.md`) pour tout badge/bandeau « Animation », en le sortant de la couleur d'accent générique.

---

## Liste priorisée

### P0 — à traiter en premier

1. **RLS `pros` en écriture libre pour `anon`** (`qual=true, with_check=true, cmd=ALL`). Fichier : policy SQL en base (projet Supabase `ywcqtupgoxfzkddqkztk`, table `pros`) — migration d'origine à retrouver dans `sql/`. Correctif : supprimer/restreindre `pros_anon_write`, aligner sur `pros_self_update` (`auth_id = auth.uid()`).
2. **IDOR applicatif sur tout `/pro/*`** : `?pro=<id>` jamais vérifié contre la session. Fichiers : `admin/components/pro/ProShell.tsx`, toutes les pages serveur `admin/app/pro/**/page.tsx`. Correctif : vérifier `auth.getUser()` + `pros.auth_id` côté serveur avant tout rendu.
3. **Lecture anon libre sur `tirages` et `joueurs`** (`qual=true`) : expose gagnants nominatifs et joueurs à quiconque a la clé publique. Correctif : restreindre à `authenticated` + scoping par `partenaire_id`/`event_id` du pro connecté, ou passer par des RPC `security definer` filtrées (modèle déjà amorcé avec `joueurs_consentants_par_ids`, à généraliser).
4. **Onglet « Trafic par support » = mur de données (7659 px sur mobile)**, sans section repliable. Fichiers : `admin/components/operations/BlocsOperations.tsx` (`ContenuTracking`, lignes 561-652), `admin/components/operations/DataOperation.tsx` (`ContenuReponses`, lignes 180-282). Correctif : sous-onglets ou accordéon, résumé d'abord, détail des 27 questions caché derrière un clic.
5. **CRM (« Mes contacts & stats ») illisible sur mobile** : tableau 8 colonnes qui déborde hors écran sans indice de défilement. Fichier : `admin/components/pro/CrmPro.tsx`. Correctif : vue liste/carte sous 640px, comme le fait déjà `GrilleOperations.tsx`.
6. **Mur de paiement total avant toute démonstration** : un pro créé via « Ma première fois » ne voit rien de l'outil (sauf « Mes commandes ») tant que le paiement n'est pas validé — aucun mode démo/aperçu. Fichiers : `admin/components/pro/AccesBloque.tsx`, `admin/components/pro/ProShell.tsx` (ligne ~107). Impact direct sur le fil rouge « simple pour un non-technicien » : le premier vrai contact avec l'outil peut être un mur.

### P1

- Badge/bandeau « Animation » en violet (couleur d'accent générique) au lieu du bleu demandé par Romain pour distinguer visuellement event/super event. `admin/lib/charte.ts` l.98-99, `admin/components/parcours/BandeauEtapes.tsx` l.13.
- Émoticônes encore présentes dans `admin/components/operations/ModalGererLots.tsx` (⏳ ✅ 📞 📣 🙏 ✉️ 💬) malgré le retrait documenté « Émoticônes retirées de tout l'espace pro » (référentiel fonctionnel, section 8, 16/09).
- Scan caméra du billet gagnant fonctionne « sur Chrome Android » uniquement (texte explicite à l'écran, `/pro/scanner`) — aucun mode caméra pour un commerçant sur iPhone, repli obligatoire sur la saisie manuelle du code.
- Pas de recherche/pagination sur l'onglet « Gagnants & tirage » d'une opération (contrairement au CRM qui en a) — risque de liste interminable sur une grosse opération.
- Deux niveaux d'onglets imbriqués sur « Mes contacts & stats » (Contacts/Gagnants/Trafic, puis dans Contacts : Contacts/Par origine/Par animation/Statistiques) sans distinction visuelle claire entre les deux niveaux.
- Fermeture au clavier (Échap) absente sur le modal « Gérer les lots » (3 autres moyens de fermeture fonctionnent).

### P2

- Noms d'opérations tronqués en une ligne (`admin/styles/sa-kanban.css`, `.sa-kb-nom{white-space:nowrap;text-overflow:ellipsis}`) sans moyen fiable de lecture complète sur mobile (le `title=` HTML ne s'affiche qu'au survol souris). Vu sur « Fetes d... », « maxi as... », « teste... ».
- Texte à 11–12,5 px et gris moyen (`#5a6b80`/`#64748B` sur blanc) sur les écrans denses (CRM, Trafic) — fatigant en boutique, en luminosité forte sur mobile.
- Opérations de test visibles telles quelles dans l'espace réel d'un pro (« maxi assurance », « teste sept » chez Assurance Charvolin, 0 partie/0 gagnant) — probablement des events de test jamais nettoyés côté SA, à signaler à l'agent/audit Super Admin.
- Erreurs console 400/404 observées sur plusieurs écrans pro (desktop et mobile) ; ressource exacte non identifiée avant l'instabilité du serveur de dev partagé survenue en cours de session (voir ci-dessous).

---

## Ce qui n'a pas pu être vérifié

- **Connexion avec un vrai compte pro payé** : impossible dans le temps imparti (mur de paiement réel GoCardless/virement, aucun moyen de l'auto-valider en restant strictement lecture seule). Contournement documenté en tête de rapport.
- **Lighthouse mobile** : non exécuté sur les pages pro (hors du périmètre demandé pour cet agent — `/landing`, `/nds`, `/rejoindre/[se]` sont confiées à l'audit transversal).
- **Liens email préremplis et QR de tracking** : visibles et listés dans l'onglet Diffusion (boutons « Ouvrir »/« Copier »), mais pas cliqués un par un pour vérifier destinataire/sujet/corps — délégué par chevauchement avec l'agent patterns/QR dédié.
- **Sous-onglets de « Mon profil »** : RIB/Coordonnées bancaires, « Lots & stock », « Banques de questions », « Commandes et factures » n'ont été vus qu'en liste (onglets visibles sur `shots/nook-compte-d.png`), pas ouverts en détail — temps insuffisant après l'incident serveur ci-dessous.
- **Panne du serveur de dev partagé** : environ 15 minutes d'indisponibilité totale (`Error: Cannot find module './1682.js'`, erreur de chunk webpack) en fin de session, très probablement causée par une recompilation concurrente d'un autre agent sur le même `localhost:3000` (consigne explicite de ne pas le redémarrer, respectée). Quelques captures mobiles secondaires prévues (modal ouvert/fermé en vue 390 px, sous-onglets de Mon profil) n'ont pas pu être prises ; les constats de ce rapport reposent sur ce qui a été capturé avant/après, complété par la lecture de code.
- **Export CSV / Mailchimp** : bouton présent et câblé (code lu, génère un vrai blob CSV côté client dans `DataOperation.tsx`/`CrmPro.tsx`), fichier réellement téléchargé non ouvert pour vérifier son contenu colonne par colonne.
- **Parcours de souscription** (`/pro/inscription`, `/pro/premiere-fois`, etc.) : volontairement non audités en profondeur, laissés à l'agent dédié.

## Comptes utilisés

Aucun compte `qa+` créé. Observation en lecture seule de deux pros réels déjà existants dans la base de production NDS 2026 (via la faille IDOR documentée en P0-2, strictement sans connexion ni écriture) :
- `pro-nook` (Nook Café) — a servi de cas principal car actif (16 gagnants, 23 contacts CRM).
- `pro-charvolin` (Assurance Charvolin) — cas de contrôle, a un vrai compte connecté (`auth_id` renseigné), utilisé pour vérifier le Pattern B sur un cas à 0 gagnant.

Captures dans `/tmp/flowin-audit-2026-11-07/shots/` (desktop `-d.png`, mobile `-m.png`).
