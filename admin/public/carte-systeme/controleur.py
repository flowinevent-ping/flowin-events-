#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CONTRÔLEUR — agent d'extraction de la cartographie Flowin / NDS 2026.
Rôle : lire les VRAIES sources (dashboard.html, pages du repo, edge functions)
et produire l'inventaire réel du système -> carte-data.json.
Signale les "raccords" manquants (pages non reliées, écarts menu/carte).
Exécution : python3 admin/public/carte-systeme/controleur.py
"""
import re, os, json, sys, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DASH = os.path.join(ROOT, "admin", "public", "dashboard.html")
PUB  = os.path.join(ROOT, "admin", "public")

def udec(x):
    return re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1),16)), x)

def read(p):
    return open(p, encoding="utf-8", errors="replace").read() if os.path.isfile(p) else ""

def extract_landings(s):
    out=[]
    for m in re.finditer(r"\{id:'(lp-[a-z0-9-]+)',\s*nom:'([^']*)',\s*deployUrl:'([^']*)'[^}]*?statut:'([^']*)'[^}]*?published:(true|false)[^}]*?moduleJeu:'([^']*)'", s):
        out.append({"id":m.group(1),"nom":udec(m.group(2)),"url":m.group(3),
                    "statut":m.group(4),"published":m.group(5)=="true","jeu":m.group(6)})
    return out

def extract_menu(s):
    # itemsSA = [ { group:'CRM', list:[ {id,ico,lbl}, ... ] }, ... ]
    m=re.search(r"const itemsSA\s*=\s*\[(.*?)\];", s, re.S)
    blk=m.group(1) if m else ""
    groups=[]
    for g in re.finditer(r"group:'([^']+)',\s*list:\[(.*?)\]\s*\}", blk, re.S):
        items=[{"id":i.group(1),"lbl":udec(i.group(2)),"ext":i.group(3)}
               for i in re.finditer(r"id:'([^']+)',ico:'[^']*',lbl:'([^']*)'(?:[^}]*?ext:'([^']*)')?", g.group(2))]
        groups.append({"group":udec(g.group(1)),"items":items})
    return groups

RPC = [
  # Socle générique — tout super-event en hérite, borné à sa période (date_d/date_f)
  {"nom":"super_event_daily",       "args":"p_se, p_date", "role":"KPI du jour, tirage, stations"},
  {"nom":"super_event_days",        "args":"p_se",         "role":"jours disponibles"},
  {"nom":"super_event_funnel",      "args":"p_se, p_date", "role":"scans -> etapes -> completion, incidents"},
  {"nom":"super_event_stations",    "args":"p_se, p_date", "role":"scans/jeux par station, demographie, liens digitaux"},
  {"nom":"super_event_clics",       "args":"p_se, p_date", "role":"fiches partenaires ouvertes, liens cliques, qui a clique"},
  {"nom":"super_event_sondage",     "args":"p_se, p_date", "role":"sondage landing (sondage_questions)"},
  {"nom":"super_event_bonus",       "args":"p_se, p_date", "role":"questions bonus des stations (cfg.quizBonusList)"},
  {"nom":"super_event_engagement",  "args":"p_se, p_date", "role":"rejeu + bonus fait/non fait, par station"},
  {"nom":"super_event_repondants",  "args":"p_se, p_date", "role":"repondants uniques (bonus x sondage, sans doublon)"},
  {"nom":"super_event_optin",       "args":"p_se, p_date", "role":"opt-in RGPD"},
  # Lots & gagnants
  {"nom":"attribuer_lot",           "args":"lot_id, joueur_id, se, station, type", "role":"reserve un code du stock, decompte, cree se_gains"},
  {"nom":"lots_stock_etat",         "args":"p_se",         "role":"etat du stock par lot + visuel + message"},
  # Exports (Google Sheet, 5 onglets)
  {"nom":"nds_export_crm",             "args":"p_token", "role":"1 ligne par PARTIE (onglet CRM_Backup)"},
  {"nom":"nds_export_joueurs_uniques", "args":"p_token", "role":"1 ligne par PERSONNE (onglet Joueurs_uniques)"},
  {"nom":"flowin_export_users",        "args":"p_token", "role":"tous les utilisateurs"},
  {"nom":"flowin_export_pros",         "args":"p_token", "role":"pros"},
  {"nom":"flowin_export_partenaires",  "args":"p_token", "role":"partenaires"},
]

TRACKING = [
  {"nom":"lib/parcours-tracking.ts", "role":"SOURCE UNIQUE : useParcoursTracking(page, evId, screen) + logClicPartenaire"},
  {"nom":"visites",          "role":"scan (etape NULL) + 1 ligne par etape franchie + incidents (etape err:*)"},
  {"nom":"partenaire_clics", "role":"ouverture de fiche (lien_key=fiche) + liens sortants"},
  {"nom":"modules traces",   "role":"nds2026, quiz, quizmaster, quizsolo, tombola, vote, spin (6+1)"},
]

def list_pages():
    return sorted(f for f in os.listdir(PUB) if f.endswith(".html")) if os.path.isdir(PUB) else []

def list_edge():
    d=os.path.join(ROOT,"admin","supabase","functions")
    d=d if os.path.isdir(d) else os.path.join(ROOT,"supabase","functions")
    return sorted(os.listdir(d)) if os.path.isdir(d) else []

def main():
    s=read(DASH)
    if not s:
        print("ERREUR: dashboard.html introuvable"); sys.exit(1)
    landings=extract_landings(s)
    menu=extract_menu(s)
    pages=list_pages()
    edge=list_edge()

    # raccords: pages référencées par le menu (ext) ou par une landing
    refd=set()
    for g in menu:
        for it in g["items"]:
            if it.get("ext"): refd.add(it["ext"].lstrip("/"))
    for l in landings:
        u=l["url"].split("/")[-1]
        if u.endswith(".html"): refd.add(u)
    orphelines=[p for p in pages if p not in refd and p not in ("dashboard.html",)]

    data={
      "genere_le": datetime.datetime.now().isoformat(timespec="seconds"),
      "menu": menu,
      "landings": landings,
      "pages": pages,
      "edge_functions": edge,
        "rpc": RPC,
        "tracking": TRACKING
    }
    out=os.path.join(os.path.dirname(__file__),"carte-data.json")
    json.dump(data, open(out,"w",encoding="utf-8"), ensure_ascii=False, indent=1)

    print(f"== CONTRÔLEUR — inventaire réel ({data['genere_le']}) ==")
    print(f"Rubriques menu : {len(menu)}  |  fonctions menu : {sum(len(g['items']) for g in menu)}")
    for g in menu: print(f"   · {g['group']}: " + ", ".join(i['lbl'] for i in g['items']))
    print(f"\nLanding pages ({len(landings)}) :")
    for l in landings: print(f"   · {l['nom']}  [{l['statut']}{'/publiée' if l['published'] else ''}] jeu:{l['jeu']} -> {l['url']}")
    print(f"\nPages du repo : {len(pages)}  |  Edge functions : {len(edge)} ({', '.join(edge)})")
    print(f"\nRACCORDS À VÉRIFIER — pages non reliées au menu/landings ({len(orphelines)}) :")
    for p in orphelines: print(f"   ⚠ {p}")
    print(f"\n-> carte-data.json écrit ({os.path.getsize(out)} octets)")

if __name__=="__main__":
    main()
