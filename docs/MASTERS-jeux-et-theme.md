# Masters de jeux et thème Flowin — référence commune

Référence à reprendre **à l'identique** par le dashboard Super Admin et l'espace pro.
Le design de référence est celui du parcours joueur `/jouer` (maquettes validées par Romain,
« C'est très bien, excellent »).

## 1. Tokens de thème — fichier unique

`admin/public/flowin-theme.css` (servi à `/flowin-theme.css`) : variables CSS `--fl-*` sur `:root`.

| Rôle | Variable | Valeur |
|---|---|---|
| **Accent commun** (boutons principaux, pilule Plug & Play) — *une ligne pour rebasculer* | `--fl-accent` | `#7A4FE0` (violet) |
| Texte sur accent | `--fl-accent-ink` | `#FFFFFF` |
| Fond d'accent doux | `--fl-accent-soft` | `#F0EAFD` |
| Touche ponctuelle (jamais avec du noir) | `--fl-touche` | `#E0368C` |
| Encre (titres, texte) | `--fl-ink` | `#1B3A5C` |
| Texte secondaire | `--fl-muted` | `#5a6b80` |
| Bleu (logo « in », liens) | `--fl-blue` | `#3B5CC4` |
| Papier (fond d'écran) | `--fl-paper` | `#F4F6F9` |
| Filets / bordures | `--fl-line` / `--fl-field` | `#DCE3EC` / `#C9D4E3` |
| Succès / erreur | `--fl-ok` / `--fl-ko` | `#00897A` / `#C62F2F` |
| Police | `--fl-font` | système (-apple-system, Segoe UI, Roboto) ; titres en 900 |
| Identité Quiz / Quiz solo / Roue / Tombola / Vote | `--fl-quiz` `--fl-solo` `--fl-spin` `--fl-tombola` `--fl-vote` (+ `-ink`, `-soft`, `-2`) | `#3B5CC4` `#8E3B6E` `#13A89E` `#0B9E6E` `#3A6FD8` |
| Scène de jeu du quiz (seul fond sombre autorisé) | `--fl-stage-1/2/3` | `#1B3A5C → #284C86 → #3B5CC4` |
| Univers comics Super event | `--fl-super-jaune` `--fl-super-rouge` `--fl-super-bleu` | `#FFD23F` `#E2231A` `#2B5FD9` |

Règles : aucun fond sombre hors scène du quiz ; fuchsia en touche seulement ; pas de teal en accent
commun (les couleurs d'identité des jeux restent).

Utilisation : `<link rel="stylesheet" href="/flowin-theme.css">` puis `var(--fl-accent)` etc.
Les écrans de jeu (`admin/lib/masters/css.ts`, généré depuis la maquette) n'utilisent que ces variables.

## 2. Composants partagés (classes de `admin/lib/masters/css.ts`)

| Composant | Classe / fonction | Emplacement et règle |
|---|---|---|
| **Bandeau « Nos partenaires »** (logos défilants) | `.pband.bas` — `pband()` + `placerBandeau()` dans `lib/masters/engine.ts` | **EN BAS** : dans le pied (sous le bouton principal) ou dans le dock (au-dessus de la barre de navigation). Clic = page Partenaires en vignettes. Absent si aucun partenaire. |
| En-tête commerce | `.hdr .brand .mono` — `hdr()` | Logo (ou monogramme) + nom + « Jeu · Jeu gratuit », bouton Profil à droite. Avec titre : bouton **Retour** à gauche (toujours visible). |
| Bouton principal | `.btn` (fond `--fl-accent`, 60 px, pilule) ; secondaire `.btn.line` ; lien `.lnk` | Dans `.foot` (pied collant) ou `.dock .cta`. |
| Carte | `.card` (blanc, filet 1,5 px, rayon 24) | Cartes cerclées : lots `.gain`, comment jouer `.howto`, infos `.infobox`. |
| Pastille de lot | `.glyph.g-produit / g-remise / g-bon / g-service / g-ticket` | « 20 € », « 1 panier »… |
| Étiquettes | `.tag.imm` (gain immédiat), `.tag.tir` (tirage), `.tag.dist` | |
| Curseur d'étapes | `.etapes` — `etapes(i)` | Jouer → Résultat → Mon ticket. |
| Barre de navigation | `.dock .nav` | Jouer · Commerces · Partenaires · Profil. |
| Typo | `.kicker` (12 px, capitales espacées), `.big` (48 px, 900, capitales), `.h2` (31 px, 900), `.sub` | |

## 3. Masters de jeux

- Code : `admin/lib/masters/` (`defs.ts` valeurs par défaut, `resolve.ts` cascade, `engine.ts` écrans,
  `css.ts` styles), page joueur `admin/app/jouer/`.
- Une animation sur master porte `events.cfg.master = { id, perso }` et `events.cfg.achat = { obligatoire, montantMin }`.
- **Règle (à confirmer par Romain)** : modifier un master (écran SA « Masters de jeux », table
  `jeux_masters`) met à jour toutes les animations qui l'utilisent, **sauf** les champs qu'elles ont
  personnalisés. Cascade à l'affichage : code → Super Admin → personnalisation → données réelles (lots,
  questions, cases, candidats, logo, date du tirage).
- Parcours : … résultat → **parrainage** → coordonnées → « Valider et recevoir mon gain » → ticket / billet.
- Navigation : chaque écran est une entrée d'historique (retour navigateur = écran précédent, sans
  rechargement), état de la partie conservé (sessionStorage), bouton Retour toujours visible.
- Aperçu identique SA / pro : les deux affichent le même `/jouer` (iframe téléphone), donc les mêmes
  écrans issus des mêmes masters.
