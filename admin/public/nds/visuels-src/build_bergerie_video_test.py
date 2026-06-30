#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_bergerie_video_test.py — RECETTE de montage du test vidéo commerce (NDS 2026)
====================================================================================
ANTI-PERTE : ce script encode TOUTES les modifications faites sur la vidéo Bergerie
(session 30/06) pour qu'elles ne soient pas perdues et soient rejouables. Il NE
contient AUCUNE musique : il recopie telle quelle la piste audio de la vidéo source
de Romain (donc rien de copyrighté n'entre dans le repo).

Ce qu'il fait, à partir de l'export CapCut de Romain :
  1) Génère le QR "réseaux" du commerce (parcours/nds2026 + source) — net, scannable.
  2) Compose le BADGE QR agrandi (carte 360 + "Flash"/"le QR") = version remontée/agrandie.
  3) Assemble la vidéo finale en UNE passe ffmpeg :
       - efface le texte "CE SOIR" de l'intro (delogo, ~0.8->7.7 s)
       - masque l'ANCIEN petit badge de l'intro + pose le NOUVEAU badge agrandi/remonté
         (UNIQUEMENT sur l'intro 0->7.8 s, pour ne pas dupliquer le QR des autres scènes)
       - remplace la scène partenaires (~34.5->39.5 s) par le clip 7 logos + Allianz
         Charvolin (QR remonté), via un fondu enchaîné de 0.4 s, + léger grain + fondu noir
       - conserve la PISTE AUDIO d'origine (-c:a copy) => musique calée à 100 %

⚠️ Les coordonnées (delogo / overlay / offset 34.5 s) sont calées sur l'export CapCut
   Bergerie de Romain (40.54 s, 1080x1920, 30 fps). Pour un AUTRE export, revérifier
   les fenêtres temporelles (un export différent = autres timings).
   Pour le batch "1 vidéo par partenaire", la voie propre reste le re-render depuis la
   source (render_kref40.py + render_partners_v2.py), pas le patch d'un export aplati.

Entrées :
  - VIDEO source (export CapCut de Romain, AVEC sa musique)  -> argument 1
  - Clip partenaires committé : kit-digital/nds/clips/5-partenaires-bergerie-allianz.mp4
Sortie :
  - MP4 final (contient la musique de Romain) -> NE PAS committer (repo public).

Usage :
  python3 build_bergerie_video_test.py <video_capcut.mp4> [sortie.mp4] [slug] [Nom Commerce]
  (defaut slug=bergerie)

Dépendances : ffmpeg, Pillow, qrcode, pyzbar (vérif). Police Manrope (auto-télécharge si absente).
"""
import os, sys, subprocess, urllib.request

# ---------- Paramètres commerce (par défaut : Bergerie) ----------
SLUG  = sys.argv[3] if len(sys.argv) > 3 else "bergerie"
NOM   = sys.argv[4] if len(sys.argv) > 4 else "Domaine de la Bergerie"
QR_URL = f"https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-{SLUG}&source=reseaux-{SLUG}"

# ---------- Chemins ----------
HERE      = os.path.dirname(os.path.abspath(__file__))
REPO      = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))  # racine repo
CLIP_PART = os.path.join(REPO, "admin/public/nds/kit-digital/nds/clips/5-partenaires-bergerie-allianz.mp4")
WORK      = os.environ.get("WORK", "/tmp/bergerie_build")
os.makedirs(WORK, exist_ok=True)
SRC_DEFAULT = os.path.join(HERE, "sources-video", "bergerie-capcut-source-40s.mp4")  # source committée
SRC_VIDEO = sys.argv[1] if len(sys.argv) > 1 else (SRC_DEFAULT if os.path.exists(SRC_DEFAULT) else None)
OUT       = sys.argv[2] if len(sys.argv) > 2 else os.path.join(WORK, f"{SLUG}-video-complete-TEST.mp4")

# ---------- Police Manrope 800 ----------
def manrope(size):
    from PIL import ImageFont
    p = os.path.join(WORK, "Manrope.ttf")
    if not os.path.exists(p):
        url = "https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf"
        try:
            urllib.request.urlretrieve(url, p)
        except Exception:
            return ImageFont.load_default()
    try:
        f = ImageFont.truetype(p, size)
        try: f.set_variation_by_axes([800])   # poids 800
        except Exception: pass
        return f
    except Exception:
        return ImageFont.load_default()

# ---------- 1) QR réseaux du commerce ----------
def make_qr(path):
    import qrcode
    from PIL import Image
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2, box_size=12)
    qr.add_data(QR_URL); qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB").resize((600, 600), Image.NEAREST)
    img.save(path)
    return path

# ---------- 2) Badge QR agrandi (carte + "Flash"/"le QR") ----------
def make_badge(qr_path, out_path):
    from PIL import Image, ImageDraw
    AMBER = (244, 181, 68); WHITE = (255, 255, 255)
    QR = Image.open(qr_path).convert("RGB")
    qsz, pad = 360, 26
    cw = qsz + pad * 2                       # 412 : carte QR
    fF, fL = manrope(82), manrope(74)
    d0 = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    def measure(t, f):
        b = d0.textbbox((0, 0), t, font=f); return b[2] - b[0]
    tw = max(measure("Flash", fF), measure("le QR", fL))
    Wd, Hh = cw + 30 + tw + 10, cw           # ~665 x 412
    badge = Image.new("RGBA", (Wd, Hh), (0, 0, 0, 0)); d = ImageDraw.Draw(badge)
    d.rounded_rectangle([0, 0, cw - 1, cw - 1], radius=42, fill=(255, 255, 255, 255))
    badge.paste(QR.resize((qsz, qsz), Image.NEAREST), (pad, pad))
    tx = cw + 30
    d.text((tx, cw * 0.40), "Flash", font=fF, fill=AMBER, anchor="lm")
    d.text((tx, cw * 0.63), "le QR", font=fL, fill=WHITE, anchor="lm")
    badge.save(out_path)
    return out_path

# ---------- 3) Assemblage final (une passe ffmpeg) ----------
def assemble(src_video, badge_png, out_path):
    # Filtres — coordonnées calées sur l'export Bergerie (40.54 s / 1080x1920 / 30 fps)
    filt = (
        # tête = intro->finale de la vidéo de Romain, nettoyée :
        "[0:v]trim=0:34.9,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1,"
        "delogo=x=405:y=518:w=265:h=80:enable='between(t,0.8,7.7)',"          # efface "CE SOIR"
        "delogo=x=695:y=1650:w=378:h=232:enable='between(t,0,7.8)'[h0];"      # masque ancien badge (intro)
        "[h0][2:v]overlay=385:1330:enable='between(t,0.6,7.8)'[h];"           # pose nouveau badge (intro)
        # scène partenaires de remplacement (clip committé) :
        "[1:v]trim=0:6.04,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1,"
        "noise=alls=9:allf=t,fade=t=out:st=5.6:d=0.44[m];"                    # grain + fondu noir final
        # raccord par fondu enchaîné 0.4 s à 34.5 s :
        "[h][m]xfade=transition=fade:duration=0.4:offset=34.5[outv]"
    )
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", src_video,        # 0 = export CapCut de Romain (sa musique)
        "-i", CLIP_PART,        # 1 = clip partenaires (committé)
        "-i", badge_png,        # 2 = badge QR agrandi
        "-filter_complex", filt,
        "-map", "[outv]", "-map", "0:a", "-c:a", "copy",   # AUDIO d'origine intact
        "-c:v", "libx264", "-crf", "23", "-preset", "slow",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        out_path,
    ]
    subprocess.run(cmd, check=True)
    return out_path

def main():
    if not SRC_VIDEO or not os.path.exists(SRC_VIDEO):
        print("Usage: python3 build_bergerie_video_test.py <video_capcut.mp4> [sortie.mp4] [slug] [Nom]")
        print("  -> fournir l'export CapCut de Romain (avec sa musique).")
        sys.exit(1)
    if not os.path.exists(CLIP_PART):
        print("Clip partenaires introuvable:", CLIP_PART); sys.exit(1)
    qr = make_qr(os.path.join(WORK, f"qr_{SLUG}.png"))
    badge = make_badge(qr, os.path.join(WORK, "new_badge.png"))
    assemble(SRC_VIDEO, badge, OUT)
    print("OK ->", OUT, f"({NOM})")
    # Vérif QR au scan (si pyzbar dispo)
    try:
        from pyzbar.pyzbar import decode
        from PIL import Image
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "37", "-i", OUT,
                        "-frames:v", "1", os.path.join(WORK, "q.png")], check=True)
        r = decode(Image.open(os.path.join(WORK, "q.png")))
        print("QR scène partenaires:", r[0].data.decode() if r else "ILLISIBLE")
    except Exception as e:
        print("(vérif QR ignorée:", e, ")")

if __name__ == "__main__":
    main()
