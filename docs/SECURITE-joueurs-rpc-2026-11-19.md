# Sécurité joueurs : écritures et lectures par RPC (19/11/2026)

SQL : `sql/2026-11-19-securite-joueurs-rpc.sql` (partie A additive, partie B après déploiement, partie C commentée, rollback en pied).
Suite de `SECURITE-rls-tables-2026-11-19.md` (phases 1 et 2 appliquées en prod). **Rien n'est appliqué en prod** : audit en lecture seule uniquement.

## Les trous
1. **Écritures anonymes** (clé publishable) sur `se_tickets`, `se_gains`, `se_reponses`, `parrainage` : un tricheur s'attribue des tickets ou un gain immédiat (libellé libre) en un `curl`.
2. **Lectures anonymes** : `se_gains` (nom / e-mail / tél des gagnants), `se_reponses` (formulaire complet), `parrainage`, `visites`, `partenaire_clics` ; et `joueurs_anon_select`, `participations_anon_select`, `tirages_anon_select` (vérifiées en prod : elles existent).

Identité du joueur dans l'application : l'id `joueurs.id` (uuid) gardé dans le téléphone (`flowin_joueur`), relié par lien e-mail via `moi_joueur_par_session`. C'est la même identité que `mes_notifications`, `mes_cadeaux`, `mes_consentements` : les nouvelles RPC « moi » la reprennent.

## RPC (partie A, SECURITY DEFINER, exécutables par anon et authenticated)
| RPC | Remplace | Contrôles serveur |
|---|---|---|
| `se_attribuer_partie(joueur, event, quiz, bonus, sur_place, jour)` | upsert `se_tickets` + insert `se_gains` de `attribuerSuperEvent` | joueur existe ; station rattachée à un super event, non archivée ; super event non archivé ; jour dans `date_d-1 … date_f+1` ; participation de ce joueur sur cette station dans les 24 h ; `gain_ticket <> false` ; 1 quiz + 1 bonus / station / jour (index unique) ; **gain immédiat = `events.gain_immediat` lu en base**, code généré serveur, 1 / joueur / station / jour. Jour client accepté à ±1 jour du jour UTC serveur. |
| `se_enregistrer_reponses(...)` | insert `se_reponses` | joueur et station existent ; super event déduit serveur ; 10 lignes max / joueur / station / jour (1 attendue + ré-essais). Contenu (formulaire, consentement `optin`) **identique**. |
| `mon_historique_reponses(joueur)` | select `se_reponses` (anti-répétition) | ne renvoie que les ids de questions vues + drapeau bonus |
| `parrainage_capturer(ref, filleul, etab, canal)` | select + insert `parrainage` | mêmes règles que `lib/parrainage.ts` (pas d'auto-parrainage, 1 fois par couple, 3 validés / parrain / jour) + parrain et filleul doivent exister. Le trigger `tg_parrainage_credit_ticket` crédite toujours le ticket. |
| `parrainage_recu(external_id)` | select `parrainage` côté filleul | renvoie seulement la date |
| `moi_tickets_gains(joueur, se?, events?)` | selects `se_tickets` / `se_gains` / `participations` de `/moi`, `/se/[se]`, `/jouer` | données du seul joueur demandé |
| `se_tickets_compte_event(event)` | count `se_tickets` (page pro serveur) | un nombre |
| `visites_origines(events[], sans_etape)` | select `visites` (`/pro/super`, `BlocsOperations`) | comptes par source (chaque visiteur une fois, première source) |
| `visites_entonnoir(event, jour)` | select `visites` (`/pro/super/[event]`) | 3 comptes |

## Appelants avant / après (code de ce commit)
| Fichier | Avant | Après |
|---|---|---|
| `lib/parcours.ts` `attribuerSuperEvent` | upsert `se_tickets`, insert `se_gains` (code et libellé côté client) | `rpc('se_attribuer_partie')` |
| `lib/parcours.ts` `writeSeReponses` | insert `se_reponses` (+1 ré-essai) | `rpc('se_enregistrer_reponses')` (+1 ré-essai) |
| `lib/parcours.ts` `fetchJoueurHistory` | select `se_reponses` | `rpc('mon_historique_reponses')` |
| `lib/parrainage.ts` | select/insert `parrainage` | `rpc('parrainage_capturer')`, `rpc('parrainage_recu')` |
| `app/moi/page.tsx`, `app/se/[se]/SuperEventClient.tsx`, `app/jouer/JouerClient.tsx` | select `se_tickets`, `se_gains`, `participations` | `lib/moiTicketsGains.ts` → `rpc('moi_tickets_gains')` |
| `lib/dashboard.ts` `fetchEventSuperEventStats` | count `se_tickets` | `rpc('se_tickets_compte_event')` |
| `app/pro/super/page.tsx`, `app/pro/super/[event]/page.tsx`, `components/operations/BlocsOperations.tsx` | select `visites` | `rpc('visites_origines')`, `rpc('visites_entonnoir')` |

**Repli** (`lib/rpcRepli.ts`) : si la RPC n'existe pas (PGRST202 / 42883 / 404), l'ancien accès direct est utilisé. Une RPC présente qui refuse (`ok:false`) ne déclenche jamais le repli. Ordre de déploiement libre entre code et partie A.

Inchangés (déjà sous jeton SA ou pro, couverts par les politiques authenticated) : `dashboard.html` (non modifié, MD5 `f82bd8ed4dbf95e408dea01ea6b0a1fb` ×2), `lib/dashboard.ts` `fetchJoueurTicketsGains` (SA), `lib/qrTraces.ts` (pro/SA).
Télémétrie laissée en **INSERT anonyme seul** (risque faible, aucun avantage de jeu) : `visites` (`lib/track.ts`), `partenaire_clics` (`parcours-tracking`, `NDS2026Client`, `/r/[pid]`).

## Partie B (retraits)
`se_tickets`, `se_reponses` : plus d'INSERT ni de SELECT anonymes ; lecture SA, pro de la station (`qr_est_proprietaire`) ou du super event (`flowin_est_pro_super_event`).
`se_gains`, `parrainage` : plus d'INSERT ni de SELECT anonymes ; lecture par les politiques SA / pro déjà présentes.
`visites`, `partenaire_clics` : SELECT anonyme retiré (INSERT conservé) ; lecture SA ou pro concerné.
Effet connu : `NDS2026Client.tsx` (non modifiable) compte `se_tickets` en direct pour son compteur ; après la partie B ce compte vaut 0 et le composant garde son cumul local (`if (count > 0)`), sans erreur. Festival terminé.

## Partie C — non traitée, NE PAS appliquer
Retirer `joueurs_anon_select`, `participations_anon_select`, `tirages_anon_select` casserait aujourd'hui :
`public/parcours/{quiz,quizsolo,quizmaster,spin,tombola,vote,standup}.html` et `parcours_user.html` (recherche par `email_lower` / `tel`, insert `joueurs` avec retour), `lib/parcours.ts` `writeJoueur` / `claimJoueur` / `lookupJoueurByEmail` / `controleRegleQr`, `lib/joueurs.ts`, `lib/landing.ts`, `lib/mesLots.ts` (tirages du joueur, offrir à un ami), `lib/masters/tickets.ts`, `tirage-nds.html`, et les pages pro rendues côté serveur sans session (`/pro/*` via `lib/pro.ts`, `/pro/super/[event]` participations). Chantier suivant : RPC d'inscription (`joueur_inscrire`), de reconnaissance par e-mail (sans renvoyer le téléphone), `mes_lots`, et passage des pages pro serveur en client avec session.
Également résiduel : `joueurs`/`participations`/`tirages` lisibles par **tout compte authentifié**, or la connexion participant par lien e-mail crée des comptes Auth (`shouldCreateUser: true`).
Non vérifiable serveur : « sur place » (géolocalisation décidée par le téléphone).

## Tests (19/11)
- PostgreSQL 16 local, schéma stub repris des définitions prod (tables, index unique, politiques, fonctions d'accès, trigger parrainage) : partie A ×2 puis partie B ×2 sans erreur.
  Avant B (rôle anon) : 1re partie → `tickets: 2` + gain `Boisson offerte` code serveur ; 2e partie même jour → `tickets: 0`, pas de gain ; station sans partie → `sans_partie` ; joueur inconnu → `joueur` ; super event passé → `hors_dates` ; parrainage ok / doublon / auto / filleul inconnu → `t f f f`, ticket parrainage crédité par le trigger ; historique `["q1","q2"]`, bonus vrai ; agrégats visites corrects.
  Après B (anon) : SELECT des 6 tables → 0 ligne ; INSERT direct `se_tickets`/`se_gains`/`se_reponses`/`parrainage` → refus RLS ; INSERT `visites`/`partenaire_clics` → OK ; RPC toujours OK.
- `npx tsc --noEmit` : 0 erreur. `npm run build` (copie scratchpad) : `✓ Compiled successfully`. `tsconfig.tsbuildinfo` restauré.
- Playwright (Chromium, `next start` de la copie, lancé depuis `/home/user`, non-GET supabase.co bloqués et comptés), 390 px : `/parcours/quiz`, `/parcours/spin` (roue), `/parcours/nds2026`, `/se/se-nds-2026`, `/jouer`, `/moi`, `/rejoindre/se-nds-2026?ref=…`, `/pro/super`, `/pro`, `/dashboard`, `/dashboard.html`, `/static/dashboard.html`, tous `?demo=1` : **0 non-GET, 0 erreur JS**, HTTP 200.
  `/moi` hors démo, id local : RPC 404 → repli sur `se_tickets`/`se_gains` direct ; RPC 200 → aucune lecture directe ; 0 erreur JS.

## Ordre d'application
1. Déployer ce commit (Vercel, auto depuis `main`) — fonctionne avant la partie A grâce au repli.
2. Appliquer la **partie A** (du début jusqu'à `PARTIE B ═`), par l'éditeur SQL Supabase.
3. Vérifier en prod (checklist « avant B »).
4. Appliquer la **partie B** (entre `-- PARTIE B DÉBUT` et `-- PARTIE B FIN`).
5. Vérifier (checklist « après B »). En cas de souci : rollback partie B en pied de fichier.

## Checklist prod
Avant B : `select proname from pg_proc where proname in ('se_attribuer_partie','se_enregistrer_reponses','mon_historique_reponses','parrainage_capturer','parrainage_recu','moi_tickets_gains','se_tickets_compte_event','visites_origines','visites_entonnoir')` → 9 lignes ; jouer une station NDS de test → l'onglet réseau montre `rpc/se_attribuer_partie` et `rpc/se_enregistrer_reponses` en 200, aucune requête `se_tickets`/`se_gains`/`se_reponses` ; `/moi` → `rpc/moi_tickets_gains` 200.
Après B : en anon, `GET /rest/v1/se_gains?select=gagnant_email` → `[]` ; `POST /rest/v1/se_tickets` → 401/403 ; partie complète (ticket, gain immédiat, parrainage via `?ref=`) → tickets visibles dans `/moi` et `/se/se-nds-2026` ; pro : `/pro/super` origines et `/pro/super/<station>` entonnoir affichés ; SA : dashboard gagnants / clics partenaires chargés.
