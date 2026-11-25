# Rubrique Paiement et tarifs
Entrée : « Flowin Event · Paiement ». Agents : `facturation-crm`, `flux-integrations`.

## Ce qui est propre
Offres et prix, bons de commande, factures, CGV, virement, prélèvement, numérotation légale, lien avec Jeffrey CRM (numéro légal).

## Règles
Source unique des prix : `admin/lib/reglement.ts`. Les copies à garder identiques sont listées dans ce fichier de code. Interdit : écrire un prix dans une autre page de documentation. Offre de lancement présentée en premier ; rien sur l'année suivante à la commande. Paiement : `PAIEMENT_ACTIF=false`, jeu visible avant paiement.

## Argent
Ce fichier est le seul renvoi : tous les prix se lisent dans `reglement.ts` et dans `docs/DECISIONS-flowin-event.md` (rubrique prix).

## Code
`admin/lib/reglement.ts`, `documentsAnimation.ts`, `admin/public/bon-commande-animation.html`, `bon-commande-pdf.js`, `cgv-animation-magasin.html`, `admin/app/dashboard/commercial`, `nds-bon-commande`. SQL `sql/03`, `sql/08`. Fonctions `supabase/functions/notify-bon-commande`, `notify-commande-animation`.

## Où ça vit
| Rôle | Profils |
|---|---|
| Jouent | Pro (commande, paiement) |
| Règlent | Super Admin (virement reçu, documents) |
| Fournissent | cette rubrique |
| Consomment | Pro, Organisateur (sur étude) |
Lire aussi : `pro.md`, `super-admin.md`, `donnees-securite.md` (factures lisibles sans connexion).

## À faire et notes
Prix non modifiables depuis le dashboard : décision de Romain en attente. SQL 08 non appliqué (export CRM absent). Visualiser et éditer bons et factures : page à construire. Facturation automatique et Jeffrey CRM : non faite, feu vert attendu. Détail : `kit/A-FAIRE.md`.
