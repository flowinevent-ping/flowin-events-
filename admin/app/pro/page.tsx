'use client'
import { useEffect, useState } from 'react'
import { supabase, FlowEvent, Joueur, Lot, Pro } from '@/lib/supabase'

interface ProData { pro: Pro|null; events: FlowEvent[]; joueurs: Joueur[]; lots: Lot[] }

export default function ProPage() {
  const [data, setData] = useState<ProData>({ pro:null, events:[], joueurs:[], lots:[] })
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)

  const proId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('pro')
      || localStorage.getItem('flowin_pro_id') || null
    : null

  async function fetchData() {
    if (!proId) { setLoading(false); return }
    try {
      localStorage.setItem('flowin_pro_id', proId)
      const [{ data: pros }, { data: events }] = await Promise.all([
        supabase.from('pros').select('*').eq('id', proId),
        supabase.from('events').select('*').eq('pro_id', proId).order('date_d', { ascending: false })
      ])
      const evIds = (events||[]).map((e:FlowEvent) => e.id)
      const [{ data: joueurs }, { data: lots }] = evIds.length ? await Promise.all([
        supabase.from('joueurs').select('*').overlaps('events', evIds),
        supabase.from('lots').select('*').in('event_id', evIds)
      ]) : [{ data:[] }, { data:[] }]
      setData({ pro: pros?.[0]||null, events: events||[], joueurs: joueurs||[], lots: lots||[] })
    } catch(e) { console.warn('[pro]', e) }
    setLoading(false)
  }

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t) }, [])

  const ev = data.events[0]
  const participants = ev?.participants || data.joueurs.length
  const optins = data.joueurs.filter(j => j.optin).length
  const txOptin = participants > 0 ? Math.round(optins/participants*100) : 0
  const gagnants = ev?.gagnants || 0

  const ACCENT = ev?.couleur || '#3B5CC4'

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0D1B2A'}}>
      <div style={{color:'#fff',fontFamily:'sans-serif',textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:12}}>⚡</div>
        <div>Chargement...</div>
      </div>
    </div>
  )

  if (!proId) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0D1B2A',color:'#fff',fontFamily:'sans-serif'}}>
      <div>Accès non autorisé — paramètre <code>?pro=ID</code> requis</div>
    </div>
  )

  const tabs = ['Tableau de bord','Participants','Lots','QR Code']

  return (
    <div style={{background:'#0D1B2A',minHeight:'100vh',fontFamily:"'Inter',sans-serif",color:'#fff',maxWidth:480,margin:'0 auto'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1a2a4a,#0D1B2A)',padding:'20px 16px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:'rgba(255,255,255,.4)',textTransform:'uppercase',marginBottom:4}}>
          {data.pro?.nom || 'Dashboard Pro'}
        </div>
        <div style={{fontSize:18,fontWeight:700,marginBottom:16}}>
          {ev?.nom || 'Événement'}
        </div>
        <div style={{display:'flex',gap:0,borderTop:'1px solid rgba(255,255,255,.08)'}}>
          {tabs.map((t,i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              flex:1,padding:'10px 0',border:'none',background:'transparent',
              color: tab===i ? ACCENT : 'rgba(255,255,255,.45)',
              fontWeight: tab===i ? 800 : 500, fontSize:10,
              letterSpacing:'.5px',textTransform:'uppercase',cursor:'pointer',
              borderBottom: tab===i ? `2px solid ${ACCENT}` : '2px solid transparent',
              transition:'all .2s'
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* TAB 0 — Dashboard */}
      {tab === 0 && (
        <div style={{padding:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            {[
              {ico:'👥',val:participants,lbl:'Participants',color:'#00B4A0'},
              {ico:'✅',val:txOptin+'%',lbl:'Opt-in RGPD',color:'#10B981'},
              {ico:'📧',val:optins,lbl:'Inscrits',color:'#F59E0B'},
              {ico:'🏆',val:gagnants,lbl:'Gagnants',color:'#8B5CF6'},
            ].map((k,i) => (
              <div key={i} style={{background:'rgba(255,255,255,.06)',borderRadius:14,padding:14,border:'1px solid rgba(255,255,255,.08)'}}>
                <div style={{fontSize:18,marginBottom:6}}>{k.ico}</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,color:k.color,lineHeight:1}}>{k.val}</div>
                <div style={{fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'.1em',color:'rgba(255,255,255,.4)',marginTop:4}}>{k.lbl}</div>
              </div>
            ))}
          </div>

          <div style={{background:'rgba(255,255,255,.04)',borderRadius:14,padding:14,border:'1px solid rgba(255,255,255,.06)'}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:1,color:'rgba(255,255,255,.4)',marginBottom:12}}>
              Derniers inscrits
            </div>
            {data.joueurs.slice(-6).reverse().map((j,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:ACCENT,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,flexShrink:0}}>
                  {((j.prenom||'?')[0]+(j.nom||'?')[0]).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {j.prenom} {j.nom}
                  </div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>{j.ville || j.email}</div>
                </div>
                {j.optin && <span style={{fontSize:10,color:'#10B981',fontWeight:700}}>✅</span>}
              </div>
            ))}
            {data.joueurs.length === 0 && (
              <div style={{color:'rgba(255,255,255,.3)',fontSize:13,textAlign:'center',padding:16}}>Aucun participant pour l&apos;instant</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1 — Participants */}
      {tab === 1 && (
        <div style={{padding:16}}>
          <div style={{marginBottom:12,color:'rgba(255,255,255,.5)',fontSize:12}}>
            {data.joueurs.length} participant{data.joueurs.length>1?'s':''}
          </div>
          {data.joueurs.map((j,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:12,background:'rgba(255,255,255,.04)',borderRadius:10,marginBottom:8,border:'1px solid rgba(255,255,255,.06)'}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:ACCENT,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0}}>
                {((j.prenom||'?')[0]+(j.nom||'?')[0]).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13}}>{j.prenom} {j.nom}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.email}</div>
                {j.ville && <div style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{j.ville}</div>}
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                {j.optin && <div style={{fontSize:11,color:'#10B981',fontWeight:700}}>✅ opt-in</div>}
              </div>
            </div>
          ))}
          {data.joueurs.length === 0 && (
            <div style={{textAlign:'center',color:'rgba(255,255,255,.3)',padding:40,fontSize:14}}>Aucun participant</div>
          )}
        </div>
      )}

      {/* TAB 2 — Lots */}
      {tab === 2 && (
        <div style={{padding:16}}>
          {data.lots.map((l,i) => (
            <div key={i} style={{padding:14,background:'rgba(255,255,255,.04)',borderRadius:12,marginBottom:10,border:`1px solid ${l.assigne_a ? 'rgba(16,185,129,.3)' : 'rgba(255,255,255,.06)'}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:24}}>{l.emoji||'🎁'}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{l.titre}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>
                    {l.valeur_euros ? `${l.valeur_euros}€` : ''} · qté {l.quantite}
                  </div>
                </div>
                <div style={{
                  padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,
                  background: l.assigne_a ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.08)',
                  color: l.assigne_a ? '#10B981' : 'rgba(255,255,255,.5)'
                }}>
                  {l.assigne_a ? 'Attribué' : 'Disponible'}
                </div>
              </div>
            </div>
          ))}
          {data.lots.length === 0 && (
            <div style={{textAlign:'center',color:'rgba(255,255,255,.3)',padding:40}}>Aucun lot configuré</div>
          )}
        </div>
      )}

      {/* TAB 3 — QR */}
      {tab === 3 && (
        <div style={{padding:16,textAlign:'center'}}>
          <div style={{background:'rgba(255,255,255,.04)',borderRadius:16,padding:24,border:'1px solid rgba(255,255,255,.08)'}}>
            <div style={{marginBottom:16,fontWeight:700,fontSize:16}}>QR Code — {ev?.nom}</div>
            {ev?.cfg && (ev.cfg as any).qrUrl ? (
              <>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent((ev.cfg as any).qrUrl)}&color=${(ev.couleur||'#3B5CC4').replace('#','')}&bgcolor=ffffff`}
                  alt="QR Code"
                  style={{borderRadius:12,border:'4px solid #fff',marginBottom:16}}
                />
                <div style={{fontSize:12,color:'rgba(255,255,255,.5)',wordBreak:'break-all',marginBottom:16}}>
                  {(ev.cfg as any).qrUrl}
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText((ev.cfg as any).qrUrl)}
                  style={{background:ACCENT,color:'#fff',border:'none',borderRadius:10,padding:'12px 24px',fontWeight:700,fontSize:14,cursor:'pointer'}}
                >
                  Copier le lien
                </button>
              </>
            ) : (
              <div style={{color:'rgba(255,255,255,.3)'}}>QR non configuré</div>
            )}
          </div>
        </div>
      )}

      {/* Footer refresh */}
      <div style={{padding:'16px',textAlign:'center'}}>
        <button onClick={fetchData} style={{background:'rgba(255,255,255,.06)',color:'rgba(255,255,255,.5)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'10px 20px',fontSize:12,cursor:'pointer'}}>
          ↻ Actualiser
        </button>
      </div>
    </div>
  )
}
