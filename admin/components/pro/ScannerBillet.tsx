'use client'

/**
 * SCANNER UN BILLET GAGNANT (31/10/2026) — decision : « scan des billets
 * gagnants au telephone ». Le QR du billet ouvre la page de validation
 * existante (/lot.html?t=<jeton>, RPC valider_lot + PIN pro, destockage).
 *
 * Trois facons d'y arriver, de la plus directe a la plus robuste :
 *   1. la camera dans cette page (BarcodeDetector, sinon jsQR : iPhone et Android) ;
 *   2. l'appareil photo du telephone (iPhone : viser le QR, toucher le lien) ;
 *   3. le code imprime sous le QR, saisi a la main.
 */
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { estDemo } from '@/lib/demo'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, CHAMP, LABEL, BTN, BTN2, H1, SUB, MUTED } from '@/lib/proui'

/* N'ouvre que la page de validation Flowin, jamais une adresse quelconque lue dans un QR. */
function lienValidation(brut: string): string | null {
  try {
    const u = new URL(brut, window.location.origin)
    const hoteOk = u.host === window.location.host || /(^|\.)flowin-events\.vercel\.app$/.test(u.host)
    const t = u.searchParams.get('t')
    if (hoteOk && /\/lot\.html$/.test(u.pathname) && t) return `/lot.html?t=${encodeURIComponent(t)}`
  } catch { /* pas une URL */ }
  return null
}

interface Detecteur { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
type JsQR = (d: Uint8ClampedArray, w: number, h: number, o?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' }) => { data: string } | null

/* Decision Romain (19/11/2026) : camera dans la page aussi sur iPhone. getUserMedia
   (camera arriere) + BarcodeDetector s'il existe (Chrome Android), sinon jsQR (MIT,
   charge a la demande) sur une image de la video. iOS Safari : playsInline + muted, HTTPS. */
export default function ScannerBillet() {
  const video = useRef<HTMLVideoElement>(null)
  const toile = useRef<HTMLCanvasElement | null>(null)
  const flux = useRef<MediaStream | null>(null)
  const [cameraDispo, setCameraDispo] = useState(false)
  const [actif, setActif] = useState(false)
  const [message, setMessage] = useState('')
  const [code, setCode] = useState('')
  const [recherche, setRecherche] = useState<'idle' | 'loading' | 'introuvable' | 'erreur'>('idle')

  useEffect(() => {
    setCameraDispo(typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
    return () => { flux.current?.getTracks().forEach(t => t.stop()) }
  }, [])

  async function decodeur(): Promise<(v: HTMLVideoElement) => Promise<string[]>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const BD = (window as any).BarcodeDetector
    if (BD) {
      try {
        const det: Detecteur = new BD({ formats: ['qr_code'] })
        return async v => (await det.detect(v)).map(x => x.rawValue)
      } catch { /* format non pris en charge : jsQR */ }
    }
    const jsQR = ((await import('jsqr')).default) as unknown as JsQR
    return async v => {
      const w = v.videoWidth, h = v.videoHeight
      if (!w || !h) return []
      const k = Math.min(1, 640 / Math.max(w, h))
      const cw = Math.round(w * k), ch = Math.round(h * k)
      const c = toile.current ?? (toile.current = document.createElement('canvas'))
      c.width = cw; c.height = ch
      const ctx = c.getContext('2d', { willReadFrequently: true } as CanvasRenderingContext2DSettings)
      if (!ctx) return []
      ctx.drawImage(v, 0, 0, cw, ch)
      const r = jsQR(ctx.getImageData(0, 0, cw, ch).data, cw, ch, { inversionAttempts: 'dontInvert' })
      return r?.data ? [r.data] : []
    }
  }

  async function demarrer() {
    setMessage('')
    let s: MediaStream
    try {
      s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
    } catch (e) {
      const nom = (e as { name?: string })?.name ?? ''
      setMessage(nom === 'NotAllowedError' || nom === 'SecurityError'
        ? 'Accès à la caméra refusé. Autorisez la caméra pour ce site dans les réglages du navigateur, puis réessayez. Ou saisissez le code du billet.'
        : nom === 'NotFoundError' ? 'Aucune caméra trouvée. Saisissez le code du billet.'
        : 'La caméra n’a pas pu démarrer. Saisissez le code du billet.')
      arreter(); return
    }
    flux.current = s
    setActif(true)
    try {
      const v = video.current
      if (v) { v.setAttribute('playsinline', ''); v.muted = true; v.srcObject = s; await v.play() }
      const lire = await decodeur()
      const boucle = async () => {
        if (!flux.current || !video.current) return
        try {
          for (const brut of await lire(video.current)) {
            const lien = lienValidation(brut)
            if (lien) { arreter(); window.location.href = lien; return }
            setMessage('Ce QR n’est pas un billet gagnant Flowin.')
          }
        } catch { /* image pas prete */ }
        window.setTimeout(boucle, 200)
      }
      boucle()
    } catch {
      setMessage('La caméra n’a pas pu démarrer. Saisissez le code du billet.')
      arreter()
    }
  }
  function arreter() {
    flux.current?.getTracks().forEach(t => t.stop())
    flux.current = null
    setActif(false)
  }

  async function chercherCode() {
    const c = code.trim().toUpperCase()
    /* Mode demo : n'importe quel code ouvre un billet Démo (public/flowin-demo.js, consulter_lot). */
    if (estDemo()) { window.location.href = `/lot.html?t=${encodeURIComponent('demo-' + (c || 'DEMO'))}`; return }
    if (c.length < 4) { setRecherche('erreur'); return }
    setRecherche('loading')
    const { data, error } = await supabase.from('tirages').select('retrait_token').eq('ticket_code', c).limit(1).maybeSingle()
    if (error) { setRecherche('erreur'); return }
    if (!data?.retrait_token) { setRecherche('introuvable'); return }
    window.location.href = `/lot.html?t=${encodeURIComponent(data.retrait_token)}`
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={H1}>Scanner un billet gagnant</h1>
      <div style={{ ...SUB, marginBottom: 14 }}>Le client présente son billet : scannez-le, vérifiez, validez la remise. Le stock se met à jour tout seul.</div>

      <div style={CARD}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Avec la caméra</div>
        {cameraDispo ? (
          <>
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: C.fond, border: `1px solid ${C.bordure}`, aspectRatio: '4 / 3', display: actif ? 'block' : 'none' }}>
              <video ref={video} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: '18%', border: `3px solid ${C.violet}`, borderRadius: 18 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: actif ? 12 : 0 }}>
              {!actif ? <button style={BTN} data-ouvrir-camera onClick={demarrer}>Ouvrir la caméra</button> : <button style={BTN2} onClick={arreter}>Arrêter</button>}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            Ouvrez l’<b>appareil photo</b> du téléphone, visez le QR du billet et touchez le lien.
          </div>
        )}
        {message && <div style={{ fontSize: 13, color: '#B45309', fontWeight: 700, marginTop: 10 }}>{message}</div>}
      </div>

      <div style={CARD}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Avec le code du billet</div>
        <div style={{ fontSize: 13, ...MUTED, marginBottom: 10 }}>Le code est imprimé sous le QR du billet.</div>
        <label style={LABEL} htmlFor="code-billet">Code du billet</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="code-billet" style={{ ...CHAMP, flex: 1, minWidth: 0, textTransform: 'uppercase', fontFamily: 'ui-monospace,Menlo,monospace' }} value={code}
            onChange={e => { setCode(e.target.value); setRecherche('idle') }} onKeyDown={e => { if (e.key === 'Enter') chercherCode() }} autoCapitalize="characters" spellCheck={false} />
          <button style={{ ...BTN, padding: '12px 20px' }} onClick={chercherCode} disabled={recherche === 'loading'}>{recherche === 'loading' ? '…' : 'Ouvrir'}</button>
        </div>
        {recherche === 'introuvable' && <div style={{ fontSize: 13, color: '#B42318', fontWeight: 700, marginTop: 8 }}>Aucun billet ne porte ce code.</div>}
        {recherche === 'erreur' && <div style={{ fontSize: 13, color: '#B42318', fontWeight: 700, marginTop: 8 }}>Vérifiez le code et réessayez.</div>}
      </div>
    </div>
  )
}
