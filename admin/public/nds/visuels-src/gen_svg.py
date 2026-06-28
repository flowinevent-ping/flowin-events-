# -*- coding: utf-8 -*-
# Export SVG editable : plaque PNG (sans copie) + <text> editables (Canva).
import sys, os, base64; sys.path.insert(0,"/home/claude/vid")
import gen_a4_clean as A
import gen_forex as F

OUTDIR="/home/claude/repo/admin/public/nds/kit-digital/svg"
os.makedirs(OUTDIR, exist_ok=True)

def b64(path):
    with open(path,"rb") as fh: return base64.b64encode(fh.read()).decode()

def build_svg(W,H,plate_png,textlog,out_svg):
    data=b64(plate_png)
    parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Manrope, Arial, sans-serif">']
    parts.append(f'<image href="data:image/png;base64,{data}" x="0" y="0" width="{W}" height="{H}"/>')
    for (txt,cx,cy,size,col,w) in textlog:
        fill=f'rgb({col[0]},{col[1]},{col[2]})'
        fw=700 if w<800 else 800
        t=txt.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
        parts.append(f'<text x="{cx:.0f}" y="{cy:.0f}" font-size="{size}" font-weight="{fw}" fill="{fill}" text-anchor="middle" dominant-baseline="middle">{t}</text>')
    parts.append('</svg>')
    open(out_svg,"w").write("\n".join(parts))
    return out_svg

# --- A4 ---
A._PLATE=True
for slug,com,lot,fn in A.PARTNERS:
    A.a4(slug,com,lot,fn)  # rend plate_{fn}.png + remplit A._TEXTLOG
    log=list(A._TEXTLOG)
    p=build_svg(A.W,A.H,f"{A.OUT}/plate_{fn}.png",log,f"{OUTDIR}/{fn}.svg")
    print("A4 SVG",p)

# --- FOREX (caisses) ---
F._PLATE=True
for sid,lbl,fn in [j for j in F.JOBS if "caisse" in j[2]]:
    F.forex(sid,lbl,fn)
    log=list(F._TEXTLOG)
    p=build_svg(F.W,F.H,f"{F.OUT}/plate_{fn}.png",log,f"{OUTDIR}/{fn}.svg")
    print("FOREX SVG",p)
print("DONE")
