import { fetchProDashboard } from '@/lib/pro'
import { fetchBanque } from '@/lib/banques'
import ProShell from '@/components/pro/ProShell'
import BanqueEditor from '@/components/pro/BanqueEditor'
import { H1 } from '@/lib/proui'

export default async function EditerBanquePage({ params, searchParams }: { params: { id: string }; searchParams: { pro?: string; depuis?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, banque] = await Promise.all([fetchProDashboard(proId), fetchBanque(params.id)])
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''

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
      {searchParams.depuis === 'jeu' && (
        <a href={`/pro/jeu${q}`} style={{ display: 'inline-block', marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#7C2D92', textDecoration: 'none', background: 'rgba(124,45,146,.08)', borderRadius: 10, padding: '9px 14px' }}>
          ← Revenir au parcours « Créer mon animation » (onglet précédent, ou cliquez ici)
        </a>
      )}
      <BanqueEditor banque={banque} proId={proId} estBonus={banque.tags?.includes('bonus') ?? false} />
    </ProShell>
  )
}
