# 🚀 BOOTSTRAP — Reprendre le travail dans une nouvelle conversation

**Ce document permet à une nouvelle conversation de repartir exactement où on s'est arrêté,
sans rien perdre de la méthode ni du contexte.**

---

## 0. Le message à coller au démarrage d'une nouvelle conversation

> Reprends le projet Flowin / Nuits du Sud 2026.
>
> **Bootstrap obligatoire, dans cet ordre, avant toute action :**
> 1. Vérifie tes DEUX accès : (a) `git clone` du repo + `git log` + test de push ;
>    (b) Supabase MCP → `execute_sql SELECT 1`.
>    **Si l'un des deux manque : STOP, dis-le-moi, ne travaille jamais en mode dégradé.**
> 2. Lis le handoff : Supabase table `handoff_notes`, clé `handoff-nds-2026-comm`
>    (`select left(contenu, 9000) from handoff_notes where cle='handoff-nds-2026-comm'`).
> 3. Lis `docs/BOOTSTRAP-nouvelle-conversation.md` et `docs/METHODE-mode-preview.md`.
> 4. Établis la liste FAIT / RESTE À FAIRE et montre-la-moi avant de commencer.

---

## 1. Les accès

| Quoi | Où |
|---|---|
| **GitHub** | `flowinevent-ping/flowin-events-` — ⚠️ dépôt **public** |
| **Token de push** | **JAMAIS dans le repo.** Il est dans le handoff Supabase (privé). Si le push renvoie 401 → le token a expiré, demander le nouveau. |
| Format du push | `https://x-access-token:<TOKEN>@github.com/flowinevent-ping/flowin-events-.git` |
| Identité des commits | `git -c user.email=romain@flowin.events -c user.name="Romain Collin"` |
| **Supabase** | projet `ywcqtupgoxfzkddqkztk` (eu-west-1). Toutes les opérations DB passent par le **MCP** (`execute_sql`, `apply_migration`) — bash ne peut pas joindre `*.supabase.co`. |
| **Vercel** | déploiement **automatique** à chaque push sur `main` (racine `/admin`). Prod : `flowin-events.vercel.app` |
| **Notion** | page hub `38c6dcca-9add-81dd-9af2-c93139e06393` |

> ⚠️ **Règle de sécurité** : le dépôt est **public**. Ne jamais committer de token, de clé
> de service, ni de secret. Toujours filtrer les logs :
> `... | sed "s/${TK}/[TOKEN]/g"`

---

## 2. La règle des 3 piliers (jamais négociable)

**Toute tâche est terminée quand les TROIS sont à jour :**

1. **GitHub** — commit + push (Vercel déploie tout seul)
2. **Supabase** — `handoff_notes`, clé `handoff-nds-2026-comm` (on **préfixe**, on n'écrase pas)
3. **Notion** — page hub, en tête (`position: start`)

```sql
-- Ajouter au handoff (préfixe, ne détruit rien)
update handoff_notes
set contenu = $HF$ ...nouveau texte... $HF$ || contenu, maj = now()
where cle = 'handoff-nds-2026-comm';
```

---

## 3. La boucle de travail (c'est elle qui fait la qualité)

1. **Romain ouvre le [mode preview](#5-le-mode-preview) et envoie une capture du défaut.**
2. **Claude LIT LE CODE RÉEL.** Jamais de mémoire, jamais de supposition.
   → On cherche la **cause**, on la **nomme**, on ne corrige pas un symptôme.
3. **Correction + vérifications obligatoires** (voir §4).
4. **Commit + push + 3 piliers.**
5. **Pour toute refonte visuelle : MONTRER UNE PROPOSITION AVANT DE CODER.**
   Romain valide ou rejette, puis on produit. On ne code jamais un design non validé.

**Ce qui est attendu de Claude :**
- Dire quand il s'est trompé, et pourquoi.
- **Contredire Romain quand les chiffres le contredisent** (ex : « le formulaire perd les
  gens » → non, c'est le quiz : 102 abandons contre 0).
- Ne jamais inventer un chiffre, une URL, un contact. **Tout se vérifie en base.**

---

## 4. Les vérifications obligatoires avant tout push

| Fichier touché | Vérifications |
|---|---|
| **Next.js** (`.tsx`, `.ts`) | `npx tsc --noEmit` → **0 erreur** · `npx next build` → ✓ Compiled · puis `git checkout -- admin/tsconfig.tsbuildinfo` |
| **`dashboard.html`** | extraire le plus gros `<script>` → `node --check` → 0 erreur · **copier vers `admin/public/static/dashboard.html`** · vérifier que les **MD5 sont identiques** |
| **SQL** | tester en `set local role anon;` — c'est ce que fait le navigateur |

---

## 5. Le mode preview — l'outil central

🔗 `https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-ecrans&preview=1`

**L'application RÉELLE** (pas une maquette), avec une barre d'onglets pour circuler écran par
écran, et **toutes les écritures en base désactivées**.

➡️ **Ce qu'on valide dans le preview est exactement ce qui part en production. Zéro écart.**

C'est lui qui a permis de trouver : le bouton masqué par le bandeau, les logos qui
débordaient, la barre qui défilait, les textes décalés. **Aucune maquette n'aurait montré ça.**

📄 Méthode complète + **prompt réutilisable sur d'autres projets** : `docs/METHODE-mode-preview.md`

---

## 6. Les garde-fous du parcours (ne jamais casser)

1. **Le héros reste intact** — son image de fond ET le logo Nuits du Sud. C'est la marque.
2. **La barre de navigation reste ancrée en bas** (`position:fixed`), toujours visible.
3. **Le bandeau de logos ne masque AUCUN bouton** — la place est réservée sur la **section**
   (`.scr{padding-bottom:200px}`), **pas** sur `.pad` : l'écran d'accueil n'a pas de `.pad`.
4. **On ajoute, on ne retire pas.**

---

## 7. Les règles de données (jamais violer)

- **Toute statistique est bornée à la période du super-event** (`date_d` → `date_f`).
  Deux événements ne se mélangent jamais.
- **Sondage ≠ Bonus.** Le *sondage* = `super_events.sondage_questions` (landing/tablettes).
  Le *bonus* = `events.cfg.quizBonusList` (stations de jeu). **Ne jamais les additionner.**
- **Ne jamais additionner deux totaux qui se recoupent** → publier le nombre de
  **répondants uniques**.
- **Les modules maîtres** (`SpinClient`, `QuizClient`…) ne sont jamais modifiés pour un
  besoin spécifique : tout passe par `cfg` en base.
- **Les statistiques se présentent en chiffres et graphiques.** Pas de conclusion ni
  d'interprétation sauf demande explicite.

---

## 8. Le socle générique (9 RPC — tout super-event en hérite)

`super_event_daily` · `funnel` · `stations` · `clics` · `sondage` · `engagement` · `bonus` ·
`repondants` · `demographie`

Tous paramétrés par `p_se` (+ `p_date`), tous bornés à la période de leur événement.
**Créer une station, un partenaire ou un super-event ne demande AUCUNE ligne de code :
les statistiques suivent d'elles-mêmes.**

---

## 9. Où on en est (à mettre à jour à chaque session)

Voir le handoff Supabase, qui fait foi. En résumé au 14/07 :

- **Quiz passé de 4 à 3 questions** (73 % → 93 % de sans-faute attendu).
- **Le gros chantier restant : le quiz perd 102 personnes sur 198** (51 %). On ne sait pas
  encore à quelle question → tracer `quiz:1` à `quiz:4`.
- **Piste « moins web app »** : PWA installable (90 % du ressenti natif pour 5 % de l'effort).
- Contacts manquants : Utile, Bergerie, ARA, Carrosserie GP, SAFER.
- Le script Google Sheet n'est **toujours pas installé** (action Romain).

---

*Ce document est la mémoire de la méthode. Le handoff Supabase est la mémoire de l'état.*
