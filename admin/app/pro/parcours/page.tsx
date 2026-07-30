import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import ParcoursMobil from '@/components/pro/ParcoursMobil'

/**
 * Parcours mobil — profil partenaire (v2). Passe les VRAIS evenements du pro au composant,
 * qui affiche le parcours reel en direct (/parcours/<module>?ev=<id>) dans le cadre telephone.
 */
export default async function ProParcoursPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const events = (data.events ?? []).map(e => ({ id: e.id, module: e.module, nom: e.nom }))
  const seId = data.events?.find(e => e.super_event_id)?.super_event_id ?? undefined

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="parcours">
      <ParcoursMobil events={events} seId={seId} />
    </ProShell>
  )
}
