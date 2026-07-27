import type { Metadata } from 'next'
import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'

export const metadata: Metadata = { title: 'Dashboard Pro — Flowin' }

interface Props { searchParams: { pro?: string; ev?: string } }

export default async function ProAccueilPage({ searchParams }: Props) {
  let proId = searchParams.pro ?? ''
  const evId = searchParams.ev ?? ''
  if (!proId && evId) {
    const { data: ev } = await supabase.from('events').select('pro_id').eq('id', evId).single()
    proId = ev?.pro_id ?? ''
  }
  const data = await fetchProDashboard(proId)
  const proName = data.pro?.nom ?? 'Mon établissement'
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 18 }
  const kpi = (v: React.ReactNode, k: string, acc = false) => (
    <div style={card}><div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', color: acc ? '#7C2D92' : '#0F172A' }}>{v}</div><div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>{k}</div></div>
  )
  const optin = data.joueurs.filter(j => j.optin).length

  return (
    <ProShell proName={proName} proId={proId} active="accueil">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-.6px' }}>Bonjour, {proName} 👋</h1>
          <div style={{ fontSize: 14, color: '#64748B', marginTop: 2 }}>Voici votre activité en un coup d'œil.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 18 }}>
        {kpi(data.joueurs.length, 'joueurs', true)}
        {kpi(data.events.length, 'events')}
        {kpi(optin, 'contacts opt-in')}
        {kpi(data.lots.length, 'lots')}
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: '#64748B', marginBottom: 12 }}>Que voulez-vous faire ?</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10 }}>
          <Link href={`/pro/tirage${q}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', border: '1px solid #E2E8F0', borderRadius: 13, textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontSize: 20 }}>🎲</span><span style={{ flex: 1 }}><b style={{ fontSize: 14 }}>Gagnants &amp; tirage</b><br /><small style={{ color: '#64748B' }}>Tirage, billets, envoi des lots</small></span><span style={{ color: '#7C2D92', fontWeight: 800 }}>→</span>
          </Link>
        </div>
      </div>

      <div style={{ ...card, background: '#F8FAFC', fontSize: 12.5, color: '#64748B', lineHeight: 1.6 }}>
        Espace Pro brandé (identité Flowin Pro) — connecté aux vraies données de votre compte{proId ? '' : ' (ajoutez ?pro=VOTRE_ID pour cibler un compte)'}.
        {' '}Les écrans jeu / events / lots / CRM / tracking / super arrivent au même design. Aperçu complet du parcours :{' '}
        <a href="/schemas/flowin-dashboard-pro.html" target="_blank" rel="noreferrer" style={{ color: '#7C2D92', fontWeight: 700 }}>desktop</a>{' · '}
        <a href="/schemas/flowin-pro-mobile.html" target="_blank" rel="noreferrer" style={{ color: '#7C2D92', fontWeight: 700 }}>mobile</a>.
      </div>
    </ProShell>
  )
}
