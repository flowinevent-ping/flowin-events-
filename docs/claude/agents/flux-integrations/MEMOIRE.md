# Mémoire : flux-integrations (créée le 21/11/2026 ; ≤120 lignes)

La facturation légale et Jeffrey CRM relèvent de l'agent `facturation-crm` (mémoire séparée).

## Déjà fait et décidé
- 10/11 : `notify-commande-animation` : aucun e-mail client (redirigé vers Flowin), alerte paiement à vérifier, offre de lancement (`05f828ba`). Bon de commande édité depuis le SA est envoyé au pro ; depuis la plaquette, à Flowin (`82394a39`).
- 10/11 : tickets gagnants dans le profil joueur et l'espace pro, déstockage, rappels 1 mois / 15 jours / 48 h, « en faire profiter un ami » ; caisse : billet expiré refusé avec « Accepter quand même » (RPC `accepter_ticket_expire`) ; exception Nuits du Sud sans péremption.
- 17-18/11 : annonces des commerces à leurs contacts, dans l'application seulement (2 par 7 jours, consentement « ce commerce ») ; connexion joueur par lien e-mail.
- 19/11 : e-mails par Gmail SMTP (`_shared/mailer.ts`, garde-fou 450/jour, repli Resend). En service le 20/11.
- 20/11 : toutes les fonctions d'envoi sur le mailer Gmail : `send-ticket-gagnant` v5, `notify-souscription` v5, `notify-bon-commande` v5, `notify-rappel` v1, `rappel-tickets` v4 (secret), `notify-commande-animation` v6. `send-resultat-tirage` neutralisée (no-op, non déployée) : le résultat de tirage est dans /moi (« Pas de lot cette fois »), aucun e-mail aux non-tirés.
- 21/11 : `notify-bon-commande` (`b810cd56`) : copie du bon signé au signataire (adresse lue en base) + copie interne Flowin ; `ENVOI_CLIENT=non` redirige vers Flowin. Déploiement non confirmé.
- Interactions : pro valide un lot via `lot.html` (jeton pro, `valider_lot`, déstockage) ; joueur offre un lot (`offrir_ticket_ami_contact`) ; orga crée un Super Event, un commerce demande à être station, le SA approuve ; tirage Super Event par Flowin ; tirage d'animation par le pro.

## Règles à respecter (voir REGLES.md)
- Pas d'e-mail ni de SMS aux clients, sauf relances (et la copie du bon de commande au signataire, v2 voulue par Romain) ; annonces des commerces dans l'application.
- Ne jamais changer qui reçoit un e-mail ni quand sans l'avis de Romain : le 20/11 un changement non demandé a dû être corrigé le 21/11.
- Gabarit e-mail Super Event encore en dur « Nuits du Sud » : à rendre neutre (non corrigé).

## Pièges connus
- Plafond Gmail 450/jour ; spam possible ; pas d'envoi en masse ; mot de passe d'application annulé si le mot de passe Google change.
- Resend : `onboarding@resend.dev` sans domaine vérifié ne livre qu'au propriétaire du compte (403 ailleurs) ; `RESEND_API_KEY` existe dans les secrets.
- Appel d'une fonction avec un destinataire pris dans la requête = relais ouvert : l'adresse vient toujours de la base.
- `rappel-tickets` : jamais en mode normal à la main.
- Une fonction Edge déployée peut différer du dépôt.
- Textes joueur d'un gain immédiat : aucun mot « tirage ».
- Une station Super Event ne s'ouvre qu'à la date de début ; phases avant / pendant (exception NDS).
- Cron `pg_cron` : `net.http_post` asynchrone, lire `net._http_response`.

## Ouvert
- Déployer / vérifier `b810cd56` ; contrôler le cron du 21/11 ; neutraliser le texte NDS des e-mails Super Event ; lot organisateur validable seulement par le SA.
- Envoi en masse (annonces) : domaine et service d'envoi à décider (étude L14 : Resend Pro 20 $/mois + domaine vérifié recommandé le 17/11, puis Gmail le 19/11).
- Réglages Supabase Auth (URL, modèles, SMTP) et séparation avec Flowin Révision : par Romain.
- 23/11 : Import fichier client = EXISTE MAIS INCOMPLET (0 import réel, pas d'attestation, pas d'adresse) ; campagnes à un fichier importé = hors règles, option A (invitation envoyée par le pro, lien ou QR suivi) en attente de Romain et d'un juriste ; crm_pro fermé à anon (23/11).

## Historique 6 mois (Notion + git, importé le 24/11/2026). Sources : voir SOURCES.md (HUB, REF, AUD29)
- 31/08 · Envoi en masse : Romain a réagi fermement (« tout existe déjà, les envois et confirmations manuels fonctionnaient »). Ma première version bloquait l'envoi en attendant un domaine Resend vérifié : erreur. Le mécanisme qui marche (liens Gmail pré-remplis, PIN, billets) ne se remplace pas ; on AJOUTE autour (HUB 31/08 et 30/08).
- 23/07 · Cycle de vie d'un gagnant, générique, jamais codé en dur NDS : TIRÉ (interne, SA seul) puis CONFIRMÉ (`notifie_at`, visible du partenaire) puis RETIRÉ (`retire_at` + `lots_stock.utilise`). Le premier e-mail au partenaire ne liste pas tous les tirés (HUB 23/07).
- 23/07 · Billet : nom du gagnant affiché seulement après confirmation (« À attribuer » avant) ; conditions d'utilisation du lot (sur quoi, où, jusqu'à quand) distinctes des règles du jeu ; source `partenaires.lots[].conditions`, jamais inventées. À compléter alors : 3 lots Auto-École et la formule complète d'un commerce (HUB 23/07).
- 23/07 · E-mail gagnant unique `/nds/mail-gagnant.js` (3 copies divergentes, l'une parlait encore du festival en cours) (HUB 23/07).
- 28/07 · Un bug critique « doublon de PIN » a été corrigé avec un audit des tirages d'un commerce (HUB 28/07, seul le titre de la section a été lu : détail non repris).
- 09/07 · Facture auto-enregistrée depuis un bon, numéro `FL-2026-XXXX-01` figé une fois émis, contenu éditable, PDF dans fiche partenaire et pro ; cause racine des factures manquantes = droits anon (HUB 09/07). Le schéma de numérotation actuel (`FL-AM-AAAA-NNNNN`) est décrit dans la mémoire facturation-crm : ne pas confondre les deux.
- 29/06 · Liens jeu : chaque commerce doit pointer vers SON `ev-nds-<slug>` (un e-mail partenaire pointait vers un autre commerce) ; contrôler les liens de chaque e-mail par commerce (AUD29 §3.4).
- 16/09 · Référentiel #36 : e-mail de super event avec texte « Nuits du Sud » en dur, à rendre au nom du super event ; ERREURS.md dit encore « non corrigé » : vérifier (REF).
- 16/09 · Diffusion : texte type modifiable (nom, dates, lot, lien) réutilisé par Gmail, WhatsApp, SMS, Instagram ; QR de suivi demandé par le pro puis validé par le SA ; export Mailchimp des contacts opt-in (REF lot 4).
- 28/06 · Domaine d'envoi `flowin.events` à vérifier dans Resend (e-mails gagnants) : suspendu à l'époque, remplacé par Gmail SMTP le 20/11 ; le sujet « envoi en masse » reste ouvert (AUTO28, ERREURS.md).
- 31/08 · Retirer / remettre en jeu un gagnant et re-tirage d'un non-répondant (`cfa53a0f`) existent ; un partenaire ne reçoit jamais le nom d'une personne non encore jointe (HUB 25/08 et 23/07).
