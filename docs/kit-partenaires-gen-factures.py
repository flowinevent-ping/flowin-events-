import json, os

opconsult_logo = open('/home/claude/kit/logos/opconsult.b64', encoding='utf-8').read().strip()

TEMPLATE = """<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Facture {numero}</title>
<style>
  @page {{ size: A4 portrait; margin: 0; }}
  * {{ margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  body {{ font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#1b2033; }}
  .page {{ width:210mm; min-height:297mm; padding:16mm 16mm 14mm; background:#fff; }}
  .head {{ display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #7C2D92; padding-bottom:14px; margin-bottom:20px; }}
  .head-l img {{ height:48px; }}
  .head-l .cap {{ font-size:10px; color:#6b7183; margin-top:6px; }}
  .head-r {{ text-align:right; }}
  .head-r .eyebrow {{ font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#7C2D92; }}
  .head-r h1 {{ font-size:26px; font-weight:900; margin:4px 0; }}
  .head-r .num {{ font-size:13px; color:#6b7183; }}
  .meta {{ display:flex; justify-content:space-between; gap:24px; margin-bottom:24px; }}
  .box {{ flex:1; border:1.5px solid #e7e9f0; border-radius:12px; padding:14px 16px; }}
  .box .lab {{ font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#9aa0b0; margin-bottom:6px; }}
  .box .nm {{ font-size:14px; font-weight:800; }}
  .box .ln {{ font-size:12px; color:#4b5163; line-height:1.5; }}
  table {{ width:100%; border-collapse:collapse; margin-bottom:20px; }}
  th {{ text-align:left; font-size:10.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#9aa0b0; border-bottom:2px solid #e7e9f0; padding:8px 6px; }}
  td {{ font-size:13px; padding:12px 6px; border-bottom:1px solid #e7e9f0; }}
  .r {{ text-align:right; }}
  .totals {{ margin-left:auto; width:280px; }}
  .totals .row {{ display:flex; justify-content:space-between; padding:6px 0; font-size:13px; }}
  .totals .ttc {{ font-size:18px; font-weight:900; border-top:2px solid #1b2033; padding-top:10px; margin-top:4px; }}
  .pay {{ margin-top:26px; background:#F7F1FA; border:1.5px dashed #7C2D92; border-radius:12px; padding:14px 18px; font-size:12px; color:#4b5163; line-height:1.6; }}
  .pay b {{ color:#1b2033; }}
  .status {{ display:inline-block; background:#12A87B; color:#fff; font-weight:800; font-size:11px; letter-spacing:.06em; text-transform:uppercase; padding:4px 12px; border-radius:999px; margin-top:6px; }}
  .foot {{ margin-top:40px; font-size:9.5px; color:#9aa0b0; line-height:1.6; border-top:1px solid #e7e9f0; padding-top:12px; }}
</style>
</head>
<body>
<div class="page">
  <div class="head">
    <div class="head-l">
      <img src="data:image/png;base64,{opconsult_logo}" alt="OPConsult">
      <div class="cap">Solution marketing événementiel · OPConsult (BAITA EURL)</div>
    </div>
    <div class="head-r">
      <div class="eyebrow">OPConsult × Flowin</div>
      <h1>FACTURE</h1>
      <div class="num">N° {numero} · {date_emission}</div>
      <div class="status">{statut}</div>
    </div>
  </div>

  <div class="meta">
    <div class="box">
      <div class="lab">Émetteur</div>
      <div class="nm">OPConsult</div>
      <div class="ln">BAITA EURL · 40 rue des Arcs, 06140 Vence<br>
      SIRET 512 026 907 00018 · RCS Grasse 512 026 907<br>
      TVA FR82 512 026 907<br>
      04 93 59 91 37 · info@opconsult.co</div>
    </div>
    <div class="box">
      <div class="lab">Client</div>
      <div class="nm">{raison_sociale}</div>
      <div class="ln">{adresse}<br>{cp} {ville}{email_line}</div>
      <div class="ln" style="margin-top:6px;color:#9aa0b0">Réf. devis {devis_ref}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>Désignation</th><th class="r">Qté</th><th class="r">PU HT</th><th class="r">Total HT</th></tr></thead>
    <tbody>
{lignes_html}
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Total HT</span><span>{total_ht} €</span></div>
    <div class="row"><span>TVA ({tva_taux}%)</span><span>{tva_montant} €</span></div>
    <div class="row ttc"><span>Total TTC</span><span>{total_ttc} €</span></div>
  </div>

  <div class="pay">
    Règlement par virement — IBAN <b>FR76 1460 7003 3470 2211 6462 345</b> · BIC <b>CCBPFRPPMAR</b><br>
    Merci d'indiquer la référence <b>{numero}</b> lors du virement.
  </div>

  <div class="foot">
    Flowin est une solution marketing événementiel éditée par OPConsult, marque de BAITA EURL · 40 rue des Arcs, 06140 Vence · SIRET 512 026 907 00018 · RCS Grasse 512 026 907 · TVA intracommunautaire FR82 512 026 907 · IBAN FR76 1460 7003 3470 2211 6462 345 · BIC CCBPFRPPMAR.
  </div>
</div>
</body>
</html>
"""

LIGNE_ROW = """      <tr><td>{label}</td><td class="r">{qte}</td><td class="r">{pu_ht} €</td><td class="r">{total_ht} €</td></tr>"""

FACTURES = [
    dict(numero="FL-2026-0002-01", key="nook-cafe", date_emission="10/07/2026",
         client=dict(raison_sociale="Nook Café", adresse="7 rue Louis Funel", cp="06140", ville="Vence", email="contact.nookcoffee@gmail.com", devis_ref="FL-2026-0002"),
         lignes=[dict(label="Sponsor officiel", qte=1, pu_ht=500, total_ht=500)],
         total_ht=500, tva_taux=20, tva_montant=100, total_ttc=600, statut="Émise"),
    dict(numero="FL-2026-0007-01", key="utile-vence", date_emission="22/07/2026",
         client=dict(raison_sociale="Utile Vence", adresse="40 Pl. du Grand Jardin", cp="", ville="Vence", email=None, devis_ref="FL-2026-0007"),
         lignes=[dict(label="Sponsor officiel", qte=1, pu_ht=500, total_ht=500)],
         total_ht=500, tva_taux=20, tva_montant=100, total_ttc=600, statut="Émise"),
    dict(numero="FL-2026-0005-01", key="domaine-bergerie", date_emission="03/08/2026",
         client=dict(raison_sociale="Domaine de la Bergerie", adresse="1330 Chem. de la Sine", cp="06140", ville="Vence", email=None, devis_ref="FL-2026-0005"),
         lignes=[dict(label="Animation", qte=1, pu_ht=500, total_ht=500)],
         total_ht=500, tva_taux=20, tva_montant=100, total_ttc=600, statut="Émise"),
    dict(numero="FL-2026-0001-01", key="charvolin-allianz", date_emission="03/08/2026",
         client=dict(raison_sociale="Clarence CHARVOLIN EI (Allianz)", adresse="326 Avenue Rhin & Danube, Estoril B", cp="06140", ville="Vence", email="clarence.charvolin@allianz.fr", devis_ref="FL-2026-0001"),
         lignes=[dict(label="Sponsor officiel", qte=1, pu_ht=700, total_ht=700)],
         total_ht=700, tva_taux=20, tva_montant=140, total_ttc=840, statut="Émise"),
]

os.makedirs('/home/claude/kit/factures', exist_ok=True)

for f in FACTURES:
    lignes_html = "\n".join(LIGNE_ROW.format(**l) for l in f["lignes"])
    c = f["client"]
    email_line = "<br>{}".format(c["email"]) if c["email"] else ""
    html = TEMPLATE.format(
        numero=f["numero"], date_emission=f["date_emission"], statut=f["statut"],
        opconsult_logo=opconsult_logo,
        raison_sociale=c["raison_sociale"], adresse=c["adresse"], cp=c["cp"], ville=c["ville"],
        email_line=email_line, devis_ref=c["devis_ref"],
        lignes_html=lignes_html,
        total_ht=f["total_ht"], tva_taux=f["tva_taux"], tva_montant=f["tva_montant"], total_ttc=f["total_ttc"],
    )
    fname = "/home/claude/kit/factures/{}-facture-{}.html".format(f["key"], f["numero"])
    with open(fname, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("OK", fname)
