'use client'

/**
 * Parcours mobil — vue SA (30/07/2026, demande Romain).
 * Meme apercu que cote profil partenaire (event + super event), reutilise le composant
 * ParcoursMobil. Ici le titre est porte par le PageHeader du dashboard SA.
 */
import { PageHeader } from '@/components/dashboard/DashboardUI'
import ParcoursMobil from '@/components/pro/ParcoursMobil'

export default function Page() {
  return (
    <div>
      <PageHeader title="📱 Parcours mobil" subtitle="Aperçu du parcours joueur — event & super event" />
      <ParcoursMobil showTitle={false} />
    </div>
  )
}
