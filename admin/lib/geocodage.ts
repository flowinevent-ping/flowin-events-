/**
 * Geocodage d'une adresse en latitude/longitude, via Nominatim (OpenStreetMap,
 * gratuit, sans cle). Volume vise : quelques demandes de rattachement par
 * semaine, largement sous la limite d'usage raisonnable du service.
 *
 * Ne bloque jamais l'appelant : renvoie null si l'adresse est vide, si le
 * service ne repond pas ou si aucun resultat n'est trouve — a l'appelant de
 * decider quoi faire (laisser sans GPS, avertir, etc.), jamais de coordonnee
 * inventee ici.
 */
export async function geocoderAdresse(adresse: string | null, codePostal: string | null, ville: string | null): Promise<{ lat: number; lng: number } | null> {
  const q = [adresse, codePostal, ville, 'France'].filter(v => v && v.trim()).join(', ')
  if (!q.trim()) return null
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=${encodeURIComponent(q)}`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) return null
    const rows = (await res.json()) as Array<{ lat: string; lon: string }>
    if (!rows.length) return null
    const lat = parseFloat(rows[0].lat)
    const lng = parseFloat(rows[0].lon)
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  } catch {
    return null
  }
}
