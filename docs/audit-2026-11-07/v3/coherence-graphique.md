# Audit COHÉRENCE GRAPHIQUE — Flowin Events — 2026-11-07 (v3)

Méthode : Playwright (chromium, 390×844 et 1440×900), 24 écrans, `getComputedStyle` sur tous les éléments visibles (fonds, couleurs de texte, police+graisse, rayons, boutons, titres H1-H3, nœuds texte contenant un emoji). Mesures brutes : `/tmp/flowin-audit-v3/shots/graphique/styles.json` ; captures `*-m.png` / `*-d.png` dans le même dossier ; liste emojis TSX : `emojis-tsx.txt`. Référence : `docs/DESIGN-TOKENS-flowin.md` + `lib/charte.ts`. Complète `docs/audit-2026-11-07/v2/coherence.md` §4 (ne répète pas les verts #15803D ni la liste emoji de `ModalGererLots`/`BlocsOperations`).
Décision appliquée : super event = ORANGE #C2410C / #FF8A14 ; event = bleu ; pas d'emoji.

## Note : 5,5 / 10
L'espace Pro React est propre et homogène (7,5/10). Le SA Next est correct mais mélange deux palettes (slate Tailwind + jetons fl). Tout le reste (legacy, landing, /nds, /se, plaquettes) suit chacun sa propre charte, et la couleur super event est rouge dans le code alors qu'elle doit être orange.

## 1. Ce qui est cohérent / ce qui ne l'est pas

| Domaine | Cohérent | Incohérent |
|---|---|---|
| Fond / encre Pro | `#F4F6F9` papier, `#1B3A5C` encre, H1 23px/900 identique sur /pro, /pro/compte, /pro/donnees | /pro/premiere-fois H1 34px/900 (autre échelle) |
| Police | Pro, jouer, SA, plaquettes animation/SE : police système 700-900 | `/nds` Bricolage Grotesque + Plus Jakarta Sans ; `plaquette-nds.html` Manrope ; `/se` Helvetica Neue (défaut Leaflet) ; SA : `Arial 600` rendu sur 9 à 163 nœuds/page (nds-lots 163) |
| Accent | Violet `#7A4FE0` pour CTA Pro, jouer, SA, plaquettes | Landing CTA **teal #00B4A0** (`LandingClient.tsx:8`) ; legacy connexion bouton **vert #22C55E** sur fond **#0F172A** ; SA puces **#2563EB** (Tailwind) ; jouer forme décorative teal |
| Super event | Logo SVG Super event partagé (plaquettes) | `ACCENT_SUPER = '#C41D15'` rouge (`lib/charte.ts:98`) rendu sur /pro/nouvelle (rgb 196,29,21) et dans 9 fichiers ; orange `#C2410C` seulement dans 8 endroits ; carte `/se` : pastilles **violet #7C2D92** ; boutons jaunes `#FFD23F` hors logo dans `plaquette-super-event.html` (24 occurrences) et `plaquette-animation-magasin.html` |
| Event | — | `ACCENT_ANIM = violetFonce #6A3FD0` (`lib/charte.ts:99`) : l'event n'est pas bleu ; `globals.css:301` dit « bleu #2746A6 = pro » : trois définitions |
| Rayons | Pilule 99-100px dominante pour CTA | 14 valeurs différentes : 3, 8, 9, 10, 11, 12, 13, 14, 16, 18, 50, 99, 100, 999px (grep `borderRadius` : 86×10, 77×12, 64×14, 60×8…) ; jetons = 18/12/100 |
| Pictos | Pro React : 0 emoji rendu, SVG `Ico` partout | voir §3 |
| Logo | « Flow » + « in » bleu sur Pro/jouer (« Jeu proposé avec Flowin ») | legacy connexion : titre « 🔒 Dashboard Flowin » sans logo ; /nds et plaquette-nds ont leur propre en-tête sombre |
| Fond sombre (interdit) | Pro, SA, jouer clairs | /landing (héros navy, accepté par jeton `--fl-encre-nuit`), /nds `rgba(8,11,22)`, plaquette-nds `#150C1C`, admin-connexion `#0F172A` |

## 2. Inventaire des variantes

**Bouton primaire : 9 variantes rendues**
1. Violet `#7A4FE0` / blanc / 100px / 800 / 16px — `PremiereFois` (/pro/premiere-fois).
2. Violet / 99px / 800 / 19px — jouer « Découvrir le jeu » (`app/jouer/JouerClient.tsx`).
3. Violet / **12px** / 800 / 14px — « Enregistrer » /pro/compte.
4. Violet / 99px / 800 / 12.5px bordure violette — étapes /rejoindre (`RejoindreClient.tsx`).
5. Violet / **9px** / 800 / 12.5px — « Être contacté », plaquettes animation et SE.
6. Violet / 18px / 400 — carte-bouton « J'ai un commerce », plaquette-animation-magasin.
7. Teal `#00B4A0` / 100px / 800 — landing ; et teal / 12px / 700 « Demander une démo » ; teal / 9px « Contact ».
8. Jaune `#FFD23F` / brun `#3B2418` ou encre / 12px / 2px bordure — plaquettes (hors logo, à supprimer).
9. Vert `#22C55E` / 10px — `public/admin-connexion.html`.
(+ `/nds` : transparent 100px 700 et 14px, Plus Jakarta ; plaquette-nds : blanc sur `#150C1C`.)

**Bouton secondaire : 5 variantes** — blanc/violet/50px/700 13.5px bordure `#C9D4E3` (Pro barre d'actions) ; idem graisse 800 13px (onglets Pro) ; blanc/encre/99px/700 11px bordure `#DCE3EC` (chips Lots/Gagnants) ; blanc/encre/100px/800 14px bordure `#CBD5E2` (plaquette SE « Précédent ») ; blanc/encre/**16px**/400 (cartes-boutons /pro/nouvelle, /rejoindre).

**Titres** : H1 23 / 34 / 60 / 62 / 34(700) px ; SA n'a pas de H1 (H2 12px/800 en guise de titre sur /dashboard ; H2 19px/900 couleur `#0F172A` sur wizard-pro).

**Encre** : `#1B3A5C` (jeton) vs `#0F172A` (`CHARTE.texte`, SA wizard) vs `#1B2F5C` (plaquette-super-event H2 rgb 27,47,92).

**Fond** : `#F4F6F9` (Pro) vs `#F1F5F9`/`#F8FAFC` (`CHARTE.fond`/`subtil`, SA).

## 3. Emojis affichés (non couverts par v2)
- Rendu à l'écran : `/dashboard/wizard-pro` 🧭 🏪 📣 — source `lib/proCreation.ts:90,96,193` (`icone:`).
- `public/admin-connexion.html` (passage obligé de /dashboard.html) : « 🔒 Dashboard Flowin », 👁.
- `/dashboard/nds-lots` : « ✓ Confirmé », « ✓ Utilisé » (`app/dashboard/nds-lots/page.tsx`, 2 lignes).
- `components/parcours/AnimationIndisponible.tsx:22` ⏳🏁🔎⛔ (joueur) ; `EventDrawer.tsx:489,507,535` 🎤.
- ★ `app/nds/NdsClient.tsx:75,77,80`, `LandingClient.tsx:149` ; ✓/✕ `SuperEventClient.tsx:296,302,371,376`, `LandingClient.tsx:133,147`, `PremiereFois.tsx:567,573`.
- Total TSX : 98 lignes dans 50 fichiers (liste : `shots/graphique/emojis-tsx.txt`). Legacy `public/dashboard.html` : 689 lignes avec emoji pictographique (U+1F300+). Plaquettes : 1 (plaquette-nds).

## 4. Priorités

**P0-1 Couleur super event rouge au lieu d'orange.** `lib/charte.ts:97-98` `ACCENT_SUPER='#C41D15'` → `'#C2410C'` + exporter `ACCENT_SUPER_2='#FF8A14'` ; supprimer le commentaire « comics remplace l'orange ». Effet immédiat sur les 9 consommateurs (`DashboardUI.tsx:118`, `super-events/page.tsx:154`, `ParcoursCreation.tsx:163,689`, `GrilleOperations`, `HistoriqueClient`, `ParcoursMobil`, `ModalGererLots`, `BlocsOperations`, `planning/page.tsx`). `public/flowin-theme.css` (`#C41D15`) et `DESIGN-TOKENS-flowin.md` (« univers comics réservé au Super event ») à aligner : le jaune/rouge ne vit plus que dans `flowin-super-event-logo.svg` et `SelecteurLot.tsx` (LogoSuperEvent).
**P0-2 Carte joueur /se en violet #7C2D92.** `app/se/[se]/SuperEventClient.tsx` (pastilles Leaflet) + police Helvetica Neue : passer pastilles en `#C2410C`, `font-family` système sur le conteneur Leaflet. Même violet hérité dans `ParcoursOutro.tsx:18,22`, `app/gagnants/[evId]/page.tsx:70`, `VoteClient.tsx:35`, `QuizsoloClient.tsx:27` (défaut `#7C2D92` → jeton).
**P0-3 Event pas bleu.** `ACCENT_ANIM = CHARTE_PRO.accentFonce` (violet) `lib/charte.ts:99` → `CHARTE_PRO.bleu #3B5CC4` ; `globals.css:301-305` réécrire le commentaire/variables `.t-pro` en `#3B5CC4`.
**P1-1 Bouton primaire unique.** Créer `.fl-btn` dans `public/flowin-tokens.css` + composant `components/ui/Bouton.tsx` ; remplacer variantes 3 (`/pro/compte` 12px), 5-6 (plaquettes 9px/18px), 7 (landing teal), 9 (admin-connexion vert).
**P1-2 Landing teal.** `app/landing/LandingClient.tsx:8,84,112,137,175` `--teal` → `--fl-violet` (décision « bleu + vert = pharmacie »). Idem forme teal de `/jouer`.
**P1-3 Emojis** : `lib/proCreation.ts:90,96,193` → `icone: 'store'|'megaphone'|'compass'` rendu par `Ico` ; `admin-connexion.html` 🔒👁 → SVG inline ; ✓/★/✕ → `Ico k="check"|"star"|"x"`.
**P1-4 SA deux palettes.** `lib/charte.ts:11-23` `CHARTE` (slate `#F1F5F9/#0F172A/#E2E8F0`) → valeurs de `CHARTE_PRO` ; supprimer `Inter,Arial` de `POLICE_ADMIN` et de `globals.css:12` (Arial rendu en 600 sur les tableaux) ; `#2563EB` du /dashboard → `--fl-bleu`.
**P2-1 /nds et plaquette-nds** : polices Bricolage/Plus Jakarta/Manrope et fonds noirs → police système + `--fl-encre-nuit` (ou assumer « page événement partenaire » et le documenter).
**P2-2 Rayons** : ramener à 3 valeurs (12 / 18 / 100px) ; 14 valeurs actuelles.
**P2-3 Titres** : échelle H1 28 / H2 20 / H3 16, graisse 900/800 ; SA doit avoir un vrai H1 de page.
**P2-4 Plaquettes** : boutons jaunes `#FFD23F` hors logo (`plaquette-super-event.html` 24 occ., `plaquette-animation-magasin.html` 3) → orange `#C2410C` ; H2 `#1B2F5C` → `#1B3A5C`.
**P2-5 Legacy dashboard.html** : 689 lignes emoji, fond sombre de connexion ; à geler ou retirer (cf. v2 P2-3).

## 5. Système unifié minimal proposé

```css
:root{
 --fl-encre:#1B3A5C; --fl-encre-nuit:#0E1B30; --fl-papier:#F4F6F9; --fl-carte:#FFF;
 --fl-texte-2:#5a6b80; --fl-trait:#DCE3EC; --fl-champ:#CBD5E2;
 --fl-violet:#7A4FE0; --fl-violet-fonce:#6A3FD0; --fl-violet-clair:#EEE8FC;   /* action */
 --fl-event:#3B5CC4;  --fl-event-clair:#E3E9F8;                              /* event = bleu */
 --fl-super:#C2410C;  --fl-super-2:#FF8A14; --fl-super-clair:#FDF1E3;       /* super event = orange */
 --fl-ok:#0B7A4F; --fl-ko:#C62F2F; --fl-alerte:#B45309;
 --fl-rayon:18px; --fl-rayon-s:12px; --fl-pilule:100px;
 --fl-ombre:0 14px 32px -22px rgba(27,58,92,.5);
 --fl-police:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
}
.fl-btn{min-height:48px;padding:0 22px;border-radius:var(--fl-pilule);background:var(--fl-violet);color:#fff;font:800 15px/1 var(--fl-police);border:0}
.fl-btn--2{background:#fff;color:var(--fl-violet-fonce);border:1.5px solid var(--fl-champ)}
.fl-carte{background:var(--fl-carte);border:1px solid var(--fl-trait);border-radius:var(--fl-rayon);box-shadow:var(--fl-ombre);padding:18px}
.fl-tiroir{background:var(--fl-carte);border-radius:var(--fl-rayon) var(--fl-rayon) 0 0;box-shadow:0 -10px 40px rgba(14,27,48,.25)} /* en-tête --fl-encre-nuit, filet --fl-event ou --fl-super selon le type */
```
- Variante contextuelle unique : `.fl-btn--super{background:var(--fl-super)}` sur les seuls écrans super event.
- Pictos : un seul jeu, le composant `Ico` existant (SVG trait 2px, `currentColor`), exporté en `<symbol>` dans `public/flowin-icons.svg` pour les pages HTML statiques ; interdiction d'emoji vérifiée par un test grep (U+1F300-1FAFF, U+2600-27BF) sur `app/ components/ lib/ public/*.html`.
- Source unique : `lib/charte.ts` génère les variables ; `flowin-tokens.css` les reprend ; `globals.css` et `flowin-theme.css` n'en redéclarent aucune.

## Non vérifié
- Dashboard legacy derrière connexion : seule la page de connexion a été rendue.
- Tiroirs (EventDrawer, SuperEventDrawer) non ouverts ; ombres comptées mais non comparées une à une.
- Écrans Pro /pro/operation et /pro/nouvelle sans H1 rendu (contenu possiblement conditionnel au compte pro-nook).
