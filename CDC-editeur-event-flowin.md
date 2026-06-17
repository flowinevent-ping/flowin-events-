# Cahier des charges — Éditeur d'événement Flowin (générique)

> But : **compléter** le dashboard existant pour permettre, sans code, un **template de mise en forme
> au niveau super-event** + des **events individuels qui héritent du template mais gardent leurs
> propres options et règles**.
> Statut : **VALIDÉ** (Romain, 17/06/2026). Règle d'or : **ne rien recréer de ce qui existe, ne rien casser.**

---

## 1. Objectif

L'éditeur ne remplace pas le dashboard : il **branche dessus** un module de **mise en forme** et de
**template super-event**. Le parcours est déjà data-driven (`events.cfg` jsonb + tables liées) ;
l'éditeur produit un `cfg` valide en réutilisant les fonctions déjà présentes.

## 2. Principe directeur (non négociable)

- **Non-régression** : aucune fonction existante n'est modifiée ni dupliquée. L'éditeur **appelle** l'existant.
- Master modules (`QuizClient`, `SpinClient`, `NDS2026Client`…) **jamais** modifiés — tout passe par `cfg`.
- Aperçu = le **vrai parcours** en iframe preview, pas une maquette.
- **Option A — blocs structurés** (pas de canvas pixel libre).

## 3. ✅ Ce qui EXISTE DÉJÀ dans le dashboard — À RÉUTILISER, NE PAS RECRÉER

Audit du `dashboard.html` actuel — ces fonctions sont en place et doivent être **appelées telles quelles** :

| Besoin | Fonction existante | À refaire ? |
|---|---|---|
| **Copier / dupliquer** un event | `duplicateEvent()` (clone cfg + couleur + lots + banque, repart à 0, persiste Supabase) | **Non** |
| **Supprimer** un event | `deleteEvent()` | **Non** |
| **Créer** un event | `renderWizardEvent()` / wizard | **Non** (on l'étend si besoin) |
| Lister les events | `renderBiblioEvents` / Kanban / Table / Timeline | **Non** |
| **Super-events** | `renderBiblioSuperEvents`, `newSuperEvent` | **Non** (on s'y greffe) |
| **Partenaires + logos** | `renderBiblioPartenaires`, `newPartenaire`, `deletePartenaire` | **Non** |
| **Lots** | `newLotForEvent`, `saveLot`, `deleteLot` | **Non** |
| **Questions / banques** | `newBanque`, `newQuestion`, `editQuestion`, `saveQuestion`, `deleteQuestion`, `renderCustomQuestionsEditor` | **Non** |

> Conséquence : « Ajouter / Copier / Supprimer » sont **déjà couverts**. L'éditeur ne les réécrit pas, il les met juste à portée de clic depuis sa vue.

## 4. ⭐ Ce que l'éditeur AJOUTE réellement (le seul vrai manque)

1. **Mise en forme par écran** : logo, couleur d'accent, **textes** (titres, sous-titres, boutons, messages),
   ordre + taille des blocs (presets S/M/L). Aujourd'hui non éditable finement sans code.
2. **Template super-event** : un **gabarit de mise en forme commun** (branding, logo, palette, structure
   des écrans) défini **une fois** au niveau super-event.
3. **Surcharge par event individuel** : chaque event **hérite** du template super-event mais **garde ses
   propres options et règles** (module, questions, lots, tirage, couleur spécifique, horaires…).

## 5. Modèle Template super-event ↔ events individuels (cœur de la demande)

```
SUPER-EVENT  ── template de mise en forme (cfg.template) ───────────┐
   │  logo, palette, polices, structure d'écrans, bandeau partenaires │
   │                                                                  │ hérité par défaut
   ├── Event A  → hérite du template + SES règles (module quiz, 4 Q, lots X, tirage soir)
   ├── Event B  → hérite du template + SES règles (module spin, lots Y, couleur surchargée)
   └── Event C  → hérite du template + SES règles
```

- Le template vit dans le super-event (`cfg.template`). Les events lisent : **template hérité** puis
  **surcharge locale** (`cfg` de l'event prime champ par champ).
- Modifier le template super-event m=> se répercute sur tous les events enfants **qui n'ont pas surchargé** ce champ.
- Un event peut **détacher** un champ (surcharge) sans casser les autres.
- Règles/options de jeu (questions, lots, mécanique) **restent propres à chaque event** — le template ne touche que la **mise en forme**.

## 6. Édition page à page

Écrans éditables (mise en forme uniquement) : Onboarding · Jeu · Bonus/RSE · Résultats · Formulaire ·
Final · Carte · Partenaires. Un écran à la fois, formulaire + aperçu live à côté.

## 7. 🔒 Non-régression — test obligatoire avant/après

Avant livraison, vérifier que **rien n'est cassé ni doublé** :

1. **Avant** : noter le comportement de `duplicateEvent`, `deleteEvent`, wizard, biblios, partenaires, lots, questions sur un event témoin.
2. L'éditeur **n'écrit que** dans `cfg.template` (super-event) et `cfg.theme`/`cfg.layout`/textes (event). Il **ne touche pas** aux champs gérés par l'existant (module, lots, banques, participants…).
3. **Après** : rejouer les mêmes actions → résultat **identique**. Un event sans template hérité doit rendre **exactement** comme aujourd'hui (template = couche optionnelle, jamais imposée).
4. `cfg` **versionné** (`cfg.v`) : un event ancien sans `template` continue de fonctionner tel quel.

## 8. UX & responsive

- Vue éditeur : liste écrans (gauche) · formulaire (centre) · aperçu live mobile (droite).
- **iOS Safari + Android Chrome** : éditeur et aperçu utilisables sur mobile ; aperçu au format téléphone.
- Code généré conforme iOS (var, pas de spread/Object.assign, `_flowinMerge`, `.indexOf`).
- Miroir `public/static/dashboard.html` maintenu identique (MD5).

## 9. Hors périmètre

- Pas d'édition du code des master modules · pas de canvas pixel-perfect · pas de nouveaux modules de jeu.
- **Pas de réécriture** de duplicate/delete/wizard/biblios/partenaires/lots/questions (déjà faits).

## 10. Phasage

| Phase | Contenu |
|---|---|
| **1 — MVP** | Mise en forme par écran (logo, couleur, textes) sur un event, branchée sur l'existant + aperçu live |
| **2** | Template super-event + héritage/surcharge vers events enfants |
| **3** | Presets de taille S/M/L, drag-drop ordre des blocs |
| **4** | Bandeau partenaires piloté depuis le template |

---

*CDC validé et aligné sur l'existant. Aucune fonction recréée. Prochaine étape : découpe de la Phase 1 en tâches + test de non-régression, montré avant tout push prod.*
