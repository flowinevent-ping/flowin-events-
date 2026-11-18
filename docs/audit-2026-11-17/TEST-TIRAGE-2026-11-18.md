# Test de bout en bout du tirage au sort (18/11/2026)

Pour Romain. Parcours testé : tickets de tirage → tirage (pro manuel, SA super event, programmé) → gagnants
(règles) → affichage pro / SA / joueur → relance → validation en caisse (PIN) et déstockage.

## Sécurité du test : rien n'est écrit en base
- Base : chaque scénario tourne dans **un seul bloc `DO` qui se termine par `raise exception`**. L'exception annule
  toute la transaction (joueurs fictifs `Zztest… @example.invalid`, lots `zz-…`, commerce `zz-part-sim`, gagnants,
  validation). Seul effet : les compteurs d'identifiants de `tirages` ont avancé (ids 270-272 consommés, aucune ligne).
- Animation utilisée : `ev-demo-tombola` (démo, 0 joueur, 0 lot, 0 gagnant au départ).
- Écran : build de production local, téléphone 390 x 844, `?demo=1`, toute requête non-GET vers supabase.co
  interceptée et bloquée : **0 écriture** sur les 5 pages.

## Ce qui existe en prod (lecture des définitions, 18/11)
| Brique | État prod |
|---|---|
| Tirage pro manuel (Gagnants & tirage, `GagnantsClient` → `attribuer_gain_joueur`) | en place |
| Tirage SA super event (`TirageSuperEvent` → `tirage_super_event`) | en place |
| Tirage NDS (`tirage_lot`, `tirage_soir`, `tirage-nds.html`) | en place |
| **Tirage programmé** `tirage_auto_animations()` + job pg_cron | **absent** (fichier 01/11 non appliqué ; pg_cron est maintenant installé) |
| **Résultats par participant** `tirage_resultats` + e-mail « pas tiré » (`sql/10-resultats-tirage.sql`) | **absent** |
| Liste publique `liste_gagnants_publique` (/gagnants/[evId]) | **absente** (la page affiche « indisponible ») |
| Caisse `valider_lot` (PIN) | en place, contrôle SA ou PIN commerce |

## Résultats (preuves : sortie brute des simulations)
```
A anon attribuer_gain_joueur: id=270 statut=actif token=true valable=null
B gagnants Lot simu (quantite 2) = 3, dont joueur1 = 2
C date_limite_tirage = null
D valider_lot PIN 0000 = {"ok": false, "raison": "pin_requis", "message": "Aucun commerce rattache a ce billet : validation par l'equipe Flowin."} | PIN vide = {"ok": false, "raison": "pin_requis", ...}
E anon annuler_tirage -> statut = annule
F billet_par_token = {"etat": "confirme", "lot_nom": "Lot simu", ... "joueur_email": "zztest2@example.invalid", ...}
G passages effectifs sur 2 lancements = 1 ; gagnants par lot = Lot A:2, Lot B:2 ; max gains par joueur = 1 ; joueurs gagnants distincts = 4
H1 PIN faux = pin_invalide | H2 PIN bon = {"ok": true, "lot": "Lot A", "raison": "valide", "destocke": true, "stock_restant": 1, ...} | H3 seconde validation = deja_utilise
H4 retire_at pose = true ; stock Lot A utilise = 1/2
I NDS valable_jusqu_au = null ; date_limite_tirage = null
```
G = copie fidèle de `tirage_auto_animations()` (sans appel HTTP) exécutée deux fois : un seul passage (idempotent),
quantités respectées, un gain par joueur, le joueur déjà gagnant avant le tirage n'est pas retiré.

| Étape | Résultat |
|---|---|
| Tirage programmé (logique du fichier) | OK en simulation ; **non déployé en prod** |
| Tirage pro manuel | OK, mais pas de garde en base (B) ; corrigé à l'écran (voir Correctifs) |
| Caisse : PIN faux / bon / 2e scan | OK : refus, validation + `retire_at` + déstockage 1 code, puis « déjà utilisé » |
| Exception NDS sans date limite | OK : `valable_jusqu_au` et `date_limite_tirage` nuls pour se-nds-2026 |
| Billet joueur (`billet_par_token`) | OK, état « confirme », jeton de retrait présent |
| Écrans démo : /pro/donnees (Gagnants & tirage), /pro/tirage, /dashboard/gagnants, /moi, /gagnants/ev-demo-tombola | 0 écriture, 0 erreur JS |

## Risques
1. **Bloquant sécurité** : `attribuer_gain_joueur`, `tirage_super_event`, `annuler_tirage`, `marquer_notifie`,
   `tirage_lot`, `tirage_soir` sont exécutables par **anon** sans contrôle (A, E) : n'importe qui avec la clé publique
   peut créer un billet gagnant valable ou annuler un gagnant.
2. **Pas de garde en base** sur la quantité ni sur « un gain par joueur » pour le tirage pro (B) : deux onglets ou un
   double envoi dépassent le lot. `tirage_super_event` n'est pas verrouillé non plus (deux SA simultanés).
3. **Nom du lot incohérent** : `tirage_super_event` écrit `lots.titre` d'abord, l'écran pro compte par `lots.nom` :
   si les deux diffèrent, le « restant » affiché est faux.
4. **Tirage programmé absent** en prod : un pro qui choisit « auto » dans `ReglageTirage` n'aura **aucun tirage**.
5. **« Terminer le tirage »** promet « chaque participant verra son résultat … e-mail de service » : en prod il ne fait
   que poser `cfg.tirage.fait_le` (table `tirage_resultats` absente). Rien n'est envoyé aux non-gagnants.
6. Aléa : `Math.random()` côté navigateur (pro) et `random()` SQL : suffisant pour une animation, non vérifiable
   (pas de graine ni de journal du tirage). Égalités : sans objet (tirage uniforme ; SE pondéré par tickets).
7. Billet sans commerce (`partenaire_id` nul, cas « Lot — nom de l'animation ») : refusé en caisse par PIN (D),
   validation par l'équipe Flowin seulement.
8. Test UI incomplet : le pro de démo (`pro-qa-tech-1`) n'a aucune animation, le bloc « Lancer le tirage » n'apparaît
   pas en démo ; /dashboard/gagnants demande une session SA. La logique a été vérifiée en base (ci-dessus).

## Correctifs
Code (vérifié : `tsc` OK, build « Compiled successfully ») :
- `admin/components/pro/GagnantsClient.tsx` + `admin/lib/operations.ts` : le tirage pro **n'inclut plus les joueurs
  déjà gagnants** de l'animation (même règle que le tirage programmé et le tirage SE) ; message clair si tout le vivier
  a déjà gagné.
- `admin/app/pro/tirage/page.tsx` : la redirection perdait `demo=1` (vérifié : 307 vers
  `/pro/donnees?demo=1&onglet=gagnants`).

Base (écrit, **non appliqué**) : `sql/2026-11-18-tirage-correctifs.sql`
1. retrait des droits anon sur les fonctions d'écriture du tirage (risque 1) ;
2. `attribuer_gain_joueur` : un gain par joueur et par animation / super event, quantité du lot, verrou (risque 2) —
   **à trancher** : la fonction sert aussi aux gains immédiats (`appliquer_regle_gain`) ;
3. `tirage_super_event` : verrou par lot et nom de lot aligné (risques 2 et 3).

À décider : déployer le tirage programmé (sections 6-7 du fichier 01/11, clé anon à poser) et `10-resultats-tirage.sql`,
ou retirer le choix « auto » et la promesse d'e-mail tant que ce n'est pas fait.
