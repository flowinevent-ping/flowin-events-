# Flowin · Schéma & Migration SQL

État au 15/05/2026 — Validé sur PostgreSQL 16 local.

---

## 🚀 Exécution sur Supabase (procédure officielle)

**1 seul fichier à exécuter** : `sql/RUN_ON_SUPABASE.sql` (contient les 3 SQL dans le bon ordre).

```
Étape 1. Ouvrir Supabase → SQL Editor → New query
Étape 2. Copier-coller TOUT le contenu de sql/RUN_ON_SUPABASE.sql
Étape 3. Cliquer "Run"
```

⚠️ Ne PAS utiliser la commande `\i` — c'est psql CLI uniquement, pas SQL valide.

Le fichier est **idempotent** : tu peux le réexécuter plusieurs fois sans danger
(`ADD COLUMN IF NOT EXISTS` + `ON CONFLICT DO UPDATE`).

Résultat attendu après exécution :
```
INSERT 0 2     pros
INSERT 0 1     super_events  
INSERT 0 3     events
INSERT 0 8     lots
INSERT 0 186   joueurs (vrais participants Pâques 2026)
UPDATE 3       qrUrl normalisés
```

---

## Fichiers actifs

| Fichier | Rôle | Lignes |
|---|---|---|
| **`RUN_ON_SUPABASE.sql`** | **À exécuter dans le SQL Editor** (master concaténé) | 450 |
| `FINAL_CONSOLIDATED.sql` | Schéma initial 11 tables + RLS + vues (déjà exécuté) | 350 |
| `SCHEMA_ALIGNMENT_v2.sql` | Partie 1 : ajoute 28 colonnes manquantes | 84 |
| `SEED_PROD_v2.sql` | Partie 2 : 186 joueurs Pâques + events + lots | 322 |
| `FIX_QR_URLS_v2.sql` | Partie 3 : normalisation cfg.qrUrl | 25 |
| `FIX_GENRE_COLUMN.sql` | (Inclus dans ALIGNMENT_v2) | 16 |
| `FIX_PARTENAIRE_URL.sql` | (Inclus dans ALIGNMENT_v2) | 17 |
| `AUDIT_ALL_IN_ONE.sql` | Audit complet (vues, contrôles, stats) | 537 |
| `CLEAN_TEST_DATA.sql` | Nettoyage données test (ev-test-*, j-test-*, etc.) | 52 |
| `SEED_AUDIT_FICTIF.sql` | Seed fictif pour audit | 162 |
| `SIMULATE_PARCOURS_USERS.sql` | Simule 4 joueurs qui scannent un QR | 69 |

## Archives

`sql/archive/` contient les anciens fichiers conservés pour traçabilité.

---

## Validation locale (optionnel)

```bash
# Installer PostgreSQL + créer DB test
apt-get install -y postgresql postgresql-client
service postgresql start
su - postgres -c "psql -c 'CREATE DATABASE flowin_test;'"

# Tester
su - postgres -c "psql flowin_test -f sql/FINAL_CONSOLIDATED.sql"
su - postgres -c "psql flowin_test -f sql/RUN_ON_SUPABASE.sql"

# Vérifier
su - postgres -c "psql flowin_test -c \"
  SELECT 'pros' AS t, COUNT(*) FROM pros 
  UNION ALL SELECT 'events', COUNT(*) FROM events 
  UNION ALL SELECT 'joueurs', COUNT(*) FROM joueurs;
\""
```

---

## Connexion Supabase

```
URL      : https://atddutvzklcgiqxlpvla.supabase.co
Anon key : sb_publishable_LBkvaGc0M9ZzXZLxviJi9g_58lU8onF
Région   : eu-west-1
```

## Tables (10 data + 1 auth)

| Table | Rôle |
|---|---|
| `profiles` | Auth Supabase (lié à auth.users) |
| `pros` | Organisations clientes |
| `partenaires` | Partenaires des events (avec colonne `url` site web) |
| `events` | Événements (un par module : quiz, spin, vote, etc.) |
| `super_events` | Groupements d'events |
| `joueurs` | CRM des participants (avec `genre`, `prenom`, etc.) |
| `lots` | Lots à gagner |
| `banques` | Banques de questions quiz |
| `participations` | Logs des participations (avec `ticket_code`, `bonus_answers`) |
| `votes` | Logs des votes étoiles |
| `gas_backup_log` | Logs backup Google Sheets |
