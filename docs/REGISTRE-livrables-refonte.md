# Registre des livrables de la refonte Flowin Event

Source unique de ce qui est demandé par Romain. Règles :
1. Chaque demande de Romain est inscrite ici **dans le même tour** où elle arrive (date + ses mots).
2. **On ne supprime jamais une ligne.** Seul Romain clôt une ligne (« validé »).
3. Avant toute production : relire ce registre, `DECISIONS-flowin-event.md`, et faire
   l'**inventaire** du support existant (liste de ses blocs).
4. Après production : refaire l'inventaire et comparer. Tout bloc disparu est soit remis, soit
   signalé à Romain avec la raison. Rien ne disparaît en silence.
5. **Règle absolue (Romain, 09/11) : ne jamais recréer ce qui marche déjà dans l'application.** Tout existe : connexions, données Supabase, tableaux de bord, parcours de souscription, parcours de création, jeux et leur design, matériel. On va **d'abord chercher l'existant** ; s'il faut le redesigner, on le redesigne ; s'il faut l'améliorer, on l'améliore ; on change un parcours seulement s'il doit changer. Jamais repartir de zéro.
6. Chaque livraison se termine par la **grille de contrôle** du livrable (critères ci-dessous, cochés
   avec preuve : capture 360/390/430 px et ordinateur, lien).

| N° | Livrable | Critères d'acceptation (mots de Romain) | État |
|---|---|---|---|
| L1 | **Plaquette Flowin Animation V3** — refonte de la V2 existante, puis poussée dans le super admin (Outils et communication) | Formats **mobile et ordinateur**. Carrousel, pas tout sur la même page (prix compris). Plug and play. Multi-jeux : quiz, quiz + bonus, tombola, roue. Jamais faire jouer / tester. Pitch : tu installes, ils jouent, ils connaissent ton métier, ils font venir leurs amis, ils gagnent, ils reviennent. 56 % « je souhaite rester en contact » au milieu. Se termine par un **QR code ou un lien vers le parcours de souscription**. Conversions : coordonnées → carte / prochain super event → prix. Pas besoin de montrer l'application de bout en bout. | En cours |
| L2 | **Plaquette Flowin Super Event V3** — refonte de la V2 existante, puis poussée dans le super admin (Outils et communication) | Mobile et ordinateur. Carrousel. Orange. Organisateur : « Connecte ton événement avec l'ensemble du réseau local » ; commerce : « Connecte ton commerce aux événements locaux, visibilité auprès des festivaliers ». Présentation commerces + événement (à garder). 56 %. Fichier client, rester en contact. | En cours |
| L3 | **Vidéo de présentation Flowin Animation, type tuto** | Animation de qualité, mi-présentation mi-tuto, simplicité, plug and play. Poussée dans le super admin (Outils et communication). | À faire |
| L4 | **Vidéo d'animation de présentation Flowin Super Event** | Idem, orange, NDS en exemple. | À faire |
| L5 | **Vidéo « vision utilisateur »** : participer à Flowin Animation, ou participer à un Super Event | Le parcours vu par l'utilisateur. | À faire |
| L6 | **Parcours de souscription (première connexion)** : **existe déjà** dans l'app | Le **redesigner** aux couleurs décidées pour la plaquette, pour retrouver la même chose sur la plaquette et dans l'app. Arrivée par le QR / lien de fin de plaquette. | Redesign à faire |
| L7 | **Parcours de création d'animation** : **existe déjà** (jeux et leur design, matériel) — redesign / amélioration seulement | Choix des jeux, etc. : ce qui existe déjà, rendu complet et fluide jusqu'à la publication ; paiement à la publication (virement SEPA, RIB entreprise, pas de branchement définitif). | À faire |
| L8 | **Demande de participation à un super event** : partir de l'existant dans l'app | Selon le statut : **station jeu** ou **sponsor** ; souscrire sur **un ou plusieurs événements** ; **paiement à la fin**. | À faire |
| L9 | **Tableau de bord** : **existe déjà** — le faire évoluer si besoin | Créer une animation, rapports : personnes venues, sexe, CRM, paramètres du jeu. | À faire (démo faite dans la visite) |
| L10 | **Visite guidée** (démo) | Recolorée ; écrans validation, rapports, virement ajoutés le 08/11. | À valider |
| L11 | **Charte couleurs** | Fond blanc, typo OK ; couleurs entre bleu et orange (pas turquoise, pas violet) ; Romain cherche une charte. | En attente Romain |
| L12 | **Carte des partenaires** (Animation et Super Event) | Inscription sur la carte après validation. **Ne pas produire maintenant.** | Plus tard |

## En attente de Romain
- RIB (IBAN, BIC) de BAITA EURL.
- Coordonnées publiables : WhatsApp 06 16 35 49 36 et info@opconsult.co ?
- Charte couleurs définitive.
- Nettoyage base (clic Supabase) et 5 banques vides.

## Ordre de production proposé
L1 → L2 (plaquettes, mobile + ordinateur) → L6 → L7 → L8 → L9 (app réelle, un parcours prouvé à la
fois) → L3 → L4 → L5 (vidéos tournées sur les écrans finis, pour ne pas les refaire).
