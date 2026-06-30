# PROMPT — AUDIT END-TO-END FLOWIN v28

## Mission

Auditer l'application Flowin de bout en bout : **SA → PRO → joueur**, sur **tous les modules** (quiz, quiz solo, spin, tombola, vote, stand-up, quiz master) et **tous les types d'events** (simple, multi-jeux, super event).

Le scope inclut :
- Le **dashboard SA** (`admin/index.html`) — création, pilotage, clôture
- Le **dashboard PRO** (`pro_mobile_v4.html`) — vue scopée
- Les **parcours joueurs** (`parcours/parcours_quiz_paques_vence.html`, `parcours_quiz_nds_2026.html`)
- La **landing B2B** (`landing/index.html`)
- Le **schema SQL** (`sql/FINAL_CONSOLIDATED.sql`)

L'audit se fait **statiquement** (lecture de code, cohérence fonctions/données, validation syntaxe), pas via navigateur.

## Scénarios à dérouler

### Scénario A — Event simple avec quiz + bonus

**Cycle complet :**
1. SA crée un pro (Mairie Cannes)
2. SA crée un event Quiz 3 jours (08-10 août) avec bonus actif (frequence, ambiance, retour) et customQuestions (decouverte)
3. SA crée 3 partenaires (NDS, Isola, Taxi)
4. SA crée 3 lots (1 par partenaire, attachés à l'event)
5. SA crée une banque de 5 questions QCM
6. SA génère le QR
7. Event passe en LIVE
8. 3 joueurs scannent → remplissent formulaire CRM → jouent au quiz → répondent bonus + custom → opt-in
9. Pendant LIVE : PRO voit en temps réel participants, opt-in, KPIs
10. Event passe en PAST
11. SA effectue le tirage au sort (3 gagnants)
12. PRO voit ses gagnants, peut exporter CSV
13. Joueurs voient leur lot gagné

**À vérifier :**
- Chaque étape écrit-elle dans la bonne table ?
- Les KPIs sont-ils cohérents (participations vs joueurs vs opt-in vs gagnants) ?
- Le QR pointe-t-il vers la bonne URL ?
- Les RLS permettent-elles au PRO de voir uniquement ses données ?
- Les hooks `supaWrite*` sont-ils tous appelés ?
- Les cfg JSONB (bonus, custom, scoreMin) sont-ils stockés et relus correctement ?

### Scénario B — Multi-jeux sur un même event (quiz + spin + tombola)

**Cycle complet :**
1. SA crée un pro
2. SA crée 3 events séparés (quiz, spin, tombola) — même date, même lieu, mais 3 QR distincts
3. Joueur scanne quiz → joue
4. Même joueur scanne spin → joue
5. Même joueur scanne tombola → joue
6. SA voit le joueur listé dans les 3 events
7. Tirage indépendant pour chaque event

**À vérifier :**
- `joueurs.events[]` contient bien les 3 event_id
- Anti-doublon par event (un joueur ne joue qu'1 fois par event)
- Stats par event isolées
- Vue "tous les joueurs" du SA dédoublonne correctement
- Si on supprime un event, les autres restent fonctionnels

### Scénario C — Super Event 5 pros Riviera

**Cycle complet :**
1. SA crée 5 pros (Cannes, Antibes, Grasse, Nice, Mougins)
2. SA crée 5 events (1 par pro, modules variés)
3. SA crée 1 super_event qui groupe les 5 events
4. Chaque event a son propre QR
5. Joueurs scannent chez chaque pro
6. PRO de Cannes voit ses participants mais pas ceux des autres villes
7. SA voit les stats agrégées du super event (carte 5 villes)

**À vérifier :**
- `super_events.pros[]` et `super_events.events[]` cohérents
- `events.super_event_id` rétro-lié
- RLS PRO scope correctement (Cannes ne voit que Cannes)
- Vue agrégée SA (sum participations sur tous events du SE)
- Carte 5 villes affichable

### Scénario D — Vote étoiles concerts

**Cycle complet :**
1. SA crée event vote 1 jour
2. SA configure 3 choix (Rock, Jazz, Pop)
3. SA active mode étoiles 1-5
4. SA configure résultats live
5. 9 joueurs votent (3 par concert) avec notes 4-5
6. PRO voit résultats en temps réel
7. Fin event : SA voit classement définitif

**À vérifier :**
- `events.cfg.voteChoix[]` JSONB structuré correctement
- `events.cfg.voteMode = 'stars'`
- INSERT votes (event_id, joueur_id, cible_id, cible_type, note)
- Agrégation note moyenne par cible_id
- RLS votes correcte

### Scénario E — Stand-up vote progressif comédiens

**Cycle complet :**
1. SA crée event stand-up
2. SA configure 2 comédiens (avec couleurs)
3. SA active comédien 1 → joueurs votent étoiles
4. SA active comédien 2 (joueurs reviennent voter)
5. Classement live entre les 2

**À vérifier :**
- `events.cfg.standupComediens[]` JSONB
- Mécanisme d'activation séquentielle
- Re-vote autorisé par cible_id différent
- Anti-spam : un joueur = un vote par comédien

### Scénario F — Quiz Master (animateur scène)

**Cycle complet :**
1. SA crée event quizmaster
2. SA configure 8 questions + timer 15s
3. Animateur déclenche question par question
4. Joueurs répondent en simultané
5. Score final affiché en direct

**À vérifier :**
- `events.cfg.quizmaster*` settings
- Synchronisation animateur ↔ joueurs (mécanisme actuel ou manquant ?)
- Score stocké en `participations.score`

### Scénario G — Edge cases & robustesse

- Joueur essaie de jouer 2× au même event → doit être bloqué
- Joueur joue sans opt-in → données stockées mais `optin=false`
- Event sans pro_id → comportement défini ?
- Lot sans partenaire → autorisé ou bloqué ?
- Tirage sans joueurs → message clair ?
- Tirage avec moins de joueurs que de lots → comportement ?
- Suppression d'un event qui a des lots/joueurs → cascade ou refus ?
- Modification d'un event après début (LIVE) → autorisée ou figée ?

## Méthodologie d'audit

Pour **chaque scénario** :

1. **Identifier les fonctions JS impliquées** (création, lecture, écriture, suppression)
2. **Lister les tables/colonnes** touchées à chaque étape
3. **Vérifier les écritures** via les fonctions `supaWrite*`
4. **Vérifier les lectures** via les requêtes vers Supabase
5. **Vérifier les RLS** (SA vs PRO vs anon)
6. **Vérifier les KPIs** (cohérence numérique : participations vs joueurs vs gagnants)
7. **Identifier les bugs** (boutons sans handler, modaux non gérés, champs manquants, FK orphelines)
8. **Lister les manques fonctionnels** (mécaniques absentes du code)

## Format du rapport

```
Scénario X — [titre]
─────────────────────
ÉTAPES OK : [liste]
BUGS DÉTECTÉS :
  · [description] → [fichier:ligne] → [fix proposé]
MANQUES :
  · [description] → [priorité]
```

À la fin, livrer :
- Liste consolidée des bugs (avec priorité critique/moyen/faible)
- Liste consolidée des manques (avec impact métier)
- Corrections appliquées (en code, en SQL)
- Patch SQL final si schema doit évoluer

## Contraintes

- **Ne pas modifier** le code de production sans le marquer
- **Préserver** les données prod (`ev-paques`, `ev-nds`, `pro-vence`)
- **Tester** chaque correction (acorn JS check, validation SQL)
- **Reporter** au format markdown structuré

