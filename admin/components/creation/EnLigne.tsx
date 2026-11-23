'use client'

/**
 * ECRAN FINAL « C'est en ligne » du Configurateur (lot ergonomie 1, 23/11/2026, AMEL-VIS-02).
 * Un moment de satisfaction (coche animee + confettis legers, CSS seul, coupes si l'appareil demande moins
 * de mouvement), le QR en grand, l'affiche A4 en un geste, le partage en un geste, puis l'espace pro.
 * Aucune ecriture : le composant ne fait que montrer les QR deja crees par le Configurateur.
 */
import { useEffect, useState } from 'react'
import { VERT_OK, VERT_OK_FOND, CHARTE_PRO as C } from '@/lib/charte'
import { BTN, BTN2, MUTED } from '@/lib/proui'
import { qrFlowinPng, qrFlowinSvg } from '@/lib/qrLogo'
import { ouvrirAfficheA4 } from '@/lib/afficheQr'

export type QrFin = { nom: string; support: string; code: string | null; url: string }

const BLEU = '#3B5CC4'
const CONFETTIS = [
  { l: 6, c: BLEU, dx: -30, r: 200, t: 1.9, d: 0.0, w: 8 }, { l: 14, c: '#7FA1F0', dx: 24, r: -240, t: 2.3, d: 0.1, w: 7 },
  { l: 22, c: VERT_OK, dx: -18, r: 320, t: 2.1, d: 0.25, w: 9 }, { l: 30, c: '#F5A100', dx: 30, r: -180, t: 2.5, d: 0.05, w: 7 },
  { l: 38, c: BLEU, dx: -26, r: 260, t: 2.0, d: 0.35, w: 8 }, { l: 46, c: '#7FA1F0', dx: 18, r: -300, t: 2.4, d: 0.15, w: 9 },
  { l: 54, c: VERT_OK, dx: 28, r: 220, t: 1.8, d: 0.3, w: 7 }, { l: 62, c: '#F5A100', dx: -22, r: -260, t: 2.2, d: 0.0, w: 8 },
  { l: 70, c: BLEU, dx: 20, r: 340, t: 2.3, d: 0.2, w: 9 }, { l: 78, c: '#7FA1F0', dx: -28, r: -200, t: 1.9, d: 0.4, w: 7 },
  { l: 86, c: VERT_OK, dx: 24, r: 280, t: 2.5, d: 0.1, w: 8 }, { l: 93, c: '#F5A100', dx: -16, r: -320, t: 2.1, d: 0.3, w: 9 },
  { l: 10, c: '#F5A100', dx: 14, r: 180, t: 2.6, d: 0.5, w: 6 }, { l: 26, c: BLEU, dx: -12, r: -220, t: 2.2, d: 0.55, w: 6 },
  { l: 42, c: '#7FA1F0', dx: 22, r: 300, t: 2.4, d: 0.45, w: 7 }, { l: 58, c: VERT_OK, dx: -20, r: -280, t: 2.0, d: 0.6, w: 6 },
  { l: 74, c: BLEU, dx: 16, r: 240, t: 2.3, d: 0.5, w: 7 }, { l: 90, c: '#7FA1F0', dx: -14, r: -190, t: 2.5, d: 0.65, w: 6 },
]

/** Coche animee + confettis : reutilisable (Configurateur avec ou sans paiement). */
export function Celebration() {
  return (
    <div data-celebration style={{ position: 'relative', height: 74, marginBottom: 6 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes enl-pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.14);opacity:1}100%{transform:scale(1)}}
        @keyframes enl-trait{from{stroke-dashoffset:34}to{stroke-dashoffset:0}}
        @keyframes enl-chute{0%{transform:translate3d(0,-10px,0) rotate(0);opacity:1}85%{opacity:1}100%{transform:translate3d(var(--dx),230px,0) rotate(var(--r));opacity:0}}
        @keyframes enl-halo{0%{transform:scale(.7);opacity:.55}100%{transform:scale(1.8);opacity:0}}
        .enl-coche{animation:enl-pop .55s cubic-bezier(.2,.9,.3,1.3) both}
        .enl-trait{stroke-dasharray:34;animation:enl-trait .45s .3s ease-out both}
        .enl-halo{animation:enl-halo 1.2s .2s ease-out both}
        .enl-conf i{position:absolute;top:0;display:block;border-radius:2px;animation:enl-chute var(--t) var(--d) cubic-bezier(.25,.5,.5,1) both}
        @media (prefers-reduced-motion:reduce){.enl-conf{display:none}.enl-coche,.enl-trait,.enl-halo{animation:none!important}.enl-trait{stroke-dashoffset:0}}
      ` }} />
      <div className="enl-conf" aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 230, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
        {CONFETTIS.map((p, k) => (
          <i key={k} style={{ left: `${p.l}%`, width: p.w, height: p.w * 1.5, background: p.c, ['--dx' as string]: `${p.dx}px`, ['--r' as string]: `${p.r}deg`, ['--t' as string]: `${p.t}s`, ['--d' as string]: `${p.d}s` }} />
        ))}
      </div>
      <div style={{ position: 'relative', width: 66, height: 66, margin: '4px auto 0' }}>
        <span className="enl-halo" aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 99, background: VERT_OK_FOND }} />
        <span className="enl-coche" role="img" aria-label="Fait" style={{ position: 'absolute', inset: 0, borderRadius: 99, background: VERT_OK_FOND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={VERT_OK} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path className="enl-trait" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
      </div>
    </div>
  )
}

export default function EnLigne({ commerce, qrs, lienEspace, info, quizFlowin }: { commerce: string; qrs: QrFin[]; lienEspace: string; info: string; quizFlowin: boolean }) {
  const [k, setK] = useState(0)
  const sel = qrs[Math.min(k, qrs.length - 1)]
  const [png, setPng] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!sel) return
    let vivant = true
    setPng('')
    qrFlowinPng(sel.url, 640).then(s => { if (vivant) setPng(s) }, () => { if (vivant) setMsg('Le QR n’a pas pu être affiché.') })
    return () => { vivant = false }
  }, [sel?.url]) // eslint-disable-line react-hooks/exhaustive-deps

  async function affiche() {
    if (!sel) return
    setMsg('')
    try {
      const svg = await qrFlowinSvg(sel.url, 1024)
      const e = ouvrirAfficheA4({ svg, url: sel.url, titre: commerce, sousTitre: 'Scannez pour jouer', qrNom: sel.nom, support: sel.support, code: sel.code })
      if (e) setMsg(e)
    } catch { setMsg('L’affiche n’a pas pu être créée.') }
  }
  async function partager() {
    if (!sel) return
    setMsg('')
    const texte = `Jouez et gagnez chez ${commerce} !`
    try {
      if (typeof navigator !== 'undefined' && navigator.share) { await navigator.share({ title: commerce, text: texte, url: sel.url }); return }
    } catch (e) { if ((e as { name?: string })?.name === 'AbortError') return }
    try { await navigator.clipboard.writeText(sel.url); setMsg('Lien copié.') } catch { setMsg(sel.url) }
  }

  return (
    <div data-ecran="valide" style={{ textAlign: 'center' }}>
      <Celebration />
      <div style={{ fontSize: 22, fontWeight: 900 }}>C’est en ligne</div>
      <div style={{ fontSize: 13.5, ...MUTED, marginTop: 4 }}>Vos clients peuvent jouer.{quizFlowin ? ' Votre quiz : retour sous 72 h.' : ''}</div>
      {sel && (
        <div data-qr-fin style={{ marginTop: 12 }}>
          <div style={{ width: 188, height: 188, margin: '0 auto', display: 'grid', placeItems: 'center', background: '#fff', border: `1.5px solid ${C.bordure}`, borderRadius: 16, padding: 8, boxSizing: 'border-box' }}>
            {png ? <img src={png} alt={`QR du jeu : ${sel.nom}`} style={{ width: '100%', height: '100%' }} /> : <span style={{ fontSize: 13, ...MUTED }}>…</span>}
          </div>
          {qrs.length > 1
            ? (
              <div role="group" aria-label="Choisir le QR" style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                {qrs.map((q, i) => (
                  <button key={q.url} type="button" data-qr-choix={i} onClick={() => setK(i)} aria-pressed={i === k}
                    style={{ minHeight: 44, padding: '0 14px', borderRadius: 99, border: `1.5px solid ${i === k ? BLEU : C.bordureChamp}`, background: i === k ? BLEU : '#fff', color: i === k ? '#fff' : C.texte, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{q.nom}</button>
                ))}
              </div>
            )
            : <div style={{ fontSize: 13, ...MUTED, marginTop: 6 }}>{sel.nom}</div>}
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <button type="button" data-affiche style={{ ...BTN, minHeight: 48 }} onClick={affiche}>Imprimer l’affiche A4</button>
            <button type="button" data-partager style={{ ...BTN2, minHeight: 48 }} onClick={partager}>Partager</button>
          </div>
        </div>
      )}
      {msg && <div role="status" style={{ fontSize: 13, color: msg === 'Lien copié.' ? VERT_OK : '#B45309', fontWeight: 700, marginTop: 8 }}>{msg}</div>}
      {info && <div style={{ fontSize: 13, color: '#B45309', fontWeight: 700, marginTop: 8 }}>{info}</div>}
      <a data-espace href={lienEspace} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 8, fontSize: 14.5, fontWeight: 800, color: BLEU, textDecoration: 'none' }}>Mon espace pro</a>
    </div>
  )
}
