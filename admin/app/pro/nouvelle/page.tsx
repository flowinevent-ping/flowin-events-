import { fetchProDashboard } from '@/lib/pro'
import { fetchBanquesPro } from '@/lib/banques'
import { fetchPacksParticipation } from '@/lib/commercial'
import { supabase } from '@/lib/supabase'
import { geocoderAdresse } from '@/lib/geocodage'
import ProShell from '@/components/pro/ProShell'
import NouvelleOperation, { type SuperOuvert, type ProNouvelle } from '@/components/pro/NouvelleOperation'

export const dynamic = 'force-dynamic'

/**
 * NOUVELLE OPERATION (P2) — creer une animation, rejoindre un super event,
 * creer un super event : un seul parcours (components/pro/NouvelleOperation).
 * ?type=animation|rejoindre|super ouvre directement le parcours voulu,
 * ?se=<id> preselectionne le super event a rejoindre.
 */
export default async function Page({ searchParams }: { searchParams: { pro?: string; type?: string; se?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, banques, packs, { data: ses }] = await Promise.all([
    fetchProDashboard(proId),
    fetchBanquesPro(proId),
    fetchPacksParticipation(),
    supabase.from('super_events').select('id,nom,status,date_d,date_f,description,logo_url,module,cfg_jeu,pro_id,frais_pro,events')
      .neq('id', 'se-master-superevent').not('status', 'in', '("past","pending")').order('date_d', { ascending: false }),
  ])
  const p = data.pro as unknown as ProNouvelle | null
  if (!p) {
    return (
      <ProShell proName="Mon établissement" proId={proId} active="nouvelle">
        <div style={{ fontSize: 14 }}>Établissement introuvable.</div>
      </ProShell>
    )
  }
  const premieresStations = ((ses ?? []) as (SuperOuvert & { events: string[] | null })[])
    .map(s => (s.events ?? [])[0]).filter(Boolean) as string[]
  /* Localisation du super event = celle de sa premiere station (adresse reelle
     saisie a la creation, cf. creerSuperEventPro) -- jamais inventee. Geocodage
     paresseux, meme mecanique que la validation des demandes de rattachement
     (app/dashboard/demandes-rattachement) : si une adresse existe sans lat/lng,
     on la geocode une fois et on l ecrit en base pour la prochaine fois.
     Romain, 21/10 : "les memes cartes partout, il y a les adresses postales,
     on l a fait pour NDS 2026" -- meme pipeline, reutilise ici. */
  const { data: stationsRes } = premieresStations.length
    ? await supabase.from('events').select('id,adresse,lat,lng').in('id', premieresStations)
    : { data: [] as { id: string; adresse: string | null; lat: number | null; lng: number | null }[] }
  const stationById = new Map((stationsRes ?? []).map(e => [e.id, e]))
  for (const st of stationsRes ?? []) {
    if (st.lat == null && st.lng == null && st.adresse) {
      const coords = await geocoderAdresse(st.adresse, null, null)
      if (coords) {
        await supabase.from('events').update({ lat: coords.lat, lng: coords.lng }).eq('id', st.id)
        stationById.set(st.id, { ...st, lat: coords.lat, lng: coords.lng })
      }
    }
  }
  const supers: SuperOuvert[] = ((ses ?? []) as (SuperOuvert & { events: string[] | null })[]).map(s => {
    const premiere = (s.events ?? [])[0] ?? null
    const station = premiere ? stationById.get(premiere) : null
    return { ...s, station: premiere, lat: station?.lat ?? null, lng: station?.lng ?? null }
  })
  const t = searchParams.type
  const type = t === 'animation' || t === 'rejoindre' || t === 'super' ? t : null
  return (
    <ProShell proName={p.nom ?? 'Mon établissement'} proId={proId} active="nouvelle">
      <NouvelleOperation
        pro={p} banques={banques} supers={supers} packs={packs}
        typeInitial={searchParams.se ? 'rejoindre' : type} seInitial={searchParams.se ?? null}
      />
    </ProShell>
  )
}
