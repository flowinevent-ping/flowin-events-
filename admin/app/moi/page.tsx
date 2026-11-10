'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Ico } from '@/lib/proicons'
import MesLots, { LIBELLE_NOTIF } from '@/components/joueur/MesLots'
import { chargerMesLots, chargerCadeaux, chargerRelances, marquerCadeauxVus, joursRestants, palierRappel, type MonLot, type Cadeau, type Relance } from '@/lib/mesLots'

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
  const [lots, setLots] = useState<MonLot[]>([])
  const [ecran, setEcran] = useState<'lots' | 'tickets'>('lots')
  /* Lot offert par un ami (notification in-app, palier « cadeau »). */
  const [cadeaux, setCadeaux] = useState<Cadeau[]>([])
  const [relances, setRelances] = useState<Relance[]>([])

  useEffect(() => {
    let local: { id?: string } | null = null
    try { const s = localStorage.getItem('flowin_joueur'); if (s) local = JSON.parse(s) } catch { /* */ }
    if (!local?.id) { setLoading(false); return }
    const jid = local.id
    ;(async () => {
      const [jr, tk, ga, ml] = await Promise.all([
        supabase.from('joueurs').select('id,prenom,nom,email').eq('id', jid).single(),
        supabase.from('se_tickets').select('event_id,super_event_id').eq('joueur_id', jid),
        supabase.from('se_gains').select('id,libelle,code,utilise,event_id,super_event_id').eq('joueur_id', jid),
        chargerMesLots(jid).catch(() => [] as MonLot[]),
      ])
      setLots(ml)
      chargerCadeaux(jid).then(setCadeaux).catch(() => { /* */ })
      chargerRelances(jid).then(setRelances).catch(() => { /* */ })
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

  const wrap: React.CSSProperties = { minHeight: '100dvh', boxSizing: 'border-box', background: '#f1ede6', fontFamily: 'system-ui, sans-serif', color: '#141a26', paddingBottom: 40 }
  const card: React.CSSProperties = { maxWidth: 540, margin: '0 auto', padding: '0 18px' }

  if (loading) {
    return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#9aa0ad' }}>Chargement…</div></div>
  }

  if (!joueur) {
    return (
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div>
          <div style={{ display: 'inline-flex', marginBottom: 14 }}><Ico k="game" size={50} /></div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Aucun compte pour l&apos;instant</div>
          <div style={{ fontSize: 14.5, color: '#5a6071', lineHeight: 1.6, maxWidth: 320 }}>
            Ton compte se crée en jouant : rends-toi dans un commerce participant, scanne son QR et joue. Tes tickets et tes gains apparaîtront ici.
          </div>
        </div>
      </div>
    )
  }

  /* Anciens gains (table se_gains, abandonnée le 28/07) : affichés à la suite, sans QR. */
  const tousLots: MonLot[] = lots.concat(gains.map(g => ({
    id: 'g-' + g.id, commerce: (g.event_id && evNames[g.event_id]) || '[commerce à compléter]', commerceCle: g.event_id || 'autre',
    operation: g.super_event_id ? seNames[g.super_event_id] || null : null, type: g.super_event_id ? 'super' : 'animation',
    lot: g.libelle || 'Lot', valeur: null, ticketCode: g.code, token: null, etat: g.utilise ? 'utilise' : 'a_utiliser',
    gagneLe: null, valableJusquAu: null, offertLe: null,
  } as MonLot)))
  const gainsActifs = tousLots.filter(l => !l.donne && (l.etat === 'a_utiliser' || l.etat === 'a_confirmer'))
  /* Rappel in-app le plus proche (1 mois / 15 j / 48 h). */
  const urgent = tousLots.filter(l => l.etat === 'a_utiliser' && palierRappel(joursRestants(l.valableJusquAu)))
    .sort((a, b) => (joursRestants(a.valableJusquAu) ?? 999) - (joursRestants(b.valableJusquAu) ?? 999))[0]
  const ongl = (a: boolean): React.CSSProperties => ({ flex: 1, padding: '10px', borderRadius: 100, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, background: a ? '#fff' : 'transparent', color: a ? HERO : '#5a6071', boxShadow: a ? '0 2px 6px rgba(20,26,38,.08)' : 'none' })

  return (
    <div style={wrap}>
      {/* En-tête profil */}
      <div style={{ background: `linear-gradient(135deg,${HERO},#3B7DE0)`, color: '#fff', padding: '40px 18px 30px' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, flexShrink: 0 }}>
            {((joueur.prenom?.[0] ?? '') + (joueur.nom?.[0] ?? '')).toUpperCase() || '·'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{joueur.prenom || 'Mon compte'} {joueur.nom || ''}</div>
            <div style={{ fontSize: 13, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{joueur.email}</div>
          </div>
        </div>
        <div style={{ maxWidth: 540, margin: '18px auto 0', display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}><Ico k="ticket" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{tickets.length}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>ticket{tickets.length > 1 ? 's' : ''}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}><Ico k="gift" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{gainsActifs.length}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>gain{gainsActifs.length > 1 ? 's' : ''} à utiliser</div>
          </div>
        </div>
      </div>

      <div style={card}>
        {cadeaux.length > 0 && (
          <button data-cadeau-banniere onClick={() => { setEcran('lots'); marquerCadeauxVus(joueur.id, cadeaux.map(c => c.id)); setCadeaux([]) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 16, background: '#E7F8EE', color: '#0B6E50', border: 'none', borderRadius: 14, padding: '12px 14px', fontSize: 13.5, fontWeight: 800, textAlign: 'left', cursor: 'pointer' }}>
            <Ico k="gift" size={16} />{LIBELLE_NOTIF.cadeau(cadeaux[0].lot_nom)}
          </button>
        )}
        {/* Une seule bannière à la fois (pas de scroll à 390 px) : cadeau, puis relance du commerce, puis expiration. */}
        {relances.length > 0 && cadeaux.length === 0 && (
          <button data-relance-banniere onClick={() => { setEcran('lots'); marquerCadeauxVus(joueur.id, relances.map(c => c.id)); setRelances([]) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 16, background: '#EFF3FE', color: '#2746A6', border: 'none', borderRadius: 14, padding: '12px 14px', fontSize: 13.5, fontWeight: 800, textAlign: 'left', cursor: 'pointer' }}>
            <Ico k="bell" size={16} />{LIBELLE_NOTIF.relance(relances[0].lot_nom)}
          </button>
        )}
        {urgent && cadeaux.length === 0 && relances.length === 0 && (
          <button data-rappel-banniere onClick={() => setEcran('lots')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 16, background: '#FEF3C7', color: '#92400E', border: 'none', borderRadius: 14, padding: '12px 14px', fontSize: 13.5, fontWeight: 800, textAlign: 'left', cursor: 'pointer' }}>
            <Ico k="bell" size={16} />Ton lot chez {urgent.commerce} expire bientôt
          </button>
        )}
        <div style={{ display: 'flex', gap: 4, background: '#e6e1d8', borderRadius: 100, padding: 4, margin: '18px 0 14px' }}>
          <button style={ongl(ecran === 'lots')} onClick={() => setEcran('lots')}><Ico k="gift" size={14} style={{ marginRight: 5, verticalAlign: -2 }} />Mes lots</button>
          <button style={ongl(ecran === 'tickets')} onClick={() => setEcran('tickets')}><Ico k="ticket" size={14} style={{ marginRight: 5, verticalAlign: -2 }} />Mes tickets</button>
        </div>
        {ecran === 'lots' && <MesLots lots={tousLots} joueurId={joueur.id} onChange={() => { chargerMesLots(joueur.id).then(setLots).catch(() => { /* */ }) }} />}
        {ecran === 'tickets' && (<>
        {/* Mes tickets par opération */}
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
                <span style={{ fontSize: 13, fontWeight: 800, color: HERO, background: '#EFF3FE', padding: '4px 11px', borderRadius: 100 }}><Ico k="ticket" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{op.total}</span>
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
          Chaque ticket = une chance au tirage.
        </div>
        </>)}
      </div>
    </div>
  )
}
