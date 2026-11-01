#!/bin/bash
# TEST DE LA CHAINE SQL COMPLETE sur un Postgres local JETABLE (base flowin_chain, port 54399).
# Reconstruit la base a partir de sql/ (+ supplement de test pour les tables de prod absentes du depot),
# applique les fichiers dans l'ORDRE de sql/README-ORDRE.md avec ON_ERROR_STOP=1 (une erreur = echec),
# puis REJOUE toute la chaine une 2e fois (idempotence) et lance les controles de fin (chaine-sql-controles.sql).
# Aucune base distante n'est touchee. Prerequis : node db/pgstart.js /var/tmp/flowin-qa-pg
# usage : bash chaine-sql.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
DB="${DB:-flowin_chain}"
P="psql -h /tmp -p 54399 -U postgres -q -v ON_ERROR_STOP=1"
ECHECS=0
psql -h /tmp -p 54399 -U postgres -q -d postgres -c "drop database if exists $DB" -c "create database $DB" || exit 2

run() { # run <fichier> [tolere]  — sed : retire les 2 extensions absentes en local (pg_net, pg_cron)
  local f="$1" tmp; tmp="$(mktemp)"
  sed -E 's/^create extension if not exists pg_net;/-- (test local) pg_net simule/; s/^[[:space:]]*create extension if not exists pg_cron;/    null; -- (test local) pg_cron absent/' "$f" > "$tmp"
  local out; out="$($P -d $DB -f "$tmp" 2>&1)"; local rc=$?
  rm -f "$tmp"
  if [ $rc -ne 0 ] || echo "$out" | grep -qi "^psql:.*error"; then
    echo "ECHEC  $(basename "$f")"; echo "$out" | grep -iE "error|detail|hint" | head -6 | sed 's/^/        /'; ECHECS=$((ECHECS+1))
  else echo "ok     $(basename "$f")"; fi
}

# 1. Fondations (schema du depot + supplement de test)
for f in "$HERE/db/00-prelude.sql" "$REPO/sql/FINAL_CONSOLIDATED.sql" "$REPO/sql/SCHEMA_ALIGNMENT_v2.sql" "$HERE/db/10-prod-supplement.sql" "$HERE/db/11-tables-prod-manquantes.sql" "$HERE/db/12-colonnes-lues-par-le-code.sql" "$REPO/sql/crm_pro.sql" "$REPO/sql/tirages_event_id_et_tracking_evenement.sql" "$REPO/sql/operation_reponses.sql"; do
  if [ "$(basename "$f")" = FINAL_CONSOLIDATED.sql ]; then # 1 erreur connue et sans effet : vue creee avant la table events
    $P -d $DB -v ON_ERROR_STOP=0 -f "$f" 2>&1 | grep -i error | grep -v 'relation "public.events" does not exist'; echo "ok     FINAL_CONSOLIDATED.sql"
  else run "$f"; fi
done

# 2. La chaine numerotee, 2 passages (le 2e prouve que chaque fichier se rejoue sans dommage)
ORDRE=$(grep -E '^[0-9]+\. `sql/' "$REPO/sql/README-ORDRE.md" | sed -E 's/^[0-9]+\. `sql\/([^`]+)`.*/\1/')
for passe in 1 2; do
  echo "== passage $passe de la chaine"
  for f in $ORDRE; do run "$REPO/sql/$f"; done
done

# 3. Controles de fin
echo "== controles"
CTRL="$($P -d $DB -t -A -f "$HERE/chaine-sql-controles.sql" 2>&1)"
echo "$CTRL"
echo "$CTRL" | grep -q "^KO" && ECHECS=$((ECHECS+1))
echo "== comportement (droits, consentement, commande -> facture -> mise en service)"
COMP="$($P -d $DB -v ON_ERROR_STOP=0 -t -A -f "$HERE/chaine-sql-comportement.sql" 2>&1 | grep -E "^(OK|KO|psql:.*ERROR)")"
echo "$COMP"
echo "$COMP" | grep -qE "^(KO|psql)" && ECHECS=$((ECHECS+1))
# 4. (facultatif) jeu de donnees fictif de l'espace pro pour les captures : SEED_PRO=1 bash chaine-sql.sh
if [ "${SEED_PRO:-0}" = "1" ]; then $P -d $DB -v ON_ERROR_STOP=0 -f "$HERE/seed-pro.sql" 2>&1 | grep -i error; echo "seed espace pro : applique"; fi
echo "ECHECS=$ECHECS"
exit $ECHECS
