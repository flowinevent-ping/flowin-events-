import type { Metadata } from 'next'
import LandingClient from './LandingClient'

export const metadata: Metadata = {
  title: 'Flowin — Capturez vos clients en un scan',
  description: 'La solution gamification pour capter et fidéliser vos clients. Tombola, quiz, spin — branché à votre CRM.',
  openGraph: {
    title: 'Flowin — Gamification événementielle',
    description: 'Capturez les contacts de vos visiteurs en 30 secondes.',
    type: 'website',
  },
}

interface Props {
  searchParams: { source?: string; pro?: string }
}

export default function LandingPage({ searchParams }: Props) {
  return <LandingClient source={searchParams.source} proId={searchParams.pro} />
}
