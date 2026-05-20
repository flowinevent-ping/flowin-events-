import type { Metadata } from 'next'
import { fetchEvent } from '@/lib/events'
import { fetchLots } from '@/lib/lots'
import { fetchPartenaires } from '@/lib/partenaires'
import QuizMasterClient from './QuizMasterClient'

interface Props { searchParams: { ev?: string } }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const ev = await fetchEvent(searchParams.ev ?? '')
  return {
    title: ev ? `${ev.nom} — QuizMaster` : 'QuizMaster Flowin',
    description: ev?.description ?? 'Quiz en direct — répondez vite !',
  }
}

export default async function QuizMasterPage({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  const event = await fetchEvent(evId)
  const lots  = event ? await fetchLots(evId) : []
  const partenaires = event ? await fetchPartenaires(event.cfg?.partenaires ?? []) : []
  return (
    <QuizMasterClient event={event} lots={lots} partenaires={partenaires} evId={evId} />
  )
}
