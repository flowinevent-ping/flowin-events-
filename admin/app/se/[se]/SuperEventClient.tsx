'use client'
import { useRef } from 'react'
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

function fmtDate(d?: string | null): string {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function SuperEventClient({ se, lots, lieux, sponsors, focus }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const playMode = !!focus
  const lotsSorted = [...lots].sort((a, b) => (a.rang ?? 9) - (b.rang ?? 9))
  const period = se.date_d && se.date_f ? `du ${fmtDate(se.date_d)} au ${fmtDate(se.date_f)}` : ''

  const scrollToMap = () => mapRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg, #f5f6f8)', fontFamily: 'system-ui, sans-serif', color: '#1a2030' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', background: '#fff', minHeight: '100dvh' }}>

        {focus && (
          <div style={{ background: '#0F6E56', color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Tu es chez</div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{focus.nom}</div>
            </div>
            <a
              href={focus.module ? `/parcours/${focus.module}?ev=${focus.id}` : '#'}
              style={{ background: '#fff', color: '#0F6E56', fontWeight: 600, fontSize: 14, padding: '10px 16px', borderRadius: 10, textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              Jouer maintenant
            </a>
          </div>
        )}

        <div style={{ background: HERO, color: '#fff', padding: '22px 20px 24px' }}>
          <div style={{ fontSize: 12, opacity: 0.9, letterSpacing: 0.3 }}>Flowin · Super Event</div>
          <div style={{ fontSize: 24, fontWeight: 600, marginTop: 10, lineHeight: 1.2 }}>{se.nom}</div>
          <div style={{ fontSize: 14, opacity: 0.92, marginTop: 8, lineHeight: 1.45 }}>
            Joue, gagne, et fais le tour des commerces participants&nbsp;!
          </div>
          {period && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>{period}</div>}
        </div>

        <div style={{ padding: '18px 20px' }}>
          {lotsSorted.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: '#8a8f9c', marginBottom: 9, letterSpacing: 0.5 }}>À GAGNER AU TIRAGE FINAL</div>
              <div style={{ display: 'flex', gap: 7 }}>
                {lotsSorted.map((l, i) => {
                  const th = LOT_THEME[i] || LOT_THEME[2]
                  return (
                    <span key={l.id} style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: th.fg, background: th.bg, padding: '8px 4px', borderRadius: 7 }}>
                      {l.valeur ? `${l.valeur} €` : (l.libelle || '')}
                    </span>
                  )
                })}
              </div>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '16px 0', fontSize: 12, color: '#5b6172', flexWrap: 'wrap' }}>
            <span>🏪 {lieux.length} commerces</span>
            <span>🎟️ 1 ticket/jour/lieu</span>
          </div>

          {!playMode && (
            <button
              onClick={scrollToMap}
              style={{ width: '100%', border: 'none', background: HERO, color: '#fff', fontSize: 15, fontWeight: 600, padding: 12, borderRadius: 10, cursor: 'pointer' }}
            >
              Voir les commerces participants
            </button>
          )}

          <div ref={mapRef} style={{ marginTop: 16 }}>
            <SuperEventMap lieux={lieux} mode="vitrine" height={340} showPosition={false} />
          </div>

          {sponsors.length > 0 && (
            <div style={{ marginTop: 18 }}>
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

          <div style={{ marginTop: 14, fontSize: 11, color: '#9aa0ad', textAlign: 'center', lineHeight: 1.5 }}>
            Inscription en 30 s la première fois, puis reconnu automatiquement.
          </div>
        </div>

      </div>
    </div>
  )
}
