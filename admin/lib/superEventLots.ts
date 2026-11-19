import { supabase } from './supabase'
import { phaseDuLot, type Phase, type SourceLot } from './superEventPhases'

export interface LotSuperEvent { id: string; rang: number | null; valeur: number | null; libelle: string | null }

/* Les lots affiches d'un super event. Le tirage global (RPC tirage_super_event)
   tire dans les lots des stations (table `lots`) ; `se_lots` n'existe que pour
   les super events historiques. Sans ce repli, un super event cree depuis le SA
   n'affichait aucun lot alors que son tirage en avait. */
export async function fetchLotsSuperEvent(seId: string): Promise<LotSuperEvent[]> {
  const { data: seLots } = await supabase
    .from('se_lots').select('id,rang,valeur,libelle').eq('super_event_id', seId).order('rang')
  if (seLots && seLots.length) return seLots as LotSuperEvent[]

  const { data: evs } = await supabase.from('events').select('id').eq('super_event_id', seId)
  const ids = ((evs ?? []) as { id: string }[]).map(e => e.id)
  if (!ids.length) return []
  const { data: lots } = await supabase
    .from('lots').select('id,titre,nom,valeur_euros,valeur,created_at')
    .in('event_id', ids).order('created_at')
  return ((lots ?? []) as { id: string; titre: string | null; nom: string | null; valeur_euros: number | null; valeur: number | null }[])
    .map((l, i) => ({ id: l.id, rang: i + 1, valeur: l.valeur_euros ?? l.valeur ?? null, libelle: l.titre ?? l.nom ?? null }))
}

/* SUPER EVENT EN DEUX PHASES (19/11/2026, lib/superEventPhases.ts) : tous les lots, rangés
   par phase. Lots de l'organisateur (se_lots) = « avant » par défaut, lots des stations
   (lots) = « pendant ». La colonne `phase` (sql/2026-11-19-super-event-phases.sql) peut forcer
   la phase ; tant que ce SQL n'est pas appliqué, la lecture repart sans elle. */
export interface LotPhase extends LotSuperEvent { source: SourceLot; phase: Phase }

export async function colonnePhasePresente(): Promise<boolean> {
  const { error } = await supabase.from('se_lots').select('phase').limit(1)
  return !error
}

export async function fetchLotsSuperEventPhases(seId: string): Promise<LotPhase[]> {
  let se = await supabase.from('se_lots').select('id,rang,valeur,libelle,phase').eq('super_event_id', seId).order('rang')
  if (se.error) se = await supabase.from('se_lots').select('id,rang,valeur,libelle').eq('super_event_id', seId).order('rang') as typeof se
  const orga = ((se.data ?? []) as (LotSuperEvent & { phase?: string | null })[])
    .map(l => ({ id: l.id, rang: l.rang, valeur: l.valeur, libelle: l.libelle, source: 'organisateur' as const, phase: phaseDuLot({ phase: l.phase, source: 'organisateur' }) }))

  const { data: evs } = await supabase.from('events').select('id').eq('super_event_id', seId)
  const ids = ((evs ?? []) as { id: string }[]).map(e => e.id)
  let stations: LotPhase[] = []
  if (ids.length) {
    let st = await supabase.from('lots').select('id,titre,nom,valeur_euros,valeur,created_at,phase').in('event_id', ids).order('created_at')
    if (st.error) st = await supabase.from('lots').select('id,titre,nom,valeur_euros,valeur,created_at').in('event_id', ids).order('created_at') as typeof st
    stations = ((st.data ?? []) as { id: string; titre: string | null; nom: string | null; valeur_euros: number | null; valeur: number | null; phase?: string | null }[])
      .map((l, i) => ({ id: l.id, rang: i + 1, valeur: l.valeur_euros ?? l.valeur ?? null, libelle: l.titre ?? l.nom ?? null, source: 'station' as const, phase: phaseDuLot({ phase: l.phase, source: 'station' }) }))
  }
  return (orga as LotPhase[]).concat(stations)
}
