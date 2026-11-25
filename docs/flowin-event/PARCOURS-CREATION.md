# Parcours unique de création d'animation : pro et Super Admin (25/11/2026)

Exigence de Romain (25/11) : même simplicité pour lancer une animation depuis le Super Admin (3 cas) que depuis le compte pro. Décision antérieure (29/10) : même interface des deux côtés, droits différents.

## 1. État actuel (code lu, gestes NON rejoués en direct)
| Cas | Entrée | Écrans traversés | Preuve |
|---|---|---|---|
| Pro connecté | `/pro/nouvelle` | `Configurateur` : 4 groupes (Jeu, Lots, Diffusion, Validation) | `app/pro/nouvelle/page.tsx:60-64`, `Configurateur.tsx:36` |
| SA, pro existant | Menu « Nouvelle animation » (`Sidebar.tsx:180`) puis carte « Un pro déjà inscrit » puis recherche puis clic | 3 écrans de choix du pro, puis `ParcoursCreation` (Votre animation, Jeu, Lots, Diffusion & QR) | `ParcoursCreationSA.tsx:60-116, 160-190` |
| SA, pro à créer | Menu « Nouvelle animation », carte « Inscrire un nouveau pro » | 1 formulaire de 8 champs (nom, secteur, précision, adresse, CP, ville, contact, e-mail, téléphone), puis `ParcoursCreation` | `ParcoursCreationSA.tsx:196-232` |
| SA, pro sans animation | aucune entrée directe : il faut passer par `/dashboard/pros` (liste), noter le nom, puis refaire le cas 1 | pas de bouton sur la ligne pro | `app/dashboard/pros/page.tsx` (aucune action animation) ; base : 6 pros sans event |
| SA, « Créer un pro » (autre menu) | `/dashboard/wizard-pro` | 5 étapes (profil, identité, lieu, contact, récap) puis bouton « Lui créer une station » | `wizard-pro/page.tsx:105-170`, `lib/proCreation.ts:191-262` |

Écarts : le SA traverse un écran de plus que le pro (choix du pro) et un composant 3 fois plus gros ; deux endroits créent un pro (`wizard-pro` 5 étapes, carte « Inscrire » 8 champs) et ni l'un ni l'autre ne crée l'accès de connexion (aucun `signUp` ni invitation côté SA : `grep` sur `app/dashboard`, 25/11) ; l'inscription du pro est passée à 3 écrans le 24/11 (`lib/inscriptionPro.ts:77`) sans que `wizard-pro` suive.

## 2. Parcours cible : une seule route, un seul écran de jeu
Route unique : `/dashboard/wizard-event?pro=<id>` (existe déjà, accepte `?pro= ?se= ?nom= ?d= ?f= ?module=`) et `/pro/nouvelle` (pro). Les deux rendent le MÊME composant `Configurateur`, avec un paramètre `droits` et un `pro` déjà choisi.

```
SA : [0. Pour qui ?] -> Configurateur (Jeu, Lots, Diffusion, Validation) -> « C'est en ligne » (QR)
Pro:                    Configurateur (idem)                             -> « C'est en ligne » (QR)
```
L'écran 0 n'existe que pour le SA, 3 cartes, 1 toucher chacune :
| Cas | Carte | Ce qui se passe | Résultat |
|---|---|---|---|
| 1. Compte pro existant | « Un pro inscrit » | recherche (nom, ville) ; 1 clic sur la ligne | `?pro=<id>` posé, Configurateur s'ouvre |
| 2. Compte à créer | « Nouveau pro » | 3 champs (nom, ville, e-mail OU téléphone) ; secteur, SIRET, adresse repris ou complétés plus tard dans « Mon profil » (règle 24/11 : secteur déplacé dans Mon profil) ; pro créé `valide` ; invitation d'accès (décision de Romain : lien, mot de passe, ou « Mot de passe oublié » guidé) | `?pro=<id>`, Configurateur |
| 3. Pro sans animation | « Pros sans animation » | même liste que le cas 1, filtrée sur `pro sans event` (6 aujourd'hui) | idem cas 1 |
Entrées sans écran 0 : bouton « Lancer une animation » sur la ligne du pro (`/dashboard/pros`, tiroir `ProDrawer`), sur la ligne « pro en attente » après « Valider », et en fin de `wizard-pro` (existe déjà : « Lui créer une station »). Toutes arrivent sur `?pro=<id>` : le cas 3 devient 1 geste depuis la liste (AMEL-ERG-08 : 18-26 vers 8-10 gestes, estimation du carnet, non rejouée).

## 3. Ce qui reste différent entre pro et SA (par `droits`, pas par composant)
| Point | Pro | SA |
|---|---|---|
| Commande / paiement (`avecCommande`) | oui | non (il onboarde) |
| Rattacher une station à un Super Event | par demande, validée par le SA | direct (RPC `approuver_demande_rattachement`) |
| Créer un Super Event | demande à Flowin | direct (hors Configurateur : parcours Super Event) |
| Statut de l'animation | `pending` si paiement à déclarer, sinon `live` / `upcoming` | idem |
Le Super Event garde son propre parcours (`ParcoursCreation` mode `super`, 5 à 6 étapes) : règles différentes (REGLES-ESPACES.md). Pas de fusion avec l'animation.

## 4. Contrat technique (pour la future mission, rien n'est fait)
- Entrée du Configurateur : `{ pro, droits, banques, depuisSA }`. Sortie : un seul appel `creerAnimation` (`lib/pro.ts:145`).
- `lib/proCreation.ts` redevient LA définition du pro : le SA et le pro lisent la même liste d'écrans (3 écrans) ; `ETAPES_FICHE_PRO` (5 étapes) est marquée « remplacée ».
- L'invitation est une action SA explicite (bouton), jamais automatique ; aucun e-mail Flowin à un client final.

## 5. Tests avant (ECARTS E2, E3)
1. Caractérisation de `creerAnimation` : mêmes lignes `events`, `lots`, `qr_stations` pour une entrée SA et une entrée pro.
2. Playwright 390 px, `?demo=1` : le SA arrive, par chaque carte et par le bouton de la ligne pro, sur le même Configurateur avec le bon pro ; 0 écriture.
3. Matrice des états d'un pro : valide / en attente, avec / sans `auth_id`, avec / sans animation.

## 6. Retour arrière
Tag `avant-creation-unique`. L'ancien écran SA reste derrière un paramètre (`?ancien=1`) jusqu'à validation de Romain ; `git revert` du commit de bascule sinon. Aucun SQL.

## Non vérifié
Nombre réel de gestes SA aujourd'hui (non rejoué) ; session SA connectée sur le Configurateur (le composant lit `lib/supabase.ts` avec la session du pro : comportement avec session SA non testé) ; envoi réel de l'invitation (aucun code existant).
