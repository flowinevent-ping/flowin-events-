import type { Metadata } from 'next'
import './globals.css'
import DashboardShell from './DashboardShell'
import {
  fetchAllJoueurs, fetchAllEvents, fetchAllPartenaires,
  fetchAllPros, fetchAllLots
} from '@/lib/dashboard'

export const metadata: Metadata = {
  title: { default: 'Flowin Dashboard', template: '%s | Flowin' },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [joueurs, events, partenaires, pros, lots] = await Promise.all([
    fetchAllJoueurs(),
    fetchAllEvents(),
    fetchAllPartenaires(),
    fetchAllPros(),
    fetchAllLots(),
  ])

  return (
    <DashboardShell
      initialJoueurs={joueurs}
      initialEvents={events}
      initialPartenaires={partenaires}
      initialPros={pros}
      initialLots={lots}
    >
      {children}
    </DashboardShell>
  )
}
