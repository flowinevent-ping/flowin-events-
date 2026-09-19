'use client'

/**
 * Message unique aux gagnants — le texte vit dans /public/nds/mail-gagnant.js
 * (jamais recopié en JS/TS, cf. sa propre en-tête). Ce fichier ne fait que
 * charger ce script et typer `window.flowinMailGagnant`, pour que toute page
 * (PartenaireDrawer, Stock des lots, Liste des gagnants) partage le même hook
 * au lieu d'en recopier une copie locale.
 */
import { useEffect } from 'react'

declare global {
  interface Window {
    flowinMailGagnant?: {
      sujet: (t: Record<string, unknown>) => string
      corps: (t: Record<string, unknown>) => string
      gmailUrl: (t: Record<string, unknown>) => string
      lienBillet: (t: Record<string, unknown>) => string
    }
  }
}

export function useMailGagnant() {
  useEffect(() => {
    if (window.flowinMailGagnant || document.getElementById('flowin-mail-gagnant-script')) return
    const s = document.createElement('script')
    s.id = 'flowin-mail-gagnant-script'
    s.src = '/nds/mail-gagnant.js'
    document.head.appendChild(s)
  }, [])
}
