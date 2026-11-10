'use client'

/**
 * PICTOGRAMMES DES SUPPORTS DE COMMUNICATION + EGALISEUR DES FLASHS PAR QR.
 *
 * Langage visuel repris des premieres animations Flowin que Romain a validees
 * (marketing/animations, s3-v4 « CHAQUE PUB, MESURÉE. » : K4.bus / K4.pubReseau /
 * K4.grandeJauge, commit 82fd61af ; s3-v7 « CHAQUE SUPPORT, MESURÉ. » :
 * l'égaliseur, cadres blancs arrondis cernés d'encre, barre pleine à l'intérieur,
 * pilule « TOP », commit ed294f07). Ici en charte actuelle : encre #1B3A5C,
 * bleu #3B5CC4, orange #C2410C (jamais de violet).
 */
import { useEffect, useState, type CSSProperties } from 'react'
import type { StatQr } from '@/lib/qrTraces'
import { pictoDuSupport, fetchStatsQr } from '@/lib/qrTraces'
import { supabase } from '@/lib/supabase'

const INK = '#1B3A5C'
const BLEU = '#3B5CC4'
const ORANGE = '#C2410C'
const MUT = '#64748B'

/** Pictogramme d'un support (cle : voir SUPPORTS_QR.p). */
export function PictoSupport({ k, taille = 36 }: { k: string; taille?: number }) {
  const sw = 2.4
  let g: JSX.Element
  switch (k) {
    case 'bus': g = (<>
      <rect x="6" y="5" width="36" height="34" rx="6" fill="#F5B841" stroke={INK} strokeWidth={sw} />
      <rect x="10" y="9" width="28" height="9" rx="2" fill={INK} />
      <rect x="10" y="21" width="28" height="11" rx="2" fill="#fff" />
      <rect x="27" y="22.5" width="8" height="8" rx="1" fill={INK} />
      <path d="M12 25h11M12 28.5h8" stroke={BLEU} strokeWidth="2" strokeLinecap="round" />
      <rect x="9" y="39" width="7" height="5" rx="1.5" fill={INK} /><rect x="32" y="39" width="7" height="5" rx="1.5" fill={INK} />
      <circle cx="12" cy="35.5" r="1.6" fill="#fff" /><circle cx="36" cy="35.5" r="1.6" fill="#fff" />
    </>); break
    case 'instagram': g = (<>
      <rect x="7" y="7" width="34" height="34" rx="10" fill={ORANGE} stroke={INK} strokeWidth={sw} />
      <circle cx="24" cy="24" r="8" fill="none" stroke="#fff" strokeWidth="3.2" />
      <circle cx="33.5" cy="14.5" r="2.2" fill="#fff" />
    </>); break
    case 'facebook': g = (<>
      <circle cx="24" cy="24" r="17" fill={BLEU} stroke={INK} strokeWidth={sw} />
      <path d="M26.5 41V27h4.4l.7-5h-5.1v-3c0-1.5.5-2.5 2.6-2.5h2.7v-4.4c-.5-.1-2-.2-3.8-.2-3.8 0-6.3 2.3-6.3 6.5V22h-4.3v5h4.3v14" fill="#fff" />
    </>); break
    case 'tiktok': g = (<>
      <rect x="7" y="7" width="34" height="34" rx="9" fill={INK} />
      <path d="M27 12v15.5a5 5 0 1 1-5-5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M27 12c.6 3.6 3 6 6.5 6.4" fill="none" stroke={ORANGE} strokeWidth="3.2" strokeLinecap="round" />
    </>); break
    case 'affiche': g = (<>
      <rect x="10" y="5" width="28" height="38" rx="3" fill="#fff" stroke={INK} strokeWidth={sw} />
      <rect x="14" y="9" width="20" height="12" rx="2" fill={ORANGE} />
      <path d="M14 26h20M14 30h14" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <rect x="25" y="32" width="8" height="8" rx="1" fill={INK} />
    </>); break
    case 'flyer': g = (<>
      <rect x="12" y="10" width="24" height="32" rx="3" fill="#fff" stroke={INK} strokeWidth={sw} transform="rotate(8 24 26)" />
      <rect x="9" y="7" width="24" height="32" rx="3" fill="#EEF2FB" stroke={INK} strokeWidth={sw} transform="rotate(-6 21 23)" />
      <path d="M14 15h14M14 19h10" stroke={BLEU} strokeWidth="2.4" strokeLinecap="round" transform="rotate(-6 21 23)" />
      <rect x="21" y="26" width="7" height="7" rx="1" fill={INK} transform="rotate(-6 21 23)" />
    </>); break
    case 'ticket': g = (<>
      <path d="M12 5h24v36l-3-2.5-3 2.5-3-2.5-3 2.5-3-2.5-3 2.5-3-2.5-3 2.5z" fill="#fff" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M16 12h16M16 16h11M16 20h16" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <rect x="18" y="25" width="10" height="10" rx="1.2" fill={BLEU} />
    </>); break
    case 'vitrine': g = (<>
      <path d="M6 14l4-8h28l4 8z" fill={ORANGE} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M6 14c0 3 4 3 4 0 0 3 5 3 5 0 0 3 4.5 3 4.5 0 0 3 5 3 5 0 0 3 4.5 3 4.5 0 0 3 5 3 5 0 0 3 4 3 4 0" fill="#fff" stroke={INK} strokeWidth="1.8" />
      <rect x="8" y="18" width="32" height="24" rx="2" fill="#fff" stroke={INK} strokeWidth={sw} />
      <rect x="12" y="22" width="14" height="12" rx="1.5" fill="#DCE6F7" stroke={INK} strokeWidth="1.6" />
      <rect x="29" y="22" width="8" height="20" rx="1" fill={BLEU} />
    </>); break
    case 'site': g = (<>
      <rect x="5" y="9" width="38" height="28" rx="4" fill="#fff" stroke={INK} strokeWidth={sw} />
      <path d="M5 16h38" stroke={INK} strokeWidth={sw} />
      <circle cx="10" cy="12.5" r="1.4" fill={ORANGE} /><circle cx="14.5" cy="12.5" r="1.4" fill={BLEU} />
      <rect x="10" y="20" width="16" height="12" rx="2" fill={BLEU} />
      <path d="M30 22h8M30 26h8M30 30h5" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>); break
    case 'presse': g = (<>
      <rect x="6" y="8" width="32" height="32" rx="3" fill="#fff" stroke={INK} strokeWidth={sw} />
      <path d="M38 16h4v20a4 4 0 0 1-4 4" fill="none" stroke={INK} strokeWidth={sw} />
      <rect x="10" y="12" width="24" height="6" rx="1" fill={INK} />
      <rect x="10" y="22" width="11" height="10" rx="1" fill={ORANGE} />
      <path d="M24 23h10M24 27h10M24 31h7M10 36h24" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </>); break
    case 'radio': g = (<>
      <path d="M12 14L34 6" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
      <rect x="5" y="14" width="38" height="26" rx="5" fill={BLEU} stroke={INK} strokeWidth={sw} />
      <circle cx="16" cy="27" r="7" fill="#fff" stroke={INK} strokeWidth="1.8" /><circle cx="16" cy="27" r="2.5" fill={INK} />
      <path d="M28 21h10M28 26h10M28 31h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </>); break
    default: g = (<>
      <rect x="8" y="8" width="32" height="32" rx="6" fill="#fff" stroke={INK} strokeWidth={sw} />
      <rect x="13" y="13" width="9" height="9" rx="1.5" fill={INK} /><rect x="26" y="13" width="9" height="9" rx="1.5" fill={INK} />
      <rect x="13" y="26" width="9" height="9" rx="1.5" fill={INK} /><rect x="27" y="27" width="4" height="4" fill={BLEU} /><rect x="31" y="31" width="4" height="4" fill={ORANGE} />
    </>)
  }
  return <svg data-picto={k} width={taille} height={taille} viewBox="0 0 48 48" aria-hidden="true" style={{ display: 'block', flex: '0 0 auto' }}>{g}</svg>
}

/** Pictogramme d'un QR d'apres son support (ou, a defaut, son slug). */
export function PictoQr({ support, source, taille }: { support?: string | null; source?: string | null; taille?: number }) {
  return <PictoSupport k={pictoDuSupport(support, source)} taille={taille} />
}

/** Nom court sous une barre. */
function court(s: string) { return s.length > 26 ? s.slice(0, 25) + '…' : s }

/**
 * Egaliseur des flashs par QR (barres verticales), pictogramme + intitulé sous chaque barre,
 * parties et joueurs sous le chiffre ; pilule « TOP » sur le meilleur support et phrase
 * « Le plus de flashs : <intitulé> ». Defile horizontalement si beaucoup de QR (pas de page longue).
 */
export function EgaliseurQr({ lignes, titre = 'Flashs par support', compact = false }: { lignes: StatQr[]; titre?: string | null; compact?: boolean }) {
  const l = lignes.filter(x => x.source).slice().sort((a, b) => b.flashs - a.flashs)
  const H = compact ? 120 : 160
  if (!l.length) return <div style={{ fontSize: 13, color: MUT }}>Pas encore de flash sur vos QR.</div>
  const max = Math.max(1, ...l.map(x => x.flashs))
  const top = l[0].flashs > 0 ? l[0] : null
  const col: CSSProperties = { flex: '0 0 auto', width: compact ? 78 : 92, display: 'flex', flexDirection: 'column', alignItems: 'center' }
  return (
    <div data-egaliseur-qr>
      {titre && <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{titre}</div>}
      {top && <div data-top-support style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 8 }}>Le plus de flashs : <span style={{ color: ORANGE }}>{top.nom}</span></div>}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'thin' }}>
        {l.map((x, i) => {
          const h = Math.max(6, (x.flashs / max) * (H - 12))
          const estTop = !!top && i === 0
          return (
            <div key={x.source} style={col} data-barre={x.source} title={`${x.nom} : ${x.flashs} flashs, ${x.parties} parties, ${x.joueurs} joueurs`}>
              <div style={{ fontSize: 17, fontWeight: 900, color: estTop ? ORANGE : INK, lineHeight: 1 }}>{x.flashs}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUT, marginBottom: 4 }}>flashs</div>
              <div style={{ position: 'relative', width: compact ? 46 : 54, height: H, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 14, boxSizing: 'border-box' }}>
                {estTop && <span style={{ position: 'absolute', top: 6, zIndex: 1, left: '50%', transform: 'translateX(-50%)', background: INK, color: '#fff', fontSize: 9.5, fontWeight: 900, letterSpacing: '.06em', borderRadius: 99, padding: '2px 7px' }}>TOP</span>}
                <div style={{ position: 'absolute', left: 4, right: 4, bottom: 4, height: Math.max(0, h - 8), background: estTop ? ORANGE : BLEU, borderRadius: 9 }} />
              </div>
              <div style={{ marginTop: 6 }}><PictoQr support={x.support} source={x.source} taille={compact ? 30 : 36} /></div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: INK, textAlign: 'center', lineHeight: 1.2, marginTop: 3, minHeight: 28 }}>{court(x.nom)}</div>
              <div style={{ fontSize: 10.5, color: MUT, textAlign: 'center' }}>{x.parties} parties · {x.joueurs} joueurs</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Egaliseur qui charge lui-meme les chiffres (RPC stats_qr_evenement + qr_stations). */
export function EgaliseurQrEvents({ eventIds, titre, compact, cadre = true }: { eventIds: string[]; titre?: string | null; compact?: boolean; cadre?: boolean }) {
  const [lignes, setLignes] = useState<StatQr[] | null>(null)
  const cle = eventIds.join(',')
  useEffect(() => {
    let vivant = true
    setLignes(null)
    fetchStatsQr(eventIds).then(r => { if (vivant) setLignes(r) })
    return () => { vivant = false }
  }, [cle]) // eslint-disable-line react-hooks/exhaustive-deps
  const corps = lignes === null ? <div style={{ fontSize: 13, color: MUT }}>Chargement des flashs par QR…</div> : <EgaliseurQr lignes={lignes} titre={titre} compact={compact} />
  if (!cadre) return corps
  return <div data-egaliseur-cadre style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 14, margin: '10px 0' }}>{corps}</div>
}

/** Super admin : egaliseur de toutes les stations d'un super event. */
export function EgaliseurQrSuperEvent({ superEventId, titre = 'Flashs par support (QR tracés)' }: { superEventId: string; titre?: string | null }) {
  const [ids, setIds] = useState<string[] | null>(null)
  useEffect(() => {
    let vivant = true
    setIds(null)
    supabase.from('events').select('id').eq('super_event_id', superEventId).then(({ data }) => {
      if (vivant) setIds(((data ?? []) as { id: string }[]).map(e => e.id))
    })
    return () => { vivant = false }
  }, [superEventId])
  if (!ids) return null
  return <EgaliseurQrEvents eventIds={ids} titre={titre} />
}
