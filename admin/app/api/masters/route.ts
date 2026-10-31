/**
 * GET /api/masters — les masters de jeux tels que le code les definit
 * (lib/masters/defs.ts), les surcharges du Super Admin (table jeux_masters,
 * si elle existe) et la liste des ecrans de chaque master. Lu par l'ecran
 * « Masters de jeux » de dashboard.html. Lecture seule, aucune donnee privee.
 */
import { NextResponse } from 'next/server'
import { MASTERS, ORDRE_MASTERS } from '@/lib/masters/defs'
import { DEROULES } from '@/lib/masters/engine'
import { lireDefautsBase } from '@/lib/masters/base'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { base, tableAbsente } = await lireDefautsBase()
  return NextResponse.json({
    ordre: ORDRE_MASTERS,
    masters: MASTERS,
    base: base ?? {},
    tableAbsente,
    ecrans: Object.fromEntries(ORDRE_MASTERS.map(id => [id, DEROULES[MASTERS[id].cle] || []])),
  })
}
