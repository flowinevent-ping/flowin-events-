'use client'

/**
 * Hub « 🧾 Facturation & administratif » — lot 6 de la reorganisation.
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

const BonCommande = dynamic(() => import('../nds-bon-commande/page'), { ssr: false, loading: () => <Chargement /> })
const Packs = dynamic(() => import('../nds-packs/page'), { ssr: false, loading: () => <Chargement /> })
const Cgv = dynamic(() => import('../cgv/page'), { ssr: false, loading: () => <Chargement /> })

const ONGLETS: OngletHub[] = [
  { id: 'bon', label: 'Créer un bon de commande', Composant: BonCommande },
  { id: 'packs', label: 'Packs de participation', Composant: Packs },
  { id: 'cgv', label: 'CGV & légal', Composant: Cgv },
]

const LIENS: LienHub[] = [
  { label: 'Bons & factures (liste)', href: '/bons-commande-liste.html', statique: true },
  { label: 'Générer une facture', href: '/facture-nds.html', statique: true },
]

export default function Page() {
  return (
    <HubPage
      titre={'🧾 Facturation & administratif'}
      sousTitre={'Bons de commande, packs de participation, conditions'}
      onglets={ONGLETS}
      liens={LIENS}
    />
  )
}
