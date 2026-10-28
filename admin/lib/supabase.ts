import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://ywcqtupgoxfzkddqkztk.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON ?? 'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

/* Client dedie aux pages publiques pre-inscription (ex: /rejoindre/[se]).
   Bug reel observe (28/10) : sur ces pages, si le visiteur a par ailleurs
   une session active sur ce domaine (SA ou pro deja connecte dans un autre
   onglet, meme navigateur), le client `supabase` partage attache
   automatiquement son token d'auth -- le role resolu cote PostgREST devient
   'authenticated' au lieu de 'anon', ce qui declenche les policies RLS plus
   strictes reservees au pro proprietaire (pros_self_insert,
   demandes_self_insert) et fait echouer l'ecriture avec un 403 generique.
   Ce client n'a et ne gardera jamais de session : les ecritures publiques
   passent toujours en 'anon', quel que soit l'etat de connexion du visiteur. */
export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

export { SUPABASE_URL, SUPABASE_ANON }
