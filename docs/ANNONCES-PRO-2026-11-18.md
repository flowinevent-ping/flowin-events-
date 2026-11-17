# Annonces des commerces dans l'application (18/11/2026)

## Ce que ça fait
- **Espace pro > Mes contacts & stats > Contacts** : carte « Annonce à mes contacts ».
  Carrousel en 3 écrans : 1. titre (60 caractères) et message (200 caractères) ;
  2. lien facultatif vers une de ses animations, date de fin facultative ; 3. aperçu,
  puis bouton **« Envoyer à N contacts »**.
- **N** = participants qui ont accepté « rester en contact avec ce commerce » :
  la ligne `clients_commerce` du commerce si elle existe (son `optin` fait foi, le participant le change dans /moi),
  sinon une partie sur un événement du pro avec `se_reponses.bonus_reponses.optin_commerce = true`.
  Les données ne sont jamais vendues ; personne d'autre n'est notifié.
- **Livraison** : notification dans l'application, profil participant **/moi > Alertes**
  (nom du commerce, titre, message, « Voir l'animation »). Aucun e-mail, aucun SMS.
  L'annonce disparaît après sa date de fin, ou si le participant retire son consentement.
- **Limite** : 2 annonces par commerce sur 7 jours glissants (contrôlée en base).
- **Super admin** : `/dashboard/annonces-pro` (menu « Annonces des commerces ») — liste des annonces envoyées.
- **Avant activation** : l'écran affiche « Bientôt disponible : activation en cours », sans erreur.
- **Démo** (`?demo=1`) : N fictif (128), aperçu, envoi simulé ; /moi montre une annonce fictive.

## Ce que change le SQL (`sql/2026-11-18-annonces-pro.sql`, NON appliqué)
Section A :
- table `annonces_pro` (fermée, RLS sans policy) ;
- `joueur_notifications` : colonne `annonce_id`, palier `'annonce'` ajouté au CHECK
  (`'30j','15j','48h','cadeau','relance'` conservés), index unique (annonce_id, joueur_id) ;
- `_consentants_commerce`, `_peut_annoncer` (internes) ;
- `annonce_pro_etat(p_pro)` : nombre de destinataires et envois restants ;
- `envoyer_annonce_pro(p_pro, p_titre, p_message, p_lien, p_date_fin)` SECURITY DEFINER :
  pro propriétaire (`pros.auth_id = auth.uid()`) ou super admin, limite 2/7 jours, renvoie le nombre notifié ;
- `annonces_pro_liste(p_pro)` : super admin (p_pro null) ou le pro pour les siennes ;
- `mes_notifications` : DROP + CREATE, renvoie aussi `titre, message, lien, commerce` pour les annonces.
  Les colonnes existantes sont inchangées (le front actuel continue de marcher).

Section B : `offrir_ticket_ami_contact` — si l'ami est déjà dans `clients_commerce` pour ce commerce,
`parrain_id` est enregistré sans écraser un parrain existant
(`on conflict ... do update set parrain_id = coalesce(clients_commerce.parrain_id, excluded.parrain_id)`).

Rollback complet en fin de fichier (commenté).

## Activer
1. Relire `sql/2026-11-18-annonces-pro.sql`.
2. L'appliquer une fois (MCP Supabase `apply_migration`, nom suggéré `annonces_pro_2026_11_18`).
3. Vérifier : `select public.annonce_pro_etat('<id pro>')` connecté en pro ; ouvrir l'espace pro > Contacts.
4. Aucun déploiement à refaire : le front détecte la présence des RPC.
