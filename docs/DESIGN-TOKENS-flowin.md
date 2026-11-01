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

## Logo « Super event »

Fichier partagé : `admin/public/flowin-super-event-logo.svg` (texte converti en tracés, aucune police à charger, `role="img"` et `aria-label="Super event"`).
C'est le composant `LogoSuperEvent` de l'application (`admin/components/masters/SelecteurLot.tsx`) converti à l'identique : « SUPER » en Bangers jaune #FFD23F,
contour #1B3A5C (.06 em, tracé sous le remplissage), extrusion rouge #E2231A (.035 et .07 em), espacement .05 em ; « EVENT » en Bangers #1B3A5C à 82 % de la taille,
tourné de -4°, sur la même ligne. Dans une page : copier le `<symbol id="fl-super-event">` des plaquettes puis
`<svg class="sel" role="img" aria-label="Super event" viewBox="0 0 437.4 92.6"><use href="#fl-super-event"/></svg>`
(le viewBox de l'élément commence à 0 0 ; celui du symbole est celui du fichier), ou `<img src="/flowin-super-event-logo.svg" alt="Super event" width="280">`.
