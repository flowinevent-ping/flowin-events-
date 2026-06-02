import { supabase } from '@/lib/supabase'

/**
 * Enregistre une visite de page de façon anonyme (aucune donnée personnelle).
 * Best-effort : ne bloque jamais l'affichage et n'échoue jamais visiblement.
 * Sert à mesurer l'entonnoir : arrivées (scan / clic) -> jeux -> coordonnées.
 */
export async function trackVisite(page: string, eventId?: string) {
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
      referrer: document.referrer || null,
      device,
      user_agent: ua.slice(0, 300),
    })
  } catch {
    /* best-effort */
  }
}
