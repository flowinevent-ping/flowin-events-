/**
 * Feuille de route — SOURCE UNIQUE.
 *
 * Ce contenu est editorial : il n a pas de table derriere lui, il se met a jour ici et
 * nulle part ailleurs. La date `MAJ` est la date de derniere revue REELLE du contenu,
 * pas la date du dernier deploiement : une feuille de route qui se date toute seule
 * ment sur sa propre fraicheur.
 */

export type EtatItem = 'ok' | 'hold' | 'todo'

export interface ItemRoadmap {
  etat: EtatItem
  titre: string
  detail?: string
}

export interface BlocRoadmap {
  titre: string
  items: ItemRoadmap[]
}

export const MAJ = '30/08/2026'

export const LIBELLE_ETAT: Record<EtatItem, string> = {
  ok: '✓ Fait',
  hold: '⏸ En attente',
  todo: '○ À faire',
}

export const BLOCS: BlocRoadmap[] = [
  {
    titre: 'Opérationnel NDS 2026 — envoi aux partenaires',
    items: [
      { etat: 'ok', titre: 'Liste des gagnants par commerce', detail: 'Fiche partenaire → Gagnants & billets' },
      { etat: 'ok', titre: 'Billets avec nom + QR de validation', detail: '/nds/billets-partenaires.html, filtrable' },
      { etat: 'ok', titre: 'Procédure de validation en caisse', detail: "Intégrée au billet et à l'email" },
      { etat: 'ok', titre: 'Déstockage automatique au scan', detail: 'valider_lot consomme 1 unité de lots_stock' },
      { etat: 'ok', titre: 'Double authentification', detail: 'QR du billet + numéro saisi par le commerçant' },
      { etat: 'ok', titre: "Pack d'envoi complet par partenaire", detail: "Fiche partenaire → Emails & com" },
      { etat: 'ok', titre: '3 emails types éditables par partenaire', detail: 'Annonce jeu · lot gagné · liste gagnants' },
    ],
  },
  {
    titre: 'Dashboard — ergonomie',
    items: [
      { etat: 'ok', titre: 'Fiche partenaire en 6 onglets sans doublon', detail: 'Infos · Stats · Lots & stock · Gagnants & billets · Emails & com · Contrat' },
      { etat: 'ok', titre: 'Stock et gagnants rattachés à chaque partenaire' },
      { etat: 'ok', titre: 'Sidebar en sous-onglets repliables', detail: 'Ouverture automatique du groupe actif' },
      { etat: 'ok', titre: 'Dates events corrigées', detail: 'Statut déduit des dates, ordre En cours › À venir › Passés' },
      { etat: 'ok', titre: 'Places de concert visibles par soirée', detail: 'Fin du filtre par date piégeux' },
      { etat: 'ok', titre: 'Filtres anti-scroll sur les grandes listes', detail: 'Recherche, type, statut, date, lot, pagination' },
    ],
  },
  {
    titre: 'Comptage et mesure',
    items: [
      { etat: 'ok', titre: 'Source unique et opposable des chiffres', detail: 'super_event_chiffres : chiffres déjà bornés, valeurs interdites à la publication listées' },
      { etat: 'ok', titre: 'Rapport détaillé par point de jeu', detail: 'Station ou partenaire : flashs, lien unique, parties, joueurs, coordonnées, opt-in, bonus' },
      { etat: 'ok', titre: 'Dépouillement des questions bonus', detail: 'Libellés réels résolus depuis la banque, jamais de code brut' },
      { etat: 'ok', titre: 'Questionnaire de la landing dépouillé', detail: 'Canal distinct du bonus en jeu, jamais additionné sans le dire' },
      { etat: 'todo', titre: 'Marqueur par question du quiz', detail: '47 % des joueurs abandonnent dans le quiz sans qu\u2019on sache à quelle question' },
      { etat: 'ok', titre: 'Ventilation des répondants bonus par point corrigée', detail: '29/08 : cause reelle differente de l\u2019hypothese initiale -- pas un desalignement event_id mais un bornage de date manquant sur 2 RPC (super_event_rapport_points, super_event_bonus_resultats), laissant fuiter des reponses de test hors festival. Corrige : total 321 -> 302 repondants reels.' },
    ],
  },
  {
    titre: 'Refonte — modèle une seule entité',
    items: [
      { etat: 'todo', titre: 'Supprimer la distinction Pro / Partenaire', detail: 'Un pro est un professionnel ; partenaire est un rôle sur un super event' },
      { etat: 'todo', titre: 'Socle commun de fiche', detail: 'Infos · point carte · QR · com & kit, indépendants de tout event' },
      { etat: 'todo', titre: 'Sous-onglet cloisonné par super event', detail: 'Lots, gagnants, stock, billets, emails, facturation propres à chaque super' },
      { etat: 'todo', titre: 'Déparamétrer NDS codé en dur', detail: 'se-nds-2026 est encore figé à plusieurs endroits' },
      { etat: 'todo', titre: 'Création de stations de jeu par pro' },
    ],
  },
  {
    titre: 'Automatisation des envois',
    items: [
      { etat: 'ok', titre: 'Envois devis, factures, listes gagnants et billets vers les pros/partenaires', detail: 'Liens Gmail pre-remplis (mailPartenaireUrl, flowinMailGagnant), utilises en production sur PartenaireDrawer, CRM Landing, CRM Retours, BtoB Prospects' },
      { etat: 'ok', titre: 'Emails aux gagnants (annonce lot + billet)', detail: 'Meme mecanisme, deja envoye en prod' },
      { etat: 'hold', titre: 'Email de remerciement en masse aux ~840 joueurs', detail: 'Le mecanisme Gmail pre-rempli marche 1 par 1 (gagnants, quelques pros) -- pas exploitable pour un envoi en masse a tous les joueurs. En attente d\u2019un vrai connecteur emailing (API/service d\u2019envoi en masse), pas d\u2019un connecteur emailing en general (qui existe deja pour les envois unitaires).' },
      { etat: 'todo', titre: 'PDF du billet en pièce jointe', detail: 'Le mail actuel envoie un LIEN vers le billet, pas un PDF attache -- limite technique des liens mailto/Gmail compose (ne peuvent pas joindre de fichier)' },
      { etat: 'todo', titre: 'Envoi automatise sans etape humaine', detail: 'Aujourd\u2019hui, un humain doit ouvrir Gmail et cliquer Envoyer a chaque fois -- domaine expediteur a verifier avant tout envoi serveur-a-serveur' },
    ],
  },
  {
    titre: 'Technique',
    items: [
      { etat: 'ok', titre: 'Migration du monolithe vers Next.js', detail: '29 vues sur 31 portées, monolithe intact en production' },
      { etat: 'todo', titre: 'Porter le wizard de création d\u2019événement', detail: 'Chemin d\u2019écriture critique : à cadrer avant duplication' },
      { etat: 'todo', titre: 'Durcissement sécurité', detail: "Séparer la clé d'administration de la clé anon, RLS avancé" },
      { etat: 'todo', titre: 'Contrôle serveur de l\u2019anti-rejeu du lien unique', detail: 'Aujourd\u2019hui dans le navigateur : ne bloque pas, ne s\u2019applique pas' },
      { etat: 'todo', titre: 'Généricité super-event', detail: 'Cloner NDS à blanc pour un autre festival' },
      { etat: 'ok', titre: 'Hygiène de base', detail: 'Tables Revision Olivia migrees vers leur propre projet Supabase le 28/08 (moloagrmhrptbhodwwob) -- verifie le 30/08 : plus aucune table Revision dans le projet NDS partage.' },
    ],
  },
  {
    titre: 'Dashboard SA — chantiers identifiés, priorité basse (à faire en dernier)',
    items: [
      { etat: 'todo', titre: 'CRM : clic sur une ligne (Super Event, Pro) doit ouvrir une fiche complète', detail: 'Descriptif organisateur, dates, etc. — au-dela du simple tri/clic deja en place' },
      { etat: 'ok', titre: 'Wizard "Nouvel événement" (SA) : icônes et modules alignés sur le wizard pro', detail: 'Les 6 modules (dont quizmaster/quizsolo, exclusifs SA) étaient déjà présents. Icônes SVG désormais identiques au wizard pro (cercle/forme + trait dans carré arrondi teinté) au lieu de simples emojis.' },
      { etat: 'todo', titre: 'Harmoniser visuellement les 8 outils HTML autonomes', detail: 'bons-commande-liste.html, facture-nds.html, tirage-nds.html, plaquette-nds.html, pitch-nds.html, flowin-partenaire-presentation.html, nds-visuels.html, kit-digital -- chacun a sa propre charte graphique, aucun ne suit sa-*. Piste retenue : bandeau d\\u2019en-tete coherent, pas une reecriture complete (outils metier reels, risque a rester prudent)' },
      { etat: 'todo', titre: 'Tirage au sort : scoper par event / super event', detail: 'Module actuel pas clairement filtrable par event ou super event' },
      { etat: 'todo', titre: 'Module d\\u2019envoi en masse (emailing)', detail: 'Distinct des envois unitaires deja fonctionnels (devis/factures/gagnants) -- necessaire pour un message aux ~840 joueurs' },
    ],
  },
  {
    titre: 'Espace Pro — lots & visibilité (18/09, à cadrer)',
    items: [
      { etat: 'ok', titre: 'Crédit / débit manuel des lots', detail: 'Déjà livré : /pro/compte → onglet "Lots & stock" (lib/stock.ts, AjustementStock). Pas visible depuis "Mes données" -- c\\u2019est ce qui a fait dire à Romain que rien n\\u2019existait.' },
      { etat: 'ok', titre: 'Liste des gagnants + code PIN de validation', detail: 'Déjà livré : /pro/donnees → onglet "Gagnants & tirage" ; PIN affiché sur la fiche partenaire (PartenaireDrawer, onglet Gagnants). Pas de raccourci rapide depuis "Mes données".' },
      { etat: 'todo', titre: 'Décision à prendre : sortir "Lots & stock" de Mon profil', detail: 'Romain (18/09) : "doit-on séparer la gestion des lots du profil de l\\u2019entreprise, pour la rendre visible et accessible rapidement ?" -- si oui, la ranger dans "Mes données" aux côtés de CRM/Gagnants/Trafic, présentée en tableau par opération (même registre que ListeFactures.tsx), avec le crédit/débit et le code PIN visibles directement, pas seulement depuis Mon profil.' },
      { etat: 'todo', titre: 'Compteur de visibilité (logo / fiche vus, pas seulement cliqués)', detail: 'Romain (18/09) : "le nombre de fois où la page ou le logo a pu être visible" -- argument commercial pour les annonceurs (trafic organique). N\\u2019existe pas : le tracking actuel compte les clics/participations, pas les impressions (affichages sans clic). Nécessite un nouvel événement de tracking, pas un simple affichage de donnée déjà en base.' },
    ],
  },
  {
    titre: 'Branchement Jeffrey CRM — numérotation légale OPConsult (18/09, à cadrer)',
    items: [
      { etat: 'ok', titre: 'Schéma Jeffrey CRM lu et confirmé', detail: 'Projet Supabase pxqeelvavgzfyrwtgmib (accès direct depuis cette session, contrairement à ywcqtupgoxfzkddqkztk). Tables contacts/devis/factures/frais/documents_contact/reglements_facture, toutes tagguées par une colonne `espace` -- exactement le mécanisme multi-marques attendu. Table `sequences` (cle/valeur) : compteur par espace pour les contacts, GLOBAL tous espaces confondus pour devis/factures -- conforme à la règle légale (numérotation continue au niveau de BAITA EURL, pas par sous-marque). Toutes les tables sont à 0 ligne : rien à migrer, base encore vierge.' },
      { etat: 'ok', titre: 'Préfixes de numérotation validés (18/09)', detail: 'Flowin Event = FL (continuité avec l\\u2019existant, ex. FL-2026-0001 déjà émis en prod -- pas FE ni FLE pour ne pas casser le format des factures déjà émises) · Flowin Révision = FLR · Ping = PING.' },
      { etat: 'todo', titre: 'Valeur exacte de `espace` pour Flowin Event', detail: 'Nécessaire avant tout écrit dans Jeffrey (contacts/devis/factures.espace) : Romain doit confirmer la chaîne exacte (ex. "flowin", "flowin-event"...).' },
      { etat: 'ok', titre: 'Modèle de facture OPConsult vu (screenshots Romain, 18/09)', detail: 'Jeffrey CRM a déjà sa propre présentation de facture, complète et déjà en prod : numérotation FA-2026-00001 / réf. devis / n° contact, en-tête + coordonnées légales OPConsult, tableau de lignes, bloc totaux HT/TVA/TTC, badge "facture acquittée", décompte du dossier (total/déjà facturé/reste à percevoir), conditions de paiement + générales, bloc signature, pied légal SIRET/RCS/TVA conforme, plus un suivi des règlements non imprimé. Bien plus riche que facture-nds.html (pas de décompte, pas de suivi règlements, pas de signature). Conclusion : pas besoin de répliquer ce design dans Flowin.' },
      { etat: 'ok', titre: 'Décision d\\u2019architecture : câblage direct vers les pages Jeffrey CRM', detail: 'Romain (18/09) valide l\\u2019option "câblage direct" plutôt que dupliquer le design Jeffrey dans Flowin : les actions "Voir le bon"/"Voir la facture" côté Flowin pointent vers les pages Jeffrey CRM elles-mêmes (déjà polies, déjà conformes) au lieu de recréer une 2e maquette de facture à maintenir. Jeffrey reste la couche donnée ET présentation pour le document légal ; Flowin garde ses propres écrans (CRM, opérations, ListeFactures) et n\\u2019affiche plus qu\\u2019un lien sortant.' },
      { etat: 'todo', titre: 'Bloqueur confirmé : SSO Vercel sur jeffrey-crm.vercel.app', detail: 'Vérifié via API Vercel (18/09) : le projet jeffrey-crm a ssoProtection.enabled=true, deploymentType="all_except_custom_domains". Les 3 domaines actuels (jeffrey-crm.vercel.app, jeffrey-crm-nextoping.vercel.app, jeffrey-crm-git-main-nextoping.vercel.app) sont tous des sous-domaines vercel.app, donc TOUS protégés par le SSO Vercel de l\\u2019équipe -- un pro externe sans compte dans l\\u2019équipe Vercel de Romain ne peut pas ouvrir un lien direct aujourd\\u2019hui (redirection vers une connexion Vercel). Le câblage direct ne peut pas fonctionner pour un client/pro externe sans l\\u2019un de : (a) un domaine personnalisé sur le projet Jeffrey (non protégé par ce réglage), ou (b) désactiver le SSO pour ce projet, ou (c) une page de partage publique/à jeton côté Jeffyre (lien signé, sans compte). Question posée à Romain, réponse attendue avant tout câblage.' },
      { etat: 'todo', titre: 'Décision d\\u2019architecture globale à confirmer', detail: 'Reste à valider avec Romain : câblage direct confirmé en principe (voir item ci-dessus), mais le mécanisme d\\u2019accès externe (item SSO) doit être tranché avant d\\u2019implémenter quoi que ce soit. Écriture bloquée tant que ce plan n\\u2019est pas explicitement validé -- numérotation légale, pas de place pour l\\u2019improvisation.' },
    ],
  },
]

export function avancement(blocs: BlocRoadmap[] = BLOCS) {
  const items = blocs.flatMap(b => b.items)
  const fait = items.filter(i => i.etat === 'ok').length
  return {
    total: items.length,
    fait,
    restant: items.length - fait,
    pct: items.length ? Math.round((100 * fait) / items.length) : 0,
  }
}
