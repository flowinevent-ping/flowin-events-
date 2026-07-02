#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GARDE-FOU DE COHÉRENCE — supports NDS 2026.
Ne produit rien : vérifie que tout colle à la SOURCE UNIQUE (nds_lib.PARTNERS)
et signale les dérives avant diffusion. Usage : python3 verify-supports.py
Codes : [OK] conforme · [WARN] à surveiller · [FAIL] incohérence à corriger.
"""
import os, sys, subprocess, re
HERE = os.path.dirname(os.path.abspath(__file__))
NDS = os.path.abspath(os.path.join(HERE, ".."))          # admin/public/nds
sys.path.insert(0, HERE)
import nds_lib as L

PART_DIR = os.path.join(NDS, "partenaires")
KIT = os.path.join(NDS, "kit-digital")
ok = warn = fail = 0
def say(tag, msg):
    global ok, warn, fail
    ok += tag == "OK"; warn += tag == "WARN"; fail += tag == "FAIL"
    print(f"  [{tag}] {msg}")

def qr_decode(path):
    try:
        from PIL import Image
        from pyzbar.pyzbar import decode
        d = decode(Image.open(path))
        return d[0].data.decode() if d else None
    except Exception as e:
        return f"__err__:{e}"

print(f"\n== SOURCE UNIQUE : nds_lib.PARTNERS = {len(L.PARTNERS)} ==")
print("  " + ", ".join(L.PARTNERS))

print("\n== 1. Logo présent pour chaque partenaire ==")
for s in L.PARTNERS:
    p = os.path.join(PART_DIR, f"{s}.png")
    say("OK" if os.path.exists(p) else "FAIL", f"logo {s}.png" + ("" if os.path.exists(p) else " MANQUANT"))

print("\n== 2. Dossier pro + 2 QR (physique/digital) par partenaire ==")
for s in L.PARTNERS:
    d = os.path.join(KIT, s)
    if not os.path.isdir(d):
        say("WARN", f"kit-digital/{s}/ absent (pas encore de kit pro)")
        continue
    stn = os.path.join(d, f"qr-station-{s}.png")   # PHYSIQUE (1/jour)
    net = os.path.join(d, f"qr-reseaux-{s}.png")    # DIGITAL (1x)
    for label, f, must in [("station/physique", stn, "ev="+ 'ev-nds-'+s), ("reseaux/digital", net, "source=reseaux-"+s)]:
        if not os.path.exists(f):
            say("FAIL", f"{s}: QR {label} manquant ({os.path.basename(f)})"); continue
        u = qr_decode(f)
        good = u and must in u
        say("OK" if good else "FAIL", f"{s}: QR {label} -> {u if u else 'illisible'}")

print("\n== 3. Dossiers pro orphelins (partenaire retiré mais dossier resté) ==")
known = set(L.PARTNERS) | {"nds", "svg"}
for name in sorted(os.listdir(KIT)):
    d = os.path.join(KIT, name)
    if os.path.isdir(d) and name not in known and not name.startswith("."):
        say("WARN", f"kit-digital/{name}/ orphelin (slug hors nds_lib) — à retirer ?")

print("\n== 4. Vidéo écran 8-partenaires : QR station ==")
ev = os.path.join(KIT, "nds", "video-ecran-8-partenaires.mp4")
if os.path.exists(ev):
    subprocess.run(["ffmpeg","-v","error","-ss","30","-i",ev,"-frames:v","1","/tmp/_v.png","-y"], check=False)
    u = qr_decode("/tmp/_v.png")
    say("OK" if u and "ev-nds-ecrans" in u else "FAIL", f"écran QR -> {u}")
else:
    say("FAIL", "video-ecran-8-partenaires.mp4 absente")

print("\n== 5. Dérives de listes en dur (doivent refléter nds_lib) ==")
a4 = os.path.join(HERE, "gen_a4_pro.py")
if os.path.exists(a4):
    n = len(re.findall(r'nds_a4_[a-z0-9-]+"', open(a4).read()))
    say("OK" if n >= len(L.PARTNERS) else "WARN",
        f"gen_a4_pro.py liste {n} pros vs {len(L.PARTNERS)} dans nds_lib" +
        ("" if n >= len(L.PARTNERS) else " — liste en dur à recâbler sur nds_lib"))

print(f"\n== BILAN : {ok} OK · {warn} WARN · {fail} FAIL ==")
sys.exit(1 if fail else 0)
