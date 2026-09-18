'use client'
import { useState, useEffect } from 'react'
import { writeJoueur, shuffle, parcoursCSS, getJoueurLocal, claimJoueur } from '@/lib/parcours'
import { NDS_JEU_FOND, NDS_JEU_POLICE } from '@/lib/parcours'
import ParcoursOutro from '../_components/ParcoursOutro'
import { ParcoursLogo, FlowinBadge } from '@/components/parcours/ParcoursBranding'
import ParcoursChampsStandard from '@/components/parcours/ParcoursChampsStandard'
import type { GainImmediat } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import type { ParcoursPageData, QuizQuestion } from '@/lib/parcours'
import { useParcoursTracking } from '@/lib/parcours-tracking'

type Screen = 'landing' | 'wait' | 'vote' | 'form' | 'ticket' | 'already'
interface Props extends ParcoursPageData { evId: string }

export default function QuizmasterClient({ ev, lots, partenaires, banques, evId }: Props) {
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const c = ev?.couleur ?? '#7C2D92'
  const nom = ev?.nom ?? 'Quiz Master'
  const tirageText = (cfg.tirageDate as string) ? `Tirage ${cfg.tirageDate}` : ''
  /* Ne prendre que les QCM : depuis le 03/09 une banque bonus peut se trouver
     dans le meme tableau. Sans banque bonus cochee, ce filtre ne retire rien. */
  const allQs = banques.flatMap(b => b.questions ?? []).filter(q => (q as { type?: string }).type === 'qcm')
  /* FAMILLE G : les questions personnalisees de l event (cfg.customQuestions)
     n etaient lues que par quiz et quizsolo. Un Quiz Master sans banque cochee
     sortait irrecuperablement vide. Meme lecture que QuizsoloClient. */
  const customQs = (Array.isArray(cfg.customQuestions) ? cfg.customQuestions : []) as QuizQuestion[]
  const [questions] = useState(() => shuffle(allQs.concat(customQs)).slice(0, (cfg.quizNbQuestions as number) ?? 5))
  const [screen, setScreen] = useState<Screen>('landing')
  /* Referentiel 8 : gain immediat attribue par la regle de l event. */
  const [gain, setGain] = useState<GainImmediat | null>(null)
  useParcoursTracking('quizmaster', evId, screen)
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

  /* Bloc 2 — compte deja cree : saute le formulaire, attribue directement */
  const [reco, setReco] = useState(false)
  useEffect(() => {
    if (screen !== 'form' || reco) return
    const local = getJoueurLocal()
    if (!local) return
    setReco(true)
    ;(async () => {
      setForm(f => ({ ...f,
        prenom: local.prenom || f.prenom, nom: local.nom || f.nom,
        email: local.email || f.email, tel: local.tel || f.tel,
        cp: local.cp || f.cp, age: local.age || f.age, genre: local.genre || f.genre }))
      const res = await claimJoueur(local, evId, 'QM')
      setGain(res.gain ?? null)
      try { localStorage.setItem(lsKey, res.ticket) } catch {}
      setExistingTicket(res.ticket)
      if (res.duplicate) { setScreen('already'); return }
      setTicket(res.ticket); setScreen('ticket')
    })()
  }, [screen, reco, evId, lsKey])

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
    setGain(res.gain ?? null)
    setSubmitting(false)
    if(res.duplicate){setExistingTicket(res.ticket);try{localStorage.setItem(lsKey,res.ticket)}catch{};setScreen('already');return}
    if(!res.success){if(res.error)console.error('[quizmaster] Supabase échoué:',res.error);return}
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
    <div style={{ maxWidth:430,margin:'0 auto',minHeight:'100dvh',background: NDS_JEU_FOND, color: '#fff', fontFamily: NDS_JEU_POLICE }}>
      <style>{parcoursCSS(c)+'.opt{font-size:18px}.opt.correct{background:rgba(22,163,74,.18);border-color:#16a34a}.opt.wrong{background:rgba(239,68,68,.18);border-color:#ef4444}.opt.reveal{background:rgba(22,163,74,.12);border-color:#16a34a88}'}</style>

      {screen==='landing'&&(
        <div className="screen" style={{ justifyContent:'center',textAlign:'center' }}>
          <ParcoursLogo emoji={(cfg.logoEmoji as string) || '🎮'} logoSvg={cfg.logoSvg as string} />
          <div style={{fontSize:24,fontWeight:900,marginBottom:8}}>{nom}</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,.55)',marginBottom:20}}>Quiz en direct · Réponds sur ton téléphone</div>
          <button className="btn" onClick={()=>setScreen('vote')}>🎮 Rejoindre le quiz →</button>
          <FlowinBadge />
        </div>
      )}

      {screen==='vote'&&q&&(<div className="screen"><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.45)'}}>Q{qIdx+1}/{questions.length}</div><div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.45)'}}>Score : {score}</div></div><div style={{fontSize:19,fontWeight:800,lineHeight:1.4,marginBottom:24,textAlign:'center'}}>{q.texte}</div>{q.options.map((opt,i)=>{let cls='opt';if(selected!==null){if(i===selected&&i===q.bonne)cls='opt correct';else if(i===selected)cls='opt wrong';else if(i===q.bonne)cls='opt reveal'}const letters=['🅰️','🅱️','🅾️','🆇'];return <button key={i} className={cls} onClick={()=>handleVote(i)} disabled={selected!==null}>{letters[i]||['A','B','C','D'][i]} {opt}</button>})}</div>)}

      {screen==='form'&&!getJoueurLocal()&&(
        <div className="screen">
          <div className="header"><div><div className="title">Crée ton compte</div><div className="sub">Score final : {score}/{questions.length}</div></div></div>
          <div className="grid2" style={{marginBottom:12}}>{[['prenom','Prénom *','given-name'],['nom','Nom *','family-name']].map(([k,l,ac])=>(<div key={k}><label className="label">{l}</label><input className={`input${errors[k]?' err':''}`} autoComplete={ac} value={form[k as keyof typeof form]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />{errors[k]&&<div className="err">{errors[k]}</div>}</div>))}</div>
          <div style={{marginBottom:12}}><label className="label">Email *</label><input className={`input${errors.email?' err':''}`} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />{errors.email&&<div className="err">{errors.email}</div>}</div>
          <div style={{marginBottom:12}}><label className="label">Téléphone *</label><input className={`input${errors.tel?' err':''}`} type="tel" inputMode="tel" autoComplete="tel" value={form.tel} onChange={e=>setForm(f=>({...f,tel:e.target.value}))} />{errors.tel&&<div className="err">{errors.tel}</div>}</div>
          <ParcoursChampsStandard form={form} setForm={setForm} />
          <div className="rgpd"><div className="rgpd-check">✓</div><div>J'accepte d'être recontacté(e). Données jamais cédées.</div></div>
          <button className="btn" style={{marginTop:16}} onClick={handleSubmit} disabled={submitting}>{submitting?'Envoi…':'✓ Valider →'}</button>
        </div>
      )}

      {(screen==='ticket'||screen==='already')&&(<div className="screen" style={{justifyContent:'center',textAlign:'center'}}><div style={{fontSize:48,marginBottom:12}}>{screen==='ticket'?'🎉':'✅'}</div><div style={{fontSize:22,fontWeight:900,marginBottom:20}}>{screen==='ticket'?`Score : ${score}/${questions.length}`:'Déjà joué !'}</div><div className="card" style={{borderTop:`4px solid ${c}`}}><div style={{fontSize:32,marginBottom:8}}>🎟️</div><div className="ticket-code">{screen==='ticket'?ticket:existingTicket}</div>{tirageText&&<div style={{fontSize:11,color:'rgba(255,255,255,.45)'}}>🗓️ {tirageText}</div>}</div><ParcoursOutro superEventId={ev?.super_event_id} gain={gain} /></div>)}
    </div>
  )
}
