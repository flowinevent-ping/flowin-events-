'use client'

/**
 * Hub « 🏢 CRM pros & commerces » — lot 6 de la reorganisation.
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

const Pros = dynamic(() => import('../pros/page'), { ssr: false, loading: () => <Chargement /> })
const Commerces = dynamic(() => import('../partenaires/page'), { ssr: false, loading: () => <Chargement /> })
const Demandes = dynamic(() => import('../demandes-rattachement/page'), { ssr: false, loading: () => <Chargement /> })
const ApercuPro = dynamic(() => import('../apercu-pro/page'), { ssr: false, loading: () => <Chargement /> })

const ONGLETS: OngletHub[] = [
  { id: 'pros', label: 'Pros', Composant: Pros },
  { id: 'commerces', label: 'Commerces partenaires', Composant: Commerces },
  { id: 'demandes', label: 'Demandes de participation', Composant: Demandes },
  { id: 'apercu', label: 'Aperçu pro', Composant: ApercuPro },
]

const LIENS: LienHub[] = [

]

export default function Page() {
  return (
    <HubPage
      titre={'🏢 CRM pros & commerces'}
      sousTitre={'Comptes pro, commerces partenaires, demandes de participation'}
      onglets={ONGLETS}
      liens={LIENS}
    />
  )
}
