'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { FlowinJoueur, FlowinEvent, FlowinPartenaire, FlowinPro, FlowinLot } from '@/lib/types'

export type DrawerType = 'joueur' | 'event' | 'partenaire' | 'pro' | 'superevent' | null

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
  drawerCanGoBack: boolean
  openDrawer: (type: DrawerType, id: string, tab?: string) => void
  openDrawerEdit: (type: DrawerType, id: string) => void
  goBackDrawer: () => void
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
  const [drawerHistory, setDrawerHistory] = useState<DrawerState[]>([])

  const openDrawer = useCallback((type: DrawerType, id: string, tab = 'infos') => {
    setDrawer(prev => {
      // Ouvrir la MEME fiche (ex. changer d'onglet) ne s'empile pas dans l'historique.
      if (prev.open && (prev.type !== type || prev.id !== id)) {
        setDrawerHistory(h => [...h, prev])
      }
      return { open: true, type, id, tab, edit: false }
    })
  }, [])

  const openDrawerEdit = useCallback((type: DrawerType, id: string) => {
    setDrawer(prev => {
      if (prev.open && (prev.type !== type || prev.id !== id)) {
        setDrawerHistory(h => [...h, prev])
      }
      return { open: true, type, id, tab: 'infos', edit: true }
    })
  }, [])

  const goBackDrawer = useCallback(() => {
    setDrawerHistory(h => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setDrawer(prev)
      return h.slice(0, -1)
    })
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, id: null, tab: 'infos', edit: false })
    setDrawerHistory([])
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
      drawer, drawerCanGoBack: drawerHistory.length > 0,
      openDrawer, openDrawerEdit, goBackDrawer, closeDrawer, setDrawerTab, setDrawerEdit,
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
