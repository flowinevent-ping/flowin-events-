# Données personnelles par profil : brouillon d'inventaire (25/11/2026)

BROUILLON. Source : colonnes réelles lues dans `information_schema` (lecture seule, 25/11), politiques `pg_policies`, droits de colonne. Complète `docs/claude/kit/CONTRATS-DONNEES.md` (qui mesure les tables, pas les colonnes). Rien d'inventé : une case « non défini » signifie que je n'ai rien trouvé. Aucune valeur de donnée lue : seulement des comptes.

## 1. Participant : table `joueurs` (842 lignes, 53 colonnes)
| Groupe | Colonnes | Finalité (d'après le code) | Remarque |
|---|---|---|---|
| Identité | `prenom`, `nom`, `pseudo`, `genre` / `sexe`, `ddn` / `date_naissance` (187 renseignées), `age_tranche` / `tranche_age` | jeu, CRM du pro, typologie | deux colonnes pour la même donnée (genre/sexe, âge/tranche) : source de dérive |
| Contact | `email`, `email_lower` (générée), `tel`, `adresse`, `code_postal`, `ville` | retrouver le compte, relances, CRM | `tel` (pas `telephone`) |
| Consentement | `optin` (480 vrais), `optin_date` (653), `optin_version`, `rgpd_at` | 3 cases décidées le 17/11 | `optin` seul ne distingue pas « Flowin » et « ce commerce » : le détail est dans `clients_commerce.optin` (0 ligne) : non vérifié où le consentement « commerce » est stocké pour un joueur |
| Technique | `visiteur_id`, `user_id`, `push_token` (0), `pwa_installed`, `last_seen`, `first_seen`, `derniere_session` | session, notification | `push_token` : aucune valeur ; notifications push non implémentées |
| Authentification | `password_hash` (3 lignes renseignées) | ancien mot de passe | décision 24/11 : compte sans mot de passe ; colonne lisible par `authenticated` (voir §5) |
| Jeu | `pts_total`, `streak`, `score_moy`, `ticket_code`, `gains`, `lot_gagne`, `events`, `source`, `ref`, `tags`, `decouverte`, `client_type`, `enseigne`, `secteur` | affichage, parrainage | `events` : « pas fiable » (CONTRATS-DONNEES) |
| Hérité d'un autre produit (probable) | `ecole`, `classe`, `classe_id`, `etablissement_id`, `niveau_id` (1 ligne `ecole`) | non utilisé par Flowin Event | Flow-révision partage le projet Supabase : non vérifié que ces colonnes sont de ce produit |
Autres tables du participant : `participations` (17 colonnes : `scan_lat`, `scan_lng`, `scan_distance_m` = position au scan ; `bonus_answers`, `extra_fields`), `se_reponses` (`quiz_reponses`, `bonus_reponses`, `form`), `visites` (`user_agent`, `device`, `referrer`, `visiteur_id`), `tirages` (copie de `joueur_nom`, `joueur_email`, `joueur_tel`), `parrainage` (`sender_email`, `destinataire`), `joueur_notifications`, `push_abonnements` (`endpoint`, `p256dh`, `auth`).

## 2. Pro : tables `pros` (21 lignes, 31 colonnes), `pros_rib`, `partenaires`, `clients_commerce`
| Groupe | Colonnes | Finalité | Remarque |
|---|---|---|---|
| Identité du commerce | `nom`, `nom_commercial`, `adresse`, `code_postal`, `ville`, `siret`, `siren`, `forme_juridique`, `code_naf`, `activite_naf`, `date_creation_entreprise` | contrat, facture, carte | issus de la recherche entreprise |
| Contact | `contact`, `role_contact`, `email`, `tel` | relation, notifications de commande | personne physique : donnée personnelle |
| Compte | `auth_id` (3 sur 21 renseignés), `statut`, `acces_active_at`, `droits` | connexion, droits donnés par le SA | 18 pros sans accès de connexion |
| Banque | `pros_rib` : `titulaire`, `iban`, `iban_masque`, `bic` | remboursement / paiement | table fermée en lecture publique ; 0 ligne |
| Interne | `notes`, `tags`, `onboarding_source`, `produits_services`, `nb_points_vente` | suivi commercial | `notes` : interne SA |
| Fichier importé | `clients_commerce` : `joueur_id`, `source`, `optin`, `optin_date`, `parrain_id` | CRM du pro | 0 ligne : import jamais utilisé |

## 3. Super Admin et prospects
| Table | Colonnes personnelles | Finalité | Accès |
|---|---|---|---|
| `flowin_super_admins` | `auth_id`, `email` | droit SA (`est_super_admin()`) | RLS sans politique (inaccessible directement) |
| `prospection` (1 952 lignes) | `enseigne`, `adresse`, `tel`, `email`, `contact_nom`, `note` | prospection commerciale | 1 politique ; lecture SA (non relu en détail) |
| `leads_landing` (0 ligne) | `prenom`, `nom`, `email`, `telephone`, `code_postal` | demandes via landing | 2 politiques |
| `demandes_rappel` | `prenom`, `nom`, `tel`, `email`, `message`, `note_interne` | rappel commercial | dépôt public par fonction, lecture SA |

## 4. Qui accède à quoi (RLS lue en base, 25/11)
| Table | Participant | Pro | Organisateur | SA | Anonyme |
|---|---|---|---|---|---|
| `joueurs` | sa ligne | joueurs de ses animations (`flowin_pro_voit_joueur`) | joueurs de ses stations | tout | écriture (inscription) seulement |
| `participations` | les siennes | celles de ses events | celles de TOUTES les stations de son Super Event | tout | écriture |
| `se_tickets` | via RPC | ses events | son Super Event | tout | aucune |
| `tirages` | ses gains (RPC) | ceux de son partenaire / ses events | — (tirage SE : SA) | tout | aucune |
| `pros` | — | sa fiche (`pros_self_select`) + fiche publique sans coordonnées | — | tout | fiche publique par RPC ; `pros_anon_select` : décision de Romain en attente (ETAT) |
| `clients_commerce`, `pros_rib` | — | les siens | — | tout | aucune |

## 5. Points de vigilance (preuves)
1. `joueurs` : SELECT accordé à `authenticated` sur la colonne `password_hash` (3 valeurs) et sur `email`, `tel`, `ddn` ; la politique de ligne autorise un pro lié au joueur. Un pro peut donc lire ces colonnes hors de `crm_pro` (qui masque sans consentement). À corriger par colonnes ou vue : `securite-donnees`.
2. `anon` a SELECT sur 52 colonnes de `joueurs` (dont `email`, `tel`) : sans effet tant qu'aucune politique SELECT ne vise `anon` (aucune lue le 25/11) ; fragile si une politique est ajoutée.
3. `tirages` duplique `joueur_nom`, `joueur_email`, `joueur_tel` : une suppression d'un joueur doit aussi traiter cette copie.
4. `demandes_rattachement_super_event` : lecture publique (`true`) de `nom_commerce`, `adresse`, `note_sa` (ECARTS E1).

## 6. Durée de conservation et suppression
| Profil | Durée de conservation | Suppression |
|---|---|---|
| Participant | NON DÉFINIE dans le dépôt (aucune règle trouvée : `grep` « conservation » : seulement les CGV qui citent le droit d'effacement avec « [adresse email dédiée à compléter] ») | aucun parcours « supprimer mon compte » trouvé dans `app/moi` ni `lib` (grep) ; suppression possible par le SA seulement (`joueurs_delete_sa`). Non vérifié ailleurs |
| Pro | NON DÉFINIE | le pro ne peut pas supprimer sa fiche (politiques `pros` : à relire) ; le SA peut, sur confirmation de Romain (règle 83) |
| SA / prospects | NON DÉFINIE | prospect : champ `pas_interesse` existe ; suppression non vérifiée |
Les décisions de durée et d'effacement sont à prendre par Romain (et à faire valider par un juriste, règle du carnet). Je ne propose aucune durée : je ne la connais pas.

## 7. Suite proposée (non faite)
Ajouter à `CONTRATS-DONNEES.md` une colonne « colonne par colonne » par profil, alimentée par le contrôle quotidien (`controle_qualite_lancer`) : alerte si un nouveau champ personnel apparaît ou si `anon` / `authenticated` gagne un droit de colonne. Lecture seule.

Non vérifié : contenu des politiques de `prospection`, `leads_landing` ; usage réel des colonnes héritées ; présence d'un journal des accès ; consentement « commerce » par joueur.
