'use client'

import { useState } from 'react'
import type { SubmitFormData } from '@/lib/types'

interface FormCRMProps {
  onSubmit: (data: SubmitFormData) => Promise<void>
  submitting?: boolean
  couleur?: string
  ctaLabel?: string
  showOptin?: boolean
}

interface Errors {
  prenom?: string
  nom?: string
  email?: string
  tel?: string
}

export default function FormCRM({
  onSubmit,
  submitting = false,
  couleur = '#D4537E',
  ctaLabel = 'Valider mon inscription →',
  showOptin = true,
}: FormCRMProps) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [tel, setTel] = useState('')
  const [optin, setOptin] = useState(true)
  const [errors, setErrors] = useState<Errors>({})

  function validate(): boolean {
    const e: Errors = {}
    if (!prenom.trim()) e.prenom = 'Prénom obligatoire'
    if (!nom.trim()) e.nom = 'Nom obligatoire'
    if (!email.trim() || !email.includes('@')) e.email = 'Email invalide'
    if (!tel.trim() || tel.replace(/\s/g, '').length < 8) e.tel = 'Téléphone obligatoire (min 8 chiffres)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    await onSubmit({
      prenom: prenom.trim(),
      nom: nom.trim(),
      email: email.trim().toLowerCase(),
      tel: tel.trim().replace(/\s/g, ''),
      optin,
    })
  }

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div className="fl-field">
        <label className="fl-label">Prénom *</label>
        <input
          className={`fl-input${errors.prenom ? ' error' : ''}`}
          value={prenom}
          onChange={e => setPrenom(e.target.value)}
          placeholder="Votre prénom"
          autoCapitalize="words"
        />
        {errors.prenom && <div className="fl-error-msg">{errors.prenom}</div>}
      </div>

      <div className="fl-field">
        <label className="fl-label">Nom *</label>
        <input
          className={`fl-input${errors.nom ? ' error' : ''}`}
          value={nom}
          onChange={e => setNom(e.target.value)}
          placeholder="Votre nom"
          autoCapitalize="words"
        />
        {errors.nom && <div className="fl-error-msg">{errors.nom}</div>}
      </div>

      <div className="fl-field">
        <label className="fl-label">Email *</label>
        <input
          className={`fl-input${errors.email ? ' error' : ''}`}
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="votre@email.com"
          type="email"
          inputMode="email"
          autoCapitalize="none"
        />
        {errors.email && <div className="fl-error-msg">{errors.email}</div>}
      </div>

      <div className="fl-field">
        <label className="fl-label">Téléphone *</label>
        <input
          className={`fl-input${errors.tel ? ' error' : ''}`}
          value={tel}
          onChange={e => setTel(e.target.value)}
          placeholder="06 xx xx xx xx"
          type="tel"
          inputMode="tel"
        />
        {errors.tel && <div className="fl-error-msg">{errors.tel}</div>}
      </div>

      {showOptin && (
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <input
            type="checkbox"
            checked={optin}
            onChange={e => setOptin(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: couleur }}
          />
          <label style={{ fontSize: 12, color: '#666', lineHeight: 1.5, cursor: 'pointer' }}>
            J&apos;accepte de recevoir des communications de la part des organisateurs (newsletter, offres partenaires).
          </label>
        </div>
      )}

      <button
        className="fl-btn fl-btn-primary"
        style={{ background: couleur, opacity: submitting ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Vérification…' : ctaLabel}
      </button>
    </div>
  )
}
