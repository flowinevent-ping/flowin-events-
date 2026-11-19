/**
 * Sécurité joueurs (19/11/2026, sql/2026-11-19-securite-joueurs-rpc.sql) : les écritures et
 * lectures joueur passent par des RPC SECURITY DEFINER. Tant que la partie A n'est pas appliquée
 * en base, la RPC n'existe pas : on retombe alors sur l'ancien accès direct (ordre de déploiement
 * sans risque). Une RPC présente qui refuse (ok:false) ne déclenche JAMAIS le repli.
 */
export function rpcAbsente(error: unknown): boolean {
  if (!error) return false
  const e = error as { code?: string; message?: string; status?: number }
  const c = String(e.code || '')
  const m = String(e.message || '').toLowerCase()
  return c === 'PGRST202' || c === '42883' || e.status === 404 || m.indexOf('could not find the function') >= 0
}
