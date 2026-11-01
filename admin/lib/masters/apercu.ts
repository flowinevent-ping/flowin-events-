/**
 * Adresses d'apercu des masters, partagees par l'espace pro, le Super Admin
 * (ParcoursMobil, ApercuJeu, /dashboard/jeux) : toutes pointent vers /jouer.
 * Nuits du Sud (nds2026) et Quiz Master ne sont pas des masters : ils gardent
 * leur parcours /parcours/<module>.
 */
export const MODULES_MASTER = ['quiz', 'quizsolo', 'spin', 'tombola', 'vote'] as const
export const estModuleMaster = (m: string | null | undefined): boolean => !!m && (MODULES_MASTER as readonly string[]).indexOf(m) >= 0

/** Ecrans proposes dans les pastilles d'apercu (comme le storyboard des maquettes). */
export const ECRANS_APERCU: { id: string; t: string; jeu: (m: string) => string }[] = [
  { id: 's-accueil', t: 'Accueil', jeu: () => 's-accueil' },
  { id: 's-regles', t: 'Règles', jeu: () => 's-regles' },
  { id: '@jeu', t: 'Jeu', jeu: m => (m === 'spin' ? 'r-roue' : m === 'tombola' ? 't-tirer' : m === 'vote' ? 'v-choix' : 'q-question') },
  { id: 'c-parrainage', t: 'Parrainage', jeu: () => 'c-parrainage' },
  { id: 'c-inscription', t: 'Coordonnées', jeu: () => 'c-inscription' },
  { id: 'c-ticket', t: 'Ticket', jeu: () => 'c-ticket' },
  { id: 'c-partenaires', t: 'Partenaires', jeu: () => 'c-partenaires' },
  { id: 'c-profil', t: 'Profil', jeu: () => 'c-profil' },
]

export function urlApercuMaster(o: { evId?: string; master?: string; superEventId?: string | null; ecran?: string; saisie?: string }): string {
  const q: string[] = []
  if (o.superEventId) q.push('se=' + encodeURIComponent(o.superEventId))
  else if (o.evId) q.push('ev=' + encodeURIComponent(o.evId), 'preview=1')
  else if (o.master) q.push('m=' + encodeURIComponent(o.master))
  q.push('sb=1')
  if (o.ecran && !o.superEventId) q.push('s=' + encodeURIComponent(o.ecran))
  if (o.saisie) q.push('apercu=' + o.saisie)
  return '/jouer?' + q.join('&')
}

/** Titres lisibles des ecrans (storyboard des maquettes). */
export const TITRES_ECRANS: Record<string, string> = {
  's-flash': 'Premier flash', 's-accueil': 'Jouer et gagner', 's-regles': 'Règles du jeu',
  'q-question': 'Question (chrono 30 s)', 'q-bonne': 'Bonne réponse', 'q-mauvaise': 'Mauvaise réponse', 'q-resultat': 'Résultat',
  'q-bonusintro': 'Questions bonus : l’appel', 'q-bonus': 'Questions bonus', 'q-bonusok': 'Bonus validé : +1 ticket',
  'r-roue': 'La roue', 'r-tourne': 'La roue tourne', 'r-gain': 'Case gain immédiat', 'r-ticket': 'Case ticket tirage', 'r-perdu': 'Case « Pas cette fois »',
  't-tirer': 'Tirer mon ticket', 't-impression': 'Le ticket s’imprime', 't-res-tirage': 'Résultat : ticket au tirage', 't-res-instant': 'Résultat : ticket gagnant',
  'v-choix': 'Choix du vote', 'v-envoi': 'Le vote s’enregistre', 'v-resultat': 'Merci et loterie',
  'v2-carte': 'Vitrines : la carte', 'v2-flash': 'Vitrine flashée', 'v2-sondage': 'Ticket et sondage',
  'c-parrainage': 'Parrainage (avant les coordonnées)', 'c-inscription': 'Coordonnées', 'c-billet': 'Gain immédiat : billet QR', 'c-ticket': 'Ticket pour le tirage',
  'c-profil': 'Mon profil', 'c-connexion': 'Connexion et mot de passe', 'c-raccourci': 'Raccourci iPhone', 'c-raccourci-a': 'Raccourci Android',
  'c-commerces': 'Commerces : liste', 'c-carte': 'Commerces : carte', 'c-fiche': 'Fiche commerce', 'c-partenaires': 'Partenaires et sponsors', 'c-fichepart': 'Fiche partenaire',
  'c-demain': '« Reviens demain ! »', 'c-digital': 'Pop-up lien digital', 'm-code': 'Commerçant : code pro', 'm-valider': 'Commerçant : valider le retrait', 'm-ok': 'Commerçant : retrait validé',
  'sj-accueil': 'Accueil du super event', 'sj-carte': 'Carte des stations', 'sj-station': 'Station validée : BOUM', 'sj-encours': 'Événements en cours', 'sj-tickets': 'Mes super tickets',
}
