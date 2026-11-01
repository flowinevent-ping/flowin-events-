'use client'

/**
 * Outils commerciaux — UN seul ecran pour tous les liens a envoyer.
 * Chaque outil : lien de production a copier, WhatsApp, email, QR telechargeable (PNG + SVG),
 * apercu (cadre telephone / ordinateur, lecteur pour les videos) et canal `?src=` pour savoir
 * d'ou viennent les inscriptions. Catalogue : lib/outilsCommerciaux.ts.
 */
import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { CHARTE_PRO as C, POLICE_PRO } from '@/lib/charte'
import { CANAUX, avecSource } from '@/lib/source'
import {
  OUTILS, OUTILS_MANQUANTS, PUBLICS, urlProd, lienWhatsApp, lienEmail,
  type Outil, type Public,
} from '@/lib/outilsCommerciaux'

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

function Carte({ o, onApercu }: { o: Outil; onApercu: (o: Outil, url: string) => void }) {
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
    <article data-outil={o.id} data-statut={o.statut} style={{ background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        <button type="button" disabled={aVenir} onClick={() => onApercu(o, url)} data-apercu style={{ ...btn, opacity: aVenir ? 0.4 : 1 }}>Aperçu</button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.attenue }}>QR code :</span>
        <button type="button" disabled={!png || brouillon} onClick={() => telecharger(png, nomFichier(o, canal, 'png'))} data-qr-png style={{ ...btn, opacity: brouillon ? 0.4 : 1, cursor: brouillon ? 'not-allowed' : 'pointer' }}>PNG</button>
        <button type="button" disabled={!svg || brouillon} onClick={onSvg} data-qr-svg style={{ ...btn, opacity: brouillon ? 0.4 : 1, cursor: brouillon ? 'not-allowed' : 'pointer' }}>SVG</button>
      </div>
    </article>
  )
}

function Apercu({ o, url, onFermer }: { o: Outil; url: string; onFermer: () => void }) {
  const [mode, setMode] = useState<'tel' | 'pc'>('tel')
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer() }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onFermer])
  const video = o.type === 'video'
  const largeur = mode === 'tel' ? 360 : 960
  return (
    <div role="dialog" aria-modal="true" aria-label={`Aperçu : ${o.titre}`} data-modal
      onClick={onFermer} style={{ position: 'fixed', inset: 0, background: 'rgba(27,58,92,.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, maxWidth: '100%', maxHeight: '100%', overflow: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <strong style={{ flex: 1, color: C.encre, minWidth: 140 }}>{o.titre}</strong>
          {!video && (
            <>
              <button type="button" onClick={() => setMode('tel')} aria-pressed={mode === 'tel'} style={{ ...btn, background: mode === 'tel' ? C.encre : '#fff', color: mode === 'tel' ? '#fff' : C.encre }}>Téléphone</button>
              <button type="button" onClick={() => setMode('pc')} aria-pressed={mode === 'pc'} style={{ ...btn, background: mode === 'pc' ? C.encre : '#fff', color: mode === 'pc' ? '#fff' : C.encre }}>Ordinateur</button>
            </>
          )}
          <button type="button" onClick={onFermer} data-fermer style={btn}>Fermer</button>
        </div>
        {video ? (
          <video src={o.chemin} poster={o.vignette} controls playsInline preload="metadata" data-video
            style={{ display: 'block', maxHeight: '70vh', maxWidth: '100%', margin: '0 auto', borderRadius: 12, background: '#000' }} />
        ) : (
          <div style={{ width: Math.min(largeur, 960), maxWidth: '100%', margin: '0 auto', border: mode === 'tel' ? '8px solid #1B3A5C' : `1px solid ${C.bordureChamp}`, borderRadius: mode === 'tel' ? 28 : 10, overflow: 'hidden' }}>
            <iframe src={o.chemin} title={`Aperçu : ${o.titre}`} data-iframe
              style={{ display: 'block', width: '100%', height: mode === 'tel' ? 640 : 600, border: 0, background: '#fff' }} />
          </div>
        )}
        <p style={{ margin: '10px 0 0', fontSize: 12, color: C.attenue, wordBreak: 'break-all' }}>{url}</p>
      </div>
    </div>
  )
}

export default function Page() {
  const [filtre, setFiltre] = useState<Public | 'tous'>('tous')
  const [q, setQ] = useState('')
  const [apercu, setApercu] = useState<{ o: Outil; url: string } | null>(null)

  const liste = useMemo(() => OUTILS.filter(o =>
    (filtre === 'tous' || o.public.indexOf(filtre) >= 0)
    && (!q.trim() || (o.titre + ' ' + o.description).toLowerCase().indexOf(q.trim().toLowerCase()) >= 0)
  ), [filtre, q])

  return (
    <div className="sa-page" style={{ background: C.fond, fontFamily: POLICE_PRO, color: C.encre, padding: '24px 28px 40px', minHeight: '100vh' }}>
      <PageHeader title="Outils commerciaux"
        subtitle="Tous les liens à envoyer : copier, WhatsApp, email, QR code et aperçu, au même endroit." />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0 16px', alignItems: 'center' }}>
        {([{ v: 'tous', label: 'Tous' }, ...PUBLICS] as { v: Public | 'tous'; label: string }[]).map(p => (
          <button key={p.v} type="button" onClick={() => setFiltre(p.v)} aria-pressed={filtre === p.v}
            style={{ ...btn, background: filtre === p.v ? C.encre : '#fff', color: filtre === p.v ? '#fff' : C.encre }}>{p.label}</button>
        ))}
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher un outil" aria-label="Chercher un outil"
          style={{ flex: '1 1 200px', minHeight: 40, borderRadius: 10, border: `1px solid ${C.bordureChamp}`, padding: '0 12px', fontSize: 14, fontFamily: 'inherit' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 14 }}>
        {liste.map(o => <Carte key={o.id} o={o} onApercu={(x, u) => setApercu({ o: x, url: u })} />)}
      </div>
      {liste.length === 0 && <p style={{ color: C.attenue }}>Aucun outil ne correspond.</p>}

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 15, margin: '0 0 8px' }}>Pas encore disponibles</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: C.attenue, fontSize: 13, lineHeight: 1.6 }}>
          {OUTILS_MANQUANTS.map(m => <li key={m.titre}><strong style={{ color: C.encre }}>{m.titre}</strong> ({PUBLICS.find(p => p.v === m.public)?.label}) : {m.note}</li>)}
        </ul>
      </section>

      {apercu && <Apercu o={apercu.o} url={apercu.url} onFermer={() => setApercu(null)} />}
    </div>
  )
}
