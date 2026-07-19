# RAPPORT D'AUDIT — Comptage NDS 2026 (période 09 → 18/07)

Arrêté au 19/07/2026. Festival terminé. Source unique : base Supabase `ywcqtupgoxfzkddqkztk`.

---

## 1. Anomalies trouvées et corrigées

| # | Anomalie | Impact | Statut |
|---|---|---|---|
| 1 | **Station Caisse 3 orpheline** — QR déployé et scanné, mais aucune ligne dans `events` → exclue de toutes les agrégations | 14 flashs + 2 jeux invisibles | ✅ Corrigé (event créé + 4 listes dashboard) — commit 7010ee4 |
| 2 | **Scans en fire-and-forget** — `trackVisite` sans file ni retry ; sous réseau saturé, échec silencieux | Flashs et marqueurs d'étape perdus, non reconstructibles | ✅ Corrigé (file localStorage + rejeu `online` + dédup anti-rafale) — commit 83dc03c |
| 3 | **Compteurs `events.participants` faux (−18 %)** — incrémentés `+1` dans une RPC ; le rejeu de la file offline insère sans passer par la RPC → dérive jamais rattrapée | 730 parties affichées vs 887 réelles | ✅ Corrigé (trigger `trg_sync_event_participants` + backfill) — commit 5a74657 |
| 4 | **Plafonds de requête dashboard** — `limit=500` et compteur = longueur de liste | Sidebar affichait 500 joueurs pour 769 réels | ✅ Corrigé (500→20000, 5000→50000) — commit 5a74657 |
| 5 | **`visiteur_id` absent les 09 et 10/07** (100 % des flashs), partiel le 11 (22 %) | Impossible de dédoublonner les visiteurs sur ces 3 jours | ⚠️ Non corrigeable rétroactivement — documenté |
| 6 | **Double-fire du tracking** (ex. Caisse 2 le 17/07 : 5 scans en 10 s) | Sur-comptage marginal | ✅ Corrigé par la dédup du #2 |

**Non-anomalies écartées après vérification** : aucune erreur d'attribution de station (l'`event_id` est repris verbatim du QR) ; aucune inscription orpheline ; aucun doublon de participation (les multi-lignes ont des `ticket_code` distincts et des jours différents = règle 1 ticket/station/jour) ; aucune donnée NDS rangée dans une autre table. Le creux du 12 au 15/07 correspond à l'absence de soirées, pas à un bug.

---

## 2. Ce qui s'est passé (cause commune)

Le réseau du site était saturé (46 épisodes `err:reprise-reseau` enregistrés). Deux chemins d'écriture coexistaient :

- **Les parties** passaient par une file d'attente durable (`flowin_nds_wq`) rejouée au retour du réseau → **les jeux sont fiables et complets**.
- **Les flashs et les marqueurs d'étape** n'avaient aucune file → **perdus définitivement** à chaque coupure.

En prime, les compteurs affichés étaient incrémentés uniquement sur le chemin nominal : chaque partie rattrapée par la file n'était donc jamais comptée, d'où la dérive de −18 % constatée sur toutes les stations.

**Conséquence de lecture** : les jeux et les joueurs sont exacts. Les flashs sont un **plancher** (sous-comptés les jours de forte affluence, surtout avant le 18/07).

---

## 3. Règles établies (à ne plus violer)

1. **Tout compteur agrégé est DÉRIVÉ de sa table de faits**, jamais incrémenté à la main. `events.participants` = `count(*)` des `participations`, maintenu par trigger quel que soit le chemin d'écriture. Tout `SET participants = participants + 1` est proscrit.
2. **Un compteur affiché n'est jamais la longueur d'une liste paginée.** Vérifier le `limit` avant d'interpréter un total.
3. **Toute écriture de télémétrie doit être durable** (file locale + rejeu), au même titre que les écritures métier. Une écriture best-effort silencieuse est une perte de données déguisée.
4. **Attribution de station** : `visites.event_id` = paramètre `?ev=` du QR, verbatim. Le remap `ndsFamily` ne concerne que le ledger de tickets.
5. **Métrique de pilotage** : privilégier jeux et joueurs uniques (durables). Les flashs servent en tendance, pas en absolu.

---

## 4. Bilan par station — festival complet (09 → 18/07)

| Station | Flashs | Joueurs uniques | Jeux |
|---|--:|--:|--:|
| NDS · Caisse 2 | 432 | 147 | 159 |
| NDS · Brigade Verte 2 | 367 | 144 | 146 |
| NDS · Bar 1 | 317 | 111 | 125 |
| NDS · Caisse 1 | 300 | 104 | 122 |
| NDS · Brigade Verte 3 | 249 | 109 | 118 |
| NDS · L'Écran | 233 | 97 | 106 |
| NDS · Bar 3 | 194 | 72 | 86 |
| NDS · Bar 2 | 115 | 49 | 57 |
| SAFER | 88 | 33 | 38 |
| Nook Café | 49 | 7 | 8 |
| Électroménager J Giordano | 27 | 6 | 6 |
| Utile Vence | 23 | 5 | 5 |
| NDS · Brigade Verte 1 | 5 | 2 | 4 |
| NDS · Caisse 3 | 14 | 1 | 2 |
| Assurance Charvolin | 13 | 2 | 2 |
| Auto-École de l'ARA | 2 | 1 | 1 |
| Domaine de la Bergerie | 11 | 1 | 1 |
| Carrosserie GP | 7 | 0 | 0 |

**Totaux festival** : 2 449 flashs · **617 joueurs uniques** · 986 jeux.
Les colonnes « joueurs uniques » s'additionnent à plus de 617 : un même joueur compte dans chaque station où il a joué, mais une seule fois au total.

---

## 5. Journée du 17/07 (détail demandé)

| Station | Flashs | Visiteurs uniques | Joueurs uniques | Jeux |
|---|--:|--:|--:|--:|
| NDS · Brigade Verte 2 | 99 | 85 | 36 | 36 |
| NDS · Brigade Verte 3 | 65 | 55 | 26 | 26 |
| NDS · Caisse 2 | 29 | 19 | 13 | 13 |
| NDS · L'Écran | 28 | 24 | 13 | 13 |
| NDS · Bar 3 | 23 | 19 | 10 | 10 |
| SAFER | 19 | 12 | 9 | 9 |
| NDS · Caisse 1 | 18 | 10 | 7 | 7 |
| NDS · Bar 1 | 11 | 11 | 5 | 5 |
| NDS · Bar 2 | 9 | 5 | 3 | 3 |
| Électroménager J Giordano | 4 | 2 | 1 | 1 |
| Domaine de la Bergerie | 1 | 1 | 0 | 0 |
| **TOTAL 17/07** | **306** | **213** | **96** | **122** |

**Lecture** : 213 appareils distincts ont flashé, 96 personnes identifiées ont joué.
Sur ces 96 : **88 nouveaux inscrits** et **8 déjà inscrits qui rejouaient**.
La différence entre 213 et 96 ne correspond donc pas à des habitués : ce sont des personnes qui ont flashé sans aller au bout.

### Entonnoir du 17/07

| Étape | Personnes |
|---|--:|
| Flash / arrivée | 204 |
| Onboarding | 204 |
| Quiz commencé | 203 |
| Résultats atteints | 110 |
| Inscription | 100 |
| Terminé | 96 |

Décrochage principal entre le quiz et les résultats. **Réserve importante** : ces marqueurs passaient par le tracking non durable (anomalie #2), donc une part du décrochage apparent est constituée de marqueurs perdus, pas d'abandons réels — le nombre de parties enregistrées (122) dépasse d'ailleurs le nombre de marqueurs « résultats » (110). Le décrochage est réel mais son ampleur exacte n'est pas mesurable rétroactivement.

---

## 6. Journée du 18/07 (dernière soirée, après correctif)

307 flashs · 212 visiteurs uniques · 91 joueurs · 121 jeux · **0 flash sans identifiant**.

---

## 7. Points restants

- **Google Sheet « backup flowin »** : non à jour. Alimenté par un Apps Script lié au classeur (hors dépôt, hors accès MCP). Export autoritaire fourni pour réimport.
- **Écart 554 / 553** dans la vue participants : un participant sans participation rattachée au super-event. À identifier à froid.
- **Décrochage dans le quiz** : à réinstrumenter proprement (marqueurs durables) avant d'en tirer une conclusion produit.
