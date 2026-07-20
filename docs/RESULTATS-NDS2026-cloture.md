# RÉSULTATS NDS 2026 — Rapport de clôture

Période : 09 → 18 juillet 2026. Périmètre : `se-nds-2026` uniquement. Arrêté au 20/07/2026.

---

## 1. Chiffres clés

| Indicateur | Valeur |
|---|--:|
| Flashs QR enregistrés | 2 449 |
| Parties jouées | 986 |
| **Contacts uniques collectés** | **617** |
| Tickets attribués | 1 046 |
| Opt-in marketing | 338 (55 %) |
| Parrainages | 9 |

**Qualité de la base : 617 contacts, 0 sans nom, 0 sans prénom.** 8 sans email, 2 sans téléphone, 3 sans code postal. La colonne `ville` est vide sur l'ensemble : le formulaire ne collectait que le code postal.

---

## 2. Nouveaux inscrits par jour

| Jour | Nouveaux contacts |
|---|--:|
| 09/07 | 114 |
| 10/07 | 189 |
| 11/07 | 64 |
| 12–15/07 (pas de soirée) | 10 |
| 16/07 | 70 |
| 17/07 | 88 |
| 18/07 | 82 |
| **Total** | **617** |

Détail complet par station et par jour : `NDS2026_nouveaux_inscrits_par_station_par_jour.csv`.

---

## 3. Classement des stations (festival complet)

| Station | Flashs | Joueurs uniques | Parties |
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

---

## 4. Fréquentation des commerces partenaires

| Partenaire | Flashs | Personnes venues | Parties | Tickets |
|---|--:|--:|--:|--:|
| Nook Café | 49 | 7 | 8 | 9 |
| Électroménager J Giordano | 27 | 6 | 6 | 7 |
| Utile Vence | 23 | 5 | 5 | 6 |
| Assurance Charvolin | 13 | 2 | 2 | 2 |
| Domaine de la Bergerie | 11 | 1 | 1 | 1 |
| Carrosserie GP | 7 | 0 | 0 | 0 |
| Auto-École de l'ARA | 2 | 1 | 1 | 1 |
| **Total partenaires** | **132** | **22** | **23** | **26** |

**132 flashs chez les partenaires pour 22 personnes ayant effectivement joué sur place.** L'écart flash/jeu est ici très marqué : les gens scannaient devant la vitrine sans aller au bout.

---

## 5. Redirections vers les sites partenaires — NON MESURÉES

La table `partenaire_clics` est **vide (0 ligne)**. Aucune redirection (site web, Instagram, Facebook, itinéraire Maps, fiche partenaire) n'a été enregistrée sur les 10 jours.

**Diagnostic technique effectué** :
- Politique RLS présente (`flowin_anon_all_partenaire_clics`) ✅
- Droits `INSERT` accordés à `anon` ✅
- Aucune contrainte de clé étrangère bloquante ✅
- Test d'insertion réel : **réussi** ✅
- La séquence d'identité était à **7** → seulement ~6 tentatives sur tout le festival

**Conclusion** : la base acceptait parfaitement ces écritures. Le compteur n'a pas été alimenté parce que la fonction n'a quasiment jamais été déclenchée côté joueur — l'écran carte/partenaires a été atteint par 153 personnes seulement, et les fiches partenaires très peu ouvertes. Ce n'est pas une perte de données mais une **absence d'usage** de cette partie du parcours.

**Conséquence** : le ROI « redirections » ne peut pas être documenté pour cette édition. À instrumenter et à mettre en avant dans le parcours pour la prochaine.

---

## 6. Tirage au sort

Tirage reproductible (`setseed(0.20260719)`), réalisé sur les joueurs éligibles de la période.

### 6.1 Un gagnant par commerce partenaire

| Partenaire | Gagnant | Contact | Ticket |
|---|---|---|---|
| Assurance Charvolin | Roxanne Llorens | roxanne.llorens@gmail.com · 0685663291 | ND-2026-5900 |
| Auto-École de l'ARA | Marleen Geoffray | marleengeoffray@gmail.com · 0624776560 | ND-2026-3376 |
| Domaine de la Bergerie | Jean-Pierre Rousseau | jeanpierrerousseau30@yahoo.fr · 0781810248 | ND-2026-4809 |
| Électroménager J Giordano | Brice Chambrette | contact@metreaucarre.fr · 0650827817 | ND-2026-3722 |
| Nook Café | Dora Jelil | d.jil@icloud.com · 0647360971 | ND-2026-6562 |
| Utile Vence | Fabien Kaplanas | kaplanas@hotmail.com · +33685842574 | ND-2026-7635 |

**Carrosserie GP : aucun tirage possible** — 7 flashs mais 0 joueur effectif. Le lot reste à réattribuer (décision commerciale à prendre).

### 6.2 Grand tirage final — 10 gagnants (probabilité proportionnelle aux tickets)

| Rang | Gagnant | Contact | CP | Tickets |
|--:|---|---|---|--:|
| 1 | Benjamin Cinque | bcinque@orange.fr · +33686073626 | 83480 | 1 |
| 2 | Nicolas Ducray | ducray84.nicolas@gmail.com · 0781806161 | 06140 | 8 |
| 3 | Clara Aubertin | aubertin.clara1301@gmail.com · +33651009868 | 06200 | 6 |
| 4 | Isabelle Bernard | myapart75014@gmail.com · 0612226193 | 06700 | 37 |
| 5 | Catherine Pospiech | cathpospiech@gmail.com · 0635360041 | 06210 | 2 |
| 6 | Timothée Secail | timothee.secail@essca.eu · 0602506950 | 06620 | 1 |
| 7 | Mélanie Philip | melaxellerep@gmail.com · 0668015828 | 06800 | 5 |
| 8 | Marie-Line Radier | malunarobert@icloud.com · 0631029716 | 06140 | 1 |
| 9 | Nathalie Cetre | natfilfred@gmail.com · +33672342012 | 06390 | 1 |
| 10 | Yannick Ancarno | newmanpastore10@gmail.com · 0643320549 | 06410 | 1 |

Le rang 1 est le gagnant principal ; les suivants servent de suppléants ou de lots secondaires selon la dotation.

---

## 7. Anomalies corrigées pendant l'audit

| # | Anomalie | Statut |
|---|---|---|
| 1 | Station Caisse 3 absente de `events` → invisible partout | ✅ corrigé |
| 2 | Scans en fire-and-forget, perdus sous réseau saturé | ✅ corrigé |
| 3 | Compteurs `events.participants` faux de −18 % | ✅ corrigé (trigger) |
| 4 | Plafonds `limit=500` tronquant les totaux | ✅ corrigé |
| 5 | Clé d'upsert préfixée par l'événement → anciens joueurs rejetés | ✅ corrigé |
| 6 | Anti-doublon sans borne de date → habitués rejetés | ✅ corrigé |
| 7 | `visiteur_id` absent les 09–10/07 | ⚠️ non corrigeable rétroactivement |
| 8 | Marqueurs d'étape inexistants avant le 11/07 | ⚠️ non corrigeable rétroactivement |
| 9 | Redirections partenaires non mesurées (absence d'usage) | ⚠️ à instrumenter |

Les failles 5 et 6 amputaient le **rejeu** (parties et tickets des joueurs déjà connus), pas la collecte de contacts : un primo-visiteur n'était jamais bloqué. Les 617 contacts sont donc complets pour ce qui a été effectivement soumis.

---

## 8. À traiter

- Réattribuer le lot Carrosserie GP (aucun joueur éligible).
- Notifier les gagnants (bouton Gmail disponible dans `tirage-nds.html`).
- Google Sheet « backup flowin » : alimenté par un Apps Script hors dépôt, non à jour. Réimporter depuis les exports fournis.
- Instrumenter les redirections partenaires et mettre la carte en avant dans le parcours.
