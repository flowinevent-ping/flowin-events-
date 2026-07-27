import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import { CARD, MUTED, H1, SUB, ACC } from '@/lib/proui'

const JEUX = [
  { m: 'quiz', t: 'Quiz', s: 'QCM + questions bonus' },
  { m: 'spin', t: 'Roue de la fortune', s: 'Tirage instantané, segments = lots' },
  { m: 'tombola', t: 'Tombola', s: 'Inscription + grand tirage' },
  { m: 'vote', t: 'Vote', s: 'Vote produits / artistes' },
]

export default async function ProJeuPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const modulesUtilises = new Set(data.events.map(e => String(e.module)))
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="jeu">
      <h1 style={H1}>Choisir un jeu</h1><div style={{ ...SUB, marginBottom: 18 }}>Sélectionnez un jeu, réglez vos lots, publiez votre QR.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
        {JEUX.map(g => {
          const actif = modulesUtilises.has(g.m)
          return (
            <div key={g.m} style={{ ...CARD, borderColor: actif ? 'rgba(168,85,247,.5)' : '#E2E8F0', background: actif ? 'rgba(168,85,247,.05)' : '#fff' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{g.t}</div>
              <div style={{ fontSize: 12.5, ...MUTED, marginTop: 4 }}>{g.s}</div>
              {actif && <div style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: ACC }}>✓ Déjà utilisé sur un de vos events</div>}
            </div>
          )
        })}
      </div>
      <div style={{ ...CARD, marginTop: 14, background: '#F8FAFC', fontSize: 12.5, ...MUTED, lineHeight: 1.6 }}>
        L&apos;éditeur complet (banques de questions, segments de roue, réglages) arrive au même design. Les banques, questions et
        règles viennent du même moteur que le Dashboard SA — le moteur ne change pas.
      </div>
    </ProShell>
  )
}
