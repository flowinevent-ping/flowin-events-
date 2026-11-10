# Régressions Super Admin — 10/11/2026

Base de comparaison : `cb7d7594` (dernier commit de `main` avant le 10/11 06:00 UTC) → HEAD.
Méthode : `git diff` de toutes les surfaces SA (components/dashboard, app/dashboard, lib/outilsCommerciaux.ts,
lib/dashboard.ts, public/dashboard.html, public/admin-commandes-animation.html), lignes supprimées passées une à une.
Captures : scratchpad `regressions/` (build `next start` local, session SA factice, écritures interceptées).

| Élément | Avant (commit / fichier) | Après (avant correctif) | Restauré |
|---|---|---|---|
| Menu « Comm & outils » : Bons de commande & factures, Commandes Animation, Générer une facture, Packs de participation, CGV & légal | cb7d7594 · Sidebar.tsx, groupe Comm & outils | Déplacés dans le nouveau groupe « Commercial » (absents de Comm & outils) | Remis aussi dans Comm & outils (ids `*-co`), toujours présents dans Commercial — ce commit |
| Landing pages & outils commerciaux | Comm & outils | Disparu puis remis | 7be3599d (déjà) |
| Envoi en masse : téléphone, lot utilisé chez quel commerce | envoi-masse/page.tsx | Colonne tél. seulement en WhatsApp, commerce absent | 7be3599d (déjà) |
| Gagnants : « utilisé chez <commerce> » + date | gagnants/page.tsx (statut « Le <date> » seul) | Commerce non affiché dans le statut | « Utilisé chez <commerce> le <date> » — ce commit |
| Stock des lots : lot utilisé chez qui + date | nds-lots/page.tsx (« le <date> ») | idem | « utilisé chez <partenaire> le <date> » — ce commit |
| Joueurs : tél., ville, code postal | joueurs/page.tsx | Présents (pas de régression) | — vérifié |
| Pros : téléphone, ville, code postal | pros/page.tsx | Présents (pas de régression) | — vérifié |
| Scénarios vidéo v14 (commerçants, organisateurs, partenaires) | cb7d7594 · outilsCommerciaux.ts + public/storyboards-video/v14-*.html | Entrées remplacées par v16, fichiers supprimés | Fichiers restaurés + 3 entrées « Archive v14 » (filtre Archives animations) — f081fffc (commité avec le correctif v22) |
| Animations v22 (5) | ajoutées le 10/11 avec `archive: true` | Visibles seulement dans « Archives animations » | f081fffc : visibles partout ; filtre « Animations » inclut aussi les archives — ce commit |
| Plaquette Super Event V2 (/plaquette-super-event.html) | fichier public, hors catalogue | Inatteignable depuis le SA | Entrée « Plaquette Flowin Super Event V2 » ; « Plaquette Animation magasin (V2) » renommée pour la distinguer de la V3 |
| Films V4 (5) | 10/11 | Présents, statut validé | — vérifié (filtre Animations) |
| Cockpit Pilotage (Live maintenant / À venir / Passés) | pilotage/page.tsx : vignettes `cursor: default`, aucun clic | Rien ne s’ouvrait | Chaque vignette ouvre la fiche de l’animation ; gabarit `se-master-superevent` exclu ; stations marquées « Station de super event » — ce commit |
| Cartes pro (Animations) : chips Partenaires / Joueurs / Lots / Gagnants | events/page.tsx : liens vers pages globales, sans le pro | Pages globales sans filtre (« rien ne marche ») | Chips ouvrent la fiche du pro sur l’onglet filtré (Partenaires → fiche partenaire liée, Joueurs → CRM, Lots → Lots & stock, Gagnants → Gagnants & billets) — ce commit |
| Comptage « N animations » (pro-nds-2026) | stations NDS + 16 copies du gabarit + test comptées ensemble | « 5 animations » / totaux gonflés | Animations = events sans super event (gabarit exclu) ; stations affichées à part : « Nuits du Sud 2026 · 14 stations (points de jeu) » ; accueil : « N animations · M stations » ; CRM Pro : gabarit exclu des comptes — ce commit. Aucune donnée supprimée |
| dashboard.html | cb7d7594 | Seules différences : couleurs violet → bleu (décision) | — non touché |
| Diffusion : avertissement « ancien format » | Diffusion.tsx | Retiré | Décision explicite (DECISIONS) — non restauré |
| Libellés Event → Animation | divers | Renommage | Décision — non restauré |

## À signaler (fichiers d’un autre agent, non modifiés)
- `components/operations/BlocsOperations.tsx` (`grouperOperations`, onglet « Ses stations » de la fiche pro) : le badge compte 19 stations pour pro-nds-2026 ; à vérifier qu’il exclut le gabarit `se-master-superevent`.
