# Flowin · Schéma & Migration SQL

État au 15/05/2026 — Validé sur PostgreSQL 16 local.

## Ordre d'exécution recommandé (Supabase SQL Editor)

```
1. FINAL_CONSOLIDATED.sql       Schéma initial 11 tables + RLS
2. SCHEMA_ALIGNMENT_v2.sql      Ajout colonnes manquantes (idempotent)
3. SEED_PROD_v2.sql             Migration seed prod (186 joueurs Pâques, etc.)
4. FIX_QR_URLS_v2.sql           Normalisation cfg.qrUrl (déjà fait en prod)
```

Tous les fichiers sont **idempotents** : ils peuvent être exécutés plusieurs fois
sans erreur (`ADD COLUMN IF NOT EXISTS`, `ON CONFLICT DO UPDATE`).

---

## Fichiers actifs

| Fichier | Rôle | Lignes |
|---|---|---|
| `FINAL_CONSOLIDATED.sql` | Schéma initial 11 tables + RLS + vues | 350 |
| `SCHEMA_ALIGNMENT_v2.sql` | Ajoute 28 colonnes manquantes (url, prenom, tel, stats, etc.) | 84 |
| `SEED_PROD_v2.sql` | 2 pros + 3 events + 186 joueurs Pâques + 8 lots + 1 super_event | 322 |
| `FIX_GENRE_COLUMN.sql` | Colonne genre (déjà incluse dans ALIGNMENT_v2) | 16 |
| `FIX_PARTENAIRE_URL.sql` | Colonne partenaires.url (déjà incluse dans ALIGNMENT_v2) | 17 |
| `FIX_QR_URLS_v2.sql` | UPDATE en masse de cfg.qrUrl | 25 |
| `AUDIT_ALL_IN_ONE.sql` | Audit complet (vues, contrôles, stats) | 537 |
| `CLEAN_TEST_DATA.sql` | Nettoyage données test (ev-test-*, j-test-*, etc.) | 52 |
| `SEED_AUDIT_FICTIF.sql` | Seed fictif pour audit | 162 |
| `SIMULATE_PARCOURS_USERS.sql` | Simule 4 joueurs scannent un QR | 69 |

## Archives

`sql/archive/` contient les anciens fichiers conservés pour traçabilité :
- `FIX_QR_URLS.sql` (v1, remplacé par v2)
- `FIX_RLS_500.sql` + `FIX_RLS_DISABLE.sql` (RLS mode test, à durcir avant prod)
- `AUDIT_ALL_IN_ONE.sql.tmp` (fichier temporaire vide)

---

## Validation locale

```bash
# Démarrer PostgreSQL local
apt-get install -y postgresql postgresql-client
service postgresql start

# Créer une DB de test propre
su - postgres -c "psql -c 'CREATE DATABASE flowin_test;'"

# Tester dans l'ordre
su - postgres -c "psql flowin_test -f sql/FINAL_CONSOLIDATED.sql"
su - postgres -c "psql flowin_test -f sql/SCHEMA_ALIGNMENT_v2.sql"
su - postgres -c "psql flowin_test -f sql/SEED_PROD_v2.sql"

# Vérifier
su - postgres -c "psql flowin_test -c '
  SELECT table_name, COUNT(*) FROM (
    SELECT \"joueurs\" AS table_name FROM joueurs
    UNION ALL SELECT \"events\" FROM events
    UNION ALL SELECT \"pros\" FROM pros
  ) t GROUP BY table_name;'"
```

Résultat attendu :
- `pros: 2`
- `events: 3`
- `joueurs: 186`
- `lots: 8`
- `super_events: 1`

---

## Connexion Supabase

```
URL : https://atddutvzklcgiqxlpvla.supabase.co
Anon key : sb_publishable_LBkvaGc0M9ZzXZLxviJi9g_58lU8onF
Région : eu-west-1
```

Exécution manuelle via le SQL Editor du dashboard Supabase.

## Tables (10 tables data + 1 auth)

| Table | Rôle |
|---|---|
| `profiles` | Auth Supabase (lié à auth.users) |
| `pros` | Organisations clientes |
| `partenaires` | Partenaires des events |
| `events` | Événements (un par module : quiz, spin, vote, etc.) |
| `super_events` | Groupements d'events |
| `joueurs` | CRM des participants |
| `lots` | Lots à gagner |
| `banques` | Banques de questions quiz |
| `participations` | Logs des participations (avec ticket_code, bonus_answers) |
| `votes` | Logs des votes étoiles |
| `gas_backup_log` | Logs backup Google Sheets |
