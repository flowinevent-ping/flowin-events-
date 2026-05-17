'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { SUPA_URL, SUPA_ANON } from '@/lib/supabase'

interface Question { texte: string; options: string[]; bonne: number; points?: number; explication?: string }
interface Lot { id: string; titre: string; emoji: string; valeur_euros: number; partenaire?: string }
interface EventData {
  id: string; nom: string; lieu: string; couleur: string
  date_d: string; date_f: string; description: string; score_min: number
  cfg: any; lots: Lot[]; questions: Question[]
}
interface FormData { prenom: string; nom: string; email: string; tel: string; ville: string; optin: boolean }
type Screen = 'already'|'landing'|'form'|'quiz'|'score'|'confirm'

function fmtDate(d: string) {
  if (!d) return ''
  try { return new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) }
  catch { return d }
}
function genTicket(evId: string) {
  const prefix = evId.split('-').slice(0,2).map((s:string)=>s.toUpperCase().slice(0,2)).join('')
  return prefix+'-'+new Date().getFullYear()+'-'+Math.floor(1000+Math.random()*8999)
}
function extId(email: string) {
  return 'j-'+email.toLowerCase().trim().replace(/[^a-z0-9]/g,'-').substring(0,40)
}
function checkAlreadyPlayed(evId: string): boolean {
  try { return !!localStorage.getItem('flowin_played_'+evId) } catch { return false }
}
function markPlayed(evId: string, email: string, ticket: string) {
  try { localStorage.setItem('flowin_played_'+evId, JSON.stringify({email,ticket,ts:Date.now()})) } catch {}
}
async function writeSupabase(ev: EventData, form: FormData, score: number, correct: number, ticket: string) {
  const date = new Date().toISOString().slice(0,10)
  try {
    await fetch(`${SUPA_URL}/rest/v1/joueurs?on_conflict=external_id`,{
      method:'POST',
      headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({external_id:extId(form.email),email:form.email.toLowerCase().trim(),prenom:form.prenom,nom:form.nom,tel:form.tel,ville:form.ville,optin:form.optin,optin_date:form.optin?date:null,events:[ev.id],client_type:'btoc',first_seen:date,last_seen:date,source:'parcours-quiz'})
    })
    await fetch(`${SUPA_URL}/rest/v1/participations`,{
      method:'POST',
      headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'return=minimal'},
      body:JSON.stringify({event_id:ev.id,score,ticket_code:ticket,completed:true,tickets:score>=(ev.score_min||3)?1:0})
    })
    markPlayed(ev.id, form.email, ticket)
  } catch(e){ console.warn('[quiz supa]',e) }
}

/* ── LANDING ── */
function Landing({ev,onStart}:{ev:EventData;onStart:()=>void}) {
  const c=ev.couleur||'#D4537E'
  const d1=fmtDate(ev.date_d), d2=fmtDate(ev.date_f)
  const dates=d1===d2||!d2?d1:d1+' — '+d2
  // Dédupliquer les lots par titre, agréger les quantités
  const lots=(()=>{
    const seen:Record<string,any>={};
    (ev.lots||[]).forEach((l:any)=>{
      if(seen[l.titre]) seen[l.titre].quantite=(seen[l.titre].quantite||1)+1;
      else seen[l.titre]={...l};
    });
    return Object.values(seen).slice(0,3);
  })()
  return (
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)'}}>
      <div style={{height:4,background:`linear-gradient(90deg,${c},#EF9F27,#1D9E75,${c})`}}/>
      <div style={{padding:'28px 22px 16px',textAlign:'center'}}>
        <div style={{fontSize:9,fontWeight:900,color:'#1D9E75',textTransform:'uppercase',letterSpacing:'.18em',marginBottom:14}}>{ev.cfg?.subtitle||ev.description||ev.lieu} · {ev.cfg?.organisateur||'Flowin'}</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:42,color:c,lineHeight:.95,marginBottom:12}}
          dangerouslySetInnerHTML={{__html:ev.nom.replace(' ','<br/>')}}/>
        <div style={{fontFamily:"'Nunito',sans-serif",fontSize:16,fontWeight:900,color:'#EF9F27',marginBottom:16}}>{ev.cfg?.datesLabel||dates}</div>
        <div style={{fontSize:24,letterSpacing:8,opacity:.55}}>🥚 🦋 🌸 🌻</div>
      </div>
      <div style={{height:3,background:`linear-gradient(90deg,${c},#EF9F27,#1D9E75,${c})`}}/>
      {lots.length>0&&(
        <div style={{padding:'14px 18px 0'}}>
          <div style={{fontSize:9,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:'.15em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}}/>À gagner
          </div>
          {lots.map((l,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,.9)',borderRadius:14,padding:'12px 14px',marginBottom:8,display:'flex',alignItems:'center',gap:10,border:`1px solid rgba(212,83,126,.12)`,boxShadow:'0 1px 4px rgba(212,83,126,.08)'}}>
              <div style={{width:34,height:34,borderRadius:10,background:'#FBEAF0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{l.emoji||'🎁'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:'#4B1528'}}>{l.titre}</div>
                <div style={{fontSize:11,fontWeight:700,color:'rgba(75,21,40,.5)'}}>{(l.quantite||1)} à gagner</div>
                {l.partenaire&&<div style={{fontSize:11,fontWeight:700,color:'#1D9E75'}}>Offert par {l.partenaire}</div>}
              </div>
            </div>
          ))}
          {ev.cfg?.tirageDate&&<div style={{fontSize:11,fontWeight:700,color:'#72243E',padding:'8px 0',borderTop:'1px solid rgba(212,83,126,.12)',marginTop:4}}>🗓️ Tirage : {ev.cfg.tirageDate}</div>}
        </div>
      )}
      <div style={{padding:'12px 18px 8px'}}>
        <button onClick={onStart} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#EF9F27)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:17,border:'none',borderRadius:16,cursor:'pointer',boxShadow:`0 8px 22px rgba(212,83,126,.3)`}}>
          🎮 Participer gratuitement
        </button>
        <div style={{textAlign:'center',fontSize:10,color:'#bbb',marginTop:7,fontWeight:700}}>Jeu gratuit · Sans achat obligatoire</div>
      </div>
      <div style={{textAlign:'center',padding:'12px 0 20px',borderTop:'1px solid rgba(212,83,126,.1)',marginTop:8}}>
        <div style={{fontSize:9,color:'#ccc',letterSpacing:'.06em',fontWeight:700}}>Conçu par OPConsult · © 2026</div>
      </div>
    </div>
  )
}

/* ── FORM ── */
function Form({ev,onSubmit}:{ev:EventData;onSubmit:(f:FormData)=>void}) {
  const [f,setF]=useState<FormData>({prenom:'',nom:'',email:'',tel:'',ville:'',optin:false})
  const [err,setErr]=useState('')
  const c=ev.couleur||'#D4537E'
  function go(){
    if(!f.prenom.trim()||!f.email.trim()){setErr('Prénom et email requis');return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)){setErr('Email invalide');return}
    onSubmit(f)
  }
  const inp=(field:keyof FormData,ph:string,type='text')=>(
    <input key={field} type={type} placeholder={ph} value={f[field] as string}
      onChange={e=>setF(x=>({...x,[field]:e.target.value}))}
      style={{width:'100%',padding:'13px 14px',borderRadius:12,border:'1.5px solid #E8D5DC',fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:700,color:'#4B1528',background:'#fff',boxSizing:'border-box',outline:'none',marginBottom:10}}/>
  )
  return (
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)'}}>
      <div style={{height:4,background:`linear-gradient(90deg,${c},#EF9F27,#1D9E75)`}}/>
      <div style={{padding:20}}>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:'#4B1528',marginBottom:4}}>Tes infos pour participer</div>
        <div style={{fontSize:12,fontWeight:800,color:'#72243E',marginBottom:16}}>Remplis le formulaire pour entrer dans le tirage !</div>
        {inp('prenom','Prénom *')}
        {inp('nom','Nom')}
        {inp('email','Email *','email')}
        {inp('tel','Téléphone')}
        {inp('ville','Ville')}
        <label style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:12,cursor:'pointer'}}>
          <input type="checkbox" checked={f.optin} onChange={e=>setF(x=>({...x,optin:e.target.checked}))} style={{marginTop:2,width:18,height:18,accentColor:c,flexShrink:0}}/>
          <span style={{fontSize:11,fontWeight:700,color:'#72243E',lineHeight:1.4}}>J&apos;accepte de recevoir les prochains événements par email (optionnel)</span>
        </label>
        <div style={{fontSize:10,color:'#aaa',fontWeight:700,marginBottom:14,lineHeight:1.5}}>En participant, vous certifiez être majeur et acceptez le règlement.</div>
        {err&&<div style={{color:'#D4537E',fontSize:12,fontWeight:800,marginBottom:12}}>⚠️ {err}</div>}
        <button onClick={go} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#EF9F27)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:16,border:'none',borderRadius:14,cursor:'pointer',boxShadow:`0 8px 20px rgba(212,83,126,.3)`}}>
          C&apos;est parti ! →
        </button>
      </div>
    </div>
  )
}

/* ── QUIZ ── */
function Quiz({ev,questions,onDone}:{ev:EventData;questions:Question[];onDone:(score:number,correct:number)=>void}) {
  const [idx,setIdx]=useState(0)
  const [sel,setSel]=useState<number|null>(null)
  const [revealed,setRevealed]=useState(false)
  const [scores,setScores]=useState<{score:number;correct:number}>({score:0,correct:0})
  const [timer,setTimer]=useState(ev.cfg?.timerQuestion||30)
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null)
  const c=ev.couleur||'#D4537E'
  const q=questions[idx]
  const total=questions.length

  const reveal=useCallback((chosen:number|null)=>{
    if(revealed)return
    setRevealed(true)
    setSel(chosen)
    if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null}
    if(chosen!==null&&chosen===q.bonne){
      setScores(s=>({score:s.score+(q.points||1),correct:s.correct+1}))
    }
  },[revealed,q])

  useEffect(()=>{
    const t=ev.cfg?.timerQuestion||30
    setTimer(t);setRevealed(false);setSel(null)
    if(timerRef.current)clearInterval(timerRef.current)
    timerRef.current=setInterval(()=>{
      setTimer((prev:number)=>{
        if(prev<=1){reveal(null);return 0}
        return prev-1
      })
    },1000)
    return()=>{if(timerRef.current)clearInterval(timerRef.current)}
  },[idx])

  function next(){
    const isLast=idx+1>=total
    const bonus=revealed&&sel===q.bonne?(q.points||1):0
    const corrBonus=revealed&&sel===q.bonne?1:0
    if(isLast){
      onDone(scores.score+bonus,scores.correct+corrBonus)
    } else {
      setIdx(i=>i+1)
    }
  }

  return (
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)',paddingTop:12}}>
      <div style={{padding:'14px 20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:10,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:'.1em'}}>Question {idx+1}/{total}</span>
          <span style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:timer<=5?'#EF4444':c}}>⏱ {timer}s</span>
        </div>
        <div style={{display:'flex',gap:5}}>
          {questions.map((_,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:100,background:i<idx?'#1D9E75':i===idx?c:'rgba(212,83,126,.2)',transition:'background .3s'}}/>
          ))}
        </div>
      </div>
      <div style={{padding:'8px 20px 20px'}}>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:'#4B1528',lineHeight:1.25,marginBottom:20}}>{q.texte}</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {q.options.map((opt,i)=>{
            let bg='#fff',border='1.5px solid #BFDBFE',color='#1a1a2e'
            if(revealed){
              if(i===q.bonne){bg='#F0FDF4';color='#16A34A';border='2px solid #22C55E'}
              else if(i===sel){bg='#FFF1F2';color='#EF4444';border='2px solid #FECACA'}
              else{bg='#F9FAFB';color='#9CA3AF';border='1.5px solid #E5E7EB'}
            }else if(i===sel){border='2px solid '+c;color=c}
            return(
              <button key={i} onClick={()=>{if(!revealed)reveal(i)}}
                style={{background:bg,border,borderRadius:13,padding:'14px 16px',fontSize:14,fontWeight:800,color,cursor:revealed?'default':'pointer',textAlign:'left',width:'100%',fontFamily:"'Nunito',sans-serif",transition:'all .15s',boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
                {opt}
              </button>
            )
          })}
        </div>
        {revealed&&(
          <div style={{marginTop:14,borderRadius:13,padding:'13px 16px',display:'flex',alignItems:'center',gap:12,
            background:sel===q.bonne?'#F0FDF4':'#FFF5F5',border:`1.5px solid ${sel===q.bonne?'#86EFAC':'#FECACA'}`}}>
            <span style={{fontSize:22}}>{sel===q.bonne?'✅':'❌'}</span>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:'#1a1a2e'}}>{sel===q.bonne?'Bonne réponse !':'Pas tout à fait...'}</div>
              <div style={{fontSize:14,fontWeight:900,color:'#16A34A',marginTop:2}}>{q.options[q.bonne]}</div>
              {q.explication&&<div style={{fontSize:11,color:'#666',marginTop:4}}>{q.explication}</div>}
            </div>
          </div>
        )}
        {revealed&&(
          <button onClick={next} style={{marginTop:18,width:'100%',padding:16,background:`linear-gradient(135deg,${c},#EF9F27)`,color:'#fff',border:'none',borderRadius:14,fontFamily:"'Fredoka One',cursive",fontSize:16,cursor:'pointer',boxShadow:`0 4px 16px rgba(212,83,126,.3)`}}>
            {idx+1>=total?'Voir mon score 🎉':'Question suivante →'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── SCORE ── */
function Score({ev,score,correct,total,ticket,onNext}:{ev:EventData;score:number;correct:number;total:number;ticket:string;onNext:()=>void}) {
  const c=ev.couleur||'#D4537E'
  const hasTicket=correct>=(ev.score_min||3)
  return(
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)'}}>
      <div style={{padding:'32px 20px 24px',background:`linear-gradient(135deg,#4B1528,${c})`,color:'#fff',textAlign:'center'}}>
        <div style={{fontSize:64,marginBottom:8}}>🎉</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:26,marginBottom:4}}>Bien joué !</div>
        <div style={{fontSize:13,fontWeight:800,opacity:.85}}>Voici ton résultat</div>
      </div>
      <div style={{margin:'16px 20px 12px',background:'#fff',border:'1.5px solid #86EFAC',borderRadius:18,padding:18,textAlign:'center',boxShadow:'0 4px 16px rgba(29,158,117,.15)'}}>
        <div style={{fontSize:10,fontWeight:900,color:'#1D9E75',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:6}}>Ton score</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:44,color:'#1D9E75',lineHeight:1}}>
          {correct}<span style={{fontSize:20,color:'#16A34A',marginLeft:2}}>/{total}</span>
        </div>
        <div style={{display:'inline-block',background:hasTicket?'#1D9E75':'#9CA3AF',color:'#fff',borderRadius:100,padding:'3px 12px',fontSize:11,fontWeight:900,marginTop:8}}>
          {hasTicket?'✅ +1 ticket tombola':'❌ Score insuffisant'}
        </div>
      </div>
      {hasTicket&&(
        <div style={{margin:'0 20px 14px',background:'#fff',border:'1.5px dashed '+c,borderRadius:16,padding:18,textAlign:'center'}}>
          <div style={{fontSize:10,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:'.12em',marginBottom:4}}>🎟️ Ton code tombola</div>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,color:'#4B1528',letterSpacing:'.08em',margin:'8px 0'}}>{ticket}</div>
          <div style={{fontSize:11,fontWeight:700,color:'#888'}}>Présente ce code lors du tirage au sort</div>
        </div>
      )}
      <div style={{padding:'0 20px 24px'}}>
        <button onClick={onNext} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#EF9F27)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:16,border:'none',borderRadius:14,cursor:'pointer',boxShadow:`0 8px 20px rgba(212,83,126,.3)`}}>
          Terminer →
        </button>
      </div>
    </div>
  )
}

/* ── CONFIRM ── */
function Confirm({ev,ticket,correct}:{ev:EventData;ticket:string;correct:number}) {
  const c=ev.couleur||'#D4537E'
  const won=correct>=(ev.score_min||3)
  return(
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{fontSize:72,marginBottom:16}}>{won?'🥚':'🌸'}</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:26,color:c,marginBottom:8}}>
        {won?'Tu es dans le tirage !':'Merci d\'avoir participé !'}
      </div>
      {won&&<div style={{fontSize:14,fontWeight:700,color:'#72243E',marginBottom:24,lineHeight:1.5}}>
        Ton code <strong style={{color:c}}>{ticket}</strong> est enregistré.
        {ev.cfg?.tirageDate&&<><br/>Tirage le {ev.cfg.tirageDate}</>}
      </div>}
      <div style={{background:'#fff',borderRadius:16,padding:16,border:`1px solid rgba(212,83,126,.15)`,width:'100%',boxSizing:'border-box' as any}}>
        <div style={{fontSize:12,fontWeight:800,color:'#1D9E75'}}>✅ Participation enregistrée</div>
        <div style={{fontSize:11,color:'#aaa',marginTop:4}}>Bonne chance ! 🍀</div>
      </div>
    </div>
  )
}

/* ── ALREADY PLAYED ── */
function AlreadyPlayed({ev}:{ev:EventData}) {
  const c=ev.couleur||'#D4537E'
  return(
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{fontSize:64,marginBottom:12}}>🎟️</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:24,color:c,marginBottom:8}}>Tu as déjà participé !</div>
      <div style={{fontSize:14,fontWeight:700,color:'#72243E',lineHeight:1.5}}>Tu es déjà dans le tirage au sort.<br/>Bonne chance ! 🍀</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════ */
export default function QuizFlow({ev}:{ev:EventData}) {
  const [screen,setScreen]=useState<Screen>('landing')
  const [form,setForm]=useState<FormData|null>(null)
  const [result,setResult]=useState({score:0,correct:0})
  const [ticket]=useState(()=>genTicket(ev.id))

  useEffect(()=>{
    if(checkAlreadyPlayed(ev.id)) setScreen('already')
  },[ev.id])

  async function handleForm(f:FormData){
    setForm(f)
    setScreen('quiz')
  }
  async function handleDone(score:number,correct:number){
    setResult({score,correct})
    setScreen('score')
    if(form) await writeSupabase(ev,form,score,correct,ticket)
  }

  const questions=ev.questions||[]

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:430,margin:'0 auto',minHeight:'100vh',position:'relative',overflowX:'hidden',background:'#FBEAF0'}}>
        {screen==='already'  && <AlreadyPlayed ev={ev}/>}
        {screen==='landing'  && <Landing ev={ev} onStart={()=>setScreen('form')}/>}
        {screen==='form'     && <Form ev={ev} onSubmit={handleForm}/>}
        {screen==='quiz'     && questions.length>0 && <Quiz ev={ev} questions={questions} onDone={handleDone}/>}
        {screen==='quiz'     && questions.length===0 && <div style={{padding:40,textAlign:'center',fontFamily:"'Fredoka One',cursive",color:'#D4537E',fontSize:20}}>Aucune question disponible</div>}
        {screen==='score'    && <Score ev={ev} score={result.score} correct={result.correct} total={questions.length} ticket={ticket} onNext={()=>setScreen('confirm')}/>}
        {screen==='confirm'  && <Confirm ev={ev} ticket={ticket} correct={result.correct}/>}
      </div>
    </>
  )
}
