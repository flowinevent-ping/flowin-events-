# 📂 SQL FLOWIN — Schema final

## Ordre d'exécution

### 1️⃣ `FINAL_CONSOLIDATED.sql`
Schema complet (11 tables) avec RLS, indexes, vues, triggers.
**Idempotent** — safe à re-exécuter.

### 2️⃣ `SEED_AUDIT_FICTIF.sql` (optionnel — pour audit)
Données fictives préfixées `*-test-*` :
- 5 pros, 5 partenaires
- 9 events (3 scénarios)
- 2 super events
- 9 joueurs, 9 lots, 3 votes, 9 participations

### 3️⃣ `CLEAN_TEST_DATA.sql`
Supprime toutes les données `*-test-*`.

## Structure (11 tables)

| Table | Rôle |
|-------|------|
| `profiles` | Auth Supabase (SA/Pro) |
| `pros` | Clients organisations |
| `partenaires` | Fournisseurs de lots |
| `events` | Animations |
| `super_events` | Groupes d'events |
| `joueurs` | CRM participants |
| `lots` | Dotation |
| `banques` | Questions quiz |
| `participations` | Logs sessions |
| `votes` | Votes module vote |
| `gas_backup_log` | Audit append-only |

## Vues

- `v_prospects` : joueurs B2B
- `v_stats_event` : KPIs par event
- `v_top_joueurs` : top 100 par gains

## Policies RLS

- **SA** : tout accès
- **Pro** : lecture scopée à `pro_id`
- **Anon** : INSERT joueurs/participations/votes (parcours QR)

## Anciens scripts

Archivés dans `archive/` — historique pour référence.
