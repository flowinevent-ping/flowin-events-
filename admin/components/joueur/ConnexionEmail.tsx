'use client'
/** Connexion participant par lien e-mail (17/11/2026) : un champ, un bouton. Pas de mot de passe. */
import { useState } from 'react'
import { envoyerLienConnexion } from '@/lib/connexionJoueur'

const HERO = '#E8336B'

export default function ConnexionEmail({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [etat, setEtat] = useState<'' | 'envoi' | 'envoye'>('')
  const [err, setErr] = useState('')

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setEtat('envoi')
    const m = await envoyerLienConnexion(email)
    if (m) { setErr(m); setEtat('') } else setEtat('envoye')
  }

  if (etat === 'envoye') return (
    <div data-connexion="envoye" style={{ fontSize: 13.5, color: '#1f7a4d', lineHeight: 1.5, fontWeight: 600 }}>
      Lien envoyé à {email.trim().toLowerCase()}. Ouvre-le sur ce téléphone : tes lots reviennent ici.
    </div>
  )

  return (
    <form onSubmit={envoyer} data-connexion="form" style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: compact ? undefined : 320, margin: compact ? 0 : '0 auto' }}>
      <input type="email" required autoComplete="email" inputMode="email" placeholder="Ton e-mail de jeu"
        value={email} onChange={e => setEmail(e.target.value)}
        style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid #dfe2e8', fontSize: 16, background: '#fff', color: '#141a26' }} />
      <button type="submit" disabled={etat === 'envoi'}
        style={{ padding: '12px 18px', borderRadius: 100, border: 0, background: HERO, color: '#fff', fontWeight: 800, fontSize: 15, opacity: etat === 'envoi' ? .6 : 1 }}>
        {etat === 'envoi' ? 'Envoi…' : 'Me connecter'}
      </button>
      {err && <div role="alert" style={{ fontSize: 12.5, color: '#b3261e', lineHeight: 1.4 }}>{err}</div>}
    </form>
  )
}
