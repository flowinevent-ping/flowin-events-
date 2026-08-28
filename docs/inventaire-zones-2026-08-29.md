# Inventaire complet — dashboard SA, pour validation avant construction des 4 zones

Généré le 29/08/2026 par `admin/public/carte-systeme/controleur.py` (v2) :
`python3 admin/public/carte-systeme/controleur.py` → régénère ce document et
`carte-data.json` à partir des vraies sources (le script n'invente rien, il
extrait `Sidebar.tsx` + les routes App Router réelles + les pages HTML
publiques + le menu legacy). v1 ne lisait que le menu legacy `dashboard.html`
(figé au 14/07) — v2 lit la Sidebar Next.js réellement affichée en prod.

**Ce document ne construit rien.** Il précède l'étape 2 de
`MISSION-reorganisation-dashboard-2026-08-28.md` §4 : « inventaire complet de
l'existant, à faire valider par Romain avant de construire ». La section 5
ci-dessous est une **proposition**, pas une décision.

---

## 1. Sidebar réelle en prod (`admin/components/dashboard/Sidebar.tsx`)

**10 groupes / 44 entrées.**

| Groupe | Entrées |
|---|---|
| ACCUEIL | Accueil |
| JEUX | Jeux (templates) |
| EVENTS | Animations (par pro), Super Events, **Opérations (commerces, tickets, CA)** ⁽¹⁾, Parcours mobil |
| CRM | Aperçu Pro, Pros, Demandes de participation, Joueurs, Partenaires (fiche commerce) |
| TIRAGE & GAGNANTS | Tirage au sort, Liste des gagnants, Billets & kit com partenaire, Stock des lots |
| STATISTIQUES | Statistiques & résultats, Résultat journalier, Rapport détaillé, Origines du trafic, Participants (super event) |
| COMMERCIAL | Bons de commande, Bons de commande & Factures (liste), Générer une facture, Dossiers partenaires (A3/A4/vidéo/QR), Packs de participation, CGV & légal |
| LANDING & PROSPECTION | Landing pages, Plaquette commerciale, Plaquette offres & tarifs, Argumentaire téléphonique, Présentation partenaire, Prospection, Prospects B2B, CRM Landing pages, Retours CRM |
| NDS 2026 — ASSETS | Carte NDS, Front NDS, Vidéo & média, Visuels & vidéos |
| SYSTÈME | Pilotage, Rapports, Nouvel événement, Feuille de route, Paramètres, Maintenance |

⁽¹⁾ **Rebranchée cette session** (commit à suivre) : `/dashboard/operations`
existait déjà (page réelle sur la vue `v_se_dashboard` — commerces
actifs/payés, joueurs, tickets, gains, sponsors, CA pros), était orpheline
depuis sa création. Confirmée par 3 sessions successives (28/08, 28/08,
29/08) comme le seul vrai trou de la sidebar SA. Placée provisoirement dans
EVENTS, à côté de Super Events — sa position définitive dépend de la
validation de la section 5.

Menu legacy (`admin/public/dashboard.html`, plus affiché en prod, gardé pour
mémoire technique) : 7 rubriques / 27 entrées — ne pas s'y fier pour la
réorganisation, c'est un artefact figé au 14/07.

## 2. Routes réelles (App Router)

- `/dashboard/*` : **37** routes (1 dynamique : `/dashboard/operations/[id]`)
- `/pro/*` : **18** routes (3 dynamiques : `/pro/banques/[id]`, `/pro/crm/[id]`, `/pro/super/[event]`)

## 3. Liens morts sidebar → route réelle

**0.** Aucun lien mort dans la Sidebar Next.js — confirmé au code, pas supposé.

## 4. Routes orphelines (page.tsx réel, jamais relié à la Sidebar)

Après rebranchement d'`operations` : **14**, toutes sous `/pro/*` :
`banques`, `banques/nouvelle`, `connexion`, `crm`, `entreprise`, `events`,
`inscription`, `jeu`, `lots`, `parcours`, `rejoindre`, `super`, `tirage`,
`tracking`.

**Ce n'est probablement pas un défaut** : `/pro/*` est l'espace self-service
partenaire (connexion propre, pas d'accès direct depuis la Sidebar SA). Le
SA y entre via un pro précis (`Aperçu Pro`, ou les liens directs posés dans
`EventDrawer`/`PartenaireDrawer`, ex. `/pro/banques/[id]`), pas via un menu
générique. **À confirmer avec Romain** avant de considérer ça comme un
problème — c'est une hypothèse de lecture du code, pas un fait vérifié en
base ou par un test utilisateur.

## 5. Pages HTML publiques orphelines (21 / 34)

Ni Sidebar, ni menu legacy, ni landing page. **Proposition de classement**
(à valider — je n'ai pas de moyen de vérifier l'usage réel sans accès
analytics/logs) :

**A. Manifestement actives, à rebrancher ou déjà atteintes autrement**
- `lot.html` — page de retrait des lots, lien envoyé aux gagnants par email (confirmé : présente dans les PDFs partenaires et les brouillons Gmail). Orpheline de la Sidebar mais atteinte via lien direct, pas un bug.
- `admin-connexion.html` — page de connexion SA elle-même : orpheline par nature (point d'entrée avant authentification, ne peut pas être *dans* le menu qu'elle précède).
- `bon-commande-nds.html`, `bon-commande-nds-a4.html`, `lots-nds.html` — outils HTML autonomes mentionnés comme fonctionnels dans `docs/patterns-bugs-connus.md` (Pattern F, token rafraîchi le 27-28/08). Probablement atteints par lien direct depuis d'autres outils, pas depuis la Sidebar.

**B. Anciennes variantes / doublons probables (à confirmer avant suppression)**
- `carte.html` (doublon possible de `/dashboard/nds-carte`)
- `prospection.html` (doublon possible de `/dashboard/prospection`)
- `nds-parcours.html`, `nds-partenaire.html`, `nds-pro.html`, `parcours_user.html` — variantes de parcours dont le rôle par rapport aux vrais parcours Next.js (`/parcours/nds2026`, etc.) n'est pas déterminé ici.
- `nds-brigade-verte-1/2/3.html` (variantes numérotées, à côté de `nds-brigade-verte-manuel.html` qui, lui, est une landing active)

**C. Candidats suppression (tests / démos)**
- `login-test.html`, `demos.html`, `kit-controle.html`, `nds-spot-player.html`, `bon-achat-template.html`, `cgv-nds.html`, `pro-nds-live.html`

Cette classification A/B/C est une **lecture du code par pattern de nom et
de contenu**, pas une vérification d'usage réel (pas d'accès aux logs
serveur ni aux statistiques de visite par URL depuis cette session). Elle
sert de point de départ à ta décision, pas de verdict.

## 6. Proposition de correspondance aux 4 zones — À VALIDER, RIEN N'EST CONSTRUIT

| Zone cible | Contenu actuel proposé | Notes |
|---|---|---|
| **A. Super Event** | ACCUEIL + `/dashboard/operations` (déjà rebranchée) + vue globale de STATISTIQUES | "Vue d'ensemble" au niveau super event, cf. décision du 28/08 : les stats sont une dimension à 2 niveaux (globale + par instance), pas une zone à part |
| **B. Events (kanban)** | EVENTS (Animations, Super Events, Parcours mobil) restructuré en kanban passé/en cours/à venir | Chantier déjà identifié comme le plus gros morceau structurel |
| **C. Comm & outils** | TIRAGE & GAGNANTS + COMMERCIAL + LANDING & PROSPECTION + NDS 2026 — ASSETS + JEUX (templates) | Rassemble l'existant (facturation, billets, prospection, assets), ne recrée rien |
| **D. CRM (4 vues)** | CRM (Aperçu Pro, Pros, Demandes, Joueurs, Partenaires) + dimension par-instance de STATISTIQUES (Résultat journalier, Rapport détaillé, Origines du trafic, Participants) | Les 4 vues demandées (par event/super event, globale participants, pro, organisateur super event) recoupent CRM + une partie de STATISTIQUES — regroupement à affiner avec toi |

**Points explicitement laissés ouverts, comme au 28/08** :
- Sort de `/dashboard/gagnants` + `tirage-nds.html` : zone Comm & outils (avec billets/stock) ou dimension de l'event comme les stats ?
- « Organisateur super event » (ex. Ville de Vence pour NDS) — distinct d'un « Pro » partenaire classique, structure à définir.
- Classement définitif des 21 pages HTML (section 5).

---

*Prochaine étape : validation point par point de ce document avec Romain,
puis construction zone par zone (jamais les 4 en une fois), en enrichissant
l'existant listé ci-dessus — jamais en le recréant.*
