'use client'
import { useState, useEffect, useRef } from 'react'
import { writeJoueur, parcoursCSS, SOURCES, AGE_OPTIONS } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import type { ParcoursPageData } from '@/lib/parcours'

type Screen = 'landing' | 'spin' | 'result' | 'form' | 'partenaires' | 'ticket' | 'already'
interface Segment { label: string; color: string; perdant?: boolean; stock?: number }
interface Props extends ParcoursPageData { evId: string }

export default function SpinClient({ ev, lots, partenaires, evId }: Props) {
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const c = ev?.couleur ?? '#7C2D92'
  const nom = ev?.nom ?? 'Roue de la fortune'
  const segments = (cfg.spinSegments ?? []) as Segment[]
  const tirageText = (cfg.tirageDate as string) ? `Tirage ${cfg.tirageDate}` : ''
  const lsKey = `flowin_played_${evId}`

  const [screen, setScreen] = useState<Screen>('landing')
  const [spinning, setSpinning] = useState(false)
  const [resultSeg, setResultSeg] = useState<Segment | null>(null)
  const [angle, setAngle] = useState(0)
  const [form, setForm] = useState({ prenom:'',nom:'',email:'',tel:'',genre:'',age:'',cp:'',source:'' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState('')
  const [existingTicket, setExistingTicket] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { try { const s = localStorage.getItem(lsKey); if (s) { setExistingTicket(s); setScreen('already') } } catch {} }, [lsKey])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !segments.length) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width, cx = w/2, cy = w/2, r = cx - 8
    const n = segments.length, arc = (2 * Math.PI) / n
    ctx.clearRect(0, 0, w, w)
    segments.forEach((seg, i) => {
      const start = i * arc + angle, end = start + arc
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath()
      ctx.fillStyle = seg.color || '#7C2D92'; ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1; ctx.stroke()
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + arc/2)
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 3
      const txt = seg.label.length > 14 ? seg.label.slice(0,12)+'…' : seg.label
      ctx.fillText(txt, r - 10, 4); ctx.restore()
    })
    // Centre
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill()
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.fillStyle = c; ctx.fill()
  }, [segments, angle, c])

  function spinWheel() {
    if (spinning || !segments.length) return
    setSpinning(true)
    const eligible = segments.filter(s => !s.perdant && (s.stock === undefined || s.stock > 0))
    const pool = eligible.length ? eligible : segments
    const target = pool[Math.floor(Math.random() * pool.length)]
    const targetIdx = segments.indexOf(target)
    const arc = (2 * Math.PI) / segments.length
    const targetAngle = -(targetIdx * arc + arc/2 - Math.PI/2) + (Math.PI * 8)
    let start: number, prev = angle
    const dur = 4000
    const animate = (ts: number) => {
      if (!start) start = ts
      const prog = Math.min((ts - start) / dur, 1)
      const ease = 1 - Math.pow(1 - prog, 4)
      const cur = prev + (targetAngle - prev) * ease
      setAngle(cur)
      if (prog < 1) requestAnimationFrame(animate)
      else { setSpinning(false); setResultSeg(target); setScreen('result') }
    }
    requestAnimationFrame(animate)
  }

  async function handleSubmit() {
    const errs: Record<string,string> = {}
    if (!form.prenom.trim()) errs.prenom = 'Obligatoire'
    if (!form.nom.trim()) errs.nom = 'Obligatoire'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    if (form.tel.replace(/\s/g,'').length < 8) errs.tel = 'Invalide'
    setErrors(errs); if (Object.keys(errs).length) return
    setSubmitting(true)
    const tc = generateTicket('SP')
    const res = await writeJoueur({ email:form.email,prenom:form.prenom,nom:form.nom,tel:form.tel,code_postal:form.cp,genre:form.genre,age_tranche:form.age,decouverte:form.source.replace(/^[^ ]+ /,'')||undefined,events:[evId],ticket_code:tc,source:'spin',prefix:'SP' })
    setSubmitting(false)
    if (res.duplicate) { setExistingTicket(res.ticket); try{localStorage.setItem(lsKey,res.ticket)}catch{}; setScreen('already'); return }
    setTicket(res.ticket); setExistingTicket(res.ticket); try{localStorage.setItem(lsKey,res.ticket)}catch{}; setScreen('ticket')
  }


  /* Navigation postMessage — flèches dashboard SA */
  useEffect(() => {
    const NAV_SCREENS: Screen[] = ['landing', 'spin', 'result', 'form', 'ticket', 'already']
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
      <style>{parcoursCSS(c)}</style>

      {screen === 'landing' && (
        <div className="screen" style={{ paddingTop:32,textAlign:'center' }}>
          <div style={{ fontSize:48,marginBottom:14 }}>🎡</div>
          <div style={{ fontSize:24,fontWeight:900,marginBottom:8 }}>{nom}</div>
          <div style={{ fontSize:13,color:'rgba(255,255,255,.55)',marginBottom:20 }}>{(cfg.subtitle as string)||'Tentez votre chance !'}</div>
          {tirageText && <div style={{ background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.25)',borderRadius:10,padding:'10px 14px',fontSize:12,fontWeight:700,color:'rgba(255,255,255,.8)',marginBottom:14 }}>🗓️ {tirageText}</div>}
          <button className="btn" onClick={()=>setScreen('spin')}>🎡 Faire tourner la roue →</button>
          <div style={{ fontSize:10,textAlign:'center',color:'rgba(255,255,255,.3)',margin:'6px 0 8px' }}>Jeu gratuit · Sans achat obligatoire</div>
          {partenaires.length > 0 && <button className="btn-ghost" onClick={()=>setScreen('partenaires')}>🤝 Nos partenaires</button>}
        </div>
      )}

      {screen === 'spin' && (
        <div className="screen" style={{ alignItems:'center',paddingTop:24 }}>
          <div style={{ fontSize:15,fontWeight:800,marginBottom:20,textAlign:'center' }}>Appuie sur la roue !</div>
          <div style={{ position:'relative',width:300,height:300,cursor:spinning?'default':'pointer' }} onClick={spinWheel}>
            <canvas ref={canvasRef} width={300} height={300} style={{ borderRadius:'50%',boxShadow:'0 8px 40px rgba(0,0,0,.4)' }} />
            <div style={{ position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)',fontSize:28,filter:'drop-shadow(0 2px 6px rgba(0,0,0,.6))' }}>▼</div>
          </div>
          <div style={{ marginTop:20,fontSize:13,color:'rgba(255,255,255,.45)' }}>{spinning?'En cours…':'Appuie pour tourner !'}</div>
        </div>
      )}

      {screen === 'result' && resultSeg && (
        <div className="screen" style={{ justifyContent:'center',textAlign:'center' }}>
          {resultSeg.perdant ? (
            <>
              <div style={{ fontSize:48,marginBottom:12 }}>😅</div>
              <div style={{ fontSize:22,fontWeight:900,marginBottom:8 }}>Pas de chance !</div>
              <div style={{ fontSize:14,color:'rgba(255,255,255,.55)',marginBottom:20 }}>Laisse tes coordonnées quand même pour participer au tirage !</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:48,marginBottom:12 }}>🎉</div>
              <div style={{ fontSize:22,fontWeight:900,marginBottom:8 }}>Tu as gagné !</div>
              <div style={{ background:`${resultSeg.color}22`,border:`2px solid ${resultSeg.color}66`,borderRadius:14,padding:'16px 20px',fontSize:17,fontWeight:800,color:'#fff',marginBottom:20 }}>{resultSeg.label}</div>
            </>
          )}
          <button className="btn" onClick={()=>setScreen('form')}>Laisser mes coordonnées →</button>
        </div>
      )}

      {screen === 'form' && (
        <div className="screen">
          <div className="header"><div><div className="title">Mes coordonnées</div><div className="sub">{nom}{resultSeg&&!resultSeg.perdant?` · Lot : ${resultSeg.label}`:''}</div></div></div>
          <div className="grid2" style={{ marginBottom:12 }}>
            {[['prenom','Prénom *','Camille'],['nom','Nom *','Dupont']].map(([k,l,p])=>(
              <div key={k}><label className="label">{l}</label><input className={`input${errors[k]?' err':''}`} placeholder={p} value={form[k as keyof typeof form]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />{errors[k]&&<div className="err">{errors[k]}</div>}</div>
            ))}
          </div>
          <div style={{ marginBottom:12 }}><label className="label">Email *</label><input className={`input${errors.email?' err':''}`} type="email" placeholder="nom@exemple.fr" autoCapitalize="none" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />{errors.email&&<div className="err">{errors.email}</div>}</div>
          <div style={{ marginBottom:12 }}><label className="label">Téléphone *</label><input className={`input${errors.tel?' err':''}`} type="tel" placeholder="06 XX" value={form.tel} onChange={e=>setForm(f=>({...f,tel:e.target.value}))} />{errors.tel&&<div className="err">{errors.tel}</div>}</div>
          <div className="grid2" style={{ marginBottom:12 }}>
            <div><label className="label">Tranche d'âge</label><select className="input" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))}>{AGE_OPTIONS.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}</select></div>
            <div><label className="label">CP</label><input className="input" placeholder="06140" value={form.cp} onChange={e=>setForm(f=>({...f,cp:e.target.value}))} /></div>
          </div>
          <div className="rgpd"><div className="rgpd-check">✓</div><div>J'accepte d'être recontacté(e). Données jamais cédées.</div></div>
          <button className="btn" style={{ marginTop:16 }} onClick={handleSubmit} disabled={submitting}>{submitting?'Envoi…':'✓ Valider →'}</button>
        </div>
      )}

      {screen === 'partenaires' && (
        <div className="screen">
          <div className="header"><div className="back" onClick={()=>setScreen('landing')}>←</div><div className="title">Nos partenaires</div></div>
          <div className="grid2" style={{ marginBottom:16 }}>{partenaires.map((p,i)=><div key={p.id} className="part-tile" onClick={()=>{}}>{p.image_url?<img src={p.image_url} alt={p.nom} style={{width:52,height:52,objectFit:'contain',borderRadius:8,display:'block',margin:'0 auto 6px'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />:<div style={{fontSize:32,marginBottom:6}}>{p.emoji??'🤝'}</div>}<div style={{fontSize:11,fontWeight:700}}>{p.nom}</div></div>)}</div>
          {existingTicket ? (
            <button className="btn" style={{background:'rgba(34,197,94,.15)',border:'2px solid #22C55E',color:'#4ADE80'}}
              onClick={()=>setScreen('already')}>✅ Déjà joué · revoir mon ticket</button>
          ) : (
            <button className="btn" onClick={()=>setScreen('spin')}>Jouer →</button>
          )}
        </div>
      )}

      {(screen === 'ticket' || screen === 'already') && (
        <div className="screen" style={{ justifyContent:'center',textAlign:'center' }}>
          <div style={{ fontSize:48,marginBottom:12 }}>{screen==='ticket'?'🎉':'✅'}</div>
          <div style={{ fontSize:22,fontWeight:900,marginBottom:6 }}>{screen==='ticket'?'Inscription confirmée !':'Déjà joué !'}</div>
          <div className="card" style={{ borderTop:`4px solid ${c}`,marginBottom:16,marginTop:20 }}>
            <div style={{ fontSize:32,marginBottom:8 }}>🎟️</div>
            <div className="ticket-code">{screen==='ticket'?ticket:existingTicket}</div>
            {tirageText && <div style={{ fontSize:11,color:'rgba(255,255,255,.45)' }}>🗓️ {tirageText}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
