# 🔁 REPRISE — 14/09 (fin de session)

## 0. Bootstrap — avant toute lecture

Les secrets sont dans Notion, page parente **🔑 ACCÈS COMPLETS**. Ils ne sont
recopiés nulle part ailleurs : un secret à deux endroits est un secret qui ment
le jour où l'un des deux est révoqué.

| Quoi | Valeur |
|---|---|
| Repo | `flowinevent-ping/flowin-events-`, branche `main`, racine `/admin` |
| GitHub | pas de connecteur — bash + token en URL, token dans 🔑 ACCÈS COMPLETS |
| Avant tout pull/push | `export NO_PROXY='*' no_proxy='*' HTTPS_PROXY= https_proxy= GIT_CONFIG_COUNT=0` |
| Supabase | projet `ywcqtupgoxfzkddqkztk`, MCP Supabase, clé anon (RLS `flowin_anon_all_*`) |
| Vercel | auto-deploy sur push `main`, `flowin-events.vercel.app`. Rien à faire |
| Hub Notion | `38c6dcca-9add-81dd-9af2-c93139e06393` |

**Test d'accès obligatoire**

1. `git clone` puis **push réel** (branche temporaire créée puis supprimée).
   Le dépôt est public : le clone ne prouve rien, seul le push compte.
2. `execute_sql("select 1")` sur `ywcqtupgoxfzkddqkztk`.
3. 403 au push → STOP, le dire en une phrase. Un PAT n'y change rien, le proxy
   git bloque avant l'authentification.

**`execute_sql` est en LECTURE SEULE.** Toute écriture passe par
`apply_migration`, et doit être écrite dans `sql/` sous le même nom.

## 1. Lecture obligatoire

- `docs/audit-parcours.html` (commit `0fb11bf`) — les 18 constats avec preuves
- `docs/patterns-bugs-connus.md`
- Supabase, `handoff_notes`, clé `handoff-nds-2026-comm`

## 2. Compte de test

`flowinevent@gmail.com` → `pro-charvolin`
(`sql/rattacher_compte_flowinevent_a_un_pro_pour_essais.sql`).

**Charvolin a 0 gagnant et 0 lot en table.** Pour tester les écrans gagnants :

```sql
update pros set auth_id = null where auth_id = '5d16448c-4c2d-448c-8272-6ae78c4f315c';
update pros set auth_id = '5d16448c-4c2d-448c-8272-6ae78c4f315c' where id = 'pro-utile';
```

Utile 21 gagnants · Nook 16 · Bergerie 8 · Carrosserie GP 6 · Giordano 5 · ARA 3.

## 3. La règle — répétée par Romain, non tenue à ce jour

**Un pro a plusieurs events et super events. Rien ne s'affiche à plat.**

Chaque onglet part de la **liste complète des events du pro** et affiche
**un bloc par event / super event**, titré nom + date, trié par date
décroissante. Une opération sans données affiche son « aucun lot » **sous son
propre titre**. Vaut pour la fiche pro SA et pour le dashboard pro.

C'est le chantier principal restant. **Il n'est pas commencé.**

## 4. Audit — 6 familles, vérifiées en code et en base

| | Famille | Reste |
|---|---|---|
| A | `e.module` affiché brut (`nds2026`) au lieu de « Quiz + bonus » | 5 fichiers. `ModuleChip` existe déjà |
| B | gabarit master non filtré — **22 events** | filtre dans 8 fichiers, **manque dans 11**. Cause du doublon Charvolin |
| C | `creerAnimation()` écrit `cfg.lots`, tout lit la table `lots` | **3 lots** jamais matérialisés, invisibles et non tirables |
| D | `find(e => e.super_event_id)` prend le premier venu | **6 pages**. Cause des 0 flashs avec 12 visiteurs dessous |
| E | « demande envoyée automatiquement » — rien n'est envoyé | 3 fichiers. `diffusion_demandee` écrit, lu par personne |
| F | `api.qrserver.com` alors que `Diffusion.tsx` génère en local | 2 fichiers |

## 5. Ordre de reprise

1. **Le rangement par event/super event** (§3)
2. Famille B — un filtre unique appliqué aux 11 fichiers
3. Famille C — matérialiser les 3 lots + tarir la source
4. Familles A, D, E, F
5. Les 4 pages restantes du filtre `?se=` : partenaires, joueurs, nds-lots,
   gagnants. La brique `lib/filtreSuperEvent.ts` est écrite et déjà branchée
   sur `/dashboard/pros`.

## 6. Décisions de Romain, à respecter

- **Retirage** : autonome sur les events du pro, **piloté par le SA** sur les super events
- **Super event** : poussé par le dashboard SA, le pro ne le choisit pas
- **PIN** : `partenaires.code_pin`, seule colonne. `pin_pro` supprimée le 04/09
- **Contact partenaires** : `flowinevent@gmail.com` · **04 93 59 91 37**
- **Master marque blanche** : gabarit, jamais une opération — à filtrer partout

## 7. En suspens

- `/pro/parcours` : le pro garde-t-il la vue « Parcours super event » ?
- Stats uniformes : parties rejouées (même jour ou d'un jour à l'autre ?),
  pic de fréquentation (par heure ou par jour ?)
- Écran SA de contrôle proposé : compteurs d'incohérences (events master,
  lots non matérialisés, pros sans partenaire) pour vérifier sans relire le code

## 8. Méthode — ce qui a coûté du temps

Corrections découvertes une par une au fil des captures, au lieu d'un audit
d'abord. Romain l'avait demandé et c'est écrit dans `patterns-bugs-connus.md`.
**Chercher toutes les occurrences d'une famille avant de corriger, jamais
l'écran isolé.** Et ne pas poser de question dont la réponse est dans le dépôt
ou en base.
