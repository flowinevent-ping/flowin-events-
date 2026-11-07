import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://ywcqtupgoxfzkddqkztk.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON ?? 'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1'

/* ── Jeton SUPER ADMIN (securite 07/11/2026) ──────────────────────────────────
   Les ecritures admin sont reservees en base a `authenticated` + est_super_admin()
   (sql/2026-11-07-securite-ecritures.sql). Sur les ecrans /dashboard, les clients
   ci-dessous remplacent donc le jeton public par celui de la session admin
   (localStorage `flowin_admin_session`, la MEME que dashboard.html), rafraichi
   avant expiration. Hors /dashboard (parcours joueur, espace pro) : rien ne change,
   cle publique ou session pro. Sur /dashboard, la session admin prime sur une
   eventuelle session pro du meme navigateur (sinon les ecritures admin partiraient
   avec le jeton du pro et seraient refusees) ; les appels /auth/v1 ne sont jamais touches. */
const CLE_SESSION_SA = 'flowin_admin_session'
export interface SessionSABrute { access_token: string; refresh_token?: string; expires_at: number }

function lireSessionSABrute(): SessionSABrute | null {
  try {
    const s = JSON.parse(window.localStorage.getItem(CLE_SESSION_SA) || 'null') as SessionSABrute | null
    return s && s.access_token ? s : null
  } catch { return null }
}

let rafraichissementEnCours: Promise<SessionSABrute | null> | null = null

/** Renvoie une session admin valide (rafraichie via refresh_token si elle expire dans < 2 min), ou null. */
export async function sessionSAFraiche(): Promise<SessionSABrute | null> {
  if (typeof window === 'undefined') return null
  const s = lireSessionSABrute()
  if (!s) return null
  const maintenant = Math.floor(Date.now() / 1000)
  if (s.expires_at && maintenant < s.expires_at - 120) return s
  if (!s.refresh_token) return maintenant < s.expires_at - 30 ? s : null
  if (!rafraichissementEnCours) {
    rafraichissementEnCours = (async () => {
      try {
        const r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
          method: 'POST', headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: s.refresh_token }),
        })
        const d = await r.json().catch(() => ({})) as { access_token?: string; refresh_token?: string; expires_at?: number; expires_in?: number }
        if (!r.ok || !d.access_token) {
          /* Jeton revoque / expire : on purge pour reafficher l'ecran de connexion. */
          if (r.status >= 400 && r.status < 500) { try { window.localStorage.removeItem(CLE_SESSION_SA) } catch { /* rien */ } }
          return null
        }
        const n: SessionSABrute = { access_token: d.access_token, refresh_token: d.refresh_token || s.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600) }
        window.localStorage.setItem(CLE_SESSION_SA, JSON.stringify(n))
        return n
      } catch { return maintenant < s.expires_at - 30 ? s : null }
      finally { setTimeout(() => { rafraichissementEnCours = null }, 0) }
    })()
  }
  return rafraichissementEnCours
}

function surEcranAdmin(): boolean {
  return typeof window !== 'undefined' && /^\/dashboard(\/|$)/.test(window.location.pathname)
}

const fetchAvecJetonSA: typeof fetch = async (input, init) => {
  if (!surEcranAdmin()) return fetch(input, init)
  const s = await sessionSAFraiche()
  if (!s) return fetch(input, init)
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (url.indexOf('/auth/v1/') >= 0) return fetch(input, init)
  const h = new Headers((init && init.headers) || (input instanceof Request ? input.headers : undefined))
  h.set('Authorization', 'Bearer ' + s.access_token)
  return fetch(input, { ...(init || {}), headers: h })
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { global: { fetch: fetchAvecJetonSA } })

export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: fetchAvecJetonSA },
})

/* Client « etat vivant » pour les pages serveur dynamiques. Constat du 01/11 (rejeu local) : le
   « Data Cache » de Next memorise les lectures Supabase des pages serveur et les sert perimees,
   MEME sur les pages en force-dynamic (une animation passee en « terminee » restait jouable ; un
   droit retire au pro restait affiche). On demande `no-store` cote serveur pour les lectures qui
   decident de l'acces (etat de l'animation, droits du pro). Dans le navigateur : inchange.
   Reserve aux pages DYNAMIQUES (searchParams) : sur une page generee au build, un fetch no-store
   leve le signal « Dynamic server usage » -- ne pas l'utiliser dans un layout du dashboard. */
const fetchVivant: typeof fetch = (input, init) => (typeof window === 'undefined' ? fetch(input, { ...(init || {}), cache: 'no-store' }) : fetch(input, init))
export const supabaseVivant = createClient(SUPABASE_URL, SUPABASE_ANON, { global: { fetch: fetchVivant } })

export { SUPABASE_URL, SUPABASE_ANON }
