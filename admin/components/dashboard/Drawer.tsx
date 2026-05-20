'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import JoueurDrawer from './JoueurDrawer'
import EventDrawer from './EventDrawer'
import PartenaireDrawer from './PartenaireDrawer'
import ProDrawer from './ProDrawer'

export default function Drawer() {
  const { drawer, closeDrawer } = useDashboard()

  if (!drawer.open) return null

  const entity = (() => {
    switch (drawer.type) {
      case 'joueur':      return <JoueurDrawer />
      case 'event':       return <EventDrawer />
      case 'partenaire':  return <PartenaireDrawer />
      case 'pro':         return <ProDrawer />
      default:            return null
    }
  })()

  return (
    <>
      <div className="sa-drawer-bd" onClick={closeDrawer} />
      <div className="sa-drawer wide">
        {entity}
      </div>
    </>
  )
}
