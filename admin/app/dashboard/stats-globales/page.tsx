'use client'

/**
 * Hub « 📊 Stats globales » — lot 6 de la reorganisation.
 *
 * Les onglets RENDENT les pages existantes, ils ne les copient pas : chacune
 * reste jointe par son URL d origine, a l identique. Chargement paresseux par
 * onglet, pour ne pas empiler plusieurs bundles de page dans un seul ecran.
 */

import dynamic from 'next/dynamic'
import HubPage, { type OngletHub, type LienHub } from '@/components/dashboard/HubPage'

const Chargement = () => (
  <div className="sa-content sa-muted" style={{ fontSize: 13 }}>Chargement…</div>
)

const Rapports = dynamic(() => import('../rapports/page'), { ssr: false, loading: () => <Chargement /> })
const Pilotage = dynamic(() => import('../pilotage/page'), { ssr: false, loading: () => <Chargement /> })

const ONGLETS: OngletHub[] = [
  { id: 'rapports', label: 'Rapports', Composant: Rapports },
  { id: 'pilotage', label: 'Pilotage', Composant: Pilotage },
]

const LIENS: LienHub[] = [

]

export default function Page() {
  return (
    <HubPage
      titre={'📊 Stats globales'}
      sousTitre={'Toutes opérations confondues'}
      onglets={ONGLETS}
      liens={LIENS}
    />
  )
}
