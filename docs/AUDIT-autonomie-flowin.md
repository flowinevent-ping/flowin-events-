# Audit — peut-on aller vers l'autonomie du pro ?

_Confronté au code réel (`flowinevent-ping/flowin-events-`, HEAD origin `ccb84d5`) et à la base Supabase `ywcqtupgoxfzkddqkztk`, le 25/07/2026. Ce document décrit l'état réel, pas la cible marketing._

## Verdict en une phrase

**Oui, l'autonomie est atteignable — et on est plus près qu'il n'y paraît.** Le moteur de jeu, le modèle de données et la couche métier (RPC) supportent déjà 80 % de ce que montrent les maquettes. Ce qui manque n'est pas le socle : c'est **l'éditeur `cfg` côté pro** et surtout **la sécurité multi-compte**. Tant que ce second point n'est pas réglé, on ne peut pas ouvrir le self-service.

---

## Ce qui existe déjà (et qu'on peut réutiliser tel quel)

**Le modèle multi-pro est en place.** La table `events` a une colonne `pro_id`, 30 des 36 events y sont rattachés, 16 pros distincts sont en base (table `pros` peuplée), et un trigger `trg_event_lier_pro` relie automatiquement un event à son pro. On ne part pas de zéro sur la notion de compte.

**`cfg` (jsonb) est déjà un moteur de configuration complet.** Les events portent, dans `cfg`, tout ce que les maquettes décrivent : `quizBanques`, `quizCustomQuestions`, `quizBonusList`, `sondage`, `quizNbQuestions`, `quizTimer`, `quizSeuil` (les questions et le sondage bonus) ; `lotNom`, `lotDesc`, `lotsPartenaires`, `tirage`, `tirageDate`, `tirageHeure` (les lots et le mode de tirage) ; `qrUrl`, `modules`, `branding`, `accent`, `theme`, `optinActif`. Les jeux (`SpinClient`, `QuizClient`, `NDS2026Client`) lisent déjà cette config. **Rendre le pro autonome sur les questions/lots/règles = lui donner une interface pour éditer `cfg`. La donnée est déjà là.**

**La couche métier (RPC) est riche.** Existent déjà : `retirer_gagnant`, `valider_lot(token, pin)`, `consulter_lot(token)`, `attribuer_lot`, `tirage_lot`, `dupliquer_super_event`, `flowin_export_pros`, plus toute la batterie de stats super-event (`super_event_chiffres`, `_demographie`, `_funnel`, `_track_qr`…). La validation des gagnants et le décompte existent côté base.

**Le dashboard Next.js est structuré comme les maquettes.** Les routes existent déjà : `/dashboard/jeux`, `/gagnants`, `/events`, `/super-events`, `/joueurs`, `/operations`, plus `/pro`, `/rejoindre/[se]`, `/sponsor/[se]`. L'écran « choix des jeux » liste les 6 modules. L'`EventDrawer` sait déjà écrire (`upsertEvent`), le `JoueurDrawer` aussi (`updateJoueur`). Le CRM et l'export sont câblés.

---

## Les trois vrais blocages

### 1. 🔴 Sécurité — c'est LE bloqueur, pas un détail

Tout le dashboard, **lectures et écritures comprises**, utilise la **clé anon publique**, sans aucune authentification. La sécurité repose donc entièrement sur le RLS. Or les policies actuelles sont ouvertes :

- `events` : policy `ALL` pour `public` avec `USING(true) / CHECK(true)` → **quiconque a la clé anon (publique par design) peut créer, modifier ou supprimer n'importe quel event.**
- `lots`, `lots_stock`, `super_events` : même chose, `ALL public true`.
- `joueurs` : anon peut insérer/lire/**modifier** (l'insert est normal pour le jeu ; l'update ouvert l'est moins).
- `tirages` : réservé à `authenticated` — mais **personne ne s'authentifie jamais** (le dashboard est en anon), donc le décompte des gagnants ne passe pas par le dashboard actuel.

**Conséquence directe :** on ne peut pas ouvrir le dashboard au self-service en l'état. Le jour où un pro accède à « son » dashboard avec la clé anon, il accède à **tous** les events de **tous** les pros. La colonne `pro_id` existe mais **le RLS ne s'en sert pas**.

C'est le chantier n°1, et il est incontournable avant toute ouverture. Il suppose : une vraie authentification (Supabase Auth), un lien `pro ↔ auth.uid`, et une réécriture des policies en `pro_id = compte courant` au lieu de `true`.

### 2. 🟠 L'éditeur `cfg` n'existe pas encore

L'`EventDrawer` actuel édite le **méta** de l'event (nom, statut, dates, lieu, couleur, description) mais **pas `cfg`**. Donc aujourd'hui, choisir/modifier les questions, poser les lots, régler la roue, activer le sondage bonus — tout ça se fait encore à la main (par nous, en SQL/mémoire), pas par le pro. Les onglets Lots/QR/Export du drawer sont en lecture.

C'est le chantier n°2 : un éditeur de `cfg` par module (un formulaire questions, un formulaire lots+stock, un bloc période+règles). La bonne nouvelle : pas de nouveau modèle de données à inventer, on édite un jsonb déjà consommé par les jeux. La règle mémoire « ne jamais modifier `SpinClient`/`QuizClient`, tout passe par `cfg` » va exactement dans ce sens.

### 3. 🟡 Incohérences de données à unifier avant d'ouvrir

Deux dettes connues qui deviennent bloquantes en self-service :
- Le retrait d'un lot est tracé dans **trois champs** en parallèle (`tirages.retire_at`, `lots.retire`, `lots_stock.utilise`). En usage interne on s'en sort ; ouvert à des pros, ça produira des états incohérents. À unifier dans une seule RPC de vérité.
- La période du jeu (`date_debut`/`date_fin`) n'est pas une colonne d'`events` : elle vit dans `cfg` (`tirageDate`, `datesLabel`) de façon non normalisée. Pour un réglage « période » propre côté pro, il faut normaliser où vivent les dates d'effectivité.

---

## Chemin réaliste vers l'autonomie (ordre imposé par les dépendances)

1. **Authentification + RLS par compte** (chantier n°1). Rien ne s'ouvre avant. Supabase Auth, `pro ↔ auth.uid`, policies `pro_id = auth.uid()`. Séparer aussi une clé de service pour nos usages admin de la clé anon des pros.
2. **Unifier la vérité de retrait de lot** en une RPC, et normaliser la période. Dette technique n°3, à solder avant d'exposer gagnants + période.
3. **Éditeur `cfg` côté pro** (chantier n°2), module par module : questions & bonus, lots & stock, période & règles. C'est là que les 7 maquettes du dashboard deviennent des vraies vues.
4. **Self-service publication + QR** : bouton « lancer », génération du QR par canal (l'`qrUrl` existe déjà dans `cfg`), création d'un nouvel event pré-rempli avec les coordonnées du pro (le trigger `trg_event_lier_pro` fait déjà le rattachement).
5. **Intégration Super Event (payante)** : `dupliquer_super_event` et la composition existent ; reste le rattachement d'un pro à un super + le modèle éco (bandeau, map, liste partenaires) — et le paiement, non modélisé aujourd'hui.

## Ce que ça veut dire concrètement

On n'a pas à reconstruire Flowin pour le rendre autonome. Le moteur est là. Le travail est : **(1) fermer la sécurité** — non négociable, sinon on expose les données de tous les pros —, **(2) construire l'éditeur `cfg`**, **(3) solder deux dettes de données**. Les maquettes produites cette semaine ne sont pas décoratives : elles sont la spec fonctionnelle exacte de l'étape 3.

_Chiffres réels au moment de l'audit : 36 events, 30 rattachés à un pro, 16 pros en base. Toutes les tables ont le RLS actif ; le problème n'est pas l'absence de RLS mais des policies en `true`._
