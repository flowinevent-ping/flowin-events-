/**
 * Super events proposes a « rejoindre » (carte et liste), avec leur position.
 * Position = colonnes `lat` / `lng` du super event quand elles existent (sql/11-super-events-demo.sql, non applique),
 * sinon celle de sa PREMIERE STATION (adresse reelle, geocodage paresseux). Jamais inventee.
 * `geocoder: true` (espace pro) ecrit les coordonnees trouvees pour la prochaine fois ; la page publique ne fait que lire.
 */
import { supabase } from './supabase'
import { geocoderAdresse } from './geocodage'
import type { SuperOuvert } from '@/components/creation/ParcoursCreation'

type Ligne = SuperOuvert & { events: string[] | null; lieu?: string | null }

export async function chargerSupersOuverts(opts: { geocoder?: boolean } = {}): Promise<SuperOuvert[]> {
  /* select('*') : tolere l'absence des colonnes lat / lng / lieu (SQL 11 pas encore applique). */
  const { data: ses } = await supabase.from('super_events').select('*')
    .neq('id', 'se-master-superevent').not('status', 'in', '("past","pending")').order('date_d', { ascending: false })
  const lignes = (ses ?? []) as Ligne[]
  const premieres = lignes.map(s => (s.events ?? [])[0]).filter(Boolean) as string[]
  const { data: stationsRes } = premieres.length
    ? await supabase.from('events').select('id,adresse,lat,lng').in('id', premieres)
    : { data: [] as { id: string; adresse: string | null; lat: number | null; lng: number | null }[] }
  const parId = new Map((stationsRes ?? []).map(e => [e.id, e]))
  if (opts.geocoder) {
    for (const st of stationsRes ?? []) {
      if (st.lat == null && st.lng == null && st.adresse) {
        const coords = await geocoderAdresse(st.adresse, null, null)
        if (coords) {
          await supabase.from('events').update({ lat: coords.lat, lng: coords.lng }).eq('id', st.id)
          parId.set(st.id, { ...st, lat: coords.lat, lng: coords.lng })
        }
      }
    }
  }
  return lignes.map(s => {
    const premiere = (s.events ?? [])[0] ?? null
    const station = premiere ? parId.get(premiere) : null
    const lat = (s as { lat?: number | null }).lat ?? station?.lat ?? null
    const lng = (s as { lng?: number | null }).lng ?? station?.lng ?? null
    return { ...s, station: premiere, lat, lng }
  })
}
