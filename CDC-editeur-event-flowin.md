# Cahier des charges — Éditeur d'événement Flowin (générique)

> But : un éditeur unique dans le dashboard SA, réutilisable sur **tous** les events / super-events,
> **sans toucher au code**.
> Statut : **VALIDÉ** (Romain, 17/06/2026) — simple, intuitif, sans fioriture. Prêt à découper en tâches.

---

## 1. Objectif

Configurer n'importe quel event / super-event **sans code** : identité, logo, couleurs, textes,
stations QR, questions, lots/tirage, partenaires, bandeau, mise en page — **écran par écran**,
avec **aperçu live**. Simple : on clique, on remplit, on réordonne au drag, on publie.

## 2. Principe directeur (non négociable)

- Le parcours joueur est **déjà data-driven** : il lit `events.cfg` (jsonb) + tables liées.
  L'éditeur ne fait que **produire un `cfg` valide + des lignes en base**.
- Les **master modules** (`QuizClient`, `SpinClient`, `NDS2026Client`…) ne sont **jamais modifiés**.
- L'aperçu = le **vrai parcours** rendu en iframe (mode preview), pas une maquette.
- Générique : marche pour tous les `module` (quiz, spin, tombola, vote, nds2026) et au niveau super-event.
- **Décision actée : Option A — blocs structurés** (pas de canvas pixel libre). Simple, robuste mobile, livrable en jours.

## 3. Gestion des événements (Ajouter / Copier / Supprimer)

Premier écran de l'éditeur = la **liste des events**, avec 3 actions simples :

| Action | Comportement |
|---|---|
| **➕ Ajouter** | Crée un event vierge à partir d'un **modèle** (quiz / spin / tombola / vote / nds2026). Pré-rempli avec des valeurs par défaut saines, prêt à personnaliser. |
| **⧉ Copier (dupliquer)** | Clone un event existant (cfg + stations + banques liées + lots + partenaires) sous un nouvel `id`. Le moyen le plus rapide de relancer une opé qui a marché. |
| **🗑️ Supprimer** | Supprime l'event. **Confirmation obligatoire** + archivage (soft-delete `cfg.archived=true`) plutôt qu'effacement sec, pour pouvoir restaurer. |

> La copie est la fonction clé : on part toujours d'un event qui marche, on l'adapte, on publie.

## 4. Édition page à page (template par écran)

L'éditeur traite chaque parcours comme une **suite d'écrans** ; on édite **un écran à la fois**,
avec son aperçu à côté. Écrans standard :

1. **Onboarding** — hero, logo, titre, sous-titre, couleur d'accent.
2. **Jeu (quiz / spin / …)** — banque de questions, nb de questions, options.
3. **Bonus / RSE** — questions bonus.
4. **Résultats** — message, visuel.
5. **Formulaire** — champs demandés, texte d'opt-in.
6. **Final** — message de fin, bandeau partenaires.
7. **Carte** — stations QR (ordre, position).
8. **Partenaires** — fiches + logos (voir §6).

Chaque écran = un petit formulaire (texte, image/logo, couleur, on/off) + **presets de taille S/M/L**
pour les blocs et images. Pas de positionnement au pixel.

## 5. Personnalisation visuelle (logo · couleurs · textes)

- **Logo** : upload (drag), recadrage simple, stocké en base (URL). Placé selon l'écran.
- **Couleurs** : 1 couleur d'accent principale + dérivées automatiques (pas de roue chromatique complexe).
- **Textes** : tous les libellés visibles sont éditables par écran (titre, sous-titre, boutons, opt-in, messages).

## 6. Onglet Partenaires & logos partenaires

- **CRUD partenaire** : nom, **logo** (upload), promo/offre, liens réseaux, position carte, `en_avant`, tickets/scan.
- **Bandeau logos** : ordre au drag, on/off, défilant ou statique.
- Tant qu'un logo n'est pas validé → placeholder « Votre logo ici » (déjà en place côté parcours).
- Source : table `partenaires` + vue `v_nds_commerces_carte`.

## 7. UX

- 3 zones : **liste écrans** (gauche) · **formulaire de l'écran** (centre) · **aperçu live iframe mobile** (droite).
- **Drag-drop** : réordonner stations, questions, logos, blocs.
- Sauvegarde : **brouillon** (`cfg_draft`) → bouton **Publier** écrit le `cfg` live. Annuler = dernier publié.
- **0 ligne de code** pour l'utilisateur SA.

## 8. Responsive iOS & Android (obligatoire)

- L'éditeur **et** l'aperçu doivent être utilisables sur mobile (iOS Safari + Android Chrome).
- Aperçu rendu dans un cadre **format téléphone** ; bascule portrait.
- Respect des contraintes iOS Safari côté code généré (var, pas de spread/Object.assign, `_flowinMerge`, `.indexOf`).
- Cibles de tap ≥ 44 px, pas de hover-only.

## 9. Architecture

- `dashboard.html` (vanilla JS) : nouvel écran « Éditeur ». Lit/écrit `events.cfg` via `supaFetch` + tables via REST Supabase.
- Aperçu : iframe `/parcours/<module>?preview=<eventId>&draft=1` (rend le `cfg` brouillon).
- `cfg` **versionné** (`cfg.v`) pour migrations futures.
- Miroir `public/static/dashboard.html` maintenu identique (MD5).

## 10. Hors périmètre

- Pas d'édition du code des master modules.
- Pas de canvas pixel-perfect.
- Pas de nouveaux modules de jeu (on configure l'existant).

## 11. Phasage

| Phase | Contenu |
|---|---|
| **1 — MVP** | Liste events (Ajouter/Copier/Supprimer) + édition page à page (textes, logo, couleurs, on/off) + aperçu live |
| **2** | Drag-drop (stations, questions, logos), presets de taille S/M/L |
| **3** | Onglet partenaires complet (upload logos, bandeau) |
| **4** | Niveau super-event (héritage vers events enfants) |

---

*CDC validé. Prochaine étape : je découpe la Phase 1 en tâches précises (checklist) et je la réalise en bloc.*
