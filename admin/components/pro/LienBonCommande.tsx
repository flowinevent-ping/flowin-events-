'use client'

import type { CSSProperties } from 'react'
import { preparerBonDeCommande } from '@/lib/prefillCommande'

/** Lien « Choisir mon offre et signer » : prepare le pre-remplissage depuis le compte pro, puis ouvre le bon. */
export default function LienBonCommande({ proId, style, children }: { proId: string; style?: CSSProperties; children: React.ReactNode }) {
  return (
    <a href="/bon-commande-animation.html" style={style}
      onClick={e => { e.preventDefault(); const h = (e.currentTarget as HTMLAnchorElement).href; preparerBonDeCommande(proId).finally(() => { window.location.href = h }) }}>
      {children}
    </a>
  )
}
