'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Joueur = { id: string; prenom?: string | null; nom?: string | null; email?: string | null }
type Ticket = { event_id: string | null; super_event_id: string | null }
type Gain = { id: string; libelle: string | null; code: string | null; utilise: boolean | null; event_id: string | null; super_event_id: string | null }

const HERO = '#2746A6'

export default function MonComptePage() {
  const [loading, setLoading] = useState(true)
  const [joueur, setJoueur] = useState<Joueur | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [gains, setGains] = useState<Gain[]>([])
  const [evNames, setEvNames] = useState<Record<string, string>>({})
  const [seNames, setSeNames] = useState<Record<string, string>>({})
  const [showCode, setShowCode] = useState<string | null>(null)

  useEffect(() => {
    let local: { id?: string } | null = null
    try { const s = localStorage.getItem('flowin_joueur'); if (s) local = JSON.parse(s) } catch { /* */ }
    if (!local?.id) { setLoading(false); return }
    const jid = local.id
    ;(async () => {
      const [jr, tk, ga] = await Promise.all([
        supabase.from('joueurs').select('id,prenom,nom,email').eq('id', jid).single(),
        supabase.from('se_tickets').select('event_id,super_event_id').eq('joueur_id', jid),
        supabase.from('se_gains').select('id,libelle,code,utilise,event_id,super_event_id').eq('joueur_id', jid),
      ])
      setJoueur((jr.data as Joueur) ?? { id: jid })
      const tkRows = (tk.data ?? []) as Ticket[]
      const gaRows = (ga.data ?? []) as Gain[]
      setTickets(tkRows)
      setGains(gaRows)
      const evIds = Array.from(new Set([...tkRows, ...gaRows].map(r => r.event_id).filter(Boolean))) as string[]
      const seIds = Array.from(new Set([...tkRows, ...gaRows].map(r => r.super_event_id).filter(Boolean))) as string[]
      if (evIds.length) {
        const ev = await supabase.from('events').select('id,nom').in('id', evIds)
        const m: Record<string, string> = {}
        ;(ev.data ?? []).forEach((e: { id: string; nom: string }) => { m[e.id] = e.nom })
        setEvNames(m)
      }
      if (seIds.length) {
        const se = await supabase.from('super_events').select('id,nom').in('id', seIds)
        const m: Record<string, string> = {}
        ;(se.data ?? []).forEach((s: { id: string; nom: string }) => { m[s.id] = s.nom })
        setSeNames(m)
      }
      setLoading(false)
    })()
  }, [])

  // tickets groupés par opération
  const parOperation = Object.values(
    tickets.reduce((acc, t) => {
      const se = t.super_event_id || '?'
      if (!acc[se]) acc[se] = { se, total: 0, commerces: {} as Record<string, number> }
      acc[se].total++
      if (t.event_id) acc[se].commerces[t.event_id] = (acc[se].commerces[t.event_id] || 0) + 1
      return acc
    }, {} as Record<string, { se: string; total: number; commerces: Record<string, number> }>)
  )

  const wrap: React.CSSProperties = { minHeight: '100dvh', background: '#f1ede6', fontFamily: 'system-ui, sans-serif', color: '#141a26', paddingBottom: 40 }
  const card: React.CSSProperties = { maxWidth: 540, margin: '0 auto', padding: '0 18px' }
  const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 800, letterSpacing: '.04em', color: '#9aa0ad', textTransform: 'uppercase', margin: '26px 0 12px' }

  if (loading) {
    return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#9aa0ad' }}>Chargement…</div></div>
  }

  if (!joueur) {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🎮</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Aucun compte pour l&apos;instant</div>
          <div style={{ fontSize: 14.5, color: '#5a6071', lineHeight: 1.6, maxWidth: 320 }}>
            Ton compte se crée en jouant : rends-toi dans un commerce participant, scanne son QR et joue. Tes tickets et tes gains apparaîtront ici.
          </div>
        </div>
      </div>
    )
  }

  const gainsActifs = gains.filter(g => !g.utilise)
  const gainsUtilises = gains.filter(g => g.utilise)

  return (
    <div style={wrap}>
      {/* En-tête profil */}
      <div style={{ background: `linear-gradient(135deg,${HERO},#3B7DE0)`, color: '#fff', padding: '40px 18px 30px' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, flexShrink: 0 }}>
            {((joueur.prenom?.[0] ?? '') + (joueur.nom?.[0] ?? '')).toUpperCase() || '🙂'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{joueur.prenom || 'Mon compte'} {joueur.nom || ''}</div>
            <div style={{ fontSize: 13, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{joueur.email}</div>
          </div>
        </div>
        <div style={{ maxWidth: 540, margin: '18px auto 0', display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>🎟️ {tickets.length}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>ticket{tickets.length > 1 ? 's' : ''}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>🎁 {gainsActifs.length}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>gain{gainsActifs.length > 1 ? 's' : ''} à utiliser</div>
          </div>
        </div>
      </div>

      <div style={card}>
        {/* Mes gains */}
        <div style={sectionTitle}>🎁 Mes gains</div>
        {gains.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px', fontSize: 14, color: '#5a6071', textAlign: 'center' }}>
            Pas encore de gain. Joue dans un commerce pour en remporter !
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {gainsActifs.map(g => (
            <div key={g.id} style={{ background: 'linear-gradient(135deg,#EAFBF3,#D6F5E6)', border: '1px solid #bfedd6', borderRadius: 18, padding: '16px 17px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26 }}>🎁</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16.5, fontWeight: 800, color: '#0B6E50' }}>{g.libelle || 'Lot'}</div>
                  <div style={{ fontSize: 12.5, color: '#3f7a64' }}>{g.event_id ? evNames[g.event_id] || '' : ''}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, background: '#0B6E50', color: '#fff', padding: '4px 10px', borderRadius: 100 }}>À utiliser</span>
              </div>
              {showCode === g.id ? (
                <div style={{ marginTop: 14, textAlign: 'center', background: '#fff', borderRadius: 14, padding: '16px' }}>
                  <div style={{ fontSize: 12, color: '#5a6071', marginBottom: 6 }}>Montre ce code au commerce 👇</div>
                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 3, color: '#0B6E50', fontFamily: 'monospace' }}>{g.code}</div>
                  <div style={{ fontSize: 11.5, color: '#9aa0ad', marginTop: 8, lineHeight: 1.5 }}>Le commerçant le validera depuis son tableau de bord. Ton gain passera alors en « utilisé ».</div>
                </div>
              ) : (
                <button onClick={() => setShowCode(g.id)} style={{ marginTop: 13, width: '100%', background: '#0B6E50', color: '#fff', fontWeight: 800, fontSize: 15, padding: '13px', borderRadius: 13, border: 'none', cursor: 'pointer' }}>
                  Utiliser ce gain
                </button>
              )}
            </div>
          ))}
          {gainsUtilises.map(g => (
            <div key={g.id} style={{ background: '#F3F4F6', border: '1px solid #e5e7eb', borderRadius: 18, padding: '15px 17px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.85 }}>
              <span style={{ fontSize: 24 }}>✅</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: '#6b7280', textDecoration: 'line-through' }}>{g.libelle || 'Lot'}</div>
                <div style={{ fontSize: 12, color: '#9aa0ad' }}>{g.event_id ? evNames[g.event_id] || '' : ''}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, background: '#e5e7eb', color: '#6b7280', padding: '4px 10px', borderRadius: 100 }}>Utilisé</span>
            </div>
          ))}
        </div>

        {/* Mes tickets par opération */}
        <div style={sectionTitle}>🎟️ Mes tickets pour le tirage</div>
        {parOperation.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px', fontSize: 14, color: '#5a6071', textAlign: 'center' }}>
            Aucun ticket pour l&apos;instant.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {parOperation.map(op => (
            <a key={op.se} href={`/se/${op.se}`} style={{ display: 'block', background: '#fff', borderRadius: 18, padding: '16px 17px', boxShadow: '0 2px 8px rgba(20,26,38,.06)', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: op.commerces && Object.keys(op.commerces).length ? 10 : 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{seNames[op.se] || 'Opération'}</div>
                <span style={{ fontSize: 13, fontWeight: 800, color: HERO, background: '#EFF3FE', padding: '4px 11px', borderRadius: 100 }}>🎟️ {op.total}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(op.commerces).map(([eid, n]) => (
                  <span key={eid} style={{ fontSize: 12, color: '#5a6071', background: '#f3f4f6', padding: '3px 9px', borderRadius: 100 }}>{evNames[eid] || eid} · {n}</span>
                ))}
              </div>
            </a>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#9aa0ad', textAlign: 'center', marginTop: 26, lineHeight: 1.6 }}>
          Chaque ticket = une chance au tirage final de chaque opération.<br />Plus tu joues de commerces, plus tu as de chances 🍀
        </div>
      </div>
    </div>
  )
}
