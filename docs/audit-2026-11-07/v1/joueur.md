# Audit sévère — Parcours JOUEUR — Flowin Events (Nuits du Sud 2026)

Auditeur externe, point de vue festivalier qui scanne un QR pour la première fois sur son téléphone (mobile 390×844 prioritaire, Chromium/playwright-core, `/opt/pw-browsers/chromium`). Chaque constat est preuve à l'appui (code, capture, requête SQL lecture seule sur `ywcqtupgoxfzkddqkztk`). Aucune écriture en base, aucun fichier modifié.

**⚠️ Découverte qui reconfigure tout l'audit** (voir section 0) : les 6 fichiers « standalone » du parcours joueur (`QuizClient.tsx`, `QuizsoloClient.tsx`, `SpinClient.tsx`, `TombolaClient.tsx`, `VoteClient.tsx` + les composants partagés `ParcoursBranding.tsx`, `ParcoursHero.tsx`, `ParcoursChampsStandard.tsx`) sont **du code mort en production actuelle** : toute URL `/parcours/<module>?ev=…` redirige systématiquement vers `/jouer` (moteur `lib/masters/engine.ts`) dès que l'event n'a pas `cfg.masterOff = true` — **et aucun des événements en base n'a ce flag** (requête SQL ci-dessous : 0 ligne). Le vrai parcours joueur pour 5 des 6 modules n'est donc plus celui que ces fichiers dessinent, et une partie significative de l'audit a dû être reprise une fois ce fait établi.

---

## 0. Architecture réelle du parcours joueur (preuve)

- Redirection : `admin/lib/masters/redirection.ts`, fonction `versMasterSiBesoin()` (lignes 14-26) : pour tout module « master » (quiz, quizsolo, spin, tombola, vote — pas quizmaster, pas nds2026, cf. commentaire ligne 1-9), toute requête sur `/parcours/<module>?ev=…` fait un `redirect('/jouer?ev=…')`, **y compris en `?preview=1`** (seul `?apercu=` ou `cfg.masterOff===true` l'évitent).
- Preuve base réelle (lecture seule) :
  ```sql
  select id, module, cfg->>'masterOff' from events where cfg->>'masterOff' = 'true';
  -- résultat : 0 ligne
  ```
  → **aucun event réel n'échappe à la redirection**. `QuizClient.tsx`, `TombolaClient.tsx`, `VoteClient.tsx`, `SpinClient.tsx`, `QuizsoloClient.tsx`, `ParcoursLogo`/`FlowinBadge` (`components/parcours/ParcoursBranding.tsx`), `ParcoursHero.tsx`, `ParcoursChampsStandard.tsx` ne sont donc **jamais rendus** pour un vrai joueur aujourd'hui, sur aucun event de la base.
- Le vrai moteur est `admin/lib/masters/engine.ts` (812 lignes, un template-HTML-string par écran, ~47 écrans `S['...']`) + `admin/app/jouer/JouerClient.tsx` (518 lignes).
- `nds2026` (le jeu réellement utilisé par les 22 stations NDS 2026 en base, `module:'nds2026'` sur 100 % des events `super_event_id = 'se-nds-2026'`) et `quizmaster` sont **exclus** de cette redirection (commentaire explicite ligne 9 de `redirection.ts`) : ce sont les deux seuls modules où le code lu correspond à ce qu'un vrai joueur voit.

**Conséquence pour la suite du rapport** : les constats sur `QuizClient.tsx`/`TombolaClient.tsx`/etc. sont gardés (preuve de code + capture) mais requalifiés **« code mort, sans impact joueur actuel, risque de maintenance »**, distincts des constats sur `/jouer` + `lib/masters/engine.ts` (le vrai parcours, noté « réel » ci-dessous) et sur `NDS2026Client.tsx`/`QuizmasterClient.tsx` (réels aussi).

Un test live complet de `/jouer` a été tenté (captures avant 15h passées, cf. §9) mais le serveur dev partagé est tombé en erreur 500 persistante en cours de session (`Cannot find module './1682.js'`, cache webpack de `.next/server/app/dashboard/nds-front/page.js` — erreur de build, pas liée au parcours joueur, probablement provoquée par un autre agent travaillant en parallèle sur ce même serveur, cf. consigne de l'environnement). Les écrans de `/jouer` ont donc été audités **sur le code source** (citations exactes ci-dessous), pas tous en rendu live.

---

## 1. Notes par axe

| Axe | /10 | Constat principal |
|---|---|---|
| Design | 5 | Flagship NDS2026 soigné (photo réelle, confetti, ticket intégré) ; mais sponsor en vert/teal interdit, avatar Tombola (code mort) en vert interdit, 6 modules de fait génériques |
| Ergonomie | 4 | Valeurs « Sexe » divergentes entre les deux systèmes vivants (`H`/`F` vs `Homme`/`Femme`), labels non reliés en `for`/`id` dans le code encore importé, billet NDS2026 mélange vue joueur + bloc PIN commerçant sur un même écran |
| Fluidité | 3 | CLS sévère et prouvé par capture (écran quasi vide 2,5 s) sur l'accueil de chaque module ET sur la carte super event (`/se/[se]`) |
| Compréhension | 5 | NDS2026 clair en 5 s ; écran de démarrage générique (`s-flash`) quasi vide sans indicateur de chargement ; bouton « Voir mon billet » du jeu phare mène à un écran au vocabulaire ambigu |
| Fonctionnel | 5 | Anti-double-tap correct partout (bouton `disabled={submitting}`) ; `preview=1` ne pollue ni `visites` ni `joueurs`/`participations` (vérifié dans le code) ; mais 6 écrans d'accueil/formulaire entiers sont du code mort inatteignable — risque de maintenance majeur, et le serveur dev est tombé en panne pendant l'audit |
| Données | 6 | Pattern C (participations vs `joueurs.events`) bien corrigé et vérifié ; Pattern H (`tombolaChamps` mort) confirmé toujours présent mais sans impact ; **`genre = 'Garçon'` trouvé en base réelle**, violation prouvée de la règle Homme/Femme/vide (1 ligne sur 841, origine non trouvée dans le code joueur) |
| Engagement | 6 | Cumul de tickets multi-stations, parrainage, carte des partenaires bien pensés dans le moteur réel |
| Attractivité | 6 | NDS2026 très soigné ; le moteur `/jouer` reste visuellement correct mais générique (même palette pour tous les commerces) |
| Accessibilité | 3 | `userScalable: false` + `maximumScale: 1` sur TOUT le layout parcours (zoom tactile bloqué, WCAG 1.4.4) ; textes à opacité .3/.4 sur fond sombre ; labels sans `for`/`id` dans le code mort encore chargé |
| Technique | 3 | Serveur dev tombé en 500 persistant pendant l'audit (risque d'environnement partagé) ; 404 console sur l'accueil quiz ; deux chemins de code divergents pour le même billet (`lot.html` vs `billets-partenaires.html`) vérifiés sur un vrai token |

**Moyenne : 4,8/10** — très loin du 10/10 visé. Le problème le plus grave n'est pas un bug isolé mais une divergence structurelle : une bonne partie du travail de design/accessibilité/branding documenté (`ParcoursLogo`, `FlowinBadge`, formulaire partagé) a été fait sur des fichiers que plus aucun joueur réel n'atteint.

---

## 2. Design

### 2.1 — Vert/teal interdit sur la page sponsor (preuve capture)
`DESIGN-TOKENS-flowin.md` : *« pas de vert/teal hors retours »* (seuls `--fl-ok`/`--fl-ko` — retours de quiz — ont droit au vert/rouge).
Capture `/sponsor/se-nds-2026` (mobile, state settled) : en-tête en dégradé **vert** plein écran (« DEVENEZ SPONSOR »), icônes de section (« Votre structure », « Votre contact », « Votre soutien ») en **vert**. Aucun vert/teal autorisé dans la charte pour cet usage.
Fichier : `admin/app/sponsor/[se]/SponsorClient.tsx`.
**P1** — remplacer par le bleu/violet (`--fl-bleu` #3B5CC4 / `--fl-violet` #7A4FE0).

### 2.2 — Avatar vert sur Tombola (code mort, mais le pattern existe)
Capture `/parcours/tombola?ev=ev-demo-tombola&preview=1` (avant découverte de la redirection — donc capture du code mort) : avatar rond « TD » en **vert** plein (#0B7A4F-like), alors que `MODULE_HERO_ACCENT.tombola` dans `components/parcours/ParcoursHero.tsx` (ligne 39) est bien violet. Le vert vient d'un autre composant de repli (`fl-part-tile`/logo générique de `ParcoursLayout`/`ParcoursHero` ancien). Sans impact joueur réel (code mort, §0), mais même anomalie de palette que 2.1 — signe que la règle « pas de vert hors retours » n'est pas gardée nulle part par un lint/test automatique.
**P2** (impact nul en prod actuelle, à corriger si le code est un jour réactivé ou supprimé).

### 2.3 — Univers « comics » bien scopé au Super event
`/rejoindre/se-nds-2026` (capture) : logo « SUPER event » (Bangers jaune/rouge) correctement utilisé **uniquement** sur cet écran propre au super event — conforme à `DESIGN-TOKENS-flowin.md`. Pas de fuite de la palette comics vers les écrans event/joueur génériques observés. ✅

### 2.4 — Disparité NDS2026 vs les 6 modules génériques
NDS2026 (`NDS2026Client.tsx`) : fond photo réelle du festival, confettis, cartes de lots en verre dépoli. `/jouer` (moteur `engine.ts`) : même structure pour tous les commerces (icône mono-couleur dérivée du nom, pas de photo). C'est un choix de produit documenté (le moteur `/jouer` est générique par design, NDS2026 reste un habillage sur-mesure protégé), donc **pas noté comme faute**, mais à signaler : un commerce individuel (hors festival) a un rendu nettement moins premium que NDS2026 — cohérent avec le constat déjà connu A6 du référentiel fonctionnel (section 8).

---

## 3. Ergonomie

### 3.1 — Valeur « Sexe » divergente entre les deux systèmes vivants
- Moteur réel `/jouer` : `lib/masters/engine.ts` ligne 329 — `data-genre="Homme"` / `data-genre="Femme"` (valeur = libellé complet).
- Code mort mais toujours importé/compilé : `components/parcours/ParcoursChampsStandard.tsx` lignes 24-25 — `<option value="H">Homme</option>` / `<option value="F">Femme</option>` (valeur = lettre).
- `NDS2026Client.tsx` ligne 1007 : également `value="H"` / `value="F"`.

Si jamais le moteur `/jouer` est débranché au profit des composants standalone (ou l'inverse, un futur module ajouté sur l'un des deux systèmes), les deux formats de donnée coexisteront dans `joueurs.genre`. Preuve que ce n'est pas que théorique : §5.1 montre une 3ᵉ valeur, `Garçon`, déjà en base — le champ n'est manifestement pas gardé par une contrainte base ni un enum strict.
**P1** — fichier à corriger en priorité si retravaillé : `lib/masters/engine.ts` (harmoniser sur `H`/`F` comme le reste du code), et idéalement ajouter une contrainte CHECK en base (`genre in ('H','F') or genre is null`).

### 3.2 — Billet NDS2026 : vue joueur et bloc commerçant sur le même écran
Capture live (token réel lu en base, lecture seule) `/lot.html?t=f2fb499a5c6347d790b4f01952f96be2` : l'écran affiche bien le billet du joueur (bénéficiaire « Juliette Sammarcelli », lot « Bon d'achat 20 € », n° `ND-2026-7910`) **puis**, juste en dessous, sans séparation visuelle forte, un champ de saisie « Code professionnel » avec le placeholder `0000` et le texte « Reçu par email lors de votre inscription. Il autorise la validation des billets de votre établissement. » — alors que **ce code n'est jamais envoyé au joueur**, seulement au commerçant. Le texte « La suite est réservée au commerçant » existe bien (atténue le risque), mais le champ de saisie du PIN reste visible et actif pour le joueur qui vient de gagner.
C'est le lien utilisé par `NDS2026Client.tsx` ligne 1167 (« Voir mon billet » → `/lot.html?t=...`, fichier protégé, non modifiable).
Comparer avec `/nds/billets-partenaires.html?t=<même token>` (capture) : billet complet, adresse et téléphone du commerce, gros QR code avec légende « LE COMMERÇANT SCANNE CE CODE POUR VALIDER », conditions d'utilisation détaillées, **aucun champ PIN visible** — c'est ce lien qu'utilisent les 6 autres modules via `ParcoursOutro.tsx` (ligne 22) et tous les écrans SA/pro (`JoueurDrawer`, `EventDrawer`, `GagnantsClient`, `ModalGererLots`).
Ce choix est documenté comme volontaire dans `docs/REFERENTIEL-fonctionnel-flowin.md` (section 8, ligne 219 : *« sauf la carte "Gagné tout de suite" de NDS2026Client.tsx (fichier protégé, garde lot.html, déjà à la charte NDS) »*) — mais la capture live montre que **« déjà à la charte NDS » n'est pas exact** : l'en-tête de `lot.html` est un dégradé violet Flowin générique (« Validation d'un lot / NUITS DU SUD 2026 »), pas le vrai logo stylisé « Nuits·Sud » utilisé par `billets-partenaires.html`.
**P1** — le joueur qui vient de gagner sur le jeu phare NDS2026 (de loin le plus joué, 22 stations réelles) voit un écran moins abouti, avec un champ réservé au commerçant visible, que celui des modules génériques (qui sont, eux, inatteignables aujourd'hui — ironie du système). Fichier concerné : `admin/public/lot.html` (pas `NDS2026Client.tsx`, qui est protégé — seul `lot.html` peut être retouché sans enfreindre CLAUDE.md règle 4).

### 3.3 — Labels non reliés (`for`/`id` absents) — code mort
`components/parcours/ParcoursChampsStandard.tsx` lignes 21-40 : chaque `<label className="label">` n'a ni `htmlFor`, ni `id` correspondant sur le `<select>`/`<input>` suivant. Même pattern dans `NDS2026Client.tsx` ligne 1005 (`<label className="label">Téléphone</label><input .../>`, toujours sans `htmlFor`). Ce dernier fichier est protégé et réel (impact joueur), donc gardé en P2 technique/accessibilité malgré le faible effort de correction empêché par la règle de non-modification.
À l'inverse, le moteur réel `/jouer` (ligne 326 de `engine.ts`) fait bien `<label for="f1">Prénom</label><input id="f1" ...>` — **positif**, à vérifier en vivant une fois le serveur stable (non confirmé en rendu, cf. §9).

---

## 4. Fluidité (CLS / perçu de chargement)

### 4.1 — Carte super event : écran quasi vide pendant ~2,5 s (preuve captures avant/après)
`/se/se-nds-2026` (mobile 390×844) :
- **Capture au DOMContentLoaded** : fond beige uni, uniquement la bannière du haut (« Nuits du Sud 2026 ») et le tiroir du bas (« 22 commerces jouent le jeu ») — **aucune carte, aucun spinner, aucun squelette**.
- **Capture 2,5 s plus tard** : la carte Leaflet avec ses 22 pins violets apparaît d'un coup.

Cause (code) : `app/se/_components/SuperEventMap.tsx` lignes 43-58, fonction `loadLeaflet()` — charge Leaflet CSS/JS **via injection `document.createElement('script')`/`('link')` côté client**, sans préchargement (`<link rel="preload">`), sans conteneur de taille fixe ni squelette affiché pendant le chargement. Le saut de contenu correspond exactement au symptôme signalé par Romain (« pages qui sautent au chargement »).
**P0** — premier écran qu'un festivalier voit en scannant le QR général du festival (pas une station individuelle) ; actuellement une page quasiment blanche 2-3 secondes sans feedback.

### 4.2 — Accueil des modules génériques : écran squelette minimal avant contenu (code mort, mais pattern probablement répété sur `/jouer`)
`/parcours/quiz?ev=ev-demo-quiz&preview=1` :
- **DCL** : un seul rond bleu pâle pulsé au centre + « Jeu proposé avec Flowin » tout en bas — rien d'autre.
- **+2,5 s** : écran complet (logo, « Bienvenue chez Démo · Quiz », CTA « Découvrir le jeu »).
Ce composant est du code mort (§0), mais le style de squelette (rond unique, aucun texte, aucune barre de progression) est partagé par construction avec `ParcoursLayout`/les CSS globaux du dossier `parcours/`, donc le symptôme a de bonnes chances d'exister aussi sur `/jouer` (même layout parent `app/parcours/layout.tsx`, confirmé partagé). **Non confirmé en rendu live sur `/jouer` à cause de la panne serveur (§9)** — à revérifier en priorité dès que le serveur est stable.
**P1** (confirmé sur le code mort, à reconfirmer sur le code réel).

---

## 5. Données

### 5.1 — `genre = 'Garçon'` trouvé en base réelle (violation prouvée de CLAUDE.md règle 6)
```sql
select genre, count(*) from joueurs group by genre order by count(*) desc;
-- F     : 417
-- H     : 224
-- null  : 199
-- Garçon: 1
```
Un enregistrement réel porte la valeur `Garçon`, qui n'est ni `H`, ni `F`, ni vide. Recherche dans le code joueur actuel (`ParcoursChampsStandard.tsx`, `NDS2026Client.tsx`, `lib/masters/engine.ts`) : **aucune des trois sources ne propose « Garçon »** comme option. Une recherche texte (`grep -rn "Garçon"`) trouve une seule occurrence dans tout `admin/` : `app/dashboard/operations/[id]/OpsDetailClient.tsx` (écran **SA**, hors périmètre joueur de cet audit — à signaler à l'agent SA/pro). Donc soit donnée historique (avant la règle), soit saisie manuelle côté SA. **Preuve que rien ne garde la colonne `joueurs.genre` à `{H, F, NULL}`** — ni contrainte base, ni validation stricte côté écrans qui écrivent dans cette table.
**P0 (données)** — à signaler au Super Admin / équipe Flowin : une ligne réelle enfreint la règle produit « jamais Autre ». Correction proposée : contrainte `CHECK (genre IN ('H','F') OR genre IS NULL)` sur `joueurs`, après nettoyage de la ligne existante (hors périmètre de cet audit, lecture seule).

### 5.2 — Pattern C (patterns-bugs-connus.md) — vérifié corrigé
`lib/parcours.ts` fonction `writeJoueur()` (lignes 383-420) : l'anti-doublon passe bien par `controleRegleQr()` qui lit la table `participations` (`.eq('joueur_id', ...).eq('event_id', ...)`), pas `joueurs.events` en `.contains()`. Commentaire du code confirme la correction du 19/07. ✅ Pas de régression trouvée côté joueur.

### 5.3 — Pattern H (patterns-bugs-connus.md) — `tombolaChamps` toujours mort, sans impact
`lib/types.ts` ligne 42 déclare toujours `tombolaChamps?: string[]`, jamais lu dans `TombolaClient.tsx` (grep `cfg\.` sur le fichier : aucune occurrence de `tombolaChamps`). Sans impact fonctionnel aujourd'hui puisque `TombolaClient.tsx` est lui-même du code mort (§0), mais confirme que le pattern documenté n'a pas été nettoyé.
**P2**.

### 5.4 — `preview=1` ne pollue pas les statistiques réelles — vérifié
`lib/track.ts` ligne 116 : `if (params.has('preview')) return` **avant** tout insert dans `visites` — centralisé pour tous les modules (corrige l'ancien trou documenté en commentaire : 52 flashs fabriqués constatés le 02/09). `lib/parcours.ts` ligne 353-356 (`estApercu()`) + ligne 384 : `writeJoueur()` retourne un succès simulé sans toucher `joueurs`/`participations` en `preview`. `JouerClient.tsx` ligne 40 confirme la même garde côté moteur réel. **Aucun risque de pollution constaté** ; conforme à ce que la consigne d'audit demandait de vérifier. ✅

### 5.5 — Deux chemins de code pour un même billet, vérifiés sur un vrai token
Cf. §3.2 : `lot.html?t=` et `nds/billets-partenaires.html?t=` affichent chacun correctement les vraies données du même `retrait_token` réel (`billet_par_token` / `partenaire_gagnants` RPC), donc **pas un bug Pattern M (mauvaise RPC)** — mais deux present­ations différentes pour la même donnée, dont une n'a pas de QR code (§3.2). Pas de lien cassé trouvé.

---

## 6. Fonctionnel

### 6.1 — Anti double-tap / double-inscription — vérifié correct
Sur les 5 modules « standalone » (code mort) : chaque bouton de soumission passe par `disabled={submitting}` et un texte d'état (`'Envoi…'`/`'Vérification…'`), vérifié dans `QuizClient.tsx` (281), `TombolaClient.tsx` (272-273), `VoteClient.tsx` (271), `SpinClient.tsx` (406), `QuizsoloClient.tsx` (171). Pas de risque de double-inscription par double-tap sur ces écrans (même s'ils sont inatteignables aujourd'hui). Le moteur réel `engine.ts` fait de même (`c-inscription`, bouton avec `r.envoi ? 'Envoi…' : ...` + `data-need disabled`, ligne 336). ✅

### 6.2 — Code mort massif = risque de maintenance majeur, nouveau pattern à documenter
Cf. §0. Ce n'est pas un bug joueur au sens strict (aucun joueur n'est impacté aujourd'hui), mais c'est un risque fonctionnel sérieux et non documenté dans `docs/patterns-bugs-connus.md` : une session future qui corrige un bug de formulaire/branding dans `ParcoursChampsStandard.tsx` ou `TombolaClient.tsx` croira avoir corrigé le parcours joueur réel, alors qu'elle corrige du code inatteignable — exactement le type d'erreur que Pattern G/D cherchent à éviter, mais sur un axe inverse (page vivante dans le code, mais jamais servie, plutôt que page orpheline jamais liée dans un menu).
**P0 (processus/documentation)** — recommandation : soit supprimer ces 5 fichiers + leurs imports partagés s'ils sont définitivement obsolètes, soit documenter très visiblement en tête de chacun (comme le fait déjà `redirection.ts`) qu'ils ne sont plus servis par défaut, et ajouter ce pattern à `docs/patterns-bugs-connus.md`.

### 6.3 — Serveur dev tombé en panne pendant l'audit
Cf. §9. Pas un bug de code applicatif (erreur de cache webpack generique sur `.next/server`), mais un vrai risque pour la suite de l'audit (impossible de terminer le test live de `/jouer`, de quizmaster en conditions réelles de bout en bout, ni de confirmer visuellement les écrans `c-billet`/`t-res-tirage`/`r-gain`/`v-resultat` du moteur réel).
**Non imputable au code du parcours joueur** — signalé pour information, pas noté dans les P0/P1/P2 ci-dessous.

---

## 7. Accessibilité

### 7.1 — Zoom tactile désactivé sur tout le parcours joueur
`app/parcours/layout.tsx` lignes 8-14 :
```ts
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, themeColor: '#D4537E',
}
```
`maximumScale: 1` + `userScalable: false` **bloque le pinch-to-zoom** sur absolument tous les écrans sous ce layout (les 5 modules « morts » mais aussi, via le même répertoire `app/parcours/`, potentiellement nds2026/quizmaster s'ils partagent ce layout — à vérifier, `NDS2026Client`/`QuizmasterClient` sont dans `app/parcours/nds2026` et `app/parcours/quizmaster`, donc **sous ce même `layout.tsx`**, impact réel confirmé). Violation directe WCAG 2.1 SC 1.4.4 (Resize text) — un joueur malvoyant ne peut pas zoomer pour lire un texte en 10-12px (ex. `.fl-label` 11px, `.pc-howto-sub` 12.5px repérés dans le CSS).
**P0 (accessibilité)** — fichier : `admin/app/parcours/layout.tsx`. Correctif : retirer `maximumScale: 1, userScalable: false`.

### 7.2 — Contraste texte faible répété
Exemples relevés dans le code (couleurs calculées, non mesurées par outil de contraste faute de Lighthouse disponible dans l'environnement — **non vérifié par mesure automatique, estimation visuelle sur capture**) : `color:'rgba(255,255,255,.3)'` (`QuizClient.tsx` ligne 214, « Jeu gratuit · Sans achat obligatoire »), `.pc-hero-sub{color:rgba(255,255,255,.55)}`, `.pc-prize-vl{color:rgba(255,255,255,.55)}` (`ParcoursHero.tsx`). Blanc à 30-55 % d'opacité sur fond violet foncé (~#3a1450 à #6e2785) donne un ratio de contraste très probablement sous le seuil AA 4,5:1 pour du texte normal.
**P2** — à confirmer avec un outil de contraste (non disponible ici) avant de prioriser.

### 7.3 — Positif : formulaire d'inscription du moteur réel bien structuré en code
`lib/masters/engine.ts` ligne 326-329 : `<label for="f1">`/`<input id="f1">` correctement appariés, `role="radiogroup" aria-label="Sexe"` sur le sélecteur de genre. C'est mieux que le code mort (§3.3). Non confirmé en rendu (serveur en panne) mais la source est sans ambiguïté. ✅ (sous réserve de confirmation que les boutons `data-seg` à l'intérieur ont bien `role="radio" aria-checked`, non vérifié — gap possible).

---

## 8. Technique

### 8.1 — 404 console sur l'accueil Quiz (code mort)
`/parcours/quiz?ev=ev-demo-quiz&preview=1` : une ressource 404 en console au chargement (non identifiée précisément — le flux réseau détaillé n'a pas été capturé avant la panne serveur). Impact nul aujourd'hui vu le statut code mort.
**P2 — non prioritaire**, à revérifier si ce fichier est un jour réactivé.

### 8.2 — Avertissement d'hydratation React sur `/rejoindre/[se]`
Console : *« Warning: Prop `%s` did not match. Server: … Client: … style "width: 100%; padding: 12px 14px; background: rgb(248, 250, 252) …" »* — mismatch SSR/client sur un style inline d'un champ de formulaire (probablement une valeur calculée différemment côté serveur vs client, ex. couleur dépendant de `window`). Fichier : `app/rejoindre/[se]/RejoindreClient.tsx`. Sans y avoir vu de symptôme visuel direct (le formulaire reste utilisable), c'est un signe de rendu non déterministe à corriger.
**P2**.

### 8.3 — Serveur dev partagé tombé en panne (contexte, pas un bug produit)
Cf. §6.3/§9 — `Cannot find module './1682.js'`, erreur de cache `.next/server`, 500 persistant sur toutes les routes testées en fin de session (y compris celles qui fonctionnaient 10 minutes plus tôt). Consigné pour traçabilité, hors scope de correction pour cet agent (ne pas redémarrer le serveur, consigne explicite).

---

## 9. Ce qui n'a pas pu être vérifié

- **Rendu live complet de `/jouer`** (le vrai parcours des 5 modules « master ») : le serveur dev est tombé en 500 persistant pendant la session, après la collecte des captures sur les anciennes routes `/parcours/*`. Les écrans d'accueil, inscription, billet, résultat du moteur réel ont été audités **sur le code source uniquement** (`lib/masters/engine.ts`, citations exactes données). Non confirmé : rendu visuel réel, CLS réel sur `/jouer`, comportement des boutons `data-seg` (rôle ARIA radio), accessibilité réelle au clavier/lecteur d'écran.
- **Quiz Master en conditions réelles de jeu collectif** (plusieurs joueurs simultanés) — testé uniquement l'écran d'attente seul.
- **Score Lighthouse mobile** (Performance/Accessibilité/Bonnes pratiques/SEO) sur `/landing`, `/nds`, `/rejoindre/[se]` — outil Lighthouse non disponible dans cet environnement Playwright `playwright-core` minimal ; seules des captures manuelles de CLS ont pu être produites.
- **Scan physique réel d'un QR code** avec un téléphone/appareil photo (vérifié uniquement que l'URL encodée dans le QR, lue dans le code, pointe vers une route qui répond — pas de scan caméra réel).
- **Contraste de couleur mesuré par outil** (§7.2) — estimation visuelle seulement.
- **Origine exacte de `genre = 'Garçon'`** (§5.1) — confirmé en base, non trouvé dans le code joueur actuel ; peut être une donnée historique ou une saisie manuelle côté SA (`OpsDetailClient.tsx`), hors périmètre joueur.
- **Résolution complète du 404 console** sur `/parcours/quiz` (§8.1) — ressource non identifiée avant la panne serveur.
- **Vote, QuizMaster, Spin en situation de victoire réelle avec lot lié à un vrai partenaire** côté moteur `/jouer` (bloqué par la panne serveur) — seul NDS2026 a pu être vérifié de bout en bout via un token réel lu en base (§3.2).

---

## 10. Liste priorisée P0 / P1 / P2

### P0
1. **CLS carte super event** — `app/se/_components/SuperEventMap.tsx` (fonction `loadLeaflet`, lignes 43-58) : écran quasiment vide 2,5 s sans squelette/spinner au premier écran d'un festivalier scannant le QR général. *Correctif* : précharger Leaflet (`<link rel="preload">` dans le `<head>` de la page, pas injecté au runtime) ou afficher un squelette de carte (silhouette grise) pendant le chargement.
2. **Zoom tactile bloqué** — `app/parcours/layout.tsx` (`maximumScale: 1, userScalable: false`) sur tout le parcours joueur, y compris NDS2026 et QuizMaster (fichiers réels). *Correctif* : retirer ces deux propriétés du `viewport`.
3. **`genre = 'Garçon'` en base réelle** — violation vérifiée de CLAUDE.md règle 6. *Correctif* : ajouter une contrainte `CHECK` sur `joueurs.genre`, nettoyer la ligne existante (décision SA), et vérifier l'écran SA `OpsDetailClient.tsx` qui est la seule source du mot « Garçon » trouvée dans tout `admin/`.
4. **Code mort massif non documenté** — 5 fichiers `*Client.tsx` + 3 composants partagés (`ParcoursBranding.tsx`, `ParcoursHero.tsx`, `ParcoursChampsStandard.tsx`) jamais servis à un joueur réel (`versMasterSiBesoin` redirige tout vers `/jouer`, 0 event avec `masterOff=true`). *Correctif* : décision produit (supprimer ou documenter en tête de fichier + ajouter un Pattern N à `docs/patterns-bugs-connus.md`) avant toute future session d'audit ou de correction qui toucherait ces fichiers en les croyant actifs.

### P1
5. **Sponsor en vert/teal interdit** — `app/sponsor/[se]/SponsorClient.tsx`, violation `DESIGN-TOKENS-flowin.md`. *Correctif* : repasser en bleu/violet.
6. **Billet NDS2026 (`lot.html`) mélange vue joueur et bloc PIN commerçant** sur le même écran, sans QR visible pour le joueur, en-tête non alignée sur la vraie charte Nuits du Sud (contrairement à ce que dit le référentiel fonctionnel section 8/P4). *Correctif* : `admin/public/lot.html` (seul fichier modifiable, `NDS2026Client.tsx` étant protégé) — séparer plus nettement la vue joueur (avec QR) du bloc PIN, ou rediriger le lien « Voir mon billet » vers une vue dédiée avant la porte PIN.
7. **Valeur « Sexe » divergente** entre `lib/masters/engine.ts` (`"Homme"`/`"Femme"`) et le reste du code (`"H"`/`"F"`). *Correctif* : harmoniser sur `H`/`F` partout.
8. **CLS écran d'accueil des modules** (constaté sur le code mort, layout partagé avec le code réel — à reconfirmer sur `/jouer` dès que le serveur est stable).

### P2
9. Avatar/logo vert interdit sur Tombola (code mort).
10. Pattern H : `tombolaChamps` toujours mort dans `lib/types.ts` (sans impact, code mort).
11. Contraste texte faible (`rgba(255,255,255,.3-.55)`) sur fond sombre, à confirmer par outil.
12. Labels sans `htmlFor`/`id` dans `NDS2026Client.tsx` (ligne 1005 et suivantes) — fichier protégé, correction impossible sans lever la règle CLAUDE.md 4, à signaler pour arbitrage.
13. Avertissement d'hydratation React sur `/rejoindre/[se]` (`RejoindreClient.tsx`).
14. 404 console non identifiée sur `/parcours/quiz` (code mort, non prioritaire).

---

## 11. Preuves conservées (captures, non livrées avec ce rapport)
Captures mobile 390×844 (avant/après chargement) prises pendant la session : accueils des 6 modules legacy, `/se/se-nds-2026` (DCL + settled), `/se/se-fetes-du-haut-et-moyen-pays-vencois`, `/rejoindre/se-nds-2026`, `/sponsor/se-nds-2026`, `/nds/billets-partenaires.html` (vue interne + vue `?t=<token réel>`), `/lot.html?t=<token réel>`, `/se/se-nds-2026/ev-nds-bar-1`. Stockées localement dans le bac à sable de session (non inclus dans ce livrable, reproductibles via les mêmes URLs une fois le serveur stable).
