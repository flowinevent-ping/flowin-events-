# KIT PROSPECTION — NUITS DU SUD 2026 (Flowin)

> Regroupé le 21/06/2026. Offres, email, phoning, CGV, facture, partenaires officiels — tout au même endroit.
> Festival : 9–18 juillet 2026, Place du Grand Jardin, Vence (06140). Éditeur : OPConsult / BAITA EURL (« Flowin »), Vence.
> Contact : romain@flowin.events · flowinevent@gmail.com

---

## 1. LES 3 OFFRES (prix HT — source CGV en base)

| Offre | Prix HT | Lot mis en jeu | Ce que ça inclut |
|---|---|---|---|
| **Visibilité** | **590 €** | 90 € bon d'achat | Apparition liste partenaires + accès à vos contacts/réseaux depuis le jeu |
| **Animation** ⭐ *le plus choisi* | **1 490 €** | 159 € bon d'achat | Visibilité + les joueurs cumulent des tickets **chez vous** + mise en avant carte du parcours + reporting de passage |
| **Sponsor** | **3 590 €** | 259 € bon d'achat | Animation + présence tous supports/stations + bandeau défilant de l'app + lot RSE du festival |

Paiement en ligne **OFF**. Facture émise **à la validation du bon de commande** (virement, à réception).

---

## 2. EMAIL DE PROSPECTION

**Objet :** Faites venir les festivaliers des Nuits du Sud dans votre commerce (9–18 juillet)

Bonjour [Prénom / Enseigne],

Du 9 au 18 juillet, les Nuits du Sud rassemblent des milliers de festivaliers Place du Grand Jardin. Avec **Flowin**, le jeu officiel du parcours partenaires, ces visiteurs passent **chez les commerçants de Vence** pour gagner des lots.

Le principe est simple : un QR, un mini-jeu, et le festivalier cumule des tickets **dans votre boutique**. Vous gagnez en passage, en visibilité et en contacts qualifiés — sans rien gérer techniquement.

Trois formules selon votre objectif :
- **Visibilité — 590 € HT** : votre commerce listé dans le jeu + vos liens/réseaux mis en avant.
- **Animation — 1 490 € HT** *(le plus choisi)* : les joueurs viennent cumuler des tickets chez vous, vous êtes sur la carte du parcours, et vous recevez un reporting de passage.
- **Sponsor — 3 590 € HT** : présence sur tous les supports + bandeau de l'app + lot RSE du festival.

Chaque formule met un bon d'achat en jeu (90 / 159 / 259 €) que les festivaliers viennent retirer chez vous.

Je peux vous montrer le dispositif en 10 minutes. Quelles disponibilités cette semaine ?

Bien à vous,
Romain Collin — Flowin
romain@flowin.events · [téléphone]

---

## 3. SCRIPT PHONING

**Accroche (10 s)**
« Bonjour, Romain de Flowin — on opère le jeu officiel du parcours partenaires des Nuits du Sud cette année. Je vous appelle parce que le festival amène des milliers de visiteurs à Vence du 9 au 18 juillet, et on a un dispositif pour les faire passer chez vous. Vous avez deux minutes ? »

**Le problème qu'on règle**
« Pendant le festival, le monde est sur la place, pas forcément dans les commerces. Nous, on déplace ce flux : les festivaliers jouent via un QR et cumulent des tickets directement dans votre boutique. »

**Les 3 formules (laisser choisir)**
- « La plus prise, c'est **Animation à 1 490 € HT** : les joueurs viennent chez vous, vous êtes sur la carte du parcours, et vous recevez un reporting de passage. »
- « Si vous voulez juste être visible : **Visibilité, 590 € HT**. »
- « Si vous voulez tout, marque + bandeau de l'app + lot RSE : **Sponsor, 3 590 € HT**. »
- « Chaque formule met un bon d'achat en jeu (90 / 159 / 259 €) que les gagnants viennent retirer chez vous. »

**Objections**
- *« C'est cher »* → « C'est le prix d'une demi-page de pub locale, mais ici vous payez pour du **passage réel mesuré**, pas une affiche. Et vous récupérez les contacts qui ont opté pour vos infos. »
- *« Je n'ai pas le temps »* → « Justement, vous n'avez rien à gérer : on fournit le QR et le jeu, vous affichez, c'est tout. »
- *« Je réfléchis »* → « Je vous envoie le bon de commande, vous le signez quand vous voulez, la facture ne part qu'à la validation. Je vous mets quelle formule en pré-rempli ? »

**Closing**
« Je vous envoie le bon de commande pour **[formule]** par mail aujourd'hui. Vous me confirmez l'enseigne exacte et l'adresse mail ? »

---

## 4. MESSAGE EMAIL DE RELANCE (court)

**Objet :** On garde votre place sur le parcours NDS ?

Bonjour [Prénom],
Suite à notre échange : je vous joins le bon de commande **[formule]** pour le parcours partenaires des Nuits du Sud. Rien à payer en ligne — la facture part seulement à la validation. Il reste quelques emplacements sur la carte du parcours, je préfère vous prévenir. Je le garde au chaud jusqu'à [date] ?
Romain — Flowin

---

## 5. CGV (source : table `documents_legaux` / `cgv-nds-2026`, statut **draft**)

> ⚠️ BROUILLON — à faire valider par un juriste avant publication.
> Les CGV existent **en base uniquement** : pas encore affichées dans le dashboard ni liées dans le bon de commande.
> RESTE À CÂBLER (code) : case « j'accepte les CGV » + lien dans le bon de commande avant signature, + affichage dashboard.

Texte intégral conservé en base (11 articles) :
1. Parties · 2. Objet · 3. Offres et prix HT (590/1490/3590, lots 90/159/259) · 4. Commande (ferme à signature, vaut acceptation CGV) · 5. Facturation/paiement (pas de paiement en ligne, facture à validation, virement) · 6. Obligations Partenaire (lot + diffusion QR + honorer les lots) · 7. Obligations Flowin (mise en œuvre + indicateurs) · 8. RGPD (opt-in) · 9. Responsabilité (obligation de moyens) · 10. Résiliation (prorata) · 11. Droit applicable (français).

---

## 6. FACTURE & BON DE COMMANDE

- Bon de commande / proforma remplissable + signable : `admin/public/bon-achat-template.html` + flux dashboard.
- À la validation/signature → trigger **`trg_bon_commande_chain`** (idempotent) : crée le partenaire + `crm_retours` + **la facture**.
- Notification : Edge Function `notify-bon-commande` → mail via Resend (domaine `flowin.events` à vérifier pour sortir du spam).
- À CÂBLER : lien CGV + case d'acceptation dans le bon de commande (cf. §5).

---

## 7. PARTENAIRES OFFICIELS NDS 2026 (sourcés site nuitsdusud.com)

Inscrits en base `prospection` (note = « partenaire officiel NDS 2026 … »), contacts à compléter (non inventés) :

| Enseigne | Type | Priorité |
|---|---|---|
| Le Goût du Vin (Vence) | Caviste / Vin | haute *(déjà présent)* |
| Malongo | Café / Torréfacteur | haute |
| Le Mensuel | Presse / Média | moyenne |
| La Vague | Presse / Média | moyenne |
| ICI Azur | Média / Radio | moyenne |
| Radio Nova | Média / Radio | basse |
| Rock en Seine | Production / Prog | basse |

Contact central festival (public) : `nuitsdusud@ville-vence.fr` · 04 93 58 40 17 · organisé par la Ville de Vence.
7 logos partenaires supplémentaires sur le site sont des images sans nom lisible → non inventés, à identifier visuellement.

---

## 8. ÉTAT PROSPECTION (base `prospection`, 21/06)

- **1 450 lignes** · tél : 1 420 ✅ · **email : 394 seulement → 1 056 sans email** (gros trou) · Vence : 78.
- Le trou réel = **emails**. C'est un travail de volume (sourcing par enseigne sur PagesJaunes/Maps/annuaire-entreprises) — à dérouler par lots, pas faisable en une passe.
- Prochain lot recommandé : Vence en entier (toutes catégories) → Cagnes → La Colle → Tourrettes → St-Jeannet → Carros → Antibes ; + compléter les emails.
