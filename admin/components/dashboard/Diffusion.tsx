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
}

/** Nom de fichier sur : pas d'accent, pas d'espace, pas de separateur de chemin. */
function slug(s: string) {
  return (s || 'qr')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'qr'
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

export default function Diffusion({ url, titre, sousTitre, compact = false, vignette }: Props) {
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
    import('qrcode')
      .then(async mod => {
        const QR = mod.default ?? mod
        const [p, s] = await Promise.all([
          QR.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: 'M' }),
          QR.toString(url, { type: 'svg', width: 1024, margin: 2, errorCorrectionLevel: 'M' }),
        ])
        if (!vivant) return
        setQr({ url, png: p, svg: s as string })
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
    telecharger(`qr-${slug(titre)}.png`, new Blob([buf], { type: 'image/png' }))
  }

  function dlSvg() {
    setErreur('')
    if (!svg) return
    telecharger(`qr-${slug(titre)}.svg`, new Blob([svg], { type: 'image/svg+xml' }))
  }

  /** Affiche A4 : QR vectoriel, donc net a l'impression quelle que soit la taille. */
  function affiche() {
    setErreur('')
    if (!svg) return
    const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Affiche — ${esc(titre)}</title>
<style>
  @page { size: A4; margin: 0 }
  * { box-sizing: border-box }
  body { margin:0; font-family: Manrope, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#0F172A }
  .p { width:210mm; height:297mm; padding:22mm 18mm; display:flex; flex-direction:column;
       align-items:center; justify-content:center; text-align:center; page-break-after:always }
  .k { font-size:13pt; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#7C2D92 }
  h1 { font-size:34pt; line-height:1.1; margin:6mm 0 2mm; font-weight:900 }
  .s { font-size:15pt; color:#475569; margin:0 0 10mm }
  .q { width:112mm; height:112mm; padding:6mm; background:#fff; border:2px solid #E2E8F0; border-radius:8mm }
  .q svg { width:100%; height:100% }
  .c { font-size:19pt; font-weight:800; margin-top:10mm }
  .u { font-size:9.5pt; color:#94A3B8; margin-top:4mm; word-break:break-all; max-width:150mm }
  @media print { .n { display:none } }
  .n { position:fixed; top:10px; right:10px; font:600 13px/1 system-ui; background:#7C2D92;
       color:#fff; border:0; border-radius:8px; padding:10px 14px; cursor:pointer }
</style></head><body>
<button class="n" onclick="window.print()">Imprimer</button>
<div class="p">
  <div class="k">Flowin</div>
  <h1>${esc(titre)}</h1>
  <p class="s">${esc(sousTitre ?? 'Scannez pour jouer')}</p>
  <div class="q">${svg}</div>
  <div class="c">Scannez ce QR code pour jouer</div>
  <div class="u">${esc(url)}</div>
</div></body></html>`
    const w = window.open('', '_blank')
    if (!w) { setErreur("La fenêtre d'impression a été bloquée par le navigateur."); return }
    w.document.write(html)
    w.document.close()
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
        <button className="sa-btn sm" style={btn} onClick={copier}>{copie ? '✓ Copié' : '📋 Copier le lien'}</button>
        <button className="sa-btn sm" style={btn} onClick={dlPng} disabled={!png}>⬇ PNG</button>
        <button className="sa-btn sm" style={btn} onClick={dlSvg} disabled={!svg}>⬇ SVG</button>
        <button className="sa-btn sm" style={btn} onClick={affiche} disabled={!svg}>🖨 Affiche A4</button>
        {!compact && (
          <button className="sa-btn sm" style={btn} onClick={() => setApercu(v => !v)}>
            {apercu ? '▲ Masquer l’aperçu' : '📱 Aperçu du parcours'}
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
