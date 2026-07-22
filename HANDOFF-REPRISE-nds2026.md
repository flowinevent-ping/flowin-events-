# HANDOFF — REPRISE AUTONOME · Flowin / NDS 2026

**Dernière mise à jour : 22/07/2026.** À lire en tout début de conversation, avec le handoff Supabase (`handoff_notes`, clé `handoff-nds-2026-comm`) et la page Notion Hub.

---

## 1. ACCÈS, CLÉS, TOKENS

| Ressource | Valeur / emplacement |
|---|---|
| **Repo GitHub** | `flowinevent-ping/flowin-events-` (public). Vercel auto-deploy depuis `main`, root `/admin`. |
| **Push URL** | `https://x-access-token:<TOKEN>@github.com/flowinevent-ping/flowin-events-.git` |
| **⚠️ Token GitHub** | **EXPIRÉ (401).** En attente d'un **nouveau PAT fine-grained** de Romain (Contents lecture/écriture). Sans lui, aucun push possible — commits en local uniquement. |
| **Commit identity** | `git -c user.email=romain@flowin.events -c user.name="Romain Collin"` |
| **Supabase** | Projet `ywcqtupgoxfzkddqkztk` (eu-west-1). MCP : `execute_sql` / `apply_migration`. bash ne joint pas `*.supabase.co`. |
| **Supabase anon key** | `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1` (publique par design) |
| **Notion hub** | page `38c6dcca-9add-81dd-9af2-c93139e06393` (prepend `position:{"type":"start"}`) |
| **Handoff source de vérité** | Supabase `handoff_notes` clé `handoff-nds-2026-comm` + ce fichier + `HANDOFF-flowin-nds2026.md` |
| **Google Sheet suivi** | `https://docs.google.com/spreadsheets/d/1ALEwLsLiymhX80vgDoGaV4wKM0uUnsodLi4Ls-EX-Wc/edit` |

**Bootstrap obligatoire :** (1) vérifier git (clone+log+push test) ET Supabase (`select 1`) — si l'un manque, STOP ; (2) lire les handoffs ; (3) établir la liste FAIT / RESTE À FAIRE ; (4) 3 piliers à chaque tâche (GitHub + Supabase handoff + Notion).

---

## 2. RÈGLES EN PLACE — NE RIEN CASSER

- **Périmètre NDS** : `super_event_id='se-nds-2026'`, fenêtre 09→18/07/2026. Ne jamais mélanger avec la base joueurs globale (856) ni avec d'autres events. Un joueur venu d'un autre événement n'est PAS un doublon.
- **Il existe déjà plusieurs jeux / modules de jeu différents** rattachés à des events et à des stations de jeu. **Respecter les règles en place**, ne pas les casser. Vérifier les règles avant toute modification.
- Compteurs agrégés dérivés de la table de faits, jamais incrémentés à la main ni égaux à la longueur d'une liste paginée. Identité joueur = email. Déduplication bornée par fenêtre temporelle. Livrables imprimables autonomes (assets base64). Ne jamais modifier `SpinClient.tsx` / `QuizClient.tsx` (config via `cfg` Supabase). Validation `dashboard.html` : Python str.replace assert count==1 → Acorn ES2020 0 erreur → miroir `static/dashboard.html` MD5 identique → push.
- Places de concert (21) : **déjà livrées**, hors périmètre billets/QR.
- Cycles 963 : suspendu. Charvolin : `lots: []`, aucun tirage.

---

## 3. FICHE DE TRAVAIL — À TERMINER AVANT LE SUPER-EVENT

**Objectif : boucler tout ce bloc AVANT de s'attaquer au super-event générique.**

### 3.1 Billet gagnant (commerces uniquement — 51 lots)
- [x] Billet avec logo NDS + logo commerce, nom du billet, type de lot, conditions d'éligibilité, **QR d'identification pointant vers `lot.html?t=<retrait_token>`** — fait (`admin/public/nds/billets-partenaires.html`, commit local `3f488e5`). **Push en attente token GitHub.**
- [x] Marche à suivre commerçant (onglet dédié, 6 étapes) — fait.
- [x] Listes de caisse par commerce (case à cocher, n° billet, bénéficiaire, email, lot, signature) — fait.
- [ ] **Pousser en prod** dès réception du token GitHub.
- [ ] Intégrer le billet dans l'onglet **Communication & éléments** de chaque fiche partenaire du dashboard.
- [ ] **Génération PDF** du billet pour pièce jointe email.

### 3.2 Email gagnant
- [x] Modèle HTML avec billet inséré (logo, lot, QR, n°), étapes de retrait, liste des lots, relance 25/07, remerciements (`admin/public/nds/email-gagnant-nds.html`).
- [ ] Faire pointer le QR de l'email vers `lot.html?t=<token>` (aujourd'hui il porte un QR d'exemple).
- [ ] Câbler l'envoi réel (domaine Resend non vérifié → Gmail en attendant).

### 3.3 Modal de validation `lot.html` + STOCK (POINT CRITIQUE)
État vérifié en base :
- `lot.html` (en PROD) lit `?t=<retrait_token>`, appelle `consulter_lot` puis `valider_lot`.
- **Anti-doublon : OK.** `valider_lot` fait `update tirages set retire_at=now(), statut='retire' where retrait_token=? and retire_at is null` → un billet ne peut être validé qu'une fois.
- [ ] **DÉSTOCKAGE NON CÂBLÉ.** `valider_lot` ne touche PAS `lots_stock` → le stock (`lots_stock.utilise` / `attribue_a`) reste à 0. À câbler : à la validation, réserver/consommer une unité `lots_stock` du bon partenaire+lot, marquer `utilise=true, utilise_at=now()`, et refléter l'attribution au tirage. Unifier les 3 champs de statut de retrait (`tirages.retire_at`, `lots.retire`, `lots_stock.utilise`).
- [ ] **DOUBLE AUTHENTIFICATION NON IMPLÉMENTÉE.** `valider_lot(p_token, p_pin)` a le paramètre `p_pin` mais ne l'utilise pas. À implémenter : validation = QR du billet **+** numéro/PIN que le commerçant retrouve dans sa liste de gagnants.

### 3.4 Mail aux partenaires (liste des gagnants + billets)
- [ ] Envoyer à chaque commerce la **liste de l'ensemble de ses gagnants + les billets**, pour lui permettre de décompter les lots retirés.
- [ ] **Double authentification côté commerçant** : le billet du client **+** le numéro correspondant dans la liste de gagnants du partenaire.

### 3.5 Autres chantiers du périmètre (déjà listés, à finir)
- [ ] Afficher le compteur de réponses bonus (250 RSE / 74 Brigade Verte) — non affiché.
- [ ] Fusionner Lots & stock + Lots & Tirages + Gagnants en **un seul onglet** ; stock rattaché à chaque partenaire, pas isolé.
- [ ] Générer les CSV manquants (joueurs uniques, réponses bonus, Brigade Verte, participants) — le Google Sheet backup est piloté par un Apps Script hors accès MCP.
- [ ] Instrumenter les clics sortants (`partenaire_clics` vide).
- [ ] Analyse par station (profils + réponses) ; stats d'ensemble ; stats Brigade Verte ; rapports prestataires + service événementiel ; outils marketing futurs festivals.

### Décisions en attente Romain
Prolonger `date_f` des events partenaires (18/07) si jeu jusqu'au 25/07 · cohérence 51 tirages vs tirage 25/07 · harmoniser conditions lots (« 4 mois » vs « 25 octobre 2026 ») · email tronqué `desoutter.veronique@gmail.c` (Nook, ND-2026-7502, tél 06 80 30 80 60).

---

## 4. PHASE SUIVANTE — SUPER-EVENT GÉNÉRIQUE (après le bloc §3)

Un **super-event existe déjà** dans le menu (« Super Events », 1). Vision Romain : créer un super-event doit **dupliquer 100 % de la mécanique NDS en version neutre/à blanc** — facturation, lots, tirages, vidéos, kit, logos, règles du jeu, lecture, CRM, attribution des lots, QR, envoi d'emails — pour monter d'autres événements (Jazz à Nice, Fête du Poète) **en autonomie, sans Claude**, chaque **station de jeu rattachée à un partenaire ou un pro**, et **tout identifiable par événement**.

**Objet de cette phase : VÉRIFIER que tout ce qui a été fait dans NDS 2026 est reproductible et identifiable par événement, sans rien casser aux jeux/modules/stations déjà en place.**

État honnête aujourd'hui : **non générique.** Tout est câblé en dur sur NDS (`se-nds-2026`, `ev-nds-*`, `pt-*`, `NDS_EVENT_IDS`, libellés, listes de lots, pages `nds-lots`/`tirage-nds`/`nds-parcours`). Rendre la création d'un super-event réellement clonable est un **chantier de refonte à cadrer** — à n'attaquer qu'une fois le bloc §3 terminé.
