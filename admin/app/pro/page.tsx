import type { Metadata } from 'next'
import { fetchProDashboard } from '@/lib/pro'
import ProClient from './ProClient'

interface Props {
  searchParams: { pro?: string; ev?: string }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return {
    title: 'Dashboard Pro — Flowin',
    description: 'Suivez vos events en temps réel',
  }
}

export default async function ProPage({ searchParams }: Props) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)

  return (
    <ProClient
      initialData={data}
      proId={proId}
      defaultEvId={searchParams.ev}
    />
  )
}
