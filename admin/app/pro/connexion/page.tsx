'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { messageAuth } from '@/lib/erreursFr'
import { retourSur } from '@/lib/retour'
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
  const [oubli, setOubli] = useState(false)
  const [retourParam, setRetourParam] = useState<string | null>(null)
  useEffect(() => { try { setRetourParam(retourSur(new URLSearchParams(window.location.search).get('retour'))) } catch { /* rien */ } }, [])
  const [info, setInfo] = useState('')

  async function connecter() {
    setEtat('loading')
    setErreur('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    if (error || !data.user) {
      setErreur(messageAuth(error))
      setEtat('error')
      return
    }

    const { data: pro } = await supabase.from('pros').select('id, nom, statut').eq('auth_id', data.user.id).maybeSingle()
    /* Retour vers une demande en cours (?retour=/rejoindre?...) : le compte est libre, la demande part meme avant le paiement. */
    const retour = retourSur(new URLSearchParams(window.location.search).get('retour'))
    if (pro && retour && retour.indexOf('/rejoindre') === 0) { router.push(retour); return }
    if (!pro) {
      setErreur("Compte connecté mais aucun profil pro associé — contactez l'équipe Flowin.")
      setEtat('error')
      return
    }
    if (pro.statut === 'en_attente') { setEtat('attente'); return }
    if (pro.statut === 'refuse') { setEtat('refuse'); return }

    router.push(`/pro?pro=${encodeURIComponent(pro.id)}`)
  }

  /* MOT DE PASSE OUBLIE : meme reponse que le compte existe ou non (aucune fuite sur les comptes). */
  async function envoyerLien() {
    const adresse = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(adresse)) { setErreur('Saisissez une adresse email valide.'); return }
    setEtat('loading'); setErreur(''); setInfo('')
    const { error } = await supabase.auth.resetPasswordForEmail(adresse, { redirectTo: `${window.location.origin}/pro/nouveau-mot-de-passe` })
    if (error && (error.status === 429 || /rate limit|too many|network|fetch/i.test(error.message))) { setErreur(messageAuth(error)); setEtat('error'); return }
    setInfo('Si un compte existe pour cette adresse, un email vient d’être envoyé. Ouvrez-le et suivez le lien pour choisir un nouveau mot de passe.')
    setEtat('idle')
  }

  if (etat === 'attente') {
    return (
      <SuccessScreen title="En attente de validation">
        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: '#374151' }}>Votre demande est bien enregistrée. L&apos;équipe Flowin doit la valider avant que vous puissiez accéder à votre espace.</div>
      </SuccessScreen>
    )
  }
  if (etat === 'refuse') {
    return (
      <SuccessScreen title="Demande non validée">
        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: '#374151' }}>Contactez l&apos;équipe Flowin pour plus d&apos;informations.</div>
      </SuccessScreen>
    )
  }

  return (
    <div style={wrap}>
      <Hero kicker="Espace pro Flowin" title="Connexion" sub="Accédez à votre espace." />
      <div style={pageWrap}>
        <div style={cardFloating}>
          <Field label="Email"><input style={fieldInput} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && oubli && envoyerLien()} /></Field>
          {!oubli && <Field label="Mot de passe"><input style={fieldInput} type="password" autoComplete="current-password" value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === 'Enter' && connecter()} /></Field>}

          {erreur && <div role="alert" style={errorBox}>{erreur}</div>}
          {info && <div role="status" style={{ background: '#E6F7F4', color: '#0F766E', borderRadius: 12, padding: '12px 14px', fontSize: 13.5, fontWeight: 700, lineHeight: 1.5, marginBottom: 14 }}>{info}</div>}

          {!oubli ? (
            <>
              <button onClick={connecter} disabled={etat === 'loading'} style={{ ...primaryBtn, opacity: etat === 'loading' ? 0.6 : 1 }}>
                {etat === 'loading' ? 'Connexion…' : 'Se connecter'}
              </button>
              <div style={helpText}><button type="button" data-oubli onClick={() => { setOubli(true); setErreur(''); setInfo('') }} style={{ ...ghostLink, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, padding: 6 }}>Mot de passe oublié ?</button></div>
            </>
          ) : (
            <>
              <button onClick={envoyerLien} disabled={etat === 'loading'} style={{ ...primaryBtn, opacity: etat === 'loading' ? 0.6 : 1 }}>
                {etat === 'loading' ? 'Envoi…' : 'Recevoir un lien par email'}
              </button>
              <div style={helpText}><button type="button" onClick={() => { setOubli(false); setErreur(''); setInfo('') }} style={{ ...ghostLink, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, padding: 6 }}>← Retour à la connexion</button></div>
            </>
          )}
          <div style={helpText}>Pas encore de compte ? <Link href={retourParam ? `/pro/premiere-fois?retour=${encodeURIComponent(retourParam)}` : '/pro/premiere-fois'} style={ghostLink}>Ma première fois</Link></div>
        </div>
      </div>
    </div>
  )
}
