/* `nds2026` n'est pas un module nouveau : c'est celui qui tourne depuis juillet,
   deja ecrit en base sur les events du festival et deja route par
   app/parcours/nds2026. Il manquait simplement a cette union, ce qui le rendait
   invisible des listes du dashboard. Il porte le gabarit marque blanche
   « Quiz + bonus » — voir lib/gabarit.ts. */
export type Module = 'quiz' | 'quizmaster' | 'quizsolo' | 'spin' | 'vote' | 'tombola' | 'nds2026'
export type Status = 'upcoming' | 'live' | 'past'
export type ClientType = 'btoc' | 'btob'

export interface EventCfgFront {
  badge?: string
  description?: string
  ctaText?: string
  ctaNote?: string
  lotTirage?: string
  visible?: { lots?: boolean; dates?: boolean; titre?: boolean; tirage?: boolean }
}

export interface EventCfg {
  front?: EventCfgFront
  partenaires?: string[]
  spinSegments?: Array<{ label: string; color: string; perdant?: boolean; stock?: number }>
  /** Deprecated : cle jamais lue par le code reel (Pattern H). La vraie cle est `voteItems`. */
  voteSections?: Array<{ titre: string; options: string[] }>
  /** Elements a voter, lus par VoteClient.tsx (avec repli legacy cfg.comediens / cfg.standupComediens en lecture). */
  voteItems?: Array<{ id: string; nom: string; emoji?: string; genre?: string; desc?: string }>
  /** Mode de vote, defaut 'stars' -- seul mode implemente cote composant a ce jour, mais deja stocke en base par vote. */
  voteMode?: string
  quizBanques?: string[]
  /** Deprecated : cle jamais lue par le code reel, garder pour compat lecture legacy uniquement. La vraie cle est `customQuestions`. */
  quizCustomQuestions?: unknown[]
  /** Questions personnalisees a l'event, lues par QuizClient.tsx et QuizsoloClient.tsx (PAS QuizmasterClient.tsx). */
  customQuestions?: unknown[]
  /** Nombre de questions tirees par partie. Lu par les 3 modules quiz, defaut 5. */
  quizNbQuestions?: number
  /** Chrono en secondes par question. Lu UNIQUEMENT par QuizClient.tsx (quiz) -- `false` desactive, non lu par quizmaster/quizsolo. */
  quizTimer?: number | false
  quizBonusList?: Array<{ label: string; type: string; options: Array<{ label: string }> }>
  /** Banques dont les questions sont des sondages single/multi — le bonus du gabarit.
      Lues par fetchParcoursData en plus de `quizBanques`. */
  bonusBanques?: string[]
  tombolaChamps?: string[]
  drawDate?: string
  /** Texte affiche du tirage ("Tirage lundi 11h"), lu par quiz/quizmaster/quizsolo/spin/vote. */
  tirageDate?: string
  subtitle?: string
  nomCourt?: string
  datesLabel?: string
  [key: string]: unknown
}

export interface FlowinEvent {
  id: string
  pro_id: string
  nom: string
  module: Module
  status: Status
  date_d: string | null
  date_f: string | null
  h_start: string | null
  h_end: string | null
  lieu: string
  adresse: string
  description: string
  couleur: string
  participants: number
  gagnants: number
  joueurs_optin: number
  score_min: number
  cfg: EventCfg
  stats: Record<string, unknown>
  pro_visib: Record<string, boolean>
  super_event_id: string | null
  client_type: ClientType
  created_at: string
}

export interface FlowinJoueur {
  id: string
  ts: string
  prenom: string | null
  nom: string | null
  email: string
  genre: string | null
  tel: string | null
  ville: string | null
  code_postal: string | null
  adresse: string | null
  date_naissance: string | null
  optin: boolean
  optin_date: string | null
  gains: number
  score_moy: number | null
  events: string[]
  first_seen: string | null
  last_seen: string | null
  source: string | null
  age_tranche: string | null
  ticket_code: string | null
  client_type: ClientType
  external_id: string | null
  updated_at: string
}

export interface FlowinLot {
  id: string
  event_id: string
  partenaire_id: string | null
  nom: string
  titre: string
  valeur: number
  quantite: number
  retire: boolean
  emoji: string | null
  description: string | null
}

export interface PartenaireLot {
  id?: string
  nom?: string
  titre?: string
  valeur?: number
  gagnants?: number
  quantite?: number
  description?: string
  valeur_euros?: number
}

export interface FlowinPartenaire {
  ordre?: number | null
  id: string
  nom: string
  emoji: string | null
  description: string | null
  promo_text: string | null
  site_web: string | null
  url: string | null
  instagram: string | null
  facebook: string | null
  image_url: string | null
  lots: PartenaireLot[] | null
  actif: boolean
  visible: boolean
  en_avant: boolean
  couleur: string | null
  type: string | null
  secteur: string | null
  ville: string | null
  code_postal: string | null
  adresse: string | null
  email: string | null
  tel: string | null
  contact: string | null
  role: string | null
  siret: string | null
  contrat: string | null
  notes: string | null
  events: string[]
  tags: string[]
  super_event_id: string | null
  montant_sponsoring: number | null
  statut_paiement: string | null
  offre: string | null
  paiement_mode: string | null
  facture_emise: boolean
  event_id: string | null
}

export interface FlowinParticipation {
  id: string
  joueur_id: string
  event_id: string
  score: number
  ticket_code: string
  completed: boolean
  created_at: string
}

export interface SubmitFormData {
  prenom: string
  nom: string
  email: string
  tel: string
  genre?: string
  code_postal?: string
  age_tranche?: string
  source?: string
  optin?: boolean
}

export type TicketPrefix = 'TB' | 'PQ' | 'QM' | 'QS' | 'SP' | 'VS' | 'ND'

export interface FlowinPro {
  id: string
  nom: string
  ville: string
  code_postal: string
  adresse: string
  siret: string
  secteur: string
  contact: string
  role_contact: string
  email: string
  tel: string
  entree_p: string | null
  notes: string
  tags: string[]
  partenaire_id: string | null
  statut: 'en_attente' | 'valide' | 'refuse'
  auth_id: string | null
}

export interface FlowinSuperEvent {
  id: string
  nom: string
  pros: string[]
  events: string[]
  description: string
  created_at: string
  date_d: string | null
  date_f: string | null
  status: 'upcoming' | 'live' | 'past'
}

export interface DemandeRattachement {
  id: number
  pro_id: string
  super_event_id: string
  lat: number | null
  lng: number | null
  regle_jeu: string | null
  logo_url: string | null
  lots: unknown[]
  offre: string | null
  date_debut_souhaite: string | null
  date_fin_souhaite: string | null
  statut: 'en_attente' | 'approuve' | 'refuse'
  note_sa: string | null
  created_at: string
  traite_at: string | null
}

export interface DashboardData {
  joueurs: FlowinJoueur[]
  events: FlowinEvent[]
  partenaires: FlowinPartenaire[]
  lots: FlowinLot[]
  pros: FlowinPro[]
}
