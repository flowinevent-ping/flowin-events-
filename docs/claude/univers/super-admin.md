# Profil Super Admin (Flowin)
Entrée : « Flowin Event · Super Admin ». Voir aussi `COMMUN.md` (Design).

## Ce qui est propre
Le dashboard : CRM pro et utilisateurs, animations, Super Events, tirages, lots, commercial (offres, bons, factures), banques communes, outils commerciaux, contrôles.

## Règles
Deux dashboards : le Next (`/dashboard`) et le monolithe vanilla (`dashboard.html` + miroir `static/`, MD5 identique, Acorn ES2020, `var`, `indexOf`). Toute donnée à accès fermé en anonyme se charge dans le navigateur avec le jeton SA, jamais dans un composant serveur (`ERREURS.md`).

## Argent
Offres et prix affichés dans « Offres et prix » : lecture seule de `paiement.md`.

## Code
`admin/app/dashboard`, `admin/components/dashboard`, `admin/public/dashboard.html`, `admin/lib/dashboard.ts`, `saSession.ts`, `GardeSA.tsx`.

## Si ton sujet touche une rubrique
| Sujet | Rubrique à lire aussi |
|---|---|
| Factures, bons, export CRM | `paiement.md` |
| RLS, lecture anonyme, accès | `donnees-securite.md` |
| Tirage, banques de questions | `jeux-tirages.md` |
| Outils commerciaux, annonces | `prospection.md` |

## À faire et notes
CRM vides (cause trouvée) : PR #99. Hub installable : en ligne (/hub.html), il appartient à cette rubrique. SQL 08 (export CRM) non appliqué. Page de visualisation des factures et bons à construire. Détail : `kit/A-FAIRE.md`.
Contrat de données (conservé, isolé, tracé) : `kit/CONTRATS-DONNEES.md`, section Super Admin.
