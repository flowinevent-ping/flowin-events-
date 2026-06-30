# Flowin — plateforme de gamification événementielle

**Flowin** transforme un événement ou un commerce en jeu : on **scanne un QR**, on **joue** (quiz / sondage), on **gagne des tickets** pour une tombola. Produit de **BAITA EURL (OPConsult)**, Vence (06).

🎪 **Déploiement vitrine en cours : Nuits du Sud 2026** — festival de Vence, **9 → 18 juillet 2026**, ~24 000 festivaliers, 6 commerces partenaires.

---

## 🧭 Carte — « je cherche… → je vais là »

| Je veux… | Aller à |
|---|---|
| **Comprendre comment Flowin marche** (vue d'ensemble, parcours joueur, schéma) | [`docs/ARCHITECTURE-flowin.md`](docs/ARCHITECTURE-flowin.md) |
| **Le détail technique** (base de données, sécurité, conventions, procédures) | [`docs/SPEC-TECHNIQUE-flowin.md`](docs/SPEC-TECHNIQUE-flowin.md) |
| **Trouver / télécharger un visuel** (A4, vidéo, forex, QR, kit commerce) — *où est la source, le maître, le fichier final* | [`docs/INDEX-LIVRABLES-nds2026.md`](docs/INDEX-LIVRABLES-nds2026.md) |
| **Savoir ce qu'il reste à faire** (la liste à jour) | [`HANDOFF-flowin-nds2026.md`](HANDOFF-flowin-nds2026.md) |
| **Distribuer les kits aux commerces** (page publique prête à partager) | [flowin-events.vercel.app/nds/kit-digital](https://flowin-events.vercel.app/nds/kit-digital/index.html) |
| **Travailler sur le code** (règles, build, bootstrap) | [`CLAUDE.md`](CLAUDE.md) |
| **Rapatrier les comptes sur un email unique** (après le festival) | [`docs/rapatriement-compte-maitre.md`](docs/rapatriement-compte-maitre.md) |
| **Prospecter de nouveaux partenaires** | [`docs/kit-prospection-nds2026.md`](docs/kit-prospection-nds2026.md) · [`docs/pitch-prospecteur-nds2026.md`](docs/pitch-prospecteur-nds2026.md) |
| **Consulter l'historique** (vieux handoffs, audits) | [`docs/archive/`](docs/archive/README.md) |

---

## 📦 Les livrables en un coup d'œil

**Page de distribution publique** (à envoyer aux commerces) :
👉 **https://flowin-events.vercel.app/nds/kit-digital/index.html**

Elle regroupe, pour le festival **et** pour chacun des 6 commerces (Bergerie, Pégase, Utile, Carrosserie GP, Giordano, À la Fût) :
- **A4 « Jouez ici »** — 4 formats : `.png` (aperçu), `.pdf` (impression), `.pptx` (éditable), `.svg` (Canva)
- **Vidéo verticale 9×16** (réseaux / écrans)
- **2 QR** : *station* (en boutique, URL fixe) + *réseaux* (même URL + `&source=reseaux-<slug>`)
- **Forex 70×70** par poste (caisses 1/2/3, bars 1/2, festival)
- **ZIP** « tout le kit » par commerce

> 🗺️ Pour savoir **comment chaque visuel est fabriqué et comment le régénérer** : [`docs/INDEX-LIVRABLES-nds2026.md`](docs/INDEX-LIVRABLES-nds2026.md).

---

## 🏗️ Architecture en 30 secondes

```
GitHub (flowinevent-ping/flowin-events-, main)
   push --> Vercel (auto-deploy, racine /admin)
              Next.js : parcours joueurs + pages pro
   Supabase (Postgres + RLS)  <-- lecture/ecriture
   Dashboard Super Admin = page HTML statique (admin/public/dashboard.html)
```

**Parcours joueur :** scan QR → écran NDS brandé → quiz (4 questions) **ou** sondage Brigade Verte → **1 ticket** de tombola → cumul sur tout le festival → tirage chaque soir + grand tirage final.

Détail complet : [`docs/ARCHITECTURE-flowin.md`](docs/ARCHITECTURE-flowin.md).

---

## 🔑 Accès & comptes

⚠️ **3 comptes distincts** (migration vers un email unique prévue *après* le festival) :

| Service | Compte | Rôle |
|---|---|---|
| GitHub | `flowinevent-ping` | code (ce repo, branche `main`) |
| Supabase | `romain.collin@gmail.com` | base de données (projet `ywcqtupgoxfzkddqkztk`, eu-west-1) |
| Vercel | (compte dédié) | hébergement / auto-deploy |

> 🔒 Les secrets (token GitHub, clés service) **ne figurent jamais ici** ni dans Notion. Ils vivent dans la mémoire projet. La clé Supabase *publishable* est publique par design.

---

## 📞 Contacts

- **Comm partenaires** (sur tous les supports clients) : `flowinevent@gmail.com` · **06 16 35 49 36**
- **Prospection** : `info@opconsult.co` · 06 16 35 49 36 (signature Romain Collin)

> 🔒 Le nom « Romain Collin » ne figure **jamais** sur les visuels / plaquettes clients.

---

## ⚠️ Règles d'or (à ne pas enfreindre)

1. **Mécanique de jeu gelée** : 4/4 = 1 ticket (+1 si bonus) ; brigade = 1 ticket / sondage ; 1 participation / station / jour. On clarifie le wording, on ne change pas la logique.
2. **Modules maîtres** (`SpinClient.tsx`, `QuizClient.tsx`, `NDS2026Client.tsx`) : on ne les modifie pas — toute config passe par `cfg` en base.
3. **Jamais de données inventées** (téléphone, email, SIRET, partenaire, lot) → placeholder `[… à compléter]`.
4. **Genre** dans les formulaires : Homme / Femme / vide — jamais « Autre ».
5. **Tout asset produit** (rendu + script source) est **committé dans la même session** (`/home/claude` est éphémère).

---

## 🗓️ Échéances

- **Avant le 9/07** (actions *owner*, Romain) : repo GitHub → privé · activer PITR · backup manuel · valider CGV (juriste) · vérifier domaine Resend.
- **9 → 18/07** : festival (déploiement live).
- **Après le 18/07** : rapatriement des comptes, durcissement RLS avancé, architecture agents/Skills (gelée jusque-là).

---

*Source de vérité « reste-à-faire » : [`HANDOFF-flowin-nds2026.md`](HANDOFF-flowin-nds2026.md) + table Supabase `handoff_notes` (clé `handoff-nds-2026-comm`). Ce README est la porte d'entrée ; il pointe, il ne duplique pas.*
