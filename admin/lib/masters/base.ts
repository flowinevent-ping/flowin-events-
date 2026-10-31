/**
 * MASTERS DE JEUX — valeurs du Super Admin (table jeux_masters).
 *
 * La table est creee par sql/2026-10-31-jeux-masters.sql (NON appliquee
 * automatiquement). Tant qu'elle n'existe pas, la lecture echoue proprement
 * et les valeurs du code (lib/masters/defs.ts) s'appliquent seules.
 */
import { supabase } from '@/lib/supabase'
import { estMasterId } from './defs'
import type { DefautsBase } from './resolve'
import type { ContenuMaster } from './types'

export async function lireDefautsBase(): Promise<{ base: DefautsBase | null; tableAbsente: boolean }> {
  try {
    const { data, error } = await supabase.from('jeux_masters').select('id,defauts')
    if (error) return { base: null, tableAbsente: true }
    const base: DefautsBase = {}
    ;((data ?? []) as { id: string; defauts: ContenuMaster | null }[]).forEach(r => {
      if (estMasterId(r.id) && r.defauts && typeof r.defauts === 'object') base[r.id] = r.defauts
    })
    return { base, tableAbsente: false }
  } catch {
    return { base: null, tableAbsente: true }
  }
}
