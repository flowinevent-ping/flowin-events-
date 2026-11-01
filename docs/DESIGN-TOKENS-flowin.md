# Jetons de design Flowin

Source : `admin/public/flowin-tokens.css`, chargé par la plaquette Animation magasin, le bon de commande,
les CGV et la vue SA « Commandes Animation magasin ». Le dashboard SA et l'espace pro peuvent le charger
tel quel (`<link rel="stylesheet" href="/flowin-tokens.css">`) puis pointer leurs variables dessus.

| Jeton | Valeur | Usage |
|---|---|---|
| `--fl-encre` | #1B3A5C | texte principal, titres |
| `--fl-encre-nuit` | #0E1B30 | en-tête et tiroir (navy, comme la landing) |
| `--fl-bleu` | #3B5CC4 | couleur dominante, « in » du logo sur fond clair |
| `--fl-bleu-clair` | #E3E9F8 | fonds de section, pastilles |
| `--fl-bleu-doux` | #8DA2EC | « in » du logo sur fond navy |
| `--fl-violet` | #7A4FE0 | accent : boutons, sélection, pilule Plug & Play |
| `--fl-violet-texte` | #5B34C2 | violet lisible sur fond clair |
| `--fl-violet-clair` | #EEE8FC | fonds de sélection |
| `--fl-fuchsia` | #E0368C | touche ponctuelle seulement, jamais associée à du noir |
| `--fl-papier` | #F4F6F9 | fond de page |
| `--fl-texte-2` | #5a6b80 | texte secondaire |
| `--fl-trait` / `--fl-champ` | #DCE3EC / #CBD5E2 | bordures, champs |
| `--fl-ok` / `--fl-ko` | #0B7A4F / #C62F2F | retours de quiz, succès, erreurs (seuls verts/rouges autorisés) |
| `--fl-rayon` / `--fl-rayon-s` / `--fl-pilule` | 18px / 12px / 100px | cartes, champs, boutons |
| `--fl-ombre` | 0 14px 32px -22px rgba(27,58,92,.5) | cartes |
| `--fl-police` | police système, graisses 800–900 pour les titres | tout |

Règles : pas de vert/teal hors retours, pas de fond noir, logo « Flow » + « in » bleu.
L'univers comics jaune/rouge (Bangers, #FFD23F, #E2231A, #3B2418) reste réservé au Super event.
