# Passation — refonte Flowin Event (08/11/2026)

À lire en ouvrant une nouvelle session, après `CLAUDE.md` et `docs/DECISIONS-flowin-event.md`.

**Règle de continuité (Romain, 08/11/2026)** : Romain reste dans la même conversation et ne gère
aucune passation. C'est Claude qui tient ce fichier à jour à chaque étape et qui, si besoin, ouvre
lui-même une autre session en lui donnant ce fichier comme point de départ.

## Où on en est
- **En ligne** : migration de sécurité (écritures réservées à l'admin, PIN obligatoire au retrait),
  connexion obligatoire au dashboard admin, corrections d'affichage (tiroirs, « Créer un pro »,
  carte admin, pictogrammes, couleurs), Visite guidée mise à jour (`/visite-guidee/`, écran
  « Votre QR est prêt »), storyboards vidéo v16, plaquettes refondues en validation
  (`/validation/plaquette-super-event.html`, `/validation/plaquette-animation-magasin.html`).
- **Table de validation** (artifact privé de Romain) : écran QR, Visite guidée, plaquettes, 4 vidéos MP4.
- **Audits** : `docs/audit-2026-11-07/` (v1 à v4) et `docs/audit-2026-11-08/` (parcours pro, communication).

## En attente de Romain
1. Contact des rendez-vous (WhatsApp et email) : vides dans les plaquettes.
2. Prix : proposition dans `docs/CADRAGE-refonte-flowin-event.md` (110 €/mois ou 990 €/an ;
   500 / 1 331 / 3 331 € HT ; organisateur sur étude) ; prix du kit imprimé.
3. Garantie : activer ou retirer (`GARANTIE_ACTIVE` dans `flowin-config.js`).
4. Démo organisateur « créer un super event » : garder ou retirer.
5. Nettoyage base (clic Supabase) : données de test `pro-qa-tech-1` et rattachements, et 5 banques
   « Nouvelle banque quiz » vides (`bq-nook-r1u56z`, `bq-nook-dhxy3p`, `bq-flowin-usk3nc`,
   `bq-charvolin-tw896q`, `bq-nds-2026-wfgqco`). Bug à corriger : `app/pro/banques/nouvelle/page.tsx`
   crée une banque au simple affichage.

## Ordre de travail recommandé (session suivante)
1. ~~Corriger le cadrage~~ (fait le 08/11 : positionnement, vocabulaire, couleurs du commerçant). Précédemment : corriger le cadrage selon le cahier des charges design (effet jeu, couleurs du commerçant,
   carte de fidélité interactive, privilèges, attractivité) et l'objectif de conversion.
2. **Audit critique design / ergonomie / architecture** (un agent, sévère), mesuré à ce cahier et à
   la conversion, sur : Visite guidée, plaquette Super Event, plaquette commerce, jeu côté joueur.
   Comparer aux standards actuels (apps de fidélité, jeux mobiles, pages produit en défilement
   animé). Intégrer la **campagne d'inscription gratuite** : parcours d'inscription minimal sans
   frein, consentement à être contacté, apparition sur la carte des partenaires, demande d'adhésion
   envoyée par les clients depuis la carte.
3. Romain valide les recommandations.
4. **Un écran à 10/10** (jeu côté joueur aux couleurs du commerçant, ou accueil de la plaquette Super
   Event), validé sur le téléphone de Romain.
5. Reproduction sur le reste, un support à la fois, deux tours de retours maximum.
6. Report dans l'app réelle, un parcours de bout en bout à la fois, captures 360/390/430 en preuve.
