import type { Metadata } from 'next'
import { supabase, supabaseVivant } from '@/lib/supabase'
import TombolaClient from './TombolaClient'
import AnimationIndisponible from '@/components/parcours/AnimationIndisponible'
import { motifIndisponible } from '@/lib/etatAnimation'
import { lireApercu, appliquerApercu } from '@/lib/apercu'
import { versMasterSiBesoin } from '@/lib/masters/redirection'
import type { FlowinEvent, FlowinLot, FlowinPartenaire } from '@/lib/types'

interface Props {
  searchParams: { ev?: string; preview?: string; apercu?: string }
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
    supabaseVivant.from('events').select('*').eq('id', evId).single(),
    supabaseVivant.from('lots').select('*').eq('event_id', evId),
  ])

  /* Apercu pendant la creation (lib/apercu.ts). */
  const { ev, lots } = await appliquerApercu(
    { ev: evRes.data as FlowinEvent | null, lots: (lotsRes.data ?? []) as FlowinLot[] },
    lireApercu(searchParams),
  )

  const motif = motifIndisponible(ev as { status?: string; date_d?: string | null; date_f?: string | null; module?: string | null } | null, searchParams)
  if (motif) return <AnimationIndisponible motif={motif} nom={ev?.nom} debut={ev?.date_d} />

  /* Animation sur un master de jeu : parcours /jouer (lib/masters). */
  versMasterSiBesoin(evId, ev?.cfg, searchParams as Record<string, string | undefined>, ev?.module)

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
