# Tickets gagnants : modèle de données (10/11/2026)

Une seule table pour tous les lots gagnés, animations comme super events : **`tirages`**.

| Étape | Où | Ce qui est écrit |
|---|---|---|
| Le joueur gagne (animation : gain immédiat, roue) | `appliquer_regle_gain` → `attribuer_gain_joueur` (`sql/appliquer_regle_gain.sql`), appelé par `lib/parcours.ts` | ligne `tirages` : `joueur_id`, `event_id`, `lot_nom`, `ticket_code`, `retrait_token` |
| Le joueur gagne (tirage au sort) | tirage du pro / `tirage_super_event` | même table, `super_event_id` pour un super event |
| Billet | `/nds/billets-partenaires.html?t=` (RPC `billet_par_token`) | QR → `/lot.html?t=` |
| Validation en caisse | `valider_lot` (PIN pro, `sql/2026-11-07-securite-ecritures.sql`) | `retire_at`, déstockage `lots_stock` (lot, sinon commerce) |
| Quantité restante | `appliquer_regle_gain` | compte les `tirages` par lot (`lots.quantite`) |
| Lecture joueur | `/moi` → `lib/mesLots.ts` | `tirages` par `joueur_id` |
| Lecture pro | Gagnants → `lib/operations.ts` | `tirages` par `event_id` + `lots_stock` |
| Lecture super admin | `/dashboard/gagnants` (`fetchGagnants`), fiche joueur (`fetchJoueurTirages`) | `tirages` |

Tables secondaires : `se_tickets` (tickets de tirage super event), `participations` (tickets d'animation),
`tirage_resultats` (gagné / pas tiré), `se_gains` (abandonnée le 28/07, encore lue par `/moi` à titre d'historique).

Ajouts proposés, non appliqués : `sql/2026-11-10-tickets-animation.sql` (validité, offert à un ami,
rappels in-app 1 mois / 15 j / 48 h, relance e-mail) et la fonction `supabase/functions/rappel-tickets` (non déployée).
