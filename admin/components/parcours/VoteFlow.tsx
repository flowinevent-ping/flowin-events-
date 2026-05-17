'use client'
import { useState } from 'react'
import { SUPA_URL, SUPA_ANON } from '@/lib/supabase'

interface Section { id?: string; titre?: string; nom?: string; emoji?: string }
interface VoteEvent { id: string; nom: string; lieu: string; couleur: string; cfg: any }
interface FormData { prenom: string; email: string; optin: boolean }

function extId(e: string) { return 'j-' + e.toLowerCase().trim().replace(/[^a-z0-9]/g,'-').substring(0,40) }

export default function VoteFlow({ ev }: { ev: VoteEvent }) {
  const sections: Section[] = ev.cfg?.voteSections || []
  const [screen, setScreen] = useState<'landing'|'vote'|'form'|'done'>('landing')
  const [votes, setVotes] = useState<Record<string,number>>({})
  const [form, setForm] = useState<FormData>({prenom:'',email:'',optin:false})
  const c = ev.couleur || '#7C2D92'
  const currentIdx = Object.keys(votes).length
  const currentSec = sections[currentIdx]

  async function submit() {
    if (!form.email) return
    const date = new Date().toISOString().slice(0,10)
    try {
      await fetch(`${SUPA_URL}/rest/v1/joueurs?on_conflict=external_id`, {
        method:'POST',
        headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
        body: JSON.stringify({ external_id:extId(form.email), email:form.email.toLowerCase().trim(), prenom:form.prenom, optin:form.optin, optin_date:form.optin?date:null, events:[ev.id], client_type:'btoc', first_seen:date, last_seen:date })
      })
      Object.entries(votes).forEach(([secId, note]) => {
        fetch(`${SUPA_URL}/rest/v1/votes`, {
          method:'POST',
          headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'return=minimal'},
          body: JSON.stringify({ event_id:ev.id, section_id:secId, note })
        }).catch(e=>console.warn('[vote]',e))
      })
    } catch(e) { console.warn('[vote submit]', e) }
    setScreen('done')
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:430,margin:'0 auto',minHeight:'100vh',background:`linear-gradient(160deg,${c} 0%,#1a1a3e 100%)`,color:'#fff'}}>
        {screen==='landing' && (
          <div style={{padding:32,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:16}}>⭐</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:36,marginBottom:8}}>{ev.nom}</div>
            <div style={{fontSize:14,color:'rgba(255,255,255,.7)',marginBottom:32}}>{ev.lieu} · Note les artistes</div>
            <button onClick={()=>setScreen('vote')} style={{width:'100%',padding:16,background:'rgba(255,255,255,.2)',color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:18,border:'2px solid rgba(255,255,255,.4)',borderRadius:16,cursor:'pointer',backdropFilter:'blur(10px)'}}>
              ⭐ Donner mes étoiles →
            </button>
          </div>
        )}
        {screen==='vote' && currentSec && (
          <div style={{padding:24}}>
            <div style={{fontSize:11,fontWeight:900,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:2,marginBottom:8}}>
              {currentIdx+1} / {sections.length}
            </div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,marginBottom:24}}>
              {currentSec.emoji||'🎵'} {currentSec.titre||currentSec.nom}
            </div>
            <div style={{fontSize:14,fontWeight:800,color:'rgba(255,255,255,.7)',marginBottom:16}}>Ta note :</div>
            <div style={{display:'flex',gap:12,justifyContent:'center',marginBottom:32}}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={()=>{
                  const id = currentSec.id||String(currentIdx)
                  setVotes(v=>({...v,[id]:n}))
                  setTimeout(()=>{ if(currentIdx+1>=sections.length) setScreen('form'); }, 300)
                }}
                style={{fontSize:40,background:'none',border:'none',cursor:'pointer',opacity:votes[currentSec.id||String(currentIdx)]>=n?1:.3,filter:votes[currentSec.id||String(currentIdx)]>=n?'none':'grayscale(1)',transition:'all .1s'}}>
                  ⭐
                </button>
              ))}
            </div>
          </div>
        )}
        {screen==='form' && (
          <div style={{padding:24}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:24,marginBottom:8}}>Tes infos</div>
            <div style={{fontSize:13,color:'rgba(255,255,255,.6)',marginBottom:20}}>Pour être tenu au courant des résultats</div>
            {(['prenom','email'] as const).map(f=>(
              <input key={f} placeholder={f.charAt(0).toUpperCase()+f.slice(1)+(f==='email'?' *':'')}
                value={form[f] as string} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))}
                type={f==='email'?'email':'text'}
                style={{width:'100%',padding:'13px 14px',borderRadius:12,border:'1.5px solid rgba(255,255,255,.2)',fontSize:14,marginBottom:10,boxSizing:'border-box' as any,background:'rgba(255,255,255,.1)',color:'#fff'}}/>
            ))}
            <label style={{display:'flex',gap:8,alignItems:'center',marginBottom:20,fontSize:12,color:'rgba(255,255,255,.6)'}}>
              <input type="checkbox" checked={form.optin} onChange={e=>setForm(f=>({...f,optin:e.target.checked}))}/> Opt-in newsletter
            </label>
            <button onClick={submit} style={{width:'100%',padding:16,background:'rgba(255,255,255,.2)',color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:16,border:'2px solid rgba(255,255,255,.3)',borderRadius:14,cursor:'pointer'}}>
              Envoyer mes votes →
            </button>
          </div>
        )}
        {screen==='done' && (
          <div style={{padding:48,textAlign:'center'}}>
            <div style={{fontSize:72,marginBottom:16}}>✅</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,marginBottom:8}}>Votes enregistrés !</div>
            <div style={{fontSize:14,color:'rgba(255,255,255,.7)'}}>Merci pour ta participation 🎉</div>
          </div>
        )}
      </div>
    </>
  )
}
