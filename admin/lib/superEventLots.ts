import { supabase } from './supabase'

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
