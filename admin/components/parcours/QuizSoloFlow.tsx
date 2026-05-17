'use client'
import { useState, useEffect, useRef } from 'react'
import { SUPA_URL, SUPA_ANON } from '@/lib/supabase'

interface Question { texte:string; options:string[]; bonne:number; points?:number }
interface Ev { id:string; nom:string; lieu:string; couleur:string; score_min:number; cfg:any; lots:any[]; questions:Question[] }
interface Form { prenom:string; email:string; optin:boolean }

function extId(e:string){return 'j-'+e.toLowerCase().trim().replace(/[^a-z0-9]/g,'-').substring(0,40)}
function genTicket(id:string){return id.slice(0,4).toUpperCase()+'-'+new Date().getFullYear()+'-'+Math.floor(1000+Math.random()*8999)}
function checkPlayed(id:string){try{return!!localStorage.getItem('flowin_played_'+id)}catch{return false}}
function markPlayed(id:string,e:string,t:string){try{localStorage.setItem('flowin_played_'+id,JSON.stringify({e,t,ts:Date.now()}))}catch{}}

export default function QuizSoloFlow({ev}:{ev:Ev}){
  const [screen,setScreen]=useState<'played'|'landing'|'form'|'quiz'|'done'>('landing')
  const [form,setForm]=useState<Form>({prenom:'',email:'',optin:false})
  const [idx,setIdx]=useState(0)
  const [sel,setSel]=useState<number|null>(null)
  const [revealed,setRevealed]=useState(false)
  const [score,setScore]=useState(0)
  const [timer,setTimer]=useState(ev.cfg?.timerQuestion||20)
  const [ticket]=useState(()=>genTicket(ev.id))
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null)
  const c=ev.couleur||'#3B5CC4'
  const qs=ev.questions||[]

  useEffect(()=>{if(checkPlayed(ev.id))setScreen('played')},[ev.id])

  useEffect(()=>{
    if(screen!=='quiz')return
    const t=ev.cfg?.timerQuestion||20
    setTimer(t);setSel(null);setRevealed(false)
    if(timerRef.current)clearInterval(timerRef.current)
    timerRef.current=setInterval(()=>setTimer((p:number)=>{
      if(p<=1){handleReveal(null);return 0}
      return p-1
    }),1000)
    return()=>{if(timerRef.current)clearInterval(timerRef.current)}
  },[idx,screen])

  function handleReveal(chosen:number|null){
    if(revealed)return
    setRevealed(true);setSel(chosen)
    if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}
    const q=qs[idx]
    if(chosen===q.bonne)setScore(s=>s+(q.points||1))
  }

  function next(){
    if(idx+1>=qs.length)finish()
    else setIdx(i=>i+1)
  }

  async function finish(){
    setScreen('done')
    const date=new Date().toISOString().slice(0,10)
    try{
      await fetch(`${SUPA_URL}/rest/v1/joueurs?on_conflict=external_id`,{method:'POST',headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({external_id:extId(form.email),email:form.email.toLowerCase().trim(),prenom:form.prenom,optin:form.optin,optin_date:form.optin?date:null,events:[ev.id],client_type:'btoc',first_seen:date,last_seen:date})})
      await fetch(`${SUPA_URL}/rest/v1/participations`,{method:'POST',headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({event_id:ev.id,score,ticket_code:ticket,completed:true})})
      markPlayed(ev.id,form.email,ticket)
    }catch(e){console.warn('[quizsolo]',e)}
  }

  const q=qs[idx]
  const won=score>=(ev.score_min||3)

  if(screen==='played')return(
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg,${c}22,#fff)`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center',fontFamily:"'Fredoka One',cursive"}}>
      <div style={{fontSize:64,marginBottom:12}}>🎟️</div>
      <div style={{fontSize:24,color:c}}>Tu as déjà participé !</div>
      <div style={{fontSize:14,fontWeight:700,color:'#666',marginTop:8,fontFamily:'sans-serif'}}>Bonne chance pour le tirage 🍀</div>
    </div>
  )

  if(screen==='landing')return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet"/>
      <div style={{minHeight:'100vh',background:`linear-gradient(160deg,${c}11,#f8f8ff)`,padding:28,fontFamily:"'Fredoka One',cursive",textAlign:'center'}}>
        <div style={{fontSize:42,color:c,marginBottom:8}}>{ev.nom}</div>
        <div style={{fontSize:16,color:'#888',fontFamily:"'Nunito',sans-serif",marginBottom:28}}>{ev.lieu} · Quiz chronométré</div>
        {ev.lots?.slice(0,2).map((l:any,i:number)=>(
          <div key={i} style={{background:'#fff',borderRadius:12,padding:'10px 14px',marginBottom:8,textAlign:'left',display:'flex',gap:8,alignItems:'center',border:`1px solid ${c}22`}}>
            <span style={{fontSize:20}}>{l.emoji||'🎁'}</span>
            <span style={{fontSize:13,fontWeight:800,fontFamily:"'Nunito',sans-serif",color:'#1a1a2e'}}>{l.titre}</span>
          </div>
        ))}
        <button onClick={()=>setScreen('form')} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#8B5CF6)`,color:'#fff',fontSize:18,border:'none',borderRadius:16,cursor:'pointer',marginTop:16}}>
          ⏱ Relever le défi !
        </button>
      </div>
    </>
  )

  if(screen==='form')return(
    <div style={{minHeight:'100vh',background:`linear-gradient(160deg,${c}11,#f8f8ff)`,padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:24,color:c,marginBottom:16}}>Tes infos</div>
      {([['prenom','Prénom *','text'],['email','Email *','email']] as const).map(([f,ph,t])=>(
        <input key={f} type={t} placeholder={ph} value={(form as any)[f]} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))}
          style={{width:'100%',padding:'13px 14px',borderRadius:12,border:'1.5px solid #e5e7eb',fontSize:14,marginBottom:10,boxSizing:'border-box' as any}}/>
      ))}
      <label style={{display:'flex',gap:8,alignItems:'center',marginBottom:20,fontSize:12,color:'#666'}}>
        <input type="checkbox" checked={form.optin} onChange={e=>setForm(f=>({...f,optin:e.target.checked}))}/> Opt-in newsletter
      </label>
      <button onClick={()=>{if(form.prenom&&form.email)setScreen('quiz')}} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#8B5CF6)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:16,border:'none',borderRadius:14,cursor:'pointer'}}>
        Lancer le chrono ⏱
      </button>
    </div>
  )

  if(screen==='quiz'&&q)return(
    <div style={{minHeight:'100vh',background:`linear-gradient(160deg,${c}11,#f8f8ff)`,padding:'16px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:12,fontWeight:900,color:c}}>{idx+1}/{qs.length}</span>
        <span style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:timer<=5?'#EF4444':c,background:timer<=5?'#FFF5F5':`${c}11`,padding:'4px 12px',borderRadius:20}}>⏱ {timer}s</span>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:16}}>
        {qs.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:100,background:i<idx?c:i===idx?c+'88':'#e5e7eb'}}/>)}
      </div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:'#1a1a2e',marginBottom:18,lineHeight:1.25}}>{q.texte}</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {q.options.map((opt,i)=>{
          let bg='#fff',border=`1.5px solid ${c}33`,color='#1a1a2e'
          if(revealed){
            if(i===q.bonne){bg='#F0FDF4';color='#16A34A';border='2px solid #22C55E'}
            else if(i===sel){bg='#FFF1F2';color='#EF4444';border='2px solid #FECACA'}
            else{bg='#F9FAFB';color='#9CA3AF';border='1.5px solid #E5E7EB'}
          }
          return(
            <button key={i} onClick={()=>{if(!revealed)handleReveal(i)}}
              style={{background:bg,border,borderRadius:12,padding:'13px 16px',fontSize:14,fontWeight:800,color,cursor:revealed?'default':'pointer',textAlign:'left',width:'100%',fontFamily:"'Nunito',sans-serif"}}>
              {opt}
            </button>
          )
        })}
      </div>
      {revealed&&<button onClick={next} style={{marginTop:16,width:'100%',padding:14,background:`linear-gradient(135deg,${c},#8B5CF6)`,color:'#fff',border:'none',borderRadius:12,fontFamily:"'Fredoka One',cursive",fontSize:16,cursor:'pointer'}}>
        {idx+1>=qs.length?'Voir le résultat →':'Suivant →'}
      </button>}
    </div>
  )

  if(screen==='done')return(
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#FBEAF0,#E8F8F2)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{fontSize:72,marginBottom:12}}>{won?'🏆':'🌸'}</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,color:c,marginBottom:8}}>{won?'Excellent !':'Merci !'}</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:'#1D9E75',marginBottom:16}}>Score : {score}/{qs.length}</div>
      {won&&<div style={{background:'#fff',borderRadius:16,padding:16,border:`1.5px dashed ${c}`,width:'100%',boxSizing:'border-box' as any,marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>🎟️ Ton code</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:26,color:'#1a1a2e'}}>{ticket}</div>
      </div>}
      <div style={{fontSize:12,color:'#888',fontFamily:'sans-serif'}}>✅ Participation enregistrée · Bonne chance ! 🍀</div>
    </div>
  )

  return null
}
