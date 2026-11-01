#!/bin/bash
# Lance la preuve par test complete : base jetable -> tests SQL -> mini-API -> application -> Playwright/jsQR.
# Aucun SQL n'est applique a une base distante ; l'application parle a un mini-PostgREST LOCAL (shim-rest.js).
# usage : QA_DIR=<qa-tools> OUT=<dossier de sortie> bash run-e2e.sh
#   QA_DIR : dossier contenant node_modules (pg, jsqr, pngjs)
#   Postgres jetable a demarrer avant : node db/pgstart.js /var/tmp/flowin-qa-pg  (port 54399)
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
ADMIN="$(cd "$HERE/../.." && pwd)"
QA_DIR="${QA_DIR:?QA_DIR manquant}"
OUT="${OUT:?OUT manquant}"
APP_PORT=3100
export NODE_PATH="$QA_DIR/node_modules:/opt/node22/lib/node_modules"
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
export CHROME_BIN="${CHROME_BIN:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
mkdir -p "$OUT"

bash "$HERE/reset-db.sh" > "$OUT/reset-db.log" 2>&1
echo "== tests SQL"
node "$HERE/sql-tests.js" "$OUT/sql-tests.json" | tee "$OUT/sql-tests.log"
SQL_RC=${PIPESTATUS[0]}

# on remet le jeu de donnees a zero (les tests SQL ont change des jeux et des participations)
bash "$HERE/reset-db.sh" > "$OUT/reset-db2.log" 2>&1

node "$HERE/shim-rest.js" 54321 > "$OUT/shim.log" 2>&1 &
SHIM_PID=$!
mkdir -p "$ADMIN/app/qa-qr-harness"
cp "$HERE/harness/page.tsx" "$ADMIN/app/qa-qr-harness/page.tsx"
cd "$ADMIN"
rm -rf "$ADMIN/.next"   # evite les restes d'un `next build` (types, chunks) qui perturbent `next dev`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON=test-anon \
  FLOWIN_QR_LIMITE_SCANS=60 npx next dev -p $APP_PORT > "$OUT/next-dev.log" 2>&1 &
NEXT_PID=$!
cleanup() { kill $SHIM_PID 2>/dev/null; for p in $(pgrep -P $NEXT_PID 2>/dev/null) $NEXT_PID $(pgrep -x "next-server (v1" 2>/dev/null); do kill $p 2>/dev/null; done; rm -rf "$ADMIN/app/qa-qr-harness"; }
trap cleanup EXIT

for i in $(seq 1 60); do curl -s -o /dev/null "http://127.0.0.1:$APP_PORT/q/indisponible" && break; sleep 2; done
# echauffement : compile les pages utilisees
for u in "/qa-qr-harness?evs=ev-qa-garage" "/q/indisponible?m=inconnu" "/jouer?ev=ev-qa-garage" "/parcours/quizmaster?ev=ev-qa-cafe" "/parcours/spin?ev=ev-qa-garage" "/parcours/quiz?ev=ev-qa-garage"; do
  curl -s -o /dev/null -L -m 120 "http://127.0.0.1:$APP_PORT$u"
done
sleep 4
echo "== e2e Playwright + jsQR"
node "$HERE/e2e.js" "$OUT" "http://127.0.0.1:$APP_PORT" | tee "$OUT/e2e.log"
E2E_RC=${PIPESTATUS[0]}
echo "SQL_RC=$SQL_RC E2E_RC=$E2E_RC"
exit $(( SQL_RC + E2E_RC ))
