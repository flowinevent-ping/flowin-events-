import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import CrmTabs from '@/components/pro/CrmTabs'
import { H1, SUB } from '@/lib/proui'

export default async function ProCrmPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="crm">
      <h1 style={H1}>Mon CRM</h1><div style={SUB}>Vos contacts — chaque joueur devient un client. Cliquez une ligne pour voir la fiche complète.</div>
      <CrmTabs joueurs={data.joueurs} proId={proId} />
    </ProShell>
  )
}
