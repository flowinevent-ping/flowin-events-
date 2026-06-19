# HANDOFF — Flowin / Nuits du Sud 2026

> Source de vérité du reste-à-faire. Mis à jour le **18/06/2026 (soir)**.
> HEAD origin/main attendu : **d0cbfac**

---

## ⚡ BOOTSTRAP INTER-SESSIONS (à faire en premier)

Une session a soit (A) bash + git + GitHub, soit (B) seulement Supabase MCP, soit (C) les deux.
**Vérifier ce qu'on a AVANT de travailler :**

1. **Git / GitHub** (si bash dispo) :
   - `cd /home/claude/flowin` ou cloner : `git clone https://<TOKEN>@github.com/flowinevent-ping/flowin-events-.git .`
   - `git fetch origin && git reset --hard origin/main`
   - `git log --oneline -3` doit montrer d0cbfac ou plus récent
   - Le token GitHub n'est PAS dans ce fichier (push protection). Il est dans `HANDOFF-AVEC-TOKEN.md` que Romain garde sur son Mac et réuploade en zip.
   - Romain uploade le zip -> lire le token -> `git remote set-url origin https://<TOKEN>@github.com/flowinevent-ping/flowin-events-.git`

2. **Supabase MCP** (si dispo) : `execute_sql` trivial `SELECT 1` sur project_id `ywcqtupgoxfzkddqkztk`.

3. Si un accès manque et qu'il est nécessaire -> le signaler UNE fois, rediriger, ne pas continuer en mode dégradé.

4. **Filesystem se réinitialise entre sessions** : seul le code pushé persiste. Réinstaller Acorn si besoin : `npm install acorn --prefix /home/claude/.acorn`

---

## ACCÈS & RÉFÉRENCES

### GitHub
- Repo : `flowinevent-ping/flowin-events-` (public)
- Token PAT fine-grained (Contents R/W, expire 16 sep 2026) : voir `HANDOFF-AVEC-TOKEN.md` (hors repo)
- Remote push : `https://<TOKEN>@github.com/flowinevent-ping/flowin-events-.git`
- Commit author : `Romain Collin <romain@flowin.events>`

### Supabase
- Project ID : `ywcqtupgoxfzkddqkztk` · Région : `eu-west-1`
- Anon key publique (OK en clair par design) : `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1`
- DDL/DML uniquement via MCP (`execute_sql`, `apply_migration`). bash ne joint pas `*.supabase.co`.
- `execute_sql` ne retourne que le résultat de la DERNIERE requête si plusieurs -> envoyer une par une.
- PostgREST hard cap 1000 lignes -> boucle offset pour tout fetch volumétrique.

### Vercel
- URL prod : `https://flowin-events.vercel.app` · Auto-deploy depuis `main`, root `/admin`.
- Jamais de déploiement manuel : push sur main = redeploy auto (1-2 min).
- Pages : `/nds-partenaire.html`, `/nds-partenaire-presentation.html`, `/demos.html`, `/dashboard.html`, `/bon-achat-template.html`

### NDS 2026
- Super Event ID : `se-nds-2026` · Client : Ville de Vence · Festival : 9-18 juillet 2026
- Stations : `BAR`, `CAISSES`, `ECRAN`, `TABLETTE`
- Contacts ville : Cécile (événementiel), Anne-Lou & Camille (RSE/lots)

### BAITA (OPConsult / Flowin)
- Raison sociale : **BAITA** — SARL au capital de 5 000 € (greffe : SARL, pas EURL)
- 40 rue des Arcs, 06140 Vence · Tél : 04 93 59 91 37 / 06 16 35 49 36
- Email Flowin : `flowinevent@gmail.com` · Email OPConsult : `info@opconsult.co`
- SIREN : `512 026 907` · SIRET (siège) : `512 026 907 00018`
- TVA intracommunautaire : `FR82 512 026 907`
- RCS : `512 026 907 R.C.S. Grasse` (inscrit le 25/05/2009)
- Capital social : 5 000 €
- IBAN : `FR76 1460 7003 3470 2211 6462 345` · BIC : `CCBPFRPPMAR`
- ℹ️ Bon de commande/proforma affiché en HT seul (choix Romain). TVA/TTC uniquement sur la facture définitive — régime TVA à confirmer pour la facture (réel 20 % vs franchise base art. 293 B).

---

## FAIT (sessions du 18/06/2026)

### Migrations Supabase — appliquées en prod (NE PAS REJOUER)
Trace SQL : `docs/sql/nds-bons-achat.sql`. Vérifié prod : 8/8 colonnes, vue OK, fonction OK.
- `se_gains` : colonnes partenaire_id, montant, station, gagnant_nom/email/tel, qr_token, valide_jusqu_au + index
- Vue `v_bons_achat_nds` · Fonction `next_ticket_code_nds(station)` -> NDS-BAR-2026-00001 etc.

### Landing partenaire (`admin/public/nds-partenaire.html`)
- Typo agrandie (corps 12-17px), chiffres clés 32px, chiffres hero en gold gras
- Topbar : demi-lune retirée, logo NDS 40px, Flow(blanc)in(teal #00B4A0)
- Encart « L'essentiel » déplacé vers #marche
- Carousel parcours : dots pagination iOS-safe + CTA « Voir les offres » (commit d0cbfac)

### Présentation partenaire (`admin/public/nds-partenaire-presentation.html` + mockup)
- Logo NDS 44px + Flow(blanc)in(teal), 5 slides, nav bas, dots

### Template bon d'achat (`admin/public/bon-achat-template.html`)
- 12 variables {{}}, cobrand NDSxFlowin, montant, gagnant, conditions, talon QR

### Hub demos (`admin/public/demos.html`)
- Carte présentation NDS + boutons Partager iOS-safe

### Emails prospection (livrés en chat)
- Version froide + suite à échange, 2 liens, clôture 9 juillet, signature Romain

---

## RESTE À FAIRE

**Priorité acquisition (50 commerces en ~10 jours, clôture 9 juillet)**

a) Email auto souscription partenaire -> flowinevent@gmail.com
   - Trigger après form pack sur nds-partenaire.html · Edge Function Supabase à créer
   - Techno à valider : Resend ? SMTP Google ? · Contenu : coordonnées, pack, pièces jointes, lien BC + proforma

b) Bon de commande + facture proforma 2026 — ✅ FAIT : `admin/public/bon-commande-nds.html` (version Romain, offres à cocher, HT+TVA+TTC, SIRET/TVA/RCS BAITA remplis). Branché au mail souscription via PROFORMA_URL (Edge Function v3).
   - SIRET BAITA reçu (512 026 907 00018), mentions légales câblées · 14 variables {{}} · BC en HT seul (pros voient HT ; TVA/TTC réservés à la facture définitive)
   - Reste : générer le doc rempli depuis le dashboard (ou à la main) + brancher PROFORMA_URL dans la notif email

c) CRM Retours dashboard SA (commit 77d7607) — non validé visuellement
   - Table crm_retours, vue dans renderCrmRetours() de dashboard.html

d) Logo sidebar dashboard SA — à vérifier

**Parcours joueur NDS (Next.js)**
- Validation bout-en-bout device iOS Safari
- Bug image de fond NDS (.stage cover -> zones blanches + texte illisible)
- Câblage carte -> fiches stations avec instructions par station

**Structurel** : migration Next.js post-NDS 2026

---

## RÈGLES PERMANENTES

- Preuve avant « fait » : jamais terminé sans commit-hash + grep/DB.
- Miroir dashboard.html : avant push -> cp vers static/ -> md5sum identiques.
- Vanilla JS : Acorn ecmaVersion:2020 0 erreur. iOS-safe : var / .indexOf() / function — JAMAIS spread, Object.assign, .includes(), template literals dans innerHTML.
- Next.js : tsc --noEmit + next build (« Compiled successfully ») avant push.
- Modules maîtres (NDS2026Client.tsx, SpinClient.tsx, QuizClient.tsx) : JAMAIS modifiés. Config via cfg Supabase.
- Token GitHub : JAMAIS en clair dans un commit.
- Formulaires : Homme / Femme (+ vide) uniquement — jamais « Autre ».
- Divergence git : git fetch origin && git reset --hard origin/main.
- Tester sur device ce qui ne rend pas en headless.

---

## DIAGNOSTIC RAPIDE NDS (1 appel Supabase)
`SELECT cfg ? 'tirage', jsonb_array_length(cfg->'quizBonusList'), cfg->'quizBanques' FROM events WHERE id='ev-nds-2026';`

---
FIN HANDOFF
