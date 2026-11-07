'use client'

import { useEffect, useRef } from 'react'

/** Hook commun des panneaux superposes (tiroir, modales, menu mobile) :
 * - Echap ferme le panneau ;
 * - a l ouverture, une entree d historique est poussee : le bouton Retour
 *   (Android, geste iOS, navigateur) ferme le panneau au lieu de quitter la page ;
 * - a la fermeture par un autre moyen (croix, fond), l entree est consommee
 *   pour ne pas laisser un « Retour » qui ne ferait rien.
 * Optionnel : bloque le defilement de la page derriere (bloquerScroll). */
export function useFermetureOverlay(ouvert: boolean, fermer: () => void, bloquerScroll = false) {
  const fermerRef = useRef(fermer)
  fermerRef.current = fermer

  useEffect(() => {
    if (!ouvert || typeof window === 'undefined') return
    let fermeParRetour = false
    const marque = Date.now() + Math.random()
    try { window.history.pushState({ flowinOverlay: marque }, '') } catch { /* rien */ }

    function onPop() { fermeParRetour = true; fermerRef.current() }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') fermerRef.current() }
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)

    const ancienOverflow = document.body.style.overflow
    if (bloquerScroll) document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
      if (bloquerScroll) document.body.style.overflow = ancienOverflow
      if (!fermeParRetour) {
        try {
          const st = window.history.state as { flowinOverlay?: number } | null
          if (st && st.flowinOverlay === marque) window.history.back()
        } catch { /* rien */ }
      }
    }
  }, [ouvert, bloquerScroll])
}
