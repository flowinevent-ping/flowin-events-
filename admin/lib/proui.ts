import type { CSSProperties } from 'react'
import { CHARTE } from './charte'

/* Styles partages des ecrans Pro -- ALIGNES sur la grammaire du dashboard SA
   (famille J) : titre de page 20/800 comme .sa-page-title, sous-titre 12 px
   comme .sa-page-subtitle, cartes rayon 12, en-tetes de tableau comme .sa-tbl th.
   Couleurs : lib/charte.ts, source unique. */
export const CARD: CSSProperties = { background: CHARTE.carte, border: `1px solid ${CHARTE.bordure}`, borderRadius: 12, padding: 18, marginBottom: 14 }
export const TH: CSSProperties = { textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: CHARTE.attenue, padding: '10px 16px', borderBottom: `1px solid ${CHARTE.bordure}`, background: CHARTE.subtil, whiteSpace: 'nowrap' }
export const TD: CSSProperties = { padding: '11px 16px', borderBottom: `1px solid ${CHARTE.bordure}`, fontSize: 13, verticalAlign: 'middle' }
export const MUTED: CSSProperties = { color: CHARTE.attenue }
export const H1: CSSProperties = { fontSize: 20, fontWeight: 800 }
export const SUB: CSSProperties = { fontSize: 12, color: CHARTE.attenue, marginTop: 2 }
export const ACC = CHARTE.accent

export function kpiGrid(min = 160): CSSProperties {
  return { display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 12, marginBottom: 16 }
}
