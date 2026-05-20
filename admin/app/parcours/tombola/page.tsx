import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import TombolaClient from './TombolaClient'
import type { FlowinEvent, FlowinLot, FlowinPartenaire } from '@/lib/types'

interface Props {
  searchParams: { ev?: string }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const evId = searchParams.ev ?? ''
  if (!evId) return { title: 'Tombola — Flowin' }
  const { data } = await supabase.from('events').select('nom, couleur').eq('id', evId).single()
  return {
    title: data?.nom ?? 'Tombola — Flowin',
    description: 'Participez et tentez de remporter des lots.',
    themeColor: data?.couleur ?? '#E8212B',
  }
}

export default async function TombolaPage({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  if (!evId) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#888' }}>
        Aucun event configuré.
      </div>
    )
  }

  const [evRes, lotsRes] = await Promise.all([
    supabase.from('events').select('*').eq('id', evId).single(),
    supabase.from('lots').select('*').eq('event_id', evId),
  ])

  const ev = evRes.data as FlowinEvent | null
  const lots = (lotsRes.data ?? []) as FlowinLot[]

  /* Partenaires depuis cfg.partenaires */
  const partIds: string[] = ev?.cfg?.partenaires ?? []
  let partenaires: FlowinPartenaire[] = []
  if (partIds.length) {
    const { data } = await supabase
      .from('partenaires')
      .select('id,nom,emoji,description,promo_text,site_web,url,instagram,facebook,image_url,actif')
      .in('id', partIds)
    partenaires = (data ?? []).filter(p => p.actif !== false) as FlowinPartenaire[]
  }

  return (
    <TombolaClient
      ev={ev}
      lots={lots}
      partenaires={partenaires}
      evId={evId}
    />
  )
}
