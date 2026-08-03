LOGO_TAG = open('/home/claude/kit/logo_img_tag.txt', encoding='utf-8').read().strip()

def tint(hexcolor, amount=0.90):
    h = hexcolor.lstrip('#')
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    r = int(r + (255-r)*amount); g = int(g + (255-g)*amount); b = int(b + (255-b)*amount)
    return '#%02X%02X%02X' % (r,g,b)

def darken(hexcolor, amount=0.35):
    h = hexcolor.lstrip('#')
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    r=int(r*(1-amount)); g=int(g*(1-amount)); b=int(b*(1-amount))
    return '#%02X%02X%02X' % (r,g,b)

def logo_b64(key):
    return open('/home/claude/kit/logos/{}.b64'.format(key), encoding='utf-8').read().strip()

TEMPLATE = """<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{partner} — Retrait des gains Nuits du Sud</title>
<style>
  @page {{ size: A4 portrait; margin: 0; }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  html, body {{ background: #eef0f4; }}
  body {{ font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1b2033; }}
  .page {{ width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 12mm 13mm 10mm; display: flex; flex-direction: column; }}
  @media screen {{ .page {{ margin: 16px auto; box-shadow: 0 10px 40px rgba(0,0,0,.15); }} }}

  .head {{ display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid {accent}; padding-bottom: 10px; gap: 18px; }}
  .head-logo {{ height: {logo_h}px; max-width: 320px; object-fit: contain; object-position: left center; }}
  .head-r {{ text-align: right; flex-shrink: 0; }}
  .head-r .k {{ font-size: 10.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: {accent}; }}
  .head-r .t {{ font-size: 14px; font-weight: 800; }}

  h1 {{ font-size: 24px; font-weight: 900; letter-spacing: -.5px; margin: 16px 0 3px; }}
  .sub {{ font-size: 13px; color: #6b7183; margin-bottom: 16px; }}

  .rule {{ border: 2px dashed {accent}; border-radius: 14px; background: {accent_bg}; padding: 14px 20px; text-align: center; margin-bottom: 18px; }}
  .rule .lab {{ font-size: 10.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: {accent_dark}; margin-bottom: 6px; }}
  .rule .big {{ font-size: 23px; font-weight: 900; line-height: 1.15; }}
  .rule .big b {{ color: {accent_dark}; }}
  .rule .cond {{ font-size: 12px; color: #6b7183; margin-top: 6px; }}

  .rule-multi {{ border: 2px dashed {accent}; border-radius: 14px; background: {accent_bg}; padding: 12px 20px 4px; margin-bottom: 18px; }}
  .rule-multi .lab {{ font-size: 10.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: {accent_dark}; text-align: center; margin-bottom: 8px; }}
  .rule-multi .row {{ display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid rgba(0,0,0,.08); }}
  .rule-multi .row:first-of-type {{ border-top: none; }}
  .rule-multi .row .rt {{ font-size: 15px; font-weight: 900; line-height: 1.25; }}
  .rule-multi .row .rt b {{ color: {accent_dark}; }}
  .rule-multi .row .rc {{ font-size: 10.5px; color: #6b7183; white-space: nowrap; flex-shrink: 0; }}

  .secT {{ font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #9aa0b0; margin: 0 0 10px; }}

  .steps {{ display: flex; gap: 10px; margin-bottom: 18px; }}
  .step {{ flex: 1; border: 1.5px solid #e7e9f0; border-radius: 14px; padding: 13px 12px; text-align: center; }}
  .num {{ width: 34px; height: 34px; border-radius: 50%; background: {accent}; color: #fff; font-weight: 900; font-size: 17px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }}
  .step .ico {{ height: 30px; margin-bottom: 8px; }}
  .step .h {{ font-size: 14px; font-weight: 800; line-height: 1.2; }}
  .step .d {{ font-size: 11.5px; color: #6b7183; margin-top: 4px; line-height: 1.35; }}

  .screens {{ display: flex; gap: 12px; margin-bottom: 16px; }}
  .sc {{ flex: 1; border-radius: 14px; overflow: hidden; border: 1.5px solid #e7e9f0; }}
  .sc-top {{ padding: 11px 12px; display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 15px; color: #fff; }}
  .sc-ok .sc-top {{ background: #12A87B; }} .sc-bad .sc-top {{ background: {accent_dark}; }}
  .sc-dot {{ width: 11px; height: 11px; border-radius: 50%; background: #fff; }}
  .sc-body {{ padding: 12px 13px; }}
  .sc-body .act {{ font-size: 13.5px; font-weight: 800; line-height: 1.3; }}
  .sc-body .exp {{ font-size: 12px; color: #6b7183; margin-top: 5px; line-height: 1.4; }}
  .sc-body .exp b {{ color: #1b2033; }}

  .pin {{ display: flex; align-items: center; gap: 18px; background: linear-gradient(135deg,#1b2033,#2b3350); border-radius: 16px; padding: 16px 22px; color: #fff; margin-top: 12px; }}
  .pin .pico {{ width: 40px; height: 40px; flex-shrink: 0; }}
  .pin .pt {{ flex: 1; }}
  .pin .pt .l {{ font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; opacity: .85; }}
  .pin .pt .s {{ font-size: 12px; opacity: .8; margin-top: 2px; }}
  .pin .code {{ font-size: 40px; font-weight: 900; letter-spacing: 7px; background: #fff; color: #1b2033; border-radius: 11px; padding: 5px 18px; }}

  .sign {{ margin-top: auto; text-align: center; padding: 22px 24px 20px; background: linear-gradient(135deg,#1b2033,#2b3350); border-radius: 16px; }}
  .sign .fw {{ height: 28px; margin-bottom: 12px; }}
  .sign .adl {{ font-size: 9.5px; font-weight: 800; letter-spacing: .26em; text-transform: uppercase; color: rgba(255,255,255,.55); }}
  .sign .pp {{ display: inline-block; margin: 10px 0 13px; background: linear-gradient(135deg,#F5A100,#EC5B45); color: #fff; font-weight: 800; font-size: 12.5px; padding: 7px 18px; border-radius: 999px; }}
  .sign .tag {{ font-size: 10.5px; color: rgba(255,255,255,.6); line-height: 1.7; }}
  .sign .tag b {{ color: #fff; }}
</style>
</head>
<body>
<div class="page">

  <div class="head">
    <img class="head-logo" src="data:image/png;base64,{logo_b64}" alt="{partner}">
    <div class="head-r">
      <div class="k">Jeu Nuits du Sud 2026</div>
      <div class="t">Retrait des lots gagnants</div>
    </div>
  </div>

  <h1>Un client a gagné un lot ?</h1>
  <div class="sub">Mode d'emploi pour l'équipe — simple et rapide.</div>

{rules_html}

  <div class="secT">Étape par étape</div>
  <div class="steps">
    <div class="step">
      <div class="num">1</div>
      <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="{accent_dark}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><rect x="9" y="6" width="6" height="6"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
      <div class="h">Le client montre son billet</div>
      <div class="d">Le <b>QR code</b>, sur son téléphone.</div>
    </div>
    <div class="step">
      <div class="num">2</div>
      <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="{accent_dark}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
      <div class="h">Vous scannez le QR</div>
      <div class="d">Avec <b>votre téléphone</b>.</div>
    </div>
    <div class="step">
      <div class="num">3</div>
      <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="{accent_dark}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
      <div class="h">Vous tapez le code magasin</div>
      <div class="d">Le <b>PIN {pin}</b> (ci-dessous).</div>
    </div>
  </div>

  <div class="secT">Ce que l'écran affiche — et quoi faire</div>
  <div class="screens">
    <div class="sc sc-ok">
      <div class="sc-top"><span class="sc-dot"></span>Billet valable</div>
      <div class="sc-body">
        <div class="act">→ Appuyez sur « Valider le retrait du lot », puis remettez le lot gagné.</div>
        <div class="exp">L'écran confirme <b>« Validé ! »</b> : c'est terminé, le lot est remis au client.</div>
      </div>
    </div>
    <div class="sc sc-bad">
      <div class="sc-top"><span class="sc-dot"></span>Déjà utilisé</div>
      <div class="sc-body">
        <div class="act">→ Ne remettez PAS le lot.</div>
        <div class="exp">Ce billet a <b>déjà été validé</b>. Un billet ne peut être utilisé <b>qu'une seule fois</b> (la date d'utilisation s'affiche).</div>
      </div>
    </div>
  </div>

  <div class="pin">
    <svg class="pico" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
    <div class="pt">
      <div class="l">Code PIN magasin (à taper à l'étape 3)</div>
      <div class="s">À garder pour l'équipe — ne le communiquez pas au client.</div>
    </div>
    <div class="code">{pin}</div>
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

RULE_SINGLE = """  <div class="rule">
    <div class="lab">La règle à connaître</div>
    <div class="big">{big}</div>
    <div class="cond">{cond}</div>
  </div>"""

RULE_MULTI_ROW = """    <div class="row"><div class="rt">{big}</div><div class="rc">{cond}</div></div>"""

RULE_MULTI_WRAP = """  <div class="rule-multi">
    <div class="lab">Les lots à connaître ({n} lots)</div>
{rows}
  </div>"""

PARTNERS = [
    dict(id="pt-pegase", key="pegase", partner="Auto-École de l'ARA", pin="7315", accent="#0090C0",
         rules=[
            dict(big="<b>100 €</b> — formation BSR", cond="Non cumulable · 4 mois"),
            dict(big="<b>100 €</b> — formation 125 (moto)", cond="Non cumulable · 4 mois"),
            dict(big="<b>50 €</b> — permis auto", cond="Non cumulable · 4 mois"),
         ]),
    dict(id="pt-carrosserie-gp", key="carrosserie-gp", partner="Carrosserie GP", pin="8461", accent="#1E88B0",
         rules=[dict(big="« Bon de <b>30 €</b> valable dès <b>90 € d'achat</b> »",
                     cond="Entretien véhicule (freins, plaquettes, huile…) et carrosserie · non cumulable · valable 4 mois")]),
    dict(id="pt-bergerie", key="bergerie", partner="Domaine de la Bergerie", pin="4207", accent="#007030",
         rules=[dict(big="« Bon de <b>20 €</b> valable dès <b>2 nuits de location</b> »",
                     cond="Hébergements Pod et emplacement de tente · non cumulable · valable 4 mois")]),
    dict(id="pt-giordano", key="giordano", partner="Électroménager J Giordano", pin="5872", accent="#2090D0",
         rules=[dict(big="« Bon de <b>20 €</b> valable dès <b>70 € d'achat</b> »",
                     cond="Non cumulable · valable 4 mois")]),
    dict(id="pt-nook", key="nook", partner="Nook Café", pin="9153", accent="#C01020",
         rules=[
            dict(big="Formule complète — bagel, boisson, café", cond="Non cumulable · 4 mois"),
            dict(big="1 bagel offert pour 1 bagel acheté", cond="Non cumulable · 4 mois"),
            dict(big="Café gourmand offert pour 1 bagel acheté", cond="Non cumulable · 4 mois"),
         ]),
    dict(id="pt-utile", key="utile", partner="Utile Vence", pin="2684", accent="#E2001A",
         rules=[dict(big="« Bon de <b>10 €</b> valable dès <b>22 € d'achat</b> »",
                     cond="Non cumulable · valable 4 mois · Marché Utile Vence")]),
]

import os
os.makedirs('/home/claude/kit/out3', exist_ok=True)

for p in PARTNERS:
    if len(p["rules"]) == 1:
        r = p["rules"][0]
        rules_html = RULE_SINGLE.format(big=r["big"], cond=r["cond"])
    else:
        rows = "\n".join(RULE_MULTI_ROW.format(**r) for r in p["rules"])
        rules_html = RULE_MULTI_WRAP.format(n=len(p["rules"]), rows=rows)
    html = TEMPLATE.format(
        partner=p["partner"], accent=p["accent"], accent_bg=tint(p["accent"], 0.90),
        accent_dark=darken(p["accent"], 0.15),
        pin=p["pin"], rules_html=rules_html, logo_tag=LOGO_TAG, logo_b64=logo_b64(p["key"]),
        logo_h=(84 if p["key"] == "utile" else 62),
    )
    fname = "/home/claude/kit/out3/{}-retrait-gagnants-A4.html".format(p["key"])
    with open(fname, "w", encoding="utf-8") as f:
        f.write(html)
    print("OK", fname)
