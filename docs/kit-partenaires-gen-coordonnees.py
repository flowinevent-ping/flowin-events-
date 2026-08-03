import qrcode, io, base64, os, json

VERCEL = "https://flowin-events.vercel.app"

def qr_b64(data):
    qr = qrcode.QRCode(border=1, box_size=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1b2033", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

def logo_b64(key):
    return open('/home/claude/kit/logos/{}.b64'.format(key), encoding='utf-8').read().strip()

FLOWIN_LOGO_TAG = open('/home/claude/kit/logo_img_tag.txt', encoding='utf-8').read().strip()

def darken(hexcolor, amount=0.15):
    h = hexcolor.lstrip('#')
    r,g,b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    r=int(r*(1-amount)); g=int(g*(1-amount)); b=int(b*(1-amount))
    return '#%02X%02X%02X' % (r,g,b)

CARD = """<div class="card">
  <img class="qr" src="data:image/png;base64,{qr}" alt="QR">
  <div class="info">
    <div class="nom">{nom}</div>
    <div class="lot">{lot}</div>
    <div class="coord">{tel}{sep}{email}</div>
    <div class="code">{code}</div>
  </div>
</div>"""

PAGE_TEMPLATE = """<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{partner} — Liste des gagnants (coordonnées)</title>
<style>
  @page {{ size: A4 portrait; margin: 0; }}
  * {{ margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  body {{ font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#1b2033; }}
  .page {{ width:210mm; min-height:297mm; padding:11mm 11mm 9mm; }}
  .head {{ display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid {accent}; padding-bottom:12px; margin-bottom:6px; gap:18px; }}
  .head-logo {{ height:{logo_h}px; max-width:320px; object-fit:contain; object-position:left center; }}
  .head-r {{ text-align:right; flex-shrink:0; }}
  .head-r .k {{ font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:{accent}; }}
  .head-r .t {{ font-size:13px; font-weight:800; }}
  h1 {{ font-size:17px; font-weight:900; margin:12px 0 2px; }}
  .sub {{ font-size:10.5px; color:#6b7183; margin-bottom:10px; }}
  .grid {{ display:grid; grid-template-columns:1fr 1fr; gap:6px; }}
  .card {{ border:1.2px solid #e7e9f0; border-radius:9px; padding:7px 9px; display:flex; align-items:center; gap:8px; break-inside: avoid; }}
  .qr {{ width:44px; height:44px; flex-shrink:0; }}
  .info {{ min-width:0; }}
  .nom {{ font-size:11.5px; font-weight:800; line-height:1.15; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }}
  .lot {{ font-size:8.7px; color:#6b7183; margin-top:1px; }}
  .coord {{ font-size:8.7px; color:#4b5163; margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }}
  .code {{ font-size:9px; font-family: ui-monospace, Menlo, monospace; color:{accent_dark}; font-weight:700; margin-top:1px; }}
  .conf {{ margin-top:8px; font-size:8.5px; color:#c0855a; background:#FFF7ED; border:1px solid #FED7AA; border-radius:8px; padding:6px 10px; }}
  .sign {{ margin-top:22px; text-align:center; padding:16px 20px 14px; background:linear-gradient(135deg,#1b2033,#2b3350); border-radius:14px; }}
  .sign .fw {{ height:22px; margin-bottom:8px; }}
  .sign .adl {{ font-size:8.5px; font-weight:800; letter-spacing:.24em; text-transform:uppercase; color:rgba(255,255,255,.55); }}
  .sign .pp {{ display:inline-block; margin:8px 0 10px; background:linear-gradient(135deg,#F5A100,#EC5B45); color:#fff; font-weight:800; font-size:11px; padding:5px 15px; border-radius:999px; }}
  .sign .tag {{ font-size:9.5px; color:rgba(255,255,255,.6); line-height:1.6; }}
  .sign .tag b {{ color:#fff; }}
</style>
</head>
<body>
<div class="page">
  <div class="head">
    <img class="head-logo" src="data:image/png;base64,{logo_b64}" alt="{partner}">
    <div class="head-r">
      <div class="k">Jeu Nuits du Sud 2026</div>
      <div class="t">Liste des gagnants — coordonnées clients</div>
    </div>
  </div>
  <h1>{partner} — {n} gagnant{s}</h1>
  <div class="sub">Support de vérification en caisse : nom, coordonnées, code ticket et QR (scan direct vers la page de validation).</div>
  <div class="conf">Document confidentiel — coordonnées clients à usage interne uniquement, ne pas diffuser.</div>
  <div class="grid" style="margin-top:8px">
{cards}
  </div>
  <div class="sign">
    {logo_tag}
    <div class="adl">Animation digitale</div>
    <div class="pp">Plug &amp; Play</div>
    <div class="tag">Animez · Fidélisez · Boostez<br><b>flowinevent@gmail.com</b> · 06 16 35 49 36</div>
  </div>
</div>
</body>
</html>
"""

ACCENTS = {
    "pt-pegase": "#0090C0",
    "pt-carrosserie-gp": "#1E88B0",
    "pt-bergerie": "#007030",
    "pt-giordano": "#2090D0",
    "pt-nook": "#C01020",
    "pt-utile": "#E2001A",
}
KEYS = {
    "pt-pegase": "pegase", "pt-carrosserie-gp": "carrosserie-gp", "pt-bergerie": "bergerie",
    "pt-giordano": "giordano", "pt-nook": "nook", "pt-utile": "utile",
}

data = json.load(open('/home/claude/kit/winners_data.json', encoding='utf-8'))

by_partner = {}
for row in data:
    by_partner.setdefault(row["pid"], []).append(row)

os.makedirs('/home/claude/kit/billets-coords', exist_ok=True)

for pid, rows in by_partner.items():
    partner_name = rows[0]["nom"]
    accent = ACCENTS[pid]
    cards = []
    for w in rows:
        url = VERCEL + "/lot.html?t=" + w["retrait_token"]
        tel = w["joueur_tel"] or ""
        email = w["joueur_email"] or ""
        sep = " · " if tel and email else ""
        code = w["ticket_code"] or "—"
        cards.append(CARD.format(qr=qr_b64(url), nom=w["joueur_nom"], lot=w["lot_nom"], tel=tel, sep=sep, email=email, code=code))
    n = len(rows)
    html = PAGE_TEMPLATE.format(
        partner=partner_name, accent=accent, accent_dark=darken(accent),
        logo_b64=logo_b64(KEYS[pid]), n=n, s="s" if n>1 else "",
        cards="\n".join(cards), logo_tag=FLOWIN_LOGO_TAG,
        logo_h=(84 if KEYS[pid] == "utile" else 64),
    )
    fname = "/home/claude/kit/billets-coords/{}-gagnants-coordonnees-A4.html".format(KEYS[pid])
    with open(fname, "w", encoding="utf-8") as f:
        f.write(html)
    print("OK", fname, n, "gagnants")
