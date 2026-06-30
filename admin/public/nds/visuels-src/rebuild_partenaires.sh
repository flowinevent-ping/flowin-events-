#!/usr/bin/env bash
# ============================================================================
# Rebuild de TOUS les supports pilotes par nds_lib.PARTNERS (source unique).
# Usage : bash rebuild_partenaires.sh
# Prerequis : symlink /home/claude/repo -> repo, polices + QR de station presents.
# ============================================================================
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
REPO="$(cd "$HERE/../../../.." && pwd)"
KIT="$REPO/admin/public/nds/kit-digital"
export KIT

echo "== Partenaires (source unique nds_lib.PARTNERS) =="
python3 -c "import sys;sys.path.insert(0,'.');import nds_lib as L;print(' ',len(L.PARTNERS),'->',', '.join(L.PARTNERS))"

# 0. Prerequis : logos des partenaires dispo dans /home/claude/vid/logos
python3 - <<'PY'
import sys,shutil,os; sys.path.insert(0,'.'); import nds_lib as L
os.makedirs('/home/claude/vid/logos',exist_ok=True)
for s in L.PARTNERS:
    src=f"/home/claude/repo/admin/public/nds/partenaires/{s}.png"
    if os.path.exists(src): shutil.copy(src,f"/home/claude/vid/logos/{s}.png")
print("  logos copies dans /home/claude/vid/logos")
PY

# 1. FOREX PNG + SVG (3 caisses livrees dans le kit)
echo "== Forex PNG/SVG =="
python3 - <<'PY'
import importlib.util,sys,base64
sys.path.insert(0,'/home/claude/vid'); sys.path.insert(0,'.')
spec=importlib.util.spec_from_file_location('gf','gen_forex.py'); m=importlib.util.module_from_spec(spec); m.__name__='gf'; spec.loader.exec_module(m)
for sid,lbl,fn in [('ev-nds-caisse-1','Caisse 1','forex_70x70_caisse-1'),('ev-nds-caisse-2','Caisse 2','forex_70x70_caisse-2'),('ev-nds-caisse-3','Caisse 3','forex_70x70_caisse-3')]:
    m.forex(sid,lbl,fn)
    b64=base64.b64encode(open(f'/home/claude/vid/forex/{fn}.png','rb').read()).decode()
    open(f'/home/claude/vid/forex/{fn}.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="3500" height="3500" viewBox="0 0 3500 3500" font-family="Manrope, Arial, sans-serif">\n<image href="data:image/png;base64,{b64}" width="3500" height="3500"/>\n</svg>')
print("  forex png+svg ok")
PY
for n in forex_70x70_caisse-1 forex_70x70_caisse-2 forex_70x70_caisse-3; do
  cp "/home/claude/vid/forex/$n.png" "$KIT/nds/$n.png"
  cp "/home/claude/vid/forex/$n.svg" "$KIT/nds/$n.svg"
done

# 2. FOREX PPTX editables (caisses + bars + festival)
echo "== Forex PPTX =="
python3 gen_forex_pptx_prep.py >/dev/null
node gen_pptx_forex.js >/dev/null
for f in caisse-1 caisse-2 caisse-3 bar-1 bar-2 festival; do
  cp "/home/claude/vid/forex_pptx/forex_70x70_$f-editable.pptx" "$KIT/svg/forex_70x70_$f-editable.pptx"
done

# 3. KIT MONTAGE ECRAN (logos PNG -> zip)
echo "== Kit montage ecran (logos) =="
python3 build_montage_kit.py >/dev/null 2>&1 || true
python3 - <<'PY'
import sys,os,zipfile,tempfile,shutil; sys.path.insert(0,'.'); import nds_lib as L
KIT=os.environ.get('KIT'); z=f"{KIT}/nds/montage-ecran-nds2026.zip"
tmp=tempfile.mkdtemp()
with zipfile.ZipFile(z) as zf: zf.extractall(tmp)
for s in L.PARTNERS:
    src=f"/home/claude/repo/admin/public/nds/partenaires/{s}.png"
    if os.path.exists(src): shutil.copy(src,f"{tmp}/elements/logo-{s}.png")
if os.path.exists(z): os.remove(z)
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as zf:
    for root,_,files in os.walk(tmp):
        for fn in files:
            p=os.path.join(root,fn); zf.write(p,os.path.relpath(p,tmp))
shutil.rmtree(tmp); print("  montage zip ok")
PY

echo ""
echo "== OK : forex (PNG/SVG/PPTX) + montage regeneres a $(python3 -c "import sys;sys.path.insert(0,'.');import nds_lib as L;print(len(L.PARTNERS))") logos =="
echo ""
echo "VIDEOS (rendus lourds, a lancer explicitement) :"
echo "  nds-fb-16x9   : python3 render_pres16x9.py 0 240 ; ... ; ffmpeg -framerate 24 -i /home/claude/vid/fk16/f%04d.jpg -crf 19 -pix_fmt yuv420p nds-fb-16x9.mp4"
echo "  nds-spot-9x16 / nds-ecrans-9x16 : convertir d'abord leur scene commerces a L.logo_grid (cf docs/recette-insertion-partenaire.md)"
