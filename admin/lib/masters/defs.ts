/**
 * MASTERS DE JEUX — les 5 jeux + l'univers super event, valeurs par defaut.
 *
 * Reprises a l'identique des maquettes validees (scratchpad/maquettes-jeux) :
 * memes textes, memes exemples. Les noms d'exemple portent tous « Exemple » ;
 * aucune coordonnee, aucun numero, aucun lien n'est invente (placeholders
 * « [… à compléter] »).
 *
 * Ces valeurs sont le niveau le plus bas de la cascade (lib/masters/resolve.ts) :
 * le Super Admin peut les modifier (table jeux_masters), chaque animation
 * peut ensuite les personnaliser (events.cfg.master.perso).
 */
import type { DefinitionMaster, LotAffiche, MasterId, CleJeu } from './types'

export function L(type: LotAffiche['type'], big: string, small: string, nom = '', cond = '', mode: LotAffiche['mode'] = 'tir'): LotAffiche {
  return { type, big, small, nom, cond, mode }
}

const PARRAIN_TICKET = 'Chaque ami qui s\'inscrit = 1 ticket de plus pour toi.'

export const MASTERS: Record<MasterId, DefinitionMaster> = {
  quiz: {
    id: 'quiz', cle: 'quiz', module: 'quiz', nom: 'Quiz + bonus', prefixe: 'PQ',
    description: '3 questions (3/3 = 1 ticket), puis 4 questions bonus (+1 ticket) et le parrainage (+1 ticket).',
    theme: 't-quiz', couleur: '#3B5CC4',
    defauts: {
      commerce: { nom: 'Boulangerie Exemple', activite: 'Boulangerie (texte d\'exemple).' },
      achat: 'sans',
      tirageDate: '30 novembre 2026',
      lots: [L('produit', '1', 'panier', 'Un panier gourmand', 'Tiré au sort parmi les tickets', 'tir'), L('bon', '20', '€', 'Bon d\'achat de 20 €', 'Tiré au sort parmi les tickets', 'tir')],
      how: [['Flashe le QR en boutique', 'Une partie par jour et par commerce'], ['Réponds aux 3 questions', '3/3 = 1 ticket pour le tirage'], ['Questions bonus et parrainage', 'Chacun = 1 ticket de plus']],
      accueilSous: '3 questions, des tickets à gagner',
      parrain: PARRAIN_TICKET,
      questions: [
        { txt: 'Avec quelle farine fait-on une baguette de tradition française ?', opts: ['Farine de blé', 'Farine de seigle', 'Farine de maïs', 'Farine de riz'], ok: 0, expl: 'La baguette de tradition française est faite de farine de blé, d\'eau, de sel et de levain ou de levure, sans additif.' },
        { txt: 'Quel ingrédient fait lever la pâte à pain ?', opts: ['Le sel', 'La levure ou le levain', 'Le sucre', 'L\'eau'], ok: 1, expl: 'La levure (ou le levain) fait fermenter la pâte, qui lève.' },
        { txt: 'Combien de temps faut-il, au minimum, pour cuire une baguette ?', opts: ['5 minutes', 'Environ 20 minutes', '1 heure', '2 heures'], ok: 1, expl: 'Une baguette cuit en général une vingtaine de minutes dans un four très chaud.' },
      ],
      bonus: [
        { label: 'Tu viens chez nous…', opts: ['Chaque jour', 'Chaque semaine', 'De temps en temps', 'Première fois'] },
        { label: 'Ce que tu préfères ?', opts: ['Le pain', 'Les viennoiseries', 'Les pâtisseries', 'Les sandwichs'] },
        { label: 'Tu aimerais qu\'on propose…', opts: ['Des ateliers', 'Des produits bio', 'Du snacking', 'Des créations de saison'] },
        { label: 'Ton moment pour venir ?', opts: ['Le matin', 'Le midi', 'L\'après-midi', 'Le soir'] },
      ],
    },
  },
  quizsolo: {
    id: 'quizsolo', cle: 'solo', module: 'quizsolo', nom: 'Quiz solo', prefixe: 'QS',
    description: 'Le même quiz, sans questions bonus : 3 questions, 3/3 = 1 ticket, +1 ticket par ami parrainé.',
    theme: 't-solo', couleur: '#8E3B6E',
    defauts: {
      commerce: { nom: 'Librairie Exemple', activite: 'Librairie (texte d\'exemple).' },
      achat: 'avec',
      tirageDate: '30 novembre 2026',
      lots: [L('bon', '20', '€', 'Bon d\'achat de 20 €', 'Tiré au sort parmi les tickets', 'tir'), L('service', '3', 'romans', 'Un coffret de 3 romans', 'Tiré au sort parmi les tickets', 'tir')],
      how: [['Flashe le QR en boutique', 'Après ton achat, une partie par jour'], ['Réponds aux 3 questions', '3/3 = 1 ticket pour le tirage'], ['Parraine tes amis', 'Chaque ami inscrit = 1 ticket de plus']],
      parrain: PARRAIN_TICKET,
      questions: [
        { txt: 'Qui a écrit « Les Misérables » ?', opts: ['Émile Zola', 'Victor Hugo', 'Honoré de Balzac', 'Gustave Flaubert'], ok: 1, expl: 'Victor Hugo a publié « Les Misérables » en 1862.' },
        { txt: 'Qui a écrit « Le Petit Prince » ?', opts: ['Jules Verne', 'Albert Camus', 'Antoine de Saint-Exupéry', 'Marcel Pagnol'], ok: 2, expl: '« Le Petit Prince » d\'Antoine de Saint-Exupéry est paru en 1943.' },
        { txt: 'Dans quel pays se déroule « Don Quichotte » ?', opts: ['L\'Italie', 'L\'Espagne', 'Le Portugal', 'La France'], ok: 1, expl: 'Le roman de Cervantès se déroule en Espagne, dans la Manche.' },
      ],
    },
  },
  spin: {
    id: 'spin', cle: 'spin', module: 'spin', nom: 'Roue', prefixe: 'SP',
    description: 'Ampoules, aiguille qui claque, arrêt en douceur. Cases réglées par le commerce ; 3 amis parrainés = un nouveau tour le jour même.',
    theme: 't-spin', couleur: '#13A89E',
    defauts: {
      commerce: { nom: 'Café Exemple', activite: 'Café de spécialité (texte d\'exemple).' },
      achat: 'sans',
      tirageDate: '30 novembre 2026',
      lots: [L('produit', '1', 'offert', 'Un café offert', 'Case « Café offert »', 'imm'), L('remise', '−10', '%', '−10 % sur l\'addition', 'Case « −10 % »', 'imm'), L('produit', '1', 'panier', 'Le panier du café', 'Cases « Ticket » : tirage', 'tir')],
      how: [['Flashe le QR en boutique', 'Un tour par jour et par commerce'], ['Lance la roue', 'Elle s\'arrête sur une case au hasard'], ['Ton gain va dans ton profil', 'Billet immédiat ou ticket pour le tirage']],
      parrain: 'Parraine 3 amis aujourd\'hui : tu relances la roue une fois, le jour même.',
      cases: [
        { label: 'Café offert', fond: '#F26B4F', texte: '#1B3A5C', issue: 'imm' },
        { label: 'Ticket', fond: '#F5A100', texte: '#1B3A5C', issue: 'tir' },
        { label: '−10 %', fond: '#8E3B6E', texte: '#FFFFFF', issue: 'imm' },
        { label: 'Ticket', fond: '#13A89E', texte: '#1B3A5C', issue: 'tir' },
        { label: 'Cookie offert', fond: '#EAEFFB', texte: '#1B3A5C', issue: 'imm' },
        { label: 'Pas cette fois', fond: '#F4F6F9', texte: '#1B3A5C', issue: 'perdu' },
        { label: 'Bon 5 €', fond: '#F5A100', texte: '#1B3A5C', issue: 'imm' },
        { label: 'Ticket', fond: '#13A89E', texte: '#1B3A5C', issue: 'tir' },
      ],
    },
  },
  tombola: {
    id: 'tombola', cle: 'tombola', module: 'tombola', nom: 'Tombola', prefixe: 'TB',
    description: 'Un gros bouton, le ticket qui s\'imprime et dont le numéro défile. 3 parrainages = un nouveau ticket dans la journée.',
    theme: 't-tombola', couleur: '#0B9E6E',
    defauts: {
      commerce: { nom: 'Fleuriste Exemple', activite: 'Fleuriste (texte d\'exemple).' },
      achat: 'sans',
      tirageDate: '30 novembre 2026',
      lots: [L('produit', '1', 'bouquet', 'Un bouquet de saison', 'Tiré au sort parmi les tickets', 'tir'), L('bon', '15', '€', 'Bon d\'achat de 15 €', 'Tiré au sort parmi les tickets', 'tir'), L('produit', '1', 'offerte', 'Une rose offerte', 'Ticket gagnant immédiat', 'imm')],
      how: [['Flashe le QR en boutique', 'Un ticket par jour et par commerce'], ['Tire ton ticket', 'Il s\'imprime sous tes yeux'], ['Ton gain va dans ton profil', 'Gain immédiat ou rendez-vous au tirage']],
      parrain: 'Parraine 3 amis aujourd\'hui : tu tires un nouveau ticket, le jour même.',
    },
  },
  vote: {
    id: 'vote', cle: 'vote', module: 'vote', nom: 'Vote', prefixe: 'VS',
    description: 'Un plateau (ex. stand-up, 5 humoristes) ou « la plus belle vitrine » : voter fait participer à une loterie.',
    theme: 't-vote', couleur: '#3A6FD8',
    defauts: {
      commerce: { nom: 'Théâtre Exemple', activite: 'Salle de spectacle (texte d\'exemple).' },
      achat: 'sans',
      tirageDate: '30 novembre 2026',
      lots: [L('service', '2', 'places', '2 places pour le prochain stand-up', 'Loterie parmi les votants', 'tir')],
      how: [['Flashe le QR dans la salle', 'Un vote par soirée'], ['Vote pour ton humoriste', 'Une voix, un seul choix'], ['Ton vote = 1 ticket', 'Pour la loterie des places']],
      parrain: 'Chaque ami qui s\'inscrit = 1 ticket de plus pour la loterie.',
      voteKicker: 'Plateau stand-up · ce soir',
      voteTitre: 'Vote pour ton humoriste préféré',
      candidats: [
        { nom: 'Humoriste A', sous: 'Passage 1 · [nom à compléter]' },
        { nom: 'Humoriste B', sous: 'Passage 2 · [nom à compléter]' },
        { nom: 'Humoriste C', sous: 'Passage 3 · [nom à compléter]' },
        { nom: 'Humoriste D', sous: 'Passage 4 · [nom à compléter]' },
        { nom: 'Humoriste E', sous: 'Passage 5 · [nom à compléter]' },
      ],
    },
  },
  super: {
    id: 'super', cle: 'sej', module: 'super', nom: 'Super event', prefixe: 'ND',
    description: 'Univers comics : lettrage SUPER, cases de BD, « BOUM ». Chaque commerce joué = 1 super ticket pour le grand tirage.',
    theme: 't-super', couleur: '#E2231A',
    defauts: {
      commerce: { nom: 'Marché de Noël Exemple' },
      achat: 'sans',
      tirageDate: '31 décembre 2026',
      lots: [L('bon', '50', '€', 'Bon d\'achat de 50 €', 'Offert par Sponsor Exemple', 'tir'), L('produit', '1', 'panier', 'Un panier de produits locaux', 'Offert par Sponsor Autre Exemple', 'tir')],
    },
  },
}

export const ORDRE_MASTERS: MasterId[] = ['quiz', 'quizsolo', 'spin', 'tombola', 'vote', 'super']

/** Le master qui sert un module historique (events.module). */
export function masterPourModule(module: string | null | undefined): MasterId | null {
  if (!module) return null
  if (module === 'quiz' || module === 'quizsolo' || module === 'spin' || module === 'tombola' || module === 'vote') return module
  return null
}

export function estMasterId(x: unknown): x is MasterId {
  return typeof x === 'string' && (ORDRE_MASTERS as string[]).indexOf(x) >= 0
}

export function cleDuMaster(id: MasterId): CleJeu { return MASTERS[id].cle }
