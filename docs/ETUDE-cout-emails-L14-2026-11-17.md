# Étude L14 — Emails : le système tient-il, et combien ça coûte ? (17/11/2026)

Question de Romain (10/11) : « si chaque commerce envoie ~1 000 emails/mois (annonces + ~30 emails
de lots), le système actuel tient-il ? sinon coût par commerce ».

Aucune modification de code ni de base n'a été faite pour cette étude.

## 1. En bref

- **Non, le système actuel ne tient pas.** Aujourd'hui les emails partent de l'adresse de test
  `onboarding@resend.dev`. Sans domaine vérifié, Resend ne livre qu'au propriétaire du compte :
  les joueurs et les commerces ne reçoivent rien. Et l'offre gratuite Resend est plafonnée à
  100 emails par jour (3 000 par mois), soit 3 commerces au maximum.
- **Recommandation : garder Resend (déjà branché partout), vérifier le domaine `flowin.events`,
  passer à l'offre Pro à 20 $/mois.** Coût par commerce : environ 2 $ à 10 commerces, 0,40 $ à
  50 commerces, 0,35 $ à 100 commerces, 0,70 $ à 500 commerces (offre Scale).
- Alternative européenne la moins chère : Scaleway TEM (Paris), environ 0,25 € par commerce et
  par mois, mais il faut réécrire l'envoi dans 7 fonctions.

## 2. Comment les emails partent aujourd'hui (inventaire)

| Canal | Où | Expéditeur | Ce qui part | État |
|---|---|---|---|---|
| Resend (API) | `supabase/functions/notify-souscription`, `notify-bon-commande`, `notify-commande-animation`, `notify-rappel`, `rappel-tickets`, `send-ticket-gagnant`, `send-resultat-tirage` | `NOTIFY_FROM` / `NOTIFY_FROM_ADDR`, par défaut `onboarding@resend.dev` | souscriptions, bons de commande, factures, rappels, tickets gagnants, résultats de tirage | Adresse de test : livre seulement au propriétaire du compte Resend |
| Supabase Auth (SMTP) | connexion, lien e-mail, mot de passe oublié | réglé par Romain vers Brevo (en cours) | emails de connexion | Dépend du réglage Brevo, quota Brevo gratuit 300/jour |
| mailto / Gmail | super admin `admin/public/dashboard.html` (10 liens `mailto:`) | boîte de Romain | envois un par un | Manuel, impossible à 1 000/mois par commerce |

Aucune annonce en masse (newsletter d'un commerce) n'existe en email aujourd'hui.

## 3. Volumes à calculer

1 000 emails par commerce et par mois :

| Commerces | Emails / mois | Emails / jour (moyenne) |
|---|---|---|
| 10 | 10 000 | ~330 |
| 50 | 50 000 | ~1 650 |
| 100 | 100 000 | ~3 300 |
| 500 | 500 000 | ~16 500 |

Les annonces partent souvent d'un coup (pic d'un jour), donc les plafonds journaliers comptent.

## 4. Tarifs publics (vérifiés le 17/11/2026)

| Service | Gratuit | Payant | Source (consultée le 17/11/2026) |
|---|---|---|---|
| **Resend** (États-Unis) | 3 000/mois, 100/jour, 3 domaines | Pro 20 $ = 50 000 ; Pro 35 $ = 100 000 ; Scale 90 $ = 100 000, 350 $ = 500 000 ; dépassement 0,90 $ / 1 000 (Pro) ; pas de plafond journalier en payant | https://resend.com/pricing |
| **Brevo** (France) | 300/jour | Starter à partir d'environ 9 € (5 000/mois) d'après des guides tiers ; **prix à 20 000, 50 000, 100 000 et 500 000 non vérifiés** (page officielle non lisible par notre outil, sources tierces contradictoires) | https://www.brevo.com/pricing/ (à vérifier par Romain) |
| **Mailjet** (France, groupe Sinch) | 6 000/mois, 200/jour | Essential 19 $ / Premium 29 $ pour 15 000/mois ; **au-delà, prix non affichés** (devis) | https://www.mailjet.com/pricing/ |
| **Amazon SES** (États-Unis, région Europe possible) | pas de quota gratuit affiché ; crédits de 200 $ pour un nouveau compte AWS | 0,10 $ / 1 000 emails ; IP dédiée 24,95 $/mois en option | https://aws.amazon.com/ses/pricing/ |
| **Scaleway TEM** (France, Paris) | 300/mois | 0,25 € / 1 000 (sans abonnement) ; Scale 80 €/mois = 100 000 + 0,20 € / 1 000 ; quota par défaut 10 000/mois, relevable sur demande | https://www.scaleway.com/en/pricing/managed-services/ (page bloquée par notre outil ; chiffres relevés via https://www.scaleway.com/fr/transactional-email-tem/ et la doc https://www.scaleway.com/en/docs/transactional-email/reference-content/tem-capabilities-and-limits/) |

## 5. Coût mensuel total et par commerce

Calculs faits à partir des tarifs ci-dessus (hors TVA). « n.v. » = non vérifié.

| Commerces | Resend | Amazon SES | Scaleway TEM | Brevo | Mailjet |
|---|---|---|---|---|---|
| 10 (10 000) | 20 $ (Pro) → **2,00 $/commerce** | 1 $ → 0,10 $ | 2,43 € → 0,24 € | n.v. | 19 $ (Essential 15 000) → 1,90 $ |
| 50 (50 000) | 20 $ (Pro) → **0,40 $** | 5 $ → 0,10 $ | 12,43 € → 0,25 € | n.v. | n.v. (devis) |
| 100 (100 000) | 35 $ (Pro) → **0,35 $** | 10 $ → 0,10 $ | 24,93 € → 0,25 € | n.v. | n.v. |
| 500 (500 000) | 350 $ (Scale) → **0,70 $** | 50 $ → 0,10 $ | 124,93 € → 0,25 € | n.v. | n.v. |

Remarques :
- Resend Pro limite à 10 domaines : suffisant, car tout part de `flowin.events`.
- À 500 commerces, Resend Pro + dépassement (35 $ + 400 × 0,90 $ = 395 $) coûte plus que Scale
  (350 $) : passer en Scale.
- SES et Scaleway sont les moins chers mais demandent plus de réglages (et SES une validation de
  sortie du « bac à sable » par Amazon).

## 6. Conditions communes à tous les services

1. **Domaine d'envoi vérifié** (obligatoire partout) : ajouter dans le DNS de `flowin.events` les
   enregistrements **SPF**, **DKIM** et **DMARC** donnés par le service. Sans cela : rien n'est
   livré (Resend) ou tout finit en spam. Depuis 2024, Gmail et Yahoo exigent SPF/DKIM/DMARC et un
   lien de désinscription en un clic pour les gros expéditeurs.
2. **Délivrabilité** : séparer les emails de service (tickets, bons de commande) des annonces
   (marketing) — idéalement un sous-domaine pour les annonces (ex. `news.flowin.events`), pour
   qu'une annonce signalée en spam ne bloque pas les tickets. Monter les volumes progressivement.
3. **RGPD** : n'envoyer d'annonces qu'aux joueurs ayant coché « rester en contact » (consentement
   déjà stocké), lien de désinscription dans chaque annonce. Hébergement : Scaleway, Brevo et
   Mailjet sont européens ; Resend et SES sont américains (SES propose une région Europe ;
   l'option région Europe de Resend n'a pas été vérifiée ici). Un contrat de sous-traitance
   (DPA) est à signer avec le service retenu.

## 7. Recommandation

**Resend Pro (20 $/mois), avec le domaine `flowin.events` vérifié.**
- Pourquoi : déjà utilisé par les 7 fonctions ; il suffit de changer un réglage (`NOTIFY_FROM`),
  aucune réécriture. Pas de plafond journalier en payant.
- Coût : 20 $/mois jusqu'à 50 commerces (0,40 $ par commerce à 50), 35 $ jusqu'à 100, offre
  Scale au-delà (environ 0,70 $ par commerce à 500).
- Plus tard, si le RGPD « hébergé en Europe » devient un argument de vente ou si le volume
  dépasse 200 commerces : passer à Scaleway TEM (~0,25 € par commerce).

### Étapes pour basculer (à faire par Romain, ou avec lui)
1. Dans Resend : Domains → Add domain → `flowin.events` (et `news.flowin.events` pour les annonces).
2. Copier les enregistrements SPF, DKIM (et MX de retour) dans le DNS du domaine ; ajouter un
   DMARC `p=none` au départ. Attendre « Verified ».
3. Passer le compte Resend en Pro.
4. Dans Supabase → Edge Functions → Secrets : `NOTIFY_FROM` = `Flowin <[adresse à choisir]@flowin.events>`
   et `NOTIFY_FROM_ADDR` = même adresse.
5. Envoyer un test vers une adresse Gmail et une Outlook qui ne sont pas celles du compte.
6. Supabase Auth : garder Brevo (ou passer sur le SMTP Resend `smtp.resend.com`) avec le même
   domaine vérifié, pour que les emails de connexion ne soient plus limités à 300/jour.
7. Annonces des commerces : à construire (n'existe pas aujourd'hui), avec désinscription.
