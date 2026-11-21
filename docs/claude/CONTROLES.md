# Contrôles automatiques de qualité (créé le 21/11/2026)

But : voir chaque semaine, en un PDF, ce qui est vert, orange ou rouge, sans rien rejouer à la main.

## Ce qui tourne, et quand
| Contrôle | Où | Quand |
|---|---|---|
| Contrôles de la base (sécurité, intégrité, envois, propreté, produit, facturation, dérive) | fonction SQL `controle_qualite_lancer()`, table `controles_qualite` (`sql/2026-11-21-controles-qualite.sql`) | chaque jour 03:17 UTC (pg_cron) une fois le SQL appliqué par Romain |
| Types, compilation, Acorn, secrets (gitleaks) | `.github/workflows/controle-qualite.yml` | à chaque push sur `main`, chaque lundi 06:00 UTC, à la demande |
| Pages de production (200, erreurs JS, mode démo sans écriture, vidéos v8, miroir dashboard) | `scripts/controle/smoke.mjs` (aussi lancé par le workflow) | même rythme que ci-dessus |

Aucun secret n'est nécessaire. Aucun contrôle n'écrit en base ni n'envoie de message.

## Où sont les résultats
- GitHub : onglet Actions, exécution « Contrôle qualité » : résumé en français + artefact `resultats-controle` (JSON, 90 jours).
- Base : `select public.controle_qualite_dernier();` (éditeur SQL Supabase).
- Rapports PDF : `docs/rapports/controle-AAAA-MM-JJ.pdf` (+ `.html` source et `.json` fusionné, qui sert d'historique au rapport suivant).

## Lire le PDF
- Page 1 : bandeau global (« Tout est vert » ou « N points à corriger ») et les trois compteurs.
- Page 2 : sommaire cliquable ; signets du lecteur PDF identiques.
- « Ce qui dépend de Romain » : seulement ce qu'il doit décider ou exécuter.
- Une section par famille ; chaque ligne : pastille VERT / ORANGE / ROUGE (toujours écrite), gravité, détail, « À faire », « Qui » (agent responsable).
- Dernière page « Historique » : comparaison au rapport précédent (mieux / stable / moins bien).
- Vert : rien à faire. Orange : bientôt. Rouge : en priorité.

## Régénérer le rapport
1. Smoke : `node scripts/controle/smoke.mjs --out /tmp/smoke.json` (≈ 1 minute).
2. Base : exécuter `select public.controle_qualite_dernier();`, enregistrer le résultat JSON dans un fichier (tableau de lignes).
3. Code : `resultats-code.json` de l'artefact GitHub (sinon omettre).
4. `node scripts/controle/rapport-pdf.mjs /tmp/smoke.json /tmp/base.json resultats-code.json` (`--prev ancien.json`, `--date AAAA-MM-JJ`, `--no-prev`). Les fichiers absents sont ignorés et signalés dans le rapport. Sans résultats de la base, le rapport écrit « Contrôles de la base : en cours de mise en place ».
Prérequis : Playwright (`admin/node_modules`) et un Chromium ; sinon `npx playwright install chromium`.

## Correspondance famille / agent
sécurité, intégrité : securite-donnees · envois : flux-integrations · facturation : facturation-crm · produit : produit-ergonomie · propreté, pages, dérive : recette-tests.

## Limites
- Les pages sont contrôlées depuis le serveur (pas d'iPhone ni de caméra réels).
- Le workflow ne lit pas la base : le rapport PDF est regénéré à la main ou par un agent.
- gitleaks : si le dépôt appartient à une organisation, l'action demande une licence gratuite (secret `GITLEAKS_LICENSE`) : à vérifier au premier passage.
- Reprise : tag avant migration risquée ; sauvegardes vérifiées par Romain chaque trimestre (prochaine 21/02/2027) ; fonctions Edge déployées comparées au dépôt à chaque vérification (non automatisé). Voir `PLAN-DE-REPRISE.md`.

## Format de sortie (Romain, 21/11/2026)
Pas de PDF ni de rapport chaque semaine. Si un contrôle est rouge : alerte courte (problème, cause, solution faite ou proposée, décision de Romain). Tout vert : silence et une ligne dans ETAT.md. Le PDF (scripts/controle/rapport-pdf.mjs) reste disponible sur demande.
