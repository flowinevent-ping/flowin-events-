'use client'

import { useState } from 'react'
import type { FlowinPartenaire, FlowinEvent } from '@/lib/types'
import PartenaireSheet from './PartenaireSheet'

function emojiForPartenaire(nom: string): string {
  const n = nom.toLowerCase()
  if (n.includes('patisserie') || n.includes('palanque')) return '🍰'
  if (n.includes('bijouterie') || n.includes('bijou') || n.includes('lorenzo')) return '💎'
  if (n.includes('ccdk') || n.includes('commerce')) return '🏪'
  if (n.includes('cinema') || n.includes('majestic')) return '🎬'
  if (n.includes('sport') || n.includes('decathlon')) return '🏃'
  if (n.includes('pizza') || n.includes('restaurant') || n.includes('napoli')) return '🍕'
  if (n.includes('mairie') || n.includes('ville') || n.includes('croix')) return '🏛️'
  if (n.includes('jazz') || n.includes('musique')) return '🎷'
  if (n.includes('ski') || n.includes('isola')) return '⛷️'
  return '🤝'
}

interface PartenairesScreenProps {
  partenaires: FlowinPartenaire[]
  event: FlowinEvent
  couleur: string
  dark?: boolean
  onBack: () => void
}

export default function PartenairesScreen({
  partenaires,
  event,
  couleur,
  dark = false,
  onBack,
}: PartenairesScreenProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const tileStyle = dark ? {
    background: 'rgba(255,255,255,.1)',
    border: '1.5px solid rgba(255,255,255,.2)',
    color: '#fff',
  } : {
    background: '#fff',
    border: '1.5px solid rgba(0,0,0,.1)',
    color: '#1a1a2e',
  }

  const nameColor = dark ? '#fff' : '#1a1a2e'

  return (
    <div className="fl-screen active" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="fl-header">
        <button className="fl-back-btn" onClick={onBack}>←</button>
        <div>
          <div style={{ fontFamily: 'Fredoka One, cursive', fontSize: 18 }}>Nos partenaires</div>
          <div style={{ fontSize: 11, color: '#888' }}>Ils rendent cet event possible ({partenaires.length})</div>
        </div>
      </div>

      {/* Label event */}
      <div style={{
        textAlign: 'center', fontSize: 11, fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '.12em',
        color: couleur, padding: '0 20px 16px'
      }}>
        ★ Partenaires · {event.nom} ★
      </div>

      {/* Grid */}
      {partenaires.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888', fontSize: 14 }}>
          Aucun partenaire configuré pour cet event.
        </div>
      ) : (
        <div className="fl-part-grid">
          {partenaires.map((p, i) => {
            const hasLinks = p.site_web || p.url || p.instagram || p.facebook
            return (
              <div
                key={p.id}
                className="fl-part-tile"
                style={tileStyle}
                onClick={() => setSelectedIdx(i)}
              >
                {p.image_url
                  ? <img src={p.image_url} alt={p.nom} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }} />
                  : <span className="fl-part-emoji">{p.emoji || emojiForPartenaire(p.nom)}</span>
                }
                <div className="fl-part-name" style={{ color: nameColor }}>
                  {p.nom.length > 18 ? p.nom.slice(0, 16) + '…' : p.nom}
                </div>
                {hasLinks && <div className="fl-part-voir" style={{ color: couleur }}>→ voir</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom sheet */}
      {selectedIdx !== null && (
        <PartenaireSheet
          partenaire={partenaires[selectedIdx]}
          onClose={() => setSelectedIdx(null)}
        />
      )}
    </div>
  )
}
