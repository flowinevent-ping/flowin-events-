'use client'

import { useState, useEffect, useCallback } from 'react'
import { writeJoueur, shuffle, parcoursCSS, SOURCES, AGE_OPTIONS, getJoueurLocal, claimJoueur } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import type { FlowinEvent, FlowinLot, FlowinPartenaire } from '@/lib/types'
import type { ParcoursPageData, QuizQuestion, BonusQuestion } from '@/lib/parcours'

type Screen = 'landing' | 'quiz' | 'bonus' | 'form' | 'partenaires' | 'partSheet' | 'ticket' | 'already'
interface Props extends ParcoursPageData { evId: string }

export default function QuizClient({ ev, lots, partenaires, banques, evId }: Props) {
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const front = (cfg.front ?? {}) as Record<string, string>
  const c = ev?.couleur ?? '#7C2D92'
  const nom = ev?.nom ?? 'Quiz'
  const allQs = banques.flatMap(b => b.questions ?? [])
  const customQs = (cfg.customQuestions ?? []) as QuizQuestion[]
  const nbQ = (cfg.quizNbQuestions as number) ?? 5
  const timerSec = cfg.quizTimer !== false ? ((cfg.quizTimer as number) || 30) : 0
  const bonusQs = (cfg.quizBonusList ?? cfg.bonusList ?? []) as BonusQuestion[]
  const tirageText = (cfg.tirageDate as string) ? `Tirage ${cfg.tirageDate}` : ''

  const [questions] = useState<QuizQuestion[]>(() => shuffle([...allQs, ...customQs]).slice(0, nbQ))
  const [screen, setScreen] = useState<Screen>('landing')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(timerSec)
  const [bonusAnswers, setBonusAnswers] = useState<Record<string, string | string[]>>({})
  const [bonusIdx, setBonusIdx] = useState(0)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', tel: '', genre: '', age: '', cp: '', source: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState('')
  const [existingTicket, setExistingTicket] = useState('')
  const [partIdx, setPartIdx] = useState(0)

  const lsKey = `flowin_played_${evId}`
  useEffect(() => { try { const s = localStorage.getItem(lsKey); if (s) { setExistingTicket(s); setScreen('already') } } catch {} }, [lsKey])

  useEffect(() => {
    if (screen !== 'quiz' || !timerSec || answered) return
    setTimer(timerSec)
    const iv = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(iv); handleAnswer(-1); return 0 } return t - 1 }), 1000)
    return () => clearInterval(iv)
  }, [screen, qIdx])

  const handleAnswer = useCallback((idx: number) => {
    if (answered) return
    setSelected(idx); setAnswered(true)
    const q = questions[qIdx]
    if (idx === q.bonne) setScore(s => s + (q.points ?? 1))
    setTimeout(() => {
      if (qIdx + 1 < questions.length) { setQIdx(i => i + 1); setSelected(null); setAnswered(false) }
      else setScreen(bonusQs.length ? 'bonus' : 'form')
    }, 1200)
  }, [answered, qIdx, questions, bonusQs.length])

  /* Bloc 2 — compte deja cree : saute le formulaire, attribue directement */
  const [reco, setReco] = useState(false)
  useEffect(() => {
    if (screen !== 'form' || reco) return
    const local = getJoueurLocal()
    if (!local) return
    setReco(true)
    ;(async () => {
      if (local.prenom) setForm(f => ({ ...f, prenom: local.prenom as string }))
      const res = await claimJoueur(local, evId, 'PQ')
      try { localStorage.setItem(lsKey, res.ticket) } catch {}
      setExistingTicket(res.ticket)
      if (res.duplicate) { setScreen('already'); return }
      setTicket(res.ticket); setScreen('ticket')
    })()
  }, [screen, reco, evId, lsKey])

  async function handleSubmit() {
    const errs: Record<string, string> = {}
    if (!form.prenom.trim()) errs.prenom = 'Obligatoire'
    if (!form.nom.trim()) errs.nom = 'Obligatoire'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    if (form.tel.replace(/\s/g,'').length < 8) errs.tel = 'Invalide'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSubmitting(true)
    const tc = generateTicket('PQ')
    const res = await writeJoueur({ email: form.email, prenom: form.prenom, nom: form.nom, tel: form.tel, code_postal: form.cp, genre: form.genre, age_tranche: form.age, decouverte: form.source.replace(/^[^ ]+ /,'') || undefined, score_moy: `${score}/${questions.length}`, events: [evId], ticket_code: tc, source: 'quiz', prefix: 'PQ' })
    setSubmitting(false)
    if (res.duplicate) { setExistingTicket(res.ticket); try { localStorage.setItem(lsKey, res.ticket) } catch {}; setScreen('already'); return }
    setTicket(res.ticket); setExistingTicket(res.ticket); try { localStorage.setItem(lsKey, res.ticket) } catch {}
    setScreen('ticket')
  }

  const q = questions[qIdx]
  const partSel = partenaires[partIdx]


  /* Navigation postMessage — flèches dashboard SA */
  useEffect(() => {
    const NAV_SCREENS: Screen[] = ['landing', 'quiz', 'bonus', 'form', 'ticket', 'already']
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
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: '#0F172A', color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{parcoursCSS(c) + `
        .opt{background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:14px;padding:14px 16px;cursor:pointer;font-size:14px;font-weight:600;text-align:left;color:#fff;width:100%;font-family:inherit;margin-bottom:8px}
        .opt.correct{background:rgba(34,197,94,.2);border-color:#22C55E} .opt.wrong{background:rgba(239,68,68,.2);border-color:#EF4444} .opt.reveal{background:rgba(34,197,94,.12);border-color:#22C55E88}
        .bonus-opt{background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;cursor:pointer;font-size:13px;font-weight:700;color:#fff;width:100%;font-family:inherit;margin-bottom:8px;text-align:left}
        .bonus-opt.sel{background:rgba(124,45,146,.2);border-color:#7C2D92}
      `}</style>

      {screen === 'landing' && (
        <div className="screen" style={{ paddingTop: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            {cfg.logoSvg ? <div dangerouslySetInnerHTML={{ __html: cfg.logoSvg as string }} style={{ display:'flex',justifyContent:'center',marginBottom:14 }} />
              : <div style={{ fontSize: 48, marginBottom: 14 }}>{cfg.logoEmoji as string || '🎮'}</div>}
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>{nom}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: 8 }}>{(cfg.subtitle as string) || ''}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>{(cfg.datesLabel as string) || ''}</div>
          </div>
          {lots.length > 0 && (
            <div className="card" style={{ marginBottom: 14 }}>
              {lots.slice(0,3).map((l,i) => (
                <div key={l.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:i<2?'1px solid rgba(255,255,255,.06)':'none' }}>
                  <span style={{ fontSize:18 }}>{l.emoji||['🥇','🥈','🥉'][i]||'🎁'}</span>
                  <span style={{ fontSize:13,fontWeight:700 }}>{l.titre||l.nom}</span>
                </div>
              ))}
            </div>
          )}
          {tirageText && <div style={{ background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.25)',borderRadius:10,padding:'10px 14px',textAlign:'center',fontSize:12,fontWeight:700,color:'rgba(255,255,255,.8)',marginBottom:14 }}>🗓️ {tirageText}</div>}
          <button className="btn" onClick={() => setScreen('quiz')}>{front.ctaText || '🎮 Jouer gratuitement →'}</button>
          <div style={{ fontSize:10,textAlign:'center',color:'rgba(255,255,255,.3)',margin:'6px 0 8px' }}>Jeu gratuit · Sans achat obligatoire</div>
          {partenaires.length > 0 && <button className="btn-ghost" onClick={() => setScreen('partenaires')}>🤝 Nos {partenaires.length} partenaires</button>}
        </div>
      )}

      {screen === 'quiz' && q && (
        <div className="screen">
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
            <div style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,.45)' }}>Question {qIdx+1}/{questions.length}</div>
            {timerSec > 0 && <div style={{ background:timer<=5?'rgba(239,68,68,.2)':'rgba(255,255,255,.06)',border:`2px solid ${timer<=5?'#EF4444':'rgba(255,255,255,.15)'}`,borderRadius:'50%',width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,color:timer<=5?'#F87171':'#fff' }}>{timer}</div>}
          </div>
          <div style={{ background:'rgba(255,255,255,.06)',borderRadius:12,height:4,marginBottom:20 }}>
            <div style={{ background:c,borderRadius:12,height:'100%',width:`${((qIdx+1)/questions.length)*100}%`,transition:'width .3s' }} />
          </div>
          <div style={{ fontSize:17,fontWeight:800,lineHeight:1.4,marginBottom:24,textAlign:'center' }}>{q.texte}</div>
          {q.options.map((opt,i) => {
            let cls = 'opt'
            if (answered) { if (i===selected && i===q.bonne) cls='opt correct'; else if (i===selected) cls='opt wrong'; else if (i===q.bonne) cls='opt reveal' }
            return <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={answered}><span style={{ fontWeight:800,color:'rgba(255,255,255,.4)',marginRight:8 }}>{['A','B','C','D'][i]}</span>{opt}</button>
          })}
          {answered && q.explication && <div style={{ background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'10px 12px',fontSize:12,color:'rgba(255,255,255,.55)',marginTop:8 }}>💡 {q.explication}</div>}
        </div>
      )}

      {screen === 'bonus' && bonusQs[bonusIdx] && (
        <div className="screen">
          <div style={{ fontSize:11,fontWeight:800,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6 }}>Bonus {bonusIdx+1}/{bonusQs.length}</div>
          <div style={{ fontSize:19,fontWeight:800,lineHeight:1.4,marginBottom:20 }}>{bonusQs[bonusIdx].label}</div>
          {bonusQs[bonusIdx].options.map(opt => {
            const ans = bonusAnswers[bonusQs[bonusIdx].id]
            const isSel = Array.isArray(ans) ? ans.includes(opt.val) : ans === opt.val
            return <button key={opt.val} className={`bonus-opt${isSel?' sel':''}`}
              onClick={() => { const bq = bonusQs[bonusIdx]; setBonusAnswers(a => bq.type==='multi' ? { ...a,[bq.id]:((a[bq.id] as string[]|undefined)??[]).includes(opt.val)?((a[bq.id] as string[]).filter((v:string)=>v!==opt.val)):[...((a[bq.id] as string[]|undefined)??[]),opt.val] } : { ...a,[bq.id]:opt.val }) }}>{opt.label}</button>
          })}
          <div style={{ flex:1 }} />
          <button className="btn" style={{ marginTop:16 }} onClick={() => bonusIdx+1 < bonusQs.length ? setBonusIdx(i=>i+1) : setScreen('form')}>{bonusIdx+1 < bonusQs.length ? 'Suivant →' : 'Continuer →'}</button>
        </div>
      )}

      {screen === 'form' && !getJoueurLocal() && (
        <div className="screen">
          <div className="header"><div><div className="title">Crée ton compte</div><div className="sub">Score : {score}/{questions.length} · {nom}</div></div></div>
          <div className="grid2" style={{ marginBottom:12 }}>
            {[['prenom','Prénom *','given-name'],['nom','Nom *','family-name']].map(([k,l,ac]) => (
              <div key={k}><label className="label">{l}</label><input className={`input${errors[k]?' err':''}`} autoComplete={ac} value={form[k as keyof typeof form]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} />{errors[k] && <div className="err">{errors[k]}</div>}</div>
            ))}
          </div>
          <div style={{ marginBottom:12 }}><label className="label">Email *</label><input className={`input${errors.email?' err':''}`} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />{errors.email && <div className="err">{errors.email}</div>}</div>
          <div style={{ marginBottom:12 }}><label className="label">Téléphone *</label><input className={`input${errors.tel?' err':''}`} type="tel" inputMode="tel" autoComplete="tel" value={form.tel} onChange={e => setForm(f=>({...f,tel:e.target.value}))} />{errors.tel && <div className="err">{errors.tel}</div>}</div>
          <div className="grid2" style={{ marginBottom:12 }}>
            <div><label className="label">Tranche d'âge</label><select className="input" value={form.age} onChange={e => setForm(f=>({...f,age:e.target.value}))}>{AGE_OPTIONS.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}</select></div>
            <div><label className="label">CP</label><input className="input" inputMode="numeric" autoComplete="postal-code" value={form.cp} onChange={e => setForm(f=>({...f,cp:e.target.value}))} /></div>
          </div>
          <div style={{ marginBottom:12 }}><label className="label">Comment découvert ?</label><div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:6 }}>{SOURCES.map(s=><button key={s} className={`source-chip${form.source===s?' sel':''}`} onClick={()=>setForm(f=>({...f,source:s}))}>{s}</button>)}</div></div>
          <div className="rgpd"><div className="rgpd-check">✓</div><div>J'accepte d'être recontacté(e). Données jamais cédées.</div></div>
          <button className="btn" style={{ marginTop:16 }} onClick={handleSubmit} disabled={submitting}>{submitting?'Envoi…':'✓ Valider →'}</button>
        </div>
      )}

      {screen === 'partenaires' && (
        <div className="screen">
          <div className="header"><div className="back" onClick={()=>setScreen('landing')}>←</div><div className="title">Nos partenaires</div></div>
          <div className="grid2" style={{ marginBottom:16 }}>{partenaires.map((p,i)=><div key={p.id} className="part-tile" onClick={()=>{setPartIdx(i);setScreen('partSheet')}}>{p.image_url?<img src={p.image_url} alt={p.nom} style={{width:52,height:52,objectFit:'contain',borderRadius:8,marginBottom:6,display:'block',margin:'0 auto 6px'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />:<div style={{fontSize:32,marginBottom:6}}>{p.emoji??'🤝'}</div>}<div style={{fontSize:11,fontWeight:700,lineHeight:1.3}}>{p.nom}</div></div>)}</div>
          {existingTicket ? (
            <button className="btn" style={{background:'rgba(34,197,94,.15)',border:'2px solid #22C55E',color:'#4ADE80'}}
              onClick={()=>setScreen('already')}>✅ Déjà inscrit(e) · revoir mon ticket</button>
          ) : (
            <button className="btn" onClick={()=>setScreen('form')}>Participer →</button>
          )}
        </div>
      )}

      {screen === 'partSheet' && partSel && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:10,display:'flex',alignItems:'flex-end' }} onClick={()=>setScreen('partenaires')}>
          <div style={{ background:'#1E293B',borderRadius:'20px 20px 0 0',padding:20,width:'100%',maxWidth:430,margin:'0 auto',maxHeight:'70dvh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:72,height:72,borderRadius:'50%',background:'rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,margin:'0 auto 12px' }}>{partSel.emoji??'🤝'}</div>
            <div style={{ fontSize:20,fontWeight:900,textAlign:'center',marginBottom:4 }}>{partSel.nom}</div>
            {partSel.description && <div style={{ fontSize:13,color:'rgba(255,255,255,.55)',textAlign:'center',marginBottom:12 }}>{partSel.description}</div>}
            {partSel.promo_text && <div style={{ background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.25)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#C4B5FD',marginBottom:12,textAlign:'center' }}>🎁 {partSel.promo_text}</div>}
            {(partSel.site_web||partSel.url) && <a href={partSel.site_web??partSel.url!} target="_blank" rel="noopener" className="link-btn">🌐 <span>Site web</span></a>}
            <button className="btn-ghost" onClick={()=>setScreen('partenaires')}>← Retour</button>
          </div>
        </div>
      )}

      {(screen === 'ticket' || screen === 'already') && (
        <div className="screen" style={{ justifyContent:'center',textAlign:'center' }}>
          <div style={{ fontSize:48,marginBottom:12 }}>{screen==='ticket'?'🎉':'✅'}</div>
          <div style={{ fontSize:22,fontWeight:900,marginBottom:6 }}>{screen==='ticket'?`Bravo ! Score : ${score}/${questions.length}`:'Déjà joué !'}</div>
          <div style={{ fontSize:14,color:'rgba(255,255,255,.55)',marginBottom:20 }}>{nom}</div>
          <div className="card" style={{ borderTop:`4px solid ${c}`,marginBottom:16 }}>
            <div style={{ fontSize:32,marginBottom:8 }}>🎟️</div>
            <div className="ticket-code">{screen==='ticket'?(ticket||'—'  ):(existingTicket||'—')}</div>
            {tirageText && <div style={{ fontSize:11,color:'rgba(255,255,255,.45)' }}>🗓️ {tirageText}</div>}
          </div>
          {partenaires.length > 0 && <button className="btn-ghost" onClick={()=>setScreen('partenaires')}>🤝 Nos partenaires</button>}
        </div>
      )}
    </div>
  )
}
