# Espace client joueur : descriptif à construire (prévu vendredi 6 novembre 2026)

Demande de Romain (03/11/2026) : un vrai tableau de bord client sur mobile. Le joueur qui arrive par un QR d'événement, ou par la plaquette, crée un profil et retrouve tout ce qui le concerne. Même interface que celle de l'arrivée par QR, avec son profil dessus.

## Contenu attendu
- Profil : prénom, nom, email, téléphone et ville facultatifs. Genre : Homme / Femme / vide, jamais « Autre ».
- Compte avec mot de passe, et régénération du mot de passe en cas de perte.
- Événements en cours, avec la carte (Nice, Vence, autres communes quand elles existent).
- Tickets gagnés et gains à utiliser (code ou QR de retrait), gains déjà utilisés.
- Commerces avec lesquels des tickets ont été gagnés, et historique complet (jeux joués, dates, lots).
- Personnes invitées (parrainage) et ce que ça rapporte.
- Entrée possible de deux façons : QR d'événement (inscription liée à l'événement) ou plaquette / appli installée (création de profil sans événement).

## État au 03/11/2026 (vérifié dans le code de `main`)
- `admin/app/moi/page.tsx` : page simple (profil, gains, tickets par opération). Aucun vrai compte : lit `flowin_joueur` dans le navigateur. Vide sur un autre appareil.
- Écrans « Mon profil » (`c-profil`) et « Connexion et mot de passe » (`c-connexion`) dessinés dans `admin/lib/masters/engine.ts`. Les boutons « Créer mon espace client » et « Recevoir mon code » affichent « L'espace client arrive bientôt » (`admin/app/jouer/JouerClient.tsx`, ligne 380). Ils ne font rien.
- Écrans « Commerces », « Partenaires » et « Parrainage » dessinés dans le même moteur, non reliés à des données réelles de compte.
- Table `joueurs` : colonnes `password_hash`, `user_id`, `ref`, `pts_total`, `tel`, `ville`, `optin` existent, aucun écran ne les utilise. `email_lower` est générée : ne jamais l'insérer.
- `/jouer` sans paramètre affiche un quiz de démonstration. L'appli installable `joueur-app.html` pointe encore dessus : à corriger pour ouvrir l'espace client.

## À construire
1. Authentification joueur : décision à prendre (Supabase Auth email + mot de passe, ou code reçu par email), puis lien `joueurs.user_id` avec le compte. Mot de passe oublié par email.
2. Règles de sécurité (RLS) : un joueur ne lit que ses propres tickets, gains, positions et invitations. Aucune fuite entre joueurs.
3. Page `/moi` refondue en espace client complet (mobile d'abord), à partir de la maquette « Mon profil » : en-tête profil, onglets Événements / Carte / Tickets et gains / Commerces / Invités / Profil.
4. Rattachement des anciens tickets : un joueur qui a déjà joué sans compte retrouve ses tickets en créant son compte avec le même email (jamais par téléphone seul).
5. Inscription depuis la plaquette : création de profil sans événement, puis événements en cours proposés selon la position ou la ville.
6. Parrainage : lien d'invitation personnel (`ref`), compteur de personnes invitées.
7. Appli installable `joueur-app.html` : ouvrir l'espace client (connecté) ou la création de compte (sinon).
8. Un seul lot cohérent : HTML + CSS + JS + SQL alignés dans la même livraison.

## Règles à respecter
- Ne jamais modifier `NDS2026Client.tsx` ni `nds2026Design.ts`.
- Aucune donnée inventée : placeholders `[… à compléter]` pour toute coordonnée manquante.
- Aucun secret dans un commit.
- Vérifier avec `npx tsc --noEmit` et `npm run build` (lire `✓ Compiled successfully`).
- SQL numéroté dans `sql/` (prochain : `15-…`), idempotent, appliqué en prod seulement après accord de Romain.

## Décisions à demander à Romain avant de commencer
- Connexion : email + mot de passe, ou code reçu par email ? (la maquette propose les deux)
- Que rapporte une invitation (tickets bonus, rien pour l'instant) ?
- Quels événements montrer : tous les événements en cours, ou seulement ceux proches du joueur ?

## Autres sujets en attente de Romain (état au 03/11/2026)
- PR #93 : vidéos v22 et envoi groupé des outils, prête, en attente de « fusionne la 93 ».
- PR #94 + SQL 14 : demandes de rappel des plaquettes enregistrées en base, alerte et fiche pro. SQL 14 à appliquer avant la fusion.
- Vidéo organisateur : le « 70 » ressemble à un 10, à rendre plus lisible.
- Animation tirée du contenu de la plaquette : à décider.
- Fonction edge `notify-commande-animation` : à déployer pour que les e-mails de commande partent.
