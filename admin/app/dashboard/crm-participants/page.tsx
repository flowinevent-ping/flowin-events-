'use client'

/**
 * Hub « 👥 CRM participants » — lot 6 de la reorganisation.
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

const Joueurs = dynamic(() => import('../joueurs/page'), { ssr: false, loading: () => <Chargement /> })
const Participants = dynamic(() => import('../nds-participants/page'), { ssr: false, loading: () => <Chargement /> })
const ContactsLanding = dynamic(() => import('../crm-landing/page'), { ssr: false, loading: () => <Chargement /> })
const Retours = dynamic(() => import('../crm-retours/page'), { ssr: false, loading: () => <Chargement /> })

const ONGLETS: OngletHub[] = [
  { id: 'joueurs', label: 'Joueurs', Composant: Joueurs },
  { id: 'participants', label: 'Participants (super event)', Composant: Participants },
  { id: 'landing', label: 'Contacts landing', Composant: ContactsLanding },
  { id: 'retours', label: 'Retours', Composant: Retours },
]

const LIENS: LienHub[] = [

]

export default function Page() {
  return (
    <HubPage
      titre={'👥 CRM participants'}
      sousTitre={'Joueurs, participants d\'une opération, contacts captés et retours'}
      onglets={ONGLETS}
      liens={LIENS}
    />
  )
}
