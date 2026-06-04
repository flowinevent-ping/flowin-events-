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
const MODULE_LABEL: Record<string, string> = {
  spin: 'Roue de la chance',
  quiz: 'Quiz',
  quizsolo: 'Quiz solo',
  quizmaster: 'Quiz Master',
  tombola: 'Tombola',
  vote: 'Vote',
}

function dirUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export default function SuperEventClient({ se, lots, lieux, sponsors, focus }: Props) {
  const [open, setOpen] = useState<boolean>(!!focus)
  const [selected, setSelected] = useState<Lieu | null>(null)
  const lotsSorted = [...lots].sort((a, b) => (a.rang ?? 9) - (b.rang ?? 9))

  function selectById(id: string) {
    const l = lieux.find((x) => x.id === id)
    if (l) setSelected(l)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: 'system-ui, sans-serif', color: '#1a2030', background: '#e8eaed' }}>
      <style>{`@keyframes feSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes feFade{from{opacity:0}to{opacity:1}}`}</style>

      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <SuperEventMap lieux={lieux} mode="vitrine" height="100%" showPosition={true} onSelect={selectById} />
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
                Touche un commerce pour voir ce qu&apos;il propose. Pour jouer, rends-toi sur place et <strong>scanne son QR</strong>. Chaque commerce joué = <strong>+1 ticket/jour</strong>.
              </div>
            )}

            {lieux.map((l) => {
              const hint = l.gain_immediat ? `🎁 ${l.gain_immediat}` : '🎟️ Ticket pour le tirage'
              return (
                <div
                  key={l.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(l)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #eee', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ width: 32, height: 32, borderRadius: '50%', border: '0.5px solid #d9dbe0', color: '#5b6172', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🏪</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nom}</div>
                      <div style={{ fontSize: 11.5, color: '#7a8190', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hint}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 20, color: '#c4c8d0', flexShrink: 0 }}>›</span>
                </div>
              )
            })}

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

      {/* ===== FICHE COMMERCE (cliquable depuis liste ou pin) ===== */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            style={{ position: 'absolute', inset: 0, zIndex: 1500, background: 'rgba(15,20,35,.45)', animation: 'feFade .2s ease' }}
          />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1600, background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, boxShadow: '0 -6px 30px rgba(0,0,0,.22)', maxHeight: '80dvh', overflowY: 'auto', animation: 'feSheetUp .28s cubic-bezier(.4,0,.2,1)' }}>
            <div style={{ padding: '12px 20px 24px' }}>
              <div style={{ width: 40, height: 4, background: '#d9dbe0', borderRadius: 2, margin: '0 auto 16px' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{selected.nom}</div>
                  {selected.module && (
                    <div style={{ fontSize: 13, color: '#7a8190', marginTop: 3 }}>
                      Jeu proposé : {MODULE_LABEL[selected.module] || selected.module}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f0f1f4', color: '#5b6172', fontSize: 16, cursor: 'pointer' }}
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#9aa0ad', margin: '18px 0 8px' }}>
                Ce que tu peux gagner ici
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected.gain_immediat && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#E9F7F0', color: '#0F6E56', borderRadius: 10, padding: '11px 14px' }}>
                    <span style={{ fontSize: 18 }}>🎁</span>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>Gain immédiat</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.gain_immediat}</div>
                    </div>
                  </div>
                )}
                {selected.gain_ticket !== false && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EEF1FB', color: '#2c3a63', borderRadius: 10, padding: '11px 14px' }}>
                    <span style={{ fontSize: 18 }}>🎟️</span>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>Tirage au sort final</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>+1 ticket (1 fois par jour)</div>
                    </div>
                  </div>
                )}
              </div>

              {focus && focus.id === selected.id ? (
                <a
                  href={selected.module ? `/parcours/${selected.module}?ev=${selected.id}` : '#'}
                  style={{ display: 'block', textAlign: 'center', marginTop: 18, background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 15, padding: '14px', borderRadius: 12, textDecoration: 'none' }}
                >
                  Jouer maintenant
                </a>
              ) : (
                <>
                  <div style={{ background: '#FAF6EE', color: '#7a5a1e', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.5, margin: '18px 0 14px' }}>
                    📍 Pour jouer, rends-toi dans le commerce et <strong>scanne le QR sur place</strong>.
                  </div>
                  {typeof selected.lat === 'number' && typeof selected.lng === 'number' && (
                    <a
                      href={dirUrl(selected.lat, selected.lng)}
                      target="_blank"
                      rel="noopener"
                      style={{ display: 'block', textAlign: 'center', background: HERO, color: '#fff', fontWeight: 600, fontSize: 15, padding: '14px', borderRadius: 12, textDecoration: 'none' }}
                    >
                      Itinéraire →
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  )
}
