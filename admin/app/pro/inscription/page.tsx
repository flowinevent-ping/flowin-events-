'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  wrap, pageWrap, cardFloating, Hero, Field, fieldInput, sectionLabel,
  primaryBtn, ghostLink, errorBox, helpText, SuccessScreen,
} from '@/components/pro/proPublicUI'

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function InscriptionProPage() {
  const [nom, setNom] = useState('')
  const [secteur, setSecteur] = useState('')
  const [contact, setContact] = useState('')
  const [ville, setVille] = useState('')
  const [email, setEmail] = useState('')
  const [tel, setTel] = useState('')
  const [pwd, setPwd] = useState('')
  const [envoi, setEnvoi] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [erreur, setErreur] = useState('')

  const valide = nom.trim().length > 1 && email.includes('@') && pwd.length >= 8

  async function envoyer() {
    if (!valide) return
    setEnvoi('loading')
    setErreur('')

    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password: pwd })
    if (authErr || !authData.user) {
      setErreur(authErr?.message === 'User already registered' ? 'Un compte existe déjà avec cet email.' : (authErr?.message ?? 'Erreur de création de compte.'))
      setEnvoi('error')
      return
    }

    let id = `pro-${slugify(nom)}`
    const { data: existe } = await supabase.from('pros').select('id').eq('id', id).maybeSingle()
    if (existe) id = `${id}-${Math.random().toString(36).slice(2, 6)}`

    const { error: insErr } = await supabase.from('pros').insert({
      id, nom, secteur: secteur || null, contact: contact || null, ville: ville || null,
      email, tel: tel || null, statut: 'en_attente', auth_id: authData.user.id,
    })
    if (insErr) {
      setErreur(insErr.message)
      setEnvoi('error')
      return
    }
    setEnvoi('ok')
  }

  if (envoi === 'ok') {
    return (
      <SuccessScreen emoji="✅" title="Demande envoyée">
        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: '#374151' }}>
          Votre compte est créé et en attente de validation par l&apos;équipe Flowin. Vous pouvez déjà{' '}
          <Link href="/pro/connexion" style={ghostLink}>vous connecter</Link> pour suivre l&apos;état de votre demande.
        </div>
      </SuccessScreen>
    )
  }

  return (
    <div style={wrap}>
      <Hero kicker="Espace pro Flowin" title="Créez votre compte" sub="Votre demande sera validée par l'équipe Flowin avant activation." />
      <div style={pageWrap}>
        <div style={cardFloating}>
          <div style={sectionLabel}>🏪 Votre établissement</div>
          <Field label="Nom de l'établissement / entreprise *"><input style={fieldInput} value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex. Domaine de la Bergerie" /></Field>
          <Field label="Secteur d'activité"><input style={fieldInput} value={secteur} onChange={e => setSecteur(e.target.value)} placeholder="Ex. Restauration, commerce…" /></Field>
          <Field label="Ville"><input style={fieldInput} value={ville} onChange={e => setVille(e.target.value)} /></Field>

          <div style={sectionLabel}>👤 Votre contact</div>
          <Field label="Nom du contact"><input style={fieldInput} value={contact} onChange={e => setContact(e.target.value)} /></Field>
          <Field label="Téléphone"><input style={fieldInput} value={tel} onChange={e => setTel(e.target.value)} /></Field>
          <Field label="Email *"><input style={fieldInput} type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
          <Field label="Mot de passe (8 caractères minimum) *"><input style={fieldInput} type="password" value={pwd} onChange={e => setPwd(e.target.value)} /></Field>

          {erreur && <div style={errorBox}>{erreur}</div>}

          <button onClick={envoyer} disabled={!valide || envoi === 'loading'} style={{ ...primaryBtn, opacity: valide ? 1 : 0.5, cursor: valide ? 'pointer' : 'not-allowed' }}>
            {envoi === 'loading' ? 'Envoi…' : 'Créer mon compte'}
          </button>
          <div style={helpText}>Déjà inscrit ? <Link href="/pro/connexion" style={ghostLink}>Se connecter</Link></div>
        </div>
      </div>
    </div>
  )
}
