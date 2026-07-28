import { fetchProDashboard } from '@/lib/pro'
import { fetchBanque } from '@/lib/banques'
import ProShell from '@/components/pro/ProShell'
import BanqueEditor from '@/components/pro/BanqueEditor'
import { H1 } from '@/lib/proui'

export default async function EditerBanquePage({ params, searchParams }: { params: { id: string }; searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, banque] = await Promise.all([fetchProDashboard(proId), fetchBanque(params.id)])

  if (!banque || banque.pro_id !== proId) {
    return (
      <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="banques">
        <h1 style={H1}>Banque introuvable</h1>
        <div style={{ fontSize: 13.5, color: '#64748B' }}>Cette banque n&apos;appartient pas à votre espace.</div>
      </ProShell>
    )
  }

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="banques">
      <BanqueEditor banque={banque} proId={proId} estBonus={banque.tags?.includes('bonus') ?? false} />
    </ProShell>
  )
}
