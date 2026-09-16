import type { CSSProperties } from 'react'
import { CHARTE_PRO as C, POLICE_PRO } from './charte'

/* Styles partages des ecrans Pro — charte de l application joueur (P6,
   lib/charte.ts CHARTE_PRO). Un seul jeu de styles pour toutes les pages pro. */
export const CARD: CSSProperties = { background: C.carte, border: `1px solid ${C.bordure}`, borderRadius: 18, padding: 18, marginBottom: 14, boxShadow: '0 6px 18px rgba(43,16,54,.05)' }
export const TH: CSSProperties = { textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: C.attenue, padding: '10px 16px', borderBottom: `1px solid ${C.bordure}`, background: C.subtil, whiteSpace: 'nowrap' }
export const TD: CSSProperties = { padding: '11px 16px', borderBottom: `1px solid ${C.bordure}`, fontSize: 13, verticalAlign: 'middle' }
export const MUTED: CSSProperties = { color: C.attenue }
export const H1: CSSProperties = { fontSize: 22, fontWeight: 800, fontFamily: POLICE_PRO, color: C.texte }
export const SUB: CSSProperties = { fontSize: 13, color: C.attenue, marginTop: 2 }
export const ACC = C.accent

/** Champ de saisie, bouton principal et bouton secondaire de l application. */
export const CHAMP: CSSProperties = { width: '100%', padding: '12px 14px', background: C.champ, border: `1.5px solid ${C.bordureChamp}`, borderRadius: 13, color: C.texte, fontSize: 15, fontWeight: 600, fontFamily: POLICE_PRO, outline: 'none', boxSizing: 'border-box' }
export const LABEL: CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: C.attenue, marginBottom: 6 }
export const BTN: CSSProperties = { border: 'none', borderRadius: 50, padding: '14px 26px', fontFamily: POLICE_PRO, fontWeight: 800, fontSize: 15, color: '#fff', cursor: 'pointer', background: C.degrade, boxShadow: '0 10px 24px rgba(224,33,138,.28)' }
export const BTN2: CSSProperties = { border: `1.5px solid ${C.bordureChamp}`, borderRadius: 50, padding: '12px 22px', fontFamily: POLICE_PRO, fontWeight: 700, fontSize: 14, color: C.accent, cursor: 'pointer', background: '#fff' }
/** Carte a choisir (jeu, type d operation) : bordure magenta quand choisie. */
export function choix(actif: boolean): CSSProperties {
  return {
    border: actif ? `2px solid ${C.magenta}` : `1.5px solid ${C.bordureChamp}`,
    background: actif ? 'rgba(224,33,138,.07)' : C.champ,
    borderRadius: 16, padding: 16, cursor: 'pointer', textAlign: 'left', fontFamily: POLICE_PRO, color: C.texte,
  }
}

export function kpiGrid(min = 160): CSSProperties {
  return { display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 12, marginBottom: 16 }
}
