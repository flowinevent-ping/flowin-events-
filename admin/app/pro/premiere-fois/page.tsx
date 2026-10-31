import type { Metadata } from 'next'
import PremiereFois from '@/components/pro/PremiereFois'

export const metadata: Metadata = {
  title: 'Ma première fois — Flowin Pro',
  description: 'Créez votre espace pro Flowin en quelques minutes : SIRET, activité, points de vente, compte.',
}

/** Parcours d'inscription pro « Ma première fois » (31/10/2026). */
export default function Page() {
  return <PremiereFois />
}
