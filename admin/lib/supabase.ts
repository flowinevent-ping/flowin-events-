import { createClient } from '@supabase/supabase-js'

export const SUPA_URL  = 'https://ywcqtupgoxfzkddqkztk.supabase.co'
export const SUPA_ANON = 'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1'

export const supabase = createClient(SUPA_URL, SUPA_ANON)

export interface FlowEvent {
  id: string; pro_id: string; nom: string; module: string
  status: string; date_d: string; date_f: string
  h_start: string; h_end: string; lieu: string; adresse: string
  description: string; couleur: string; participants: number
  gagnants: number; joueurs_optin: number; score_min: number
  cfg: any; stats: any; super_event_id: string | null
}
export interface Joueur {
  id: string; external_id: string; email: string
  prenom: string; nom: string; tel: string; ville: string
  optin: boolean; optin_date: string; events: string[]
  client_type: string; first_seen: string; last_seen: string
}
export interface Lot {
  id: string; event_id: string; titre: string
  valeur_euros: number; quantite: number
  assigne_a: string | null; retire: boolean; emoji: string
}
export interface Pro {
  id: string; nom: string; ville: string; email: string; secteur: string
}
