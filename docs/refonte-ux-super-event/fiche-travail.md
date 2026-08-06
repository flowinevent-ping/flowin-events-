# Fiche de travail — Refonte UX/UI Super Event (parcours joueur)

Statut : brouillon, à valider par Romain avant tout développement.
Source : brief oral du 06/08/2026.

## Objectif

Simplifier l'UX/UI du parcours joueur Super Event. **Le contenu, les règles et les mécaniques de jeu ne changent pas.** Seule l'interface évolue, en reprenant le langage visuel développé pour la plaquette interactive.

## Ce qui ne change pas (verrouillé — confirmé par Romain le 06/08)

- La séquence des écrans (process actuel conservé à l'identique)
- Les règles de jeu et les mécaniques
- Les règles d'envoi d'e-mail
- Les règles d'envoi de billet, de stockage des billets gagnants, de déstockage des billets gagnants
- Les formulaires de remplissage des données
- QR code, français, horodatage (date / heure / lieu)
- Le traçage : chaque flash enregistré, chaque joueur enregistré par station, nombre de stations jouées, nombre de joueurs par station
- Les composants maîtres (`SpinClient.tsx`, `QuizClient.tsx`) : non modifiés, toute config passe par `cfg`
- Aucune régression fonctionnelle. On ne repart pas de zéro — on reprend l'existant (même logique que le chantier marque blanche : dupliquer/adapter, pas recréer)

## Ce qui est ouvert (confirmé par Romain le 06/08)

Tout le visuel, y compris la Carte (initialement en question, maintenant confirmée ouverte à la refonte). Objectif explicite : réduire l'information affichée, rendre plus ergonomique, plus facile à lire et à comprendre, un jeu interactif "sympa" et simple. On avance par tranches validées, pas tout d'un bloc.

## Écrans concernés (séquence conservée)

1. Vérification "déjà joué" + choix du module (quiz / roulette / autre module)
2. Écran de jeu (module actif)
3. Bonus — pop-up centré
4. Coordonnées — formulaire (existant)
5. Carte — refonte ergonomie (voir détail ci-dessous)
6. Profil — voir détail ci-dessous
7. Page partenaire — lien partenaire, inchangée
8. Bandeaux défilants — inchangés

## Carte — refonte confirmée ouverte

- Refonte visuelle complète confirmée (pas seulement l'ergonomie des points)
- Forte amélioration de l'ergonomie sur les points/stations
- Plus de distinction prestataires / partenaires : **une seule et même carte**, un seul type de point

## Profil — contenu

- Mes favoris (nouveau)
- Mon ticket
- Conditions de jeu par station / par jour (compteurs), toujours visibles
- Fonction Partage liée au gain de points

## Direction UX/UI

- Réduction de la densité : moins d'espace entre les blocs, moins d'informations par écran, plus fluide
- Reprise du langage visuel de la plaquette interactive : vignettes, couleurs, pictogrammes

## Points à confirmer avec Romain

- Un fragment du brief oral ("pour un burger pardon dans profil") n'a pas pu être interprété de façon fiable — à préciser.
- Fonction Partage (Profil) : nouvelle fonctionnalité, ou déjà présente dans le parcours actuel ? À vérifier avant de la lister comme un développement.
- "Carte des extensions" : confirmé comme la carte des commerçants/partenaires — à valider que c'est bien ça.

## Méthode de travail proposée

Même méthode que le chantier marque blanche :

1. Audit écran par écran de l'existant (`NDS2026Client.tsx`), avant toute maquette
2. Design aligné sur le style de la plaquette (vignettes / couleurs / pictogrammes), construit directement dans le vrai composant — pas de maquette réinventée
3. Implémentation via `cfg` / gate de preview (`?preview=1`), sans toucher au live
4. Validation côté joueur (parcours réel testable en preview)
5. Validation côté pro (dashboard SA — compteurs, stats, retrait de lot : contrôle de non-régression)
6. Contrôle de non-régression explicite sur la liste "ce qui ne change pas" ci-dessus
7. Déploiement

## Reste à faire pour déployer

Cette fiche doit d'abord être validée (notamment les 3 points ouverts ci-dessus). Une fois validée, prochaine étape : audit détaillé écran par écran (étape 1 de la méthode) pour chiffrer précisément le travail restant. Pas d'estimation chiffrée tant que le scope n'est pas confirmé.
