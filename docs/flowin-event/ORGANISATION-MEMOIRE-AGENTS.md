# Organisation des conversations, de la mémoire et des agents (25/11/2026)

But (Romain) : consommer moins de tokens, ranger l'information, éviter les croisements de règles entre espaces, préparer des automatisations. Rien n'est modifié ici : proposition + mesures. Octets mesurés sur le dépôt (`wc -c`) ; tokens = estimation (octets / 3,5 pour du français), NON mesurée.

## 1. État réel mesuré
| Mesure | Valeur | Preuve |
|---|---|---|
| Fichiers `.md` sous `docs/claude/` | 60, 357 KB (≈ 100 000 tokens si tout était lu) | `find` + `wc -c` |
| Fichiers communs (REGLES, ERREURS, ETAT, ACCES, AMELIORATIONS) | 19,4 + 21,1 + 11,7 + 5,0 + 26,9 = 84 KB | `wc -c` |
| 13 `MEMOIRE.md` | 3,5 à 14,5 KB, total 103 KB ; le plus gros : `securite-donnees` 14,5 KB / 78 lignes | `wc -c` |
| 13 `SOURCES.md` | 36 KB, chacun 20-27 lignes | `wc -c` |
| 13 définitions `.claude/agents/*.md` | 41 KB (2,6 à 3,5 KB) | `wc -c` |
| Lecture obligatoire de CET agent avant tout travail (CLAUDE.md + 5 fichiers communs + MEMOIRE + SOURCES) | 95 KB ≈ 27 000 tokens, avant même de lire le code | `cat ... | wc -c` |
| Limite « ≤ 150 lignes » | respectée en lignes mais pas en poids : lignes de 400 caractères et plus : AMELIORATIONS 32, ERREURS 10, REGLES 5, ETAT 3, MEMOIRE securite 5 | `awk 'length>400'` |
| Structure « profils + rubriques » (25/11) | existe déjà : `docs/ESSENTIEL.md` (1,8 KB), `docs/claude/univers/*.md` (9 rubriques, 0,7 à 1,9 KB), `docs/claude/kit/*.md` | `ls`, `wc -c` |

Point positif : `ESSENTIEL.md` + `univers/` (installés le 25/11) sont déjà petits et bien découpés. Le problème est que les gros fichiers communs sont encore lus en entier par les agents.

### Redondances (nombre de MEMOIRE sur 13 qui contiennent le motif)
Flow-révision : 6 ; consentement : 6 ; références `AMEL-` : 6 ; `NDS2026Client` : 4 ; `dashboard.html` : 4 ; « secret » : 4 ; Acorn : 3 ; violet : 3 ; « go de Romain / aucun envoi » : 3. Les règles critiques (CLAUDE.md 1-7) sont répétées dans CLAUDE.md, `ESSENTIEL.md`, `univers/COMMUN.md` et chaque `MEMOIRE.md` « Contraintes ».
`REGLES.md` recopie `DECISIONS-flowin-event.md` (26 KB) : colonne « source » = DEC pour ~40 lignes. Deux copies de la même décision à tenir à jour.

### Règles plates mélangées (preuves)
- Section « Code et livraison » de `REGLES.md` (lignes 71-96) contient des règles PRODUIT datées 24/11 (Super Event sur place, lots, roue, compte joueur) : lignes 89-96.
- Contradiction ouverte : ligne 110 (24/11 : style pixel art souhaité pour quiz et roue) et ligne 112 (25/11 : pixel mis de côté). Les deux sont actives dans le fichier.
- Ligne 12 : « jamais de violet » ; `docs/DESIGN-TOKENS-flowin.md` documente toujours `--fl-violet` (AMEL-DES-01 ouverte).
- Ligne 60 (Super Event : tirage piloté par Flowin) et ligne 61 (animation : le pro lance le tirage) sont deux règles de deux espaces dans la même section « Jeux » sans étiquette.

### Lignes périmées (preuves)
| Fichier | Périmé | Réalité |
|---|---|---|
| `CLAUDE.md` | « Quatre agents critiques (…, `veille-marche`) » et « Sept agents de projet » | 13 définitions : 5 critiques (dont `critique-architecture-code`), 7 de projet, `continuite-reprise` |
| `ETAT.md` ligne 1 | « dernière mise à jour : 21/11/2026 » | lignes jusqu'au 25/11 |
| `ACCES.md` / `CLAUDE.md` | région Supabase eu-west-1 | `list_projects` annonce eu-central-1 (question ouverte dans AMELIORATIONS) |
| `critique-architecture-code/MEMOIRE.md` | mesures « 21/11, commit f697f3d8 », « aucun tag avant 21/11 » | dépôt au commit 9bbc60d8 ; 56 pages SA ; monolithe 15 665 lignes |
| `ARCHITECTURE-flowin.md` | « le dashboard SA n'a pas d'authentification » (30/06) | `GardeSA.tsx`, `admin-connexion.html`, `est_super_admin()` existent |
| `SPEC-TECHNIQUE-flowin.md` §5 | policy `flowin_anon_all_joueurs` à durcir | remplacée (politiques `joueurs_*` du 20/11, lues en base 25/11) |

## 2. Matrice des règles (REGLES.md) par espace
Codes : SA = Super Admin ; PRO = Pro / Animation ; SE = Super Event ; PAR = Participant ; CO = Noyau commun. « Croisement » = ce qu'il ne faut pas appliquer à l'autre espace. N° = numéro de ligne de `REGLES.md` (25/11).
| N° | Règle (résumé) | Espace | Croisement / piège |
|---|---|---|---|
| 7 | Carrousel, une idée par écran | PAR, PRO | SA : tableaux et listes CRM restent permis (règle 102) |
| 8 | Peu de texte | PAR, PRO | idem |
| 9 | Moins d'actions jusqu'à l'acquisition | PRO, PAR | ne pas retirer un champ légal du consentement |
| 10 | Police ≥ 13 px, zones ≥ 44 px | CO | s'applique SA mobile aussi |
| 11 | Pas d'emoji | CO | le dashboard monolithe en contient encore (`🔒` ligne 6476) : non conforme |
| 12 | Bleu = Animation, orange = Super Event, pas de violet | PRO, SE | le joueur SE a l'univers comics (jaune, rouge) : pas l'orange admin |
| 13 | Cartes blanches, pas d'aplats vifs | PRO, SA | le comics SE joueur est l'exception voulue |
| 14 | Pas d'étiquette « ancienne version » sur les QR | PRO, CO | — |
| 15 | Jeux fluides, graphisme inchangé | PAR | pixel art mis de côté (112) |
| 16 | Carte gratuite, itinéraire en un geste | PAR, SE | une seule carte (91) |
| 17 | `/moi` en rubriques | PAR | — |
| 18 | Le jeu prend les couleurs du commerçant | PAR (animation) | SE joueur : univers comics, pas les couleurs d'un commerçant |
| 21 | « Valider mon bon de commande », jamais « signer » | PRO, SA | — |
| 22-26, 28-30 | Argumentaire, promesse, vocabulaire, publier | CO (supports) | pas de texte « financent » ; ne pas faire tester le jeu aux commerçants |
| 27 | Marque : Flowin Event, Animation, Super Event | CO | noms bannis |
| 31 | Pas de logo à l'inscription | PRO | — |
| 34 | Jamais de donnée inventée | CO | — |
| 35 | Genre Homme / Femme / vide | PAR, PRO | RPC `joueur_inscrire` convertit « Autre » |
| 36 | 3 cases de consentement, aucune cochée | PAR | s'applique à l'animation ET au SE (mêmes cases) |
| 37 | Vocabulaire « fichier client », « contact autorisé » | PRO, SA | — |
| 38 | Parrainage en fin de parcours | PAR | SE : +1 super ticket (`se_tickets`), animation : crédit différent |
| 39 | Données jamais vendues | CO | — |
| 42 | Pas d'e-mail ni SMS aux clients (relances seulement) | CO | « clients » = participants ; les e-mails à un pro (bon de commande) sont permis |
| 43 | Rappels de tickets 1 mois / 15 j / 48 h | PAR | NDS : pas de péremption (67) |
| 44 | Annonces des commerces dans l'application | PRO, PAR | — |
| 45 | Ne pas changer l'envoi d'e-mail sans Romain | CO | — |
| 46 | Tout envoi de prospection exige le go de Romain | SA | — |
| 47 | Pas de campagne d'acquisition | SA | — |
| 50-52 | 445 € HT, quiz 145 €, ne pas montrer l'année suivante | PRO | SE : pas de prix public (54) |
| 53 | 2 QR inclus puis 10 € HT | PRO | SE : pas de QR de suivi dans la création |
| 54 | SE : sur étude | SE, SA | — |
| 55 | Virement SEPA, `PAIEMENT_ACTIF=false` | PRO, SA | — |
| 56 | Piste 99 € non tranchée | SA | ne pas annoncer |
| 59 | Un jeu par animation ; plusieurs animations par pro | PRO | SE : un jeu pour tout le Super Event |
| 60 | SE = toujours tirage, piloté par Flowin | SE | animation : peut être gain immédiat (62) |
| 61 | Animation en tirage : le pro lance | PRO | SE : jamais le pro |
| 62 | Gain immédiat : aucun texte « tirage » | PRO, PAR | SE : textes de tirage obligatoires |
| 63 | Gain immédiat : 1 lot / joueur / jour | PRO | — |
| 64 | Un gain par joueur et par animation au tirage pro | PRO | SE : règle propre (`tirage_super_event`) |
| 65 | 1 quiz + 1 bonus / station / jour, +1 parrainage | SE, PAR | animation : cumul simple (`participations.tickets`) |
| 66 | SE en 2 phases, sauf NDS | SE | exception par identifiant : à sortir du code |
| 67 | NDS : pas de péremption | SE | ne pas étendre aux animations |
| 68 | Ticket gagnant dans le profil et l'espace pro ; scanner jsQR | PAR, PRO | — |
| 69 | Animation et station SE en parallèle | PRO, SE | gains et suivi séparés |
| 72 | Jamais de secret | CO | — |
| 73 | Miroir dashboard, Acorn 2020, `var` | SA | ne concerne PAS le Next (`admin/app`) |
| 74 | Ne jamais modifier NDS2026Client / nds2026Design | SE (NDS) | — |
| 75 | Travail en bloc ; build lu | CO | — |
| 76 | Ne pas recréer l'existant | CO | — |
| 77 | Audit, proposition, validation, exécution | CO | — |
| 78 | Confirmations de base regroupées | SA | — |
| 79 | Contrôles automatiques sans écriture | CO | — |
| 80 | Tag avant migration risquée | CO | — |
| 81 | Alerte courte de 4 lignes, pas de PDF périodique | CO | — |
| 82 | Nouvelle table : revoke par défaut | CO | — |
| 83 | SA garde tous les accès ; suppressions confirmées par Romain | SA | — |
| 84 | Clé publique non secrète ; protection par RLS | CO | — |
| 85, 86 | Nettoyage de test : préfixes ; pas prioritaire | CO | — |
| 87 | Priorités : bout en bout, ergonomie, CRM, banques | CO | sécurité passe devant seulement si elle bloque |
| 88 | `lots.quantite` baisse au retrait | PRO, SE | contrôle `tirages_depassent_lots` (rouge le 25/11) |
| 89 | SE : jouer sur place ; réglage futur | SE | animation : jeu à distance accepté (93) |
| 90 | Import fichier client : option A | PRO | — |
| 91 | Une seule carte | CO | — |
| 92 | Romain n'a pas de téléphone pour tester | CO | tout test iPhone = non vérifié |
| 93 | QR : jeu à distance accepté ; 150 m seulement sur la carte ; stats = flashs | PRO, SE | contradiction apparente avec 89 : 89 = objectif, 93 = pas de blocage serveur |
| 94 | Lots : formulaire complet obligatoire | PRO, SE | SE : lots organisateur (`se_lots`), même exigence |
| 95 | Roue : case « ticket pour le prochain tirage » | PRO | SE : pas de roue |
| 96, 106, 107 | Compte joueur sans mot de passe, rappels par défaut | PAR | — |
| 99 | Maquette validée avant tout code | CO | — |
| 100, 101 | Un event = une station d'UN pro ; stations d'infrastructure au pro organisateur | PRO, SE | — |
| 102 | Listes CRM : même présentation partout | SA, PRO | — |
| 103 | 3 chemins à ne pas fusionner : demande, duplication, création directe SA | SE, SA | ne pas fusionner dans le parcours unique (PARCOURS-CREATION.md) |
| 104 | Référentiel fonctionnel = point de référence | CO | — |
| 105 | Dashboard pro autonome ; ne pas dupliquer la logique SA | PRO, SA | — |
| 108 | Signature « Flowin, l'animation plug and play » | CO | — |
| 109 | Lot 3 validé : inscription 3 écrans, rejoindre 3 écrans, configurateur raccourci | PRO, SE | — |
| 110 | Style pixel art souhaité | PAR | REMPLACÉE par 112 |
| 111 | Plusieurs agents en parallèle, SQL appliqué par l'agent principal | CO | — |
| 112 | Pixel mis de côté | CO | annule 110 |
| 113 | Modèle produit en 4 espaces ; CRM à 2 niveaux | CO | règle racine de ce dossier |
Bilan : la majorité des lignes est commune (CO) ; les règles où une valeur d'un espace est fausse dans l'autre sont : 12, 18, 53, 59 à 67, 73, 89 à 95, 103 (colonne « Croisement »). Décompte exact non fait ; classement = jugement de l'agent, à valider par Romain.

## 3. Structure cible de la mémoire (par copie, rien supprimé)
```
docs/flowin-event/espaces/
  INDEX.md                  1 page : espace -> 3 fichiers à lire, par type de tâche
  commun/{REGLES,ERREURS,ETAT}.md       règles CO + noyau (CLAUDE.md 1-7, consentement, e-mail, design commun)
  super-admin/{REGLES,ERREURS,ETAT}.md
  pro-animation/{REGLES,ERREURS,ETAT}.md
  super-event/{REGLES,ERREURS,ETAT}.md
  participant/{REGLES,ERREURS,ETAT}.md
```
Chaque `REGLES.md` d'espace : en-tête « copie du JJ/MM/AAAA, source `docs/claude/REGLES.md` ligne N », puis les lignes de la matrice qui le concernent + un bloc « Croisements » (ce qui ne s'applique pas ici). Les `univers/*.md` actuels deviennent les « portes d'entrée » : leur section « Règles » pointe vers le fichier d'espace au lieu de recopier. Les mémoires d'agents gardent leur nom ; chacune est scindée EN COPIE en `MEMOIRE-stable.md` (contraintes, mesures) et `MEMOIRE-journal.md` (passages, historique), pour ne lire que le stable.

### Protocole de chargement minimal (3 fichiers par tâche)
| Tâche | 1 | 2 | 3 |
|---|---|---|---|
| Écran participant, jeu, ticket | `ESSENTIEL.md` | `espaces/participant/REGLES.md` | `espaces/commun/REGLES.md` |
| Espace pro, création d'animation, QR, lots | `ESSENTIEL.md` | `espaces/pro-animation/REGLES.md` | `espaces/commun/REGLES.md` |
| Super Event (création, rejoindre, tirage, carte) | `ESSENTIEL.md` | `espaces/super-event/REGLES.md` | `REGLES-ESPACES.md` (ce dossier) |
| Dashboard SA, CRM global, paiements | `ESSENTIEL.md` | `espaces/super-admin/REGLES.md` | `espaces/commun/REGLES.md` |
| Bug (n'importe où) | `espaces/<espace>/ERREURS.md` | `espaces/<espace>/ETAT.md` | `ESSENTIEL.md` |
| Sécurité, données, RLS | `univers/donnees-securite.md` | `DONNEES.md` (ce dossier) | `securite-donnees/MEMOIRE-stable.md` |
| Plan d'architecture | `ARCHITECTURE-CIBLE.md` | `ECARTS.md` | `REGLES-ESPACES.md` |
Le reste (journal, anciens audits, SOURCES, AMELIORATIONS entier) : « à la demande seulement ». Estimation : 3 fichiers de 3 à 6 KB = 10 à 15 KB (≈ 3 000 à 4 500 tokens) contre 95 KB (≈ 27 000) aujourd'hui pour l'agent critique : gain estimé de 80 % ; à MESURER après migration (non mesuré).
Règle de conversation (déjà dans `ESSENTIEL.md`) : une session = un espace ; une demande qui touche deux espaces s'ouvre dans l'espace propriétaire du code partagé, avec « voir aussi » ; l'agent principal écrit la mémoire, les agents proposent des lignes.

## 4. Automatisations : agent, déclencheur, garde-fous, mémoire lue
Existant en base (25/11) : `cron` `tickets-rappels` 09:07 UTC et `controle-qualite-quotidien` 03:17 UTC (2 tâches) ; triggers de facturation `trg_commandes_animation_facture`, `trg_factures_animation_immuable` ; 11 fonctions Edge actives.
| Automatisation | Agent propriétaire | Déclencheur | Garde-fous | Mémoire lue (3) | État |
|---|---|---|---|---|---|
| Prospection commerciale (liste `prospection` 1 952 lignes, séquences, scripts) | `marketing-prospection` | demande de Romain, ou file d'approbation (à construire) | go explicite de Romain pour tout envoi (REGLES 46) ; pas de campagne d'acquisition (47) ; plafond Gmail 450/jour ; consentement CNIL à valider (AMEL-VEI-02/04) ; aucune donnée inventée | `espaces/super-admin/REGLES.md`, `univers/prospection.md`, `CIBLES.md` | rien d'automatique : description seule (`kit/AUTOMATISATION.md`) |
| Paiements, bons, factures | `facturation-crm` | trigger base au paiement (existe) ; contrôle quotidien | `PAIEMENT_ACTIF=false` ; facture immuable (trigger) ; numéro légal depuis Jeffrey CRM NON intégré (ETAT) ; aucune facture sans validation | `espaces/super-admin/REGLES.md`, `univers/paiement.md`, `agents/facturation-crm/MEMOIRE-stable.md` | partiel : SQL en place, intégration non faite |
| Animations pour prospection (démos, visuels, animation prête par commerce) | `creation-materiel` | demande de Romain par commerce ciblé | passer par le parcours unique (PARCOURS-CREATION.md) avec `?demo=1` ou un pro de démo ; aperçu 0 écriture (`lib/apercu.ts`) ; ne jamais faire jouer le commerçant ; préfixes de test pour le nettoyage | `espaces/pro-animation/REGLES.md`, `univers/contenu.md`, `agents/creation-materiel/MEMOIRE-stable.md` | non automatisé |
| Données par profil (stockage, accès, consentement) | `securite-donnees` | cron 03:17 UTC + après chaque migration | lecture seule ; revoke par défaut ; jamais de secret ; alerte de 4 lignes seulement si rouge | `univers/donnees-securite.md`, `DONNEES.md`, `CONTROLES.md` | en place : 30 contrôles, 5 rouges le 25/11 |
| Rappels de tickets | `flux-integrations` | cron 09:07 UTC | secret Vault, en-tête `x-flowin-cron`, 1 mois / 15 j / 48 h | `espaces/participant/REGLES.md`, `agents/flux-integrations/MEMOIRE-stable.md`, `ETAT` | actif ; premier passage réel NON vérifié (ETAT) |
Trou commun : aucune file d'approbation ni registre d'automatisations en base (`kit/AUTOMATISATION.md` : « rien n'est construit »). Aucune de ces automatisations ne doit envoyer sans validation : la file d'approbation est le premier ouvrage.

## 5. Plan de migration de la mémoire (rien supprimé)
| Étape | Action | Retour arrière |
|---|---|---|
| 0 | Tag `avant-memoire` ; mesurer la taille de chargement actuelle (95 KB pour cet agent) | — |
| 1 | Créer `espaces/INDEX.md` et les 5 dossiers vides avec leur en-tête | supprimer le dossier créé |
| 2 | Copier les lignes de REGLES.md par espace d'après la matrice (§2), en gardant le numéro de ligne source ; résoudre les 2 contradictions (110/112, violet) UNIQUEMENT sur instruction de Romain | supprimer les copies |
| 3 | Copier ERREURS.md et ETAT.md par espace ; garder la ligne source | idem |
| 4 | Scinder en copie chaque MEMOIRE en stable et journal ; corriger les dates périmées dans les COPIES | idem |
| 5 | Changer le protocole de lecture dans `.claude/agents/*.md` : « lire l'index, puis 3 fichiers » ; tester sur 3 tâches réelles et comparer les tokens lus | revenir à l'ancienne liste de lecture |
| 6 | Seulement après accord de Romain : ajouter en tête des anciens fichiers la ligne « remplacé par … le JJ/MM » ; aucun contenu supprimé | retirer la ligne |
`REGLES.md` : ajout seulement d'une règle de Romain, modification sur instruction explicite (en-tête du fichier) : donc étapes 2 et 6 sont soumises à son accord.

Non vérifié : tokens réellement consommés (estimation par octets) ; classement de la matrice (jugement de l'agent, à valider) ; contenu complet des 13 `MEMOIRE.md` (lus en tailles et en motifs, pas ligne à ligne) ; si les agents lisent vraiment tout ce qui est « obligatoire » (dépend de chaque exécution).
