# CRM à deux niveaux et statistiques : qui voit quoi (25/11/2026)

Modèle de Romain (25/11) : un CRM propre à chaque pro + un CRM global Flowin ; source = les participants ; stats globales ET isolées par commerce. Mesures : base `ywcqtupgoxfzkddqkztk` (25/11, lecture seule).

## 1. Ce qui existe
| Niveau | Objet | Accès | Isolation | Preuve |
|---|---|---|---|---|
| Source | `joueurs` (842) + `participations` (1 035) + `se_reponses` + `visites` | écriture anonyme (inscription) | RLS : lecture par le joueur, le pro concerné, le SA | politiques `joueurs_lecture_sa_pro_moi`, `participations_lecture_sa_pro_moi` |
| 1. CRM du pro | RPC `crm_pro(p_pro)` → `_crm_pro_interne` | SA, ou pro dont `pros.auth_id = auth.uid()` | filtre `events.pro_id = p_pro` ; e-mail, téléphone et nom masqués si pas de consentement (`joueurs.optin` ou `clients_commerce.optin`) ; clé d'opération `ev:<id>` ou `se:<id>` | corps lu 25/11 ; `docs/SECURITE-crm-pro-2026-11-23.md` |
| 1b. Fichier importé | `clients_commerce` (0 ligne), RPC `import_contacts_pro` | pro ou SA | `pro_id` | table vide : import jamais utilisé en réel |
| 2. CRM Flowin (global) | RPC `crm_participants(p_se)` → `_crm_participants_interne` | SA seul (`est_super_admin()`) | aucun masquage (le SA voit tout) | corps lu 25/11 |
| Écrans | pro : `/pro/donnees`, `/pro/crm/[id]`, `CrmPro.tsx` ; SA : `/dashboard/crm-pro`, `/dashboard/nds-participants`, `/dashboard/joueurs` | | | `components/pro/CrmPro.tsx` (385 lignes) |

## 2. Qui voit quoi
| Acteur | Contacts | Statistiques |
|---|---|---|
| Participant | ses propres données (`flowin_joueur_est_moi`) | ses tickets et lots (`/moi`) |
| Pro simple | ses participants, masqués sans consentement (via `crm_pro`) | les siennes (`pro_participations_*`, `operation_stats`, `stats_qr_evenement`) |
| Organisateur (pro propriétaire du Super Event, `super_events.pro_id`) | participations de TOUTES les stations de son Super Event (`flowin_est_pro_super_event`) | agrégats du Super Event |
| Pro station d'un Super Event qu'il ne possède pas | seulement ses propres stations | les siennes |
| Super Admin | tout, sans masquage | globales (`super_event_*`, une trentaine de RPC) + par pro |

## 3. Trous (preuves)
1. Masquage contournable : la RPC masque, mais la table `joueurs` reste lisible en direct par un pro lié au joueur, sur 53 colonnes dont `email`, `tel`, `ddn`, `password_hash` (SELECT accordé à `authenticated`). `password_hash` est renseigné pour 3 joueurs sur 842. Un pro qui lit la table directement obtient donc plus que son CRM masqué. À corriger côté base (vue limitée ou retrait de colonnes) : transmis à `securite-donnees` (ECARTS E1).
2. Isolation « stats par commerce » : les 30 RPC `super_event_*` sont exécutables par `anon`. Elles renvoient des agrégats ; le contenu n'a pas été relu une à une : non vérifié qu'aucune ne renvoie de ligne individuelle.
3. Aucun CRM global « par typologie de clientèle » : `genre`, `tranche_age`, `code_postal` sont lus par `crm_pro` ; pas de RPC d'agrégat de typologie pour le SA (non vérifié : peut exister dans le monolithe).
4. Deux listes sur la même source : `crm_pro` (par pro) et `v_nds_participants`, `v_se_joueurs` (vues NDS). Risque de chiffres différents pour une même grandeur (leçon 29/08 : source unique du comptage).
5. `clients_commerce` vide : le « fichier client importé » n'alimente pas encore le CRM du pro (import incomplet, ETAT.md).

## 4. Cible
- Une seule source de lecture par niveau : `crm_pro` (niveau pro), `crm_participants` (niveau Flowin). Toute statistique affichée dérive de ces RPC ou de RPC d'agrégat dédiées, jamais d'un comptage local.
- Stats isolées par commerce = `crm_pro` / `operation_stats` filtrés par `pro_id` ; stats globales = RPC SA seule.
- Ajouter pour le SA une RPC d'agrégats de typologie (genre, tranche d'âge, code postal, zone de chalandise) : nouveau, à valider par Romain (finalités : prouver aux futurs pros, mesurer le trafic, cartographier la clientèle).
- Retour arrière : SQL de rollback en pied de fichier, tag avant.

## Non vérifié
Connexion réelle d'un pro et du SA sur le CRM (ETAT.md : non vérifié) ; contenu des 30 RPC `super_event_*` ; fonctionnement du CRM dans le monolithe `dashboard.html`.
