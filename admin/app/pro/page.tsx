'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, FlowEvent, Joueur, Lot, Pro } from '@/lib/supabase'

interface ProData { pro:Pro|null; events:FlowEvent[]; joueurs:Joueur[]; lots:Lot[] }

function exportCSV(joueurs:Joueur[], evNom:string) {
  const header = 'Prénom,Nom,Email,Téléphone,Ville,Opt-in,Date inscription'
  const rows = joueurs.map(j=>[
    j.prenom||'',j.nom||'',j.email||'',j.tel||'',j.ville||'',
    j.optin?'Oui':'Non',j.first_seen||''
  ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))
  const csv = [header,...rows].join('\n')
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `flowin-${evNom.replace(/[^a-z0-9]/gi,'-')}-joueurs.csv`
  a.click()
}

export default function ProPage() {
  const [data,setData]=useState<ProData>({pro:null,events:[],joueurs:[],lots:[]})
  const [tab,setTab]=useState(0)
  const [loading,setLoading]=useState(true)
  const [tirage,setTirage]=useState<Joueur[]>([])
  const [tirageLoading,setTirageLoading]=useState(false)

  const proId = typeof window!=='undefined'
    ? new URLSearchParams(window.location.search).get('pro')||localStorage.getItem('flowin_pro_id')||null
    : null

  const fetchData = useCallback(async()=>{
    if(!proId){setLoading(false);return}
    try{
      localStorage.setItem('flowin_pro_id',proId)
      const [{data:pros},{data:events}]=await Promise.all([
        supabase.from('pros').select('*').eq('id',proId),
        supabase.from('events').select('*').eq('pro_id',proId).order('date_d',{ascending:false})
      ])
      const evIds=(events||[]).map((e:FlowEvent)=>e.id)
      const [{data:joueurs},{data:lots}]=evIds.length?await Promise.all([
        supabase.from('joueurs').select('*').overlaps('events',evIds),
        supabase.from('lots').select('*').in('event_id',evIds)
      ]):[{data:[]},{data:[]}]
      setData({pro:pros?.[0]||null,events:events||[],joueurs:joueurs||[],lots:lots||[]})
    }catch(e){console.warn('[pro]',e)}
    setLoading(false)
  },[proId])

  useEffect(()=>{fetchData();const t=setInterval(fetchData,30000);return()=>clearInterval(t)},[fetchData])

  async function retirerLot(lotId:string){
    await supabase.from('lots').update({retire:true,date_retrait:new Date().toISOString()}).eq('id',lotId)
    fetchData()
  }

  async function lancerTirage(){
    setTirageLoading(true)
    const ev=data.events[0]
    if(!ev){setTirageLoading(false);return}
    const eligibles=data.joueurs.filter(j=>j.optin)
    if(!eligibles.length){alert('Aucun participant éligible');setTirageLoading(false);return}
    const lotsLibres=data.lots.filter(l=>!l.assigne_a&&!l.retire)
    if(!lotsLibres.length){alert('Tous les lots sont déjà attribués');setTirageLoading(false);return}
    // Fisher-Yates
    const pool=[...eligibles].sort(()=>Math.random()-.5)
    const nb=Math.min(lotsLibres.length,pool.length)
    const gagnants=pool.slice(0,nb)
    setTirage(gagnants)
    // Écrire en Supabase
    for(let i=0;i<nb;i++){
      await supabase.from('lots').update({assigne_a:gagnants[i].id}).eq('id',lotsLibres[i].id)
    }
    await fetchData()
    setTirageLoading(false)
  }

  const ev=data.events[0]
  const c=ev?.couleur||'#3B5CC4'
  const participants=ev?.participants||data.joueurs.length
  const optins=data.joueurs.filter(j=>j.optin).length
  const txOptin=participants>0?Math.round(optins/participants*100):0
  const gagnants=ev?.gagnants||0
  const TABS=['Tableau de bord','Participants','Lots','QR Code','Tirage']

  if(loading)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0D1B2A'}}>
      <div style={{color:'#fff',textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:12}}>⚡</div>
        <div style={{fontFamily:'sans-serif'}}>Chargement...</div>
      </div>
    </div>
  )

  if(!proId)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0D1B2A',color:'#fff',fontFamily:'sans-serif',padding:20,textAlign:'center'}}>
      Accès non autorisé — paramètre <code style={{background:'rgba(255,255,255,.1)',padding:'2px 8px',borderRadius:4,margin:'0 4px'}}>?pro=ID</code> requis
    </div>
  )

  return(
    <div style={{background:'#0D1B2A',minHeight:'100vh',fontFamily:"'Inter',system-ui,sans-serif",color:'#fff',maxWidth:480,margin:'0 auto'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1a2a4a,#0D1B2A)',padding:'20px 16px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
        <div style={{fontSize:9,fontWeight:800,letterSpacing:2,color:'rgba(255,255,255,.4)',textTransform:'uppercase',marginBottom:3}}>{data.pro?.nom||'Dashboard Pro'}</div>
        <div style={{fontSize:17,fontWeight:700,marginBottom:14}}>{ev?.nom||'Événement'}</div>
        <div style={{display:'flex',gap:0,borderTop:'1px solid rgba(255,255,255,.08)',overflowX:'auto'}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flexShrink:0,padding:'10px 12px',border:'none',background:'transparent',color:tab===i?c:'rgba(255,255,255,.4)',fontWeight:tab===i?800:500,fontSize:9,letterSpacing:'.5px',textTransform:'uppercase',cursor:'pointer',borderBottom:tab===i?`2px solid ${c}`:'2px solid transparent',transition:'all .2s'}}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 0 — Dashboard */}
      {tab===0&&(
        <div style={{padding:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            {[{ico:'👥',val:participants,lbl:'Participants',col:'#00B4A0'},{ico:'✅',val:txOptin+'%',lbl:'Opt-in',col:'#10B981'},{ico:'📧',val:optins,lbl:'Inscrits',col:'#F59E0B'},{ico:'🏆',val:gagnants,lbl:'Gagnants',col:'#8B5CF6'}]
              .map((k,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,.06)',borderRadius:14,padding:14,border:'1px solid rgba(255,255,255,.08)'}}>
                <div style={{fontSize:18,marginBottom:6}}>{k.ico}</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:k.col,lineHeight:1}}>{k.val}</div>
                <div style={{fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'.1em',color:'rgba(255,255,255,.4)',marginTop:4}}>{k.lbl}</div>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(255,255,255,.04)',borderRadius:14,padding:14,border:'1px solid rgba(255,255,255,.06)'}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:1,color:'rgba(255,255,255,.4)',marginBottom:12}}>Derniers inscrits</div>
            {data.joueurs.slice().reverse().slice(0,6).map((j,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                <div style={{width:34,height:34,borderRadius:'50%',background:c,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:12,flexShrink:0}}>
                  {((j.prenom||'?')[0]+(j.nom||'?')[0]).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.prenom} {j.nom}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>{j.ville||j.email}</div>
                </div>
                {j.optin&&<span style={{fontSize:10,color:'#10B981',fontWeight:700}}>✅</span>}
              </div>
            ))}
            {!data.joueurs.length&&<div style={{color:'rgba(255,255,255,.3)',fontSize:13,textAlign:'center',padding:16}}>Aucun participant</div>}
          </div>
          <div style={{marginTop:12,textAlign:'center'}}>
            <button onClick={fetchData} style={{background:'rgba(255,255,255,.06)',color:'rgba(255,255,255,.5)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'8px 16px',fontSize:12,cursor:'pointer'}}>↻ Actualiser</button>
          </div>
        </div>
      )}

      {/* TAB 1 — Participants */}
      {tab===1&&(
        <div style={{padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{color:'rgba(255,255,255,.5)',fontSize:12}}>{data.joueurs.length} participant{data.joueurs.length>1?'s':''}</div>
            {data.joueurs.length>0&&(
              <button onClick={()=>exportCSV(data.joueurs,ev?.nom||'event')} style={{background:c,color:'#fff',border:'none',borderRadius:8,padding:'6px 12px',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                ⬇ Export CSV
              </button>
            )}
          </div>
          {data.joueurs.map((j,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:12,background:'rgba(255,255,255,.04)',borderRadius:10,marginBottom:8,border:'1px solid rgba(255,255,255,.06)'}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:c,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,flexShrink:0}}>
                {((j.prenom||'?')[0]+(j.nom||'?')[0]).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13}}>{j.prenom} {j.nom}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{j.email}</div>
                {j.ville&&<div style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{j.ville}</div>}
              </div>
              {j.optin&&<span style={{fontSize:11,color:'#10B981',fontWeight:700,flexShrink:0}}>✅</span>}
            </div>
          ))}
          {!data.joueurs.length&&<div style={{textAlign:'center',color:'rgba(255,255,255,.3)',padding:40}}>Aucun participant</div>}
        </div>
      )}

      {/* TAB 2 — Lots */}
      {tab===2&&(
        <div style={{padding:16}}>
          {data.lots.map((l,i)=>(
            <div key={i} style={{padding:14,background:'rgba(255,255,255,.04)',borderRadius:12,marginBottom:10,border:`1px solid ${l.assigne_a||l.retire?'rgba(16,185,129,.3)':'rgba(255,255,255,.06)'}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:24}}>{(l as any).emoji||'🎁'}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{l.titre}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>{l.valeur_euros?`${l.valeur_euros}€`:''}  · qté {l.quantite}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:l.retire?'rgba(16,185,129,.3)':l.assigne_a?'rgba(139,92,246,.3)':'rgba(255,255,255,.08)',color:l.retire?'#10B981':l.assigne_a?'#A78BFA':'rgba(255,255,255,.5)'}}>
                    {l.retire?'Retiré':l.assigne_a?'Attribué':'Disponible'}
                  </div>
                  {l.assigne_a&&!l.retire&&(
                    <button onClick={()=>retirerLot(l.id)} style={{marginTop:6,display:'block',background:'rgba(16,185,129,.2)',color:'#10B981',border:'none',borderRadius:8,padding:'4px 10px',fontSize:10,fontWeight:700,cursor:'pointer',width:'100%'}}>
                      ✓ Marquer remis
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!data.lots.length&&<div style={{textAlign:'center',color:'rgba(255,255,255,.3)',padding:40}}>Aucun lot configuré</div>}
        </div>
      )}

      {/* TAB 3 — QR */}
      {tab===3&&(
        <div style={{padding:16,textAlign:'center'}}>
          <div style={{background:'rgba(255,255,255,.04)',borderRadius:16,padding:24,border:'1px solid rgba(255,255,255,.08)'}}>
            <div style={{marginBottom:16,fontWeight:700,fontSize:15}}>{ev?.nom}</div>
            {ev?.cfg&&(ev.cfg as any).qrUrl?(
              <>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent((ev.cfg as any).qrUrl)}&color=${(ev?.couleur||'#3B5CC4').replace('#','')}&bgcolor=ffffff`}
                  alt="QR" style={{borderRadius:12,border:'4px solid #fff',marginBottom:16}}/>
                <div style={{fontSize:11,color:'rgba(255,255,255,.4)',wordBreak:'break-all',marginBottom:14}}>{(ev.cfg as any).qrUrl}</div>
                <button onClick={()=>navigator.clipboard?.writeText((ev.cfg as any).qrUrl)} style={{background:c,color:'#fff',border:'none',borderRadius:10,padding:'12px 24px',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                  Copier le lien
                </button>
              </>
            ):<div style={{color:'rgba(255,255,255,.3)'}}>QR non configuré</div>}
          </div>
        </div>
      )}

      {/* TAB 4 — Tirage */}
      {tab===4&&(
        <div style={{padding:16}}>
          <div style={{background:'rgba(255,255,255,.04)',borderRadius:14,padding:16,border:'1px solid rgba(255,255,255,.08)',marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,.6)',marginBottom:12}}>
              {data.joueurs.filter(j=>j.optin).length} participants éligibles · {data.lots.filter(l=>!l.assigne_a&&!l.retire).length} lots disponibles
            </div>
            <button onClick={lancerTirage} disabled={tirageLoading} style={{width:'100%',padding:14,background:`linear-gradient(135deg,${c},#8B5CF6)`,color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:15,cursor:tirageLoading?'not-allowed':'pointer',opacity:tirageLoading?.6:1}}>
              {tirageLoading?'⏳ Tirage en cours...':'🎲 Lancer le tirage'}
            </button>
          </div>
          {tirage.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:1,color:'rgba(255,255,255,.4)',marginBottom:12}}>🏆 Gagnants</div>
              {tirage.map((j,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:12,background:'rgba(139,92,246,.1)',borderRadius:10,marginBottom:8,border:'1px solid rgba(139,92,246,.3)'}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'#8B5CF6',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14}}>
                    {((j.prenom||'?')[0]+(j.nom||'?')[0]).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{j.prenom} {j.nom}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>{j.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.lots.filter(l=>l.assigne_a).length>0&&tirage.length===0&&(
            <div>
              <div style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:1,color:'rgba(255,255,255,.4)',marginBottom:12}}>Tirage précédent</div>
              {data.lots.filter(l=>l.assigne_a).map((l,i)=>(
                <div key={i} style={{padding:12,background:'rgba(255,255,255,.04)',borderRadius:10,marginBottom:8,fontSize:13}}>
                  <span style={{fontSize:18}}>{(l as any).emoji||'🎁'}</span> {l.titre}
                  <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:2}}>Attribué · {l.assigne_a?.slice(0,8)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
