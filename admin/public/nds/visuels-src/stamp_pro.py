# -*- coding: utf-8 -*-
"""
stamp_pro.py — Appose le QR d'UN professionnel sur un MASTER vidéo sans-QR.

PRINCIPE (fin du "recommencer") :
  - Le MASTER (fond + mur de logos) est rendu UNE fois, sans QR -> immuable.
  - Chaque pro = 1 passe ffmpeg overlay (quelques secondes), PAS de re-render frame.
  - L'audio du master est conservé tel quel (-c:a copy).
  - Vérif QR au scan (pyzbar) avant de sortir OK.

Usage :
  python3 stamp_pro.py <master_sans_qr.mp4> <slug> <sortie.mp4> \
      [--mode reseaux|ev|digitale] [--at X:Y] [--window A:B]

Exemples :
  # QR "réseaux" de la bergerie, badge persistant, bas-centre :
  python3 stamp_pro.py base-40s.mp4 bergerie out/bergerie.mp4 --mode reseaux
  # QR festival générique (digitale) sur l'intro seulement :
  python3 stamp_pro.py base-40s.mp4 digitale out/digitale.mp4 --mode ev --window 0.6:7.8

Boucle "tous les pros" :
  for s in bergerie pegase utile carrosserie-gp giordano alafut charvolin dekra; do
    python3 stamp_pro.py master.mp4 $s out/$s.mp4 --mode reseaux
  done
"""
import os, sys, subprocess, argparse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.environ.get("WORK", "/tmp/stamp_pro"); os.makedirs(WORK, exist_ok=True)

BASE = "https://flowin-events.vercel.app/parcours/nds2026"

def qr_url(slug, mode):
    if mode == "reseaux":  return f"{BASE}?ev=ev-nds-{slug}&source=reseaux-{slug}"
    if mode == "ev":       return f"{BASE}?ev=ev-nds-{slug}"
    if mode == "digitale": return f"{BASE}?ev=ev-nds-digitale"
    raise SystemExit(f"mode inconnu: {mode}")

# ---- Police Manrope 800 (identique au reste du kit) ----
def manrope(size):
    from PIL import ImageFont
    p = os.path.join(WORK, "Manrope.ttf")
    if not os.path.exists(p):
        url = "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf"
        try: urllib.request.urlretrieve(url, p)
        except Exception: return ImageFont.load_default()
    try:
        f = ImageFont.truetype(p, size)
        try: f.set_variation_by_axes([800])
        except Exception: pass
        return f
    except Exception:
        return ImageFont.load_default()

# ---- 1) QR du pro ----
def make_qr(url, path):
    import qrcode
    from PIL import Image
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2, box_size=12)
    qr.add_data(url); qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB").resize((600, 600), Image.NEAREST)
    img.save(path); return path

# ---- 2) Badge QR agrandi (carte + "Flash"/"le QR") — style validé bergerie ----
def make_badge(qr_path, out_path):
    from PIL import Image, ImageDraw
    AMBER = (244, 181, 68); WHITE = (255, 255, 255)
    QR = Image.open(qr_path).convert("RGB")
    qsz, pad = 360, 26
    cw = qsz + pad * 2
    fF, fL = manrope(82), manrope(74)
    d0 = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    meas = lambda t, f: (lambda b: b[2] - b[0])(d0.textbbox((0, 0), t, font=f))
    tw = max(meas("Flash", fF), meas("le QR", fL))
    Wd, Hh = cw + 30 + tw + 10, cw
    badge = Image.new("RGBA", (Wd, Hh), (0, 0, 0, 0)); d = ImageDraw.Draw(badge)
    d.rounded_rectangle([0, 0, cw - 1, cw - 1], radius=42, fill=(255, 255, 255, 255))
    badge.paste(QR.resize((qsz, qsz), Image.NEAREST), (pad, pad))
    tx = cw + 30
    d.text((tx, cw * 0.40), "Flash", font=fF, fill=AMBER, anchor="lm")
    d.text((tx, cw * 0.63), "le QR", font=fL, fill=WHITE, anchor="lm")
    badge.save(out_path); return out_path

def has_audio(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0",
                        "-show_entries", "stream=codec_name", "-of", "csv=p=0", path],
                       capture_output=True, text=True)
    return bool(r.stdout.strip())

def stamp(master, badge, out, at, window):
    x, y = at
    enable = f":enable='between(t,{window[0]},{window[1]})'" if window else ""
    filt = f"[0:v][1:v]overlay={x}:{y}{enable}[outv]"
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", master, "-i", badge,
           "-filter_complex", filt, "-map", "[outv]"]
    if has_audio(master): cmd += ["-map", "0:a", "-c:a", "copy"]
    cmd += ["-c:v", "libx264", "-crf", "19", "-preset", "medium",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True); return out

def verify(out, url, window):
    from pyzbar.pyzbar import decode
    from PIL import Image
    ss = (window[0] + window[1]) / 2 if window else 1.0
    frame = os.path.join(WORK, "verify.png")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(ss), "-i", out,
                    "-frames:v", "1", frame], check=True)
    r = decode(Image.open(frame))
    got = r[0].data.decode() if r else None
    ok = (got == url)
    print(f"  QR scanné: {got or 'ILLISIBLE'}  ->  {'OK' if ok else 'KO (attendu '+url+')'}")
    return ok

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("master"); ap.add_argument("slug"); ap.add_argument("out")
    ap.add_argument("--mode", default="reseaux", choices=["reseaux", "ev", "digitale"])
    ap.add_argument("--at", default="385:1330", help="position overlay X:Y (coin haut-gauche du badge)")
    ap.add_argument("--window", default=None, help="fenêtre d'affichage A:B en secondes (défaut: toute la durée)")
    a = ap.parse_args()

    url = qr_url(a.slug, a.mode)
    at = tuple(int(v) for v in a.at.split(":"))
    window = tuple(float(v) for v in a.window.split(":")) if a.window else None
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)

    qr = make_qr(url, os.path.join(WORK, f"qr_{a.slug}_{a.mode}.png"))
    badge = make_badge(qr, os.path.join(WORK, f"badge_{a.slug}.png"))
    stamp(a.master, badge, a.out, at, window)
    ok = verify(a.out, url, window)
    print(("OK -> " if ok else "ÉCHEC VÉRIF -> ") + a.out)
    sys.exit(0 if ok else 2)

if __name__ == "__main__":
    main()
