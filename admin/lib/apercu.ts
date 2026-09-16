/**
 * APERCU DU VRAI JEU pendant la creation d une operation (P3, 16/09).
 *
 * Le cadre telephone de l espace pro (et des parcours SA) charge la vraie page
 * du jeu, sur un event de demonstration, avec `?preview=1&apercu=<json>` :
 * la page applique la saisie en cours (nom, lots, contenu du jeu) aux donnees
 * de l event, sans rien ecrire. En `preview`, aucune visite n est tracee
 * (lib/track.ts) et aucune participation n est ecrite (lib/parcours.ts).
 */
import { supabase } from './supabase'
import type { FlowinLot } from './types'
import type { ParcoursPageData } from './parcours'

export interface SaisieApercu {
  nom?: string
  lots?: { nom: string; quantite?: number; valeur?: number; conditions?: string }[]
  /** Cles de cfg lues par les jeux : quizBanques, bonusBanques, spinSegments, voteItems, logoUrl… */
  cfg?: Record<string, unknown>
}

/** Encodage cote client (UTF-8 -> base64url). */
export function encoderApercu(s: SaisieApercu): string {
  const json = JSON.stringify(s)
  const b64 = typeof window === 'undefined'
    ? Buffer.from(json, 'utf8').toString('base64')
    : btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function lireApercu(sp: { preview?: string; apercu?: string }): SaisieApercu | null {
  if (sp.preview === undefined || !sp.apercu) return null
  try {
    const b64 = sp.apercu.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as SaisieApercu
  } catch {
    return null
  }
}

/** Applique la saisie aux donnees de la page. Recharge les banques si elles changent. */
export async function appliquerApercu<T extends Pick<ParcoursPageData, 'ev' | 'lots'> & { banques?: ParcoursPageData['banques'] }>(
  data: T, s: SaisieApercu | null,
): Promise<T> {
  if (!s || !data.ev) return data
  const ev = { ...data.ev }
  if (s.nom && s.nom.trim()) ev.nom = s.nom.trim()
  const cfg = { ...((ev.cfg ?? {}) as Record<string, unknown>), ...(s.cfg ?? {}) }
  if (s.nom && s.nom.trim()) {
    const front = { ...((cfg.front ?? {}) as Record<string, unknown>) }
    front.titre = s.nom.trim()
    cfg.front = front
  }
  ev.cfg = cfg as typeof ev.cfg
  let lots = data.lots
  if (s.lots) {
    const nomme = s.lots.filter(l => l.nom && l.nom.trim())
    if (nomme.length) {
      lots = nomme.map((l, i) => ({
        ...(data.lots[0] ?? {}),
        id: `apercu-${i + 1}`,
        event_id: ev.id,
        titre: l.nom.trim(),
        nom: l.nom.trim(),
        quantite: l.quantite ?? 1,
        valeur: l.valeur ?? 0,
        conditions: l.conditions ?? null,
      }) as unknown as FlowinLot)
    }
  }
  let banques = data.banques
  if (s.cfg && ('quizBanques' in s.cfg || 'bonusBanques' in s.cfg) && banques !== undefined) {
    const ids = ((cfg.quizBanques ?? []) as string[]).concat((cfg.bonusBanques ?? []) as string[])
      .filter((id, i, a) => a.indexOf(id) === i)
    if (ids.length) {
      const { data: b } = await supabase.from('banques').select('*').in('id', ids)
      banques = (b ?? []) as ParcoursPageData['banques']
    }
  }
  return { ...data, ev, lots, ...(banques !== undefined ? { banques } : {}) }
}
