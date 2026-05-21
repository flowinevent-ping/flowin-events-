'use client'
import { useState, useEffect } from 'react'
import { writeJoueur, shuffle, parcoursCSS, SOURCES, AGE_OPTIONS } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import type { ParcoursPageData, QuizQuestion } from '@/lib/parcours'

type Screen = 'landing' | 'wait' | 'vote' | 'form' | 'ticket' | 'already'
interface Props extends ParcoursPageData { evId: string }

export default function QuizmasterClient({ ev, lots, partenaires, banques, evId }: Props) {
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const c = ev?.couleur ?? '#7C2D92'
  const nom = ev?.nom ?? 'Quiz Master'
  const tirageText = (cfg.tirageDate as string) ? `Tirage ${cfg.tirageDate}` : ''
  const allQs = banques.flatMap(b => b.questions ?? [])
  const [questions] = useState(() => shuffle(allQs).slice(0, (cfg.quizNbQuestions as number) ?? 5))
  const [screen, setScreen] = useState<Screen>('landing')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [form, setForm] = useState({ prenom:'',nom:'',email:'',tel:'',genre:'',age:'',cp:'',source:'' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState('')
  const [existingTicket, setExistingTicket] = useState('')
  const lsKey = `flowin_played_${evId}`

  useEffect(()=>{ try{const s=localStorage.getItem(lsKey);if(s){setExistingTicket(s);setScreen('already')}}catch{} },[lsKey])

  function handleVote(idx: number){
    if(selected!==null)return
    setSelected(idx)
    const q=questions[qIdx]
    if(idx===q.bonne)setScore(s=>s+1)
    setTimeout(()=>{ if(qIdx+1<questions.length){setQIdx(i=>i+1);setSelected(null)} else setScreen('form') },1500)
  }

  async function handleSubmit(){
    const errs: Record<string,string>={}
    if(!form.prenom.trim())errs.prenom='Obligatoire'
    if(!form.nom.trim())errs.nom='Obligatoire'
    if(!form.email.includes('@'))errs.email='Email invalide'
    if(form.tel.replace(/\s/g,'').length<8)errs.tel='Invalide'
    setErrors(errs);if(Object.keys(errs).length)return
    setSubmitting(true)
    const tc=generateTicket('QM')
    const res=await writeJoueur({email:form.email,prenom:form.prenom,nom:form.nom,tel:form.tel,code_postal:form.cp,genre:form.genre,age_tranche:form.age,decouverte:form.source.replace(/^[^ ]+ /,'')||undefined,score_moy:`${score}/${questions.length}`,events:[evId],ticket_code:tc,source:'quizmaster',prefix:'QM'})
    setSubmitting(false)
    if(res.duplicate){setExistingTicket(res.ticket);try{localStorage.setItem(lsKey,res.ticket)}catch{};setScreen('already');return}
    setTicket(res.ticket);setExistingTicket(res.ticket);try{localStorage.setItem(lsKey,res.ticket)}catch{};setScreen('ticket')
  }

  const q=questions[qIdx]


  /* Navigation postMessage — flèches dashboard SA */
  useEffect(() => {
    const NAV_SCREENS: Screen[] = ['landing', 'vote', 'form', 'ticket', 'already']
    function onMsg(e: MessageEvent) {
      if (!e.data || !e.data.flowinNav) return
      setScreen(cur => {
        const i = NAV_SCREENS.indexOf(cur)
        if (e.data.flowinNav === 'next' && i < NAV_SCREENS.length - 1) return NAV_SCREENS[i + 1]
        if (e.data.flowinNav === 'prev' && i > 0) return NAV_SCREENS[i - 1]
        return cur
      })
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  return (
    <div style={{ maxWidth:430,margin:'0 auto',minHeight:'100dvh',background:'#0F172A',color:'#fff',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{parcoursCSS(c)+'.opt{background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;cursor:pointer;font-size:14px;font-weight:600;color:#fff;width:100%;font-family:inherit;margin-bottom:8px;text-align:left;font-size:18px}.opt.correct{background:rgba(34,197,94,.2);border-color:#22C55E}.opt.wrong{background:rgba(239,68,68,.2);border-color:#EF4444}.opt.reveal{background:rgba(34,197,94,.12);border-color:#22C55E88}'}</style>

      {screen==='landing'&&(<div className="screen" style={{paddingTop:32,textAlign:'center'}}><div style={{fontSize:48,marginBottom:14}}>🎮</div><div style={{fontSize:24,fontWeight:900,marginBottom:8}}>{nom}</div><div style={{fontSize:13,color:'rgba(255,255,255,.55)',marginBottom:20}}>Quiz en direct · Réponds sur ton téléphone</div><button className="btn" onClick={()=>setScreen('vote')}>🎮 Rejoindre le quiz →</button></div>)}

      {screen==='vote'&&q&&(<div className="screen"><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.45)'}}>Q{qIdx+1}/{questions.length}</div><div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.45)'}}>Score : {score}</div></div><div style={{fontSize:19,fontWeight:800,lineHeight:1.4,marginBottom:24,textAlign:'center'}}>{q.texte}</div>{q.options.map((opt,i)=>{let cls='opt';if(selected!==null){if(i===selected&&i===q.bonne)cls='opt correct';else if(i===selected)cls='opt wrong';else if(i===q.bonne)cls='opt reveal'}const letters=['🅰️','🅱️','🅾️','🆇'];return <button key={i} className={cls} onClick={()=>handleVote(i)} disabled={selected!==null}>{letters[i]||['A','B','C','D'][i]} {opt}</button>})}</div>)}

      {screen==='form'&&(<div className="screen"><div className="header"><div><div className="title">Mes coordonnées</div><div className="sub">Score final : {score}/{questions.length}</div></div></div><div className="grid2" style={{marginBottom:12}}>{[['prenom','Prénom *','Camille'],['nom','Nom *','Dupont']].map(([k,l,p])=>(<div key={k}><label className="label">{l}</label><input className={`input${errors[k]?' err':''}`} placeholder={p} value={form[k as keyof typeof form]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />{errors[k]&&<div className="err">{errors[k]}</div>}</div>))}</div><div style={{marginBottom:12}}><label className="label">Email *</label><input className={`input${errors.email?' err':''}`} type="email" placeholder="nom@exemple.fr" autoCapitalize="none" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />{errors.email&&<div className="err">{errors.email}</div>}</div><div style={{marginBottom:12}}><label className="label">Téléphone *</label><input className={`input${errors.tel?' err':''}`} type="tel" placeholder="06 XX" value={form.tel} onChange={e=>setForm(f=>({...f,tel:e.target.value}))} />{errors.tel&&<div className="err">{errors.tel}</div>}</div><div className="rgpd"><div className="rgpd-check">✓</div><div>J'accepte d'être recontacté(e). Données jamais cédées.</div></div><button className="btn" style={{marginTop:16}} onClick={handleSubmit} disabled={submitting}>{submitting?'Envoi…':'✓ Valider →'}</button></div>)}

      {(screen==='ticket'||screen==='already')&&(<div className="screen" style={{justifyContent:'center',textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>{screen==='ticket'?'🎉':'✅'}</div><div style={{fontSize:22,fontWeight:900,marginBottom:20}}>{screen==='ticket'?`Score : ${score}/${questions.length}`:'Déjà joué !'}</div><div className="card" style={{borderTop:`4px solid ${c}`}}><div style={{fontSize:32,marginBottom:8}}>🎟️</div><div className="ticket-code">{screen==='ticket'?ticket:existingTicket}</div>{tirageText&&<div style={{fontSize:11,color:'rgba(255,255,255,.45)'}}>🗓️ {tirageText}</div>}</div></div>)}
    </div>
  )
}
