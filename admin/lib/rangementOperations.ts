/**
 * Rangement des operations cote pro (Romain, 16/09 nuit) :
 * « event passe, en cours, a venir, et surtout par date : mois / annee ».
 *   1. par periode : En cours, A venir, Passees ;
 *   2. dans chaque periode, par mois et annee de debut ;
 *   3. dans chaque mois, par date (a venir : la plus proche d abord ;
 *      passees : la plus recente d abord).
 * Le type (animation / super event) est un filtre, pas un rangement.
 */
import type { DonneesOperation } from './operations'
import { periodeOperation, type Periode } from './ongletsOperation'

type OpDate = Pick<DonneesOperation, 'dateD' | 'dateF' | 'status' | 'nom' | 'type' | 'cle'>

export const ORDRE_PERIODES: { periode: Periode; titre: string }[] = [
  { periode: 'en_cours', titre: 'En cours' },
  { periode: 'a_venir', titre: 'À venir' },
  { periode: 'terminee', titre: 'Passées' },
]
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export function libelleMois(date: string | null): string {
  if (!date) return 'Sans date'
  const [a, m] = date.split('-')
  return `${MOIS[Number(m) - 1] ?? m} ${a}`
}

export type FiltreType = 'event' | 'super' | null

export interface GroupeMois<T> { cle: string; titre: string; ops: T[] }
export interface GroupePeriode<T> { periode: Periode; titre: string; n: number; mois: GroupeMois<T>[] }

export function rangerParPeriode<T extends OpDate>(ops: T[], type: FiltreType = null): GroupePeriode<T>[] {
  const garde = type ? ops.filter(o => o.type === type) : ops
  return ORDRE_PERIODES.map(({ periode, titre }) => {
    const l = garde.filter(o => periodeOperation(o.dateD, o.dateF, o.status) === periode)
    l.sort((a, b) => {
      const da = a.dateD ?? '9999', db = b.dateD ?? '9999'
      if (da !== db) return periode === 'terminee' ? db.localeCompare(da) : da.localeCompare(db)
      return a.nom.localeCompare(b.nom, 'fr')
    })
    const mois: GroupeMois<T>[] = []
    l.forEach(o => {
      const cle = o.dateD ? o.dateD.slice(0, 7) : 'sans'
      let g = mois.find(x => x.cle === cle)
      if (!g) { g = { cle, titre: libelleMois(o.dateD), ops: [] }; mois.push(g) }
      g.ops.push(o)
    })
    return { periode, titre, n: l.length, mois }
  }).filter(g => g.n > 0)
}

/** Liste a plat, dans l ordre du rangement ; `cle` garde une seule operation. */
export function operationsRangees<T extends OpDate>(ops: T[], cle?: string | null): T[] {
  const l = rangerParPeriode(ops).flatMap(g => g.mois.flatMap(m => m.ops))
  return cle ? l.filter(o => o.cle === cle) : l
}

/** Groupes pour une liste deroulante : « En cours — septembre 2026 », etc. */
export function groupesChoix<T extends OpDate>(ops: T[], dates: (o: T) => string): { titre: string; ops: { cle: string; nom: string; dates: string }[] }[] {
  return rangerParPeriode(ops).flatMap(g => g.mois.map(m => ({
    titre: `${g.titre} — ${m.titre}`,
    ops: m.ops.map(o => ({ cle: o.cle, nom: `${o.nom}${o.type === 'super' ? ' (super event)' : ''}`, dates: dates(o) })),
  })))
}
