import type { Metadata } from 'next'
import { fetchEvent } from '@/lib/events'
import { fetchLots } from '@/lib/lots'
import { fetchPartenaires } from '@/lib/partenaires'
import QuizClient from './QuizClient'

interface Props { searchParams: { ev?: string } }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const ev = await fetchEvent(searchParams.ev ?? '')
  return {
    title: ev ? `${ev.nom} — Quiz` : 'Quiz Flowin',
    description: ev?.description ?? 'Répondez aux questions et tentez de gagner !',
  }
}

export default async function QuizPage({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  const event = await fetchEvent(evId)
  const lots  = event ? await fetchLots(evId) : []
  const partenaires = event ? await fetchPartenaires(event.cfg?.partenaires ?? []) : []
  return (
    <QuizClient event={event} lots={lots} partenaires={partenaires} evId={evId} />
  )
}
