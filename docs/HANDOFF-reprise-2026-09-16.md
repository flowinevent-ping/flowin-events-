# 🔁 REPRISE — 16/09 (fin de session)

Bootstrap inchangé : voir `docs/HANDOFF-reprise-2026-09-14.md` §0 (secrets dans Notion 🔑 ACCÈS COMPLETS,
push réel obligatoire, `execute_sql` en lecture seule, écritures par `apply_migration` + `sql/`).

Commits : `a36a3cb` (§2 + B + C + G) · `19ec43d` (J, H, I, A, E, F, G, `?se=`).

## FAIT — vérifié (tsc 0 erreur, `next build` Compiled successfully, SQL relu après application)

| | Quoi | Où |
|---|---|---|
| ✅ §2 | **Rien à plat.** Brique `lib/operations.ts` (`grouperOperations`, `fetchOperationsPro`, `fetchSuiviOperation`) + `components/operations/BlocsOperations.tsx`. Un bloc par super event / event autonome, titre nom + date, tri date décroissante, vide sous son titre | fiche pro SA (8 onglets), fiche partenaire rattachée, `/pro`, `/pro/events`, `/pro/lots`, `/pro/tirage`, `/pro/tracking`, `/pro/com` (nouveau), `/pro/contrat` (nouveau), `/pro/crm` (export) |
| ✅ §2 | Plus de délégation à `PartenaireDrawer` filtré sur un `partenaire_id` | `ProDrawer.tsx` |
| ✅ B | Filtre gabarit **unique, à la source** : `fetchAllEvents`, `fetchSuperEvents` (option `avecGabarit` pour la seule page Super Events), `fetchProDashboard`, `fetchDashboardStats`, `grouperOperations` | `lib/dashboard.ts`, `lib/nds.ts`, `lib/pro.ts` |
| ✅ C | 3 lots matérialisés (`lot-ev-charvolin-…`) ; `creerAnimation()` écrit aussi la table `lots` | `sql/materialiser_lots_cfg_en_table.sql`, `lib/pro.ts` |
| ✅ D | Plus aucun `find(e => e.super_event_id)` : `/pro/super` (`?se=`), `/pro/super/[event]`, `/pro/tracking`, `/pro/parcours`, `/dashboard/parcours`, `/dashboard/events`, `/dashboard/jeux` | |
| ✅ G | Création SA refusée sans questions (`controler`) ; wizard super event : contenu de jeu par station + `qrUrl` ; `QuizmasterClient` lit `cfg.customQuestions` ; 3 `qrUrl` renseignés | `lib/wizard.ts`, `wizard-super-event`, `sql/renseigner_qrurl_manquants.sql` |
| ✅ J | Fiche pro = fiche partenaire rattachée (`ONGLETS_FICHE`) ; `ProClient.tsx` (non routé) supprimé, son QR/partage → Emails & com, son export → `/pro/crm` | |
| ✅ H | `ListeCRM` porte alignement, largeur, troncature (texte entier au survol) ; Pros, Partenaires, Joueurs, Retours CRM migrés | `components/dashboard/ListeCRM.tsx` |
| ✅ I | Règle unique : `docs/REGLE-apercus.md` ; onglet **Aperçu** fiche event ; aperçu sur `/pro/super/[event]` ; sélecteur groupé par opération | `ParcoursMobil.tsx` |
| ✅ A | `ModuleChip` traduit (`libelleModule`) + 3 listes | `DashboardUI.tsx` |
| ✅ E | Libellés « envoyée automatiquement » corrigés ; diffusion demandée affichée dans Demandes de participation et dans Emails & com | |
| ✅ F | `nds-comm` : QR local | |
| ✅ `?se=` | partenaires, joueurs (via `participations`), gagnants (sélecteur) ; nds-lots le lisait déjà | `BandeauFiltreSE.tsx` |
| ✅ bug | Validation en caisse pro : `verifier_pin_pro` puis `valider_lot` (le PIN était comparé au n° de billet, et le retour jsonb lu comme booléen) | `GagnantsClient.tsx` |
| ✅ schéma | `tirages.event_id` + `attribuer_gain_joueur(p_event_id)` + `evenement_tracking(text[])` | `sql/tirages_event_id_et_tracking_evenement.sql` |
| ✅ contact | `06 16 35 49 36` → `04 93 59 91 37` partout où il suit `flowinevent@gmail.com` (24 occ., miroir MD5 identique, Acorn 0 erreur) ; `CONTACT_PARTENAIRE` corrigé | |

## URLs de validation

- `/dashboard/pros` → Assurance Charvolin → onglets Lots & stock / Gagnants / Emails & com / Contrat / QR & Liens / Tracking : 4 blocs (Fêtes du Haut Pays 17/10, maxi assurance, teste sept, Nuits du Sud 2026)
- `/pro/lots?pro=pro-charvolin` (teste sept : 2 lots, maxi assurance : 1 lot)
- `/pro/tirage?pro=pro-utile` (bloc Nuits du Sud 2026, 20 gagnants actifs)
- `/pro/super?pro=pro-charvolin` (liste de 2 super events) · `/pro/com?pro=pro-utile` · `/pro/contrat?pro=pro-utile`
- `/dashboard/super-events` (le Master n'est plus rangé en « Terminé »)
- `/dashboard/joueurs?se=se-nds-2026` · `/dashboard/partenaires?se=se-nds-2026` · `/dashboard/gagnants?se=se-nds-2026`
- `/dashboard/crm-retours`

Non vérifié à l'écran depuis la session : le bac à sable n'atteint pas l'API Supabase en HTTP. Logique vérifiée par SQL équivalent.

## RESTE À FAIRE

- 🟡 **G — contenu** : 4 events quiz sans aucune question (`htghc`, Charvolin Fêtes du Haut Pays, maxi assurance, teste sept). Choix des banques = décision de contenu, non inventée.
- 🟡 **J — grammaire visuelle** : les blocs sont communs, mais ProShell garde sa sidebar et ses libellés en capitales ; Manrope non utilisée (constat 16).
- 🟡 **Contact** : `06 16 35 49 36` subsiste hors paire email partenaire (CTA « Parlons-en » de `email-partenaire.html`, bons de commande, landing, démos) — contact prospection, laissé tel quel.
- 🟡 Monolithe `dashboard.html` : `api.qrserver.com` encore présent (hors périmètre, ne pas valider dessus).
- ❌ Écran SA de contrôle (compteurs d'incohérences) — en suspens, décision Romain.

## EN SUSPENS — à trancher avec Romain (inchangé)

- `/pro/parcours` : la vue « Parcours super event » n'est plus proposée que pour une station de super event. La garder ?
- Stats uniformes : parties rejouées (même jour / d'un jour à l'autre ?), pic de fréquentation (par heure / par jour ?)
- Écran SA de contrôle
