# État des parcours (dernière mise à jour : 23/11/2026)

Statuts : VÉRIFIÉ PROD (preuve mesurée sur flowin-events.vercel.app) / NON VÉRIFIÉ / BLOQUÉ. Une ligne par parcours, on écrase l'ancien verdict (historique : JOURNAL.md et git).
Source principale : `docs/E2E-verification-2026-11-20.md` (E2E). Comptes de test : voir `agents/recette-tests/MEMOIRE.md`.

| Parcours | Statut | Date | Preuve | Retest si |
|---|---|---|---|---|
| Pro : inscription, connexion, mot de passe oublié | VÉRIFIÉ PROD (2 réserves : validation Flowin manuelle, e-mail de confirmation vers Romain) | 20/11 | E2E 1 : signup 200, token 200, recover 200 | changement Auth, SMTP, modèles e-mail |
| Pro : animation quiz, 2 lots gain immédiat, QR, affiche A4 | VÉRIFIÉ PROD après correctifs | 20/11 | E2E 2 : status live, animation listée, affiche A4 générée | changement de `lib/pro.ts`, `lib/operations.ts`, statuts |
| Joueur : QR, quiz, gain immédiat, ticket dans /moi, consentement | VÉRIFIÉ PROD (textes de tirage sur gain immédiat : corrigés dans le code `fa367482`, NON revérifiés) | 20/11 | E2E 3 : `appliquer_regle_gain` gagne:true, billet PQ-2026-4795 | changement `lib/masters/engine.ts`, textes joueur |
| Offrir le lot à un ami | VÉRIFIÉ PROD | 20/11 | E2E 4 : `offrir_ticket_ami_contact` notifie ; /moi de l'ami | changement RPC tickets |
| Scanner / lot.html : retrait d'un billet (pro sans partenaire, sans PIN) | VÉRIFIÉ PROD après SQL | 20/11 | rejeu E2E 5 : `valider_lot` 200, tirages.statut = retire. Cosmétique : « Commerce partenaire — » | changement `lot.html`, `valider_lot` |
| Scanner caméra iPhone / Android (jsQR) sur /pro/scanner | NON VÉRIFIÉ sur appareils réels | 19/11 | livré `3116d24f`, aucun test caméra en prod | test sur iPhone et Android |
| Animation en tirage : jeu, tirage, gagnant, notification | VÉRIFIÉ PROD après correctif | 20/11 | E2E 6 : `attribuer_gain_joueur`, 2 e-mails Gmail, appel sans jeton 403 | changement tirage ou mailer |
| Super Event : création par un orga depuis l'interface | VÉRIFIÉ PROD après correctif | 20/11 | rejeu E2E 7 : super_events 201, events 201, se_lots 201, 10 lots, 1 station | changement `ParcoursCreation.tsx`, RLS |
| Pro : rejoindre un Super Event comme station | VÉRIFIÉ PROD (approbation SA simulée par SQL) | 20/11 | E2E 8 : demande en_attente, station + lot, QR en Diffusion | changement de `/rejoindre`, approbation |
| Joueur : partie à une station Super Event | VÉRIFIÉ PROD | 20/11 | E2E 9 : `se_attribuer_partie` ok, 1 ticket en /moi. Une station ne s'ouvre qu'à la date de début | changement phases |
| Super Event : tirage par Flowin, gagnant prévenu, retrait | VÉRIFIÉ PROD (réserves : lot organisateur validable par le SA seul ; e-mail en dur NDS) | 20/11 | E2E 10 : `tirage_super_event` 200, e-mail Gmail | changement tirage, gabarit e-mail |
| Super Event en 2 phases (avant / pendant) | NON VÉRIFIÉ de bout en bout (SQL appliqué 19/11) | 19/11 | `docs/SUPER-EVENT-phases-2026-11-19.md` | test avec super event avant l'événement |
| Résultat de tirage dans /moi (« Pas de lot cette fois ») | NON VÉRIFIÉ en prod (SQL appliqué 20/11, testé en local) | 20/11 | `sql/2026-11-20-resultats-tirage-inapp.sql` | tirage réel avec un non-tiré |
| Rappels de tickets (cron `tickets-rappels` 09:07 UTC) | NON VÉRIFIÉ : premier passage protégé prévu le 21/11 09:07 UTC | 20/11 | appel sans en-tête 403 ; procédure de contrôle dans `docs/SECURITE-rappel-tickets-2026-11-20.md` | lire `net._http_response` et journaux Edge |
| E-mails Gmail (relances, confirmations) | VÉRIFIÉ PROD (envoi test) ; plafond 450/jour | 20/11 | journal `[mailer] gmail ok`, compteur du jour à 1 | secret Gmail renouvelé |
| `notify-bon-commande` : copie au signataire | NON VÉRIFIÉ : code `b810cd56` poussé le 21/11, déploiement non confirmé | 21/11 | diff du commit | déployer puis test avec un bon TEST |
| Annonces des commerces (/moi > Alertes) | NON VÉRIFIÉ (SQL appliqué 19/11, hors E2E) | 19/11 | `docs/ANNONCES-PRO-2026-11-18.md` | envoi à un contact TEST |
| Banque bonus centres d'intérêt | NON VÉRIFIÉ : brouillon privé, validation de Romain attendue | 19/11 | `sql/2026-11-19-banque-interets.sql` appliqué | décision de Romain |
| Sécurité RLS / RPC (phases 1-2, joueurs A-B-C) ; `pros` : partie A + code déployés, partie B (drop `pros_anon_select`) EN ATTENTE de confirmation de Romain (contrôle toujours rouge) | VÉRIFIÉ PROD sauf `pros` : lecture anonyme vide sur les autres tables sensibles, pages en 200 | 19-20/11 | docs SÉCURITÉ, fin de chaque fichier | toute nouvelle table ou migration |
| Dashboard SA : aucune écriture au chargement, `?demo=1` | VÉRIFIÉ en local (Playwright, 0 non-GET) ; NON refait en prod connecté SA | 19/11 | `docs/SECURITE-events-2026-11-19.md` | toute modification du dashboard |
| Jeux en démo (quiz, bonus, solo, roue, tombola) jusqu'au parrainage | VÉRIFIÉ en local (build `main`, 390 px, 0 écriture) | 17/11 | `docs/audit-2026-11-17/RAPPORT-FINAL.md` | changement `engine.ts` |
| Profil /moi (5 rubriques, QR plein écran) | VÉRIFIÉ en local 17/11 ; /moi 200 en prod après RLS | 20/11 | RAPPORT-FINAL, SÉCURITÉ partie C | changement `app/moi` |
| Paiement par virement (`PAIEMENT_ACTIF=false`) | NON VÉRIFIÉ de bout en bout | 10/11 | `docs/PLAN-parcours-pro-joueur-2026-11-10.md` | décision sur le mode de paiement |
| Facturation automatique / intégration Jeffrey CRM (numéro légal) | NON FAIT : aucun code d'intégration ; API et feu vert de Romain à obtenir ; SQL 08 non vérifié en prod | 21/11 | `agents/facturation-crm/MEMOIRE.md` | feu vert de Romain |
| Vidéos v8 L3 et L4 (voix Vivienne -5 %) | LIVRÉES ; écoute de Romain à confirmer | 19/11 | `docs/SCRIPT-L3-v8-2026-11-19.md`, `SCRIPT-L4-v8-…` ; QR décodés (jsQR) | retour de Romain |
| Plaquettes V3 Animation et Super Event | LIVRÉES, « bonnes » selon Romain (09/11) ; à valider | 17/11 | REGISTRE L1, L2 | changement de prix ou de texte |
| Contrôles qualité quotidiens (niveau 1) : `controle_qualite_lancer`, cron 03:17 UTC | VÉRIFIÉ PROD : appliqué et exécuté une fois le 21/11, 30 contrôles ; 4 rouges et plusieurs orange à traiter (voir MEMOIRE securite-donnees) | 21/11 | `sql/2026-11-21-controles-qualite.sql`, ligne `schema_derive` = référence créée | modification volontaire de droits (rafraîchir la référence) |
| Nettoyage des données TEST en base | BLOQUÉ : confirmation DELETE sans réponse (2 fois) | 20/11 | `sql/2026-11-20-e2e-nettoyage-TEST-2.sql` à exécuter par Romain | Romain a exécuté |
| Équipe critique : 4 agents, mémoires, carnet `AMELIORATIONS.md` | PREMIER PASSAGE FAIT (16 propositions, aucune validée) | 21/11 | `docs/claude/AMELIORATIONS.md` ; mesures SELECT et web du 21/11 | décision de Romain sur le carnet ; passage mensuel 01/12 |
| Reprise et continuité : plan écrit, tags de version | PLAN ÉCRIT, RIEN RESTAURÉ : tags créés en local, push refusé (403) ; sauvegardes / PITR NON vérifiés (à lire par Romain) ; fonctions déployées listées, non comparées au dépôt | 21/11 | `docs/claude/PLAN-DE-REPRISE.md` ; `list_migrations`, `list_branches` (vide), `list_edge_functions` | Romain pousse les tags et lit Database > Backups ; test de restauration sur copie |
| Fidélité aux maquettes : contrat `CONTRAT-MAQUETTE.md` et 20 demandes 19-23/11 | PREMIER PASSAGE FAIT : 131 lignes (78 OK (code), 35 MANQUE, 11 VOULU, 7 NON VÉRIFIÉ) ; production NON prouvable depuis le cloud (403 Vercel) | 23/11 | `docs/claude/CONTRAT-MAQUETTE.md`, AMEL-GAR-01 à 04 | accès production par une machine non bloquée ; comptes de test Super Admin, pro, appareil réel |

## Réserves ouvertes (E2E 20/11)
- Textes joueur gain immédiat et e-mail Super Event en dur NDS : voir lignes ci-dessus.
- `send-resultat-tirage` neutralisée, non déployée. `notify-souscription` v5, `notify-bon-commande` v5, `notify-rappel` v1, `notify-commande-animation` v6, `send-ticket-gagnant` v5 : déployées sur le mailer Gmail.
- Détail des décisions en attente : `agents/*/MEMOIRE.md` (rubrique Ouvert).
| Contrôles automatiques niveau 2 (smoke pages, workflow GitHub, rapport PDF) | VÉRIFIÉ en local et sur les pages de production ; workflow GitHub non encore exécuté ; contrôles de la base en attente d'application du SQL | 21/11 | `docs/rapports/controle-2026-11-21.pdf` : 15 vert, 1 orange (gitleaks non exécuté) | après application de `sql/2026-11-21-controles-qualite.sql`, premier passage du workflow |
