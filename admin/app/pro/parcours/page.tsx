import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import ParcoursMobil from '@/components/pro/ParcoursMobil'

/**
 * Parcours mobil (30/07/2026, demande Romain) : onglet du profil partenaire donnant acces a
 * l'apercu du parcours joueur mobile (event + super event). Server component minimal qui recupere
 * le nom du pro et de son animation pour le contexte, puis delegue au composant client.
 */
export default async function ProParcoursPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const eventNom = data.events?.[0]?.nom ?? undefined

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="parcours">
      <ParcoursMobil eventNom={eventNom} />
    </ProShell>
  )
}
