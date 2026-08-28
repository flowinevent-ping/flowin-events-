'use client'

/**
 * Courbe d'evolution quotidienne, en SVG pur, sans dependance.
 * Meme convention que Camembert.tsx (pas de lib de graph externe).
 */
export interface PointQuotidien { jour: string; valeurs: Record<string, number> }
export interface SerieQuotidienne { cle: string; label: string; couleur: string }

const H = 220
const PAD_G = 44
const PAD_D = 14
const PAD_B = 34
const PAD_H = 14

export function CourbeQuotidienne({
  titre, points, series, unite = '',
}: { titre: string; points: PointQuotidien[]; series: SerieQuotidienne[]; unite?: string }) {
  if (!points.length) return null

  const max = Math.max(1, ...points.flatMap(p => series.map(s => p.valeurs[s.cle] ?? 0)))
  const larg = Math.max(560, points.length * 14)
  const zoneW = larg - PAD_G - PAD_D
  const zoneH = H - PAD_H - PAD_B
  const x = (i: number) => PAD_G + (points.length > 1 ? (i / (points.length - 1)) * zoneW : zoneW / 2)
  const y = (v: number) => PAD_H + zoneH - (v / max) * zoneH

  const paliers = 4
  const graduations = Array.from({ length: paliers + 1 }, (_, i) => Math.round((max / paliers) * i))

  // N'affiche qu'un sous-ensemble de labels de dates pour eviter le chevauchement
  const pasLabel = Math.max(1, Math.ceil(points.length / 10))

  return (
    <div style={{ marginBottom: 20 }}>
      {titre && <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 8 }}>{titre}</div>}
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${larg} ${H}`} width={larg} height={H} style={{ display: 'block' }}>
          {graduations.map((g, i) => (
            <g key={i}>
              <line x1={PAD_G} x2={larg - PAD_D} y1={y(g)} y2={y(g)} stroke="var(--sa-border)" strokeWidth={1} />
              <text x={PAD_G - 8} y={y(g) + 4} textAnchor="end" fontSize={10} fill="var(--sa-muted)">{g}</text>
            </g>
          ))}

          {series.map(s => {
            const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.valeurs[s.cle] ?? 0)}`).join(' ')
            return <path key={s.cle} d={d} fill="none" stroke={s.couleur} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
          })}

          {points.map((p, i) => (
            i % pasLabel === 0 ? (
              <text key={p.jour} x={x(i)} y={H - 10} textAnchor="middle" fontSize={9.5} fill="var(--sa-muted)">
                {p.jour.slice(8, 10)}/{p.jour.slice(5, 7)}
              </text>
            ) : null
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
        {series.map(s => (
          <span key={s.cle} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--sa-muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.couleur, display: 'inline-block' }} />
            {s.label}{unite ? ` (${unite})` : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
