'use client'

/**
 * Hub « 🎯 Prospection & B2B » — lot 6 de la reorganisation.
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

const Terrain = dynamic(() => import('../prospection/page'), { ssr: false, loading: () => <Chargement /> })
const ProspectsB2B = dynamic(() => import('../btob-prospects/page'), { ssr: false, loading: () => <Chargement /> })

const ONGLETS: OngletHub[] = [
  { id: 'terrain', label: 'Prospection terrain', Composant: Terrain },
  { id: 'prospects', label: 'Prospects B2B', Composant: ProspectsB2B },
]

const LIENS: LienHub[] = [

]

export default function Page() {
  return (
    <HubPage
      titre={'🎯 Prospection & B2B'}
      sousTitre={'Terrain et suivi des prospects professionnels'}
      onglets={ONGLETS}
      liens={LIENS}
    />
  )
}
