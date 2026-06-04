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

type ModUI = { label: string; emoji: string; grad: string; accent: string; soft: string }
const MODULE_UI: Record<string, ModUI> = {
  spin: { label: 'Roue de la chance', emoji: '🎡', grad: 'linear-gradient(135deg,#F59E0B,#EA580C)', accent: '#C2410C', soft: '#FDF1E3' },
  quiz: { label: 'Quiz', emoji: '🧠', grad: 'linear-gradient(135deg,#3B5CC4,#2DA8FF)', accent: '#2746A6', soft: '#EAF0FF' },
  quizsolo: { label: 'Quiz solo', emoji: '🎯', grad: 'linear-gradient(135deg,#0EA5A4,#0891B2)', accent: '#0E7490', soft: '#E5F7F7' },
  quizmaster: { label: 'Quiz Master', emoji: '👑', grad: 'linear-gradient(135deg,#4F46E5,#3B5CC4)', accent: '#4338CA', soft: '#ECEBFE' },
  tombola: { label: 'Tombola', emoji: '🎟️', grad: 'linear-gradient(135deg,#E11D48,#9F1239)', accent: '#BE123C', soft: '#FCE7EC' },
  vote: { label: 'Vote', emoji: '⭐', grad: 'linear-gradient(135deg,#0EA5A4,#3B5CC4)', accent: '#0E7490', soft: '#E5F7F7' },
}
function modUI(m?: string | null): ModUI {
  return (m && MODULE_UI[m]) || { label: m || 'Jeu', emoji: '🎮', grad: `linear-gradient(135deg,${HERO},#2DA8FF)`, accent: '#2746A6', soft: '#EAF0FF' }
}

const PODIUM = [
  { medal: '🥇', grad: 'linear-gradient(135deg,#FFE08A,#F59E0B)', fg: '#7A4A06', glow: 'rgba(245,158,11,.5)' },
  { medal: '🥈', grad: 'linear-gradient(135deg,#EDF0F4,#B9C0CA)', fg: '#454C59', glow: 'rgba(150,160,175,.4)' },
  { medal: '🥉', grad: 'linear-gradient(135deg,#E8B07A,#C8743C)', fg: '#5A2F10', glow: 'rgba(200,116,60,.4)' },
]

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

  const fu = selected ? modUI(selected.module) : null

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: 'system-ui, sans-serif', color: '#141a26', background: '#e8eaed' }}>
      <style>{`
        @keyframes feSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes feFade{from{opacity:0}to{opacity:1}}
        @keyframes feRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.35}}
        @keyframes feGlow{0%,100%{box-shadow:0 3px 12px var(--g)}50%{box-shadow:0 3px 22px var(--g)}}
        .fe-card{animation:feRise .32s ease both}
      `}</style>

      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <SuperEventMap lieux={lieux} mode="vitrine" height="100%" showPosition={true} onSelect={selectById} />
      </div>

      {/* Bannière de quête */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: '12px 14px', pointerEvents: 'none' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11, background: 'linear-gradient(135deg,#2746A6,#3B7DE0)', color: '#fff', boxShadow: '0 4px 18px rgba(39,70,166,.4)', borderRadius: 14, padding: '9px 14px', maxWidth: '88%', pointerEvents: 'auto' }}>
          <span style={{ position: 'relative', width: 9, height: 9, flexShrink: 0 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ADE80' }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ADE80', animation: 'fePulse 1.8s ease-in-out infinite' }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{se.nom}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Joue sur place · gagne des lots 🎁</div>
          </div>
        </div>
      </div>

      {/* Onglet bottom-sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, boxShadow: '0 -4px 24px rgba(0,0,0,.18)', maxHeight: open ? '66dvh' : undefined, overflowY: open ? 'auto' : 'visible' }}>

        <button
          onClick={() => setOpen((o) => !o)}
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: '10px 18px 12px', display: 'block', textAlign: 'left' }}
          aria-expanded={open}
        >
          <div style={{ width: 42, height: 5, background: '#dcdfe6', borderRadius: 3, margin: '0 auto 11px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>🎮 {lieux.length} commerces à découvrir</span>
            <span style={{ fontSize: 16, color: '#9aa0ad' }}>{open ? '▾' : '▴'}</span>
          </div>
        </button>

        {open && (
          <div style={{ padding: '2px 18px 24px' }}>

            {focus && (
              <div className="fe-card" style={{ background: 'linear-gradient(135deg,#0F9E73,#0B6E50)', color: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, boxShadow: '0 4px 16px rgba(15,158,115,.35)' }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Tu es chez</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{focus.nom}</div>
                </div>
                <a href={focus.module ? `/parcours/${focus.module}?ev=${focus.id}` : '#'} style={{ background: '#fff', color: '#0B6E50', fontWeight: 700, fontSize: 14, padding: '11px 18px', borderRadius: 11, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Jouer ▸
                </a>
              </div>
            )}

            {/* Podium des lots */}
            {lotsSorted.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#9aa0ad', textTransform: 'uppercase', marginBottom: 9, textAlign: 'center' }}>🏆 À gagner au tirage</div>
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end' }}>
                  {lotsSorted.slice(0, 3).map((l, i) => {
                    const p = PODIUM[i] || PODIUM[2]
                    const tall = i === 0
                    return (
                      <div
                        key={l.id}
                        className="fe-card"
                        style={{ flex: 1, background: p.grad, color: p.fg, borderRadius: 13, padding: tall ? '14px 6px' : '11px 6px', textAlign: 'center', ...(i === 0 ? { ['--g' as string]: p.glow, animation: 'feGlow 2.4s ease-in-out infinite, feRise .32s ease both' } : {}) }}
                      >
                        <div style={{ fontSize: tall ? 24 : 20, lineHeight: 1 }}>{p.medal}</div>
                        <div style={{ fontSize: tall ? 20 : 17, fontWeight: 800, marginTop: 4 }}>{l.valeur ? `${l.valeur} €` : ''}</div>
                        {l.libelle && <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1 }}>{l.libelle}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!focus && (
              <div style={{ display: 'flex', gap: 10, background: '#EFF3FE', borderRadius: 12, padding: '11px 13px', marginBottom: 16, alignItems: 'center' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🎟️</span>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#2c3a63' }}>
                  Chaque commerce joué = <strong>+1 ticket/jour</strong> pour le tirage. Touche un commerce pour voir son jeu, puis <strong>scanne le QR sur place</strong>.
                </div>
              </div>
            )}

            {/* Cartes commerce */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {lieux.map((l, idx) => {
                const u = modUI(l.module)
                const hint = l.gain_immediat ? `🎁 ${l.gain_immediat}` : '🎟️ Ticket pour le tirage'
                return (
                  <div
                    key={l.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(l)}
                    className="fe-card"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 14, background: '#fff', border: '1px solid #eef0f3', boxShadow: '0 1px 6px rgba(20,26,38,.05)', cursor: 'pointer', animationDelay: `${Math.min(idx * 35, 280)}ms` }}
                  >
                    <span style={{ width: 42, height: 42, borderRadius: 12, background: u.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0, boxShadow: '0 2px 8px rgba(20,26,38,.12)' }}>{u.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nom}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: u.accent, background: u.soft, padding: '2px 7px', borderRadius: 100 }}>{u.label}</span>
                        <span style={{ fontSize: 11.5, color: '#7a8190', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hint}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 22, color: '#c4c8d0', flexShrink: 0 }}>›</span>
                  </div>
                )
              })}
            </div>

            {sponsors.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 11, color: '#9aa0ad', marginBottom: 8 }}>Avec le soutien de</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sponsors.map((s) => (
                    <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e3e5ea', padding: '5px 10px', borderRadius: 9, fontSize: 12, fontWeight: 500 }}>
                      {s.image_url ? <img src={s.image_url} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> : '🏢'} {s.nom}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ===== FICHE COMMERCE ===== */}
      {selected && fu && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'absolute', inset: 0, zIndex: 1500, background: 'rgba(15,20,35,.5)', animation: 'feFade .2s ease' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1600, background: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, boxShadow: '0 -6px 30px rgba(0,0,0,.25)', maxHeight: '84dvh', overflowY: 'auto', animation: 'feSheetUp .3s cubic-bezier(.4,0,.2,1)' }}>

            {/* Hero coloré par jeu */}
            <div style={{ background: fu.grad, color: '#fff', padding: '20px 20px 22px', borderTopLeftRadius: 22, borderTopRightRadius: 22, position: 'relative' }}>
              <div style={{ width: 42, height: 5, background: 'rgba(255,255,255,.5)', borderRadius: 3, margin: '0 auto 16px' }} />
              <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 14, right: 16, width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 16, cursor: 'pointer' }} aria-label="Fermer">✕</button>
              <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 8 }}>{fu.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>{selected.nom}</div>
              <div style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,.22)', padding: '4px 11px', borderRadius: 100 }}>{fu.label}</div>
            </div>

            <div style={{ padding: '18px 20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#9aa0ad', marginBottom: 9 }}>Ce que tu peux gagner ici</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected.gain_immediat && (
                  <div className="fe-card" style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#E9F7F0', color: '#0B6E50', borderRadius: 12, padding: '12px 14px' }}>
                    <span style={{ fontSize: 20 }}>🎁</span>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>Gain immédiat</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{selected.gain_immediat}</div>
                    </div>
                  </div>
                )}
                {selected.gain_ticket !== false && (
                  <div className="fe-card" style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#EFF3FE', color: '#2c3a63', borderRadius: 12, padding: '12px 14px', animationDelay: '60ms' }}>
                    <span style={{ fontSize: 20 }}>🎟️</span>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>Tirage au sort final</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>+1 ticket (1 fois par jour)</div>
                    </div>
                  </div>
                )}
              </div>

              {focus && focus.id === selected.id ? (
                <a href={selected.module ? `/parcours/${selected.module}?ev=${selected.id}` : '#'} style={{ display: 'block', textAlign: 'center', marginTop: 20, background: fu.grad, color: '#fff', fontWeight: 800, fontSize: 16, padding: '15px', borderRadius: 13, textDecoration: 'none', boxShadow: '0 4px 16px rgba(20,26,38,.18)' }}>
                  🎮 Jouer maintenant
                </a>
              ) : (
                <>
                  <div style={{ background: '#FAF6EE', color: '#7a5a1e', borderRadius: 12, padding: '11px 13px', fontSize: 12.5, lineHeight: 1.5, margin: '18px 0 14px' }}>
                    📍 Pour jouer, rends-toi dans le commerce et <strong>scanne le QR sur place</strong>.
                  </div>
                  {typeof selected.lat === 'number' && typeof selected.lng === 'number' && (
                    <a href={dirUrl(selected.lat, selected.lng)} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', background: HERO, color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 13, textDecoration: 'none' }}>
                      Y aller · Itinéraire →
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
