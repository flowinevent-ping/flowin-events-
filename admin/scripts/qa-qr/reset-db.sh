#!/bin/bash
# Reconstruit la base de test JETABLE (flowin_qa) a partir de sql/ + jeu de donnees de test.
# Aucune base distante n'est touchee : le serveur Postgres est local (port 54399, socket /tmp).
# Postgres jetable : node db/pgstart.js /var/tmp/flowin-qa-pg   (port 54399, socket /tmp)
# usage : bash reset-db.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
P="psql -h /tmp -p 54399 -U postgres -q -v ON_ERROR_STOP=0"
$P -d postgres -c "drop database if exists flowin_qa" -c "create database flowin_qa"
# sections 1 a 3 (QR, index de regles, stats) du SQL du lot precedent : lignes 1 a 150
sed -n 1,150p "$REPO/sql/2026-11-01-tirage-auto-liste-gagnants.sql" > /tmp/qa-lot-sections-1-3.sql
for f in "$HERE/db/00-prelude.sql" "$REPO/sql/FINAL_CONSOLIDATED.sql" "$REPO/sql/SCHEMA_ALIGNMENT_v2.sql" \
         "$REPO/sql/01-identite-super-admin.sql" "$HERE/db/10-prod-supplement.sql" /tmp/qa-lot-sections-1-3.sql \
         "$REPO/sql/09-qr-permaliens.sql" "$HERE/seed.sql"; do
  echo "== $(basename "$f")"
  $P -d flowin_qa -f "$f" 2>&1 | grep -i "error" | grep -v 'relation "public.events" does not exist' || true
done
echo "base prete"
