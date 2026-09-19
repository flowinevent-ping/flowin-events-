import { fetchLotsRetiresRecents, ilYA } from '@/lib/alertesLots'
import { CHARTE_PRO as C } from '@/lib/charte'

/** Alerte Pro — les lots retirés chez CE partenaire uniquement, ces derniers jours. */
export default async function AlerteLotsRetires({ partenaireId }: { partenaireId: string | null }) {
  if (!partenaireId) return null
  const lots = await fetchLotsRetiresRecents(3, partenaireId)
  if (lots.length === 0) return null

  return (
    <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 14, padding: '14px 16px', marginBottom: 16, color: '#15803D' }}>
      <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 14 }}>🎉 {lots.length} lot{lots.length > 1 ? 's' : ''} retiré{lots.length > 1 ? 's' : ''} récemment</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13, fontWeight: 600 }}>
        {lots.slice(0, 6).map(t => (
          <div key={t.id}>
            <b>{t.joueur_nom ?? '—'}</b> a retiré <b>{t.lot_nom ?? 'son lot'}</b> · {ilYA(t.retire_at as string)}
          </div>
        ))}
        {lots.length > 6 && <div>… et {lots.length - 6} de plus.</div>}
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: C.accentFonce, opacity: .7 }}>Dernières 72h — voir l&apos;historique complet dans Mes données → Gagnants.</div>
    </div>
  )
}
