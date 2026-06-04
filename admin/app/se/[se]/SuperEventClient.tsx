'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import SuperEventMap, { Lieu } from '../_components/SuperEventMap'

type SE = { id: string; nom: string; description?: string | null; date_d?: string | null; date_f?: string | null }
type Lot = { id: string; rang: number | null; valeur: number | null; libelle?: string | null }
type Sponsor = { id: string; nom: string; image_url?: string | null }
type FocusEvent = { id: string; nom: string; module?: string | null; gain_immediat?: string | null }
type Autre = { id: string; nom: string; date_d?: string | null; date_f?: string | null; nb: number }
type GainRow = { id: string; libelle?: string | null; code?: string | null; utilise?: boolean | null; event_id?: string | null; type?: string | null }
type Joueur = { id: string; prenom?: string }

interface Props {
  se: SE
  lots: Lot[]
  lieux: Lieu[]
  sponsors: Sponsor[]
  autres?: Autre[]
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

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
function jour(d?: string | null): string {
  if (!d) return ''
  const p = d.split('-')
  if (p.length < 3) return ''
  return `${parseInt(p[2], 10)} ${MOIS[parseInt(p[1], 10) - 1] || ''}`
}
function periode(a?: string | null, b?: string | null): string {
  const ja = jour(a), jb = jour(b)
  if (ja && jb) return `${ja} – ${jb}`
  return ja || jb || ''
}

export default function SuperEventClient({ se, lots, lieux, sponsors, autres = [], focus }: Props) {
  const [open, setOpen] = useState<boolean>(!!focus)
  const [selected, setSelected] = useState<Lieu | null>(null)
  const [joueur, setJoueur] = useState<Joueur | null>(null)
  const [played, setPlayed] = useState<Set<string>>(new Set())
  const [ticketCount, setTicketCount] = useState(0)
  const [gains, setGains] = useState<GainRow[]>([])

  const lotsSorted = [...lots].sort((a, b) => (a.rang ?? 9) - (b.rang ?? 9))
  const idsKey = lieux.map((l) => l.id).join(',')

  // Reconnaissance joueur (localStorage) → données réelles
  useEffect(() => {
    if (typeof window === 'undefined') return
    let j: Joueur | null = null
    try {
      const s = localStorage.getItem('flowin_joueur')
      if (s) {
        const o = JSON.parse(s) as { id?: string; prenom?: string }
        if (o.id) j = { id: o.id, prenom: o.prenom }
      }
    } catch { /* ignore */ }
    if (!j) return
    setJoueur(j)
    const ids = idsKey ? idsKey.split(',') : []
    const jid = j.id
    ;(async () => {
      const [tk, pa, ga] = await Promise.all([
        supabase.from('se_tickets').select('event_id').eq('joueur_id', jid).eq('super_event_id', se.id),
        ids.length
          ? supabase.from('participations').select('event_id').eq('joueur_id', jid).in('event_id', ids).eq('completed', true)
          : Promise.resolve({ data: [] as { event_id: string | null }[] }),
        supabase.from('se_gains').select('id,libelle,code,utilise,event_id,type').eq('joueur_id', jid).eq('super_event_id', se.id),
      ])
      const tkRows = (tk.data ?? []) as { event_id: string | null }[]
      const paRows = (pa.data ?? []) as { event_id: string | null }[]
      setTicketCount(tkRows.length)
      const pset = new Set<string>()
      tkRows.forEach((r) => { if (r.event_id) pset.add(r.event_id) })
      paRows.forEach((r) => { if (r.event_id) pset.add(r.event_id) })
      setPlayed(pset)
      setGains((ga.data ?? []) as GainRow[])
    })()
  }, [se.id, idsKey])

  function selectById(id: string) {
    const l = lieux.find((x) => x.id === id)
    if (l) setSelected(l)
  }

  const identified = !!joueur
  const mapLieux = identified ? lieux.map((l) => ({ ...l, joue: played.has(l.id) })) : lieux
  const playedCount = lieux.filter((l) => played.has(l.id)).length
  const fu = selected ? modUI(selected.module) : null

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: 'system-ui, sans-serif', color: '#141a26', background: '#f1ede6' }}>
      <style>{`
        @keyframes feSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes feFade{from{opacity:0}to{opacity:1}}
        @keyframes feRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:.3}}
        @keyframes feGlow{0%,100%{box-shadow:0 4px 14px var(--g)}50%{box-shadow:0 4px 26px var(--g)}}
        .fe-card{animation:feRise .34s ease both}
      `}</style>

      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <SuperEventMap lieux={mapLieux} mode={identified ? 'jeu' : 'vitrine'} height="100%" showPosition={true} onSelect={selectById} />
      </div>

      {/* Bannière de quête */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, padding: '14px 14px', pointerEvents: 'none' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg,#2746A6,#3B7DE0)', color: '#fff', boxShadow: '0 6px 22px rgba(39,70,166,.42)', borderRadius: 18, padding: '12px 16px', maxWidth: '94%', pointerEvents: 'auto' }}>
          <span style={{ position: 'relative', width: 11, height: 11, flexShrink: 0 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ADE80' }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ADE80', animation: 'fePulse 1.8s ease-in-out infinite' }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{se.nom}</div>
            <div style={{ fontSize: 13, opacity: 0.88, marginTop: 1 }}>Des lots t&apos;attendent juste à côté 🎁</div>
          </div>
          {identified && (
            <span style={{ flexShrink: 0, background: 'rgba(255,255,255,.18)', borderRadius: 12, padding: '7px 11px', textAlign: 'center', lineHeight: 1.05 }}>
              <span style={{ display: 'block', fontSize: 17, fontWeight: 800 }}>🎟️ {ticketCount}</span>
              <span style={{ display: 'block', fontSize: 10, opacity: 0.85 }}>ticket{ticketCount > 1 ? 's' : ''}</span>
            </span>
          )}
        </div>
      </div>

      {/* Onglet bottom-sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, boxShadow: '0 -4px 24px rgba(0,0,0,.18)', maxHeight: open ? '70dvh' : undefined, overflowY: open ? 'auto' : 'visible' }}>

        <button
          onClick={() => setOpen((o) => !o)}
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: '13px 20px 14px', display: 'block', textAlign: 'left' }}
          aria-expanded={open}
        >
          <div style={{ width: 48, height: 6, background: '#dcdfe6', borderRadius: 3, margin: '0 auto 13px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 18, fontWeight: 800 }}>
              🎮 {lieux.length} commerces{identified ? ` · ${playedCount} joué${playedCount > 1 ? 's' : ''}` : ' jouent le jeu'}
            </span>
            <span style={{ fontSize: 20, color: '#9aa0ad' }}>{open ? '▾' : '▴'}</span>
          </div>
        </button>

        {open && (
          <div style={{ padding: '4px 20px 28px' }}>

            {identified && joueur?.prenom && (
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Salut {joueur.prenom} 👋</div>
            )}

            {focus && (
              <div className="fe-card" style={{ background: 'linear-gradient(135deg,#0F9E73,#0B6E50)', color: '#fff', borderRadius: 18, padding: '17px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, boxShadow: '0 6px 20px rgba(15,158,115,.38)' }}>
                <div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>Te voilà chez</div>
                  <div style={{ fontSize: 21, fontWeight: 800 }}>{focus.nom}</div>
                </div>
                <a href={focus.module ? `/parcours/${focus.module}?ev=${focus.id}` : '#'} style={{ background: '#fff', color: '#0B6E50', fontWeight: 800, fontSize: 16, padding: '13px 22px', borderRadius: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  On joue ▸
                </a>
              </div>
            )}

            {/* Carnet de gains */}
            {identified && gains.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.04em', color: '#9aa0ad', textTransform: 'uppercase', marginBottom: 11 }}>🎁 Tes gains</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {gains.map((g) => (
                    <div key={g.id} className="fe-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 16, background: g.utilise ? '#F3F4F6' : 'linear-gradient(135deg,#EAFBF3,#D6F5E6)', border: `1px solid ${g.utilise ? '#e5e7eb' : '#bfedd6'}` }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>🎁</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: g.utilise ? '#6b7280' : '#0B6E50', textDecoration: g.utilise ? 'line-through' : 'none' }}>{g.libelle || 'Lot'}</div>
                        {g.code && <div style={{ fontSize: 12, color: '#6b7385', fontFamily: 'monospace', marginTop: 2 }}>Code : {g.code}</div>}
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, padding: '4px 9px', borderRadius: 100, background: g.utilise ? '#e5e7eb' : '#0B6E50', color: g.utilise ? '#6b7280' : '#fff' }}>
                        {g.utilise ? 'Utilisé' : 'À récupérer'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Podium des lots */}
            {lotsSorted.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.06em', color: '#9aa0ad', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>🏆 Les lots à rafler</div>
                <div style={{ display: 'flex', gap: 11, alignItems: 'flex-end' }}>
                  {lotsSorted.slice(0, 3).map((l, i) => {
                    const p = PODIUM[i] || PODIUM[2]
                    const tall = i === 0
                    return (
                      <div
                        key={l.id}
                        className="fe-card"
                        style={{ flex: 1, background: p.grad, color: p.fg, borderRadius: 18, padding: tall ? '20px 8px' : '15px 8px', textAlign: 'center', ...(i === 0 ? { ['--g' as string]: p.glow, animation: 'feGlow 2.4s ease-in-out infinite, feRise .34s ease both' } : {}) }}
                      >
                        <div style={{ fontSize: tall ? 34 : 28, lineHeight: 1 }}>{p.medal}</div>
                        <div style={{ fontSize: tall ? 27 : 22, fontWeight: 800, marginTop: 6 }}>{l.valeur ? `${l.valeur} €` : ''}</div>
                        {l.libelle && <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>{l.libelle}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!focus && (
              <div style={{ display: 'flex', gap: 12, background: '#EFF3FE', borderRadius: 16, padding: '14px 15px', marginBottom: 18, alignItems: 'center' }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>🎉</span>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: '#2c3a63' }}>
                  Le principe est simple : tu pousses la porte, tu joues, tu gagnes. Et à chaque fois, <strong>+1 ticket/jour</strong> pour le grand tirage 🎟️
                </div>
              </div>
            )}

            {/* Cartes commerce */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {lieux.map((l, idx) => {
                const u = modUI(l.module)
                const isPlayed = identified && played.has(l.id)
                const hint = l.gain_immediat ? `🎁 ${l.gain_immediat}` : '🎟️ Un ticket à gagner'
                return (
                  <div
                    key={l.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(l)}
                    className="fe-card"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 15px', borderRadius: 18, background: '#fff', border: `1px solid ${isPlayed ? '#bfedd6' : '#eef0f3'}`, boxShadow: '0 2px 8px rgba(20,26,38,.06)', cursor: 'pointer', animationDelay: `${Math.min(idx * 35, 280)}ms` }}
                  >
                    <span style={{ position: 'relative', width: 52, height: 52, borderRadius: 15, background: u.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27, flexShrink: 0, boxShadow: '0 3px 10px rgba(20,26,38,.14)' }}>
                      {u.emoji}
                      {isPlayed && <span style={{ position: 'absolute', top: -5, right: -5, width: 22, height: 22, borderRadius: '50%', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>✓</span>}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nom}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4, flexWrap: 'wrap' }}>
                        {isPlayed
                          ? <span style={{ fontSize: 11.5, fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '3px 9px', borderRadius: 100 }}>✓ Joué</span>
                          : <span style={{ fontSize: 11.5, fontWeight: 800, color: u.accent, background: u.soft, padding: '3px 9px', borderRadius: 100 }}>{u.label}</span>}
                        <span style={{ fontSize: 12.5, color: '#7a8190', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hint}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 26, color: '#c4c8d0', flexShrink: 0 }}>›</span>
                  </div>
                )
              })}
            </div>

            {autres.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.04em', color: '#9aa0ad', textTransform: 'uppercase', marginBottom: 11 }}>🌍 Autres opérations en cours</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {autres.map((a) => (
                    <a
                      key={a.id}
                      href={`/se/${a.id}`}
                      className="fe-card"
                      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 15px', borderRadius: 18, background: 'linear-gradient(135deg,#F4F6FB,#EAF0FF)', border: '1px solid #e2e8f6', textDecoration: 'none', color: 'inherit' }}
                    >
                      <span style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#2746A6,#3B7DE0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, flexShrink: 0 }}>📍</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nom}</div>
                        <div style={{ fontSize: 12.5, color: '#6b7385', marginTop: 2 }}>
                          {a.nb} commerce{a.nb > 1 ? 's' : ''}{periode(a.date_d, a.date_f) ? ` · ${periode(a.date_d, a.date_f)}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: 22, color: '#9fb0d8', flexShrink: 0 }}>›</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {sponsors.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: '#9aa0ad', marginBottom: 9 }}>Avec le soutien de</div>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  {sponsors.map((s) => (
                    <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e3e5ea', padding: '6px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>
                      {s.image_url ? <img src={s.image_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : '🏢'} {s.nom}
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
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1600, background: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, boxShadow: '0 -6px 30px rgba(0,0,0,.25)', maxHeight: '86dvh', overflowY: 'auto', animation: 'feSheetUp .3s cubic-bezier(.4,0,.2,1)' }}>

            <div style={{ background: fu.grad, color: '#fff', padding: '24px 22px 26px', borderTopLeftRadius: 26, borderTopRightRadius: 26, position: 'relative' }}>
              <div style={{ width: 48, height: 6, background: 'rgba(255,255,255,.55)', borderRadius: 3, margin: '0 auto 18px' }} />
              <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 16, right: 18, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.22)', color: '#fff', fontSize: 18, cursor: 'pointer' }} aria-label="Fermer">✕</button>
              <div style={{ fontSize: 54, lineHeight: 1, marginBottom: 10 }}>{fu.emoji}</div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>{selected.nom}</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800, background: 'rgba(255,255,255,.24)', padding: '5px 13px', borderRadius: 100 }}>{fu.label}</span>
                {identified && played.has(selected.id) && (
                  <span style={{ fontSize: 13, fontWeight: 800, background: '#16A34A', padding: '5px 13px', borderRadius: 100 }}>✓ Déjà joué</span>
                )}
              </div>
            </div>

            <div style={{ padding: '20px 22px 26px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#9aa0ad', marginBottom: 11 }}>Ici, tu repars avec 👇</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.gain_immediat && (
                  <div className="fe-card" style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#E9F7F0', color: '#0B6E50', borderRadius: 16, padding: '15px 16px' }}>
                    <span style={{ fontSize: 26 }}>🎁</span>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Tu gagnes direct</div>
                      <div style={{ fontSize: 17, fontWeight: 800 }}>{selected.gain_immediat}</div>
                    </div>
                  </div>
                )}
                {selected.gain_ticket !== false && (
                  <div className="fe-card" style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#EFF3FE', color: '#2c3a63', borderRadius: 16, padding: '15px 16px', animationDelay: '60ms' }}>
                    <span style={{ fontSize: 26 }}>🎟️</span>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Pour le grand tirage</div>
                      <div style={{ fontSize: 17, fontWeight: 800 }}>+1 ticket (1 fois par jour)</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: '#FAF6EE', color: '#7a5a1e', borderRadius: 16, padding: '13px 15px', fontSize: 13.5, lineHeight: 1.5, margin: '20px 0 15px' }}>
                📍 Pour jouer, c&apos;est sur place : rends-toi au commerce et <strong>scanne son QR</strong>.
              </div>
              {typeof selected.lat === 'number' && typeof selected.lng === 'number' && (
                <a href={dirUrl(selected.lat, selected.lng)} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', background: HERO, color: '#fff', fontWeight: 800, fontSize: 16.5, padding: '16px', borderRadius: 16, textDecoration: 'none' }}>
                  Emmène-moi →
                </a>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  )
}
