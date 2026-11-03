'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { messageAuth } from '@/lib/erreursFr'
import {
  wrap, pageWrap, cardFloating, Hero, Field, fieldInput, primaryBtn, ghostLink, errorBox, helpText,
} from '@/components/pro/proPublicUI'

/**
 * NOUVEAU MOT DE PASSE (lien recu par email, « Mot de passe oublie »).
 * Le lien ouvre cette page avec une session de recuperation (evenement PASSWORD_RECOVERY) : on
 * demande le nouveau mot de passe deux fois (8 caracteres minimum), on l'enregistre, puis on ouvre l'espace.
 * Lien expire ou deja utilise : message clair et retour vers « Mot de passe oublie ».
 */
export default function NouveauMotDePassePage() {
  const [phase, setPhase] = useState<'verif' | 'pret' | 'invalide' | 'ok'>('verif')
  const [mdp, setMdp] = useState('')
  const [conf, setConf] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    let fini = false
    const { data: abo } = supabase.auth.onAuthStateChange((evt, session) => {
      if (!fini && (evt === 'PASSWORD_RECOVERY' || (evt === 'SIGNED_IN' && session))) setPhase(p => (p === 'verif' ? 'pret' : p))
    })
    ;(async () => {
      try {
        const u = new URL(window.location.href)
        const echec = (u.hash + u.search).match(/error(_code|_description)?=/)
        if (echec) { if (!fini) setPhase('invalide'); return }
        const code = u.searchParams.get('code')
        if (code) { const r = await supabase.auth.exchangeCodeForSession(code); if (r.error) { if (!fini) setPhase('invalide'); return } }
        await new Promise(r => setTimeout(r, 600))
        const { data } = await supabase.auth.getSession()
        if (!fini) setPhase(p => (p !== 'verif' ? p : data.session ? 'pret' : 'invalide'))
      } catch { if (!fini) setPhase('invalide') }
    })()
    return () => { fini = true; abo.subscription.unsubscribe() }
  }, [])

  async function enregistrer() {
    if (mdp.length < 8) { setErreur('8 caractères minimum.'); return }
    if (mdp !== conf) { setErreur('Les deux mots de passe ne sont pas identiques.'); return }
    setEnvoi(true); setErreur('')
    const { error } = await supabase.auth.updateUser({ password: mdp })
    if (error) { setErreur(messageAuth(error)); setEnvoi(false); return }
    setPhase('ok')
    setTimeout(() => { window.location.href = '/pro' }, 1800)
  }

  return (
    <div style={wrap}>
      <Hero kicker="Espace pro Flowin" title="Nouveau mot de passe" sub="Choisissez un mot de passe pour votre espace." />
      <div style={pageWrap}>
        <div style={cardFloating}>
          {phase === 'verif' && <div style={{ fontSize: 14, textAlign: 'center' }}>Vérification de votre lien…</div>}
          {phase === 'invalide' && (
            <>
              <div role="alert" style={errorBox}>Ce lien n’est plus valable (expiré ou déjà utilisé). Demandez un nouveau lien.</div>
              <Link href="/pro/connexion" style={{ ...primaryBtn, display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>Retour à la connexion</Link>
            </>
          )}
          {phase === 'pret' && (
            <>
              <Field label="Nouveau mot de passe"><input style={fieldInput} type="password" autoComplete="new-password" value={mdp} onChange={e => setMdp(e.target.value)} /></Field>
              <Field label="Confirmation"><input style={fieldInput} type="password" autoComplete="new-password" value={conf} onChange={e => setConf(e.target.value)} onKeyDown={e => e.key === 'Enter' && enregistrer()} /></Field>
              {erreur && <div role="alert" style={errorBox}>{erreur}</div>}
              <button onClick={enregistrer} disabled={envoi} style={{ ...primaryBtn, opacity: envoi ? 0.6 : 1 }}>{envoi ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}</button>
              <div style={helpText}>8 caractères minimum.</div>
            </>
          )}
          {phase === 'ok' && <div role="status" style={{ fontSize: 15, fontWeight: 800, textAlign: 'center', color: '#0F766E' }}>Mot de passe enregistré. Ouverture de votre espace…</div>}
          {phase !== 'ok' && <div style={helpText}><Link href="/pro/connexion" style={ghostLink}>Connexion</Link></div>}
        </div>
      </div>
    </div>
  )
}
