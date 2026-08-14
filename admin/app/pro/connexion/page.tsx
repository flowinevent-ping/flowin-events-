'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  wrap, pageWrap, cardFloating, Hero, Field, fieldInput,
  primaryBtn, ghostLink, errorBox, helpText, SuccessScreen,
} from '@/components/pro/proPublicUI'

export default function ConnexionProPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [etat, setEtat] = useState<'idle' | 'loading' | 'attente' | 'refuse' | 'error'>('idle')
  const [erreur, setErreur] = useState('')

  async function connecter() {
    setEtat('loading')
    setErreur('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    if (error || !data.user) {
      setErreur(error?.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : (error?.message ?? 'Erreur de connexion.'))
      setEtat('error')
      return
    }

    const { data: pro } = await supabase.from('pros').select('id, nom, statut').eq('auth_id', data.user.id).maybeSingle()
    if (!pro) {
      setErreur("Compte connecté mais aucun profil pro associé — contactez l'équipe Flowin.")
      setEtat('error')
      return
    }
    if (pro.statut === 'en_attente') { setEtat('attente'); return }
    if (pro.statut === 'refuse') { setEtat('refuse'); return }

    router.push(`/pro?pro=${encodeURIComponent(pro.id)}`)
  }

  if (etat === 'attente') {
    return (
      <SuccessScreen emoji="⏳" title="En attente de validation">
        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: '#374151' }}>Votre demande est bien enregistrée. L&apos;équipe Flowin doit la valider avant que vous puissiez accéder à votre espace.</div>
      </SuccessScreen>
    )
  }
  if (etat === 'refuse') {
    return (
      <SuccessScreen emoji="✋" title="Demande non validée">
        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: '#374151' }}>Contactez l&apos;équipe Flowin pour plus d&apos;informations.</div>
      </SuccessScreen>
    )
  }

  return (
    <div style={wrap}>
      <Hero kicker="Espace pro Flowin" title="Connexion" sub="Accédez à votre espace." />
      <div style={pageWrap}>
        <div style={cardFloating}>
          <Field label="Email"><input style={fieldInput} type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
          <Field label="Mot de passe"><input style={fieldInput} type="password" value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === 'Enter' && connecter()} /></Field>

          {erreur && <div style={errorBox}>{erreur}</div>}

          <button onClick={connecter} disabled={etat === 'loading'} style={{ ...primaryBtn, opacity: etat === 'loading' ? 0.6 : 1 }}>
            {etat === 'loading' ? 'Connexion…' : 'Se connecter'}
          </button>
          <div style={helpText}>Pas encore de compte ? <Link href="/pro/inscription" style={ghostLink}>S&apos;inscrire</Link></div>
        </div>
      </div>
    </div>
  )
}
