/**
 * CONNEXION PARTICIPANT PAR LIEN E-MAIL (decision Romain 17/11/2026), sans mot de passe.
 * Client Supabase DEDIE (storageKey propre) : la session du participant ne se melange jamais a
 * celle d'un pro (client par defaut, ProShell) ni a celle du Super Admin (flowin_admin_session).
 * Flux implicite : le lien marche meme s'il s'ouvre dans un autre navigateur que celui de la demande.
 * L'identite reste l'id du joueur garde dans le telephone (flowin_joueur) : apres liaison, on ferme
 * la session Auth (locale).
 */
import { createClient } from '@supabase/supabase-js'
import { fetchDemo } from './demo'
import { rememberJoueur } from './parcours'

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ywcqtupgoxfzkddqkztk.supabase.co'
const CLE = process.env.NEXT_PUBLIC_SUPABASE_ANON ?? 'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1'

const fetchJoueur: typeof fetch = (input, init) => {
  const fd = fetchDemo()
  const m = String((init && init.method) || (input instanceof Request ? input.method : 'GET')).toUpperCase()
  if (fd && m !== 'GET' && m !== 'HEAD') return fd(input, init)
  return fetch(input, init)
}

let client: ReturnType<typeof createClient> | null = null
export function clientJoueur() {
  if (!client) client = createClient(URL_, CLE, {
    auth: { storageKey: 'flowin_participant_auth', flowType: 'implicit', persistSession: true, autoRefreshToken: false, detectSessionInUrl: true },
    global: { fetch: fetchJoueur },
  })
  return client
}

/** Envoie le lien de connexion. Renvoie un message d'erreur en francais, ou null si envoye. */
export async function envoyerLienConnexion(email: string): Promise<string | null> {
  const e = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'E-mail invalide.'
  try {
    const { error } = await clientJoueur().auth.signInWithOtp({
      email: e,
      options: { emailRedirectTo: window.location.origin + '/moi/connexion', shouldCreateUser: true },
    })
    if (!error) return null
    const msg = (error.message || '').toLowerCase()
    if (error.status === 429 || msg.indexOf('rate') >= 0) return 'Trop de demandes. Réessaie dans quelques minutes.'
    if (msg.indexOf('sending') >= 0 || msg.indexOf('smtp') >= 0 || msg.indexOf('mail') >= 0 || (error.status || 0) >= 500)
      return "L'e-mail n'a pas pu être envoyé pour l'instant. Réessaie plus tard, ou rejoue avec le même e-mail : tes lots reviennent."
    return "Impossible d'envoyer le lien. Réessaie plus tard."
  } catch {
    return 'Connexion impossible. Vérifie ton réseau et réessaie.'
  }
}

export type ResultatLiaison = { etat: 'ok'; prenom: string } | { etat: 'aucun' } | { etat: 'sans_session' } | { etat: 'erreur' }

/** Lit la session issue du lien, retrouve le joueur par l'e-mail verifie, le memorise, ferme la session. */
export async function lierSessionAuJoueur(): Promise<ResultatLiaison> {
  const sb = clientJoueur()
  let session = (await sb.auth.getSession()).data.session
  if (!session) {
    /* detectSessionInUrl peut finir juste apres le premier getSession */
    await new Promise(r => setTimeout(r, 600))
    session = (await sb.auth.getSession()).data.session
  }
  if (!session) return { etat: 'sans_session' }
  try {
    const { data, error } = await sb.rpc('moi_joueur_par_session')
    if (error) return { etat: 'erreur' }
    const brut = data as unknown
    const ligne = (Array.isArray(brut) ? brut[0] : brut) as { id?: string; prenom?: string | null } | null | undefined
    if (!ligne || !ligne.id) return { etat: 'aucun' }
    try { localStorage.removeItem('flowin_joueur') } catch { /* */ }
    rememberJoueur(ligne.id, session.user.email || '', ligne.prenom || '')
    return { etat: 'ok', prenom: ligne.prenom || '' }
  } finally {
    try { await sb.auth.signOut({ scope: 'local' }) } catch { /* */ }
  }
}
