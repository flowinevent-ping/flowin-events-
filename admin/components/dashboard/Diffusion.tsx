'use client'

/**
 * DIFFUSION — ce qu'on remet a un commerce pour qu'il puisse etre flashe.
 *
 * Romain, 31/08 : « chaque station porte un QR de tracking + 1 lien digital
 * unique + des supports (affiche, video) ». Le QR existait deja partout dans
 * le dashboard, mais TOUJOURS sous la forme d'une <img> pointant vers
 * api.qrserver.com : une image distante, donc
 *   - impossible a telecharger proprement (cross-origin),
 *   - illisible a l'impression (200 px etires sur une affiche A4),
 *   - et hors service des que ce tiers tombe ou change d'URL.
 *
 * Ici le QR est genere DANS LE NAVIGATEUR (paquet `qrcode`, import dynamique
 * pour ne pas peser sur le bundle initial). Consequences :
 *   - plus aucun appel reseau vers un tiers,
 *   - PNG haute definition et SVG vectoriel telechargeables,
 *   - affiche A4 imprimable avec le QR en vectoriel, donc net a toute taille.
 *
 * Ce composant NE CREE AUCUNE DONNEE : il ne fait que mettre en forme une URL
 * qu'on lui passe. L'apercu du parcours reste l'iframe deja utilisee partout
 * ailleurs (meme technique que ParcoursMobil), pas une seconde implementation.
 */

import { useEffect, useState } from 'react'
import { Ico } from '@/lib/proicons'
import { nomFichierQr } from '@/lib/qrPermalien'
import { ouvrirAfficheA4 } from '@/lib/afficheQr'

type Props = {
  /** L'URL a encoder — deja construite par l'appelant, jamais fabriquee ici. */
  url: string
  /** Nom affiche sur l'affiche A4 et dans le nom du fichier telecharge. */
  titre: string
  /** Ligne secondaire de l'affiche (ex. le super event). */
  sousTitre?: string
  /** Version reduite : QR plus petit, pas d'apercu telephone. */
  compact?: boolean
  /** Vignette seule : le QR, sans lien ni boutons. Pour les listes. */
  vignette?: number
  /** Identification du QR (audit 01/11) : son nom, son support et son code court figurent sur
   *  l'affiche ET dans le nom des fichiers, pour ne jamais confondre deux QR a l'impression. */
  qrNom?: string
  support?: string | null
  code?: string | null
  /** Conservé pour compatibilité des appels ; plus aucun libellé affiché (10/11). */
  ancienFormat?: boolean
}

function telecharger(nom: string, blob: Blob) {
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = nom
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Laisser au navigateur le temps de demarrer le telechargement avant de liberer.
  setTimeout(() => URL.revokeObjectURL(href), 4000)
}

export default function Diffusion({ url, titre, sousTitre, compact = false, vignette, qrNom, support, code }: Props) {
  /* L etat porte SON url : sans ca, en changeant d event dans un drawer qui
     n est jamais demonte, on affiche une frame le QR du precedent sous le nom
     et le lien du nouveau — avec les boutons de telechargement actifs. */
  const [qr, setQr] = useState<{ url: string; png: string; svg: string } | null>(null)
  const png = qr && qr.url === url ? qr.png : ''
  const svg = qr && qr.url === url ? qr.svg : ''
  const [erreur, setErreur] = useState('')
  const [copie, setCopie] = useState(false)
  const [apercu, setApercu] = useState(false)

  const taille = vignette ?? (compact ? 132 : 208)

  useEffect(() => {
    if (!url) return
    let vivant = true
    setErreur('')
    /* QR Flowin : marque « Flowin Animation » au centre, correction H (lib/qrLogo). */
    import('@/lib/qrLogo')
      .then(async m => {
        const [p, s] = await Promise.all([m.qrFlowinPng(url, 1024), m.qrFlowinSvg(url, 1024)])
        if (!vivant) return
        setQr({ url, png: p, svg: s })
      })
      .catch(() => { if (vivant) setErreur("Le QR n'a pas pu être généré dans ce navigateur.") })
    return () => { vivant = false }
  }, [url])

  function copier() {
    setErreur('')
    const p = navigator.clipboard?.writeText(url)
    if (!p) { setErreur('Copie impossible dans ce navigateur.'); return }
    // Ne dire « copié » que si ça l a vraiment été : un accusé de reception faux
    // est pire que pas d accusé du tout.
    p.then(() => {
      setCopie(true)
      setTimeout(() => setCopie(false), 1800)
    }).catch(() => setErreur('Copie impossible dans ce navigateur.'))
  }

  function dlPng() {
    setErreur('')
    if (!png) return
    // dataURL -> octets, sans refaire un aller-retour reseau.
    const b64 = png.split(',')[1]
    const bin = atob(b64)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    telecharger(nomFichierQr({ titre, qr: qrNom, support, code }, 'png'), new Blob([buf], { type: 'image/png' }))
  }

  function dlSvg() {
    setErreur('')
    if (!svg) return
    telecharger(nomFichierQr({ titre, qr: qrNom, support, code }, 'svg'), new Blob([svg], { type: 'image/svg+xml' }))
  }

  /** Affiche A4 : QR vectoriel, donc net a l'impression quelle que soit la taille (lib/afficheQr). */
  function affiche() {
    setErreur('')
    if (!svg) return
    const e = ouvrirAfficheA4({ svg, url, titre, sousTitre, qrNom, support, code })
    if (e) setErreur(e)
  }

  const btn: React.CSSProperties = { fontSize: 12 }

  const cadre = (
    <div style={{
      width: taille, height: taille, margin: vignette ? 0 : '0 auto', display: 'grid', placeItems: 'center',
      borderRadius: vignette ? 6 : 12, border: '1px solid var(--sa-border)', background: '#fff',
      padding: vignette ? 3 : 8, flexShrink: 0,
    }}>
      {png
        ? <img src={png} alt={`QR code — ${titre}`} style={{ width: '100%', height: '100%' }} />
        : <span style={{ fontSize: 10, color: 'var(--sa-muted)' }}>{erreur ? '—' : '…'}</span>}
    </div>
  )

  if (vignette) return cadre

  return (
    <div style={{ textAlign: 'center' }}>
      {cadre}

      <div style={{
        marginTop: 12, fontSize: 11.5, background: 'var(--sa-subtle)', padding: '8px 12px',
        borderRadius: 8, wordBreak: 'break-all', textAlign: 'left',
      }}>
        {url}
      </div>


      <div style={{ marginTop: 10, display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="sa-btn sm" style={btn} onClick={copier}>{copie ? '✓ Copié' : 'Copier le lien'}</button>
        <button className="sa-btn sm" style={btn} onClick={dlPng} disabled={!png}>⬇ PNG</button>
        <button className="sa-btn sm" style={btn} onClick={dlSvg} disabled={!svg}>⬇ SVG</button>
        <button className="sa-btn sm" style={btn} onClick={affiche} disabled={!svg}><Ico k="file" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Affiche A4</button>
        {!compact && (
          <button className="sa-btn sm" style={btn} onClick={() => setApercu(v => !v)}>
            {apercu ? '▲ Masquer l’aperçu' : 'Aperçu du parcours'}
          </button>
        )}
      </div>

      {erreur && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--sa-danger, #DC2626)' }}>{erreur}</div>
      )}

      {!compact && apercu && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          {/* Meme technique que ParcoursMobil : le VRAI parcours en direct, pas une maquette. */}
          <div style={{ borderRadius: 30, padding: 9, background: '#0F172A' }}>
            <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', width: 236, height: 472 }}>
              <iframe
                /* URL relative : en preview Vercel ou en local, on veut voir CE
                   deploiement, pas la production. preview=1 empeche le comptage. */
                src={(() => {
                  const rel = url.replace(/^https?:\/\/[^/]+/, '')
                  return rel.includes('?') ? `${rel}&preview=1&bar=0` : `${rel}?preview=1&bar=0`
                })()}
                title={`Aperçu — ${titre}`}
                loading="lazy"
                style={{
                  width: Math.round(236 / 0.62), height: Math.round(472 / 0.62), border: 0,
                  transform: 'scale(0.62)', transformOrigin: 'top left',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
