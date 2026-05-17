'use client'
import { useState, useEffect } from 'react'
import { SUPA_URL, SUPA_ANON } from '@/lib/supabase'

interface TombolaEvent { id: string; nom: string; lieu: string; couleur: string; cfg: any; lots: any[] }
interface FormData { prenom: string; nom: string; email: string; tel: string; ville: string; ddn: string; optin: boolean }

function extId(e: string) { return 'j-' + e.toLowerCase().trim().replace(/[^a-z0-9]/g,'-').substring(0,40) }
function checkPlayed(evId: string) { try { return !!localStorage.getItem('flowin_played_'+evId) } catch { return false } }
function markPlayed(evId: string, email: string, ticket: string) { try { localStorage.setItem('flowin_played_'+evId, JSON.stringify({email,ticket,ts:Date.now()})) } catch {} }
function genTicket() { return 'TB-' + new Date().getFullYear() + '-' + Math.floor(1000+Math.random()*8999) }

export default function TombolaFlow({ ev }: { ev: TombolaEvent }) {
  const [screen, setScreen] = useState<'played'|'landing'|'form'|'confirm'>('landing')
  const [form, setForm] = useState<FormData>({prenom:'',nom:'',email:'',tel:'',ville:'',ddn:'',optin:false})
  const [ticket] = useState(genTicket())
  const [err, setErr] = useState('')
  const c = ev.couleur || '#EF9F27'

  async function submit() {
    if (!form.prenom||!form.email) { setErr('Prénom et email requis'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr('Email invalide'); return }
    const date = new Date().toISOString().slice(0,10)
    try {
      await fetch(`${SUPA_URL}/rest/v1/joueurs?on_conflict=external_id`, {
        method:'POST',
        headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
        body: JSON.stringify({ external_id:extId(form.email), email:form.email.toLowerCase().trim(), prenom:form.prenom, nom:form.nom, tel:form.tel, ville:form.ville, ddn:form.ddn||null, optin:form.optin, optin_date:form.optin?date:null, events:[ev.id], client_type:'btoc', first_seen:date, last_seen:date, source:'parcours-tombola' })
      })
      await fetch(`${SUPA_URL}/rest/v1/participations`, {
        method:'POST',
        headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'return=minimal'},
        body: JSON.stringify({ event_id:ev.id, ticket_code:ticket, completed:true })
      })
      markPlayed(ev.id, form.email, ticket)
  } catch(e) { console.warn('[tombola]', e) }
    setScreen('confirm')
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:430,margin:'0 auto',minHeight:'100vh',background:`linear-gradient(160deg,#FFF9F0,#FFF3E0)`}}>
        {screen==='played' && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:24,textAlign:'center'}}>
            <div style={{fontSize:64,marginBottom:12}}>🎟️</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:24,color:c}}>Tu as déjà participé !</div>
            <div style={{fontSize:13,fontWeight:700,color:'#666',marginTop:8,fontFamily:'sans-serif'}}>Bonne chance pour le tirage 🍀</div>
            <div style={{fontSize:13,fontWeight:700,color:'#666',marginTop:12,fontFamily:'sans-serif'}}>Bonne chance ! 🍀</div>
          </div>
        )}
        {screen==='landing' && (
          <div style={{padding:28,textAlign:'center'}}>
            <div style={{fontSize:64,marginBottom:8}}>🎟️</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:36,color:c,marginBottom:8}}>{ev.nom}</div>
            <div style={{fontSize:14,color:'#888',marginBottom:16}}>{ev.lieu}</div>
            {ev.lots?.slice(0,3).map((l:any,i:number)=>(
              <div key={i} style={{background:'#fff',borderRadius:12,padding:'12px 16px',marginBottom:8,border:'1px solid rgba(239,159,39,.2)',textAlign:'left',display:'flex',gap:10,alignItems:'center'}}>
                <span style={{fontSize:22}}>{l.emoji||'🎁'}</span>
                <div>
                  <div style={{fontWeight:800,fontSize:13,color:'#1a1a2e'}}>{l.titre}</div>
                  {l.partenaire && <div style={{fontSize:11,color:'#1D9E75',fontWeight:700}}>Offert par {l.partenaire}</div>}
                </div>
              </div>
            ))}
            {ev.cfg?.tirageDate && <div style={{fontSize:12,color:'#888',margin:'12px 0'}}>🗓️ Tirage : {ev.cfg.tirageDate}</div>}
            <button onClick={()=>setScreen('form')} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#D4537E)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:18,border:'none',borderRadius:16,cursor:'pointer',marginTop:8}}>
              🎟️ Participer gratuitement →
            </button>
          </div>
        )}
        {screen==='form' && (
          <div style={{padding:24}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:24,color:c,marginBottom:16}}>Tes infos</div>
            {[{f:'prenom',ph:'Prénom *'},{f:'nom',ph:'Nom *'},{f:'email',ph:'Email *'},{f:'tel',ph:'Téléphone'},{f:'ville',ph:'Ville'}].map(({f,ph})=>(
              <input key={f} placeholder={ph}
                value={(form as any)[f]} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))}
                type={f==='email'?'email':'text'}
                style={{width:'100%',padding:'13px 14px',borderRadius:12,border:'1.5px solid #e5e7eb',fontSize:14,marginBottom:10,boxSizing:'border-box' as any}}/>
            ))}
            <label style={{display:'flex',gap:8,alignItems:'center',marginBottom:16,fontSize:12,color:'#666'}}>
              <input type="checkbox" checked={form.optin} onChange={e=>setForm(f=>({...f,optin:e.target.checked}))}/> Opt-in newsletter
            </label>
            {err && <div style={{color:'#D4537E',fontSize:13,fontWeight:800,marginBottom:12}}>⚠️ {err}</div>}
            <button onClick={submit} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#D4537E)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:16,border:'none',borderRadius:14,cursor:'pointer'}}>
              Valider ma participation →
            </button>
          </div>
        )}
        {screen==='confirm' && (
          <div style={{padding:48,textAlign:'center'}}>
            <div style={{fontSize:72,marginBottom:16}}>🎟️</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,color:c,marginBottom:8}}>Tu es dans le tirage !</div>
            <div style={{background:'#fff',borderRadius:16,padding:20,border:`1.5px dashed ${c}`,margin:'16px 0'}}>
              <div style={{fontSize:10,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>🎟️ Ton code</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,color:'#1a1a2e'}}>{ticket}</div>
            </div>
            {ev.cfg?.tirageDate && <div style={{fontSize:13,color:'#888'}}>Tirage : {ev.cfg.tirageDate}</div>}
          </div>
        )}
      </div>
    </>
  )
}
