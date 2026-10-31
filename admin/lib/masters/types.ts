/**
 * MASTERS DE JEUX — types partages (moteur, gabarits, resolution).
 *
 * Un « master » = le gabarit de reference d'un type de jeu, tel que valide dans
 * les maquettes (scratchpad/maquettes-jeux) : meme typologie de presentation
 * pour tous les commerces. Chaque animation (event) reference un master et ne
 * stocke que SES personnalisations (logo, images, lots, questions, textes,
 * partenaires) dans events.cfg.master.perso. Voir lib/masters/resolve.ts.
 */

/** Identifiant d'un master. 'super' = univers comics du super event. */
export type MasterId = 'quiz' | 'quizsolo' | 'spin' | 'tombola' | 'vote' | 'super'

/** Cle courte utilisee par les ecrans (reprise de la maquette). */
export type CleJeu = 'quiz' | 'solo' | 'spin' | 'tombola' | 'vote' | 'sej'

export type TypeLot = 'produit' | 'remise' | 'bon' | 'service' | 'ticket' | 'tour'
export type ModeLot = 'imm' | 'tir'

/** Un lot tel qu'affiche (pastille « 20 € », nom, condition, mode). */
export interface LotAffiche {
  type: TypeLot
  big: string
  small: string
  nom: string
  cond: string
  mode: ModeLot
}

export interface QuestionMaster { txt: string; opts: string[]; ok: number; expl?: string }
export interface BonusMaster { label: string; opts: string[] }
/** Case de la roue. issue : gain immediat, ticket pour le tirage, ou perdu. */
export interface CaseRoue { label: string; fond: string; texte: string; issue: ModeLot | 'perdu'; stock?: number }
export interface Candidat { nom: string; sous?: string; photo?: string }
export interface PartenaireAffiche {
  nom: string
  logo?: string | null
  sponsor?: boolean
  distance?: boolean
  desc?: string
  lots?: LotAffiche[]
  site?: string | null
  instagram?: string | null
  facebook?: string | null
}
export interface CommerceAffiche { mono: string; nom: string; cat?: string; enjeu?: string; adresse?: string | null; href?: string | null }

/** Contenu personnalisable d'un master (valeurs par defaut ou personnalisations). */
export interface ContenuMaster {
  commerce?: { nom?: string; logoUrl?: string; activite?: string; adresse?: string; horaires?: string; site?: string }
  /** 'sans' | 'avec' obligation d'achat (choix du commerce, affiche tel quel). */
  achat?: 'sans' | 'avec'
  achatMin?: string
  tirageDate?: string
  lots?: LotAffiche[]
  how?: [string, string][]
  accueilSous?: string
  parrain?: string
  questions?: QuestionMaster[]
  bonus?: BonusMaster[]
  cases?: CaseRoue[]
  candidats?: Candidat[]
  voteKicker?: string
  voteTitre?: string
  images?: { hero?: string; vitrine?: string }
  partenaires?: PartenaireAffiche[]
}

/** Definition d'un master (code + valeurs par defaut, surchargeables en base). */
export interface DefinitionMaster {
  id: MasterId
  cle: CleJeu
  /** Module historique des events (events.module) servi par ce master. */
  module: string
  nom: string
  description: string
  /** Classe de theme des ecrans (couleur d'identite du jeu). */
  theme: string
  /** Couleur d'identite, pour les listes (le vrai jeton est dans flowin-theme.css). */
  couleur: string
  prefixe: string
  defauts: ContenuMaster
}

/** Ce que l'event stocke : cfg.master = { id, perso }. */
export interface ReferenceMaster { id: MasterId; perso?: ContenuMaster }
