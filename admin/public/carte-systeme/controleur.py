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

def extract_menu_legacy(s):
    """Menu du monolithe legacy admin/public/dashboard.html (itemsSA). Fige au 14/07,
    garde pour comparaison -- ce n'est PLUS le menu que voit Romain en prod (Next.js)."""
    # itemsSA = [ { group:'CRM', list:[ {id,ico,lbl}, ... ] }, ... ]
    m=re.search(r"const itemsSA\s*=\s*\[(.*?)\];", s, re.S)
    blk=m.group(1) if m else ""
    groups=[]
    for g in re.finditer(r"group:'([^']+)',\s*list:\[(.*?)\]\s*\}", blk, re.S):
        items=[{"id":i.group(1),"lbl":udec(i.group(2)),"ext":i.group(3)}
               for i in re.finditer(r"id:'([^']+)',ico:'[^']*',lbl:'([^']*)'(?:[^}]*?ext:'([^']*)')?", g.group(2))]
        groups.append({"group":udec(g.group(1)),"items":items})
    return groups

def extract_sidebar(root):
    """LE menu reel vu par Romain en prod : admin/components/dashboard/Sidebar.tsx (Next.js SA).
    v1 ne lisait que le legacy -> carte figee. v2 lit la vraie source."""
    p = os.path.join(root, "admin", "components", "dashboard", "Sidebar.tsx")
    s = read(p)
    if not s: return []
    m = re.search(r"const groups: NavGroup\[\] = \[(.*?)\n  \]\n", s, re.S)
    blk = m.group(1) if m else ""
    groups = []
    for g in re.finditer(r"group:\s*'([^']+)',\s*items:\s*\[(.*?)\n\s*\],\s*\},", blk, re.S):
        items = []
        for it in re.finditer(
            r"\{\s*id:\s*'([^']+)',\s*icon:\s*'[^']*',\s*label:\s*'([^']*)'(?:,\s*count:[^,}]+)?(?:,\s*live:[^,}]+)?,\s*href:\s*'([^']*)'",
            g.group(2)):
            items.append({"id": it.group(1), "label": it.group(2), "href": it.group(3)})
        groups.append({"group": g.group(1), "items": items})
    return groups

def list_app_routes(root, subdir):
    """Toutes les routes reelles Next.js (App Router) sous admin/app/<subdir> --
    un page.tsx = une route, segments dynamiques [xxx] inclus."""
    base = os.path.join(root, "admin", "app", subdir)
    if not os.path.isdir(base): return []
    out = []
    for dirpath, _, filenames in os.walk(base):
        if "page.tsx" in filenames:
            rel = os.path.relpath(dirpath, os.path.join(root, "admin", "app"))
            route = "/" + rel.replace(os.sep, "/")
            if route.endswith("/."): route = route[:-2]
            out.append(route)
    return sorted(out)

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
    menu_legacy=extract_menu_legacy(s)
    sidebar=extract_sidebar(ROOT)
    routes_dashboard=list_app_routes(ROOT, "dashboard")
    routes_pro=list_app_routes(ROOT, "pro")
    pages=list_pages()
    edge=list_edge()

    # hrefs reellement presents dans la Sidebar Next.js (LE menu de prod)
    sb_hrefs = [it["href"] for g in sidebar for it in g["items"]]
    sb_hrefs_set = set(sb_hrefs)
    sb_hrefs_html = {h.lstrip("/") for h in sb_hrefs if h.endswith(".html")}
    # une route dynamique (ex /dashboard/operations/[id]) n'a jamais de href direct dans la sidebar
    # (on y accede par clic depuis une liste) -> exclue du calcul de "route orpheline"
    def est_dynamique(r): return "[" in r

    # 1) liens morts sidebar -> route interne (/dashboard/*, /pro/*) sans page.tsx correspondant
    routes_reelles = set(routes_dashboard) | set(routes_pro)
    liens_morts = [h for h in sb_hrefs
                   if (h.startswith("/dashboard") or h.startswith("/pro"))
                   and h not in routes_reelles]

    # 2) routes reelles jamais reliees dans la sidebar (hors dynamiques, hors racines /dashboard et /pro)
    routes_orphelines = [r for r in (routes_dashboard + routes_pro)
                          if not est_dynamique(r) and r not in sb_hrefs_set
                          and r not in ("/dashboard", "/pro")]

    # 3) pages HTML publiques jamais reliees : ni sidebar, ni menu legacy (ext), ni landing
    refd_legacy=set()
    for g in menu_legacy:
        for it in g["items"]:
            if it.get("ext"): refd_legacy.add(it["ext"].lstrip("/"))
    for l in landings:
        u=l["url"].split("/")[-1]
        if u.endswith(".html"): refd_legacy.add(u)
    refd_all = refd_legacy | sb_hrefs_html
    orphelines=[p for p in pages if p not in refd_all and p not in ("dashboard.html",)]

    data={
      "genere_le": datetime.datetime.now().isoformat(timespec="seconds"),
      "sidebar_prod": sidebar,
      "menu_legacy_dashboard_html": menu_legacy,
      "routes_dashboard": routes_dashboard,
      "routes_pro": routes_pro,
      "liens_morts_sidebar": liens_morts,
      "routes_orphelines": routes_orphelines,
      "landings": landings,
      "pages_html_publiques": pages,
      "pages_html_orphelines": orphelines,
      "edge_functions": edge,
      "rpc": RPC,
      "tracking": TRACKING
    }
    out=os.path.join(os.path.dirname(__file__),"carte-data.json")
    json.dump(data, open(out,"w",encoding="utf-8"), ensure_ascii=False, indent=1)

    n_sb_groups=len(sidebar); n_sb_items=sum(len(g["items"]) for g in sidebar)
    n_leg_groups=len(menu_legacy); n_leg_items=sum(len(g["items"]) for g in menu_legacy)
    print(f"== CONTRÔLEUR v2 — inventaire réel ({data['genere_le']}) ==")
    print(f"\nSidebar Next.js (PROD, admin/components/dashboard/Sidebar.tsx) : {n_sb_groups} groupes / {n_sb_items} entrées")
    for g in sidebar: print(f"   · {g['group']}: " + ", ".join(i['label'] for i in g['items']))
    print(f"\nMenu legacy (dashboard.html, non affiché en prod) : {n_leg_groups} rubriques / {n_leg_items} entrées")
    print(f"\nRoutes App Router /dashboard/* : {len(routes_dashboard)}  (dont dynamiques: {sum(1 for r in routes_dashboard if est_dynamique(r))})")
    print(f"Routes App Router /pro/*       : {len(routes_pro)}  (dont dynamiques: {sum(1 for r in routes_pro if est_dynamique(r))})")
    print(f"\nLANDING PAGES ({len(landings)}) :")
    for l in landings: print(f"   · {l['nom']}  [{l['statut']}{'/publiée' if l['published'] else ''}] jeu:{l['jeu']} -> {l['url']}")
    print(f"\nEdge functions : {len(edge)} ({', '.join(edge)})")
    print(f"\n⚠ LIENS MORTS SIDEBAR — href sans route réelle ({len(liens_morts)}) :")
    for h in liens_morts: print(f"   ⚠ {h}")
    print(f"\n⚠ ROUTES ORPHELINES — page.tsx existe, jamais reliée dans la Sidebar ({len(routes_orphelines)}) :")
    for r in routes_orphelines: print(f"   ⚠ {r}")
    print(f"\n⚠ PAGES HTML PUBLIQUES ORPHELINES — ni sidebar, ni menu legacy, ni landing ({len(orphelines)}/{len(pages)}) :")
    for p in orphelines: print(f"   ⚠ {p}")
    print(f"\n-> carte-data.json écrit ({os.path.getsize(out)} octets)")

if __name__=="__main__":
    main()
