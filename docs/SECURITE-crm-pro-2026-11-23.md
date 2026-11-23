# Sécurité : CRM du pro `crm_pro` lisible par tout le monde (23/11/2026)

SQL : `sql/2026-11-23-crm-pro-securise.sql` (partie A, rollback en pied). Proposition de contrôle quotidien (non appliquée) : `sql/PROPOSITION-controle-fonctions-donnees-perso-anon.sql`.

## Le trou
- `crm_pro(p_pro text)` : SECURITE DEFINER, EXECUTE accordé à public et anon, aucun contrôle de l'appelant. Avec la clé publique et l'identifiant d'un pro : prénom, nom, e-mail, téléphone, code postal, ville de tous les joueurs passés chez ce pro, dont de vrais participants des Nuits du Sud. Constaté en production le 23/11 (définition relue : aucun `auth.uid()` ni `est_super_admin()`).
- `crm_participants(p_se text)` : même défaut, pour TOUS les joueurs (`p_se` vide). Trouvée par le recensement des fonctions anonymes qui renvoient des colonnes personnelles.
- `crm_pro_consentants` (masque serveur de `sql/05-confidentialite-contacts.sql`) n'a jamais été appliquée : le masquage se faisait seulement dans le navigateur (`limiterAuConsentement`), donc contournable en appelant la base directement.
- Un identifiant de pro peut dériver de l'e-mail du pro (ex. `pro-xxx-gmail-com`) : il se devine ou se lit ailleurs. Ne jamais le considérer comme un secret.

## La correction (deux temps, comme `pros`)
1. Code poussé et en ligne : le CRM est lu dans le navigateur, avec la session du pro (ou la session SA sur `/dashboard`). Sans session : « Connectez-vous pour voir vos contacts », jamais un tableau ou un formulaire vide.
2. Partie A du SQL (appliquée seulement après l'étape 1) :
   - corps actuel de `crm_pro` copié dans `_crm_pro_interne` (droits retirés à public, anon, authenticated) ;
   - `crm_pro` garde la même signature ; accès = super admin OU pro propriétaire (`pros.id = p_pro` et `pros.auth_id = auth.uid()`), sinon erreur `42501` ;
   - masquage côté serveur pour tout appelant autre que le SA : e-mail et téléphone vides, nom réduit à l'initiale quand le joueur n'a pas consenti (même règle que le navigateur : `optin` du joueur ou du commerce, décision du 31/10) ;
   - `crm_participants` : réservée au SA (`_crm_participants_interne` pour le corps) ;
   - EXECUTE à `authenticated` et `service_role` seulement.

## Lecteurs inventoriés et traitement
| Lecteur | Contexte d'appel avant | Traitement |
|---|---|---|
| `/pro/donnees` onglet Contacts | rendu serveur, sans session | `CrmProCharge` (client, session pro) |
| `/pro/crm/[id]` fiche contact | rendu serveur, sans session | `FicheContactPro` (client) ; le serveur ne charge que le cadre et `pro_tirages_joueur` (lots, sans coordonnées) |
| `/pro/operation` onglet Contacts / Participants | rendu serveur, sans session | `CrmProCharge` dans `FicheOperationPro` |
| `/pro` résumé (tuiles « contacts autorisés », « clients importés ») | rendu serveur | `RapportProAvecContacts` (client) ; tuiles masquées sans session |
| `/dashboard/crm-pro` (SA) | client, jeton SA | inchangé : `fetchCrmPro(proId, { sa: true })`, appelle maintenant `crm_pro` seule |
| `/dashboard/nds-participants` (SA) | client, jeton SA | inchangé : `crm_participants` (SA seulement) |
| `import_contacts_pro` | pro connecté ou SA | inchangé (déjà protégé) |
| `dashboard.html` (vanilla) | — | aucun appel à `crm_pro` ni `crm_participants` (recherche faite) |

`fetchCrmProDetail` n'appelle plus `crm_pro_consentants`. Ne pas appliquer la phase 1c de `sql/05-confidentialite-contacts.sql`.

## Tests (23/11)
- PostgreSQL 16 local (schéma stub) : anon refusé (permission denied), connecté inconnu refusé (42501), pro B sur pro A refusé, pro A sur pro B refusé, pro A sur son CRM : consentant visible, non consentant masqué, nom vide laissé vide, SA : tout visible, `crm_participants` SA seulement, fonction interne inaccessible aux autres rôles, rejeu du SQL sans erreur.
- `npx tsc --noEmit` sans erreur ; `npm run build` : « Compiled successfully ».
- Playwright à 390 px, `?demo=1` (pro de test `pro-test-boulangerie-e2e`), sur `/pro/donnees` (Contacts), `/pro/crm/[id]`, `/pro/donnees/import`, `/pro/operation` (Contacts), `/pro`, `/dashboard/crm-pro` : sans session, message de connexion et AUCUN appel `crm_pro` ; avec session de test et RPC simulée, le jeton de session part dans l'en-tête, le masquage s'affiche ; 0 requête non-GET vers supabase.co ; 0 erreur JavaScript ; pas de débordement horizontal.

## Ouvert (non traité ici)
- `flowin_export_users`, `flowin_export_partenaires`, `flowin_export_pros`, `nds_export_crm`, `nds_export_joueurs_uniques` : exécutables par anon, protégées seulement par un jeton écrit en dur dans la fonction et dans `docs/backup/backup-crm-nds-google-sheet.gs`. Le jeton est donc à considérer comme exposé : décision de Romain (changer le jeton, ou passer par un secret Vault comme `rappel_cron_secret`). Ne pas recopier le jeton.
- `moi_profil(uuid)` et `mes_consentements(uuid)` : l'identifiant joueur sert de jeton (risque connu, voir MEMOIRE).
- Un service qui voudrait lire le CRM avec `service_role` sans identité serait refusé (`auth.uid()` vide) : aucun appelant de ce type aujourd'hui.
