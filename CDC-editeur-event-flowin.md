# Cahier des charges — Éditeur d'événement Flowin (générique)

> But : un éditeur unique dans le dashboard SA, réutilisable sur **tous** les events / super-events,
> sans toucher au code. Tu valides ce document **avant** que je code quoi que ce soit en prod.
> Statut : proposition à valider. Pas urgent.

---

## 1. Objectif

Configurer n'importe quel event / super-event **sans code** : identité, stations QR, questions, lots/tirage, partenaires, bandeau, mise en page. Simple : clic, drag pour réordonner, dimensionnement par presets, **aperçu live**.

## 2. Principe directeur (non négociable)

- Le parcours joueur est **déjà data-driven** : il lit `events.cfg` (jsonb) + les tables liées. L'éditeur ne fait que **produire un `cfg` valide + des lignes en base**.
- Les **master modules** (`QuizClient`, `SpinClient`, `NDS2026Client`…) ne sont **jamais modifiés** — toute personnalisation passe par `cfg`.
- L'aperçu = le **vrai parcours** rendu en iframe (mode preview), pas une maquette. (REAL = DEMO en design.)
- Générique : marche pour tous les `module` (quiz, spin, tombola, vote, nds2026) et au niveau super-event.

## 3. Ce que l'éditeur configure (sur le modèle réel actuel)

| Onglet | Source en base | Contenu éditable |
|---|---|---|
| **A. Identité & branding** | `events` (nom, module, date_d/date_f, h_start/h_end, lieu, adresse, couleur) + `cfg.theme` | nom, dates/horaires, lieu, palette, logo, hero |
| **B. Stations / points QR** | `cfg.stations[]` | id, nom, lieu, icône, **ordre (drag)**, lat/lng (carte) |
| **C. Questions** | `banques` / `questions` (+ `cfg.customQuestions`) | banque par station, bonus partagés, CRUD question (intitulé, options, bonne réponse, thème/genre) |
| **D. Lots & tirage** | `lots` / `se_lots` / `lots_stock` + `events.gain_immediat` / `gain_ticket` | lots, stock, règle de tirage (1/jour, fin de festival), gain immédiat |
| **E. Partenaires / commerces** | `partenaires` (+ vue `v_nds_commerces_carte`) | CRUD : nom, logo, promo, liens réseaux, position carte, `en_avant`, tickets/scan |
| **F. Bandeau** | `cfg.bandeau` | actif on/off, type (logos défilants / texte), contenu |
| **G. Mise en page** | `cfg.layout` | ordre + taille des blocs par écran (onboard / final / partenaires) |

## 4. UX

- 3 zones : **onglets** (gauche) · **contenu/formulaire** (centre) · **aperçu live iframe mobile** (droite).
- **Drag-drop** : réordonner stations, questions, blocs.
- **« Mise au dimension »** : tailles par **presets (S / M / L)** pour blocs et images — pas un canvas pixel libre (voir §6).
- Sauvegarde : **brouillon** (`cfg_draft`) → bouton **Publier** écrit le `cfg` live. Annuler = revenir au dernier publié.
- 0 ligne de code pour l'utilisateur SA.

## 5. Architecture

- `dashboard.html` (vanilla JS) : nouvel écran « Éditeur ». Lit/écrit `events.cfg` via `supaFetch` + tables via REST Supabase.
- Aperçu : iframe `/parcours/<module>?preview=<eventId>&draft=1` qui rend le `cfg` brouillon.
- `cfg` **versionné** (`cfg.v`) pour migrations futures sans casser l'existant.
- Miroir `public/static/dashboard.html` maintenu identique (MD5).
- Contraintes iOS Safari respectées (var, pas de spread, `_flowinMerge`, etc.).

## 6. ⚠️ Décision la plus importante à trancher — liberté de mise en page

- **Option A — Blocs structurés (recommandée)** : sections empilées, réordonnables au drag, tailles par presets (S/M/L), images redimensionnables. Simple, **robuste sur mobile**, livrable en **jours**.
- **Option B — Canvas libre** : positionnement absolu, drag + resize au pixel. Très flexible mais **lourd, fragile sur mobile, livrable en semaines**, plus de bugs.

→ **Recommandation : A.** (B seulement si tu y tiens vraiment, en phase ultérieure.)

## 7. Phasage (pour juger le ROI avant de coder)

| Phase | Contenu | Pourquoi |
|---|---|---|
| **0** | Ce cahier des charges + ta validation | éviter de perdre des heures |
| **1 — MVP** | Onglets A–F en formulaires + aperçu live | **le gros de la valeur**, réutilisable tous events |
| **2** | Drag-drop ordre (stations, questions, blocs) | confort |
| **3** | Mise en page / tailles (presets, images) | le « clic-drag, mise au dimension » |
| **4** | Niveau super-event (héritage vers events enfants) | factorisation |

## 8. Hors périmètre (pour cadrer)

- Pas d'édition du code des master modules.
- Pas de canvas pixel-perfect en Phase 1.
- Pas de nouveaux modules de jeu (on configure l'existant).

## 9. À valider par toi (coche / commente)

- [ ] **Option A** (blocs structurés) ou **B** (canvas libre) ?
- [ ] On démarre par **Phase 1 seule**, puis on avise ?
- [ ] Onglets **A→G** complets, ou tu en retires / ajoutes ?
- [ ] Aperçu live en **iframe du vrai parcours** : OK ?
- [ ] **Brouillon `cfg_draft` + bouton Publier** : OK ?
- [ ] Cible : **event** d'abord, **super-event** en Phase 4 — OK ?

---

*Une fois ces 6 cases tranchées, je découpe la Phase 1 en tâches précises et je te les montre avant de pousser. Rien en prod sans ton GO.*
