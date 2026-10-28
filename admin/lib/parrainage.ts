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

    /* Anti-abus (Romain, 28/10) : un parrain ne peut faire créditer plus de
     * ~3 parrainages par jour. Fail-open : si le comptage échoue, on laisse
     * passer plutôt que de bloquer une inscription normale pour une panne
     * de lecture qui n'a rien à voir avec elle. */
    try {
      const todayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z'
      const todayEnd = new Date().toISOString().slice(0, 10) + 'T23:59:59.999Z'
      const { data: aujourdhui, error: cntErr } = await supabase
        .from('parrainage')
        .select('id')
        .eq('sender', ref)
        .eq('statut', 'valide')
        .gte('ts', todayStart)
        .lte('ts', todayEnd)
      if (!cntErr && aujourdhui && aujourdhui.length >= 3) return
    } catch { /* fail-open */ }

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

/**
 * Historique côté filleul : le parrain gagne déjà un ticket (trigger DB
 * `tg_parrainage_credit_ticket`), mais rien n'indiquait au filleul lui-même
 * qu'il avait rejoint via un parrainage (Romain, 28/10 — "doit apparaître
 * dans l'historique... du joueur parrainé"). Lecture seule sur la table
 * `parrainage` existante (colonne `destinataire`) : pas de migration, pas
 * d'impact sur `se_tickets` (qui compte des tickets réels, pas un historique).
 */
export async function getParrainageRecu(monExternalId: string): Promise<{ ts: string } | null> {
  if (typeof window === 'undefined' || !monExternalId) return null
  try {
    const { data } = await supabase
      .from('parrainage')
      .select('ts')
      .eq('destinataire', monExternalId)
      .eq('statut', 'valide')
      .order('ts', { ascending: false })
      .limit(1)
    if (data && data.length) return { ts: data[0].ts as string }
  } catch { /* best-effort, jamais bloquant */ }
  return null
}
