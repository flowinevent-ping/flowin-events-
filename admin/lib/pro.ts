import { supabase } from './supabase'
import type { FlowinEvent, FlowinJoueur, FlowinLot, FlowinPro } from './types'

export interface ProDashboardData {
  pro: FlowinPro | null
  events: FlowinEvent[]
  joueurs: FlowinJoueur[]
  lots: FlowinLot[]
}

export async function fetchProDashboard(proId: string): Promise<ProDashboardData> {
  const empty = { pro: null, events: [], joueurs: [], lots: [] }
  if (!proId) return empty

  /* Pro */
  const { data: pros } = await supabase
    .from('pros')
    .select('*')
    .eq('id', proId)
    .limit(1)

  /* Events du pro */
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('pro_id', proId)
    .order('date_d', { ascending: false })

  if (!events?.length) return { pro: pros?.[0] ?? null, events: [], joueurs: [], lots: [] }

  const evIds = events.map(e => e.id)

  /* Joueurs scopés aux events du pro */
  const joueurPromises = evIds.map(eid =>
    supabase.from('joueurs').select('*').contains('events', [eid])
  )
  const joueurResults = await Promise.all(joueurPromises)
  const joueurMap = new Map<string, FlowinJoueur>()
  joueurResults.forEach(r => {
    ;(r.data ?? []).forEach((j: FlowinJoueur) => joueurMap.set(j.id, j))
  })
  const joueurs = Array.from(joueurMap.values())

  /* Lots */
  const { data: lots } = await supabase
    .from('lots')
    .select('*')
    .in('event_id', evIds)

  return {
    pro: pros?.[0] ?? null,
    events: events as FlowinEvent[],
    joueurs: joueurs as FlowinJoueur[],
    lots: (lots ?? []) as FlowinLot[],
  }
}

export function getQrUrl(event: FlowinEvent): string {
  return `https://flowin-events.vercel.app/parcours/${event.module}?ev=${event.id}`
}

export function getConversionRate(joueurs: FlowinJoueur[], total: number): number {
  if (!total) return 0
  return Math.round((joueurs.filter(j => j.optin).length / total) * 100)
}
