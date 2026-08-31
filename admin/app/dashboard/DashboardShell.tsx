'use client'

import { DashboardProvider } from '@/contexts/DashboardContext'
import { ScopeProvider } from '@/contexts/ScopeContext'
import Sidebar from '@/components/dashboard/Sidebar'
import Drawer from '@/components/dashboard/Drawer'
import type { FlowinJoueur, FlowinEvent, FlowinPartenaire, FlowinPro, FlowinLot } from '@/lib/types'

interface Props {
  children: React.ReactNode
  initialJoueurs: FlowinJoueur[]
  initialEvents: FlowinEvent[]
  initialPartenaires: FlowinPartenaire[]
  initialPros: FlowinPro[]
  initialLots: FlowinLot[]
}

export default function DashboardShell({
  children,
  initialJoueurs,
  initialEvents,
  initialPartenaires,
  initialPros,
  initialLots,
}: Props) {
  return (
    <DashboardProvider
      initialJoueurs={initialJoueurs}
      initialEvents={initialEvents}
      initialPartenaires={initialPartenaires}
      initialPros={initialPros}
      initialLots={initialLots}
    >
      {/* ScopeProvider est A L INTERIEUR : ScopeBar lit les events du DashboardContext. */}
      <ScopeProvider>
        <div className="sa-shell">
          <Sidebar />
          <div className="sa-main">
            {children}
          </div>
          <Drawer />
        </div>
      </ScopeProvider>
    </DashboardProvider>
  )
}
