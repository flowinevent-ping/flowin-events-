# Patterns de bugs connus — à vérifier systématiquement

Ce document existe parce que le même type d'erreur a été retrouvé, indépendamment,
sur au moins 6 pages différentes en une seule soirée (21-24/08/2026). Pas de la
malchance — un vrai passage systématique n'avait jamais été fait après la migration
Next.js. Ce fichier sert de checklist pour tout audit futur, par n'importe quelle
session Claude, avant de dire "c'est bon" sur une page du dashboard SA.

## Pattern A — Liste/tableau sans clic (fiche jamais branchée)

**Symptôme** : une page liste des lignes (joueurs, events, partenaires, bons de
commande...) mais cliquer dessus ne fait rien.

**Cause récurrente** : le composant importe `openDrawer` (ou équivalent) et parfois
même l'utilise pour un bouton d'édition, mais jamais sur la ligne elle-même.

**Déjà trouvé et corrigé sur** : nds-resultat, nds-bon-commande, jeux (templates),
EventDrawer → onglet Events du ProDrawer et du PartenaireDrawer.

**Comment vérifier** : `grep -rl "<table" admin/app/dashboard --include=page.tsx`
puis pour chaque fichier, `grep -c onClick` — si 0, c'est suspect.

## Pattern B — Mauvaise source de données pour les gagnants/lots

**Symptôme** : une fiche affiche "0 lot" / "0 gagnant" alors que la personne ou le
partenaire a clairement joué/gagné.

**Cause récurrente** : le code lit `joueurs.gains` (jamais alimentée) ou la table
`lots` (quasi vide pour tout ce qui passe par un partenaire réel) au lieu de la
table `tirages`, qui est la vraie source pour les gains liés à un partenaire.

**Nuance importante** : `lots` N'EST PAS toujours fausse — elle reste la bonne
source pour les événements sans partenaire (tombola/wizard auto-créés). Le
diagnostic correct est : est-ce que cet event/pro a un `partenaire_id` résolu ?
Si oui → `tirages` filtrée par ce `partenaire_id`. Si non → `lots` reste correcte.

**Déjà trouvé et corrigé sur** : /dashboard/gagnants, EventDrawer → onglet Lots.
**Trouvé mais PAS corrigé (composant partagé, trop risqué en fin de session)** :
`admin/lib/pro.ts` → `fetchProDashboard()`, utilisé par `/pro/tirage` et tous les
sous-onglets de `ProClient.tsx` (stats/gains/tirage/participants/lots/export).

## Pattern C — `joueurs.events` (array containment) au lieu de `participations`

**Symptôme** : l'historique d'un joueur ou d'un partenaire est incomplet, vide, ou
mélange plusieurs events sans distinction de station/heure.

**Cause récurrente** : le code fait `.contains('events', [eventId])` ou lit
`j.events` / `p.events` directement — un array stocké sur la fiche, jamais garanti
synchronisé avec la réalité. La table `participations` (scoping par `event_id`,
avec `source_qr`, `started_at`, `score`, `bonus_answers`) est la source fiable.

**Déjà trouvé et corrigé sur** : JoueurDrawer → onglet Historique de jeu,
PartenaireDrawer → onglet Events, `lib/dashboard.ts` → `fetchEventParticipants()`.

**Trouvé mais PAS corrigé (risque : composant partagé, logique anti-doublon en
jeu réel, pas juste de l'affichage)** : `admin/lib/joueurs.ts` → `checkDuplicate()`,
`admin/app/pro/ProClient.tsx` → `evJoueurs`, `admin/lib/pro.ts` → `fetchProDashboard()`.

**Comment vérifier** : `grep -rn "contains('events'\|\.events ??" admin/lib admin/app admin/components`

## Pattern D — Page réelle jamais reliée dans le menu (orpheline)

**Symptôme** : Romain dit "on avait déjà fabriqué ça" et a raison — le fichier
existe, marche, mais n'apparaît nulle part dans la sidebar.

**Déjà trouvé et corrigé** : tirage-nds.html, plaquette-nds.html,
pitch-nds.html, nds-partenaire-presentation.html, flowin-partenaire-presentation.html.

**Comment vérifier** : lister `admin/public/*.html` et `docs/**/*.html`, comparer
aux `href` présents dans `admin/components/dashboard/Sidebar.tsx`.

## Pattern E — RLS active sans policy `anon`/`public`

**Symptôme** : le dashboard SA (qui tourne en clé anonyme, sans vraie connexion)
affiche 0 résultat sur une table dont on est sûr qu'elle contient des données.

**Déjà trouvé et corrigé sur** : `tirages` (policy `anon` manquante, seule
`authenticated` existait).

**Comment vérifier** :
```sql
SELECT c.relname, bool_or(p.roles::text LIKE '%anon%' OR p.roles::text LIKE '%public%') AS anon_ok
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public'
LEFT JOIN pg_policies p ON p.tablename=c.relname
WHERE c.relkind='r' AND c.relrowsecurity=true
GROUP BY c.relname HAVING NOT bool_or(p.roles::text LIKE '%anon%' OR p.roles::text LIKE '%public%');
```
(Attention : les policies sans `TO role` explicite apparaissent comme `{public}`,
pas `{anon}` — un filtre texte naïf sur "anon" donne de faux positifs, vérifier
`public` aussi.)

## Protocole d'audit autonome (à exécuter en début de session, sans attendre un signalement)

1. Pattern A : lister toutes les pages avec `<table` mais 0 `onClick`
2. Pattern B/C : `grep` les patterns ci-dessus, vérifier au cas par cas si c'est
   un vrai defaut (contexte partenaire/event réel) ou un usage légitime (Pattern B
   nuance)
3. Pattern D : comparer fichiers HTML publics déployés vs liens Sidebar.tsx
4. Pattern E : requête SQL ci-dessus sur les tables touchées par la session en cours
5. Documenter tout nouveau pattern trouvé ici, pas seulement dans le handoff
   (le handoff tourne, ce fichier reste)
