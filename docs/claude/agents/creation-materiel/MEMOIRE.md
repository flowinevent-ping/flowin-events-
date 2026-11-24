# Mémoire : creation-materiel (créée le 21/11/2026 depuis les docs et commits ; ≤120 lignes)

## Déjà fait et décidé (avec dates)
- 09/11 : plaquettes Animation V3 et Super Event V3 (carrousel, mobile et ordinateur), poussées dans le super admin ; Romain les juge « bonnes » (corrections plus tard). `c3798924` : aperçus de jeux = captures réelles de l'app.
- 09/11 : retours Romain Super Event V3 : accroche « Un événement. Tous ses partenaires. Un seul jeu. » rejetée ; retirer théâtre, arcs pointillés, halos, bonhommes ; chiffres 56 % / 70 alignés, même taille ; dessin plutôt que discours.
- 10/11 : 5 films réseaux sociaux v4 (v3.2), versions 15 s, QR de fin par cible avec canal `?src=` ; roue des films identique à l'app (`ab91188b`, décision 17/11). Fichiers `admin/public/videos/v4/f1..f5`.
- 17-18/11 : vidéos v5 puis v6 (L3 Animation, L4 Super Event, L5-SE participant) en 9:16, 16:9, 30 s, 15 s ; 12 fichiers `admin/public/videos/v6/` ; fin L3 : promesse + signature (v6.1).
- 18/11 : v7 L3 « Bienvenue sur Flowin » (45 s et 30 s, 9:16 et 16:9), voix par bloc, `admin/public/videos/v7/`. Retour Romain : trop rapide, trop robotique.
- 19/11 : v8 L3 (long 60,2 s, court 41,7 s) et L4 (long 52,7 s, court 38,1 s), 4 fichiers chacun dans `admin/public/videos/v8/` ; moteur `scenes/films-v8.html` (`#l3v8`) et `films-v8-l4.html` (`#l4v8`). v6 et v7 conservées.
- Tous les films sont en brouillon dans le super admin tant que Romain n'a pas validé ; catalogue `admin/lib/outilsCommerciaux.ts`.

## Pipeline vidéo (à reprendre tel quel)
- Scènes HTML rendues par Playwright, 24 i/s, deviceScaleFactor 2, images envoyées à ffmpeg, H.264 yuv420p faststart ; AAC 128 kb/s 48 kHz mono.
- Écrans réels : `admin/public/videos/v5/ecrans/*.jpg`. Illustrations de données marquées « exemple », sans chiffre.
- Fondus enchaînés 0,6 s entre plans (v8). La voix démarre 0,2 s après le début du plan (0,15 s en court) ; le plan reste 0,4 s après la phrase ; fin 1,4 s (1,0 s en court).
- Pas de musique (aucune dans v6 à v8). Mix : loudnorm deux passes -16 LUFS, TP -1,5 ; passe-haut 70 Hz, +2,5 dB à 180 Hz, -1,5 dB à 3,2 kHz, +1 dB à 9 kHz, aecho 12 ms / 0,05, compression 2,5:1.
- Contrôles : QR de fin décodé (jsQR + pngjs) sur chaque fichier ; faster-whisper « small » sur chaque bloc pour vérifier la prononciation.

## Voix off (réglages retenus)
- Voix edge-tts `fr-FR-VivienneMultilingualNeural`, jeune femme enjouée ; seule voix testée qui prononce « Flowin » correctement.
- v6 et v7 : `--rate=+12% --pitch=+8Hz` (+ accélérations ×1,055 à ×1,10) : trop rapide. v8 : `--rate=-5% --pitch=+0Hz`, aucune accélération (réglage A retenu face à B 0 % / +2 Hz et C +5 % / +4 Hz).
- Rendu phrase par phrase ; pauses 380 à 420 ms entre phrases, 200 à 230 ms aux respirations internes, 420 ms avant la signature.
- « Flowin » garde l'accent anglais voulu (transcrit Flow1 / Flouin / Floin). Animation en français. « Flowin, l'animation » rendu en français puis « plug and play. » rendu seul en anglais et collé 40 ms après.
- Astuces de prononciation : « R.S.E. » écrit avec points (« RSE » sortait « RCE ») ; « jour-J » avec tiret ; « Cent pour cent, automatisé. » avec virgule ; phrase du bloc 2 L4 rendue d'un seul segment (« tes lots » devenait « tes loups »).
- Doutes restants : « ou par tirage au sort », « Quiz, tombola ou roue ». Romain doit écouter les v8.

## Cibles des QR de fin (décodées, ne pas changer sans l'annoncer)
- L3 Animation : `https://flowin-events.vercel.app/pro/premiere-fois?src=video-tuto-animation` (bouton « Je publie mon animation »).
- L4 Super Event : `https://flowin-events.vercel.app/validation/plaquette-super-event-v3.html?src=video-super-event#organisateur` (« Je diffuse mon événement »).
- L5-SE participant : `https://flowin-events.vercel.app/carte-commerces?src=video-participant-se` (« Je joue »).
- Films v4 : QR par cible, canal `?src=video-commerce`, `video-organisateur`, `video-partenaire-se`, etc. (`outilsCommerciaux.ts`).

## Pièges connus
- Ne jamais paraphraser : copier les textes de `docs/ARGUMENTAIRE-flowin-event.md` ; relire contre la liste « Interdit ».
- Pas de chiffre inventé (écrans de données « exemple »). Chiffres autorisés : 56 %, plus de 70 lots, 2 804 passages (NDS 2026).
- Ne pas faire jouer ni « tester » le jeu dans les supports ; pas de photo (animation de qualité et vidéo interactive).
- Super Event : toujours orange #C2410C / #FF8A14 ; Animation : bleu #3B5CC4 ; jamais de violet ni de turquoise « pharmacie ».
- Inventaire avant / après d'un support (registre règle 3-4) : un bloc disparu doit être remis ou signalé.
- Les captures du profil et de l'espace pro montrent des données réelles : ne pas les publier.
- Films v4 : la scène « roue » devait être refaite avec la roue de l'app (fait 17/11).

## Sources et standards utiles
- edge-tts (voix neuronales Microsoft), faster-whisper, jsQR, ffmpeg loudnorm (EBU R128, -16 LUFS pour le web mobile), Playwright.
- Zones sûres 9:16 : texte entre 12 % et 73 % de la hauteur ; légende ≥ 4,2 % de la hauteur.

## Ouvert
- Valider à l'écoute les vidéos v8 L3 et L4 (Romain) ; passage au statut « validé » dans le catalogue.
- L5-SE participant n'existe qu'en v6 (voix +12 %) : refaire en v8 ? Décision de Romain.
- Enregistrement humain éventuel : `docs/SCRIPTS-VOIX-OFF-2026-11-18.md` (scripts à lire avec rythme).
- Charte graphique définitive bleu / orange (REGISTRE L11) toujours en attente.
- Visuels de prospection et publipostage design : aucun produit à ce jour, cibles dans `docs/claude/CIBLES.md` ; format à compléter.

## Historique 6 mois (Notion + git, importé le 24/11/2026). Sources : voir SOURCES.md (AUTO28, AUD29, PIL, HUB)
- 28/06 · Stockage des assets NDS : `admin/public/nds/` (visuels, kit-digital par commerce, partenaires, `visuels-src/` = générateurs Python). Règle : rendu ET script source dans le même commit, car le conteneur est éphémère (AUTO28).
- 28/06 · Affiche A4 « Station » v9 validée par Romain : ordre vertical = logo NDS, « LE GRAND JEU DES NUITS DU SUD », « FLASH ET JOUE » (autre typo, plus visible), « STATION JEUX » + logo du commerce, visuels de gains agrandis, QR sous les gains, pied (cumul des points, grand tirage, mentions). Texte clé en MAJUSCULES et couleur ; lots lus dans `partenaires.lots`, jamais en dur (AUTO28). Reprise à la charte de novembre : à vérifier avant réutilisation.
- 29/06 · Vidéo écran : le 7e logo (disposition 2-2-2-1) chevauchait le QR persistant ; options : resserrer les logos au-dessus du QR ou réduire le badge QR pendant la scène ; re-rendu 960 images par blocs de 160 puis ffmpeg 24 i/s, `-crf 19`, `yuv420p`, `+faststart` ; QR vérifié par décodage (AUD29).
- 29/06 · Un support doit être homogène à 3 endroits (kit en ligne, Notion, base) ; contrôler un lien par commerce vers son propre `ev-nds-<slug>` (AUD29 §3.2 et 3.4).
- 31/08 · Les outils HTML autonomes ont chacun leur thème (sombre ou clair) : l'harmonisation se fait par les variables CSS seulement ; `nds-visuels.html` laissé sombre car couleurs codées en dur partout (HUB 31/08).
- 02/09 · QR : généré localement (PNG 1024 px, SVG, affiche A4) et décodé après génération ; ne plus dépendre d'un service tiers (HUB 02/09).
- 23/07 · Billet : 4 rendus distincts de la même chaîne ; logo officiel `flowin_blanc.png` ; conditions d'utilisation lisibles et distinctes des mentions légales (HUB 23/07, REF A3).
- 28/06 · Style de Romain : français terse (dictée vocale), factuel ; chiffres réels uniquement, jamais d'adresse, lot ou contact inventé (AUTO28).
