'use client'
import { useEffect } from 'react'
import { capturerSource } from '@/lib/source'

/** Retient le canal d'origine (?src=, 1re visite, localStorage flowin_src) sur une page d'arrivée (QR des films, liens commerciaux). */
export default function CaptureSource() {
  useEffect(() => { capturerSource() }, [])
  return null
}
