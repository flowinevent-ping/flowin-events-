import type { Metadata } from 'next'
import CarteCommercesPublique from './CarteCommercesPublique'
import CaptureSource from '@/components/CaptureSource'

export const metadata: Metadata = {
  title: 'Où jouer · Flowin',
  description: 'Les commerces où jouer en ce moment.',
}

export default function Page() {
  return <><CaptureSource /><CarteCommercesPublique /></>
}
