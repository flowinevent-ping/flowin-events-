'use client'

import { useState, useEffect } from 'react'
import { generateTicket } from '@/lib/ticket'
import { actionCheckDuplicate, actionWriteJoueur } from '@/lib/actions'
import type { FlowinEvent, FlowinLot, FlowinPartenaire, SubmitFormData } from '@/lib/types'
import FormCRM from '@/components/ui/FormCRM'
import TicketScreen from '@/components/ui/TicketScreen'
import PartenairesScreen from '@/components/ui/PartenairesScreen'

type Screen = 'landing' | 'form' | 'ticket' | 'already' | 'partenaires'

interface Props {
  event: FlowinEvent | null
  lots: FlowinLot[]
  partenaires: FlowinPartenaire[]
  evId: string
}

const LS_KEY_PREFIX = 'flowin_played_'

export default function TombolaClient({ event, lots, partenaires, evId }: Props) {
  const [screen, setScreen] = useState<Screen>('landing')
  const [ticket, setTicket] = useState('')
  const [alreadyEmail, setAlreadyEmail] = useState('')
  const [alreadyTicket, setAlreadyTicket] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const couleur = event?.couleur ?? '#E8212B'

  /* Vérifier anti-doublon localStorage au boot */
  useEffect(() => {
    if (!evId) return
    try {
      const stored = localStorage.getItem(LS_KEY_PREFIX + evId)
      if (stored) {
        const data = JSON.parse(stored)
        setAlreadyEmail(data.email ?? '')
        setAlreadyTicket(data.ticket ?? '')
        setScreen('already')
      }
    } catch { /* pas de localStorage */ }
  }, [evId])

  /* Event non trouvé */
  if (!event) {
    return (
      <div id="flowin-vp" style={{ '--bg': '#fff', '--a': '#D4537E' } as React.CSSProperties}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40 }}>
          <div style={{ fontSize: 48 }}>❌</div>
          <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center' }}>Event introuvable</div>
          <div style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>
            Vérifiez le lien ou contactez l&apos;organisateur.
          </div>
        </div>
      </div>
    )
  }

  const cfg = event.cfg ?? {}
  const drawDate = (cfg.drawDate as string) ?? ''
  const nomCourt = (cfg.nomCourt as string) ?? event.nom

  /* Soumission formulaire */
  async function handleFormSubmit(form: SubmitFormData) {
    setSubmitting(true)
    setFormError(null)

    /* Anti-doublon Supabase */
    const dupResult = await actionCheckDuplicate(form.email, form.tel, event!.id)
    if (dupResult === 'email_duplicate') {
      setFormError('Cet email est déjà inscrit à cette tombola')
      setSubmitting(false)
      return
    }
    if (dupResult === 'tel_duplicate') {
      setFormError('Ce téléphone est déjà inscrit à cette tombola')
      setSubmitting(false)
      return
    }

    /* Génération ticket */
    const t = generateTicket('TB')
    setTicket(t)

    /* Sauvegarde Supabase */
    const result = await actionWriteJoueur(event!, form, t)
    if (!result.success) {
      setFormError('Erreur lors de l\'inscription. Veuillez réessayer.')
      setSubmitting(false)
      return
    }

    /* Anti-doublon localStorage */
    try {
      localStorage.setItem(LS_KEY_PREFIX + evId, JSON.stringify({
        email: form.email, ticket: t, ts: Date.now()
      }))
    } catch { /* pas de localStorage */ }

    setSubmitting(false)
    setScreen('ticket')
  }

  return (
    <div
      id="flowin-vp"
      style={{ '--bg': '#111', '--a': couleur, '--text': '#fff', '--muted': 'rgba(255,255,255,.6)' } as React.CSSProperties}
    >

      {/* ── SCREEN 1 : Landing ── */}
      {screen === 'landing' && (
        <div className="fl-screen active" style={{ background: `linear-gradient(160deg, ${couleur}22 0%, #111 100%)` }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px 24px' }}>
            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🎟️</div>
              <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 28, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
                {nomCourt}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.5 }}>
                {event.description || 'Inscrivez-vous et tentez de gagner !'}
              </div>
              {event.lieu && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                  📍 {event.lieu}
                  {drawDate && ` · Tirage le ${drawDate}`}
                </div>
              )}
            </div>

            {/* Lots preview */}
            {lots.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: couleur, marginBottom: 10, textAlign: 'center' }}>
                  🎁 Lots à gagner
                </div>
                {lots.slice(0, 3).map(lot => (
                  <div key={lot.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                    <span style={{ fontSize: 24 }}>{lot.emoji ?? '🎁'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{lot.titre || lot.nom}</div>
                      {lot.valeur ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{lot.valeur} €</div> : null}
                    </div>
                  </div>
                ))}
                {lots.length > 3 && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', textAlign: 'center', marginTop: 8 }}>
                    + {lots.length - 3} autres lots
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <div style={{ marginTop: 'auto' }}>
              <button
                className="fl-btn fl-btn-primary"
                style={{ background: couleur, fontSize: 17 }}
                onClick={() => setScreen('form')}
              >
                Participer à la tombola →
              </button>
              {partenaires.length > 0 && (
                <button
                  className="fl-btn fl-btn-ghost"
                  style={{ marginTop: 10, color: 'rgba(255,255,255,.6)', borderColor: 'rgba(255,255,255,.2)' }}
                  onClick={() => setScreen('partenaires')}
                >
                  🤝 Voir nos partenaires
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 2 : Formulaire ── */}
      {screen === 'form' && (
        <div className="fl-screen active" style={{ background: '#f8f8fc' }}>
          <div className="fl-header" style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.08)' }}>
            <button className="fl-back-btn" onClick={() => setScreen('landing')}>←</button>
            <div>
              <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 17, color: '#1a1a2e' }}>Inscription</div>
              <div style={{ fontSize: 11, color: '#888' }}>{nomCourt}</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0 0' }}>
            <div style={{ padding: '0 20px 16px' }}>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.5 }}>
                Remplissez le formulaire pour recevoir votre numéro de tombola 🎟️
              </div>
            </div>

            {formError && (
              <div style={{ margin: '0 20px 12px', padding: '12px 16px', background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#A32D2D' }}>
                ⚠️ {formError}
              </div>
            )}

            <FormCRM
              onSubmit={handleFormSubmit}
              submitting={submitting}
              couleur={couleur}
              ctaLabel="Valider mon inscription →"
            />
          </div>
        </div>
      )}

      {/* ── SCREEN 3 : Ticket ── */}
      {screen === 'ticket' && (
        <TicketScreen
          ticket={ticket}
          event={event}
          lots={lots}
          couleur={couleur}
          onPartenaires={() => setScreen('partenaires')}
          onHome={() => setScreen('landing')}
        />
      )}

      {/* ── SCREEN 4 : Déjà inscrit ── */}
      {screen === 'already' && (
        <div className="fl-screen active" style={{ background: '#111' }}>
          <div className="fl-ad-screen">
            <div className="fl-ad-icon">✋</div>
            <div className="fl-ad-title" style={{ color: '#fff' }}>Déjà inscrit·e !</div>
            <div className="fl-ad-msg">
              L&apos;adresse <strong style={{ color: couleur }}>{alreadyEmail}</strong> est déjà inscrite à cette tombola.
            </div>
            {alreadyTicket && (
              <div className="fl-ticket" style={{ borderTopColor: couleur, width: '100%' }}>
                <div style={{ fontSize: 28 }}>🎟️</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#888' }}>Ton ticket tombola</div>
                <div className="fl-ticket-code" style={{ color: couleur }}>{alreadyTicket}</div>
                {drawDate && (
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Tirage le {drawDate}</div>
                )}
              </div>
            )}
            <button className="fl-btn fl-btn-ghost" style={{ color: couleur, borderColor: couleur }} onClick={() => setScreen('landing')}>
              ← Retour à l&apos;accueil
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 5 : Partenaires ── */}
      {screen === 'partenaires' && (
        <PartenairesScreen
          partenaires={partenaires}
          event={event}
          couleur={couleur}
          dark
          onBack={() => setScreen(ticket ? 'ticket' : 'landing')}
        />
      )}
    </div>
  )
}
