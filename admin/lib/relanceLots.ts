/**
 * Relance des gagnants qui n'ont pas utilisé leur lot (audit lot C).
 * In-app d'abord : une notification `joueur_notifications` (palier 'relance'),
 * visible dans le profil joueur. L'e-mail ne vient qu'en relance (bouton
 * « Relancer » ligne par ligne, texte unique /nds/mail-gagnant.js).
 * RPC pro_relancer_lots : sql/2026-11-10-sa-carte-relance.sql.
 */
import { supabase } from '@/lib/supabase'

export async function relancerLotsInApp(tirageIds: number[]): Promise<{ ok: boolean; n: number; erreur?: string }> {
  if (!tirageIds.length) return { ok: true, n: 0 }
  const { data, error } = await supabase.rpc('pro_relancer_lots', { p_tirage_ids: tirageIds })
  if (error) return { ok: false, n: 0, erreur: error.message }
  return { ok: true, n: typeof data === 'number' ? data : 0 }
}
