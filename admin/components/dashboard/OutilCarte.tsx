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

const TYPES: Record<string, string> = { page: 'Page', plaquette: 'Plaquette', document: 'Document', video: 'Vidéo', scenario: 'Scénario vidéo', animation: 'Animation', parcours: 'Parcours' }

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

export function OutilCarte({ o, onApercu, onSelect, actif }: { o: Outil; onApercu: (o: Outil, url: string) => void; onSelect: (o: Outil, url: string) => void; actif?: boolean }) {
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

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  const petit: React.CSSProperties = { ...btn, minHeight: 32, padding: '0 10px', fontSize: 12, borderRadius: 8 }
  const bloque: React.CSSProperties = { opacity: 0.4, cursor: 'not-allowed' }
  const bord = actif ? `2px solid ${C.violet}` : `1px solid ${C.bordure}`

  return (
    <article data-outil={o.id} data-statut={o.statut} data-actif={actif ? '1' : '0'}
      role="button" tabIndex={0} aria-pressed={!!actif} aria-label={`Sélectionner : ${o.titre}`}
      onClick={() => onSelect(o, url)}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onSelect(o, url) } }}
      style={{ background: '#fff', border: bord, borderRadius: 12, padding: actif ? 11 : 12, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', boxShadow: actif ? `0 0 0 3px ${C.violetClair}` : 'none', alignSelf: 'start' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
            {brouillon && (
              <span data-brouillon style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: C.ko, borderRadius: 6, padding: '1px 8px' }}>Brouillon : ne pas diffuser</span>
            )}
            {o.public.map(p => (
              <span key={p} style={{ fontSize: 10.5, fontWeight: 800, color: C.bleu, background: '#EAF0FB', borderRadius: 999, padding: '1px 8px' }}>
                {PUBLICS.find(x => x.v === p)?.label}
              </span>
            ))}
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.attenue, background: C.fond, borderRadius: 999, padding: '1px 8px' }}>{TYPES[o.type]}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: 14, lineHeight: 1.25, color: C.encre }}>{o.titre}</h3>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.attenue, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{o.description}</p>
        </div>
        {png && url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={png} alt={`QR code : ${o.titre}`} width={actif ? 72 : 44} height={actif ? 72 : 44} data-qr style={{ borderRadius: 6, border: `1px solid ${C.bordure}`, flex: 'none' }} />
        )}
      </div>

      <div onClick={stop} onKeyDown={stop} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button type="button" onClick={onCopier} disabled={brouillon} data-copier
          style={{ ...petit, background: C.violet, borderColor: C.violet, color: '#fff', ...(brouillon ? bloque : {}) }}>
          {copie ? 'Copié ✓' : 'Copier'}
        </button>
        {brouillon ? (
          <>
            <span data-wa aria-disabled="true" style={{ ...petit, ...bloque }}>WhatsApp</span>
            <span data-mail aria-disabled="true" style={{ ...petit, ...bloque }}>Email</span>
          </>
        ) : (
          <>
            <a href={lienWhatsApp(o.message, url)} target="_blank" rel="noopener noreferrer" data-wa style={petit}>WhatsApp</a>
            <a href={lienEmail(o.titre, o.message, url)} data-mail style={petit}>Email</a>
          </>
        )}
        <button type="button" onClick={() => onApercu(o, url)} data-apercu style={petit}>Aperçu</button>
        {o.animation?.courte && (
          <a href={`${o.chemin}${o.chemin.indexOf('?') >= 0 ? '&' : '?'}v=courte`} target="_blank" rel="noopener noreferrer" data-courte style={petit}>Version courte</a>
        )}
      </div>

      {actif && (
        <div onClick={stop} onKeyDown={stop} data-panneau style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${C.bordure}`, paddingTop: 8 }}>
          {o.suivi && !brouillon && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 700, color: C.attenue }}>
              Canal (d’où viennent les inscriptions)
              <select value={canal} onChange={e => setCanal(e.target.value)} aria-label={`Canal pour ${o.titre}`}
                style={{ minHeight: 34, borderRadius: 8, border: `1px solid ${C.bordureChamp}`, padding: '0 8px', fontSize: 13, fontFamily: 'inherit', color: C.encre, background: '#fff' }}>
                {CANAUX.map(c => <option key={c.v} value={c.v}>{c.label}</option>)}
              </select>
            </label>
          )}
          <input readOnly value={aVenir ? 'Vidéo à venir' : brouillon ? 'Lien non diffusable (brouillon)' : url} aria-label={`Lien : ${o.titre}`} data-lien onFocus={e => e.currentTarget.select()}
            style={{ minHeight: 34, borderRadius: 8, border: `1px solid ${C.bordureChamp}`, padding: '0 8px', fontSize: 12, color: C.encre, background: C.fond, fontFamily: 'inherit', minWidth: 0 }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.attenue }}>QR code :</span>
            <button type="button" disabled={!png || brouillon} onClick={() => telecharger(png, nomFichier(o, canal, 'png'))} data-qr-png style={{ ...petit, ...(brouillon ? bloque : {}) }}>PNG</button>
            <button type="button" disabled={!svg || brouillon} onClick={onSvg} data-qr-svg style={{ ...petit, ...(brouillon ? bloque : {}) }}>SVG</button>
          </div>
        </div>
      )}
    </article>
  )
}
