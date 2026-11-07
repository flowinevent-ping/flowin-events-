/**
 * Session du SUPER ADMIN (compte Supabase Auth, voir sql/01-identite-super-admin.sql).
 *
 * Le dashboard Flowin (dashboard.html, page admin-connexion.html) memorise deja la
 * session dans localStorage sous `flowin_admin_session` ({ access_token,
 * refresh_token, expires_at }). Les ecrans Next du Super Admin reutilisent CETTE
 * meme session (une seule connexion pour tout le dashboard) ; s'il n'y en a pas,
 * ils proposent la connexion sur place et l'ecrivent au meme format.
 *
 * Utilise fetch directement (pas supabase-js) : aucun effet sur les autres clients,
 * qui restent en cle publique (anon).
 */
import { SUPABASE_URL, SUPABASE_ANON, sessionSAFraiche } from './supabase'
export { sessionSAFraiche }

const CLE = 'flowin_admin_session'
export interface SessionSA { access_token: string; refresh_token?: string; expires_at: number }

export function lireSessionSA(): SessionSA | null {
  try {
    const s = JSON.parse(window.localStorage.getItem(CLE) || 'null') as SessionSA | null
    if (s && s.access_token && s.expires_at && Math.floor(Date.now() / 1000) < s.expires_at - 30) return s
  } catch { /* ignore */ }
  return null
}

export function deconnecterSA(): void { try { window.localStorage.removeItem(CLE) } catch { /* ignore */ } }

export async function connecterSA(email: string, motDePasse: string): Promise<{ ok: boolean; erreur?: string }> {
  try {
    const r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: motDePasse }),
    })
    const d = await r.json().catch(() => ({})) as { access_token?: string; refresh_token?: string; expires_at?: number; expires_in?: number; error_description?: string; msg?: string }
    if (!r.ok || !d.access_token) return { ok: false, erreur: d.error_description || d.msg || 'Identifiants invalides.' }
    const sess: SessionSA = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600) }
    window.localStorage.setItem(CLE, JSON.stringify(sess))
    return { ok: true }
  } catch (e) { return { ok: false, erreur: e instanceof Error ? e.message : 'Connexion impossible.' } }
}

function entetes(s: SessionSA): Record<string, string> {
  return { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' }
}

/** Vrai si la session courante est bien celle d'un super admin (RPC est_super_admin, lue avec SON jeton). */
export async function verifierSuperAdmin(): Promise<boolean> {
  const r = await rpcSA<boolean>('est_super_admin', {})
  return r.data === true
}

export async function rpcSA<T>(fn: string, args: Record<string, unknown>): Promise<{ data?: T; erreur?: string; sansSession?: boolean }> {
  const s = await sessionSAFraiche()
  if (!s) return { sansSession: true, erreur: 'Connexion Super Admin requise.' }
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: entetes(s), body: JSON.stringify(args) })
    const d = await r.json().catch(() => null) as unknown
    if (!r.ok) return { erreur: (d && typeof d === 'object' && 'message' in d ? String((d as { message: string }).message) : 'Erreur ' + r.status) }
    return { data: d as T }
  } catch (e) { return { erreur: e instanceof Error ? e.message : 'Réseau indisponible.' } }
}

export async function lireSA<T>(chemin: string): Promise<{ data?: T; erreur?: string; sansSession?: boolean }> {
  const s = await sessionSAFraiche()
  if (!s) return { sansSession: true, erreur: 'Connexion Super Admin requise.' }
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + chemin, { headers: entetes(s) })
    const d = await r.json().catch(() => null) as unknown
    if (!r.ok) return { erreur: (d && typeof d === 'object' && 'message' in d ? String((d as { message: string }).message) : 'Erreur ' + r.status) }
    return { data: d as T }
  } catch (e) { return { erreur: e instanceof Error ? e.message : 'Réseau indisponible.' } }
}
