# 🏗️ Architecture Flowin — comment ça marche

> **But de ce document** : comprendre Flowin en 10 minutes, sans plonger dans le code.
> Pour le détail technique (schéma de base, sécurité, procédures) → [`SPEC-TECHNIQUE-flowin.md`](SPEC-TECHNIQUE-flowin.md).
> MAJ : 2026-06-30 · Déploiement de référence : **Nuits du Sud 2026**.

---

## 1. Le concept en une phrase

Flowin met un **QR code** dans un lieu (une caisse, un bar, une vitrine de commerce). Le visiteur le scanne, **joue** (un quiz court ou un sondage), et **gagne un ticket** pour une tombola. Plus il y a de lieux, plus il y a d'occasions de jouer et de revenir.

Pour l'**organisateur**, c'est un outil d'animation et de fidélisation. Pour le **commerce partenaire**, c'est du trafic et de la visibilité. Pour le **visiteur**, c'est un jeu simple avec des lots à la clé.

---

## 2. Les briques techniques

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub  (flowinevent-ping/flowin-events-, branche main)     │
│     │  on pousse le code ici                                 │
│     ▼                                                        │
│  Vercel  (héberge le site, se met à jour tout seul à        │
│           chaque push — racine du projet = /admin)          │
│     │                                                        │
│     ├─►  Next.js   : les écrans de jeu (parcours joueurs)    │
│     │               + les pages pro / landing               │
│     │                                                        │
│     └─►  dashboard.html : le tableau de bord Super Admin     │
│                          (une page web autonome)            │
│                                                              │
│  Supabase  (la base de données : joueurs, events, tickets…) │
│      ▲   lecture/écriture depuis les écrans (clé publique)   │
│      └── opérations sensibles : via connecteur MCP côté ops  │
└─────────────────────────────────────────────────────────────┘
```

**En clair :**
- Le **code** vit sur GitHub. Dès qu'on pousse, **Vercel** reconstruit et met le site en ligne — aucune manipulation manuelle.
- Le **site** (Next.js) sert les écrans de jeu et les pages pro, sur `flowin-events.vercel.app`.
- La **base** (Supabase) stocke tout : joueurs, événements, tickets, lots.
- Le **dashboard Super Admin** est une page HTML autonome qui pilote tout (events, tirages, exports).

---

## 3. Le parcours joueur, de bout en bout

C'est le cœur du produit. Voici ce qui se passe quand quelqu'un scanne un QR à la Nuits du Sud :

```
1. SCAN          Le visiteur scanne le QR d'une station
                 (ex. la caisse 1, ou la vitrine de la Bergerie)
                          │
                          ▼
2. ÉCRAN NDS     Il arrive sur l'écran festival brandé :
                 « À GAGNER / Comment jouer » (pas un écran générique)
                          │
                          ▼
3. JEU           Deux variantes selon la station :
                 • Station culture  → QUIZ (4 questions sur le festival)
                 • Brigade Verte    → SONDAGE (éco-responsabilité, anonyme)
                          │
                          ▼
4. TICKET        • Quiz : 4/4 bonnes réponses = 1 ticket (+1 si bonus réussi)
                 • Sondage : 1 ticket par sondage complété
                          │
                          ▼
5. CUMUL         Le ticket s'ajoute au compteur du joueur pour TOUT le
                 festival (le cumul n'est jamais remis à zéro).
                 Limite : 1 participation par station et par jour.
                          │
                          ▼
6. TIRAGE        • Un tirage CHAQUE SOIR (places de concert)
                 • Un GRAND tirage à la clôture du festival
```

**Deux notions à ne pas confondre :**
- Le **droit au ticket** d'une station se ré-arme **chaque jour** (on peut rejouer demain).
- Le **cumul de tickets** gagnés est **conservé à vie** pendant le festival (compteur qui ne fait que monter).

---

## 4. Les trois rôles

| Rôle | Ce qu'il fait | Par où |
|---|---|---|
| **Visiteur / joueur** | Scanne, joue, gagne, s'inscrit (optionnel) | écrans `/parcours/nds2026` |
| **Commerce partenaire** | Affiche le QR, relaie sur ses réseaux, attire du trafic | kit digital + page pro |
| **Organisateur (Super Admin)** | Crée les stations, lance les tirages, exporte les gagnants | `dashboard.html` |

---

## 5. Comment une « station » est configurée

Tout repose sur la table **`events`**. Chaque station (caisse, bar, vitrine commerce) = une ligne.

- La colonne **`cfg`** (format JSON) contient **toute la configuration** : l'URL du QR, la banque de questions, les paramètres de jeu, le thème.
- 🔒 **Règle d'or** : pour changer le comportement d'une station, on modifie **`cfg` en base** — **jamais** le code des modules maîtres.
- Le **QR** d'une station encode exactement l'URL stockée dans `cfg.qrUrl`. Tout QR généré est **revérifié par décodage** avant d'être livré.

**État NDS 2026 :** les 21 events sont rattachés au super-event `se-nds-2026`. Les 6 stations commerce (Bergerie, Pégase, Utile, Carrosserie GP, Giordano, À la Fût) pointent toutes vers le parcours festival `nds2026`, pour une expérience identique aux stations du festival.

---

## 6. La tombola : d'où viennent les tickets

- Chaque ticket gagné est inscrit dans la table **`se_tickets`** — c'est **la source de vérité du tirage**.
- Unicité garantie : **1 ticket par (joueur, station, jour)**. Impossible de farmer la même station deux fois le même jour.
- Le **parrainage** crédite aussi des tickets (un visiteur invite un ami via un lien `?ref=…` ; quand l'ami s'inscrit, le parrain gagne un ticket). Crédité automatiquement par un *trigger* en base.
- Les **lots** (places de concert, bons d'achat) sont gérés depuis le dashboard, qui désigne les gagnants et exporte un PDF.

---

## 7. Sécurité (l'essentiel)

- Les fonctions sensibles (attribuer des points, attribuer un lot, valider un parrainage) sont **verrouillées** : impossibles à appeler depuis l'extérieur (`REVOKE`). Anti-triche.
- La **clé publique** Supabase (partagée par les écrans et le dashboard) est publique **par design** — elle ne donne accès qu'à ce que les règles RLS autorisent.
- Le dashboard Super Admin n'a **pas encore d'authentification** : qui a l'URL a l'accès. → Action *owner* avant le festival : **passer le repo en privé**. Durcissement complet prévu après le festival.

Détail et état d'audit : [`SPEC-TECHNIQUE-flowin.md`](SPEC-TECHNIQUE-flowin.md) §5.

---

## 8. Glossaire — les mots du projet

| Mot | Sens |
|---|---|
| **Station** | Un point de jeu physique (caisse, bar, vitrine commerce) = une ligne `events`. |
| **Super-event** | Le regroupement de toutes les stations d'un même événement. NDS = `se-nds-2026`. |
| **Module** | Le type de parcours (`quiz`, `spin`, `nds2026`…). C'est l'**URL** qui choisit l'écran, pas ce champ. |
| **`cfg`** | La configuration JSON d'une station (URL QR, questions, thème). Le seul endroit où l'on configure. |
| **Module maître** | Le composant React figé d'un parcours (`QuizClient`, `SpinClient`, `NDS2026Client`). On ne le touche pas. |
| **Brigade Verte** | Les stations « sondage » éco-responsable (anonyme, donne 1 ticket). |
| **Kit digital** | L'ensemble des visuels téléchargeables livrés à un commerce (A4, vidéo, QR…). |
| **Forex** | Un panneau rigide 70×70 cm imprimé, posé sur un poste (caisse, bar). |
| **QR station** vs **QR réseaux** | Même URL ; le QR réseaux ajoute `&source=reseaux-<commerce>` pour tracer l'origine. |
| **Dashboard SA** | Le tableau de bord Super Admin (`dashboard.html`). |

---

## 9. Pour aller plus loin

- **Détail technique complet** (34 colonnes de `events`, triggers, procédures de build/rollback) → [`SPEC-TECHNIQUE-flowin.md`](SPEC-TECHNIQUE-flowin.md)
- **Où sont les fichiers livrables et comment les régénérer** → [`INDEX-LIVRABLES-nds2026.md`](INDEX-LIVRABLES-nds2026.md)
- **Reste à faire** → [`../HANDOFF-flowin-nds2026.md`](../HANDOFF-flowin-nds2026.md)
