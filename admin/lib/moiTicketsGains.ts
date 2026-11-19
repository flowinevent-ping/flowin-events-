import { supabase } from './supabase'
import { rpcAbsente } from './rpcRepli'

/**
 * Tickets Super Event, anciens gains (se_gains) et stations terminées DU joueur lui-même,
 * identifié par l'id gardé dans son téléphone (comme mes_notifications / mes_cadeaux).
 * Sécurité joueurs (19/11) : RPC moi_tickets_gains ; repli sur les lectures directes
 * tant que la RPC n'existe pas en base.
 */
export interface TicketJoueur { event_id: string | null; super_event_id: string | null; type?: string; jour?: string }
export interface GainJoueur { id: string; libelle: string | null; code: string | null; utilise: boolean | null; event_id: string | null; super_event_id: string | null; type?: string | null }

export async function chargerTicketsGainsJoueur(joueurId: string, superEventId?: string | null, eventIds?: string[]):
  Promise<{ tickets: TicketJoueur[]; gains: GainJoueur[]; stationsTerminees: string[] }> {
  const r = await supabase.rpc('moi_tickets_gains', { p_joueur_id: joueurId, p_super_event_id: superEventId ?? null, p_event_ids: eventIds && eventIds.length ? eventIds : null })
  if (!r.error) {
    const o = (r.data || {}) as { tickets?: TicketJoueur[]; gains?: GainJoueur[]; stations_terminees?: string[] }
    return { tickets: o.tickets ?? [], gains: o.gains ?? [], stationsTerminees: o.stations_terminees ?? [] }
  }
  if (!rpcAbsente(r.error)) return { tickets: [], gains: [], stationsTerminees: [] }
  let tq = supabase.from('se_tickets').select('event_id,super_event_id,type,jour').eq('joueur_id', joueurId)
  let gq = supabase.from('se_gains').select('id,libelle,code,utilise,event_id,super_event_id,type').eq('joueur_id', joueurId)
  if (superEventId) { tq = tq.eq('super_event_id', superEventId); gq = gq.eq('super_event_id', superEventId) }
  const [tk, ga, pa] = await Promise.all([
    tq, gq,
    eventIds && eventIds.length
      ? supabase.from('participations').select('event_id').eq('joueur_id', joueurId).in('event_id', eventIds).eq('completed', true)
      : Promise.resolve({ data: [] as { event_id: string | null }[] }),
  ])
  return {
    tickets: (tk.data ?? []) as TicketJoueur[],
    gains: (ga.data ?? []) as GainJoueur[],
    stationsTerminees: ((pa.data ?? []) as { event_id: string | null }[]).map(x => x.event_id).filter(Boolean) as string[],
  }
}
