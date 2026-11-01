'use client'

/**
 * Carte d'un outil commercial : titre, public, badge brouillon, canal ?src=, lien + Copier,
 * WhatsApp, Email, QR PNG/SVG. Utilisee par « Landing pages & outils commerciaux ».
 * Regle de statut : seul un outil « validé » est partageable ; un brouillon est verrouillé.
 */
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CANAUX, avecSource } from '@/lib/source'
import { PUBLICS, urlProd, lienWhatsApp, lienEmail, type Outil } from '@/lib/outilsCommerciaux'

const TYPES: Record<string, string> = { page: 'Page', plaquette: 'Plaquette', document: 'Document', video: 'Vidéo', parcours: 'Parcours' }

function nomFichier(o: Outil, canal: string, ext: string) {
  return `qr-${o.id}${canal && canal !== 'direct' ? '-' + canal : ''}.${ext}`
}
function telecharger(href: string, nom: string) {
  const a = document.createElement('a')
  a.href = href; a.download = nom
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

async function copier(texte: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(texte); return true }
  } catch { /* repli ci-dessous */ }
  try {
    const t = document.createElement('textarea')
    t.value = texte; t.style.position = 'fixed'; t.style.opacity = '0'
    document.body.appendChild(t); t.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(t)
    return ok
  } catch { return false }
}

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, padding: '0 14px',
  borderRadius: 10, border: `1px solid ${C.bordureChamp}`, background: '#fff', color: C.encre, fontWeight: 700,
  fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit',
}

export function OutilCarte({ o, onApercu, actif }: { o: Outil; onApercu: (o: Outil, url: string) => void; actif?: boolean }) {
  const [canal, setCanal] = useState(o.suivi ? (o.canalDefaut ?? 'direct') : 'direct')
  const [copie, setCopie] = useState(false)
  const [png, setPng] = useState('')
  const [svg, setSvg] = useState('')
  const brouillon = o.statut !== 'validé'
  const aVenir = !!o.aVenir
  const url = aVenir ? '' : avecSource(urlProd(o), canal)

  useEffect(() => {
    if (!url) return
    let vivant = true
    const opts = { errorCorrectionLevel: 'M' as const, margin: 2, color: { dark: '#1B3A5C', light: '#FFFFFF' } }
    QRCode.toDataURL(url, { ...opts, width: 1024 }).then(d => { if (vivant) setPng(d) }).catch(() => {})
    QRCode.toString(url, { ...opts, type: 'svg' }).then(d => { if (vivant) setSvg(d) }).catch(() => {})
    return () => { vivant = false }
  }, [url])

  const onCopier = async () => {
    const ok = await copier(url)
    setCopie(ok)
    window.setTimeout(() => setCopie(false), 2000)
  }
  const onSvg = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const href = URL.createObjectURL(blob)
    telecharger(href, nomFichier(o, canal, 'svg'))
    window.setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  return (
    <article data-outil={o.id} data-statut={o.statut} style={{ background: '#fff', border: actif ? `1.5px solid ${C.violet}` : `1px solid ${C.bordure}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {o.public.map(p => (
              <span key={p} style={{ fontSize: 11, fontWeight: 800, color: C.bleu, background: '#EAF0FB', borderRadius: 999, padding: '2px 9px' }}>
                {PUBLICS.find(x => x.v === p)?.label}
              </span>
            ))}
            <span style={{ fontSize: 11, fontWeight: 700, color: C.attenue, background: C.fond, borderRadius: 999, padding: '2px 9px' }}>{TYPES[o.type]}</span>
          </div>
          {brouillon && (
            <div data-brouillon style={{ display: 'inline-block', margin: '0 0 6px', fontSize: 12, fontWeight: 800, color: '#fff', background: C.ko, borderRadius: 8, padding: '3px 10px' }}>
              Brouillon : ne pas diffuser
            </div>
          )}
          <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.25, color: C.encre }}>{o.titre}</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.attenue, lineHeight: 1.4 }}>{o.description}</p>
        </div>
        {png && url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={png} alt={`QR code : ${o.titre}`} width={84} height={84} data-qr style={{ borderRadius: 8, border: `1px solid ${C.bordure}`, flex: 'none' }} />
        )}
      </div>

      {o.suivi && !brouillon && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 700, color: C.attenue }}>
          Canal (pour savoir d’où viennent les inscriptions)
          <select value={canal} onChange={e => setCanal(e.target.value)} aria-label={`Canal pour ${o.titre}`}
            style={{ minHeight: 40, borderRadius: 10, border: `1px solid ${C.bordureChamp}`, padding: '0 10px', fontSize: 14, fontFamily: 'inherit', color: C.encre, background: '#fff' }}>
            {CANAUX.map(c => <option key={c.v} value={c.v}>{c.label}</option>)}
          </select>
        </label>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input readOnly value={aVenir ? 'Vidéo à venir' : brouillon ? 'Lien non diffusable (brouillon)' : url} aria-label={`Lien : ${o.titre}`} data-lien onFocus={e => e.currentTarget.select()}
          style={{ flex: 1, minWidth: 0, minHeight: 40, borderRadius: 10, border: `1px solid ${C.bordureChamp}`, padding: '0 10px', fontSize: 13, color: C.encre, background: C.fond, fontFamily: 'inherit' }} />
        <button type="button" onClick={onCopier} disabled={brouillon} data-copier style={{ ...btn, background: C.violet, borderColor: C.violet, color: '#fff', minWidth: 96, opacity: brouillon ? 0.4 : 1, cursor: brouillon ? 'not-allowed' : 'pointer' }}>
          {copie ? 'Copié ✓' : 'Copier'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {brouillon ? (
          <>
            <span data-wa aria-disabled="true" style={{ ...btn, opacity: 0.4, cursor: 'not-allowed' }}>WhatsApp</span>
            <span data-mail aria-disabled="true" style={{ ...btn, opacity: 0.4, cursor: 'not-allowed' }}>Email</span>
          </>
        ) : (
          <>
            <a href={lienWhatsApp(o.message, url)} target="_blank" rel="noopener noreferrer" data-wa style={btn}>WhatsApp</a>
            <a href={lienEmail(o.titre, o.message, url)} data-mail style={btn}>Email</a>
          </>
        )}
        <button type="button" onClick={() => onApercu(o, url)} data-apercu style={btn}>Aperçu</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.attenue }}>QR code :</span>
        <button type="button" disabled={!png || brouillon} onClick={() => telecharger(png, nomFichier(o, canal, 'png'))} data-qr-png style={{ ...btn, opacity: brouillon ? 0.4 : 1, cursor: brouillon ? 'not-allowed' : 'pointer' }}>PNG</button>
        <button type="button" disabled={!svg || brouillon} onClick={onSvg} data-qr-svg style={{ ...btn, opacity: brouillon ? 0.4 : 1, cursor: brouillon ? 'not-allowed' : 'pointer' }}>SVG</button>
      </div>
    </article>
  )
}

