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

  // ── WHEEL DRAWING — Canova style ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !segments.length) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, CX = W/2, CY = W/2
    const sR = 118, RIM = 16, hR = 22
    const N = segments.length, arc = (2 * Math.PI) / N

    ctx.clearRect(0, 0, W, W)

    // Blue background
    const bg = ctx.createRadialGradient(CX, CY*0.65, 30, CX, CY, 180)
    bg.addColorStop(0, '#1030A0')
    bg.addColorStop(0.4, '#0A1E6A')
    bg.addColorStop(1, '#030818')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, W)

    const oR = sR + RIM

    // Shadow
    ctx.save(); ctx.translate(0, 4)
    ctx.beginPath(); ctx.arc(CX, CY, oR+2, 0, Math.PI*2)
    ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.fill(); ctx.restore()

    // Blue drum rim (18 concentric passes)
    for (let i = 0; i <= 18; i++) {
      const t = i/18, r = sR + t*RIM
      const brt = 0.5 + Math.pow(Math.sin(t*Math.PI*0.92+0.1), 1.2)*0.6
      ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI*2)
      ctx.strokeStyle = `rgb(${~~(10+brt*25)},${~~(48+brt*98)},${~~(172+brt*68)})`
      ctx.lineWidth = RIM/18*1.5; ctx.stroke()
    }
    // Specular highlight top-left
    ctx.save()
    ctx.beginPath(); ctx.arc(CX, CY, sR+RIM*0.45, -Math.PI*0.82, -Math.PI*0.12)
    ctx.strokeStyle = 'rgba(180,220,255,.2)'; ctx.lineWidth = 9; ctx.stroke()
    ctx.restore()
    ctx.beginPath(); ctx.arc(CX, CY, oR+2, 0, Math.PI*2)
    ctx.strokeStyle = 'rgba(0,20,80,.75)'; ctx.lineWidth = 2; ctx.stroke()
    ctx.beginPath(); ctx.arc(CX, CY, oR+1, 0, Math.PI*2)
    ctx.strokeStyle = 'rgba(80,160,255,.45)'; ctx.lineWidth = 1.2; ctx.stroke()

    // Amber LED dots
    const dR = sR + RIM*0.55
    for (let i = 0; i < 12; i++) {
      const da = i/12*Math.PI*2
      const dx = CX + Math.cos(da)*dR, dy = CY + Math.sin(da)*dR
      ctx.beginPath(); ctx.arc(dx, dy, 3.5, 0, Math.PI*2)
      ctx.fillStyle = 'rgba(0,12,45,.7)'; ctx.fill()
      const dg = ctx.createRadialGradient(dx-0.8, dy-0.8, 0, dx, dy, 2.8)
      dg.addColorStop(0, '#FFE566'); dg.addColorStop(0.5, '#FFAA00'); dg.addColorStop(1, '#CC7700')
      ctx.beginPath(); ctx.arc(dx, dy, 2.8, 0, Math.PI*2); ctx.fillStyle = dg; ctx.fill()
      ctx.beginPath(); ctx.arc(dx, dy, 1, 0, Math.PI*2)
      ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fill()
    }

    // Chrome separator ring
    ctx.beginPath(); ctx.arc(CX, CY, sR+2, 0, Math.PI*2)
    ctx.strokeStyle = 'rgba(0,0,0,.38)'; ctx.lineWidth = 2.5; ctx.stroke()
    const cg = ctx.createLinearGradient(CX-sR, CY, CX+sR, CY)
    cg.addColorStop(0, '#B8C0D0'); cg.addColorStop(0.3, '#E0E8F4')
    cg.addColorStop(0.7, '#A0ACBC'); cg.addColorStop(1, '#B8C0D0')
    ctx.beginPath(); ctx.arc(CX, CY, sR+1, 0, Math.PI*2)
    ctx.strokeStyle = cg; ctx.lineWidth = 3; ctx.stroke()

    // Segments
    segments.forEach((seg, i) => {
      const s = i*arc + angle + 0.025, e = s + arc - 0.05
      const mid = (s+e)/2
      const mx = CX + Math.cos(mid)*sR*0.52, my = CY + Math.sin(mid)*sR*0.52
      const col = seg.color || c
      const sg = ctx.createRadialGradient(mx, my, 0, CX, CY, sR)
      sg.addColorStop(0, col+'FF'); sg.addColorStop(0.6, col+'CC'); sg.addColorStop(1, col+'88')
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, sR, s, e); ctx.closePath()
      ctx.fillStyle = sg; ctx.fill()
      // 3D bevel highlight
      ctx.save()
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, sR, s, e); ctx.closePath(); ctx.clip()
      const bv = ctx.createLinearGradient(
        CX+Math.cos(mid)*8, CY+Math.sin(mid)*8,
        CX+Math.cos(mid)*sR, CY+Math.sin(mid)*sR
      )
      bv.addColorStop(0, 'rgba(255,255,255,.28)')
      bv.addColorStop(0.4, 'rgba(255,255,255,.07)')
      bv.addColorStop(1, 'rgba(0,0,0,.2)')
      ctx.fillStyle = bv; ctx.fillRect(CX-sR, CY-sR, sR*2, sR*2)
      ctx.restore()
      // Divider
      ctx.beginPath(); ctx.moveTo(CX, CY)
      ctx.lineTo(CX+Math.cos(s)*sR, CY+Math.sin(s)*sR)
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5; ctx.stroke()
      // Label
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(mid)
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      ctx.font = 'bold 11px Inter,system-ui,sans-serif'
      const txt = seg.label.length > 13 ? seg.label.slice(0,12)+'…' : seg.label
      ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 4; ctx.strokeText(txt, sR-8, 0)
      ctx.fillStyle = '#fff'; ctx.fillText(txt, sR-8, 0)
      ctx.restore()
    })
    ctx.beginPath(); ctx.arc(CX, CY, sR, 0, Math.PI*2)
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.5; ctx.stroke()

    // Hub — chrome rings + green ball + SPIN
    for (let r = hR+10; r > hR+1; r -= 0.7) {
      const t = (r-hR-1)/9, v = ~~(138+Math.sin(t*Math.PI)*105)
      ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI*2)
      ctx.strokeStyle = `rgb(${v},${v+8},${v+18})`; ctx.lineWidth = 0.8; ctx.stroke()
    }
    ctx.beginPath(); ctx.arc(CX, CY, hR+10, 0, Math.PI*2)
    ctx.strokeStyle = 'rgba(80,100,140,.7)'; ctx.lineWidth = 2; ctx.stroke()
    const hg = ctx.createRadialGradient(CX-hR*0.3, CY-hR*0.32, 2, CX, CY, hR)
    hg.addColorStop(0, '#88DD44'); hg.addColorStop(0.4, '#44AA22'); hg.addColorStop(1, '#114408')
    ctx.beginPath(); ctx.arc(CX, CY, hR, 0, Math.PI*2); ctx.fillStyle = hg; ctx.fill()
    ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, hR, 0, Math.PI*2); ctx.clip()
    const hs = ctx.createRadialGradient(CX-hR*0.3, CY-hR*0.34, 0, CX, CY, hR)
    hs.addColorStop(0, 'rgba(200,255,140,.45)'); hs.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = hs; ctx.fillRect(CX-hR, CY-hR, hR*2, hR*2); ctx.restore()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter,system-ui,sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SPIN', CX, CY)

    // Pointer — blue chrome angular
    const py = CY - sR - RIM*0.5
    ctx.save(); ctx.translate(2, 3)
    ctx.beginPath()
    ctx.moveTo(CX-10, py-11); ctx.lineTo(CX+10, py-11)
    ctx.lineTo(CX+6, py+1); ctx.lineTo(CX, py+11); ctx.lineTo(CX-6, py+1)
    ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fill(); ctx.restore()
    const ptg = ctx.createLinearGradient(CX-10, 0, CX+10, 0)
    ptg.addColorStop(0, '#6AABEE'); ptg.addColorStop(0.5, '#AACCF0'); ptg.addColorStop(1, '#6AABEE')
    ctx.beginPath()
    ctx.moveTo(CX-10, py-11); ctx.lineTo(CX+10, py-11)
    ctx.lineTo(CX+6, py+1); ctx.lineTo(CX, py+11); ctx.lineTo(CX-6, py+1)
    ctx.closePath(); ctx.fillStyle = ptg; ctx.fill()
    ctx.strokeStyle = 'rgba(80,140,210,.5)'; ctx.lineWidth = 1; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(CX, py-9); ctx.lineTo(CX, py+7)
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.stroke()
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
    <div style={{ maxWidth:430,margin:'0 auto',minHeight:'100dvh',background:'#060C1A',color:'#fff',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{parcoursCSS(c)}</style>

      {screen === 'landing' && (
        <div className="screen" style={{ paddingTop:32,textAlign:'center' }}>
          <div style={{ marginBottom:14 }}>
            <i className="ti ti-rotate-clockwise" style={{ fontSize:48,color:c }} aria-hidden="true" />
          </div>
          <div style={{ fontSize:24,fontWeight:900,marginBottom:8 }}>{nom}</div>
          <div style={{ fontSize:13,color:'rgba(255,255,255,.55)',marginBottom:20 }}>{(cfg.subtitle as string)||'Tentez votre chance !'}</div>
          {tirageText && (
            <div style={{ background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.25)',borderRadius:10,padding:'10px 14px',fontSize:12,fontWeight:700,color:'rgba(255,255,255,.8)',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
              <i className="ti ti-calendar" style={{ fontSize:14 }} aria-hidden="true" />{tirageText}
            </div>
          )}
          <button className="btn" onClick={()=>setScreen('spin')}>
            <i className="ti ti-rotate-clockwise" style={{ marginRight:6 }} aria-hidden="true" />Faire tourner la roue →
          </button>
          <div style={{ fontSize:10,textAlign:'center',color:'rgba(255,255,255,.3)',margin:'6px 0 8px' }}>Jeu gratuit · Sans achat obligatoire</div>
          {partenaires.length > 0 && (
            <button className="btn-ghost" onClick={()=>setScreen('partenaires')}>
              <i className="ti ti-users" style={{ marginRight:6 }} aria-hidden="true" />Nos partenaires
            </button>
          )}
        </div>
      )}

      {screen === 'spin' && (
        <div className="screen" style={{ alignItems:'center',paddingTop:16,background:'#060C1A' }}>
          <div style={{ fontSize:15,fontWeight:800,marginBottom:16,textAlign:'center',color:'rgba(255,255,255,.85)' }}>Appuie sur la roue !</div>
          <div style={{ position:'relative',width:300,height:300,cursor:spinning?'default':'pointer' }} onClick={spinWheel}>
            <canvas ref={canvasRef} width={300} height={300} style={{ borderRadius:8,display:'block' }} />
          </div>
          {/* GAME TIME badge */}
          <div style={{ marginTop:14,position:'relative',width:200,height:64 }}>
            {/* TIME block — behind */}
            <div style={{ position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',width:168,height:36,background:'linear-gradient(180deg,#9A28CC 0%,#7818A8 45%,#520C80 100%)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(0,0,0,.5)',border:'1px solid rgba(180,80,255,.4)' }}>
              <span style={{ fontSize:18,fontWeight:900,color:'rgba(235,210,255,.95)',letterSpacing:4 }}>TIME</span>
            </div>
            {/* GAME block — in front */}
            <div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:152,height:40,background:'linear-gradient(180deg,#5A88EE 0%,#3868D0 40%,#1A44A8 100%)',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(0,0,0,.5)',border:'1px solid rgba(140,180,255,.5)',zIndex:1 }}>
              <div style={{ position:'absolute',top:3,left:6,right:6,height:'40%',background:'rgba(255,255,255,.22)',borderRadius:14 }} />
              <span style={{ fontSize:22,fontWeight:900,color:'#fff',letterSpacing:3,textShadow:'0 1px 4px rgba(0,0,100,.4)',position:'relative',zIndex:1 }}>GAME</span>
            </div>
          </div>
          <div style={{ marginTop:10,fontSize:12,color:'rgba(255,255,255,.35)' }}>{spinning?'En cours…':'Appuie pour tourner !'}</div>
        </div>
      )}

      {screen === 'result' && resultSeg && (
        <div className="screen" style={{ justifyContent:'center',textAlign:'center' }}>
          {resultSeg.perdant ? (
            <>
              <div style={{ marginBottom:12 }}>
                <i className="ti ti-mood-sad" style={{ fontSize:48,color:'rgba(255,255,255,.4)' }} aria-hidden="true" />
              </div>
              <div style={{ fontSize:22,fontWeight:900,marginBottom:8 }}>Pas cette fois !</div>
              <div style={{ fontSize:14,color:'rgba(255,255,255,.55)',marginBottom:20 }}>Laisse tes coordonnées pour participer au tirage final.</div>
              <button className="btn" onClick={()=>setScreen('form')}>Participer au tirage →</button>
            </>
          ) : (
            <>
              <div style={{ marginBottom:12 }}>
                <i className="ti ti-star" style={{ fontSize:48,color:c }} aria-hidden="true" />
              </div>
              <div style={{ fontSize:22,fontWeight:900,marginBottom:8 }}>Tu as gagné !</div>
              <div style={{ background:`${resultSeg.color}22`,border:`2px solid ${resultSeg.color}66`,borderRadius:14,padding:'16px 20px',fontSize:17,fontWeight:800,color:'#fff',marginBottom:20 }}>{resultSeg.label}</div>
              <button className="btn" onClick={()=>setScreen('form')}>Réclamer mon gain →</button>
            </>
          )}
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
          <div className="grid2" style={{ marginBottom:16 }}>{partenaires.map((p,i)=><div key={p.id} className="part-tile" onClick={()=>{}}>{p.image_url?<img src={p.image_url} alt={p.nom} style={{width:52,height:52,objectFit:'contain',borderRadius:8,display:'block',margin:'0 auto 6px'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />:p.emoji?<div style={{fontSize:32,marginBottom:6}}>{p.emoji}</div>:<div style={{fontSize:28,marginBottom:6,color:c}}><i className="ti ti-users" aria-hidden="true"/></div>}<div style={{fontSize:11,fontWeight:700}}>{p.nom}</div></div>)}</div>
          {existingTicket ? (
            <button className="btn" style={{background:'rgba(34,197,94,.15)',border:'2px solid #22C55E',color:'#4ADE80'}}
              onClick={()=>setScreen('already')}>
              <i className="ti ti-check" style={{ marginRight:6 }} aria-hidden="true" />Déjà joué · revoir mon ticket
            </button>
          ) : (
            <button className="btn" onClick={()=>setScreen('spin')}>Jouer →</button>
          )}
        </div>
      )}

      {(screen === 'ticket' || screen === 'already') && (
        <div className="screen" style={{ justifyContent:'center',textAlign:'center' }}>
          <div style={{ marginBottom:12 }}>
            <i className={`ti ${screen==='ticket'?'ti-check':'ti-check-circle'}`} style={{ fontSize:48,color:c }} aria-hidden="true" />
          </div>
          <div style={{ fontSize:22,fontWeight:900,marginBottom:6 }}>{screen==='ticket'?'Inscription confirmée !':'Déjà joué !'}</div>
          <div className="card" style={{ borderTop:`4px solid ${c}`,marginBottom:16,marginTop:20 }}>
            <div style={{ marginBottom:8 }}>
              <i className="ti ti-ticket" style={{ fontSize:32,color:c }} aria-hidden="true" />
            </div>
            <div className="ticket-code">{screen==='ticket'?ticket:existingTicket}</div>
            {tirageText && (
              <div style={{ fontSize:11,color:'rgba(255,255,255,.45)',display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginTop:6 }}>
                <i className="ti ti-calendar" style={{ fontSize:12 }} aria-hidden="true" />{tirageText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
