/**
 * SUPER EVENT EN DEUX PHASES (décision de Romain, 19/11/2026) :
 * « avant l'événement ils gagnent des places ou des lots que tu choisis (organisateur) ;
 *   pendant, ils jouent aux lots des commerces et jouent sur place ».
 *
 * - Phase « avant » : du début du jeu (cfg_jeu.phases.debutJeu) à la veille de date_d.
 *   Lots de l'organisateur (se_lots) par défaut.
 * - Phase « pendant » : dates de l'événement (date_d → date_f).
 *   Lots des stations des commerces (lots) par défaut.
 * - Une colonne `phase` (sql/2026-11-19-super-event-phases.sql) peut forcer la phase d'un lot.
 *
 * Phases actives seulement si cfg_jeu.phases.debutJeu est renseigné et précède date_d.
 * Sinon : une seule phase, comportement d'avant inchangé (cas de se-nds-2026, sans échéance).
 */
export type Phase = 'avant' | 'pendant'
export type SourceLot = 'organisateur' | 'station'

export const SE_SANS_PHASES = ['se-nds-2026']
export const ORANGE_SE = '#C2410C'

export interface PhasesSE { actif: boolean; debutJeu: string | null; dateD: string | null; dateF: string | null }

type SeLike = { id?: string | null; date_d?: string | null; date_f?: string | null; cfg_jeu?: unknown }

export function lirePhases(se: SeLike | null | undefined): PhasesSE {
  const cfg = (se?.cfg_jeu && typeof se.cfg_jeu === 'object' ? se.cfg_jeu : {}) as { phases?: { debutJeu?: string | null } }
  const debutJeu = cfg.phases?.debutJeu || null
  const dateD = se?.date_d ?? null
  const dateF = se?.date_f ?? null
  const actif = !!(debutJeu && dateD && debutJeu < dateD && SE_SANS_PHASES.indexOf(se?.id ?? '') < 0)
  return { actif, debutJeu, dateD, dateF }
}

/** Date du jour (AAAA-MM-JJ, heure locale). */
export function aujourdhui(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Phase en cours : avant date_d → « avant », sinon « pendant ». Null si phases inactives. */
export function phaseCourante(p: PhasesSE, jour = aujourdhui()): Phase | null {
  if (!p.actif || !p.dateD) return null
  return jour < p.dateD ? 'avant' : 'pendant'
}

/** Phase d'une date de partie (played_date), même règle. */
export function phaseDeDate(p: { dateD: string | null }, jour: string | null | undefined): Phase | null {
  if (!p.dateD || !jour) return null
  return jour.slice(0, 10) < p.dateD ? 'avant' : 'pendant'
}

export function phaseParDefaut(source: SourceLot): Phase {
  return source === 'organisateur' ? 'avant' : 'pendant'
}

export function phaseDuLot(l: { phase?: string | null; source: SourceLot }): Phase {
  return l.phase === 'avant' || l.phase === 'pendant' ? l.phase : phaseParDefaut(l.source)
}

export const LIBELLE_PHASE: Record<Phase, string> = { avant: 'Avant l’événement', pendant: 'Pendant l’événement' }

/** Veille d'une date AAAA-MM-JJ. */
export function veille(d: string): string {
  const x = new Date(`${d}T12:00:00`)
  x.setDate(x.getDate() - 1)
  return aujourdhui(x)
}

const fr = (d: string) => { const s = d.split('-'); return s.length === 3 ? `${s[2]}/${s[1]}` : d }

export function periodePhase(p: PhasesSE, ph: Phase): string {
  if (ph === 'avant') return p.debutJeu && p.dateD ? `du ${fr(p.debutJeu)} au ${fr(veille(p.dateD))}` : ''
  return p.dateD ? (p.dateF && p.dateF !== p.dateD ? `du ${fr(p.dateD)} au ${fr(p.dateF)}` : `le ${fr(p.dateD)}`) : ''
}

/** Passages (parties) et tickets répartis par phase, à partir des participations réelles. */
export function compterParPhase(parts: { played_date?: string | null; created_at?: string | null; tickets?: number | null }[], p: { dateD: string | null }) {
  const r: Record<Phase, { passages: number; tickets: number }> = { avant: { passages: 0, tickets: 0 }, pendant: { passages: 0, tickets: 0 } }
  parts.forEach(x => {
    const ph = phaseDeDate(p, x.played_date ?? x.created_at ?? null)
    if (!ph) return
    r[ph].passages++
    r[ph].tickets += Math.max(Number(x.tickets ?? 1) || 1, 1)
  })
  return r
}
