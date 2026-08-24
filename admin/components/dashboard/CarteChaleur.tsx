'use client'

/**
 * Equaliseur vertical des parties par heure, consultable soiree par soiree
 * (selecteur au lieu d'une grille complete affichant toutes les dates a la
 * fois). Meme donnees que l'ancienne carte de chaleur (CellulePic), juste
 * une lecture par date plutot qu'un tableau global.
 */
import { useState, useMemo } from 'react'
import type { CellulePic } from '@/lib/nds'

const fr = (d: string) => { const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : d }

export function CarteChaleur({
  cellules, maximum, titre = 'Pics de jeu',
}: { cellules: CellulePic[]; maximum: number; titre?: string }) {
  const soirees = useMemo(() => Array.from(new Set(cellules.map(c => c.soiree))).sort(), [cellules])
  const [soiree, setSoiree] = useState(soirees[soirees.length - 1] ?? '')

  if (!cellules.length) return null

  const heuresActives = Array.from(new Set(cellules.filter(c => c.parties > 0).map(c => c.heure))).sort((a, b) => a - b)
  const soir = heuresActives.filter(h => h >= 12)
  const nuit = heuresActives.filter(h => h < 12)
  const heures = soir.length && nuit.length ? [...soir, ...nuit] : heuresActives

  const val = new Map(cellules.map(c => [`${c.soiree}|${c.heure}`, c]))
  const barresDuJour = heures.map(h => val.get(`${soiree}|${h}`))
  const maxJour = Math.max(1, ...barresDuJour.map(c => c?.parties ?? 0))
  const totalJour = barresDuJour.reduce((a, c) => a + (c?.parties ?? 0), 0)

  return (
    <div style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{titre} — {fr(soiree)} <span style={{ color: 'var(--sa-muted)', fontWeight: 700 }}>({totalJour} partie{totalJour > 1 ? 's' : ''})</span></div>
        <select value={soiree} onChange={e => setSoiree(e.target.value)} className="sa-input" style={{ width: 'auto', padding: '5px 10px', fontSize: 12.5 }}>
          {soirees.map(s => <option key={s} value={s}>{fr(s)}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 140, overflowX: 'auto', paddingBottom: 4 }}>
        {heures.map(h => {
          const c = val.get(`${soiree}|${h}`)
          const n = c?.parties ?? 0
          const hPx = n ? Math.max(6, Math.round((n / maxJour) * 110)) : 3
          return (
            <div key={h} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 26 }}
              title={n ? `${n} partie${n > 1 ? 's' : ''} · ${c?.joueurs} joueur${(c?.joueurs ?? 0) > 1 ? 's' : ''}` : undefined}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: n ? '#7C2D92' : 'var(--sa-muted)', marginBottom: 3, height: 14 }}>{n || ''}</div>
              <div style={{
                width: 16, height: hPx, borderRadius: 4,
                background: n ? 'linear-gradient(180deg,#A855F7,#7C2D92)' : 'var(--sa-subtle)',
              }} />
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--sa-muted)', marginTop: 5 }}>{h}h</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
