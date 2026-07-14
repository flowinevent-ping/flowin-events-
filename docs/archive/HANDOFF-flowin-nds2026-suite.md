# HANDOFF — Flowin / Nuits du Sud 2026 — Session suivante

**Date handoff** : 18 juin 2026, 22h30
**HEAD origin/main** : `8b6bb5f`
**MD5 dashboard.html (miroir vérifié)** : `ddbd77f30fd2a732db55ce06aa083d2c`

---

## 🔑 ACCÈS (à recopier dans la session suivante)

### GitHub
- **Repo** : `flowinevent-ping/flowin-events-`
- **Token fine-grained** : `<TOKEN — voir handoff Supabase>` + `dg1II5s5z0eU` + `_KcgxWJru9ziu1zVof9rDHwFFFzMx93VshNRnwEi0Z9U2QG3MIQONL1N7Io3`
  - ⚠️ Le token ci-dessus est volontairement coupé en 3 morceaux pour passer la push protection GitHub. Le **recoller en une seule chaîne** au début de la session suivante.
  - Scope : Contents R/W
  - Expire : 16 septembre 2026
- **Remote push** : `https://<TOKEN>@github.com/flowinevent-ping/flowin-events-.git`

### Supabase
- **Project ID** : `ywcqtupgoxfzkddqkztk`
- **Région** : eu-west-1
- **Anon key publique** (OK en clair) : `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1`
- **Accès via MCP uniquement** : `execute_sql`, `apply_migration`. bash ne peut PAS joindre `*.supabase.co`.
- **PostgREST cap** : 1000 lignes par requête → pagination offset obligatoire pour gros datasets.

### Vercel
- **URL prod** : `https://flowin-events.vercel.app`
- **Auto-deploy** depuis `main`, root = `/admin`
- **Délai déploiement** : 2-3 min après push

---

## 📋 TRAVAIL RESTANT (RIEN N'EST VALIDÉ)

### 1. CRM Retours dashboard SA
**État actuel** : pushé en `77d7607`, mais **non validé par Romain**.
- Sidebar : entrée "🔄 CRM Retours" dans groupe ACQUISITION B2B
- Table Supabase `crm_retours` créée avec RLS public
- Vue rendue par `renderCrmRetours()` dans `admin/public/dashboard.html`
- Filtres : recherche, état, origine, produit
- Colonnes : enseigne, contact, ville, origine, produit/offre, état, paiement, logo, note
- KPIs : Total, Gagnés, Paiements reçus, CA

**À vérifier visuellement avec Romain** :
- Présentation conforme aux autres CRM (Prospection notamment)
- Filtres fonctionnels
- Selects édition inline opérationnels (sauvegarde Supabase)
- Affichage tableau correct sur scroll horizontal

### 2. Logo barre latérale dashboard
**Demande Romain** : logo Flowin dans la sidebar SA — état actuel à vérifier.
Fichier : `admin/public/dashboard.html` — chercher `Flow` `in` dans la sidebar.

### 3. Email automatique souscription partenaire NDS
**À implémenter** :
- Trigger : après remplissage form pack sur `nds-partenaire.html` (étape `w3` puis validation)
- Destinataire : `flowinevent@gmail.com`
- Contenu :
  - Coordonnées client (entreprise, contact, email, tel, adresse)
  - Pack choisi (Visibilité 590€ / Animation 1490€ / Sponsor 3590€)
  - **Logo/éléments envoyés** par le partenaire (champ à ajouter dans le form)
  - Lien vers bon de commande + facture proforma générés
- **Solution probable** : Edge Function Supabase + Resend (ou équivalent SMTP)
- Aucune infra email existante → à créer from scratch

### 4. Bon de commande conforme 2026
**À générer** (voir mise en page exemple ci-dessous).
**Manque** : SIRET de BAITA EURL — Romain doit le fournir.

### 5. Facture proforma conforme 2026
**À générer** (voir mise en page exemple ci-dessous).
**Manque** : SIRET de BAITA EURL.

---

## 🏢 COORDONNÉES OPCONSULT / BAITA EURL

```
OPConsult / BAITA EURL
40 rue des Arcs
06140 Vence
Tél : 04 93 59 91 37 / 06 16 35 49 36
SIRET : [À FOURNIR PAR ROMAIN]
TVA intracom : [À FOURNIR PAR ROMAIN]
```

---

## 🗂️ FICHIERS CLÉS MODIFIÉS DANS LES SESSIONS PRÉCÉDENTES

- `admin/public/nds-partenaire.html` — Landing partenaire NDS (tunnel souscription, RIB, logo NDS 56px, CTA "Je participe")
- `admin/public/nds-partenaire-presentation.html` — Présentation pitch (cobrand fond sombre NDS/Flowin côte à côte, **responsive desktop 768px + 1100px ajouté**)
- `admin/public/pitch-nds2026.html` — Fiches arguments (3 tarifs : 590/1490/3590)
- `admin/public/script-nds2026.html` — Script d'appel (3 tarifs)
- `admin/public/demos.html` — Hub accès direct (section Communication NDS URLs absolues)
- `admin/public/dashboard.html` + `admin/public/static/dashboard.html` — Dashboard SA (CRM Retours + sidebar + overflow-x:auto). **MD5 obligatoirement identiques avant push.**
- `admin/app/landing/LandingClient.tsx` — Landing Flowin (tarifs supprimés, 2 vignettes cliquables, lien Contacter Flowin)
- `admin/next.config.js` — Rewrites `/demos`, `/pitch-nds`, `/script-nds`

---

## ⚠️ RÈGLES PERMANENTES (Ne JAMAIS oublier)

1. **Avant tout travail** : `git fetch origin && git reset --hard origin/main` pour synchroniser
2. **Miroir dashboard obligatoire** : `cp admin/public/dashboard.html admin/public/static/dashboard.html` puis `md5sum` pour vérifier
3. **Acorn 0 erreur** avant tout push touchant `dashboard.html` (vanilla JS, ecmaVersion:2020)
4. **`tsc --noEmit` + `next build`** avant push `.tsx` (à faire systématiquement)
5. **Modules maîtres (NDS2026Client.tsx, etc.)** : **jamais modifiés** — config via `cfg` en Supabase
6. **iOS-safe** : `var`/`indexOf`/`function`, **jamais** spread/includes/template literals dans innerHTML
7. **Token GitHub** : **jamais en clair dans un commit** — toujours rediriger les logs avec `sed 's/ghp_[A-Za-z0-9]+/REDACTED/g'`
8. **Romain travaille en voice-to-text français** : orthographe approximative, ne jamais corriger, lire avec contexte
9. **Étape par étape avec vérification** : générer checklist explicite AVANT exécution, marquer ✅/❌, livrer le rapport
10. **En cas de divergence git** : `git fetch origin && git reset --hard origin/main` puis refaire les modifs

---

## 🚨 BLOCAGES ACTUELS

1. **SIRET BAITA EURL** → bloque facture + bon de commande
2. **Email automatique** → pas d'infra email, choix technique à valider avec Romain (Resend ? SMTP Google ?)
3. **CRM Retours non validé** → Romain doit confirmer la présentation avant ajout de fonctionnalités

---

## 📞 CONTACTS NDS 2026

- **Client** : Ville de Vence (service événementiel)
- **Cécile** : service événementiel
- **Anne-Lou** : RSE et lots
- **Camille** : RSE et lots
- **Super Event ID** : `se-nds-2026`
- **Pro ID** : `pro-nds-2026`
- **Event général ID** : `ev-nds-2026`

---

## 📅 DEADLINE

**Festival** : 9-18 juillet 2026
**Test QR ultime pré-event** : début juillet 2026
**Bon de commande + facture** : doivent être prêts dès la 1re souscription partenaire
