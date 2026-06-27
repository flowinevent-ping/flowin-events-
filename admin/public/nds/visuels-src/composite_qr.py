# -*- coding: utf-8 -*-
# Composite un QR variant sur les frames base 9x16 (scene sans QR) -> dossier sortie
import sys, os; sys.path.insert(0, "/home/claude/vid")
from PIL import Image
import render_kref40 as R

BASE = "/home/claude/vid/base916"
qrfile = sys.argv[1]; outdir = sys.argv[2]
a = int(sys.argv[3]); b = int(sys.argv[4])
os.makedirs(outdir, exist_ok=True)
qr = Image.open(qrfile).convert("RGB")
for i in range(a, min(b, R.NF)):
    t = i / R.FPS
    base = Image.open(f"{BASE}/f{i:04d}.jpg").convert("RGBA")
    R.qr_overlay(base, t, qr)
    base.convert("RGB").save(f"{outdir}/f{i:04d}.jpg", quality=90)
print("COMPOSITE_OK", os.path.basename(qrfile), a, min(b, R.NF))
