export type Module = 'quiz' | 'quizmaster' | 'quizsolo' | 'spin' | 'vote' | 'tombola'
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
  spinSegments?: Array<{ label: string; proba: number; couleur?: string }>
  voteSections?: Array<{ titre: string; options: string[] }>
  quizBanques?: string[]
  quizCustomQuestions?: unknown[]
  quizBonusList?: Array<{ label: string; type: string; options: Array<{ label: string }> }>
  tombolaChamps?: string[]
  drawDate?: string
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

export interface FlowinPartenaire {
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
  actif: boolean
  visible: boolean
  en_avant: boolean
  couleur: string | null
  type: string | null
  events: string[]
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

export type TicketPrefix = 'TB' | 'PQ' | 'QM' | 'QS' | 'SP' | 'VS'
