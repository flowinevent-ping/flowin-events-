# 🔄 REPRISE COMPLÈTE — Session Flowin / NDS 2026 · 02/07/2026

> Document autonome. Il permet de **reprendre exactement où on en est**, sans rien reperdre,
> même si le fil de conversation a disparu de l'appli. Tout le travail est persistant :
> **GitHub** (repo) · **Supabase** (base + `handoff_notes`) · **Notion** (hub Comm).

## ▶️ BOOTSTRAP pour reprendre (nouvelle conversation)
1. `git clone https://x-access-token:<PAT>@github.com/flowinevent-ping/flowin-events-.git`
   (PAT fine-grained Contents R/W, identité commits : `romain@flowin.events` / "Romain Collin")
2. Supabase project `ywcqtupgoxfzkddqkztk` · vérif `select 1` · mémoire machine = table `handoff_notes`, clé `handoff-nds-2026-comm`
3. Notion hub Comm : `38c6dcca-9add-81dd-9af2-c93139e06393`
4. Lire ce fichier + `HANDOFF-flowin-nds2026.md`. Garde-fou : `python3 admin/public/nds/visuels-src/verify-supports.py`
   (prérequis env : `ln -sfn <repo> /home/claude/repo` ; QR stations dans `/home/claude/vid/qr/` ; polices Manrope/Anton)

## ✅ ÉTAT ACTUEL (fait & poussé aujourd'hui)
**Partenaires = 8** (source unique `nds_lib.PARTNERS`) :
bergerie, **pegase→"Auto-École de l'ARA"**, utile, carrosserie-gp, giordano, charvolin, nook, **cycles963**.
Retirés (archivés en base, réversibles) : **VIP Coiffure, DEKRA, À la Fût**.

- **Vidéo lancement 9×16** (`nds-lancement-jeux-9x16.mp4`) re-rendue aux 8 : Flash sans e, intro agrandie,
  bandeau « plus tu joues », scène Où jouer en pastilles, logos agrandis, **QR centré → ev-nds-ecrans**.
- **Vidéo écran 8-partenaires** régénérée aux 8 (QR 8/8). Forex + montage + **A4 design X** (« STATION JEUX »)
  régénérés aux 8. Logo **ARA** (PDF→pegase.png), **Nook agrandi** (rogné).
- **Cycles 963** : station `ev-nds-cycles963` + fiche `pt-cycles963` (102 av. Henri Giraud Vence, 06 34 64 47 16,
  Cycles963@gmail.com). Lot : 1 journée location vélo 45€ ×5, non cumulable, validité 4 mois, dès 2 jours.
- **Fiche pro / onglet Élément comm** : réutilise affiche+QR, vidéo, tickets (n° série+gagnant), kit, communs.
  AJOUT : **bloc unique éditable montant/conditions** propagé aux tickets (`saveTicketBloc`, lit `partenaires.lots`).
- **CRM `/bons-commande-liste.html`** : liste de tous les bons + factures, filtre, **génération facture FAC-2026-XXXX**.
  Branché onglet BC + fiche pro. Bons créés : Charvolin `FL-2026-0001` (1590€), Nook `FL-2026-0002`.
- **Garde-fou** `verify-supports.py` : cohérence source↔logos↔QR (physique/digital)↔A4. Cache dashboard bumpé.
- Cockpit parallèle `gestion-diffusion.html` **supprimé** (c'était un doublon).

## ⚠️ PROBLÈME DE FOND
`pros` (17) et `partenaires` (11) = **2 tables séparées SANS lien**. D'où la confusion pro/partenaire.
Décision attendue : **fusionner** (une table pro qui peut être partenaire d'un event) OU **relier** (partenaire→pro_id).

## ⏳ RESTE À FAIRE (priorisé)
1. `bon-commande-nds.html` : supporter `?id=` pour **ouvrir/éditer/imprimer** un bon ou une facture existant.
2. **Unifier pros ↔ partenaires** (décision archi ci-dessus).
3. **Dossiers** : global *Nuits du Sud* (A4 + forex caisses 1/2/3 + bars 1/2/3 + vidéo écran + vidéo réseaux)
   + par pro (vidéo réseaux à **QR digital usage unique** + A4 + fiche **A5** comptoir + **A2/A3**).
   Règle QR : physique/écran → **station jeux** ; FB/Insta/digital → **station NDS usage unique**
   + **message d'accueil/fin dans la webapp** (invite à regagner commerces/festival).
4. **Kit digital** (section) + **CGV** + **RÈGLEMENT DE JEU** (n'existe pas — `documents_legaux` = CGV seule ;
   à rédiger + validation juriste ; audit des 7 points déjà fait).
5. **RLS** : autoriser écriture anon sur `partenaires` (bloc tickets) + `bons_commande` (génération facture).

## 🧾 DERNIERS COMMITS
Voir `git log`. HEAD au moment de ce doc : commit de handoff `14ce60f` (+ ce fichier).
