import { supabase } from './supabase'
import type { FlowinJoueur, FlowinEvent, FlowinPartenaire, FlowinLot, FlowinPro } from './types'

/* ── Joueurs ── */
export async function fetchAllJoueurs(): Promise<FlowinJoueur[]> {
  const { data } = await supabase
    .from('joueurs')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1000)
  return (data ?? []) as FlowinJoueur[]
}

export async function updateJoueur(id: string, fields: Partial<FlowinJoueur>): Promise<boolean> {
  const { error } = await supabase.from('joueurs').update(fields).eq('id', id)
  return !error
}

export async function deleteJoueur(id: string): Promise<boolean> {
  const { error } = await supabase.from('joueurs').delete().eq('id', id)
  return !error
}

/* ── Events ── */
export async function fetchAllEvents(): Promise<FlowinEvent[]> {
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('date_d', { ascending: false })
  return (data ?? []) as FlowinEvent[]
}

export async function upsertEvent(ev: Partial<FlowinEvent>): Promise<boolean> {
  const { error } = await supabase.from('events').upsert(ev, { onConflict: 'id' })
  return !error
}

export async function deleteEvent(id: string): Promise<boolean> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  return !error
}

/* ── Partenaires ── */
export async function fetchAllPartenaires(): Promise<FlowinPartenaire[]> {
  const { data } = await supabase
    .from('partenaires')
    .select('*')
    .order('nom')
  return (data ?? []) as FlowinPartenaire[]
}

export async function upsertPartenaire(p: Partial<FlowinPartenaire>): Promise<boolean> {
  const { error } = await supabase.from('partenaires').upsert(p, { onConflict: 'id' })
  return !error
}

export async function deletePartenaire(id: string): Promise<boolean> {
  const { error } = await supabase.from('partenaires').delete().eq('id', id)
  return !error
}

/* ── Lots ── */
export async function fetchAllLots(): Promise<FlowinLot[]> {
  const { data } = await supabase
    .from('lots')
    .select('*')
    .order('event_id')
  return (data ?? []) as FlowinLot[]
}

export async function fetchEventLots(eventId: string): Promise<FlowinLot[]> {
  const { data } = await supabase
    .from('lots')
    .select('*')
    .eq('event_id', eventId)
  return (data ?? []) as FlowinLot[]
}

/* ── Pros ── */
export async function fetchAllPros(): Promise<FlowinPro[]> {
  const { data } = await supabase
    .from('pros')
    .select('*')
    .order('nom')
  return (data ?? []) as FlowinPro[]
}

export async function upsertPro(p: Partial<FlowinPro>): Promise<boolean> {
  const { error } = await supabase.from('pros').upsert(p, { onConflict: 'id' })
  return !error
}

export async function deletePro(id: string): Promise<boolean> {
  const { error } = await supabase.from('pros').delete().eq('id', id)
  return !error
}

/* ── Participations par event ── */
export async function fetchEventParticipants(eventId: string): Promise<FlowinJoueur[]> {
  const { data } = await supabase
    .from('joueurs')
    .select('*')
    .contains('events', [eventId])
    .order('updated_at', { ascending: false })
  return (data ?? []) as FlowinJoueur[]
}

/* ── Stats globales ── */
export async function fetchDashboardStats() {
  const [joueursRes, eventsRes, partenairesRes, lotsRes, prosRes] = await Promise.all([
    supabase.from('joueurs').select('id, optin, gains, events', { count: 'exact' }),
    supabase.from('events').select('id, status, module, participants', { count: 'exact' }),
    supabase.from('partenaires').select('id, actif', { count: 'exact' }),
    supabase.from('lots').select('id, valeur, quantite, retire', { count: 'exact' }),
    supabase.from('pros').select('id', { count: 'exact' }),
  ])
  return {
    totalJoueurs: joueursRes.count ?? 0,
    totalOptins: (joueursRes.data ?? []).filter((j: { optin: boolean }) => j.optin).length,
    totalEvents: eventsRes.count ?? 0,
    liveEvents: (eventsRes.data ?? []).filter((e: { status: string }) => e.status === 'live').length,
    totalPartenaires: partenairesRes.count ?? 0,
    totalLots: lotsRes.count ?? 0,
    totalPros: prosRes.count ?? 0,
    totalGagnants: (joueursRes.data ?? []).filter((j: { gains: number }) => j.gains > 0).length,
  }
}

/* ── Super Event : tickets & gains ── */
export interface SeTicketRow { event_id: string | null; super_event_id: string | null }
export interface SeGainRow { id: string; libelle: string | null; code: string | null; utilise: boolean | null; event_id: string | null; super_event_id: string | null }

export async function fetchJoueurTicketsGains(joueurId: string): Promise<{ tickets: SeTicketRow[]; gains: SeGainRow[] }> {
  const [tk, ga] = await Promise.all([
    supabase.from('se_tickets').select('event_id,super_event_id').eq('joueur_id', joueurId),
    supabase.from('se_gains').select('id,libelle,code,utilise,event_id,super_event_id').eq('joueur_id', joueurId),
  ])
  return { tickets: (tk.data ?? []) as SeTicketRow[], gains: (ga.data ?? []) as SeGainRow[] }
}

/* ── Super Event : stats agrégées d'un commerce (espace pro) ── */
export async function fetchEventSuperEventStats(eventId: string): Promise<{ tickets: number; gains: number; gainsUtilises: number }> {
  const [tk, ga] = await Promise.all([
    supabase.from('se_tickets').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    supabase.from('se_gains').select('utilise').eq('event_id', eventId),
  ])
  const gainsRows = (ga.data ?? []) as { utilise: boolean | null }[]
  return {
    tickets: tk.count ?? 0,
    gains: gainsRows.length,
    gainsUtilises: gainsRows.filter((g) => g.utilise).length,
  }
}

/* ── Super Event : marquer un gain comme utilisé ── */
export async function marquerGainUtilise(gainId: string, utilise: boolean): Promise<boolean> {
  const { error } = await supabase.from('se_gains').update({ utilise, utilise_ts: utilise ? new Date().toISOString() : null }).eq('id', gainId)
  return !error
}
