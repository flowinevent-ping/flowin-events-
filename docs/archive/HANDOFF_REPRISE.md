# FLOWIN — HANDOFF DE REPRISE (session du 2026-06-02)

## 0. CONTEXTE PROJET
- **Flowin** = SaaS B2B gamification d'events physiques. Propriétaire : Romain (OPConsult / BAITA EURL, Vence 06140).
- Le visiteur scanne un QR, joue (Quiz/Spin/Tombola/Vote/QuizSolo/QuizMaster), laisse ses coordonnées CRM, entre en tirage.
- Romain = Super Admin. Les clients ("Pros") ont un dashboard read-only.
- **Ton attendu : factuel, technique, français, direct. Pas d'emphase émotionnelle.**

## 1. ACCÈS & CREDENTIALS
- **Repo** : `flowinevent-ping/flowin-events-`, cloné dans `/home/claude/flowin`
- **GitHub token** : `<GITHUB_TOKEN>`
- **Push** : `git push https://<GITHUB_TOKEN>@github.com/flowinevent-ping/flowin-events-.git main`
- **Vercel** : auto-deploy sur push `main`. Prod = `https://flowin-events.vercel.app`
- **Supabase** : project `ywcqtupgoxfzkddqkztk`, eu-west-1. anon key `<SUPABASE_ANON_KEY>`. Outil MCP Supabase dispo (`execute_sql`, `apply_migration`).
- **SANDBOX** : `*.supabase.co` et `flowin-events.vercel.app` BLOQUÉS → utiliser MCP Supabase pour la base, build pour valider (pas de screenshot prod possible).
- **Chromium** (screenshots fichiers locaux) : `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (args `--no-sandbox`)
- **Acorn** (validation JS HTML) : `node node_modules/.bin/acorn --ecma2020 --silent` dans `/home/claude/flowin`

## 2. RÈGLE ABSOLUE (cause de la majorité des erreurs)
**LE REPO A DES DOUBLONS** : version statique `.html` (dans `public/`) ET version Next.js (`app/.../Client.tsx`).
**Les URLs de prod servent TOUJOURS la version Next.js, JAMAIS le `.html`.**
→ Avant TOUTE modif : vérifier quel fichier est réellement servi.
- Landing prod `/landing` = `admin/app/landing/LandingClient.tsx` (+ `page.tsx` qui charge Supabase table `landings` id=`ld-flowin-demo`, ISR 60s). Le `.html` statique `admin/public/landing/index.html` N'EST PAS servi → ne pas y travailler.
- Parcours spin `/parcours/spin` = `admin/app/parcours/spin/SpinClient.tsx` (pas le `.html`).
- Dashboard SA = `admin/public/dashboard.html` (vrai fichier servi sur `/dashboard.html`, vanilla JS ~801KB) + miroir `admin/public/static/dashboard.html`.

## 3. RÈGLE MASTER (ordre explicite de Romain, NON négociable)
- **Les modules master ne se touchent JAMAIS.** Le code des parcours (`SpinClient.tsx`, `QuizClient.tsx`, etc.) = templates FIXES et NEUTRES.
- **Le design d'un event se configure au niveau de l'EVENT** (sa `cfg` Supabase + `ev.couleur`), PAS dans le code master.
- Croix Rouge et Flowin demo sont des events EN PLUS qui ne doivent jamais modifier l'UX/UI des jeux master.
- `parcoursCSS` dans `admin/lib/parcours.ts` est PARTAGÉ par TOUS les parcours → ne jamais y mettre de style spécifique à un event.

## 4. ARCHITECTURE MASTER CONFIGURABLE (mise en place cette session — à respecter)
`SpinClient.tsx` est désormais NEUTRE et lit ses options depuis `ev.cfg` :
- `cfg.btob` (bool) → form B2B (enseigne + secteur au lieu de tranche d'âge)
- `cfg.replayable` (bool) → pas de blocage "déjà joué" (démo rejouable)
- `cfg.hidePlaceholders` (bool) → champs sans placeholder
- `cfg.winTitle` (string) → titre écran de gain (ex "✦ FÉLICITATIONS ✦")
- `cfg.winCtaLabel` + `cfg.winCtaPhone` → bouton CTA tel sur écran gain
- `cfg.backUrl` (string) → bouton "retour" (gère iframe via window.top + plein écran)
- Défaut (toutes absentes) = master neutre. Croix Rouge / Pâques = aucune option → design master.
- `SECTEURS` (8 personas) exporté depuis `admin/lib/parcours.ts`.
- **Même principe à appliquer aux AUTRES modules** (Quiz, Vote, Tombola, QuizSolo, QuizMaster) si besoin de design par event : config, jamais code.

## 5. DONNÉES SUPABASE (vérifiées cette session)
- Table `events` : `ev-paques` (Quiz, btoc, 186 joueurs), `ev-flowin-demo` (Spin, btob, options Flowin dans cfg), `ev-crf-2026` (Croix Rouge, btoc), `ev-tombola-crf`.
- Table `super_events` : `se-crf-vence-2026` (live), `se-nds-2026` (upcoming). **INTACTS, jamais touchés.**
- Table `landings` id=`ld-flowin-demo` : cfg contient hero/proof/profils/modules/pricing/cta_section. **Tout le wording landing est piloté ici** (clés profils = `before`/`how`/`after`/`metrics`, `ico`=classe Tabler PAS emoji).
- Table `joueurs` : 214 lignes. Pour ev-paques : `ddn` REMPLIE (186) → tranches d'âge calculables ; `genre`/`age_tranche`/`decouverte`/`tags` VIDES ; `ts` tous à 21h (artefact migration, pic horaire NON fiable).
- Tables `gas_backup_log`, `envois_log` VIDES. `participations` = 9 lignes total, 0 pour Pâques.

## 6. PROBLÈME DONNÉES PÂQUES (non résolu, gelé)
- L'ancien dashboard Pâques (Netlify `https://fancy-hamster-6f1905.netlify.app/?dashboard`, thème rose #D4537E) affiche des données RICHES : 192 participants, 43 ans âge moyen, genre 39%H/61%F, tranches d'âge (81 pour 36-50), venu avec, événements préférés, intention retour (66/3/1%), comment connu (Affiche 42%/Mairie 13%/FB 9%/Insta 7%), style musical, participants par soir (04avr:80...).
- **Ces données ne sont PAS dans Supabase** — migration Netlify→Vercel incomplète. web_fetch ne lit que les meta HTML (JS non exécuté).
- Sur la landing, ces chiffres sont affichés comme APERÇU DE DÉMONSTRATION (saisis depuis les captures de Romain), PAS branchés live.
- Pour les récupérer vraiment : besoin du CODE SOURCE de l'app Netlify (JSON/JS), que Romain n'a pas fourni. GELÉ.

## 7. VALEURS / WORDING VALIDÉS (landing)
- Triptyque officiel : **Captez · Dynamisez · Fidélisez** (PAS "Convertissez")
- Promesse hero : "Transformez votre passage en prospect, vos prospects en clients"
- Baseline : "Flowin : boostez, mesurez, gardez le contact"
- Preuve (proof Supabase) : **980 contacts · 5 dates · 100% opt-in** + citation "En 5 dates, nous avons capté 980 personnes qui ont accepté d'être recontactées." (SANS Vence/Pâques en auteur)
- Gamme : ANIMER (6 modules, custom, marque blanche) / PILOTER (dashboard, stats genre/âge/opt-in/géo, base réutilisable) / MUTUALISER (super-events, sponsoring)
- Tarifs : 189€ HT/event (≤1000) · 289€/mois (≤3000, Recommandé) · sur devis. Chef de projet dédié à votre compte.
- Pictogrammes Tabler partout (PAS emojis).
- Profils (6) avec fil rouge Captez/Dynamisez/Fidélisez. Restaurant = soirées thème/apéro/heures creuses/gains conso-repas-AR VTC. Réseau = mutualisation + chiffres partenaires. + "mieux comprendre/communiquer/cibler/répondre à la demande".

## 8. STRUCTURE LANDING ACTUELLE (LandingClient.tsx, ordre des sections)
`s-hero` → `s-probleme` (6 questions) → `s-besoins` (Captez/Dynamisez/Fidélisez) → `s-demo` (iframe vrai parcours spin, 300×620, scale 0.708) → `s-profils` (Supabase, onglets before/how/after) → `s-proof` (980/5/100) → `s-modules` → `s-stats` (visuel dashboard pro enrichi) → `s-gamme` (Animer/Piloter/Mutualiser) → `s-accomp` → `s-pricing` → `s-cta`.
- DEMO_URL = `https://flowin-events.vercel.app/parcours/spin?ev=ev-flowin-demo`
- Responsive : `.dash-cols`, `.dash-kpis`, `.gamme-grid`, `.besoins-grid` → 1 col (ou 2 pour kpis) en mobile via @media 680px.

## 9. PROCÉDURE DE BUILD/PUSH (obligatoire avant chaque push Next.js)
```
cd /home/claude/flowin/admin
npx tsc --noEmit            # doit donner 0 erreur
npx next build             # "Compiled successfully" (warning font Google = cosmétique, ignorer)
cd /home/claude/flowin
rm -rf admin/.next
git checkout admin/tsconfig.tsbuildinfo admin/package-lock.json
git add <fichiers>
git -c user.email="claude@flowin.dev" -c user.name="Claude" commit -m "..."
git push https://ghp_...@github.com/flowinevent-ping/flowin-events-.git main
# si rejet : git -c user.email=... pull --no-rebase --no-edit <url> main puis re-push
```
- Pour le dashboard.html (statique) : Acorn 0 erreur + miroir `public/dashboard.html` → `public/static/dashboard.html`.
- Contraintes iOS Safari dashboard.html : `var` only, `.indexOf()` pas `.includes()`, pas de spread/Object.assign.

## 10. HISTORIQUE COMMITS CETTE SESSION (du + ancien au + récent)
- `5104a47`..`d711d00` : design roue spin, écran gain teal, form B2B (étaient EN DUR dans master — corrigé après)
- `3c6b5f5` : responsive desktop parcoursCSS — **A CAUSÉ le bug UX master** (reverté)
- `6db4a4b` : wording landing dans MAUVAIS fichier (.html statique non servi)
- `55545bd` : wording dans le BON fichier LandingClient.tsx (Dynamisez, chef de projet dédié)
- `eabdc79` : sections Problème + Gamme
- `6e79017` : CTA hero ouvre vrai parcours, démo iframe, opt-in
- `90075be` : visuel stats géo, mobile iframe scale, placeholders retirés
- `cb10ad3` : bouton retour vers landing Flowin
- `7025d4b` : preuve 980/5/100 (sans Vence/Pâques)
- `71d845d` : démo rejouable, GAME TIME retiré, stats Pâques âge réel
- `afea9c2` : **REVERT CSS master d'origine** (430px, sans cadre desktop)
- `436c361` : **master Spin restauré neutre + options configurables par cfg** (Flowin via config, Croix Rouge inchangé)
- `7deffa3` : **visuel stats parcours pro enrichi** (KPIs 192/43ans/100%/74%, âge, genre, géo, intention retour, comment connu)

## 11. ÉTAT ACTUEL (au dernier push 7deffa3)
✅ Master Spin restauré neutre + configurable par event (cfg)
✅ Flowin demo : design via sa config Supabase (btob, rejouable, écran gain FÉLICITATIONS, CTA tel, retour landing, sans placeholders)
✅ Croix Rouge / Pâques : aucune option → master neutre (vérifié en base)
✅ Super events intacts
✅ Landing : wording validé + visuel stats parcours pro enrichi

### VÉRIFICATION FINALE (faite en fin de session — RIEN N'EST EFFACÉ)
Romain a craint que les modifs Flowin events + landing soient effacées. VÉRIFIÉ factuellement :
- **GitHub** : HEAD distant `main` = `7deffa3` (= dernier commit local). Tous les commits sont bien poussés. `git ls-remote ... refs/heads/main` confirme `7deffa3`.
- **Supabase** : config ev-flowin-demo intacte (btob+winTitle+backUrl=true), landing 6 profils, proof 980/5, baseline OK, 2 super events. RIEN d'effacé.
- **CAUSE de l'impression d'effacement** : cache Vercel + ISR 60s (landing) + cache navigateur. La prod tarde à refléter. → TOUJOURS recharger en NAVIGATION PRIVÉE après un deploy, attendre 2-3 min + 60s ISR.
- ⚠️ Lors d'un `git fetch` puis `git log FETCH_HEAD`, un cache peut afficher d'ANCIENS commits trompeurs. Utiliser `git ls-remote ... refs/heads/main` pour le vrai HEAD distant.

## 12. À FAIRE / REPRENDRE (TODO)
### A. ERREUR UX/UI MODULES MASTER — À VÉRIFIER ENTIÈREMENT (point rouvert par Romain)
**NATURE DE L'ERREUR COMMISE (à ne pas reproduire) :** pendant cette session, l'UX/UI des JEUX MASTER a été modifiée de DEUX façons interdites :
  1. `parcoursCSS` (lib/parcours.ts) modifié pour un "responsive desktop" (cadre centré 480px + fond dégradé) → a changé l'apparence de TOUS les parcours master (Quiz, Vote, Tombola, Spin, QuizSolo, QuizMaster). REVERTÉ en `afea9c2` (retour à 430px, sans media query).
  2. `SpinClient.tsx` (module master Spin) bourré de code EN DUR spécifique à l'event Flowin (couleur teal, "FÉLICITATIONS", "Contactez-nous", tel, redirection landing, form B2B, ev-flowin-demo). RESTAURÉ neutre en `436c361`, options déplacées dans `ev.cfg`.

**CE QUI RESTE À VÉRIFIER (non terminé) :**
- Confirmer APRÈS déploiement Vercel que les parcours master (Quiz/Vote/Tombola/Spin/QuizSolo/QuizMaster) ont bien retrouvé leur UX/UI D'ORIGINE (comparer avec l'état du commit `f670fee` = migration initiale). Le revert a été fait sur Spin + parcoursCSS, mais PAS vérifié visuellement en prod (sandbox bloque l'URL).
- Auditer `admin/public/dashboard.html` (onglet "Jeux" → aperçu parcours joueur de chaque module, mockup téléphone à droite) : vérifier qu'aucun style/design des jeux master n'y a été altéré ou n'y diverge. Restaurer si besoin. Penser au miroir `public/static/dashboard.html`.
- Vérifier que les AUTRES modules master (Quiz, Vote, Tombola, QuizSolo, QuizMaster) n'ont PAS reçu de code en dur d'event pendant la session (grep "ev-" / couleurs / wording spécifique dans leurs Client.tsx). Seul Spin avait été touché et est corrigé, mais à confirmer pour les autres.
- Règle pour la suite : tout design d'event = via `ev.cfg`, jamais dans le code master.

### B. FINIR LA LANDING (travail NON achevé)
- Le wording + le visuel stats parcours pro sont en place (dernier push `7deffa3`), mais la landing N'EST PAS validée finale par Romain → ajustements probables à venir.
- Vérifier rendu final en navigation privée (recharge après deploy + ISR 60s Supabase).
- Le visuel stats utilise des chiffres Pâques saisis depuis les CAPTURES de Romain (démo visuelle), PAS branchés live (données absentes de Supabase). À rebrancher si données un jour récupérées/collectées.
- Points landing encore possiblement à affiner selon retour : cohérence chiffres (proof 980 global vs visuel stats 192 Pâques), wording profils, mobile.

### C. POINTS GELÉS (déjà identifiés)
- Récupération vraies données Pâques (genre, bonus) → besoin code source Netlify.
- Appliquer le principe "design par event via cfg" aux autres modules (Quiz/Vote/Tombola/QuizSolo/QuizMaster) si besoin de designs spécifiques events.
- Audit autonomie outil (client lance seul après onboarding PM).
- Test QR scan réel + vérif participations écrites en base sur tous les parcours.

## 13. MÉTHODE DE TRAVAIL (exigée par Romain)
- Travailler en LOTS, exécuter en autonomie jusqu'à ce que tout soit ✅, ne pas s'arrêter pour demander validation à chaque étape.
- Checklist explicite AVANT exécution, marquer ✅/❌ après vérification (grep/build).
- Blocs cohérents complets, pas de patchs ponctuels.
- Vérifier (grep/build) avant d'affirmer qu'une étape est faite.
- Ne jamais réinventer l'UX/UI validée — construire sur les fichiers de référence existants.
