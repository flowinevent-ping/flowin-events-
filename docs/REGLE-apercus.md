# Règle unique des aperçus du parcours joueur (famille I)

Établie le 16/09/2026. Une seule règle, deux formes, selon que l'event existe ou non.

| Moment | Forme | Composant | Écrans |
|---|---|---|---|
| **Avant création** — l'event n'existe pas encore | Gabarit rendu avec valeurs d'exemple, pastilles d'écran | `components/dashboard/ApercuApp.tsx` | `/dashboard/wizard-event`, `/dashboard/wizard-super-event`, `/pro/jeu` (gabarit Quiz + bonus), `/pro/rejoindre` |
| **Après création** — l'event existe | Vrai parcours en iframe (`preview=1`), cadre téléphone | `components/pro/ParcoursMobil.tsx` | fiche event SA (onglet **Aperçu**), `/dashboard/parcours`, `/dashboard/events` (onglet Parcours), `/dashboard/jeux`, `/pro/parcours`, `/pro/super/[event]` |

Règles de `ParcoursMobil` :

- le sélecteur d'events est **groupé par opération** (super event / events autonomes) — rien à plat ;
- la vue « Parcours super event » (écran carte) n'est proposée **que** pour une station de super event :
  un event seul n'a pas d'écran carte (`lib/gabarit.ts`, `BLOCS_MULTISTATION`) ;
- le super event est celui **de l'event choisi**, jamais deviné par la page appelante (famille D).

`Diffusion.tsx` (QR) garde son bouton « aperçu téléphone » : même technique (vrai parcours), rattaché au QR qu'on s'apprête à imprimer.

Ne pas créer de troisième forme d'aperçu.
