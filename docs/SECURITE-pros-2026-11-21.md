# Sécurité : lecture anonyme de `pros` (21/11/2026)

SQL : `sql/2026-11-21-pros-lecture-publique.sql` (partie A, partie B, option, rollback en pied).
Trouvé par le contrôle quotidien `controle_qualite_lancer()` : ligne `anon_lecture_tables_sensibles`, rouge, « 1 table(s) lisible(s) par anon : pros ».

## Le trou
- Politique `pros_anon_select` (SELECT, anon, `true`) : la clé publique lit e-mail, téléphone, SIRET, adresse, contact des 21 pros.
- La vue `v_se_commerces` (security_invoker) montrait `pro_email` / `pro_tel` par le même biais (lue seulement par le dashboard SA).
- Politiques conservées : `pros_admin_all` (SA), `pros_self_select` / `pros_self_update` / `pros_self_insert` (le pro connecté, sa fiche), `pros_anon_insert_inscription` (inscription).

## Lecteurs de `pros` avec la clé publique (inventaire) et traitement
| Lecteur | Colonnes lues | Traitement |
|---|---|---|
| `lib/parcours.ts` (parcours joueur, serveur) | id, partenaire_id | RPC `jeux_propres_partenaires` : rend (partenaire, animation, jeu), jamais l'id du pro (il dérive parfois de l'e-mail) |
| `lib/operations.ts` `fetchOperationsPro` (serveur et navigateur) | id, nom, e-mail, partenaire_id | RPC `pro_fiche_publique` ; e-mail relu avec la session du pro (navigateur seulement) |
| `lib/pro.ts` `fetchProDashboard` | `*` | RPC `pro_fiche_publique` ; navigateur avec session : fiche complète |
| `lib/droitsPro.ts` | droits | RPC `pro_fiche_publique` |
| `ProShell`, `/pro/scanner`, `/pro/commandes` | statut, source, nom | RPC `pro_fiche_publique` |
| `lib/dashboard.ts` (`fetchEventSuperEventStats`, `fetchProGains`) | partenaire_id | RPC `pros_partenaires_de` |
| `PremiereFois`, `lib/inscriptionPro.ts` | id (existe ?) | RPC `pro_id_existe` |
| `/pro/compte` (Mon profil), `/pro/nouvelle` | fiche complète pré-remplie | `components/pro/FichePleine.tsx` : fiche complète rechargée avec la session du pro ; sans session : message « Connectez-vous » (jamais un formulaire vide) |
| `/rejoindre/[se]` | écriture | INSERT simple (l'INSERT avec « on conflict » est refusé par la RLS sans politique SELECT : testé en base locale) |
| `public/static/pro_mobile.html` | fiche (non utilisée plus loin) | RPC en GET, repli direct |
| `dashboard.html`, `app/dashboard/*`, `ParcoursCreation` (visiteur), `bon-commande-animation.html`, `prefillCommande.ts`, `EntrepriseForm`, `Configurateur` | tout | inchangés : jeton SA ou session du pro |
| Fonctions Edge | service_role | non concernées |

## Partie A : 4 fonctions (SECURITY DEFINER, `revoke … from public, anon, authenticated` puis grant anon + authenticated)
- `pro_fiche_publique(text)` : id, nom, nom_commercial, ville, secteur, partenaire_id, statut, onboarding_source, droits. Exclus : e-mail, téléphone, SIRET/SIREN, adresse, code postal, contact, notes, tags, auth_id.
- `pro_id_existe(text)`, `pros_partenaires_de(text[])` (200 ids au plus), `jeux_propres_partenaires(text[])` (200 au plus).
- Toutes en GET (STABLE) : le mode démo n'y voit aucune écriture.

## Effets assumés
- Pages `/pro/*` sans session (lien `?pro=` seul) : plus de coordonnées ; Mon profil invite à se connecter ; pré-remplissage du bon de commande vide sans session.
- Le serveur ne reçoit plus l'e-mail du pro : `replyTo` des e-mails de gagnants et e-mail du partenaire arrivent après le rechargement avec la session.
- Carte publique : `carte_commerces_publique(_v2)` (SECURITY DEFINER, noms commerciaux seulement) inchangée.

## Hors périmètre, signalé (décision de Romain)
- `flowin_export_pros(p_token)` : SECURITY DEFINER, exécutable par anon, protégée par un jeton écrit en dur dans la fonction ; ce jeton figure aussi dans `docs/backup/backup-crm-nds-google-sheet.gs` (dépôt). Quiconque le possède exporte e-mail, téléphone, SIRET de tous les pros. À faire : changer le jeton (secret hors dépôt) ou retirer l'exécution anon ; le script de sauvegarde Google Sheet en dépend. Le jeton n'est pas recopié ici.
- Retrait du droit de table `revoke select on pros from anon` : non fait (voir « OPTIONNEL » du SQL).

## Tests (21/11)
- PostgreSQL 16 local jetable : A + B appliqués deux fois sans erreur ; anon avant B : 2 e-mails lus ; après B : 0 ; RPC anon : fiche sans coordonnées, `pro_id_existe` t/f, `pros_partenaires_de`, `jeux_propres_partenaires` OK ; pro connecté : sa fiche seule ; INSERT anonyme simple OK, avec « on conflict » refusé (d'où le changement de /rejoindre).
- `npx tsc --noEmit` : 0 erreur. `npm run build` (copie) : `✓ Compiled successfully`. Acorn 2020 sur `static/pro_mobile.html` : 0 erreur (dashboard.html non touché, miroir inchangé).
- Playwright `?demo=1`, 390 px, `next start` de la copie lancé depuis `/home/user`, 21 pages (13 pages `/pro/*`, `/jouer`, `/parcours/spin`, `/parcours/nds2026`, `/se/se-nds-2026`, `/rejoindre/se-nds-2026`, `/nds`, `/landing`, `pro_mobile.html`) : HTTP 200, 0 non-GET vers supabase.co, 0 erreur JS, avant A (repli direct) et après A (RPC, 0 lecture directe de `pros` côté navigateur).
- Production : RPC anonymes en 200 (fiche sans e-mail). Déploiement Vercel de `bd844bdc` constaté (bundle contenant `pro_fiche_publique`).

## Ordre d'application et état
1. Partie A appliquée en prod le 21/11 (`pros_lecture_publique_partie_a_2026_11_21`).
2. Code poussé (`bd844bdc`), déploiement Vercel constaté.
3. Partie B (`drop policy pros_anon_select`) : appel `apply_migration` resté sans réponse de confirmation (timeout 230 s) ; vérifié ensuite : la politique existe encore. À appliquer après accord de Romain ; puis `select public.schema_reference_rafraichir();` et relire `controle_qualite_dernier()`.
