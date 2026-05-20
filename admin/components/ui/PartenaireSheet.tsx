'use client'

import type { FlowinPartenaire } from '@/lib/types'

function emojiForPartenaire(nom: string): string {
  const n = nom.toLowerCase()
  if (n.includes('patisserie') || n.includes('palanque') || n.includes('boulangerie')) return '🍰'
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

interface PartenaireSheetProps {
  partenaire: FlowinPartenaire | null
  onClose: () => void
}

export default function PartenaireSheet({ partenaire, onClose }: PartenaireSheetProps) {
  if (!partenaire) return null

  const siteUrl = partenaire.site_web || partenaire.url
  const instaUrl = partenaire.instagram
    ? partenaire.instagram.startsWith('http')
      ? partenaire.instagram
      : `https://instagram.com/${partenaire.instagram.replace('@', '')}`
    : null
  const fbUrl = partenaire.facebook
    ? partenaire.facebook.startsWith('http')
      ? partenaire.facebook
      : `https://facebook.com/${partenaire.facebook}`
    : null

  const hasLinks = siteUrl || instaUrl || fbUrl

  return (
    <>
      <div className="fl-sheet-overlay" onClick={onClose} />
      <div className="fl-sheet">
        <div className="fl-sheet-handle" />
        <button className="fl-sheet-close" onClick={onClose}>✕</button>
        <div className="fl-sheet-body">
          <div className="fl-sheet-avatar" style={{ background: 'rgba(168,85,247,.15)' }}>
            {partenaire.image_url
              ? <img src={partenaire.image_url} alt={partenaire.nom} />
              : <span style={{ fontSize: 34 }}>{partenaire.emoji || emojiForPartenaire(partenaire.nom)}</span>
            }
          </div>

          <div className="fl-sheet-nom">{partenaire.nom}</div>

          {partenaire.description && (
            <div className="fl-sheet-desc">{partenaire.description}</div>
          )}

          {partenaire.promo_text && (
            <div className="fl-sheet-promo">{partenaire.promo_text}</div>
          )}

          <div className="fl-sheet-links">
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="fl-sheet-link">
                <span className="fl-sheet-link-ico">🌐</span>
                <span>Site internet</span>
              </a>
            )}
            {instaUrl && (
              <a href={instaUrl} target="_blank" rel="noopener noreferrer" className="fl-sheet-link">
                <span className="fl-sheet-link-ico">📸</span>
                <span>Instagram</span>
              </a>
            )}
            {fbUrl && (
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="fl-sheet-link">
                <span className="fl-sheet-link-ico">🔵</span>
                <span>Facebook</span>
              </a>
            )}
            {!hasLinks && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 13, padding: '12px 0' }}>
                Aucun lien configuré
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
