# Plan de rangement du dépôt par espace (25/11/2026) : SANS rien déplacer

Contraintes : URLs de production inchangées (QR imprimés `/parcours/...`, `/q/<code>`, `/pro/...`) ; `NDS2026Client.tsx` et `nds2026Design.ts` ne bougent JAMAIS (chemin `admin/app/parcours/nds2026/`) ; miroir dashboard MD5 identique ; Vercel root `/admin`. Next.js App Router : les dossiers de `app/` sont des URLs ; seuls `components/` et `lib/` se rangent librement.

## 1. Mesure de départ
`app/dashboard` 56 pages / 9 760 lignes ; `components/` : dashboard 6 280, pro 5 970, creation 3 112, operations 2 945 ; `lib/` 14 896 lignes dans ~90 fichiers à plat (dont `lib/masters/` 2 340). Un composant partagé est parfois rangé dans l'espace d'un seul de ses utilisateurs : `SuperEventMap` est dans `app/se/_components/` mais importé par 5 écrans hors `/se` (`ParcoursCreation`, `JouerClient`, `StationsCarteGPS`, `nds-carte`).

## 2. Arborescence proposée (cible)
```
admin/
  app/                      (URLs : ne change pas ; routes minces qui importent)
  components/
    commun/                 noyau : carte/, qr/ (QrTraces), lots/ (formulaire unique), parcours/, ui/, creation/ (Configurateur)
    sa/                     ex components/dashboard
    pro/                    ex components/pro
    super-event/            ex components/operations (+ SuperEventMap)
    participant/            ex components/joueur, masters/
  lib/
    commun/                 supabase, charte, proui, proicons, qrTraces, qrPermalien, gabarit, erreursFr, reglesEspaces (nouveau)
    sa/  pro/  super-event/ participant/ (masters/, parcours*, mesLots, moiTicketsGains, ticket)
```
Correspondance actuelle vers cible (extraits) :
| Aujourd'hui | Espace cible |
|---|---|
| `components/dashboard/*`, `lib/dashboard.ts`, `lib/saSession.ts`, `lib/roadmap.ts` | sa |
| `components/pro/*`, `lib/pro.ts`, `lib/crmPro.ts`, `lib/inscriptionPro.ts`, `lib/droitsPro.ts` | pro |
| `components/operations/*`, `lib/nds.ts`, `lib/superEvent*.ts`, `app/se/_components/SuperEventMap.tsx` | super-event (la carte : commun) |
| `lib/masters/*`, `lib/parcours.ts`, `app/jouer`, `lib/mesLots.ts`, `lib/moiTicketsGains.ts` | participant |
| `components/creation/*`, `components/carte/*`, `components/ui/*`, `lib/charte.ts`, `lib/proui.ts`, `lib/qrTraces.ts`, `lib/gabarit.ts` | commun |

## 3. Ordre de migration sûr (une étape = un commit = un tag = un build lu)
0. Filet : tests de caractérisation (ECARTS E9) + tag `avant-rangement`. Rien d'autre ne commence avant.
1. Alias `@/commun`, `@/sa`, `@/pro`, `@/super-event`, `@/participant` dans `tsconfig.json` sans déplacer de fichier : permet de migrer progressivement.
2. Documentation : un `INDEX.md` par futur dossier listant les fichiers actuels (déplacement fictif). Livrable de lecture seule.
3. Déplacer d'abord les PETITS fichiers du noyau, par copie + ré-export : le fichier d'origine devient `export * from '@/commun/...'` (aucun import cassé). Ordre : `charte`, `proui`, `qrTraces`, `carte/*`, `SuperEventMap`.
4. Puis `lib/` pur (pas de React) par espace, un espace par commit : participant, pro, super-event, sa.
5. Puis `components/` par espace, du plus petit au plus gros : participant, super-event, pro, sa.
6. Supprimer les ré-exports seulement quand `grep` ne trouve plus l'ancien chemin ET après accord de Romain (règle : aucune ligne du registre supprimée sans lui).
Jamais déplacés : `app/parcours/nds2026/*`, `public/dashboard.html` et miroir, `lib/nds2026Design.ts` (aujourd'hui sous `lib/` : à laisser à sa place).

## 4. Garde-fous à chaque étape
`npx tsc --noEmit` ; `npm run build` avec lecture de « Compiled successfully » ; `git checkout -- tsconfig.tsbuildinfo` ; smoke `scripts/controle/smoke.mjs` (pages 200) ; MD5 du dashboard ; Acorn 2020 ; `git ls-remote origin -h refs/heads/main` après push.

## 5. Retour arrière
Chaque étape : `git revert <commit>` ; les ré-exports garantissent que l'avant-dernière étape tient seule. Tag `avant-rangement` pour tout reprendre. Aucun SQL.

## 6. Gain honnête
Gain faible tant que E2 à E5 (ECARTS.md) ne sont pas faits : le rangement aide à LIRE, il ne supprime aucun doublon. À faire APRÈS les écarts, pas avant. Effort 3, impact 2.

Non vérifié : nombre exact d'imports à réécrire (aucun `grep` d'import complet lancé) ; effet du déplacement sur le temps de build Vercel.
