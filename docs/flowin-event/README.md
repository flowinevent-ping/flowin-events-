# Architecture Flowin Event : index (25/11/2026)

> CORRECTION 25/11/2026 (Romain) : le Super Event est créé par Flowin Event uniquement ; les pros le rejoignent, ils ne l'organisent pas. Voir EN-CLAIR.md. Les mentions « organisateur pro » ci-dessous sont à revoir.

Auteur : agent critique-architecture-code. Lecture seule : aucun code ni SQL d'écriture modifié. Mesures : dépôt (commit 9bbc60d8) et base `ywcqtupgoxfzkddqkztk` (SELECT uniquement, 25/11/2026). Tout ce qui n'est pas prouvé est marqué « non vérifié ».

## Verdict : BON AVEC ÉCARTS

Le modèle en 4 espaces est le bon, et le dépôt le porte déjà aux deux tiers :
- une seule table `events` pour l'animation ET la station de Super Event (la différence = la présence de `super_event_id`) ;
- une seule fonction d'écriture d'une animation (`creerAnimation`, `admin/lib/pro.ts:145`), appelée par les 2 écrans de création ;
- un seul moteur de jeu en production (`/jouer`, `lib/masters/engine.ts`) : quiz, quiz solo, roue, tombola, vote y arrivent par redirection (`lib/masters/redirection.ts`) ;
- un CRM à 2 niveaux déjà fermé côté base : `crm_pro(p_pro)` (pro propriétaire ou SA) et `crm_participants` (SA seul).

Ce qui empêche « corriger une fois, partout » :
1. La création d'animation existe en 2 écrans : `Configurateur` (575 lignes) pour le pro, `ParcoursCreation` mode SA (1 867 lignes) pour le SA.
2. Le SA n'a pas le même geste que le pro : créer un pro ne crée pas son accès (18 pros sur 21 sans `auth_id`) et rien sur la ligne d'un pro ne lance une animation.
3. Les règles du Super Event sont dispersées en tests `if super` : 210 occurrences de `super_event_id` dans 59 fichiers, 50 `estSuper` dans un seul composant, `se-nds-2026` ou `ev-nds-` en dur dans 21 fichiers .ts/.tsx et 12 fois dans `dashboard.html`.
4. Deux interfaces Super Admin vivent en parallèle (Next : 56 pages ; monolithe `dashboard.html` : 15 665 lignes) avec chacune son formulaire de lot.
5. Pas de filet de tests ni de jeton de design unique : 4 519 `style={{` en ligne, 6 sources de couleurs.

## 5 actions prioritaires (preuves : ECARTS.md)
| # | Action | Impact | Effort |
|---|---|---|---|
| 1 | Fermer 3 fonctions publiques sur les Super Events (`supprimer_super_event`, `realigner_composition_super_events`, `dupliquer_super_event`) et la lecture publique des demandes de rattachement. À confier à securite-donnees | 5 | 1 |
| 2 | Un seul écran de création d'animation pour pro et SA : le SA ouvre le `Configurateur` avec un pro choisi (3 cas : existant, à créer, sans animation) | 5 | 3 |
| 3 | Bouton « Lancer une animation » sur chaque ligne pro et invitation d'accès à la création d'un pro par le SA | 4 | 2 |
| 4 | Un seul fichier de règles par type d'espace (`animation` / `super`) et `se-nds-2026` sorti du code | 4 | 3 |
| 5 | Tests de caractérisation avant toute fusion, puis retrait des 5 anciens clients de jeu sans trafic (0 animation en `masterOff`) | 4 | 2 |

## Fichiers
- `ARCHITECTURE-CIBLE.md` : schéma d'organisation en 1 page.
- `ECARTS.md` : actuel contre cible, par gain.
- `REGLES-ESPACES.md` : Super Event contre Animation.
- `PARCOURS-CREATION.md` : parcours unique pro + SA, 3 cas.
- `CRM-ET-STATS.md` : 2 niveaux, qui voit quoi, trous.
- `PLAN-DE-RANGEMENT.md` : arborescence par espace, rien déplacé, ordre sûr.
- `ORGANISATION-MEMOIRE-AGENTS.md` : état mesuré de la mémoire et des 13 agents, matrice des règles par espace, structure cible, chargement en 3 fichiers, automatisations, plan de migration sans suppression.
- `DONNEES.md` : brouillon d'inventaire des données personnelles par profil (colonnes réelles), accès, durée, suppression.

## Ajout organisation (précision de Romain)
Mémoire : 357 KB sur 60 fichiers sous `docs/claude/` ; un agent critique lit 95 KB (≈ 27 000 tokens, estimation) avant de commencer ; cible : 3 fichiers (≈ 4 000 tokens). 6e action prioritaire : copier les règles par espace (sans supprimer) et changer le protocole de lecture.

## Non vérifié (global)
Production Vercel (403 depuis le cloud), tout test sur iPhone, connexion réelle d'un pro ou du SA, dashboard monolithe connecté, appel réel des fonctions publiques citées (lues seulement, jamais appelées).
