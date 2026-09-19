import { fetchGagnants, type GagnantRow } from './dashboard'

/**
 * Lots retirés récemment — alerte SA (tous partenaires) et Pro (un partenaire).
 * Romain (19/09) : « je veux voir apparaître une alerte avec les gagnants qui
 * ont retiré les lots, dans SA et également dans Pro ». Pas de mécanisme de
 * "vu/pas vu" en base : la fenêtre de récence (3 jours par défaut) fait office
 * d'alerte, plutôt qu'une liste qui grossirait indéfiniment.
 */
export async function fetchLotsRetiresRecents(joursRecents = 3, partenaireId?: string): Promise<GagnantRow[]> {
  const seuil = Date.now() - joursRecents * 24 * 60 * 60 * 1000
  const tous = await fetchGagnants()
  return tous
    .filter(t => !!t.retire_at && new Date(t.retire_at).getTime() >= seuil)
    .filter(t => !partenaireId || t.partenaire_id === partenaireId)
    .sort((a, b) => new Date(b.retire_at as string).getTime() - new Date(a.retire_at as string).getTime())
}

/** "il y a 2h", "il y a 3j"... best-effort, pas de dépendance externe. */
export function ilYA(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const j = Math.floor(h / 24)
  return `il y a ${j}j`
}
