/**
 * Rangement des operations cote pro : par type (animations, super events),
 * puis par date — en cours, a venir (la plus proche d abord), terminees
 * (la plus recente d abord).
 */
import type { DonneesOperation } from './operations'
import { periodeOperation, type Periode } from './ongletsOperation'

const RANG: Record<Periode, number> = { en_cours: 0, a_venir: 1, terminee: 2 }

export function trierParDate<T extends Pick<DonneesOperation, 'dateD' | 'dateF' | 'status' | 'nom'>>(ops: T[]): T[] {
  return [...ops].sort((a, b) => {
    const pa = periodeOperation(a.dateD, a.dateF, a.status)
    const pb = periodeOperation(b.dateD, b.dateF, b.status)
    if (pa !== pb) return RANG[pa] - RANG[pb]
    const da = a.dateD ?? '', db = b.dateD ?? ''
    if (da !== db) return pa === 'terminee' ? db.localeCompare(da) : da.localeCompare(db)
    return a.nom.localeCompare(b.nom, 'fr')
  })
}

export function rangerOperations<T extends DonneesOperation>(ops: T[], periode?: Periode | null): { titre: string; ops: T[] }[] {
  const garde = periode ? ops.filter(o => periodeOperation(o.dateD, o.dateF, o.status) === periode) : ops
  return [
    { titre: 'Animations', ops: trierParDate(garde.filter(o => o.type === 'event')) },
    { titre: 'Super events', ops: trierParDate(garde.filter(o => o.type === 'super')) },
  ].filter(g => g.ops.length > 0)
}

/** Liste a plat, dans l ordre du rangement ; `cle` garde une seule operation. */
export function operationsRangees<T extends DonneesOperation>(ops: T[], cle?: string | null): T[] {
  const l = rangerOperations(ops).flatMap(g => g.ops)
  return cle ? l.filter(o => o.cle === cle) : l
}
