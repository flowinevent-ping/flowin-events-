# Audit v4 — Parcours pro & segmentation de l'offre (07/11/2026)
Lecture seule. Complète v1/souscription-pro (densité écran final), v2/technique, v3/coherence-explications. Captures : `shots/parcours/01-accueil-pro.png`, `02-rejoindre.png`, `03-super.png` (390×844, ?pro=pro-nook).

## 1. Inscription pro → base
- `/pro/inscription` redirige vers `/pro/premiere-fois` (`app/pro/inscription/page.tsx:9-11`). Écriture : `supabase.auth.signUp` puis insert `pros` statut `en_attente` (`lib/inscriptionPro.ts:32,52`, doublon de logique dans `components/pro/PremiereFois.tsx:245`).
- Table `pros` : id, nom, ville, code_postal, adresse, siret/siren, NAF, email, tel, statut, **auth_id uuid** (lien Auth), onboarding_source, onboarding_fini_at, acces_active_at, abonne, partenaire_id.
- **Casse** : SQL `count(*) where auth_id is null` = **17 pros sur 18** sans compte Auth lié → les pros créés par le SA / l'historique ne peuvent pas se connecter ; seul le lien `?pro=` les « ouvre ». Deux implémentations du signUp (lib + composant) = risque de divergence (Pattern G).
- Manque : aucune colonne « offre souscrite / segment » sur `pros` ; `abonne` booléen seul.

## 2. Tableau de bord → rejoindre un/plusieurs super events, paiement à la fin
- Accueil pro (`01`) : « Nouvelle animation — Créer ou rejoindre » ; `/pro/rejoindre` → `/pro/nouvelle?type=rejoindre` (`app/pro/rejoindre/page.tsx:7`). Parcours 4 étapes : Super event (carte Leaflet) → Jeu → Lots → Diffusion & QR (`02`).
- Écriture : `demandes_rattachement_super_event` (insert `ParcoursCreation.tsx:548-567`) puis validation SA `approuver_demande_rattachement()` qui crée un `events` (station) + lots + ajoute le pro à `super_events.pros[]`/`events[]`.
- **Paiement** : aucun paiement dans le parcours. La grille (`GrilleTarifs`, `ParcoursCreation.tsx:1293`) n'est qu'une **préférence** « Tarif à confirmer » stockée en texte dans `offre`. Le bon de commande (`bons_commande`, `bon-commande-nds.html`) est un flux SA séparé ; GoCardless n'est branché que sur `animationMagasin` / `operations` (events autonomes), pas sur la demande de super event. → « paiement à la fin » **n'existe pas** pour le super event : il n'y a pas de fin payante, il y a une validation SA puis un bon hors parcours.
- **Casse — prix incohérents sur 3 sources** : `packs_participation` (DB) = Visibilité 500 / Animation **1331** / Sponsor **3331** ; `lib/commercial.ts` `PACKS_DEMANDE` (l.~178-185) = 500 / **1400** / **3590** ; commentaire `GrilleTarifs.tsx:7` = 500 / **1490** / 3590. La grille affichée au pro lit le code (ou `cfg_jeu.packs`), pas la table que le SA édite (`majPackParticipation`). Le SA modifie un prix qui ne s'affiche nulle part dans le parcours.

## 3. Segmentation full digital / physique + digital
- Existe : flags `diffusion_physique`, `diffusion_digital`, `diffusion_qr_tracking` sur la demande (`ParcoursCreation.tsx:557`) ; 2 demandes ont `diffusion_physique=true`. Packs = 3 niveaux de **visibilité** (Visibilité/Animation/Sponsor) + « simplement visible » (prixHt null) — axe quantité, pas axe support.
- **Manque** : aucune notion d'offre « Full digital » vs « Physique + digital » dans `packs_participation` (pas de colonne `segment`/`supports`), ni dans `bons_commande` (`offre` texte libre), ni de catalogue de supports papier (affiche, chevalet, flyer, sticker QR : quantités, format, coût d'impression, délai, adresse de livraison). Les flags de diffusion ne changent ni le prix ni le bon de commande ni une tâche logistique côté SA. Plaquettes (`plaquette-nds.html`, `plaquette-super-event.html`, `plaquette-animation-magasin.html`) ne présentent pas cette segmentation.

## 4. « Je crée mon animation » autonome → carte de sa ville
- **N'existe pas.** Toutes les cartes sont filtrées par super event : `app/se/[se]/page.tsx:21` (`.eq('super_event_id', seId)`), `app/jouer/page.tsx:54` (idem), `SuperEventMap`, `dashboard/nds-carte`. La carte du parcours « rejoindre » liste des super events (`lib/superEventsOuverts.ts`), pas des commerces.
- SQL : 19 events sans super event, dont **3 seulement** ont lat/lng → même si une carte ville existait, 16/19 n'y apparaîtraient pas (le parcours autonome ne géocode pas systématiquement, contrairement à `superEventsOuverts` avec `geocoder:true`).
- Aucune distinction visuelle station SE vs animation autonome (pas de champ `type_visibilite`, pas de légende). `public/carte.html` n'est pas une carte : c'est une carte de visite qui **POST directement dans `partenaires` avec la clé publique** (`carte.html:96,143`) — à vérifier côté RLS.

## 5. Pont station autonome → super event
- Colonne `demandes_rattachement_super_event.event_id` existe, mais `approuver_demande_rattachement()` **l'ignore** : il crée toujours un nouvel `events` (`v_ev := 'ev-'||…||md5`), donc la station autonome, son QR imprimé, ses joueurs et son historique ne sont pas raccrochés — doublon de station.
- Aucun raccourci « Raccrocher cette animation à un super event » sur la carte d'une animation (accueil `01`), aucun tarif spécial (pas de pack « déjà client », pas de remise, `remise()` dans `commercial.ts` ne s'applique qu'à un bon déjà émis).

## 6. Plusieurs super events
- Modèle : `events.super_event_id` scalaire → **une station = un super event** ; un pro peut avoir N stations. `super_events.pros[]` tableau. SQL : **9 pros** déjà présents dans >1 super event → le modèle le permet.
- Pas de contrainte d'unicité (seul CHECK statut) : un pro peut déposer 2 demandes pour le même SE ; l'approbation créerait 2 stations.
- UI : l'accueil range par mois avec filtre « Super events » ; `/pro/super` (`03`) montre un seul SE à la fois (« Ma participation — Nuits du Sud 2026 ») ; aucun écran « Mes super events » listant demandes en attente / validées / refusées, ni blocage « déjà inscrit ».

## Tableau
| Point | Marche | Casse | Manque |
|---|---|---|---|
| 1 Inscription | signUp + pros.auth_id | 17/18 pros sans auth ; signUp dupliqué | champ offre/segment |
| 2 Rejoindre + paiement | parcours 4 étapes, approbation crée station | 3 grilles de prix divergentes ; table SA non lue | paiement en fin de parcours, bon auto-généré |
| 3 Segmentation | flags diffusion sur demande | flags sans effet prix/logistique | packs Digital / Print+Digital, catalogue supports |
| 4 Carte ville | — | 16/19 autonomes sans GPS | carte ville, marqueur « autonome » |
| 5 Pont | colonne event_id | ignorée par l'approbation → doublon | CTA, tarif passerelle |
| 6 Multi-SE | modèle N stations, 9 pros multi | doublons de demande possibles | vue « Mes super events », statut des demandes |

## Manques (exhaustif)
1. Source unique des prix (table vs code). 2. Étape paiement/engagement finale (bon de commande pré-rempli + signature + mandat/CB) dans le parcours rejoindre. 3. Segment d'offre `digital` / `print_digital` en base. 4. Catalogue supports papier (type, qté, prix [à fixer], délai, livraison). 5. Tâche logistique SA « supports à imprimer » à la validation. 6. Carte publique par ville (`/carte/[ville]` ou `/ville/[cp]`). 7. Géocodage obligatoire des animations autonomes. 8. Distinction visuelle autonome / station SE. 9. Rattachement d'un `events` existant à un SE (réutilisation event_id, QR conservé). 10. Tarif passerelle autonome→SE [à fixer]. 11. CTA « Rejoindre un super event avec cette animation ». 12. Unicité (pro_id, super_event_id) des demandes actives. 13. Écran « Mes super events » + statut demande. 14. Liaison Auth pour pros existants (invitation). 15. Cohérence plaquettes / bons avec la segmentation.

## Suggestions priorisées
**P0**
- Prix : `GrilleTarifs` lit `packs_participation` (via `fetchPacksParticipation`) ; supprimer prix en dur de `lib/commercial.ts` `PACKS_DEMANDE` (garder structure, prix `null` → « [à fixer] ») ; corriger commentaire `GrilleTarifs.tsx:7`. Romain tranche 1331 vs 1400 vs 1490.
- `approuver_demande_rattachement` : si `d.event_id` non nul et appartient à `d.pro_id` → `update events set super_event_id=s.id, module, cfg` au lieu d'insert (migration, à valider).
- Index unique partiel `demandes_rattachement_super_event(pro_id, super_event_id) where statut in ('en_attente','validee')` + message « déjà inscrit » dans `ParcoursCreation.tsx` étape 1.
**P1**
- Modèle offre : `packs_participation` + colonnes `segment text check in ('digital','print_digital')`, `supports jsonb` (liste type/qté), `prix_ht` [à fixer] ; demande : `pack_id` + `segment` remplacent le texte `offre`. Grille à 2 onglets « 100 % digital » / « Digital + supports papier ».
- Étape finale « Valider et payer » : récap → génère `bons_commande` (event_id, super_event_id, offre, montant catalogue) → signature CGV → paiement (GoCardless déjà présent `app/api/paiement/gocardless`) ; scinder l'écran final (cf. v1 P0-1).
- CTA sur chaque carte d'animation autonome (`/pro` accueil) → `/pro/nouvelle?type=rejoindre&ev=<id>` pré-remplissant adresse/lots/GPS et `event_id` ; pack « passerelle » [à fixer].
- Écran `/pro/super` : liste de tous mes SE + demandes (en attente / validée / refusée + note_sa).
**P2**
- Carte ville publique : requête `events` status actif, lat/lng non nuls, groupée par `pros.ville`/cp ; marqueurs distincts (station SE = couleur/logo du SE + lien `/se/[se]` ; autonome = marqueur neutre « Animation du commerce ») ; géocodage obligatoire à la création autonome (`lib/geocodage.ts`).
- Invitation Auth pour les 17 pros sans `auth_id` ; fusionner signUp (`PremiereFois.tsx` → `lib/inscriptionPro.ts`).
- Revoir RLS insert `partenaires` (`public/carte.html:143`). Mettre à jour plaquettes avec la segmentation.
