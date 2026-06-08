import { supabase } from './supabase'

/**
 * Capture un parrainage quand l'inscription d'un filleul provient d'un lien
 *   /rejoindre/<se>?ref=<external_id_parrain>&etab=<commerce>&ch=<wa|insta>
 * - Quantifie : rattaché au commerce via `sender_etab`.
 * - Authentifie : le filleul s'est réellement inscrit -> destinataire_inscrit=true, statut='valide'.
 * - Anti-fraude : pas d'auto-parrainage, un filleul ne compte qu'une fois par parrain.
 * Best-effort : ne bloque jamais l'inscription.
 */
export async function captureParrainage(filleulExternalId: string): Promise<void> {
  if (typeof window === 'undefined' || !filleulExternalId) return
  try {
    const p = new URLSearchParams(window.location.search)
    const ref = (p.get('ref') || '').trim()
    if (!ref || ref === filleulExternalId) return

    const etab = (p.get('etab') || '').trim() || null
    const ch = (p.get('ch') || '').trim() || null

    const { data: exist } = await supabase
      .from('parrainage')
      .select('id')
      .eq('sender', ref)
      .eq('destinataire', filleulExternalId)
      .limit(1)
    if (exist && exist.length) return

    await supabase.from('parrainage').insert({
      sender: ref,
      sender_etab: etab,
      destinataire: filleulExternalId,
      channel: ch,
      statut: 'valide',
      destinataire_inscrit: true,
      pts_alloues: 1,
    })
  } catch {
    /* silencieux : le parrainage ne doit jamais casser l'inscription */
  }
}

/** Construit un lien d'invitation à partager (WhatsApp / Instagram / partage natif). */
export function buildInviteLink(
  base: string,
  myExternalId: string,
  etab?: string,
  ch?: 'wa' | 'insta'
): string {
  const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'https://flowin-events.vercel.app')
  u.searchParams.set('ref', myExternalId)
  if (etab) u.searchParams.set('etab', etab)
  if (ch) u.searchParams.set('ch', ch)
  return u.toString()
}
