'use client'

/**
 * Parcours mobil — vue SA (v2). Reutilise les evenements deja charges dans le contexte dashboard
 * et delegue au composant ParcoursMobil qui affiche le vrai parcours en direct (iframe).
 */
import { PageHeader } from '@/components/dashboard/DashboardUI'
import ParcoursMobil from '@/components/pro/ParcoursMobil'
import { useDashboard } from '@/contexts/DashboardContext'

export default function Page() {
  const { events } = useDashboard()
  const evs = (events ?? [])
    .filter(e => e.module && e.super_event_id)
    .map(e => ({ id: e.id, module: e.module, nom: e.nom }))
  const seId = events?.find(e => e.super_event_id)?.super_event_id ?? undefined

  return (
    <div>
      <PageHeader title="📱 Parcours mobil" subtitle="Aperçu du vrai parcours joueur — event & super event" />
      <ParcoursMobil events={evs} seId={seId} showTitle={false} />
    </div>
  )
}
