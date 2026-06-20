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

/* ── Super Event : gains émis par les commerces d'un pro (validation utilisation) ── */
export interface ProGainRow { id: string; libelle: string | null; code: string | null; utilise: boolean | null; event_id: string | null; joueur: string }
export async function fetchProGains(eventIds: string[]): Promise<ProGainRow[]> {
  if (!eventIds.length) return []
  const { data } = await supabase
    .from('se_gains').select('id,libelle,code,utilise,event_id,joueur_id,created_at')
    .in('event_id', eventIds).order('created_at', { ascending: false })
  const rows = (data ?? []) as { id: string; libelle: string | null; code: string | null; utilise: boolean | null; event_id: string | null; joueur_id: string | null }[]
  const jids = Array.from(new Set(rows.map(r => r.joueur_id).filter(Boolean))) as string[]
  const names: Record<string, string> = {}
  if (jids.length) {
    const { data: js } = await supabase.from('joueurs').select('id,prenom,nom').in('id', jids)
    ;(js ?? []).forEach((j: { id: string; prenom?: string | null; nom?: string | null }) => { names[j.id] = `${j.prenom ?? ''} ${j.nom ?? ''}`.trim() || '—' })
  }
  return rows.map(r => ({ id: r.id, libelle: r.libelle, code: r.code, utilise: r.utilise, event_id: r.event_id, joueur: r.joueur_id ? (names[r.joueur_id] || '—') : '—' }))
}

/* ── Tirage au sort : persiste le gagnant tiré (sinon perdu au rechargement) ── */
export async function enregistrerTirage(params: {
  superEventId: string | null
  eventId: string | null
  joueur: { id: string; prenom?: string | null; nom?: string | null; email?: string | null; tel?: string | null }
}): Promise<{ ok: boolean; code: string }> {
  const code = 'T-' + Math.random().toString(36).slice(2, 8).toUpperCase()
  const { error } = await supabase.from('se_gains').insert({
    super_event_id: params.superEventId,
    event_id: params.eventId,
    joueur_id: params.joueur.id,
    type: 'tirage',
    libelle: 'Tirage au sort',
    code,
    utilise: false,
    gagnant_nom: `${params.joueur.prenom ?? ''} ${params.joueur.nom ?? ''}`.trim() || null,
    gagnant_email: params.joueur.email ?? null,
    gagnant_tel: params.joueur.tel ?? null,
  })
  if (error) console.error('[enregistrerTirage] insert échoué:', error.message)
  return { ok: !error, code }
}

/* ── Clics partenaires rattachés à un pro (via partenaires.event_id ∈ events du pro) ── */
export async function fetchProClics(eventIds: string[]): Promise<number> {
  if (!eventIds.length) return 0
  const { data: parts } = await supabase.from('partenaires').select('id').in('event_id', eventIds)
  const ids = ((parts ?? []) as { id: string }[]).map(p => p.id)
  if (!ids.length) return 0
  const { count } = await supabase.from('partenaire_clics').select('id', { count: 'exact', head: true }).in('partenaire_id', ids)
  return count ?? 0
}
