'use client'
import { useState } from 'react'
import SuperEventMap, { Lieu } from '../_components/SuperEventMap'

type SE = { id: string; nom: string; description?: string | null; date_d?: string | null; date_f?: string | null }
type Lot = { id: string; rang: number | null; valeur: number | null; libelle?: string | null }
type Sponsor = { id: string; nom: string; image_url?: string | null }
type FocusEvent = { id: string; nom: string; module?: string | null; gain_immediat?: string | null }

interface Props {
  se: SE
  lots: Lot[]
  lieux: Lieu[]
  sponsors: Sponsor[]
  focus?: FocusEvent | null
}

const HERO = '#3B5CC4'
const LOT_THEME = [
  { fg: '#854F0B', bg: '#FAEEDA' },
  { fg: '#5F5E5A', bg: '#F1EFE8' },
  { fg: '#712B13', bg: '#FAECE7' },
]

function dirUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export default function SuperEventClient({ se, lots, lieux, sponsors, focus }: Props) {
  const [open, setOpen] = useState<boolean>(!!focus)
  const lotsSorted = [...lots].sort((a, b) => (a.rang ?? 9) - (b.rang ?? 9))

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: 'system-ui, sans-serif', color: '#1a2030', background: '#e8eaed' }}>

      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <SuperEventMap lieux={lieux} mode="vitrine" height="100%" showPosition={true} />
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: '12px 14px', pointerEvents: 'none' }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.96)', boxShadow: '0 2px 10px rgba(0,0,0,.12)', borderRadius: 12, padding: '8px 12px', maxWidth: '82%', pointerEvents: 'auto' }}>
          <div style={{ fontSize: 11, color: HERO, fontWeight: 600 }}>Flowin · Super Event</div>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{se.nom}</div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, boxShadow: '0 -4px 24px rgba(0,0,0,.16)', maxHeight: open ? '64dvh' : undefined, overflowY: open ? 'auto' : 'visible' }}>

        <button
          onClick={() => setOpen((o) => !o)}
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: '10px 18px 12px', display: 'block', textAlign: 'left' }}
          aria-expanded={open}
        >
          <div style={{ width: 40, height: 4, background: '#d9dbe0', borderRadius: 2, margin: '0 auto 11px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>🏪 {lieux.length} commerces participants</span>
            <span style={{ fontSize: 16, color: '#8a8f9c' }}>{open ? '▾' : '▴'}</span>
          </div>
        </button>

        {open && (
          <div style={{ padding: '2px 18px 24px' }}>

            {focus && (
              <div style={{ background: '#0F6E56', color: '#fff', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Tu es chez</div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{focus.nom}</div>
                </div>
                <a href={focus.module ? `/parcours/${focus.module}?ev=${focus.id}` : '#'} style={{ background: '#fff', color: '#0F6E56', fontWeight: 600, fontSize: 14, padding: '10px 16px', borderRadius: 10, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Jouer maintenant
                </a>
              </div>
            )}

            {lotsSorted.length > 0 && (
              <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
                {lotsSorted.map((l, i) => {
                  const th = LOT_THEME[i] || LOT_THEME[2]
                  return (
                    <span key={l.id} style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: th.fg, background: th.bg, padding: '8px 4px', borderRadius: 7 }}>
                      {l.valeur ? `${l.valeur} €` : (l.libelle || '')}
                    </span>
                  )
                })}
              </div>
            )}

            {!focus && (
              <div style={{ background: '#EEF1FB', color: '#2c3a63', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.5, marginBottom: 14 }}>
                Rends-toi dans un commerce et <strong>scanne son QR</strong> sur place pour jouer. Chaque commerce joué = <strong>+1 ticket/jour</strong>.
              </div>
            )}

            {lieux.map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '0.5px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', border: '0.5px solid #d9dbe0', color: '#5b6172', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🏪</span>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{l.nom}</div>
                </div>
                {typeof l.lat === 'number' && typeof l.lng === 'number' && (
                  <a href={dirUrl(l.lat, l.lng)} target="_blank" rel="noopener" style={{ fontSize: 13, color: HERO, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Itinéraire →
                  </a>
                )}
              </div>
            ))}

            {sponsors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: '#8a8f9c', marginBottom: 8 }}>Avec le soutien de</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sponsors.map((s) => (
                    <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #e3e5ea', padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>
                      {s.image_url ? <img src={s.image_url} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> : '🏢'} {s.nom}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  )
}
