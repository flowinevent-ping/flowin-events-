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
- Pages `/pro/*` rendues côté serveur protégées par le seul `?pro=` (le CRM, lui, est fermé depuis le 23/11 : voir plus bas).
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

## `pros` lecture anonyme (21/11/2026)
- `sql/2026-11-21-pros-lecture-publique.sql` + `docs/SECURITE-pros-2026-11-21.md` : partie A appliquée (4 RPC : `pro_fiche_publique`, `pro_id_existe`, `pros_partenaires_de`, `jeux_propres_partenaires`), code `bd844bdc` déployé. Partie B (`drop policy pros_anon_select`) : apply_migration sans réponse de Romain (timeout 230 s), politique toujours présente, contrôle rouge. À refaire devant Romain, puis `schema_reference_rafraichir()` et relire le contrôle.
- Pièges : sans politique SELECT, un INSERT anonyme `on conflict` est refusé par la RLS (testé PG16) ; la vue `v_se_commerces` est security_invoker ; ne pas retirer le droit de table SELECT à anon avant migration de ces points. Un id de pro peut dériver de l'e-mail : ne jamais le rendre en public.
- Ouvert : `flowin_export_pros(p_token)` exécutable par anon, jeton en dur dans la fonction et dans `docs/backup/backup-crm-nds-google-sheet.gs` (ne pas le recopier) ; TRUNCATE sur `emails_compteur_jour`.

## Ouvert
- Cron du 21/11 09:07 UTC : `succeeded` dans `cron.job_run_details` (statut HTTP réel non relu) ; corriger les rouges du contrôle quotidien (voir ci-dessus) ; état prod des SQL non consignés ; décision sur le plan Supabase ; durcir l'identité joueur ; jeton en dur des fonctions `flowin_export_*` / `nds_export_*` (voir CRM pro).

## CRM pro `crm_pro` fermé (23/11/2026)
- Trou : `crm_pro(p_pro)` et `crm_participants(p_se)` SECURITY DEFINER exécutables par anon sans contrôle (prénom, nom, e-mail, tél de tous les joueurs). `crm_pro_consentants` (sql/05) n'a jamais été appliquée.
- Corrigé : code `a9db7a3f` (CRM lu dans le navigateur avec la session : `CrmProCharge`, `FicheContactPro`, `RapportProAvecContacts` ; sans session « Connectez-vous pour voir vos contacts ») puis migration `crm_pro_securise_2026_11_23` appliquée (`sql/2026-11-23-crm-pro-securise.sql`) : corps dans `_crm_pro_interne` / `_crm_participants_interne` (non exposées), `crm_pro` = SA ou pro propriétaire (`pros.auth_id = auth.uid()`) sinon 42501, masquage serveur (e-mail, tél, nom initial sans consentement), `crm_participants` SA seul. Preuve : appel REST anonyme = 401 « permission denied », contrôle quotidien sans nouveau rouge, `schema_derive` vert après `schema_reference_rafraichir()`.
- Doc : `docs/SECURITE-crm-pro-2026-11-23.md`. Proposition de contrôle des fonctions à données perso exécutables par anon : `sql/PROPOSITION-controle-fonctions-donnees-perso-anon.sql` (non appliquée).
- Ouvert : `flowin_export_users/partenaires/pros`, `nds_export_crm`, `nds_export_joueurs_uniques` anon + jeton en dur (jeton à considérer exposé, à changer : décision de Romain) ; `moi_profil`, `mes_consentements` (id joueur = jeton).
- Pièges : un composant serveur n'a pas de session (lire avec le navigateur) ; en `?demo=1` une RPC refusée renvoie un objet `{ok:true,demo:true}` (tester `Array.isArray`) ; ProShell attend la fiche du pro (utiliser un vrai pro `pro-test-boulangerie-e2e` pour les tests Playwright) ; `next start` d'une ancienne build occupe le port (tuer `next-server`) ; depuis cet environnement le site Vercel répond 403 (pare-feu) : preuve de déploiement = statut GitHub « Vercel : Deployment has completed » du commit.

## Historique 6 mois (Notion + git, importé le 24/11/2026). Sources : voir SOURCES.md (HUB, AUD29, REP03, CGV)
- 19/07 · Faille 1 : inscriptions rejetées en silence. Upsert sur `external_id` préfixé par l'événement + index unique global sur `email_lower` : 0 sur 191 anciens joueurs ont pu s'inscrire au NDS (593/594 pour les nouveaux). Non récupérable. Garde-fou : l'identité d'un joueur = l'e-mail, jamais une clé dérivée de l'événement (HUB 19/07).
- 19/07 · Faille 2 : anti-doublon sans borne de date sur `joueurs.events` (réécrit à chaque partie) : 828 couples joueur/station sur 891 n'ont qu'un jour, les habitués étaient bloqués. Garde-fou : dédup bornée par fenêtre explicite et lue dans `participations`, jamais dans un tableau d'état (HUB 19/07, Pattern C).
- 31/08 · `tirage_lot()` ne vérifiait jamais le stock : 214 tirages pour 59 lots configurés, 155 fantômes (noms réels « à appeler »). Aucun partenaire lésé grâce au « Confirmer » manuel. Garde-fou : fonction bornée au stock restant ; test par appel réel avec grant temporaire révoqué aussitôt (HUB 31/08).
- 31/08 · Grant `authenticated` au lieu de `PUBLIC` sur 2 RPC : « Rapport détaillé » vide. Vrai À L'ÉPOQUE (aucune session Auth, tout en clé anon). Depuis le 19-20/11 la RLS est durcie et « authenticated » n'est pas « de confiance » : relire `pg_policies` avant de réutiliser cette leçon (HUB 31/08 contre ERREURS.md).
- 09/07 · `factures` : la clé anon ne pouvait ni écrire ni lire (seulement authenticated), donc facture jamais créée ; corrigé en ouvrant anon, avec la mention « à restreindre au durcissement post-festival » (HUB 09/07). À vérifier que la restriction a bien été faite le 19-20/11.
- 02/09 · Les aperçus du dashboard (iframe `preview=1`) fabriquaient de VRAIS scans : `trackVisite()` ignorait `preview` (110 lignes, 52 flashs + 58 étapes). Corrigé dans `lib/track.ts` pour les 7 modules ; archivé avant retrait. Garde-fou : tout nouvel aperçu = test « 0 écriture » (HUB 02/09).
- 02/09 · Suppression d'un super event : refus non contournables si participations, tirages, ou nom non retapé ; les pros ne sont jamais supprimés (HUB 02/09).
- 03/09 · Advisor Supabase : RLS désactivée sur `comm_config`, `comm_templates`, `visites_archive_2026_06`, `visites_archive_apercu_2026_09` ; SQL prêt, « à valider par Romain ». Statut actuel non vérifié : relire `get_advisors` (REP03).
- 03/09 · `/pro/jeu` sans contrôle d'accès (n'importe qui édite l'animation d'un pro via `?pro=`) ; aucun des 16 pros n'avait `auth_id` (REP03). À revérifier.
- 29/06 · Audit RGPD : `rgpd_at` sur 2 joueurs sur 227, `optin_version` sur 8 ; `documents_legaux` = CGV seule (ni règlement de jeu, ni tirage, ni confidentialité) ; table `connexions` non câblée (8 lignes). État actuel à revérifier. CGV art. 10 : données jamais revendues, remises aux commerces en agrégé anonymisé sauf opt-in explicite au profit d'un partenaire (AUD29, CGV).
- 26/08 · Contamination Révision / Events : `niveau_id='bac-pro'` sur 858 joueurs, colonnes scolaires dans `joueurs`, 4 `password_hash` (vrais comptes possibles). Consigne de l'époque : ne rien écrire avant réponse de Romain, ne pas lire plus de contenu personnel que nécessaire (HUB 26/08). Voir À TRANCHER dans continuite-reprise.
- 23/07 · Règle billet : le nom du gagnant n'est transmis qu'à l'état « confirmé » (`consulter_lot` renvoie `gagnant=null` tant que `notifie_at` est nul) ; filtrage côté serveur par `partenaire_gagnants(pid, se, p_mode)` : cacher dans l'interface ne suffit pas (HUB 23/07).
- 02/09 · Export CSV du CRM faux : filtres dans le composant, CSV sur la liste complète (3 000 lignes pour 3 affichées). Garde-fou : tout export = exactement ce que voit l'utilisateur (HUB 02/09).
- 02/09 · `crm_participants` : jointure interne sur `joueurs` perdait les participations sans fiche (639 contre 640). Jointure externe. Garde-fou : un compteur doit retomber sur le même nombre que l'écran de référence (HUB 02/09).
