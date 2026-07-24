'use client'

/**
 * Camembert (donut) en SVG pur, sans dependance.
 * Romain a explicitement refuse les barres horizontales pour les repartitions.
 */
export interface PartCamembert { valeur: string; n: number }

const PALETTE = ['#7C2D92', '#E0218A', '#F5A100', '#1D9E75', '#378ADD', '#cfc4d8', '#9d4edd', '#ff8fab']

export function Camembert({
  titre, parts, total, unite = '',
}: { titre: string; parts: PartCamembert[]; total?: number; unite?: string }) {
  const somme = total ?? parts.reduce((s, p) => s + p.n, 0)
  if (!somme) return null

  const R = 78, EP = 32, C = 2 * Math.PI * R
  let offset = 0
  const arcs = parts.map((p, i) => {
    const long = (C * p.n) / somme
    const el = (
      <circle key={p.valeur} cx="100" cy="100" r={R} fill="none"
        stroke={PALETTE[i % PALETTE.length]} strokeWidth={EP}
        strokeDasharray={`${long.toFixed(1)} ${(C - long).toFixed(1)}`}
        strokeDashoffset={-offset} transform="rotate(-90 100 100)" />
    )
    offset += long
    return el
  })

  return (
    <div style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>{titre}</div>
      <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width="180" height="180" viewBox="0 0 200 200" style={{ flex: 'none' }}>
          {arcs}
          <circle cx="100" cy="100" r={R - EP / 2} fill="var(--sa-card)" />
          <text x="100" y="97" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--sa-text)">{somme}</text>
          <text x="100" y="115" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--sa-muted)">{unite}</text>
        </svg>
        <div style={{ flex: 1, minWidth: 180 }}>
          {parts.map((p, i) => (
            <div key={p.valeur} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: i < parts.length - 1 ? '1px solid var(--sa-border)' : 'none' }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: PALETTE[i % PALETTE.length], flex: 'none' }} />
              <span style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{p.valeur}</span>
              <span style={{ fontSize: 12, color: 'var(--sa-muted)' }}>{p.n}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#7C2D92', width: 46, textAlign: 'right' }}>
                {Math.round((p.n / somme) * 1000) / 10} %
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
