# RUNBOOK — Clôture partenaires d'un super event Flowin

Procédure standardisée à appliquer à la fin de chaque super event (festival/événement multi-partenaires), une fois tous les gagnants tirés et appelés. Établie et validée par Romain le 03/08/2026 sur NDS 2026.

## Pré-requis avant de lancer la clôture

- Tous les gagnants ont été tirés (`tirage_lot` / `tirage_soir`)
- Tous les gagnants ont été **appelés personnellement** et informés de la procédure de retrait
- Les devis/bons de commande partenaires sont à jour dans `bons_commande`
- PAT GitHub frais obtenu de Romain (repo public → PAT auto-révoqué à chaque session)

## Les 3 documents à produire, par partenaire

Scripts de référence (session 03/08/2026) : `gen3.py` (procédure), `gen_billets_coords.py` (coordonnées), `gen_factures.py` (factures).

**Document 1 — Récap grands chiffres + remerciement**
Contenu : chiffres réels du super event (festivaliers, dates), chiffres réels du partenaire (nb gagnants, valeur totale redistribuée — calculée depuis `tirages.lot_valeur`, jamais inventée). Ton chaleureux mais sobre, pas de jargon marketing ("belles ventes" refusé → "bonnes ventes"). *Remarque : ce document a été fusionné dans le corps de mail plutôt que produit en PDF séparé lors de la 1ère itération NDS 2026 — à trancher la prochaine fois si Romain veut un PDF dédié.*

**Document 2 — Récap procédure + code PIN**
Fiche A4 portrait par partenaire : logo client réel (recadré sur son contenu visible, pas de marge parasite), 3 étapes (montrer billet → scanner QR → taper PIN), 2 écrans de résultat (valable / déjà utilisé), bloc PIN encadré, footer signature Flowin.
- PIN = `partenaires.code_pin` (jamais `pin_pro`, colonne obsolète)
- Règle(s)/lot(s) réels du partenaire (`partenaires.lots`), un bloc unifié si plusieurs lots (pas d'encadrés empilés répétitifs)

**Document 3 — Liste complète des gagnants (une fois tous contactés/validés)**
Grille de cartes par gagnant : nom, téléphone, email, code ticket, QR code (lien direct vers `/lot.html?t=<token>`). Mention confidentialité obligatoire (coordonnées à usage interne, ne pas diffuser). Uniquement généré après confirmation que 100% des gagnants ont été appelés.

### Charte graphique du footer (validée 03/08/2026, à ne plus rouvrir)

- Fond : dégradé navy `linear-gradient(135deg,#1b2033,#2b3350)` — **ni noir plat, ni violet/aubergine**
- Logo Flowin : recadré strictement sur son bbox visible (fichier source avait une marge transparente asymétrique qui décalait le rendu) et fond détouré en transparence réelle (le PNG source avait un fond dégradé sombre opaque, pas transparent)
- Logo client en en-tête : hauteur standard ~62-64px, à agrandir au cas par cas (ex. Utile 84px) si le logo reste illisible

## Hébergement & diffusion

1. Générer les PDF (HTML → Playwright `page.pdf()`, format A4, marges nulles)
2. Committer dans `admin/public/kit-partenaires/{procedure,coordonnees,factures}/`
3. Push GitHub → déploiement automatique Vercel → URL publique `https://flowin-events.vercel.app/kit-partenaires/...`
4. **Ne jamais joindre les PDF en pièce jointe email** (le connecteur Gmail de la session ne le supporte pas) — toujours des liens de téléchargement vers ces URLs publiques dans le corps du mail

## Les 3 emails de clôture, par partenaire

**Mail 1 — Remerciement / introduction**
Annonce que le jeu est terminé, remercie le partenaire pour sa participation.

**Mail 2 — Information des gagnants + procédure**
Informe que 100% des gagnants ont été appelés, contient les liens de téléchargement Document 2 (procédure) + Document 3 (liste gagnants) + facture si applicable.

**Mail 3 — Clôture / actualité de l'événement**
Remerciement final + actualité de clôture du super event, garde le contact ouvert pour les prochaines animations.

*Remarque : lors de l'itération NDS 2026, les mails 1 et 2 ont été fusionnés en un seul envoi (contrainte de temps) — les 3 emails distincts sont la cible pour la prochaine fois si Romain confirme vouloir les séparer.*

### Périmètre facture

Facture jointe uniquement si le partenaire a un **devis réel** dans `bons_commande` (pas juste une ligne stub). Si devis existe mais facture pas encore émise dans `factures`, demander confirmation à Romain avant de créer une facture officielle (nouveau numéro, statut `emise`) — ne jamais émettre une facture sans validation explicite.

## Visuel de contrôle (à tenir à jour)

Tableau de suivi par partenaire × document/mail, à maintenir dans le hub Notion pendant la clôture d'un event. Voir section correspondante sur la page hub Comm.

## Erreurs vécues à ne pas reproduire

- Fabriquer des couleurs/logos sans vérifier le fichier source réel (bbox, transparence) → toujours inspecter le PNG avant de l'utiliser en footer/en-tête
- Confondre "brouillon Gmail créé" avec "email envoyé" — le connecteur ne fait que créer des brouillons, jamais d'envoi direct
- Annoncer un chiffre (valeur redistribuée, nb gagnants) sans le recalculer depuis la base au moment de l'envoi
