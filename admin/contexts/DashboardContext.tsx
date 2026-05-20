'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { FlowinJoueur, FlowinEvent, FlowinPartenaire, FlowinPro, FlowinLot } from '@/lib/types'

export type DrawerType = 'joueur' | 'event' | 'partenaire' | 'pro' | null

export interface DrawerState {
  open: boolean
  type: DrawerType
  id: string | null
  tab: string
  edit: boolean
}

interface DashboardStore {
  joueurs: FlowinJoueur[]
  events: FlowinEvent[]
  partenaires: FlowinPartenaire[]
  pros: FlowinPro[]
  lots: FlowinLot[]
  setJoueurs: (j: FlowinJoueur[]) => void
  setEvents: (e: FlowinEvent[]) => void
  setPartenaires: (p: FlowinPartenaire[]) => void
  setPros: (p: FlowinPro[]) => void
  setLots: (l: FlowinLot[]) => void
  drawer: DrawerState
  openDrawer: (type: DrawerType, id: string, tab?: string) => void
  openDrawerEdit: (type: DrawerType, id: string) => void
  closeDrawer: () => void
  setDrawerTab: (tab: string) => void
  setDrawerEdit: (edit: boolean) => void
}

const DashboardContext = createContext<DashboardStore | null>(null)

export function DashboardProvider({
  children,
  initialJoueurs = [],
  initialEvents = [],
  initialPartenaires = [],
  initialPros = [],
  initialLots = [],
}: {
  children: ReactNode
  initialJoueurs?: FlowinJoueur[]
  initialEvents?: FlowinEvent[]
  initialPartenaires?: FlowinPartenaire[]
  initialPros?: FlowinPro[]
  initialLots?: FlowinLot[]
}) {
  const [joueurs, setJoueurs] = useState(initialJoueurs)
  const [events, setEvents] = useState(initialEvents)
  const [partenaires, setPartenaires] = useState(initialPartenaires)
  const [pros, setPros] = useState(initialPros)
  const [lots, setLots] = useState(initialLots)

  const [drawer, setDrawer] = useState<DrawerState>({
    open: false, type: null, id: null, tab: 'infos', edit: false,
  })

  const openDrawer = useCallback((type: DrawerType, id: string, tab = 'infos') => {
    setDrawer({ open: true, type, id, tab, edit: false })
  }, [])

  const openDrawerEdit = useCallback((type: DrawerType, id: string) => {
    setDrawer({ open: true, type, id, tab: 'infos', edit: true })
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, id: null, tab: 'infos', edit: false })
  }, [])

  const setDrawerTab = useCallback((tab: string) => {
    setDrawer(d => ({ ...d, tab, edit: false }))
  }, [])

  const setDrawerEdit = useCallback((edit: boolean) => {
    setDrawer(d => ({ ...d, edit }))
  }, [])

  return (
    <DashboardContext.Provider value={{
      joueurs, events, partenaires, pros, lots,
      setJoueurs, setEvents, setPartenaires, setPros, setLots,
      drawer, openDrawer, openDrawerEdit, closeDrawer, setDrawerTab, setDrawerEdit,
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be inside DashboardProvider')
  return ctx
}
