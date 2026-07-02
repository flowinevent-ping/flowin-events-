#!/usr/bin/env bash
# =====================================================================
# BOOTSTRAP NDS 2026 — 1 commande pour reconnecter tout l'environnement.
# Corrige les oublis récurrents (symlink, polices, QR, nds_lib, garde-fou).
#   Usage :  bash bootstrap-nds.sh [PAT_GITHUB]
# Le PAT n'est JAMAIS stocké ici (sécurité) : passe-le en argument.
# =====================================================================
set -e
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PAT="${1:-$GITHUB_PAT}"
pip install qrcode pyzbar --break-system-packages -q 2>/dev/null || true

echo "== 1. Symlink /home/claude/repo (attendu par nds_lib) =="
ln -sfn "$REPO_DIR" /home/claude/repo
mkdir -p /home/claude/vid/qr /home/claude/vid/fonts /home/claude/vid/a4 /home/claude/vid/logos

echo "== 2. Polices (Manrope + Anton) =="
F=/home/claude/vid/fonts
[ -f "$F/Manrope-ExtraBold.ttf" ] || curl -sL -o "$F/Manrope-ExtraBold.ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf"
[ -f "$F/Anton.ttf" ] || curl -sL -o "$F/Anton.ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf"
cp "$F/Manrope-ExtraBold.ttf" "$F/Manrope.ttf" 2>/dev/null || true
cp "$F/Manrope-ExtraBold.ttf" "$F/Manrope-var.ttf" 2>/dev/null || true

echo "== 3. nds_lib dans l'env de rendu =="
cp "$REPO_DIR/admin/public/nds/visuels-src/nds_lib.py" /home/claude/vid/nds_lib.py

echo "== 4. QR stations (partenaires + festival) depuis la source =="
python3 - "$REPO_DIR" <<'PY'
import sys,os
sys.path.insert(0, os.path.join(sys.argv[1],'admin/public/nds/visuels-src'))
import nds_lib as L, qrcode
base='https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-'
ids=list(L.PARTNERS)+['2026','ecrans','digitale','caisse-1','caisse-2','caisse-3','bar-1','bar-2','festival','tablette-1','tablette-2','tablette-3']
def mk(u,p,b):
    q=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=b,border=2);q.add_data(u);q.make(fit=True)
    q.make_image(fill_color='black',back_color='white').save(p)
for i in ids:
    mk(base+i, f'/home/claude/vid/qr/ev-nds-{i}.png', 20)
    mk(base+i, f'/home/claude/vid/qr/{i}_hd.png', 26)
print('  QR generes:', len(ids))
PY

echo "== 5. Auth GitHub (si PAT fourni) =="
if [ -n "$PAT" ]; then
  git -C "$REPO_DIR" remote set-url origin "https://x-access-token:$PAT@github.com/flowinevent-ping/flowin-events-.git"
  git -C "$REPO_DIR" -c http.extraheader= fetch -q origin main && echo "  push/pull prets"
else
  echo "  (pas de PAT -> lecture seule ; passe le PAT en argument pour pousser)"
fi

echo "== 6. Garde-fou de coherence =="
python3 "$REPO_DIR/admin/public/nds/visuels-src/verify-supports.py" | tail -3

echo "== BOOTSTRAP OK — environnement reconnecte =="
