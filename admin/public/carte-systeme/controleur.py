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
