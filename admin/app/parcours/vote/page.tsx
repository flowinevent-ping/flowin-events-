import type { Metadata } from 'next'
import { fetchEvent } from '@/lib/events'
import { fetchLots } from '@/lib/lots'
import { fetchPartenaires } from '@/lib/partenaires'
import VoteClient from './VoteClient'

interface Props { searchParams: { ev?: string } }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const ev = await fetchEvent(searchParams.ev ?? '')
  return {
    title: ev ? `${ev.nom} — Vote` : 'Vote Flowin',
    description: ev?.description ?? 'Votez pour vos artistes préférés !',
  }
}

export default async function VotePage({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  const event = await fetchEvent(evId)
  const lots  = event ? await fetchLots(evId) : []
  const partenaires = event ? await fetchPartenaires(event.cfg?.partenaires ?? []) : []
  return (
    <VoteClient event={event} lots={lots} partenaires={partenaires} evId={evId} />
  )
}
