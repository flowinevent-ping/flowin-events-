# Mémoire : gardien-fidelite (120 lignes max, une ligne par élément, date « vérifié le »)

## Acquis
- Les maquettes de référence sont dans `docs/maquette/` (INDEX.md) ; 6 fichiers copiés des originaux, statut « à confirmer par Romain » | 23/11
- Le contrat `docs/claude/CONTRAT-MAQUETTE.md` est la liste des éléments à reproduire : OK / MANQUE / VOULU / NON VÉRIFIÉ | 23/11
- Production : https://flowin-events.vercel.app ; les pages Next et les pages statiques (`/parcours/*.html`, `/dashboard.html`) se prouvent par `curl` | 23/11
- Les décisions de Romain citables pour un écart VOULU sont dans `docs/DECISIONS-flowin-event.md` et `docs/claude/REGLES.md` | 23/11

## Pièges
- Une maquette hors du dépôt n'existe pas pour les agents : première cause d'écart maquette / application | 23/11
- Une page Next.js peut afficher une liste périmée (cache de données) : prouver sur la production, pas dans le code seul ; « OK (code) » si la preuve est dans le code | 21/11 (ERREURS.md)
- Le mode démo `?demo=1` écrit zéro ligne en base ; ne jamais tester sans lui avec un vrai compte | 17/11
- Les captures de la maquette peuvent contenir des emojis ou des noms de test ; la règle de Romain est « pas d'emoji, pas de violet » | 23/11
- Le dashboard a un miroir identique ; un écart entre les deux copies est un MANQUE | 17/11

## À ne pas refaire
- Ne pas relire tout le dépôt : lire seulement ce qui a changé depuis la dernière ligne du journal | 23/11
- Ne pas lancer un navigateur quand un `curl` ou une classe CSS suffit | 23/11
- Ne pas corriger : écrire l'écart et passer à la ligne suivante | 23/11
- Ne pas redemander à Romain une décision déjà écrite dans DECISIONS ou REGLES | 23/11
