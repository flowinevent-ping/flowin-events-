# COMMUN : Design, règles communes, circuits
Entrée « Flowin Event · Design » (seule propriétaire du style commun). Agents : `produit-ergonomie`, `critique-ergonomie`.

## Design
**Ce qui est propre** : ergonomie, UX, UI, fluidité, nombre de clics, animations, sons, fidélité aux maquettes (`kit/MAQUETTES.md`), responsive 390 px.
**Règles** : carrousel, jamais de longue page ; peu de texte ; moins d'actions ; police 13 px et plus, zones tactiles 44 px et plus ; pas d'emoji (pictogrammes) ; bleu #3B5CC4 pour Animation et actions, orange pour Super Event, jamais de violet ; cartes blanches, texte encre #1B3A5C. Détail : `docs/DECISIONS-flowin-event.md` (« RÈGLES D'INTERFACE ABSOLUES »), `docs/claude/VISION-ERGONOMIE.md`.
**Code** : `admin/lib/charte.ts`, `admin/public/flowin-theme.css`, `admin/styles/`, `admin/components/ui`, `lib/proicons.tsx`, garde-fou `admin/scripts/verifier-emojis.mjs`. Seule cette entrée modifie le style commun.
**À faire et notes** : pages d'installation (`admin-app`, `pro-app`, `joueur-app`) avec bouton violet ; audits `docs/claude/AUDIT-ERGO-*.md` ; propositions `docs/claude/AMELIORATIONS.md`.

## Règles communes
Elles vivent dans `docs/ESSENTIEL.md` (règles fixes) et `docs/claude/REGLES.md` (toutes les règles décidées). Ne pas les recopier.

## Circuits (qui crée, qui valide, qui consomme)
| Objet | Crée | Valide | Consomme |
|---|---|---|---|
| Animation | Pro (ou Super Admin pour lui) | Flowin à la publication | Participant |
| Super Event | Organisateur | Super Admin | Stations, Participant |
| Station | Pro (demande) | Super Admin | Participant |
| Banque commune | Super Admin | Romain | Pros |
| Ticket, gain | Participant (en jouant) | Pro (retrait), Flowin (tirage) | Participant |
| Bon de commande, facture | Pro | Super Admin (virement reçu) | Pro |

## Argent
Renvoi unique : `univers/paiement.md`.
