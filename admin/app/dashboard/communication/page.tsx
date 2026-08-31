'use client'

/**
 * Hub « 📣 Communication » — lot 6 de la reorganisation.
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

const Billets = dynamic(() => import('../nds-comm/page'), { ssr: false, loading: () => <Chargement /> })
const Envois = dynamic(() => import('../envoi-masse/page'), { ssr: false, loading: () => <Chargement /> })
const Medias = dynamic(() => import('../nds-media/page'), { ssr: false, loading: () => <Chargement /> })

const ONGLETS: OngletHub[] = [
  { id: 'billets', label: 'Billets & kit partenaire', Composant: Billets },
  { id: 'envois', label: 'Envoi en masse', Composant: Envois },
  { id: 'medias', label: 'Vidéo & média', Composant: Medias },
]

const LIENS: LienHub[] = [
  { label: 'Visuels & vidéos', href: '/nds-visuels.html', statique: true },
]

export default function Page() {
  return (
    <HubPage
      titre={'📣 Communication'}
      sousTitre={'Billets, kit partenaire, envois et médias'}
      onglets={ONGLETS}
      liens={LIENS}
    />
  )
}
