import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://ywcqtupgoxfzkddqkztk.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON ?? 'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
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
