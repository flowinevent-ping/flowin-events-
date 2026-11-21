# Mémoire : securite-donnees (créée le 21/11/2026 ; ≤120 lignes)

## SQL appliqués en production (dates et fichiers, d'après les docs SÉCURITÉ et E2E)
- 19/11 (ordre appliqué, accord de Romain : les 18 pros sans accès sont des comptes de test) : `sql/2026-11-18-tirage-correctifs.sql`, `2026-11-19-super-event-phases.sql`, `2026-11-19-banque-interets.sql` (brouillon privé), `2026-11-18-annonces-pro.sql`, `2026-11-19-securite-events-rls.sql`, `2026-11-19-securite-rls-tables.sql`.
- 19/11 : `2026-11-19-securite-rls-phase2.sql` (toutes les autres tables `public`, TRUNCATE retiré partout).
- 19/11 : `2026-11-19-securite-joueurs-rpc.sql` parties A (RPC) puis B (retraits anon sur se_tickets, se_reponses, se_gains, parrainage, visites, partenaire_clics).
- 20/11 : `2026-11-19-securite-joueurs-partie-c.sql` C1 (RPC) puis C2 (SELECT anon retiré sur joueurs, participations, tirages).
- 20/11 : `2026-11-19-emails-compteur-jour.sql` (garde-fou 450/jour) ; `2026-11-20-rappel-tickets-secret.sql` (Vault `rappel_cron_secret`, RPC `rappel_cron_verifier`, cron `tickets-rappels` avec en-tête `x-flowin-cron`).
- 20/11 : `2026-11-20-resultats-tirage-inapp.sql` (palier `resultat`, `mes_notifications`) ; `2026-11-20-valider-lot-pro-proprietaire.sql` et `2026-11-20-super-events-insert-pro-orga.sql` (appliqués avant le rejeu E2E).
- Avant : `2026-11-10-qr-stations-A-COLLER.sql` (appliqué, note du 10/11), `2026-11-10-import-fichier-client.sql` (appliqué en version adaptée). Statut des autres fichiers `sql/2026-10-*`, `2026-11-07-securite-ecritures.sql`, `2026-11-10-lot-a.sql`, `tickets-animation`, `2026-11-17-*` : non consigné dans ces docs : vérifier en base avant de conclure.

## Failles trouvées et corrigées (résumé ; détail ERREURS.md)
- Six fonctions de tirage appelables par anon (`attribuer_gain_joueur`, `tirage_super_event`, `annuler_tirage`, `marquer_notifie`, `tirage_lot`, `tirage_soir`) : fermées ; `appliquer_regle_gain` reste ouverte (SECURITY DEFINER, `_attribuer_gain_interne` non exposé).
- Politiques `ALL true` sur lots, super_events, qr_stations, participations, joueurs, tirages, comm_*, config, landings, banques, etc. : remplacées (lecture publique conservée où le parcours la lit, écriture SA ou pro propriétaire). Fonctions d'aide : `est_super_admin()`, `qr_est_proprietaire`, `flowin_est_pro_super_event`, `flowin_pro_gere_lot`, `flowin_pro_voit_joueur`, `flowin_joueur_est_moi`, `flowin_joueur_ref`, `_tirage_acces`.
- Lecture des coordonnées joueurs par la clé publique : fermée (partie C) ; côté pro : statistiques pseudonymisées (`pro_joueurs_stats`, `flowin_joueur_ref`).
- Relais d'e-mail ouverts : `send-ticket-gagnant` v5, `notify-bon-commande` v5 (bon relu en base) ; `rappel-tickets` v4 sous secret.
- Dashboard SA : plus d'upsert seed au chargement ; session SA non effacée ; `?demo=1` actif.

## Risques ouverts (non traités, assumés)
- INSERT anonymes voulus (flux joueur) : `joueurs`, `participations`, `se_gains`/`se_tickets`/`se_reponses` via RPC, `visites`, `partenaire_clics`, `sondage_brigade`, `crm_retours`, `leads_landing` : un tricheur peut spammer ; « sur place » (géolocalisation) non vérifiable côté serveur.
- L'id joueur sert de jeton dans le téléphone : connaître un e-mail donne l'id, donc les RPC « moi » (tickets, gains, lots). Durcir demande une preuve par lien e-mail.
- Pages `/pro/*` rendues côté serveur protégées par le seul `?pro=` ; `crm_pro` / `fetchCrmPro` à revoir.
- Connexion joueur par lien e-mail crée des comptes Auth : « authenticated » n'est pas de confiance.
- Fonctions Edge en `verify_jwt` false (`rappel-tickets`, `notify-commande-animation`, `notify-souscription`...) : chacune doit se protéger elle-même ; `send-resultat-tirage` neutralisée, non déployée.
- Version déployée des fonctions vs dépôt : à comparer (précédent : `send-ticket-gagnant` ancienne version en prod).
- Table `events` sans `updated_at` : un écrasement passé n'est pas datable ; `ev-paques` et `ev-crf-2026` prod ≠ seed (à vérifier par Romain).
- Supabase gratuit : pause après 7 jours d'inactivité (risque avant un événement) ; plan Pro non décidé (`docs/rapatriement-compte-maitre.md`).
- Lot organisateur d'un Super Event sans partenaire : seul le SA peut le valider (`pin_requis`).
- `NDS2026Client.tsx` (non modifiable) compte `se_tickets` en direct : 0 après la partie B, sans erreur.

## Pièges et méthode
- Tester sur un PostgreSQL 16 local jetable (schéma stub repris des définitions prod) avant d'appliquer ; SQL idempotent avec bloc ROLLBACK en pied.
- Vérifier après application : anon refusé / autorisé selon la liste attendue, lectures publiques en 200, parcours complet joueur.
- Tout DELETE ou migration en prod : annoncé, Romain devant l'écran ; jamais rejouer `apply_migration`.
- Ne JAMAIS appeler `rappel-tickets` en mode normal. Statut HTTP d'un cron : `net._http_response` ou journaux Edge.
- Premier passage planifié protégé : 21/11 09:07 UTC, à contrôler (procédure dans `docs/SECURITE-rappel-tickets-2026-11-20.md`).

## Sources et standards utiles
- Supabase : advisors de sécurité (`get_advisors`), guide RLS ; PostgREST (codes PGRST202, 42501) ; OWASP API Security Top 10 (autorisation au niveau objet) ; RGPD art. 32.

## Contrôles quotidiens (niveau 1, appliqué en prod le 21/11/2026)
- `sql/2026-11-21-controles-qualite.sql` (migration `controles_qualite_2026_11_21`) : tables `controles_qualite` (une ligne par contrôle et par passage) et `schema_reference` (RLS sans politique) ; fonctions `controle_qualite_lancer()`, `controle_qualite_dernier()`, `schema_empreinte()`, `schema_reference_rafraichir()` (service_role seulement) ; cron `controle-qualite-quotidien` à 03:17 UTC. 30 contrôles : SECURITE, INTEGRITE, ENVOIS, PROPRETE, PRODUIT, FACTURATION, DERIVE. Lecture seule, ne corrige rien.
- Lire : `select public.controle_qualite_dernier();` (service_role ou éditeur SQL). Liste blanche des INSERT anonymes = variable `v_liste_blanche` de la fonction.
- Dérive : première référence prise le 21/11 (414 éléments, politiques + droits des fonctions). Après un changement VOULU de droits ou politiques : `select public.schema_reference_rafraichir();`, sinon la ligne `schema_derive` reste orange.
- Premier passage du 21/11 : rouge = `pros` lisible par anon (politique `pros_anon_select`), TRUNCATE accordé sur `emails_compteur_jour`, lot `Bon d'achat 20 €` de `ev-nds-bergerie` tiré 8 fois pour 7, 1 tirage `soir` sans joueur (ev-nds-utile, 01/08). Orange = 13 events sans lot, données TEST à nettoyer, animations sans position / lot / QR. Rien corrigé (consigne), décisions à Romain.
- Pièges : Supabase accorde par défaut tous les droits aux nouveaux objets `public` (revoke explicite obligatoire, y compris TRUNCATE sur les tables créées par migration). `pros` n'a pas de `created_at` : le contrôle utilise `entree_p`. Le contrôle des lots peut signaler un faux positif si `lots.quantite` est décrémentée au retrait.
- Retrait : bloc ROLLBACK en pied du fichier SQL. Le journal grossit de 30 lignes par jour (purge à décider).

## Ouvert
- Cron du 21/11 09:07 UTC : `succeeded` dans `cron.job_run_details` (statut HTTP réel non relu) ; corriger les rouges du contrôle quotidien (voir ci-dessus) ; état prod des SQL non consignés ; décision sur le plan Supabase ; durcir l'identité joueur ; revoir `crm_pro`.
