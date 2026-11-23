/* Repères de la page publique Super Event (maquette lot 4 v2, validée par Romain).
   Le logo d'un commerce vit dans `partenaires.image_url` ; le lien station -> partenaire
   est `partenaires.event_id` (déjà utilisé par dashboard/operations). Rien n'est inventé :
   sans logo, la pastille porte l'initiale du nom. */
import { supabase } from './supabase'

export type LieuRepere = { id: string; nom: string; lat: number | null; lng: number | null; logo?: string | null }

/** Logos par station : { event_id: image_url }. Lecture seule, jamais bloquant. */
export async function chargerLogosStations(seId: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  try {
    const { data } = await supabase.from('partenaires').select('image_url,event_id').eq('super_event_id', seId).not('event_id', 'is', null)
    ;((data ?? []) as { image_url?: string | null; event_id?: string | null }[]).forEach((p) => {
      const u = (p.image_url || '').trim()
      if (p.event_id && u && !out[p.event_id]) out[p.event_id] = u
    })
  } catch { /* sans logo : initiales */ }
  return out
}

export function initiale(nom: string): string {
  const m = (nom || '').replace(/^[^A-Za-zÀ-ÿ0-9]+/, '')
  return (m.charAt(0) || '?').toUpperCase()
}

function dist(a: LieuRepere, b: LieuRepere): number {
  const R = 6371000, r = (d: number) => (d * Math.PI) / 180
  const dLa = r((b.lat as number) - (a.lat as number)), dLo = r((b.lng as number) - (a.lng as number))
  const s = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat as number)) * Math.cos(r(b.lat as number)) * Math.sin(dLo / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Sépare les commerces (avec logo, ou isolés) des points du festival sans logo (bars, caisses, écran)
    qui sont regroupés par proximité (moins de 80 m) en un rond avec le nombre. */
export function separerReperes<T extends LieuRepere>(lieux: T[]): { commerces: T[]; groupes: T[][] } {
  const avecPos = (l: T) => typeof l.lat === 'number' && typeof l.lng === 'number'
  const sansLogo = lieux.filter((l) => !l.logo && avecPos(l))
  const groupes: T[][] = []
  const pris = new Set<string>()
  sansLogo.forEach((l) => {
    if (pris.has(l.id)) return
    const g = sansLogo.filter((o) => !pris.has(o.id) && (o.id === l.id || dist(l, o) < 80))
    if (g.length >= 2) { g.forEach((o) => pris.add(o.id)); groupes.push(g) }
  })
  return { commerces: lieux.filter((l) => !pris.has(l.id)), groupes }
}
