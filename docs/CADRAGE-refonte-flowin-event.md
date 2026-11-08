# Cadrage de la refonte Flowin Event (08/11/2026)

Une page, validée une fois par Romain. Ce sont des **variables appliquées partout**,
jamais réglées écran par écran. Source technique : `admin/public/flowin-tokens.css`
(ne pas inventer d'autre valeur). Décisions de fond : `docs/DECISIONS-flowin-event.md`.

## Publics et ton
| Public | Ton | Bouton d'action unique |
|---|---|---|
| Commerçant (Flowin Animation) | vous, concret, bénéfice d'abord | « Je crée mon jeu » |
| Commerçant station jeu (Flowin Super Event) | vous | « Je rejoins [événement] » |
| Organisateur (dont association de commerçants) | vous, résultats et suivi | « Prendre rendez-vous » (WhatsApp ou email) |
| Joueur | tu, court, joyeux | « Je joue » / « Flashe et joue » |

## Palette (jetons existants, aucune nouvelle couleur)
| Rôle | Valeur |
|---|---|
| Texte, titres | `--fl-encre` #1B3A5C |
| Fond de page | `--fl-papier` #F4F6F9 ; cartes blanches |
| Bouton principal, sélection | `--fl-violet` #7A4FE0 (texte violet lisible #5B34C2) |
| Flowin Animation (catégorie) | bleu #3B5CC4 |
| Flowin Super Event (catégorie) | orange #C2410C / #FF8A14 |
| Succès / erreur | #0B7A4F / #C62F2F, jamais décoratifs |
| Univers BD jaune/rouge | réservé au logo Super Event et aux masters joueur |

## Typographie et tailles minimales
- Police système (`--fl-police`), titres en graisse 800–900. Bangers seulement dans le logo Super Event.
- Corps de texte ≥ 15 px ; texte secondaire ≥ 13 px ; jamais en dessous de 13 px.
- Titre d'écran mobile 22–26 px ; chiffre clé 26–32 px, tabulaire.
- Zones tactiles ≥ 44 px ; bouton principal 50 px de haut, pleine largeur sur mobile.

## Composants (une seule version de chacun)
- **Bouton principal** : violet plein, pilule, 50 px. **Secondaire** : fond gris clair. **Lien** : texte, sans fond.
- États : normal, appuyé (assombri), désactivé (opacité .45), chargement (texte « … »).
- **Carte** : blanche, rayon 18 px, bordure #DCE3EC, ombre `--fl-ombre` seulement sur la carte qui compte.
- **Puce de statut** : pilule, fond clair de la couleur du statut.
- **Volet** : par le bas sur mobile, se ferme par croix, fond, Échap, Retour.
- **Pictogrammes** : traits 1.9 px, 20–24 px, jamais d'emoji.

## Règles d'écran
- Un sujet par écran, une action principale, visible sans défiler sur 390 × 844.
- Pas de texte d'aide avant qu'il soit utile ; erreurs seulement après une tentative.
- Chiffres publiés : « 56 % des participants souhaitent garder le contact » ; « plus de 70 lots
  distribués dans les commerces locaux » — mis en forme en gros chiffre lisible.

## Animations
- Transitions d'écran 200–250 ms ; apparition des cartes en fondu court ; `prefers-reduced-motion` respecté.
- Une seule animation marquante par écran (ex. QR qui apparaît en fin de création).

## Preuves exigées avant « fait »
- Captures avant/après à 360, 390 et 430 px, avec données réelles ou exemple marqué.
- Contrôles : 0 emoji, 0 ancien nom (GAMIFICATION, FLOWIN.EVENTS), prix à une seule source,
  liens valides, aucune erreur console, aucun débordement horizontal.

## Indicateurs à mesurer
1. Inscription pro terminée. 2. Première animation publiée. 3. Premier QR téléchargé ou imprimé.
4. Demande de participation à un super event envoyée.

## Proposition de grille de prix (à valider par Romain)
- Flowin Animation : 110 € HT/mois ou 990 € HT/an (déjà dans la plaquette) ; kit physique en option.
- Flowin Super Event, formules station jeu (prix par défaut en base `packs_participation`,
  ajustables par événement) : Sponsor digital 500 € HT · Partenaire digital + sur place 1 331 € HT ·
  Partenaire premium tous supports 3 331 € HT.
- Organisateur : sur étude, aucun prix affiché.
