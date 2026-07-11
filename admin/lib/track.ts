import { supabase } from '@/lib/supabase'

/**
 * Identifiant de visiteur anonyme (aucune donnée personnelle).
 * Persisté en localStorage : permet de dédoublonner les chargements de page
 * et de mesurer un vrai entonnoir (visiteurs uniques -> étapes -> joueurs).
 */
export function getVisiteurId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const KEY = 'flowin_vid'
    let v = window.localStorage.getItem(KEY)
    if (!v) {
      v = (window.crypto && 'randomUUID' in window.crypto)
        ? window.crypto.randomUUID()
        : 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
      window.localStorage.setItem(KEY, v)
    }
    return v
  } catch {
    return null
  }
}

/**
 * Enregistre une visite / une étape du parcours de façon anonyme.
 * Best-effort : ne bloque jamais l'affichage et n'échoue jamais visiblement.
 * Sert à mesurer l'entonnoir : arrivées (scan / clic) -> jeu -> coordonnées.
 */
export async function trackVisite(page: string, eventId?: string, etape?: string) {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const source = params.get('source') || params.get('utm_source') || 'direct'
    const ua = navigator.userAgent || ''
    const device = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop'
    await supabase.from('visites').insert({
      page,
      source,
      event_id: eventId ?? null,
      etape: etape ?? null,
      visiteur_id: getVisiteurId(),
      referrer: document.referrer || null,
      device,
      user_agent: ua.slice(0, 300),
    })
  } catch {
    /* best-effort */
  }
}
