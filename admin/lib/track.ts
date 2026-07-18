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
 * Trace un incident (réseau, écriture, JS) de façon anonyme.
 * Permet de distinguer un abandon volontaire d'un échec technique.
 */
export async function trackErreur(page: string, eventId?: string, type?: string) {
  const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) ? '-offline' : ''
  return trackVisite(page, eventId, 'err:' + (type || 'inconnu') + offline)
}

/**
 * Enregistre une visite / une étape du parcours de façon anonyme.
 * Best-effort : ne bloque jamais l'affichage et n'échoue jamais visiblement.
 * Sert à mesurer l'entonnoir : arrivées (scan / clic) -> jeu -> coordonnées.
 */
/* ── Résilience des scans/visites ──────────────────────────────────────────────
   Symétrie avec la file durable des JEUX (flowin_nds_wq) : un scan qui échoue
   (réseau festival saturé) n'est plus perdu. Il est empilé en localStorage et
   rejoué au retour réseau + au prochain trackVisite. Purement additif : si
   l'insert réussit du premier coup, le comportement est identique à avant.
   + dédup anti-rafale (double-fire d'un même scan sur un seul chargement). */
const VISITES_WQ = 'flowin_visites_wq'
const VISITES_DEDUP = 'flowin_vdedup'
type VisiteRow = Record<string, unknown>

/** true si (visiteur, event, etape) a déjà été loggé il y a moins de ttlMs -> à ignorer. */
function visiteDedupHit(key: string, ttlMs = 10000): boolean {
  try {
    const t = Date.now()
    const raw = window.localStorage.getItem(VISITES_DEDUP)
    const m: Record<string, number> = raw ? JSON.parse(raw) : {}
    for (const k in m) { if (t - m[k] > 60000) delete m[k] } // purge > 1 min
    if (m[key] && t - m[key] < ttlMs) return true
    m[key] = t
    window.localStorage.setItem(VISITES_DEDUP, JSON.stringify(m))
    return false
  } catch { return false }
}

function visitesQueuePush(row: VisiteRow): void {
  try {
    const raw = window.localStorage.getItem(VISITES_WQ)
    const q: VisiteRow[] = raw ? JSON.parse(raw) : []
    q.push(row)
    while (q.length > 200) q.shift() // cap : évite une croissance illimitée
    window.localStorage.setItem(VISITES_WQ, JSON.stringify(q))
  } catch { /* best-effort */ }
}

async function insertVisite(row: VisiteRow): Promise<boolean> {
  try {
    const { error } = await supabase.from('visites').insert(row)
    return !error
  } catch { return false }
}

/** Rejoue les visites en attente. Ne retire que celles réellement écrites. */
export async function flushVisites(): Promise<void> {
  if (typeof window === 'undefined') return
  let q: VisiteRow[]
  try {
    const raw = window.localStorage.getItem(VISITES_WQ)
    q = raw ? JSON.parse(raw) : []
  } catch { return }
  if (!q.length) return
  const rest: VisiteRow[] = []
  for (const row of q) {
    const ok = await insertVisite(row)
    if (!ok) rest.push(row)
  }
  try { window.localStorage.setItem(VISITES_WQ, JSON.stringify(rest)) } catch { /* best-effort */ }
}

// Rejoue automatiquement la file au retour du réseau (enregistré une seule fois).
if (typeof window !== 'undefined' && !(window as unknown as { __flowinVWQ?: boolean }).__flowinVWQ) {
  ;(window as unknown as { __flowinVWQ?: boolean }).__flowinVWQ = true
  window.addEventListener('online', () => { void flushVisites() })
}

export async function trackVisite(page: string, eventId?: string, etape?: string) {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const source = params.get('source') || params.get('utm_source') || 'direct'
    const ua = navigator.userAgent || ''
    const device = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop'
    const vid = getVisiteurId()
    // dédup anti-rafale : même (visiteur, station, étape) à < 10 s => on ignore
    if (visiteDedupHit((vid || 'anon') + '|' + (eventId ?? '') + '|' + (etape ?? ''))) return
    const row: VisiteRow = {
      page,
      source,
      event_id: eventId ?? null,
      etape: etape ?? null,
      visiteur_id: vid,
      referrer: document.referrer || null,
      device,
      user_agent: ua.slice(0, 300),
    }
    void flushVisites()               // tente d'abord de vider la file en attente
    const ok = await insertVisite(row)
    if (!ok) visitesQueuePush(row)    // échec -> mise en file, rejouée plus tard
  } catch {
    /* best-effort */
  }
}
