'use client'

/**
 * Carte de chaleur soiree x heure.
 * La plage horaire affichee est deduite des donnees, jamais codee en dur :
 * un event de journee et un festival de nuit s affichent aussi bien.
 */
import type { CellulePic } from '@/lib/nds'

const PALIERS = [
  { seuil: 0.00, fond: 'var(--sa-subtle)', texte: 'var(--sa-muted)' },
  { seuil: 0.15, fond: '#efd9ee', texte: '#3a2b45' },
  { seuil: 0.30, fond: '#dcaee0', texte: '#3a2b45' },
  { seuil: 0.50, fond: '#c07fce', texte: '#3a2b45' },
  { seuil: 0.70, fond: '#9d4bb0', texte: '#fff' },
  { seuil: 0.85, fond: '#7C2D92', texte: '#fff' },
]
function palier(n: number, max: number) {
  if (!n) return PALIERS[0]
  const r = n / (max || 1)
  let p = PALIERS[1]
  for (const x of PALIERS) if (r >= x.seuil) p = x
  return p
}
const fr = (d: string) => { const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : d }

export function CarteChaleur({
  cellules, maximum, titre = 'Pics de jeu',
}: { cellules: CellulePic[]; maximum: number; titre?: string }) {
  if (!cellules.length) return null

  /* Heures reellement utilisees, ordonnees en commencant par la premiere heure active
     apres midi : une soiree qui deborde sur la nuit reste lisible de gauche a droite. */
  const heuresActives = Array.from(new Set(cellules.filter(c => c.parties > 0).map(c => c.heure))).sort((a, b) => a - b)
  const soir = heuresActives.filter(h => h >= 12)
  const nuit = heuresActives.filter(h => h < 12)
  const heures = soir.length && nuit.length ? [...soir, ...nuit] : heuresActives

  const soirees = Array.from(new Set(cellules.map(c => c.soiree))).sort()
  const val = new Map(cellules.map(c => [`${c.soiree}|${c.heure}`, c]))

  return (
    <div style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 16, padding: 18, overflowX: 'auto' }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>{titre}</div>
      <table style={{ borderCollapse: 'separate', borderSpacing: 3 }}>
        <thead>
          <tr>
            <th />
            {heures.map(h => (
              <th key={h} style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--sa-muted)', padding: '4px 6px' }}>{h}h</th>
            ))}
            <th style={{ fontSize: 10.5, fontWeight: 800, color: '#7C2D92', padding: '4px 8px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {soirees.map(s => {
            const total = cellules.filter(c => c.soiree === s).reduce((a, c) => a + c.parties, 0)
            return (
              <tr key={s}>
                <th style={{ fontSize: 11, fontWeight: 800, color: 'var(--sa-muted)', padding: '4px 8px', whiteSpace: 'nowrap' }}>{fr(s)}</th>
                {heures.map(h => {
                  const c = val.get(`${s}|${h}`)
                  const n = c?.parties ?? 0
                  const p = palier(n, maximum)
                  return (
                    <td key={h} title={n ? `${n} partie${n > 1 ? 's' : ''} · ${c?.joueurs} joueur${(c?.joueurs ?? 0) > 1 ? 's' : ''}` : undefined}
                      style={{ width: 42, height: 32, textAlign: 'center', fontSize: 11.5, fontWeight: 800, borderRadius: 6, background: p.fond, color: p.texte }}>
                      {n || ''}
                    </td>
                  )
                })}
                <td style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: '#7C2D92', padding: '0 8px' }}>{total}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
