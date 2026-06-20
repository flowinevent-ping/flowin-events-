'use client'

import { useState, useMemo, useEffect } from 'react'
import { fetchProDashboard, getQrUrl, type ProDashboardData } from '@/lib/pro'
import { fetchEventSuperEventStats, fetchProGains, marquerGainUtilise, enregistrerTirage, type ProGainRow } from '@/lib/dashboard'
import type { FlowinEvent, FlowinJoueur, FlowinLot } from '@/lib/types'

type Tab = 'stats' | 'gains' | 'tirage' | 'participants' | 'lots' | 'qr' | 'export'

interface Props {
  initialData: ProDashboardData
  proId: string
  defaultEvId?: string
}

export default function ProClient({ initialData, proId, defaultEvId }: Props) {
  const [data, setData] = useState(initialData)
  const [selectedEvId, setSelectedEvId] = useState(
    defaultEvId ?? initialData.events[0]?.id ?? ''
  )
  const [refreshing, setRefreshing] = useState(false)
  const [tirageDone, setTirageDone] = useState(false)
  const [gagnant, setGagnant] = useState<FlowinJoueur | null>(null)
  const [seStats, setSeStats] = useState<{ tickets: number; gains: number; gainsUtilises: number } | null>(null)
  const [proGains, setProGains] = useState<ProGainRow[]>([])
  const [codeInput, setCodeInput] = useState('')
  const [gainMsg, setGainMsg] = useState('')

  const ev = useMemo(
    () => data.events.find(e => e.id === selectedEvId) ?? data.events[0] ?? null,
    [data.events, selectedEvId]
  )

  /* proVisib : ce que le pro peut voir */
  const pv = useMemo(() => {
    return (ev?.pro_visib ?? {}) as Record<string, boolean>
  }, [ev])

  const visibleTabs = useMemo<Tab[]>(() => {
    const t: Tab[] = ['stats']
    if (ev?.super_event_id)        t.push('gains')
    if (pv.activite !== false)    t.push('tirage')
    if (pv.participants !== false) t.push('participants')
    if (pv.lots !== false)        t.push('lots')
    if (pv.qr !== false)          t.push('qr')
    if (pv.export !== false)      t.push('export')
    return t
  }, [pv, ev?.super_event_id])

  const [tab, setTab] = useState<Tab>('stats')

  /* Reset tab si elle devient invisible */
  useEffect(() => {
    if (!visibleTabs.includes(tab)) setTab('stats')
  }, [visibleTabs, tab])

  const evJoueurs = useMemo(
    () => data.joueurs.filter(j => Array.isArray(j.events) && j.events.includes(selectedEvId)),
    [data.joueurs, selectedEvId]
  )

  const evLots = useMemo(
    () => data.lots.filter(l => (l as FlowinLot & { event_id?: string }).event_id === selectedEvId),
    [data.lots, selectedEvId]
  )

  const stats = useMemo(() => {
    const total   = evJoueurs.length
    const optins  = evJoueurs.filter(j => j.optin).length
    const gagnants = evLots.filter(l => (l as unknown as { assigne_a?: string }).assigne_a).length
    const conv    = total ? Math.round((optins / total) * 100) : 0
    return { total, optins, gagnants, conv }
  }, [evJoueurs, evLots])

  async function refresh() {
    if (!proId) return
    setRefreshing(true)
    const fresh = await fetchProDashboard(proId)
    setData(fresh)
    setRefreshing(false)
  }

  useEffect(() => {
    if (!ev?.id || !ev?.super_event_id) { setSeStats(null); setProGains([]); return }
    let on = true
    fetchEventSuperEventStats(ev.id).then(s => { if (on) setSeStats(s) })
    fetchProGains([ev.id]).then(g => { if (on) setProGains(g) })
    return () => { on = false }
  }, [ev?.id, ev?.super_event_id])

  async function reloadGains() {
    if (!ev?.id) return
    const [g, s] = await Promise.all([fetchProGains([ev.id]), fetchEventSuperEventStats(ev.id)])
    setProGains(g); setSeStats(s)
  }
  async function validerGain(id: string) {
    const ok = await marquerGainUtilise(id, true)
    if (ok) { setGainMsg('✅ Gain marqué comme utilisé.'); await reloadGains() }
    else setGainMsg('Erreur, réessayez.')
  }
  async function annulerGain(id: string) {
    const ok = await marquerGainUtilise(id, false)
    if (ok) await reloadGains()
  }
  async function validerParCode() {
    const c = codeInput.trim().toUpperCase()
    if (!c) return
    const g = proGains.find(x => (x.code || '').toUpperCase() === c)
    if (!g) { setGainMsg('❌ Code introuvable pour ce commerce.'); return }
    if (g.utilise) { setGainMsg('⚠️ Ce gain a déjà été utilisé.'); return }
    await validerGain(g.id)
    setCodeInput('')
  }

  useEffect(() => {
    if (ev?.status !== 'live') return
    const t = setInterval(refresh, 30_000)
    return () => clearInterval(t)
  }, [ev?.status, proId])

  async function lancerTirage() {
    const elig = evJoueurs.filter(j => j.ticket_code)
    if (!elig.length) return
    const g = elig[Math.floor(Math.random() * elig.length)]
    setGagnant(g)
    setTirageDone(true)
    try {
      await enregistrerTirage({
        superEventId: (ev as unknown as { super_event_id?: string | null })?.super_event_id ?? null,
        eventId: ev?.id ?? null,
        joueur: { id: g.id, prenom: g.prenom, nom: g.nom, email: g.email, tel: g.tel },
      })
    } catch { /* persistance best-effort, le tirage reste affiché */ }
  }

  function exportCSV() {
    const rows = [
      ['Prénom','Nom','Email','Tél','Ville','Opt-in','Ticket','Date'],
      ...evJoueurs.map(j => [j.prenom??'',j.nom??'',j.email,j.tel??'',j.ville??'',j.optin?'oui':'non',j.ticket_code??'',j.first_seen??''])
    ]
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' }))
    a.download = `flowin-${ev?.nom??'export'}-${new Date().toLocaleDateString('fr-FR')}.csv`
    a.click()
  }

  const qrUrl = ev ? getQrUrl(ev) : ''
  const couleur = ev?.couleur ?? '#1D9E75'

  if (!data.pro && !proId) {
    return (
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',flexDirection:'column',gap:16,fontFamily:'system-ui',padding:24 }}>
        <div style={{ fontSize:48 }}>🔒</div>
        <div style={{ fontSize:18,fontWeight:800 }}>Accès Pro requis</div>
        <div style={{ fontSize:13,color:'#888',textAlign:'center' }}>Contactez votre organisateur Flowin.</div>
      </div>
    )
  }

  const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
    { id:'stats',        icon:'📊', label:'Stats' },
    { id:'gains',        icon:'🎁', label:'Gains' },
    { id:'tirage',       icon:'🎲', label:'Tirage' },
    { id:'participants', icon:'👥', label:'Joueurs' },
    { id:'lots',         icon:'🎁', label:'Lots' },
    { id:'qr',           icon:'📱', label:'QR' },
    { id:'export',       icon:'📥', label:'Export' },
  ]

  return (
    <div style={{ maxWidth:430,margin:'0 auto',height:'100dvh',display:'flex',flexDirection:'column',background:'#F1F5F9',fontFamily:'system-ui,sans-serif',overflow:'hidden' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;display:flex;flex-direction:column;gap:12px}
        .card{background:#fff;border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
        .kpi{border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:4px}
        .kpi-val{font-size:22px;font-weight:900;line-height:1;letter-spacing:-.5px}
        .kpi-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;opacity:.7}
        .kpi-sub{font-size:11px;font-weight:600;opacity:.8}
        .nav{display:flex;background:#fff;border-top:1px solid #E2E8F0;flex-shrink:0}
        .nb{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 2px;border:none;background:none;cursor:pointer;font-size:9px;font-weight:700;color:#94A3B8;gap:2px;font-family:inherit}
        .nb.on{color:${couleur}}
        .nb .i{font-size:17px}
        .j-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F1F5F9}
        .j-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,${couleur},#7C2D92);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px;flex-shrink:0}
        .badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:700}
        .btn-main{background:${couleur};color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:800;width:100%;cursor:pointer;font-family:inherit}
        .btn-ghost{background:none;border:1.5px solid #E2E8F0;border-radius:10px;padding:10px;font-size:13px;font-weight:700;color:#0F172A;cursor:pointer;width:100%;font-family:inherit}
        select option{background:#1E293B;color:#fff}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:`linear-gradient(135deg,#1a2a4a,#0f172a)`,padding:'14px 16px 12px',flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
          <div style={{ fontWeight:900,fontSize:17,color:'#fff',letterSpacing:'-.5px' }}>
            Flow<span style={{ color:'#5DD4AC' }}>in</span>
            <span style={{ marginLeft:8,fontSize:11,fontWeight:600,color:'rgba(255,255,255,.5)' }}>
              {data.pro?.nom ?? 'Dashboard Pro'}
            </span>
          </div>
          <button onClick={refresh} disabled={refreshing}
            style={{ background:'rgba(255,255,255,.1)',border:'none',borderRadius:8,color:'#fff',fontSize:11,padding:'4px 10px',cursor:'pointer' }}>
            {refreshing ? '…' : '↻'}
          </button>
        </div>
        {data.events.length > 1 && (
          <select value={selectedEvId} onChange={e => setSelectedEvId(e.target.value)}
            style={{ background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:8,color:'#fff',fontSize:11,padding:'5px 8px',width:'100%',cursor:'pointer' }}>
            {data.events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.nom}</option>
            ))}
          </select>
        )}
        {ev && (
          <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:8 }}>
            <div style={{ width:7,height:7,borderRadius:'50%',background:ev.status==='live'?'#4ADE80':'#94A3B8',boxShadow:ev.status==='live'?'0 0 6px #4ADE80':'none' }} />
            <span style={{ fontSize:10,color:'rgba(255,255,255,.6)',fontWeight:700 }}>
              {ev.status==='live'?'EN DIRECT':ev.status==='upcoming'?'À VENIR':'TERMINÉ'}
              {ev.lieu ? ` · ${ev.lieu}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── CONTENU ── */}
      <div className="scroll">

        {/* STATS */}
        {tab === 'stats' && (
          <>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div className="kpi" style={{ background:'#1E3A5F',color:'#fff' }}>
                <span style={{ fontSize:13 }}>👥</span>
                <div className="kpi-val">{stats.total}</div>
                <div className="kpi-lbl">Participants</div>
                {ev?.status==='live' && <div className="kpi-sub" style={{ color:'#5DD4AC' }}>Event en cours</div>}
              </div>
              <div className="kpi" style={{ background:stats.conv>=70?'#E8F8F2':'#FFF7ED',color:stats.conv>=70?'#0F6E56':'#B45309' }}>
                <span style={{ fontSize:13 }}>{stats.conv>=70?'✅':'⚠️'}</span>
                <div className="kpi-val">{stats.conv}%</div>
                <div className="kpi-lbl">Conversion</div>
                <div className="kpi-sub">{stats.conv>=70?'Excellent':stats.conv>=50?'Bon':'À améliorer'}</div>
              </div>
              <div className="kpi" style={{ background:'#FFF8EC',color:'#B45309' }}>
                <span style={{ fontSize:13 }}>📋</span>
                <div className="kpi-val">{stats.optins}</div>
                <div className="kpi-lbl">Opt-in RGPD</div>
                <div className="kpi-sub">{stats.total ? `${stats.total} inscrits` : '—'}</div>
              </div>
              <div className="kpi" style={{ background:'#FFFBEC',color:'#92400E' }}>
                <span style={{ fontSize:13 }}>🏆</span>
                <div className="kpi-val">{stats.gagnants}</div>
                <div className="kpi-lbl">Gagnants</div>
                <div className="kpi-sub">{evLots.length} lot{evLots.length!==1?'s':''}</div>
              </div>
            </div>

            {seStats && (
              <div className="card" style={{ marginTop:10 }}>
                <div style={{ fontSize:11,fontWeight:800,color:'#64748B',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10 }}>
                  🎟️ Super Event — ton commerce
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
                  <div className="kpi" style={{ background:'#EEF3FE',color:'#2746A6' }}>
                    <div className="kpi-val">{seStats.tickets}</div>
                    <div className="kpi-lbl">Tickets distribués</div>
                  </div>
                  <div className="kpi" style={{ background:'#E9F7F0',color:'#0B6E50' }}>
                    <div className="kpi-val">{seStats.gains}</div>
                    <div className="kpi-lbl">Gains remis</div>
                  </div>
                  <div className="kpi" style={{ background:'#F3F4F6',color:'#475569' }}>
                    <div className="kpi-val">{seStats.gainsUtilises}</div>
                    <div className="kpi-lbl">Gains utilisés</div>
                  </div>
                </div>
              </div>
            )}

            {evJoueurs.length > 0 && (
              <div className="card">
                <div style={{ fontSize:11,fontWeight:800,color:'#64748B',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10 }}>
                  Derniers inscrits
                </div>
                {evJoueurs.slice(0,5).map(j => (
                  <div key={j.id} className="j-row">
                    <div className="j-av">{((j.prenom?.[0]??'')+(j.nom?.[0]??'')).toUpperCase()||'?'}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{j.prenom} {j.nom}</div>
                      <div style={{ fontSize:11,color:'#64748B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{j.email}</div>
                    </div>
                    {j.ticket_code && <code style={{ fontSize:9,background:'#F1F5F9',padding:'2px 5px',borderRadius:4,color:'#7C2D92',flexShrink:0 }}>{j.ticket_code}</code>}
                  </div>
                ))}
                {evJoueurs.length>5 && <div style={{ textAlign:'center',fontSize:12,color:'#94A3B8',marginTop:8 }}>+{evJoueurs.length-5} autres</div>}
              </div>
            )}
          </>
        )}

        {/* GAINS — validation utilisation */}
        {tab === 'gains' && (
          <>
            <div className="card">
              <div style={{ fontSize:11,fontWeight:800,color:'#64748B',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12 }}>
                Valider un gain présenté
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value); setGainMsg('') }}
                  placeholder="Code du gain (ex : G-AB12CD)"
                  style={{ flex:1, padding:'12px 14px', borderRadius:12, border:'1px solid #d9dde6', fontSize:15, fontFamily:'monospace', textTransform:'uppercase', outline:'none' }}
                />
                <button onClick={validerParCode} style={{ background:'#0B6E50', color:'#fff', fontWeight:800, fontSize:14.5, padding:'0 18px', borderRadius:12, border:'none', cursor:'pointer' }}>Valider</button>
              </div>
              {gainMsg && <div style={{ marginTop:10, fontSize:13.5, fontWeight:600, color: gainMsg.startsWith('✅') ? '#0B6E50' : '#B45309' }}>{gainMsg}</div>}
              <div style={{ fontSize:12, color:'#94A3B8', marginTop:10, lineHeight:1.5 }}>Le client présente le code depuis son compte ; saisissez-le ici ou validez-le dans la liste ci-dessous.</div>
            </div>

            <div className="card">
              <div style={{ fontSize:11,fontWeight:800,color:'#64748B',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12 }}>
                Gains émis ({proGains.filter(g=>!g.utilise).length} à utiliser · {proGains.filter(g=>g.utilise).length} utilisés)
              </div>
              {proGains.length === 0 && <div style={{ fontSize:13.5, color:'#94A3B8' }}>Aucun gain émis pour l&apos;instant.</div>}
              {proGains.map(g => (
                <div key={g.id} className="j-row" style={{ alignItems:'center' }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{g.utilise ? '✅' : '🎁'}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13.5, textDecoration: g.utilise ? 'line-through' : 'none', color: g.utilise ? '#94A3B8' : '#1E293B' }}>{g.libelle || 'Lot'}</div>
                    <div style={{ fontSize:11, color:'#64748B' }}>{g.joueur} · <code style={{ fontFamily:'monospace' }}>{g.code}</code></div>
                  </div>
                  {g.utilise
                    ? <button onClick={() => annulerGain(g.id)} style={{ flexShrink:0, background:'transparent', border:'1px solid #e2e8f0', color:'#64748B', fontWeight:700, fontSize:12, padding:'7px 11px', borderRadius:10, cursor:'pointer' }}>Annuler</button>
                    : <button onClick={() => validerGain(g.id)} style={{ flexShrink:0, background:'#0B6E50', color:'#fff', fontWeight:800, fontSize:12.5, padding:'8px 13px', borderRadius:10, border:'none', cursor:'pointer' }}>Marquer utilisé</button>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* TIRAGE */}
        {tab === 'tirage' && (
          <div className="card">
            <div style={{ fontSize:11,fontWeight:800,color:'#64748B',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:14 }}>
              Tirage au sort
            </div>
            {tirageDone && gagnant ? (
              <div style={{ textAlign:'center',padding:'16px 0' }}>
                <div style={{ fontSize:44,marginBottom:8 }}>🏆</div>
                <div style={{ fontWeight:900,fontSize:20,marginBottom:4 }}>{gagnant.prenom} {gagnant.nom}</div>
                <div style={{ fontSize:13,color:'#64748B',marginBottom:8 }}>{gagnant.email}</div>
                {gagnant.ticket_code && (
                  <code style={{ fontSize:15,fontWeight:700,color:'#7C2D92',background:'rgba(124,45,146,.08)',padding:'5px 14px',borderRadius:8,display:'inline-block',marginBottom:12 }}>
                    {gagnant.ticket_code}
                  </code>
                )}
                <br/>
                <button className="btn-ghost" style={{ marginTop:12 }} onClick={()=>{setTirageDone(false);setGagnant(null)}}>
                  Relancer le tirage
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize:13,color:'#64748B',marginBottom:12 }}>
                  {evJoueurs.filter(j=>j.ticket_code).length} participants éligibles
                </div>
                <button className="btn-main" onClick={lancerTirage}
                  disabled={evJoueurs.filter(j=>j.ticket_code).length===0}>
                  🎰 Lancer le tirage
                </button>
              </>
            )}
          </div>
        )}

        {/* PARTICIPANTS */}
        {tab === 'participants' && (
          <div className="card">
            <div style={{ fontWeight:800,marginBottom:12,fontSize:14 }}>
              {evJoueurs.length} participant{evJoueurs.length>1?'s':''}
            </div>
            {evJoueurs.length===0 && <div style={{ textAlign:'center',padding:32,color:'#94A3B8' }}>Aucun participant</div>}
            {evJoueurs.map(j => (
              <div key={j.id} className="j-row">
                <div className="j-av">{((j.prenom?.[0]??'')+(j.nom?.[0]??'')).toUpperCase()||'?'}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{j.prenom} {j.nom}</div>
                  <div style={{ fontSize:11,color:'#64748B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{j.email}</div>
                </div>
                <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,flexShrink:0 }}>
                  {j.ticket_code && <code style={{ fontSize:9,background:'#F1F5F9',padding:'1px 5px',borderRadius:3,color:'#7C2D92' }}>{j.ticket_code}</code>}
                  {j.optin && <span className="badge" style={{ background:'rgba(29,158,117,.1)',color:'#0F6E56' }}>opt-in</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LOTS */}
        {tab === 'lots' && (
          <div className="card">
            <div style={{ fontWeight:800,marginBottom:12,fontSize:14 }}>{evLots.length} lot{evLots.length!==1?'s':''}</div>
            {evLots.length===0 && <div style={{ textAlign:'center',padding:32,color:'#94A3B8' }}>Aucun lot configuré</div>}
            {evLots.map(l => (
              <div key={l.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #F1F5F9' }}>
                <span style={{ fontSize:24 }}>{l.emoji??'🎁'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:13 }}>{l.titre||l.nom}</div>
                  {l.valeur ? <div style={{ fontSize:11,color:'#64748B' }}>{l.valeur} €</div> : null}
                </div>
                <span className="badge" style={(l as FlowinLot & { retire?: boolean }).retire
                  ? { background:'rgba(34,197,94,.1)',color:'#15803D' }
                  : { background:'#F1F5F9',color:'#64748B' }}>
                  {(l as FlowinLot & { retire?: boolean }).retire ? 'Retiré ✓' : 'Disponible'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* QR */}
        {tab === 'qr' && ev && (
          <>
            <div className="card" style={{ textAlign:'center' }}>
              <div style={{ fontSize:11,fontWeight:800,color:'#64748B',textTransform:'uppercase',marginBottom:12 }}>
                QR Code participation
              </div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=${(couleur??'#1D9E75').replace('#','')}&margin=8`}
                alt="QR" style={{ width:220,height:220,borderRadius:12,display:'block',margin:'0 auto 12px' }} />
              <div style={{ fontSize:10,wordBreak:'break-all',color:'#94A3B8',background:'#F8FAFC',padding:'6px 10px',borderRadius:8,marginBottom:12 }}>
                {qrUrl}
              </div>
              <button className="btn-main" onClick={()=>navigator.clipboard?.writeText(qrUrl)}>
                📋 Copier le lien
              </button>
            </div>
            <div className="card">
              <div style={{ fontSize:11,fontWeight:800,color:'#64748B',textTransform:'uppercase',marginBottom:10 }}>Partager</div>
              <a href={`https://wa.me/?text=${encodeURIComponent('Participez à '+ev.nom+' : '+qrUrl)}`}
                target="_blank" rel="noopener"
                style={{ display:'block',background:'#25D366',color:'#fff',borderRadius:10,padding:'12px',fontWeight:800,fontSize:14,textDecoration:'none',marginBottom:8,textAlign:'center' }}>
                📲 WhatsApp
              </a>
              <a href={`sms:?body=${encodeURIComponent('Participez à '+ev.nom+' : '+qrUrl)}`}
                style={{ display:'block',background:'#007AFF',color:'#fff',borderRadius:10,padding:'12px',fontWeight:800,fontSize:14,textDecoration:'none',textAlign:'center' }}>
                💬 SMS
              </a>
            </div>
          </>
        )}

        {/* EXPORT */}
        {tab === 'export' && (
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:36,marginBottom:10 }}>📥</div>
            <div style={{ fontWeight:800,fontSize:16,marginBottom:4 }}>Export CSV</div>
            <div style={{ fontSize:13,color:'#64748B',marginBottom:20 }}>
              {evJoueurs.length} participant{evJoueurs.length!==1?'s':''} · {stats.optins} opt-in
            </div>
            <button className="btn-main" onClick={exportCSV} disabled={evJoueurs.length===0}>
              ↓ Télécharger le CSV
            </button>
            {evJoueurs.length===0 && <div style={{ marginTop:12,fontSize:12,color:'#94A3B8' }}>Aucun participant à exporter</div>}
          </div>
        )}
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="nav">
        {NAV_ITEMS.filter(t => visibleTabs.includes(t.id)).map(t => (
          <button key={t.id} className={`nb${tab===t.id?' on':''}`} onClick={() => setTab(t.id)}>
            <span className="i">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
