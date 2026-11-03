/**
 * Creation d'un compte pro en ligne (acces + fiche `pros`), MEME mecanisme que le parcours « Ma premiere fois » :
 * signUp, reprise d'un acces deja cree sans fiche, insertion `pros` en statut en_attente avec repli sans les colonnes
 * entreprise (sql/02). Utilise par « Rejoindre un super event » (2e chemin d'inscription : coordonnees saisies au moment
 * de valider la demande). Aucune donnee inventee : tout vient du formulaire.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { FichePro, identifiantPro, lignePro, ligneProEntreprise } from '@/lib/proCreation'
import { messageAuth, messageFr } from '@/lib/erreursFr'

export interface ResultatInscription {
  ok: boolean
  proId?: string
  /** true si une session est ouverte (pas d'email de confirmation a attendre). */
  session?: boolean
  erreur?: string
}

export async function inscrirePro(
  supabase: SupabaseClient,
  fiche: FichePro,
  memo: { current: { email: string; id: string } | null },
  source = 'rejoindre-super-event',
): Promise<ResultatInscription> {
  const adresse = fiche.email.trim()
  let userId = '', aSession = false
  if (memo.current && memo.current.email === adresse.toLowerCase()) {
    userId = memo.current.id
    const { data: s } = await supabase.auth.getSession()
    aSession = !!s.session
  } else {
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email: adresse, password: fiche.motdepasse })
    if (authErr || !authData.user) return { ok: false, erreur: messageAuth(authErr) }
    if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
      const { data: conn, error: connErr } = await supabase.auth.signInWithPassword({ email: adresse, password: fiche.motdepasse })
      if (connErr || !conn.user) {
        return { ok: false, erreur: 'Un compte existe déjà avec cet email. Connectez-vous (lien ci-dessous), ou utilisez « Mot de passe oublié » sur la page de connexion.' }
      }
      const { data: dejaPro } = await supabase.from('pros').select('id').eq('auth_id', conn.user.id).order('created_at', { ascending: true }).limit(1)
      if (dejaPro && dejaPro.length) return { ok: true, proId: (dejaPro[0] as { id: string }).id, session: true }
      userId = conn.user.id; aSession = true
    } else {
      userId = authData.user.id; aSession = !!authData.session
    }
    memo.current = { email: adresse.toLowerCase(), id: userId }
  }
  let idPro = identifiantPro(fiche)
  const { data: existe } = await supabase.from('pros').select('id').eq('id', idPro).maybeSingle()
  if (existe) idPro = `${idPro}-${Math.random().toString(36).slice(2, 6)}`
  const ligne = lignePro(fiche, 'pro')
  const base = { ...ligne, tags: [...(ligne.tags ?? []), `source:${source}`], id: idPro, auth_id: userId }
  let { error: insErr } = await supabase.from('pros').insert({ ...base, ...ligneProEntreprise(fiche, 'premiere-fois') })
  if (insErr && (insErr.code === 'PGRST204' || insErr.code === '42703' || /column/i.test(insErr.message))) {
    insErr = (await supabase.from('pros').insert(base)).error
  }
  if (insErr) {
    return {
      ok: false,
      erreur: insErr.code === '23503'
        ? 'La création de votre accès n’a pas abouti. Réessayez ; si cela continue, utilisez une autre adresse email.'
        : insErr.code === '23505'
          ? 'Un établissement avec ces informations existe déjà. Connectez-vous, ou contactez l’équipe Flowin.'
          : `Votre accès est créé, mais la fiche n’a pas pu être enregistrée : ${messageFr(insErr)} Vous pouvez réessayer : votre compte est conservé.`,
    }
  }
  return { ok: true, proId: idPro, session: aSession }
}
