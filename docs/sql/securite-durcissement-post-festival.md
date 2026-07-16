# Durcissement sécurité Flowin — chantier post-festival (après le 9 juillet 2026)

> Préparé le 22/06/2026. **NE PAS appliquer pendant le festival.** À dérouler au calme, avec tests, après le 9 juillet.

## Déjà fait (22/06, en prod, sans risque)
- Vues `SECURITY DEFINER` → `security_invoker` (v_parrainage_commerce, v_nds_commerces_carte, v_bons_achat_nds).
- RLS activée sur `documents_legaux` (CGV).
- `search_path` verrouillé sur toutes les fonctions `public`.
- **Anti-triche** : `EXECUTE` révoqué pour anon/authenticated sur toutes les fonctions `SECURITY DEFINER` sauf 3 légitimes (`crm_landing_flowin_upsert`, `search_ecoles`, `upsert_ecole`). → `add_points`, `attribuer_lot_auto`, `valider_parrainage`, etc. ne sont plus appelables publiquement.

Résultat : **0 erreur** au scan sécurité Supabase (était 4).

## Le verrou à lever
Le **dashboard admin et le parcours joueur utilisent la même clé `anon` publique**. Le dashboard fait des `INSERT/UPDATE/DELETE` sur quasi toutes les tables avec cette clé. Donc tant que l'admin passe par `anon`, on ne peut pas restreindre `anon` sans casser l'admin.

Tables encore en `USING(true) WITH CHECK(true)` pour `anon` (lecture + écriture + suppression libres) : joueurs, gains, se_gains, se_tickets, se_reponses, factures, bons_commande, lots, lots_stock, partenaires, pros, events, super_events, sessions, visites, votes, parrainage, etc.

Risques résiduels tant que ce n'est pas refait :
- lecture des **données perso** des joueurs (nom, email, tél) via l'API publique → **RGPD** ;
- modification/suppression de données (gains, factures, tickets) par un tiers qui a la clé publique.

## Plan en 3 étapes (post-festival)

### Étape 1 — Séparer l'accès admin (prérequis)
Choisir UNE option :
- **(a) Login admin Supabase Auth** : le dashboard s'authentifie (email/mot de passe), utilise un token `authenticated`, et on crée un rôle/claim `admin`. Les policies admin ciblent ce claim.
- **(b) Proxy serveur** : déplacer les écritures admin derrière une petite API (Edge Function / serveur) qui utilise la clé `service_role` (jamais exposée au navigateur). Le dashboard appelle le proxy.

Option (a) = plus simple à mettre en place sur l'existant. Tant que ce n'est pas fait, NE PAS exécuter l'étape 2.

### Étape 2 — Restreindre `anon` (après étape 1)
Pour chaque table sensible, remplacer la policy `ALL USING(true)` par des policies ciblées. Pattern :

```sql
-- Exemple : joueurs (le public ne doit PAS lire toutes les fiches ni supprimer)
DROP POLICY IF EXISTS flowin_anon_all_joueurs ON public.joueurs;
-- écriture jeu : insertion d'un nouveau joueur uniquement
CREATE POLICY joueurs_anon_insert ON public.joueurs FOR INSERT TO anon WITH CHECK (true);
-- pas de SELECT large pour anon : la reconnaissance d'un joueur récurrent passe par une RPC SECURITY DEFINER dédiée
-- admin (étape 1) : accès complet
CREATE POLICY joueurs_admin_all ON public.joueurs FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

Tables append-only côté jeu (le joueur n'a besoin que d'`INSERT`) → retirer `UPDATE`/`DELETE` à anon :
`se_reponses`, `se_tickets`, `se_gains`, `visites`, `votes`, `partenaire_clics`, `connexions`, `participations`.

```sql
-- Pattern append-only
DROP POLICY IF EXISTS flowin_anon_all_se_reponses ON public.se_reponses;
CREATE POLICY se_reponses_anon_insert ON public.se_reponses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY se_reponses_admin_all  ON public.se_reponses FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

Données purement admin (le joueur n'y touche jamais) → `anon` aucun accès :
`factures`, `bons_commande` (sauf l'INSERT du formulaire partenaire), `pros`, `lots`, `lots_stock`, `crm_retours`, `envois_*`.

> Le claim joueur récurrent (reconnaissance par email) doit passer par une **RPC `SECURITY DEFINER`** contrôlée (ex. `claim_joueur(email)`) plutôt que par un SELECT direct sur `joueurs`, sinon on ré-ouvre la lecture des données perso.

### Étape 3 — Réglages console (2 min)
- Auth → activer **Leaked Password Protection**.
- Déplacer l'extension `pg_net` hors du schéma `public` (vérifier d'abord que les triggers d'envoi d'email — `notify_bon_commande` — référencent bien `net.*` via le bon schéma).

## Checklist de test (sur branche Supabase, avant prod)
- [ ] Parcours joueur complet (inscription → quiz → ticket) OK avec anon restreint.
- [ ] Reconnaissance joueur récurrent OK (via RPC).
- [ ] Bon de commande partenaire (INSERT + signature + CGV) OK.
- [ ] Dashboard admin : lecture, édition, suppression OK avec l'accès authentifié.
- [ ] Scan `get_advisors security` : plus aucun `rls_policy_always_true` sur les tables sensibles.

---

## Incident 17/07 — v_nds_participants (écran Participants NDS vide)

**Symptôme** : dashboard → « Participants NDS 2026 » affichait 0 / « Aucun participant », alors que la vue contenait 465 lignes.

**Cause** : `v_nds_participants` était la SEULE ressource avec `anon SELECT` révoqué, alors que `joueurs`, `pros`, `partenaires`, `events`, `tirages` (mêmes données PII) restent anon-lisibles. Le dashboard lit au niveau anon (`FLOWIN_AUTH` retombe sur la clé anon quand la session admin n'est pas/plus établie), d'où l'échec sur cette seule vue.

**Correctif immédiat** : `grant select on public.v_nds_participants to anon;` — réaligne la vue sur le reste. Aucune exposition nouvelle : la PII est déjà accessible via `public.joueurs` (anon=true).

**À traiter dans le refactor RLS post-festival** (le vrai correctif) :
- Verrouiller `joueurs` ET les vues dérivées (`v_nds_participants`) derrière l'accès authentifié.
- Ajouter le refresh automatique du token dans `dashboard.html` (comme `tirage-nds.html`), pour que les lectures authentifiées ne retombent pas silencieusement en anon après expiration.
- Une fois l'auth fiable, re-révoquer `anon SELECT` sur `joueurs` + `v_nds_participants`.
