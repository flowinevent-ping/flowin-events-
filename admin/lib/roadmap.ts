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
      { etat: 'hold', titre: 'Email de remerciement aux joueurs', detail: 'En attente du connecteur emailing' },
      { etat: 'todo', titre: 'Connecteur emailing depuis le dashboard' },
      { etat: 'todo', titre: 'PDF du billet en pièce jointe' },
      { etat: 'todo', titre: 'Envoi réel automatisé', detail: 'Domaine expéditeur à vérifier' },
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
