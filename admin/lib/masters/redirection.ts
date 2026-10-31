/**
 * Bascule vers le parcours master (/jouer) des animations qui utilisent un
 * master (events.cfg.master). Les anciennes routes /parcours/<module> (QR deja
 * imprimes) restent valables : elles redirigent ici. Les animations sans master
 * ne changent pas. Nuits du Sud (/parcours/nds2026) n'appelle jamais ceci.
 */
import { redirect } from 'next/navigation'
import { referenceMaster } from './resolve'

export function versMasterSiBesoin(evId: string, cfg: unknown, sp: Record<string, string | undefined>): void {
  if (!evId || !referenceMaster(cfg)) return
  const q = new URLSearchParams()
  q.set('ev', evId)
  ;['source', 'ref', 'etab', 'ch', 'apercu'].forEach(k => { if (sp[k]) q.set(k, String(sp[k])) })
  if (sp.preview !== undefined) q.set('preview', '1')
  redirect('/jouer?' + q.toString())
}
