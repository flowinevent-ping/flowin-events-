'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { trackVisite, trackErreur } from '@/lib/track'

/**
 * ============================================================================
 *  TRAÇAGE GÉNÉRIQUE DES PARCOURS — règle unique, valable pour TOUS les modules
 * ============================================================================
 *
 *  Toute page de parcours (quiz, spin, tombola, vote, nds2026, futurs modules)
 *  appelle useParcoursTracking(). Elle hérite alors automatiquement de :
 *
 *   1. le SCAN            -> une ligne `visites` (etape NULL) à l'ouverture
 *   2. les ÉTAPES         -> une ligne `visites` par écran franchi (dédoublonnée)
 *   3. les INCIDENTS      -> erreurs JS, promesses rejetées, retours réseau
 *   4. les CLICS PARTENAIRE -> logClicPartenaire(), y compris l'ouverture de fiche
 *
 *  Aucun identifiant d'event n'est codé en dur : tout est dérivé de (page, evId).
 *  Créer une nouvelle station, un nouveau partenaire ou un nouveau super-event
 *  ne demande donc AUCUNE ligne de code : les statistiques suivent d'elles-mêmes.
 *
 *  Côté restitution, les RPC sont également génériques (paramètre p_se) :
 *    super_event_daily · super_event_funnel · super_event_stations
 *    super_event_clics · super_event_sondage
 * ============================================================================
 */

/** Trace le scan d'ouverture + chaque étape franchie + les incidents. */
export function useParcoursTracking(page: string, evId: string | undefined, screen?: string) {
  // 1. Scan d'ouverture (une ligne par ouverture / changement de station)
  useEffect(() => {
    if (!evId) return
    void trackVisite(page, evId)
  }, [page, evId])

  // 2. Étapes franchies — dédoublonnées : une seule ligne par (station, écran)
  const vues = useRef<Record<string, boolean>>({})
  useEffect(() => {
    if (!evId || !screen) return
    const k = evId + ':' + screen
    if (vues.current[k]) return
    vues.current[k] = true
    void trackVisite(page, evId, screen)
  }, [page, evId, screen])

  // 3. Incidents : distingue un abandon volontaire d'un échec technique
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onErr = (e: ErrorEvent) => { void trackErreur(page, evId, 'js:' + String(e.message || '').slice(0, 60)) }
    const onRej = () => { void trackErreur(page, evId, 'promise') }
    const onOnline = () => { void trackErreur(page, evId, 'reprise-reseau') }
    window.addEventListener('error', onErr)
    window.addEventListener('unhandledrejection', onRej)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('error', onErr)
      window.removeEventListener('unhandledrejection', onRej)
      window.removeEventListener('online', onOnline)
    }
  }, [page, evId])
}

/**
 * Trace un clic partenaire, quel que soit le module.
 * lienKey = 'fiche' (ouverture de la fiche, url null) ou 'site_web' | 'instagram'
 * | 'facebook' | 'maps' (lien sortant). Best-effort : ne bloque jamais l'UI.
 */
export function logClicPartenaire(
  partenaireId: string,
  lienKey: string,
  url: string | null,
  evId?: string,
  joueurId?: string | null,
) {
  if (!partenaireId) return
  if (lienKey !== 'fiche' && !url) return
  try {
    void supabase.from('partenaire_clics').insert({
      partenaire_id: partenaireId,
      event_id: evId ?? null,
      lien_key: lienKey,
      url,
      joueur_id: joueurId ?? null,
    })
  } catch {
    /* best-effort */
  }
}
