'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, SUPA_URL, SUPA_ANON } from '@/lib/supabase'

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
interface Question { texte: string; options: string[]; bonne: number; points?: number; explication?: string }
interface Lot { id: string; titre: string; emoji: string; valeur_euros: number; partenaire?: string }
interface EventData {
  id: string; nom: string; lieu: string; couleur: string
  date_d: string; date_f: string; h_start: string; h_end: string
  description: string; score_min: number
  cfg: any; lots: Lot[]; questions: Question[]
}
interface FormData { prenom: string; nom: string; email: string; tel: string; ville: string; optin: boolean }

type Screen = 'landing'|'form'|'quiz'|'score'|'confirm'

/* ═══════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════ */
function fmtDate(d: string) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })
}
function genTicket(prefix: string) {
  return prefix.toUpperCase() + '-' + new Date().getFullYear() + '-' + Math.floor(1000+Math.random()*8999)
}
function extId(email: string) {
  return 'j-' + email.toLowerCase().trim().replace(/[^a-z0-9]/g,'-').substring(0,40)
}
async function writeToSupabase(ev: EventData, form: FormData, score: number, ticket: string) {
  const now = new Date().toISOString()
  const date = now.slice(0,10)
  const payload = {
    external_id: extId(form.email),
    email: form.email.toLowerCase().trim(),
    prenom: form.prenom,
    nom: form.nom,
    tel: form.tel,
    ville: form.ville,
    optin: form.optin,
    optin_date: form.optin ? date : null,
    events: [ev.id],
    client_type: 'btoc',
    first_seen: date,
    last_seen: date,
    source: 'parcours-quiz',
  }
  try {
    await fetch(`${SUPA_URL}/rest/v1/joueurs?on_conflict=external_id`, {
      method:'POST',
      headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
      body: JSON.stringify(payload)
    })
    await fetch(`${SUPA_URL}/rest/v1/participations`, {
      method:'POST',
      headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'return=minimal'},
      body: JSON.stringify({ event_id: ev.id, score, ticket_code: ticket, completed: true })
    })
  } catch(e) { console.warn('[quiz] supa write:', e) }
}

/* ═══════════════════════════════════════════════════════════════
   SCREEN : LANDING
═══════════════════════════════════════════════════════════════ */
function ScreenLanding({ ev, onStart }: { ev: EventData; onStart: ()=>void }) {
  const c = ev.couleur || '#D4537E'
  const dates = ev.date_d === ev.date_f
    ? fmtDate(ev.date_d)
    : fmtDate(ev.date_d) + ' — ' + fmtDate(ev.date_f)
  return (
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)'}}>
      {/* Bande couleur */}
      <div style={{height:4,background:`linear-gradient(90deg,${c},#EF9F27,#1D9E75,#AFA9EC,${c})`}}/>
      {/* Header */}
      <div style={{padding:'28px 22px 20px',textAlign:'center'}}>
        <div style={{fontSize:9,fontWeight:900,color:'#1D9E75',textTransform:'uppercase',letterSpacing:'.18em',marginBottom:14}}>
          {ev.lieu} · Flowin
        </div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:46,color:c,lineHeight:.95,marginBottom:12,letterSpacing:'-.01em'}}
          dangerouslySetInnerHTML={{__html: ev.nom.replace(' ','<br>')}}/>
        <div style={{fontFamily:"'Nunito',sans-serif",fontSize:16,fontWeight:900,color:'#EF9F27',letterSpacing:'.03em',marginBottom:16}}>
          {dates}
        </div>
        <div style={{fontSize:24,letterSpacing:10,opacity:.55}}>🥚 🦋 🌸 🌻</div>
      </div>
      {/* Bande */}
      <div style={{height:4,background:`linear-gradient(90deg,${c},#EF9F27,#1D9E75,#AFA9EC,${c})`}}/>
      {/* Lots */}
      {ev.lots && ev.lots.length > 0 && (
        <div style={{padding:'16px 18px 0'}}>
          <div style={{fontSize:9,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:'.15em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}}/>
            Tombola de l&apos;événement
          </div>
          {ev.lots.map((l,i) => (
            <div key={i} style={{background:'rgba(255,255,255,.9)',borderRadius:14,padding:'12px 14px',marginBottom:8,display:'flex',alignItems:'center',gap:10,border:`1px solid rgba(212,83,126,.12)`,boxShadow:'0 1px 4px rgba(212,83,126,.08)'}}>
              <div style={{width:34,height:34,borderRadius:10,background:'#FBEAF0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                {l.emoji||'🎁'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:'#4B1528'}}>{l.titre}</div>
                {l.partenaire && <div style={{fontSize:11,fontWeight:700,color:'#1D9E75',marginTop:1}}>Offert par {l.partenaire}</div>}
              </div>
            </div>
          ))}
          {ev.cfg?.tirageDate && (
            <div style={{display:'flex',alignItems:'center',gap:7,fontSize:11,fontWeight:700,color:'#72243E',marginBottom:14,paddingTop:10,borderTop:'1px solid rgba(212,83,126,.12)',marginTop:6}}>
              🗓️ Tirage au sort {ev.cfg.tirageDate}
            </div>
          )}
        </div>
      )}
      {/* CTA */}
      <div style={{padding:'0 18px 10px'}}>
        <button onClick={onStart} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#EF9F27)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:16,border:'none',borderRadius:16,cursor:'pointer',letterSpacing:'.01em',boxShadow:`0 8px 22px rgba(212,83,126,.3)`}}>
          🎮 Participer gratuitement
        </button>
        <div style={{textAlign:'center',fontSize:10,color:'#bbb',marginTop:7,fontWeight:700}}>
          Jeu gratuit · Sans achat obligatoire
        </div>
      </div>
      {/* Footer */}
      <div style={{textAlign:'center',padding:'14px 0 22px',borderTop:'1px solid rgba(212,83,126,.1)',marginTop:10}}>
        <div style={{fontSize:9,color:'#ccc',letterSpacing:'.06em',fontWeight:700}}>Conçu par OPConsult · © 2026</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCREEN : FORM CRM
═══════════════════════════════════════════════════════════════ */
function ScreenForm({ ev, onSubmit }: { ev: EventData; onSubmit: (f: FormData)=>void }) {
  const [form, setForm] = useState<FormData>({prenom:'',nom:'',email:'',tel:'',ville:'',optin:false})
  const [err, setErr] = useState('')
  const c = ev.couleur || '#D4537E'

  function handle() {
    if (!form.prenom.trim() || !form.email.trim()) { setErr('Prénom et email requis'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr('Email invalide'); return }
    onSubmit(form)
  }

  const inp = (field: keyof FormData, placeholder: string, type='text') => (
    <div style={{marginBottom:12}}>
      <input type={type} placeholder={placeholder}
        value={form[field] as string}
        onChange={e => setForm(f=>({...f,[field]:e.target.value}))}
        style={{width:'100%',padding:'13px 14px',borderRadius:12,border:'1.5px solid #E8D5DC',fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:700,color:'#4B1528',background:'#fff',boxSizing:'border-box',outline:'none'}}
      />
    </div>
  )

  return (
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)'}}>
      <div style={{height:4,background:`linear-gradient(90deg,${c},#EF9F27,#1D9E75)`}}/>
      <div style={{padding:'20px',background:'rgba(255,255,255,.4)'}}>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:'#4B1528',marginBottom:4}}>Tes infos pour participer</div>
        <div style={{fontSize:12,fontWeight:800,color:'#72243E',marginBottom:16}}>Remplis le formulaire pour entrer dans le tirage !</div>
        {inp('prenom','Prénom *')}
        {inp('nom','Nom *')}
        {inp('email','Email *','email')}
        {inp('tel','Téléphone')}
        {inp('ville','Ville')}
        {/* Opt-in */}
        <label style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:12,cursor:'pointer'}}>
          <input type="checkbox" checked={form.optin} onChange={e=>setForm(f=>({...f,optin:e.target.checked}))}
            style={{marginTop:2,width:18,height:18,accentColor:c,flexShrink:0}}/>
          <span style={{fontSize:11,fontWeight:700,color:'#72243E',lineHeight:1.4}}>
            J&apos;accepte de recevoir les prochains événements par email (optionnel)
          </span>
        </label>
        {/* Légal */}
        <div style={{fontSize:10,color:'#aaa',fontWeight:700,marginBottom:16,lineHeight:1.5}}>
          En participant, vous acceptez le règlement du jeu et certifiez être majeur.
        </div>
        {err && <div style={{color:'#D4537E',fontSize:12,fontWeight:800,marginBottom:12}}>⚠️ {err}</div>}
        <button onClick={handle} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#EF9F27)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:16,border:'none',borderRadius:14,cursor:'pointer',boxShadow:`0 8px 20px rgba(212,83,126,.3)`}}>
          C&apos;est parti ! →
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCREEN : QUIZ QUESTIONS
═══════════════════════════════════════════════════════════════ */
function ScreenQuiz({ ev, questions, onDone }: { ev: EventData; questions: Question[]; onDone: (score:number, correct:number)=>void }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number|null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [timer, setTimer] = useState(30)
  const timerRef = useRef<NodeJS.Timeout|null>(null)
  const c = ev.couleur || '#D4537E'
  const q = questions[idx]
  const total = questions.length

  const reveal = useCallback((sel: number|null) => {
    if (revealed) return
    setRevealed(true)
    setSelected(sel)
    if (timerRef.current) clearInterval(timerRef.current)
    if (sel !== null && sel === q.bonne) {
      setScore(s => s + (q.points||1))
      setCorrect(c => c+1)
    }
  }, [revealed, q])

  useEffect(() => {
    setTimer(ev.cfg?.timerQuestion || 30)
    setRevealed(false); setSelected(null)
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { reveal(null); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [idx])

  function next() {
    if (idx + 1 >= total) { onDone(score + (revealed && selected===q.bonne ? (q.points||1) : 0), correct + (revealed && selected===q.bonne ? 1 : 0)) }
    else { setIdx(i=>i+1) }
  }

  return (
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)',paddingTop:12}}>
      {/* Progress */}
      <div style={{padding:'14px 20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:10,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:'.1em'}}>
            Question {idx+1} / {total}
          </span>
          <span style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:timer<=5?'#EF4444':c}}>
            ⏱ {timer}s
          </span>
        </div>
        <div style={{display:'flex',gap:5}}>
          {questions.map((_,i) => (
            <div key={i} style={{flex:1,height:4,borderRadius:100,background:i<idx?'#1D9E75':i===idx?c:'rgba(212,83,126,.2)'}}/>
          ))}
        </div>
      </div>
      {/* Question */}
      <div style={{padding:'14px 20px 20px'}}>
        <div style={{fontSize:10,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:'.15em',marginBottom:6}}>
          {idx+1} sur {total}
        </div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:21,color:'#4B1528',lineHeight:1.25,marginBottom:20}}>
          {q.texte}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {q.options.map((opt,i) => {
            let bg='#fff', border='1.5px solid #BFDBFE', color='#1a1a2e'
            if (revealed) {
              if (i===q.bonne) { bg='#F0FDF4'; color='#16A34A'; border='2px solid #22C55E' }
              else if (i===selected) { bg='#EFF6FF'; color='#3B82F6'; border='2px solid #60A5FA' }
              else { bg='#F9FAFB'; color='#9CA3AF'; border='1.5px solid #E5E7EB' }
            } else if (i===selected) { border='2px solid #3B5CC4'; color='#3B5CC4' }
            return (
              <button key={i} onClick={()=>{ if(!revealed) reveal(i) }}
                style={{background:bg,border,borderRadius:13,padding:'14px 16px',fontSize:14,fontWeight:800,color,cursor:revealed?'default':'pointer',textAlign:'left',width:'100%',fontFamily:"'Nunito',sans-serif",transition:'all .15s',boxShadow:'0 1px 4px rgba(0,0,0,.05)'}}>
                {opt}
              </button>
            )
          })}
        </div>
        {/* Feedback */}
        {revealed && (
          <div style={{marginTop:14,borderRadius:13,padding:'13px 16px',display:'flex',alignItems:'center',gap:12,
            background:selected===q.bonne?'#F0FDF4':'#FFF5F5',
            border:`1.5px solid ${selected===q.bonne?'#86EFAC':'#FECACA'}`}}>
            <span style={{fontSize:22,flexShrink:0}}>{selected===q.bonne?'✅':'❌'}</span>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:'#1a1a2e'}}>
                {selected===q.bonne?'Bonne réponse !':'Raté...'}
              </div>
              {q.explication && <div style={{fontSize:12,fontWeight:700,color:'#666',marginTop:2}}>{q.explication}</div>}
              <div style={{fontSize:14,fontWeight:900,color:'#16A34A',marginTop:2}}>{q.options[q.bonne]}</div>
            </div>
          </div>
        )}
        {revealed && (
          <button onClick={next} style={{marginTop:18,width:'100%',padding:16,background:`linear-gradient(135deg,${c},#EF9F27)`,color:'#fff',border:'none',borderRadius:14,fontFamily:"'Fredoka One',cursive",fontSize:16,cursor:'pointer',boxShadow:`0 4px 16px rgba(212,83,126,.3)`}}>
            {idx+1>=total?'Voir mon score 🎉':'Question suivante →'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCREEN : SCORE + TICKET
═══════════════════════════════════════════════════════════════ */
function ScreenScore({ ev, score, correct, total, ticket, onConfirm }: {
  ev: EventData; score: number; correct: number; total: number; ticket: string; onConfirm: ()=>void
}) {
  const c = ev.couleur || '#D4537E'
  const tickets = score >= (ev.score_min||3) ? 1 : 0
  return (
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)'}}>
      {/* Hero */}
      <div style={{padding:'36px 20px 28px',background:`linear-gradient(135deg,#4B1528,${c})`,color:'#fff',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{fontSize:64,marginBottom:8,display:'inline-block'}}>🎉</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:24,lineHeight:1.2,marginBottom:4}}>Bien joué !</div>
        <div style={{fontSize:12,fontWeight:800,opacity:.9}}>Voici ton score</div>
      </div>
      {/* Score */}
      <div style={{margin:'16px 20px 12px',background:'#fff',border:'1.5px solid #86EFAC',borderRadius:18,padding:18,textAlign:'center',boxShadow:'0 4px 16px rgba(29,158,117,.15)'}}>
        <div style={{fontSize:10,fontWeight:900,color:'#1D9E75',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:6}}>Ton score</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:40,color:'#1D9E75',lineHeight:1}}>
          {correct}<span style={{fontSize:18,color:'#16A34A',marginLeft:2}}>/{total}</span>
        </div>
        <div style={{display:'inline-block',background:'#1D9E75',color:'#fff',borderRadius:100,padding:'3px 10px',fontSize:11,fontWeight:900,marginTop:8}}>
          +{tickets} ticket{tickets>1?'s':''}
        </div>
      </div>
      {/* Ticket */}
      {tickets > 0 && (
        <div style={{margin:'0 20px 14px',background:'#fff',border:'1.5px dashed #D4537E',borderRadius:16,padding:18,textAlign:'center'}}>
          <div style={{fontSize:10,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:'.12em',marginBottom:4}}>
            🎟️ Ton code tombola
          </div>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:26,color:'#4B1528',letterSpacing:'.08em',margin:'8px 0'}}>
            {ticket}
          </div>
          <div style={{fontSize:11,fontWeight:700,color:'#888',lineHeight:1.4}}>
            Présente ce code lors du tirage au sort
          </div>
        </div>
      )}
      <div style={{padding:'0 20px 24px'}}>
        <button onClick={onConfirm} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#EF9F27)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:16,border:'none',borderRadius:14,cursor:'pointer',boxShadow:`0 8px 20px rgba(212,83,126,.3)`}}>
          Continuer →
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCREEN : CONFIRMATION
═══════════════════════════════════════════════════════════════ */
function ScreenConfirm({ ev, ticket }: { ev: EventData; ticket: string }) {
  const c = ev.couleur || '#D4537E'
  return (
    <div style={{minHeight:'100%',background:'linear-gradient(160deg,#FBEAF0 0%,#E8F8F2 55%,#FAEEDA 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{fontSize:72,marginBottom:16}}>🥚</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,color:c,marginBottom:8}}>
        Tu es dans le tirage !
      </div>
      <div style={{fontSize:14,fontWeight:700,color:'#72243E',marginBottom:24,lineHeight:1.5}}>
        Ton code <strong style={{color:c}}>{ticket}</strong> est bien enregistré.
        {ev.cfg?.tirageDate && <><br/>Tirage le {ev.cfg.tirageDate}</>}
      </div>
      <div style={{background:'#fff',borderRadius:16,padding:16,border:`1px solid rgba(212,83,126,.15)`,width:'100%',boxSizing:'border-box' as any}}>
        <div style={{fontSize:12,fontWeight:800,color:'#1D9E75'}}>✅ Participation enregistrée</div>
        <div style={{fontSize:11,color:'#aaa',marginTop:4}}>Bonne chance ! 🍀</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════ */
export default function QuizFlow({ ev }: { ev: EventData }) {
  const [screen, setScreen] = useState<Screen>('landing')
  const [form, setForm] = useState<FormData|null>(null)
  const [scoreData, setScoreData] = useState({score:0,correct:0})
  const [ticket] = useState(genTicket('FL'))

  function handleForm(f: FormData) {
    setForm(f)
    setScreen('quiz')
  }

  async function handleScore(score: number, correct: number) {
    setScoreData({score,correct})
    setScreen('score')
    if (form) await writeToSupabase(ev, form, score, ticket)
  }

  const questions = ev.questions || []

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:430,margin:'0 auto',minHeight:'100vh',position:'relative',overflow:'hidden',background:'#FBEAF0'}}>
        {screen==='landing' && <ScreenLanding ev={ev} onStart={()=>setScreen('form')}/>}
        {screen==='form'    && <ScreenForm ev={ev} onSubmit={handleForm}/>}
        {screen==='quiz'    && questions.length > 0 && (
          <ScreenQuiz ev={ev} questions={questions} onDone={handleScore}/>
        )}
        {screen==='score'   && <ScreenScore ev={ev} score={scoreData.score} correct={scoreData.correct} total={questions.length} ticket={ticket} onConfirm={()=>setScreen('confirm')}/>}
        {screen==='confirm' && <ScreenConfirm ev={ev} ticket={ticket}/>}
      </div>
    </>
  )
}
