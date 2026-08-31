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

**Variante trouvée le 24/08** : un bouton peut avoir `cursor: pointer` en style
sans le moindre `onClick` — visuellement cliquable, fonctionnellement mort.
Repéré sur les 3 boutons "Export" d'EventDrawer (aucun ne téléchargeait quoi
que ce soit). `grep -c onClick` sur un fichier ne suffit pas si le bouton
suspect n'a simplement pas de handler du tout — vérifier chaque bouton à
`cursor: 'pointer'` individuellement.

**Déjà trouvé et corrigé sur** : nds-resultat, nds-bon-commande, jeux (templates),
EventDrawer → onglet Events du ProDrawer et du PartenaireDrawer, EventDrawer →
onglet Participants, EventDrawer → onglet Export (3 boutons décoratifs).

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
pitch-nds.html, nds-partenaire-presentation.html, flowin-partenaire-presentation.html,
**et le plus important, trouvé le 24/08 après insistance justifiée de Romain** :
`nds/kit-digital/index.html` (page complète "Dossiers partenaires" — 7 vrais
partenaires, aperçu, zip, A3/A4/A5/PPTX/SVG/vidéo/QR par partenaire),
`facture-nds.html` (vrai générateur de facture, en-tête OPConsult, lié au
devis), `bons-commande-liste.html`. Ces trois-là étaient des systèmes complets
et soignés, pas des brouillons — leur absence du menu pendant des semaines a
fait perdre à Romain un temps considérable à en redemander l'existence.

**Leçon** : quand Romain insiste ("on a fabriqué ça, je ne comprends pas
pourquoi tu dis que ça n'existe pas"), le chercher LARGEMENT (tout le repo,
pas seulement `admin/public/*.html` à la racine — `kit-digital/` était un
sous-dossier) avant de répondre "je ne trouve pas" ou pire, avant de proposer
de le reconstruire.

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

## Pattern F — Token de session non rafraîchi (outils HTML avec login)

**Symptôme** : une page qui nécessite une connexion (`admin-connexion.html` +
`flowin_admin_session` en localStorage) échoue en HTTP 401 après un certain
temps, alors que la session semblait valide (l'utilisateur vient de se
connecter, ou l'onglet est resté ouvert).

**Cause récurrente** : `dashboard.html` a un mécanisme de rafraîchissement
automatique du token (`_authRefresh()`, via `refresh_token`, toutes les 45
min + proactif si expiration proche). Les outils plus récents qui
réutilisent la même session (lecture de `flowin_admin_session`) n'ont pas
tous reçu ce mécanisme — ils lisent l'`access_token` une fois au chargement
et ne le renouvellent jamais.

**Déjà trouvé et corrigé le 27-28/08** : `bons-commande-liste.html`,
`facture-nds.html`, `bon-commande-nds.html`. Déjà présent (à ne pas
retoucher) : `dashboard.html`, `tirage-nds.html`, `lots-nds.html`.

**Comment vérifier** : `grep -L "_authRefresh\|refresh_token" $(grep -rl "flowin_admin_session" admin/public --include="*.html")`
— tout fichier listé (donc sans le pattern) est suspect.

## Pattern G — 3 systèmes dashboard jamais fusionnés (méta-pattern)

**Symptôme** : Romain dit "ça a disparu" / "tu as réécrit un truc qui
existait" / "ça ne correspond pas à ce qu'on avait fait" à propos d'un outil
CRM, commercial ou de reporting.

**Cause de fond** : `admin/public/dashboard.html` (legacy, ~930 Ko, encore
modifié le 31/07), le dashboard SA Next.js (`admin/app/dashboard/*`), et une
collection d'outils HTML statiques autonomes (`admin/public/*.html` —
factures, bons de commande, kit-digital...) coexistent **sans jamais avoir
été fusionnés**. Voir `docs/audit-dashboard-organisation-2026-08.md` pour le
détail. Une fonctionnalité peut très bien être complète et soignée dans UNE
des trois couches et absente/différente dans les deux autres.

**Réflexe avant de dire "ça n'existe pas" ou de recoder quelque chose** :
chercher dans les 3 couches, pas seulement celle sur laquelle on travaille.
`grep -rl "<mot-clé>" admin/public admin/app admin/components` avant toute
reconstruction. Lire `docs/SPEC-TECHNIQUE-flowin.md` et les docs d'audit
existants (`docs/*audit*`, `docs/*carte-navigation*`) en tout début de
session, pas seulement quand un problème remonte.



## Pattern H — `lib/types.ts` désynchronisé du composant réel

**Symptôme** : un écran de config écrit une clé `cfg.xxx` qui n'est lue par
aucun composant joueur, ou omet une clé réellement lue — l'event paraît
configuré côté admin mais rien ne change côté joueur (ou l'inverse).

**Cause de fond** : `EventCfg` (`lib/types.ts`) a `[key: string]: unknown`,
donc TypeScript n'attrape aucun écart entre le type déclaré et ce que lit
vraiment le composant `*Client.tsx` du module. Écarts déjà trouvés :
`voteSections` et `tombolaChamps` étaient déclarés et lus **nulle part**
(vote lit en réalité `voteItems`/`voteMode`) ; `quizCustomQuestions` est
déclaré mais jamais lu (la vraie clé est `customQuestions`) ; `customQuestions`,
`quizNbQuestions`, `quizTimer`, `tirageDate` étaient lus par des composants
et absents du type avant le 28/08 (corrigé).

**Nuance confirmée le 28/08 en lisant les 3 fichiers quiz ligne à ligne**
(`grep -n "cfg\." sur chaque *Client.tsx`, ne jamais supposer par analogie) :

| Clé cfg | quiz | quizmaster | quizsolo |
|---|---|---|---|
| `quizBanques` (banques) | ✅ | ✅ | ✅ |
| `customQuestions` | ✅ | ❌ jamais lu | ✅ |
| `quizNbQuestions` | ✅ (défaut 5) | ✅ (défaut 5) | ✅ (défaut 5) |
| `quizTimer` | ✅ (défaut 30, `false`=off) | ❌ jamais lu | ❌ jamais lu (chrono fixe 30s en dur, pas piloté par cfg) |

Avant tout écran de config : `grep -rn "cfg\." admin/app/parcours/<module>/*Client.tsx`
— ne jamais généraliser le comportement d'un module à un autre du même
"type" (quiz/quizmaster/quizsolo se ressemblent mais divergent précisément
sur ces 2 points).

## Pattern I — Bornage de date oublié sur une seule CTE (RPC de comptage)

**Symptôme** : une colonne d'un rapport borné aux dates du super event affiche
une valeur incohérente avec les autres colonnes de la même ligne (ex.
« répondants bonus » supérieur au nombre de joueurs du même point de jeu).

**Cause récurrente** : un RPC de comptage assemble plusieurs CTE (une par
métrique). Chaque CTE borne ses lignes aux dates du super event
(`(x.created_at at time zone 'Europe/Paris')::date between se.date_d and
se.date_f`) — **sauf une**, oubliée lors de l'écriture initiale. Elle continue
de compter des lignes hors festival (ex. des réponses de **test** créées
avant l'ouverture, le 01/07 pour NDS 2026) indéfiniment, sans qu'aucune
erreur ne se déclenche — la fonction reste syntaxiquement valide.

**Déjà trouvé et corrigé le 29/08** : `super_event_rapport_points()` (CTE
`bo`) et `super_event_bonus_resultats()` (CTE `base`) — les deux lisaient
`se_reponses` sans bornage alors que `visites`/`participations` en avaient un
partout ailleurs dans les mêmes fonctions. Réel : le total
« 321 répondants bonus » publié à Romain le 25/07 était gonflé de
19 répondants (321 − 302 après correctif, delta directement vérifiable). Signalé une première fois le
25/07 (hypothèse de cause fausse : désalignement `event_id`), persistait
encore le 29/08 — la vraie cause n'avait jamais été trouvée.

**Comment vérifier** : pour tout RPC agrégeant plusieurs CTE bornées aux
dates d'un super event, lister CHAQUE CTE et vérifier individuellement
qu'elle porte bien la condition de bornage — ne jamais supposer qu'une CTE
suit la même règle que ses voisines parce qu'elle leur ressemble
structurellement (même erreur de fond que le Pattern H sur les types : la
similarité de forme ne garantit pas l'identité de comportement).
`pg_get_functiondef(oid)` (`from pg_proc where proname = '...'`) pour lire
le SQL réel d'un RPC avant de le corriger à l'aveugle.

## Pattern J — Rebrancher une page orpheline sans vérifier son style

**Symptôme** : une page réintégrée au menu (cf. Pattern D) s'affiche avec une
palette, une police ou une mise en page complètement différentes du reste
du dashboard — visuellement, on dirait une autre application.

**Cause récurrente** : une page a été codée à un moment où le système visuel
`sa-*` (composants `SectionHeader`, `sa-kpi-grid`, `sa-card`, etc.) n'existait
pas encore, ou par une session qui l'a ignoré. Le code fonctionne, les
données sont réelles — mais le style est resté un one-off (ex. objet `S`
de styles inline propre à la page, palette sombre violette/rose, police
différente). Retrouver une page orpheline via Pattern D ne dit rien de
son état visuel : existence fonctionnelle ≠ intégration visuelle.

**Trouvé le 29/08** : `/dashboard/operations` rebranchée dans la Sidebar
sans vérification de style — palette et police entièrement disjointes de
`sa-*`. Repéré par Romain sur capture d'écran, lien retiré dans la foulée
(commit `9aafd40`) en attendant une décision (restyler ou laisser de côté).

**Règle à partir de maintenant** : avant de relier une page orpheline dans
la Sidebar, ouvrir son code et vérifier qu'elle utilise les composants
`sa-*` partagés (`grep -n "S\.\|style={{" ` sur le fichier — un objet de
styles inline dédié est un signal d'alerte). Si elle ne les utilise pas,
le rebranchement n'est pas une simple entrée de menu : c'est un chantier
de restylage, à traiter et annoncer comme tel, pas glissé au passage d'un
inventaire.

## Pattern K — Distinguer données de test de données réelles par la répartition temporelle

**Symptôme** : un total agrégé (ex. « 214 lots tirés ») dépasse largement ce qui a été
réellement configuré/vendu/promis, sans qu'aucun statut en base ne distingue
explicitement le test du réel.

**Piège évité le 31/08** : deux colonnes indépendantes existaient sur `tirages`
(`notifie_at`, posé quand le SA confirme manuellement, et `retire_at`, posé par un
circuit de retrait séparé côté joueur/partenaire) — une ligne pouvait avoir `retire_at`
renseigné SANS jamais avoir eu `notifie_at`. Une estimation rapide (« ni l'un ni
l'autre = jamais touché ») aurait sous-estimé le problème d'un facteur 75 (2 lignes vs
153 réellement concernées).

**Méthode qui a marché** : avant toute action sur des données ambiguës, regrouper les
horodatages par heure (`date_trunc('hour', colonne)`). Une activité réelle (festivaliers
récupérant un lot en boutique) s'étale sur des jours/semaines à un rythme irrégulier.
Une activité de test/dev se regroupe en **rafales de quelques heures**, souvent avec des
dizaines d'occurrences dans la même heure — un rythme humain ne produit jamais ça.
`select date_trunc('hour', colonne), count(*) from table group by 1 order by 1` suffit à
trancher en une requête, avant de conclure quoi que ce soit sur l'origine des données.

**Ne jamais agir sur une hypothèse de comptage sans avoir vérifié la répartition
temporelle réelle** — l'écart entre l'estimation initiale et la réalité vérifiée peut
être énorme, dans un sens comme dans l'autre.

1. Pattern A : lister toutes les pages avec `<table` mais 0 `onClick`
2. Pattern B/C : `grep` les patterns ci-dessus, vérifier au cas par cas si c'est
   un vrai defaut (contexte partenaire/event réel) ou un usage légitime (Pattern B
   nuance)
3. Pattern D : comparer fichiers HTML publics déployés vs liens Sidebar.tsx
4. Pattern E : requête SQL ci-dessus sur les tables touchées par la session en cours
5. Documenter tout nouveau pattern trouvé ici, pas seulement dans le handoff
   (le handoff tourne, ce fichier reste)
