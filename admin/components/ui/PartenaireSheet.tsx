'use client'

import type { FlowinPartenaire } from '@/lib/types'
import { Ico } from '@/lib/proicons'

function icoForPartenaire(nom: string): string {
  const n = nom.toLowerCase()
  if (n.includes('cinema') || n.includes('majestic')) return 'camera'
  if (n.includes('mairie') || n.includes('ville') || n.includes('croix')) return 'building'
  return 'shop'
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
          <div className="fl-sheet-avatar" style={{ background: 'rgba(96,165,250,.15)' }}>
            {partenaire.image_url
              ? <img src={partenaire.image_url} alt={partenaire.nom} />
              : <span style={{ display: 'inline-flex' }}><Ico k={icoForPartenaire(partenaire.nom)} size={34} /></span>
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
                <span className="fl-sheet-link-ico"><Ico k="globe" size={16} /></span>
                <span>Site internet</span>
              </a>
            )}
            {instaUrl && (
              <a href={instaUrl} target="_blank" rel="noopener noreferrer" className="fl-sheet-link">
                <span className="fl-sheet-link-ico"><Ico k="camera" size={16} /></span>
                <span>Instagram</span>
              </a>
            )}
            {fbUrl && (
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="fl-sheet-link">
                <span className="fl-sheet-link-ico"><Ico k="facebook" size={16} /></span>
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
