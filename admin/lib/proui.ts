import type { CSSProperties } from 'react'

/* Styles partages des ecrans Pro brandes (identite Flowin Pro). */
export const CARD: CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 18, marginBottom: 14 }
export const TH: CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: '#64748B', padding: '8px 10px', borderBottom: '1px solid #E2E8F0' }
export const TD: CSSProperties = { padding: '11px 10px', borderBottom: '1px solid #E2E8F0', fontSize: 13 }
export const MUTED: CSSProperties = { color: '#64748B' }
export const H1: CSSProperties = { fontSize: 24, fontWeight: 900, letterSpacing: '-.6px' }
export const SUB: CSSProperties = { fontSize: 13.5, color: '#64748B', marginTop: 2 }
export const ACC = '#7C2D92'

export function kpiGrid(min = 160): CSSProperties {
  return { display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 12, marginBottom: 16 }
}
