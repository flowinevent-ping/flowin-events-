'use client'
import { useEffect, useState } from 'react'
import { fetchLotsRetiresRecents, ilYA } from '@/lib/alertesLots'
import type { GagnantRow } from '@/lib/dashboard'
import { useDashboard } from '@/contexts/DashboardContext'

/** Alerte SA — tous partenaires confondus. Rien à l'écran si rien de récent. */
export default function AlerteLotsRetires() {
  const { partenaires } = useDashboard()
  const [lots, setLots] = useState<GagnantRow[] | null>(null)

  useEffect(() => { fetchLotsRetiresRecents(3).then(setLots) }, [])

  const nomPartenaire = (id: string | null) => (id ? partenaires.find(p => p.id === id)?.nom ?? id : null)

  if (!lots || lots.length === 0) return null

  return (
    <div className="sa-alert live texte" style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>🎉 {lots.length} lot{lots.length > 1 ? 's' : ''} retiré{lots.length > 1 ? 's' : ''} récemment</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontWeight: 500 }}>
        {lots.slice(0, 6).map(t => (
          <div key={t.id}>
            <b>{t.joueur_nom ?? '—'}</b> a retiré <b>{t.lot_nom ?? 'son lot'}</b>
            {t.partenaire_id && <> chez {nomPartenaire(t.partenaire_id)}</>} · {ilYA(t.retire_at as string)}
          </div>
        ))}
        {lots.length > 6 && <div>… et {lots.length - 6} de plus.</div>}
      </div>
    </div>
  )
}
