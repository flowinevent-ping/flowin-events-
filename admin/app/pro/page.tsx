import type { Metadata } from 'next'
import { fetchProDashboard } from '@/lib/pro'
import { supabase } from '@/lib/supabase'
import ProClient from './ProClient'

export const metadata: Metadata = {
  title: 'Dashboard Pro — Flowin',
}

interface Props {
  searchParams: { pro?: string; ev?: string }
}

export default async function ProPage({ searchParams }: Props) {
  let proId = searchParams.pro ?? ''
  const evId = searchParams.ev ?? ''

  /* Si ?ev= fourni sans ?pro= → récupérer le pro_id depuis l'event */
  if (!proId && evId) {
    const { data: ev } = await supabase
      .from('events')
      .select('pro_id')
      .eq('id', evId)
      .single()
    proId = ev?.pro_id ?? ''
  }

  const data = await fetchProDashboard(proId)

  return (
    <ProClient
      initialData={data}
      proId={proId}
      defaultEvId={evId || data.events[0]?.id}
    />
  )
}
