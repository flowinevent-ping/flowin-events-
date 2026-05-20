'use client'

import type { FlowinEvent, FlowinLot } from '@/lib/types'

interface TicketScreenProps {
  ticket: string
  ticket2?: string
  event: FlowinEvent
  lots: FlowinLot[]
  couleur: string
  onPartenaires: () => void
  onHome: () => void
}

export default function TicketScreen({
  ticket,
  ticket2,
  event,
  lots,
  couleur,
  onPartenaires,
  onHome,
}: TicketScreenProps) {
  const cfg = event.cfg ?? {}
  const drawDate = cfg.drawDate as string | undefined
  const subtitle = cfg.subtitle as string | undefined

  return (
    <div className="fl-screen active" style={{ background: 'var(--bg)', padding: '20px 0' }}>
      <div style={{ textAlign: 'center', padding: '24px 20px 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
        <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 22, color: couleur }}>
          Inscription confirmée !
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{subtitle}</div>
        )}
      </div>

      {/* Ticket principal */}
      <div className="fl-ticket" style={{ borderTopColor: couleur }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>🎟️</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#888', marginBottom: 2 }}>
          {event.nom}
        </div>
        <div className="fl-ticket-code" style={{ color: couleur }}>{ticket}</div>
        {drawDate && (
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Tirage le <strong>{drawDate}</strong>
          </div>
        )}
      </div>

      {/* Ticket bonus si présent */}
      {ticket2 && (
        <div className="fl-ticket" style={{ borderTopColor: '#1D9E75', marginTop: 10 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🌟</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#1D9E75', marginBottom: 2 }}>
            Ticket bonus
          </div>
          <div className="fl-ticket-code" style={{ color: '#1D9E75' }}>{ticket2}</div>
        </div>
      )}

      {/* Note info */}
      <div style={{
        margin: '14px 20px 0',
        background: 'rgba(0,0,0,.04)', borderRadius: 12,
        padding: '12px 16px', fontSize: 12, fontWeight: 700,
        color: '#555', lineHeight: 1.6
      }}>
        📸 Capture d&apos;écran recommandée · Résultats par email
      </div>

      {/* Lots à gagner */}
      {lots.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#888', marginBottom: 8 }}>
            🎁 Lots à gagner
          </div>
          {lots.map(lot => (
            <div key={lot.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,.06)'
            }}>
              <div style={{ fontSize: 24 }}>{lot.emoji ?? '🎁'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{lot.titre || lot.nom}</div>
                {lot.valeur ? <div style={{ fontSize: 11, color: '#888' }}>{lot.valeur} €</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTAs */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="fl-btn fl-btn-primary" style={{ background: couleur }} onClick={onPartenaires}>
          🤝 Voir nos partenaires →
        </button>
        <button className="fl-btn fl-btn-ghost" style={{ color: couleur, borderColor: couleur }} onClick={onHome}>
          ← Retour à l&apos;accueil
        </button>
      </div>
    </div>
  )
}
