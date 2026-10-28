'use client'
import { useState, useEffect } from 'react'
import { writeJoueur, shuffle, parcoursCSS, getJoueurLocal, claimJoueur, RGPD_TEXT } from '@/lib/parcours'
import { NDS_JEU_POLICE } from '@/lib/parcours'
import ParcoursOutro from '../_components/ParcoursOutro'
import { FlowinBadge } from '@/components/parcours/ParcoursBranding'
import ParcoursChampsStandard from '@/components/parcours/ParcoursChampsStandard'
import { ParcoursPartenairesGrid, ParcoursPartenaireSheet } from '@/components/parcours/ParcoursPartenaires'
import { ParcoursHero, ParcoursPrizeCard, ParcoursHowTo, ParcoursRegles, PARCOURS_HERO_CSS } from '@/components/parcours/ParcoursHero'
import type { GainImmediat } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import type { ParcoursPageData, QuizQuestion } from '@/lib/parcours'
import { useParcoursTracking } from '@/lib/parcours-tracking'
import { resolveParcoursTheme } from '@/lib/parcoursTheme'

type Screen = 'landing' | 'quiz' | 'result' | 'form' | 'partenaires' | 'partSheet' | 'ticket' | 'already'
interface Props extends ParcoursPageData { evId: string }

/* Étapes de l'écran "Comment jouer ?" (ParcoursHowTo) — propres au module. */
const QUIZSOLO_STEPS = [
  { titre: 'Flashe le QR code', sous: 'À la station' },
  { titre: 'Réponds au quiz', sous: 'Gagne ton ticket' },
]

/* Regles reelles (lib/parcours.ts writeJoueur) : le ticket est ecrit des la
   validation du formulaire, sans condition de score (contrairement a Quiz) --
   le score n'est qu'une information jointe a la participation. Dedup
   par jour confirmee par le check `played_date` de claimJoueur/writeJoueur,
   commune a tous les modules. */
const QUIZSOLO_REGLES = [
  { titre: 'Un ticket par jour', texte: 'Le droit au ticket se remet à zéro chaque jour : on peut rejouer le lendemain.' },
  { titre: 'Ton ticket est validé à la fin du quiz', texte: 'Quel que soit ton score — il est enregistré avec ta participation.' },
  { titre: 'Déjà un compte : on ne resaisit rien', texte: 'Un joueur reconnu sur son appareil, ou qui donne son email, retrouve ses informations et son ticket — le formulaire ne lui est plus demandé.' },
]

export default function QuizsoloClient({ ev, lots, partenaires, banques, evId }: Props) {
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const c = ev?.couleur ?? '#7C2D92'
  const nom = ev?.nom ?? 'Quiz Solo'
  const nbQ = (cfg.quizNbQuestions as number) ?? 5
  const timerSec = 30
  const tirageText = (cfg.tirageDate as string) ? `Tirage ${cfg.tirageDate}` : ''
  const theme = resolveParcoursTheme('quizsolo', ev?.cfg)
  const [partIdx, setPartIdx] = useState(0)
  /* Ne prendre que les QCM : depuis le 03/09 une banque bonus peut se trouver
     dans le meme tableau. Sans banque bonus cochee, ce filtre ne retire rien. */
  const allQs = banques.flatMap(b => b.questions ?? []).filter(q => (q as { type?: string }).type === 'qcm')
  const customQs = (cfg.customQuestions ?? []) as QuizQuestion[]

  const [questions] = useState(() => shuffle([...allQs, ...customQs]).slice(0, nbQ))
  const [screen, setScreen] = useState<Screen>('landing')
  /* Referentiel 8 : gain immediat attribue par la regle de l event. */
  const [gain, setGain] = useState<GainImmediat | null>(null)
  useParcoursTracking('quizsolo', evId, screen)
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(timerSec)
  const [form, setForm] = useState({ prenom:'',nom:'',email:'',tel:'',genre:'',age:'',cp:'',source:'' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState('')
  const [existingTicket, setExistingTicket] = useState('')
  const lsKey = `flowin_played_${evId}`

  useEffect(()=>{ try{const s=localStorage.getItem(lsKey);if(s){setExistingTicket(s);setScreen('already')}}catch{} },[lsKey])

  useEffect(()=>{
    if(screen!=='quiz'||answered)return
    setTimer(timerSec)
    const iv=setInterval(()=>setTimer(t=>{ if(t<=1){clearInterval(iv);nextQ(-1);return 0};return t-1}),1000)
    return ()=>clearInterval(iv)
  },[screen,qIdx])

  function nextQ(sel: number){
    if(answered)return
    setSelected(sel);setAnswered(true)
    const q=questions[qIdx]
    if(sel===q.bonne)setScore(s=>s+(q.points??1))
    setTimeout(()=>{ if(qIdx+1<questions.length){setQIdx(i=>i+1);setSelected(null);setAnswered(false)} else setScreen('result') },900)
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
      const res = await claimJoueur(local, evId, 'QS')
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
    const tc=generateTicket('QS')
    const res=await writeJoueur({email:form.email,prenom:form.prenom,nom:form.nom,tel:form.tel,code_postal:form.cp,genre:form.genre,age_tranche:form.age,decouverte:form.source.replace(/^[^ ]+ /,'')||undefined,score_moy:`${score}/${questions.length}`,events:[evId],ticket_code:tc,source:'quizsolo',prefix:'QS'})
    setGain(res.gain ?? null)
    setSubmitting(false)
    if(res.duplicate){setExistingTicket(res.ticket);try{localStorage.setItem(lsKey,res.ticket)}catch{};setScreen('already');return}
    if(!res.success){if(res.error)console.error('[quizsolo] Supabase échoué:',res.error);return}
    setTicket(res.ticket);setExistingTicket(res.ticket);try{localStorage.setItem(lsKey,res.ticket)}catch{};setScreen('ticket')
  }

  const q=questions[qIdx]


  const partSelected = partenaires[partIdx]

  /* Navigation postMessage — flèches dashboard SA */
  useEffect(() => {
    const NAV_SCREENS: Screen[] = ['landing', 'quiz', 'result', 'form', 'partenaires', 'ticket', 'already']
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
    <div style={{ maxWidth:430,margin:'0 auto',minHeight:'100dvh',background: theme.bgImage ? `url(${theme.bgImage}) center/cover` : theme.bgColor, color: '#fff', fontFamily: NDS_JEU_POLICE }}>
      <style>{parcoursCSS(c)+PARCOURS_HERO_CSS+'.opt.correct{background:rgba(22,163,74,.18);border-color:#16a34a}.opt.wrong{background:rgba(239,68,68,.18);border-color:#ef4444}.opt.reveal{background:rgba(22,163,74,.12);border-color:#16a34a88}'}</style>
      {screen==='landing'&&(
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
          <ParcoursHero module="quizsolo" nom={nom}
            emoji={(cfg.logoEmoji as string) || theme.logoEmoji} logoSvg={(cfg.logoSvg as string) || theme.logoSvg} logoUrl={theme.logoUrl}
            subtitle={`Quiz chronométré · ${timerSec}s par question`} />
          <div className="pc-stage">
            <ParcoursPrizeCard lots={lots} />
            <ParcoursHowTo steps={QUIZSOLO_STEPS} />
            <ParcoursRegles regles={QUIZSOLO_REGLES} />
            <div style={{ flex: 1 }} />
            <div style={{ padding: '0 18px' }}>
              <button className="btn" onClick={()=>setScreen('quiz')}>{theme.texts.ctaLanding || 'Démarrer le quiz'} →</button>
              {partenaires.length > 0 && (
                <button className="btn-ghost" onClick={() => setScreen('partenaires')}>Nos {partenaires.length} partenaires</button>
              )}
              <FlowinBadge />
            </div>
          </div>
        </div>
      )}
      {screen==='quiz'&&q&&(<div className="screen"><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.45)'}}>Q{qIdx+1}/{questions.length}</div><div style={{background:timer<=5?'rgba(239,68,68,.2)':'rgba(255,255,255,.06)',borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,color:timer<=5?'#F87171':'#fff',border:`2px solid ${timer<=5?'#EF4444':'rgba(255,255,255,.15)'}`}}>{timer}</div></div><div style={{background:'rgba(255,255,255,.06)',borderRadius:12,height:4,marginBottom:16}}><div style={{background:c,borderRadius:12,height:'100%',width:`${(timer/timerSec)*100}%`,transition:'width 1s linear'}}/></div><div style={{fontSize:17,fontWeight:800,lineHeight:1.4,marginBottom:20,textAlign:'center'}}>{q.texte}</div>{q.options.map((opt,i)=>{let cls='opt';if(answered){if(i===selected&&i===q.bonne)cls='opt correct';else if(i===selected)cls='opt wrong';else if(i===q.bonne)cls='opt reveal'}return <button key={i} className={cls} onClick={()=>nextQ(i)} disabled={answered}><span style={{fontWeight:800,color:'rgba(255,255,255,.4)',marginRight:8}}>{['A','B','C','D'][i]}</span>{opt}</button>})}</div>)}
      {screen==='result'&&(<div className="screen" style={{justifyContent:'center',textAlign:'center'}}><div style={{fontSize:22,fontWeight:900,marginBottom:6}}>Score : {score}/{questions.length}</div><div style={{fontSize:14,color:'rgba(255,255,255,.55)',marginBottom:20}}>Laisse tes coordonnées pour participer au tirage !</div><button className="btn" onClick={()=>setScreen('form')}>Continuer →</button></div>)}
      {screen==='form'&&!getJoueurLocal()&&(
        <div className="screen">
          <div className="header"><div><div className="title">Crée ton compte</div><div className="sub">Score : {score}/{questions.length}</div></div></div>
          <div className="grid2" style={{marginBottom:12}}>{[['prenom','Prénom *','given-name'],['nom','Nom *','family-name']].map(([k,l,ac])=>(<div key={k}><label className="label">{l}</label><input className={`input${errors[k]?' err':''}`} autoComplete={ac} value={form[k as keyof typeof form]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />{errors[k]&&<div className="err">{errors[k]}</div>}</div>))}</div>
          <div style={{marginBottom:12}}><label className="label">Email *</label><input className={`input${errors.email?' err':''}`} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />{errors.email&&<div className="err">{errors.email}</div>}</div>
          <div style={{marginBottom:12}}><label className="label">Téléphone *</label><input className={`input${errors.tel?' err':''}`} type="tel" inputMode="tel" autoComplete="tel" value={form.tel} onChange={e=>setForm(f=>({...f,tel:e.target.value}))} />{errors.tel&&<div className="err">{errors.tel}</div>}</div>
          <ParcoursChampsStandard form={form} setForm={setForm} />
          <div className="rgpd"><div className="rgpd-check" /><div>{RGPD_TEXT}</div></div>
          <button className="btn" style={{marginTop:16}} onClick={handleSubmit} disabled={submitting}>{submitting?'Envoi…':'Valider →'}</button>
        </div>
      )}
      {screen==='partenaires'&&(
        <div className="screen">
          <div className="header"><div><div className="title">Nos partenaires</div><div className="sub">{nom}</div></div></div>
          <ParcoursPartenairesGrid partenaires={partenaires} onSelect={i => { setPartIdx(i); setScreen('partSheet') }} />
          <button className="btn-ghost" onClick={() => setScreen('landing')}>Retour</button>
        </div>
      )}
      {screen==='partSheet'&&partSelected&&(
        <ParcoursPartenaireSheet p={partSelected} onClose={() => setScreen('partenaires')} />
      )}
      {(screen==='ticket'||screen==='already')&&(<div className="screen" style={{justifyContent:'center',textAlign:'center'}}><div style={{fontSize:22,fontWeight:900,marginBottom:20}}>{screen==='ticket'?`Score : ${score}/${questions.length}`:'Déjà joué !'}</div><div className="card" style={{borderTop:`4px solid ${c}`}}><div className="ticket-code">{screen==='ticket'?ticket:existingTicket}</div>{tirageText&&<div style={{fontSize:11,color:'rgba(255,255,255,.45)'}}>{tirageText}</div>}</div>{partenaires.length>0&&<button className="btn-ghost" onClick={()=>setScreen('partenaires')}>Découvrir nos partenaires</button>}<ParcoursOutro superEventId={ev?.super_event_id} gain={gain} /></div>)}
    </div>
  )
}
