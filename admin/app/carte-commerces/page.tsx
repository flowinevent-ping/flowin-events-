import type { Metadata } from 'next'
import CarteCommercesPublique from './CarteCommercesPublique'

export const metadata: Metadata = {
  title: 'Où jouer · Flowin',
  description: 'Les commerces où jouer en ce moment.',
}

export default function Page() {
  return <CarteCommercesPublique />
}
