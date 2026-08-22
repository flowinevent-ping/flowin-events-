'use client'

import { useDashboard } from '@/contexts/DashboardContext'
import JoueurDrawer from './JoueurDrawer'
import EventDrawer from './EventDrawer'
import PartenaireDrawer from './PartenaireDrawer'
import ProDrawer from './ProDrawer'

export default function Drawer() {
  const { drawer, closeDrawer, drawerCanGoBack, goBackDrawer } = useDashboard()

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
      <div className="sa-drawer wide" style={{ position: 'relative' }}>
        {drawerCanGoBack && (
          <button
            onClick={goBackDrawer}
            style={{ position: 'absolute', top: 14, left: 14, zIndex: 5, background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Retour
          </button>
        )}
        {entity}
      </div>
    </>
  )
}
