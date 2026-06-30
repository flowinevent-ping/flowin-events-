# -*- coding: utf-8 -*-
"""
stamp_complete.py — Re-cible le QR d'une vidéo "complete" CapCut (à plat) vers UN event,
sans CapCut, en recouvrant proprement chaque QR cuit. + mur partenaires (8 logos) + Flowin.

Pourquoi : le QR est cuit dans l'export CapCut à plusieurs endroits/tailles. Cet outil les
LOCALISE automatiquement (pyzbar), génère un cache "Flash le QR" à la bonne taille et les
RECOUVRE en 1 passe ffmpeg. Re-cibler la vidéo (autre station / autre pro) = 1 commande,
audio CapCut conservé (-c:a copy), vérif scan intégrée.

⚠️ Le placement des LOGOS/textes (logo NDS, "CE SOIR", etc.) reste dans CapCut : on ne
touche pas aux pixels d'image, on ne recouvre que les QR (cartes blanches) + on ajoute Flowin.

Usage :
  python3 stamp_complete.py <master_capcut.mp4> <ev-id> <out.mp4> \
      [--wall wall8.mp4] [--flowin flowin.png] [--head-end 34.9] [--xfade 34.5] [--no-verify]

Ex : python3 stamp_complete.py master.mp4 ev-nds-ecrans video-ecran-8-partenaires.mp4 --wall wall8.mp4
"""
import os, sys, subprocess, argparse, tempfile
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = tempfile.mkdtemp(prefix="stamp_complete_")
FONT = "/home/claude/vid/fonts/Manrope.ttf"
BASE = "https://flowin-events.vercel.app/parcours/nds2026"

def manrope(sz, w=800):
    f = ImageFont.truetype(FONT, sz)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    return f

def grab(src, t, p):
    subprocess.run(["ffmpeg","-y","-v","error","-ss",f"{t}","-i",src,"-frames:v","1",p], check=True)
    return Image.open(p).convert("RGB")

def make_qr(url):
    import qrcode
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2, box_size=12)
    qr.add_data(url); qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGB").resize((600,600), Image.NEAREST)

def cover_card(qr_img, card_px):
    c = Image.new("RGBA", (card_px, card_px), (0,0,0,0)); d = ImageDraw.Draw(c)
    d.rounded_rectangle([0,0,card_px-1,card_px-1], radius=int(card_px*0.10), fill=(255,255,255,255))
    q = int(card_px*0.84); off = (card_px-q)//2
    c.paste(qr_img.resize((q,q), Image.NEAREST), (off,off))
    return c

def flowin_wordmark(h=150):
    f = manrope(h, 800); d0 = ImageDraw.Draw(Image.new("RGB",(10,10)))
    wflow = d0.textbbox((0,0),"Flow",font=f)[2]; win = d0.textbbox((0,0),"in",font=f)[2]
    pad = int(h*0.12); W = wflow+win+pad*2; H = int(h*1.45)
    img = Image.new("RGBA",(W,H),(0,0,0,0)); d = ImageDraw.Draw(img); yb = int(H*0.5)
    d.text((pad,yb),"Flow",font=f,fill=(255,255,255,255),anchor="lm")
    it = Image.new("RGBA",(win+4,H),(0,0,0,0)); ImageDraw.Draw(it).text((0,yb),"in",font=f,fill=(255,255,255,255),anchor="lm")
    grad = Image.new("RGBA",(win+4,H),(0,0,0,0))
    for x in range(win+4):
        tt = x/max(1,win); col = (int(230+14*tt), int(24+157*tt), int(127-59*tt), 255)
        for y in range(H): grad.putpixel((x,y), col)
    grad.putalpha(it.split()[3]); img.alpha_composite(grad,(pad+wflow,0))
    return img

def locate_segments(src, t0, t1, step=0.2):
    """Balaye et regroupe les QR cuits par position -> [(cx,cy,w,tmin,tmax), ...]."""
    from pyzbar.pyzbar import decode, ZBarSymbol
    hits = []
    t = t0
    while t <= t1:
        im = grab(src, t, os.path.join(WORK, "scan.png"))
        for r in decode(im, symbols=[ZBarSymbol.QRCODE]):
            rc = r.rect
            hits.append((t, rc.left+rc.width//2, rc.top+rc.height//2, max(rc.width, rc.height)))
        t = round(t+step, 3)
    # cluster par proximité (grille 90 px)
    clusters = []
    for ti, cx, cy, w in hits:
        for cl in clusters:
            if abs(cl["cx"]-cx) < 90 and abs(cl["cy"]-cy) < 90:
                cl["ts"].append(ti); cl["ws"].append(w); cl["cxs"].append(cx); cl["cys"].append(cy); break
        else:
            clusters.append(dict(cx=cx, cy=cy, ts=[ti], ws=[w], cxs=[cx], cys=[cy]))
    segs = []
    GAP = 1.5  # un même emplacement réapparaît dans plusieurs scènes -> découper par trou temporel
    for cl in clusters:
        cx = sorted(cl["cxs"])[len(cl["cxs"])//2]; cy = sorted(cl["cys"])[len(cl["cys"])//2]
        w  = sorted(cl["ws"])[len(cl["ws"])//2]
        ts = sorted(cl["ts"]); run = [ts[0]]
        for prev, cur in zip(ts, ts[1:]):
            if cur - prev > GAP:
                segs.append((cx, cy, w, run[0]-0.4, run[-1]+0.4)); run = [cur]
            else:
                run.append(cur)
        segs.append((cx, cy, w, run[0]-0.4, run[-1]+0.4))
    return sorted(segs, key=lambda s: s[3])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("master"); ap.add_argument("ev"); ap.add_argument("out")
    ap.add_argument("--wall", default=None, help="clip mur partenaires 8 logos SANS QR (NOQR=1)")
    ap.add_argument("--flowin", default=None, help="PNG transparent (sinon wordmark généré)")
    ap.add_argument("--head-end", type=float, default=34.9)
    ap.add_argument("--xfade", type=float, default=34.5)
    ap.add_argument("--no-verify", action="store_true")
    a = ap.parse_args()

    url = f"{BASE}?ev={a.ev}"
    qr = make_qr(url)
    fl = Image.open(a.flowin).convert("RGBA") if a.flowin else flowin_wordmark()
    fw = 230; fh = round(fl.size[1]*fw/fl.size[0]); fl.resize((fw,fh)).save(os.path.join(WORK,"flowin.png"))
    fx, fy = 540-fw//2, 1920-fh-26

    segs = locate_segments(a.master, 0.0, a.head_end)
    print(f"{len(segs)} QR cuits localisés :")
    inputs = ["-i", a.master]
    if a.wall: inputs += ["-i", a.wall]
    filt = [f"[0:v]trim=0:{a.head_end},setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1[b0]"]
    idx = 2 if a.wall else 1
    last = "b0"
    for i,(cx,cy,w,ta,tb) in enumerate(segs):
        cp = round(w*1.30)
        cover_card(qr, cp).save(os.path.join(WORK, f"cov{i}.png"))
        inputs += ["-i", os.path.join(WORK, f"cov{i}.png")]
        x, y = cx-cp//2, cy-cp//2
        nxt = f"b{i+1}"
        filt.append(f"[{last}][{idx}:v]overlay={x}:{y}:enable='between(t,{ta:.2f},{tb:.2f})'[{nxt}]")
        print(f"  seg{i}: cx={cx} cy={cy} w={w} -> cache {cp}px  fenêtre {ta:.1f}-{tb:.1f}s")
        last = nxt; idx += 1
    # flowin head
    inputs += ["-i", os.path.join(WORK,"flowin.png")]; fl_idx = idx
    filt.append(f"[{last}][{fl_idx}:v]overlay={fx}:{fy}[h]"); idx += 1

    if a.wall:
        cp = 580; cover_card(qr, cp).save(os.path.join(WORK,"cov_wall.png"))
        inputs += ["-i", os.path.join(WORK,"cov_wall.png")]; wq = idx; idx += 1
        inputs += ["-i", os.path.join(WORK,"flowin.png")]; wf = idx; idx += 1
        filt.append("[1:v]trim=0:6.04,setpts=PTS-STARTPTS,fps=30,scale=1080:1920,setsar=1,"
                    "noise=alls=9:allf=t,fade=t=out:st=5.6:d=0.44[w0]")
        filt.append(f"[w0][{wq}:v]overlay={540-cp//2}:{1459-cp//2}:enable='between(t,0.3,5.7)'[w1]")
        filt.append(f"[w1][{wf}:v]overlay={fx}:{fy}[m]")
        filt.append(f"[h][m]xfade=transition=fade:duration=0.4:offset={a.xfade}[outv]")
        vmap = "[outv]"
    else:
        vmap = "[h]"

    cmd = ["ffmpeg","-y","-v","error"] + inputs + ["-filter_complex", ";".join(filt),
           "-map", vmap, "-map", "0:a", "-c:a", "copy",
           "-c:v","libx264","-crf","19","-preset","veryfast","-pix_fmt","yuv420p","-movflags","+faststart", a.out]
    subprocess.run(cmd, check=True)
    print("RENDU ->", a.out)

    if not a.no_verify:
        from pyzbar.pyzbar import decode, ZBarSymbol
        frames = os.path.join(WORK,"vf"); os.makedirs(frames, exist_ok=True)
        subprocess.run(["ffmpeg","-y","-v","error","-i",a.out,"-vf","fps=3",f"{frames}/f%03d.png"], check=True)
        import glob
        ok=0; bad=[]
        for p in sorted(glob.glob(f"{frames}/f*.png")):
            res = decode(Image.open(p).convert("RGB"), symbols=[ZBarSymbol.QRCODE])
            if not res: continue
            if all(a.ev in r.data.decode() for r in res): ok+=1
            else: bad.append(p)
        print(f"VERIF: {ok} frames -> {a.ev}   résidus={len(bad)}")
        sys.exit(0 if not bad else 2)

if __name__ == "__main__":
    main()
