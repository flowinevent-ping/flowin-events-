/**
 * Etat d'une animation vu par un joueur qui flashe un QR (verification du 01/11).
 *
 * Avant : un QR vers une animation inexistante affichait la maquette
 * « Boulangerie Exemple » (/jouer) ou une page generique ; une animation
 * terminee ou pas encore commencee restait jouable. Desormais le joueur lit un
 * message clair et rien n'est ecrit.
 *
 * Regles (jour = jour calendaire a Paris) :
 *  - terminee  : status past / archived, OU date de fin depassee ;
 *  - a venir   : status pending (en attente de paiement, Lot A), date de debut dans le futur, OU status draft sans date,
 *                OU status upcoming sans date ;
 *  - ouverte   : tout le reste (en particulier status live, dates non renseignees).
 */
export type EtatAnimation = 'ouverte' | 'terminee' | 'avenir'

export interface AnimationDates { status?: string | null; date_d?: string | null; date_f?: string | null; module?: string | null }

/** Jour courant AAAA-MM-JJ a Paris (independant du fuseau du serveur). */
export function aujourdhuiParis(d: Date = new Date()): string {
  try { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d) } catch { return d.toISOString().slice(0, 10) }
}

export function etatAnimation(ev: AnimationDates | null | undefined, aujourdhui: string = aujourdhuiParis()): EtatAnimation {
  if (!ev) return 'ouverte'
  const st = String(ev.status || '').toLowerCase()
  const d = ev.date_d ? String(ev.date_d).slice(0, 10) : ''
  const f = ev.date_f ? String(ev.date_f).slice(0, 10) : ''
  if (st === 'past' || st === 'archived') return 'terminee'
  /* Lot A : animation publiee par le pro, paiement pas encore declare -> jamais jouable, quelles que soient ses dates. */
  if (st === 'pending') return 'avenir'
  if (f && f < aujourdhui) return 'terminee'
  if (d && d > aujourdhui) return 'avenir'
  if (!d && (st === 'pending' || st === 'draft' || st === 'upcoming')) return 'avenir'
  return 'ouverte'
}

export function libelleDateFr(iso: string | null | undefined): string {
  if (!iso) return ''
  const m = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ''
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  return Number(m[3]) + (m[3] === '01' ? 'er ' : ' ') + mois[Number(m[2]) - 1] + ' ' + m[1]
}

export type MotifIndisponible = 'inexistante' | 'terminee' | 'avenir'

/** Pour les pages serveur : null = on peut jouer, sinon le motif a afficher. En apercu de creation, jamais bloque. */
export function motifIndisponible(
  ev: (AnimationDates & { nom?: string | null }) | null | undefined,
  sp: { preview?: string; apercu?: string },
): MotifIndisponible | null {
  if (sp.preview !== undefined || sp.apercu) return null
  if (!ev) return 'inexistante'
  /* Nuits du Sud 2026 garde son propre comportement (route /parcours/nds2026 inchangee). */
  if (ev.module === 'nds2026') return null
  const e = etatAnimation(ev)
  return e === 'ouverte' ? null : e
}
