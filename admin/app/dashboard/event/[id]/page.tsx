'use client'

/**
 * ESPACE EVENT — page pleine, lot 2 de la reorganisation.
 *
 * Jusqu ici la fiche d un event n existait que dans le drawer : pas d URL, donc
 * pas de lien partageable et pas de retour possible sur un onglet precis.
 * Ici : /dashboard/event/<id>#<onglet>.
 *
 * Le contenu N EST PAS duplique : c est le meme composant EventDrawer, en
 * mode 'page'. Les onglets ne peuvent donc pas diverger entre les deux vues.
 *
 * L onglet vit dans le hash (#lots) et non dans ?tab= : le hash ne touche pas
 * au rendu serveur, ce qui evite d avoir a envelopper la page dans un
 * <Suspense> pour useSearchParams.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDashboard } from '@/contexts/DashboardContext'
import EventDrawer from '@/components/dashboard/EventDrawer'

const ONGLET_DEFAUT = 'infos'
/* Onglets servis par EventDrawer. Valider le hash evite qu une URL bricolee
   (#nimporte) affiche la barre d onglets au-dessus d un corps vide. */
const ONGLETS = ['infos', 'jeu', 'stats', 'participants', 'lots', 'qr', 'export']

// Next 14 : params est un objet simple (le Promise, c est Next 15).
export default function EventPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id)
  const { events } = useDashboard()
  const [tab, setTab] = useState(ONGLET_DEFAUT)

  // Restauration de l onglet depuis le hash, puis synchronisation.
  useEffect(() => {
    const h = window.location.hash.replace('#', '')
    if (h && ONGLETS.includes(h)) setTab(h)
  }, [])

  const changerTab = (t: string) => {
    setTab(t)
    // La query string porte la portee (?se=&ev=) : la jeter ici viderait le
    // lien copie juste apres, ce qui annulerait tout l interet du contexte global.
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${t}`)
  }

  const ev = events.find(e => e.id === id)

  return (
    <div className="sa-content">
      <div className="sa-fil">
        <Link href="/dashboard/events">Events</Link>
        <span aria-hidden="true">›</span>
        <span className="courant">{ev?.nom ?? id}</span>
      </div>

      <div className="sa-page sa-page-fiche">
        <EventDrawer eventId={id} tab={tab} onTab={changerTab} mode="page" />
      </div>
    </div>
  )
}
