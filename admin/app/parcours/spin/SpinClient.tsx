'use client'
import { useState, useEffect, useRef } from 'react'
import { writeJoueur, parcoursCSS, getJoueurLocal, claimJoueur } from '@/lib/parcours'
import { NDS_JEU_FOND, NDS_JEU_POLICE } from '@/lib/parcours'
import ParcoursOutro from '../_components/ParcoursOutro'
import { FlowinBadge } from '@/components/parcours/ParcoursBranding'
import ParcoursChampsStandard from '@/components/parcours/ParcoursChampsStandard'
import type { GainImmediat } from '@/lib/parcours'
import { trackVisite } from '@/lib/track'
import { generateTicket } from '@/lib/ticket'
import type { ParcoursPageData } from '@/lib/parcours'
import { useParcoursTracking } from '@/lib/parcours-tracking'

type Screen = 'landing' | 'spin' | 'result' | 'form' | 'partenaires' | 'ticket' | 'already'
interface Segment { label: string; color: string; perdant?: boolean; stock?: number; mode?: 'immediat' | 'tirage' | 'voisin' }
interface Props extends ParcoursPageData { evId: string }

export default function SpinClient({ ev, lots, partenaires, evId }: Props) {
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const c = ev?.couleur ?? '#7C2D92'
  const nom = ev?.nom ?? 'Roue de la fortune'
  const segments = (cfg.spinSegments ?? []) as Segment[]
  const tirageText = (cfg.tirageDate as string) ? `Tirage ${cfg.tirageDate}` : ''
  const lsKey = `flowin_played_${evId}`
  const isBtob = (ev?.client_type === 'btob')
  const SECTEURS = ['Commerçant','Restaurateur','Exposant','Organisateur','Entreprise','Association','Collectivité','Autre']

  const [screen, setScreen] = useState<Screen>('landing')
  /* Referentiel 8 : gain immediat attribue par la regle de l event. */
  const [gain, setGain] = useState<GainImmediat | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [resultSeg, setResultSeg] = useState<Segment | null>(null)
  const [angle, setAngle] = useState(0)
  const [form, setForm] = useState({ prenom:'',nom:'',email:'',tel:'',genre:'',age:'',cp:'',source:'',enseigne:'',secteur:'' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState('')
  const [existingTicket, setExistingTicket] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const confettiRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { try { const s = localStorage.getItem(lsKey); if (s) { setExistingTicket(s); setScreen('already') } } catch {} }, [lsKey])
  useParcoursTracking('spin', evId, screen)

  /* Bloc 2 — compte déjà créé : on saute le formulaire et on attribue directement */
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
      const res = await claimJoueur(local, evId, 'SP', undefined, { lotGagne: (resultSeg && !resultSeg.perdant) ? resultSeg.label : undefined })
      setGain(res.gain ?? null)
      try { localStorage.setItem(lsKey, res.ticket) } catch {}
      setExistingTicket(res.ticket)
      if (res.duplicate) { setScreen('already'); return }
      setTicket(res.ticket); setScreen('ticket')
    })()
  }, [screen, reco, evId, lsKey, resultSeg])

  /* Rendu plat (2D, aplats de couleur francs) plutot que l ancien style casino
     3D chrome/LED -- reference donnee par Romain : cadran plat, une couleur par
     secteur, moyeu simple porteur du mot SPIN, pointeur sobre. */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !segments.length) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, CX = W/2, CY = W/2
    const sR = W*0.46, hR = W*0.13
    const n = segments.length, ARC = (2 * Math.PI) / n
    ctx.clearRect(0, 0, W, W)

    // Halo doux derriere le cadran
    ctx.beginPath(); ctx.arc(CX, CY, sR+6, 0, Math.PI*2)
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fill()

    // Secteurs -- aplat de couleur, pas de degrade
    const maxTexte = sR - hR - 16
    segments.forEach((seg, i) => {
      const s = i*ARC + angle, e = s + ARC, mid = (s+e)/2
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, sR, s, e); ctx.closePath()
      ctx.fillStyle = seg.color || '#3B5CC4'
      ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke()

      ctx.save(); ctx.translate(CX, CY); ctx.rotate(mid)
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      ctx.font = '700 13px system-ui, -apple-system, sans-serif'
      /* Troncature sur largeur reelle mesuree, pas sur un nombre de caracteres :
         un texte qui deborde de son secteur peinturlurait sur le voisin. */
      let txt = seg.label || '—'
      if (ctx.measureText(txt).width > maxTexte) {
        while (txt.length > 1 && ctx.measureText(txt + '…').width > maxTexte) txt = txt.slice(0, -1)
        txt += '…'
      }
      ctx.fillStyle = '#fff'
      ctx.fillText(txt, sR-14, 0)
      ctx.restore()
    })

    // Contour exterieur blanc
    ctx.beginPath(); ctx.arc(CX, CY, sR, 0, Math.PI*2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke()

    // Moyeu blanc simple avec le mot SPIN
    ctx.beginPath(); ctx.arc(CX, CY, hR, 0, Math.PI*2)
    ctx.fillStyle = '#fff'; ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; ctx.stroke()
    ctx.fillStyle = c || '#3B5CC4'
    ctx.font = '800 13px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('SPIN', CX, CY)

    // Pointeur sobre, triangle plein en haut
    const py = CY - sR
    ctx.beginPath()
    ctx.moveTo(CX-12, py+2); ctx.lineTo(CX+12, py+2); ctx.lineTo(CX, py+22)
    ctx.closePath()
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1; ctx.stroke()
  }, [segments, angle, c, screen])

  /* Confettis sur écran de gain + ticket */
  useEffect(() => {
    const gainResult = screen === 'result' && resultSeg && !resultSeg.perdant
    const gainTicket = screen === 'ticket'
    if (!gainResult && !gainTicket) return
    const canvas = confettiRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    const COLS = ['#00B4A0','#3B5CC4','#7C3AED','#F97316','#FFD700','#06B6D4','#fff','#9333EA']
    type P = { x:number; y:number; vx:number; vy:number; r:number; col:string; rot:number; vr:number }
    const parts: P[] = []
    for (let i = 0; i < 140; i++) {
      parts.push({ x: W/2, y: H*0.32, vx: (Math.random()-0.5)*11, vy: Math.random()*-13-3, r: Math.random()*5+3, col: COLS[Math.floor(Math.random()*COLS.length)], rot: Math.random()*Math.PI, vr: (Math.random()-0.5)*0.3 })
    }
    let raf = 0, frame = 0
    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      frame++
      parts.forEach(p => {
        p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
        ctx.fillStyle = p.col; ctx.fillRect(-p.r, -p.r, p.r*2, p.r*1.4)
        ctx.restore()
      })
      if (frame < 180) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [screen, resultSeg])

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
    if (isBtob && !form.enseigne.trim()) errs.enseigne = 'Obligatoire'
    if (!form.prenom.trim()) errs.prenom = 'Obligatoire'
    if (!form.nom.trim()) errs.nom = 'Obligatoire'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    if (form.tel.replace(/\s/g,'').length < 8) errs.tel = 'Invalide'
    if (isBtob && !form.secteur) errs.secteur = 'Obligatoire'
    setErrors(errs); if (Object.keys(errs).length) return
    setSubmitting(true)
    const tc = generateTicket('SP')
    const res = await writeJoueur({
      email:form.email, prenom:form.prenom, nom:form.nom, tel:form.tel, code_postal:form.cp,
      genre:form.genre || undefined, age_tranche: isBtob ? undefined : (form.age || undefined),
      decouverte:form.source.replace(/^[^ ]+ /,'')||undefined,
      enseigne: isBtob ? (form.enseigne || undefined) : undefined,
      secteur: isBtob ? (form.secteur || undefined) : undefined,
      client_type: isBtob ? 'btob' : undefined,
      lot_gagne: (resultSeg && !resultSeg.perdant) ? resultSeg.label : undefined,
      events:[evId], ticket_code:tc, source:'spin', prefix:'SP'
    })
    setGain(res.gain ?? null)
    setSubmitting(false)
    if (res.duplicate) { setExistingTicket(res.ticket); try{localStorage.setItem(lsKey,res.ticket)}catch{}; setScreen('already'); return }
    if(!res.success){if(res.error)console.error('[spin] Supabase échoué:',res.error);return}
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
    <div style={{ maxWidth:430,margin:'0 auto',minHeight:'100dvh',background: NDS_JEU_FOND, color: '#fff', fontFamily: NDS_JEU_POLICE }}>
      <style>{parcoursCSS(c)}</style>

      {screen === 'landing' && (
        <div className="screen" style={{ justifyContent:'center',textAlign:'center' }}>
          <div className="parc-logo-halo">
            <i className="ti ti-rotate-clockwise" style={{ fontSize:44,color:c }} aria-hidden="true" />
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
          <FlowinBadge />
        </div>
      )}

      {screen === 'spin' && (
        <div className="screen" style={{ alignItems:'center',paddingTop:24 }}>
          <div style={{ fontSize:15,fontWeight:800,marginBottom:14,textAlign:'center' }}>Appuie sur la roue !</div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:'6px 12px',justifyContent:'center',maxWidth:300,marginBottom:16 }}>
            {segments.map((sg,i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'rgba(255,255,255,.75)' }}>
                <span style={{ width:8,height:8,borderRadius:'50%',background:sg.color||'#3B5CC4',flexShrink:0 }} />
                {sg.label || '—'}
              </div>
            ))}
          </div>
          <div style={{ position:'relative',width:300,height:300,cursor:spinning?'default':'pointer' }} onClick={spinWheel}>
            <canvas ref={canvasRef} width={300} height={300} style={{ borderRadius:'50%',boxShadow:'0 14px 34px rgba(0,0,0,.35)' }} />
          </div>
          <button className="btn" onClick={spinWheel} disabled={spinning} style={{ maxWidth:240,marginTop:18 }}>
            <i className="ti ti-rotate-clockwise" style={{ marginRight:6 }} aria-hidden="true" />{spinning?'La roue tourne…':'Faire tourner la roue'}
          </button>
          <div style={{ marginTop:10,fontSize:12,color:'rgba(255,255,255,.4)' }}>{spinning?'':'ou appuie directement sur la roue'}</div>
        </div>
      )}

      {screen === 'result' && resultSeg && (
        <div className="screen" style={{ justifyContent:'center',textAlign:'center',position:'relative' }}>
          {!resultSeg.perdant && (
            <canvas ref={confettiRef} width={430} height={600} style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:5 }} />
          )}
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
              {resultSeg.mode === 'tirage' && (
                <div style={{ fontSize:13,color:'rgba(255,255,255,.6)',marginBottom:16,maxWidth:300 }}>Ce lot est un bon inscrit pour un tirage au sort. Laisse tes coordonnées pour y participer.</div>
              )}
              {resultSeg.mode === 'voisin' && (
                <div style={{ fontSize:13,color:'rgba(255,255,255,.6)',marginBottom:16,maxWidth:300 }}>Ce lot se transmet : passe ton ticket à la personne à côté de toi, c&apos;est elle qui le réclame.</div>
              )}
              <button className="btn" onClick={()=>setScreen('form')}>
                {resultSeg.mode === 'tirage' ? 'Participer au tirage →' : resultSeg.mode === 'voisin' ? 'Continuer →' : 'Réclamer mon gain →'}
              </button>
            </>
          )}
        </div>
      )}

      {screen === 'form' && !getJoueurLocal() && (
        <div className="screen">
          <div className="header"><div><div className="title">{isBtob?'Vos coordonnées':'Crée ton compte'}</div><div className="sub">{isBtob ? nom : 'Pour réclamer ton lot'}{resultSeg&&!resultSeg.perdant?` · ${resultSeg.label}`:''}</div></div></div>
          {isBtob && (
            <div style={{ marginBottom:12 }}>
              <label className="label">Enseigne / Structure *</label>
              <input className={`input${errors.enseigne?' err':''}`} autoComplete="organization" value={form.enseigne} onChange={e=>setForm(f=>({...f,enseigne:e.target.value}))} />{errors.enseigne&&<div className="err">{errors.enseigne}</div>}
            </div>
          )}
          <div className="grid2" style={{ marginBottom:12 }}>
            {[['prenom','Prénom *','given-name'],['nom','Nom *','family-name']].map(([k,l,ac])=>(
              <div key={k}><label className="label">{l}</label><input className={`input${errors[k]?' err':''}`} autoComplete={ac} value={form[k as keyof typeof form]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />{errors[k]&&<div className="err">{errors[k]}</div>}</div>
            ))}
          </div>
          <div style={{ marginBottom:12 }}><label className="label">Email *</label><input className={`input${errors.email?' err':''}`} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />{errors.email&&<div className="err">{errors.email}</div>}</div>
          <div style={{ marginBottom:12 }}><label className="label">Téléphone *</label><input className={`input${errors.tel?' err':''}`} type="tel" inputMode="tel" autoComplete="tel" value={form.tel} onChange={e=>setForm(f=>({...f,tel:e.target.value}))} />{errors.tel&&<div className="err">{errors.tel}</div>}</div>
          {isBtob ? (
            <div className="grid2" style={{ marginBottom:12 }}>
              <div><label className="label">Secteur d'activité *</label><select className={`input${errors.secteur?' err':''}`} value={form.secteur} onChange={e=>setForm(f=>({...f,secteur:e.target.value}))}><option value="">Choisir…</option>{SECTEURS.map(s=><option key={s} value={s}>{s}</option>)}</select>{errors.secteur&&<div className="err">{errors.secteur}</div>}</div>
              <div><label className="label">Code postal</label><input className="input" inputMode="numeric" autoComplete="postal-code" value={form.cp} onChange={e=>setForm(f=>({...f,cp:e.target.value}))} /></div>
            </div>
          ) : (
            <ParcoursChampsStandard form={form} setForm={setForm} />
          )}
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
        <div className="screen" style={{ justifyContent:'center',alignItems:'center',textAlign:'center',position:'relative',minHeight:'100dvh',background:'radial-gradient(ellipse at 50% 40%, #0a1f2e 0%, #060d18 70%)' }}>
          <canvas ref={confettiRef} width={430} height={700} style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:5 }} />
          {/* Rayons en fond */}
          <div style={{ position:'absolute',inset:0,zIndex:0,overflow:'hidden',opacity:0.35 }}>
            <div style={{ position:'absolute',top:'40%',left:'50%',width:'200%',height:'200%',transform:'translate(-50%,-50%)',background:'repeating-conic-gradient(from 0deg at 50% 50%, rgba(0,180,160,.18) 0deg 8deg, transparent 8deg 16deg)' }} />
          </div>
          {/* Carte teal */}
          <div style={{ position:'relative',zIndex:10,width:'88%',maxWidth:360,borderRadius:18,overflow:'hidden',border:'2px solid #14B8A6',boxShadow:'0 0 40px rgba(20,184,166,.5),0 12px 48px rgba(0,0,0,.6)',background:'#071620' }}>
            <div style={{ background:'linear-gradient(180deg,#16C8B0,#0E9E8C)',padding:'12px 0',fontSize:14,fontWeight:900,letterSpacing:3,color:'#fff' }}>✦ FÉLICITATIONS ✦</div>
            <div style={{ padding:'22px 20px 26px' }}>
              <div style={{ fontSize:46,marginBottom:10 }}>🥳</div>
              <div style={{ fontSize:11,fontWeight:800,letterSpacing:2,color:'#2DD4BF',marginBottom:4 }}>VOUS AVEZ GAGNÉ</div>
              <div style={{ fontSize:26,fontWeight:900,color:'#fff',marginBottom:18,textTransform:'uppercase' }}>{form.prenom||'Vous'}</div>
              <div style={{ border:'1px solid rgba(45,212,191,.4)',borderRadius:12,padding:'14px 16px',marginBottom:16,background:'rgba(20,184,166,.06)' }}>
                <div style={{ fontSize:11,fontWeight:700,color:'#2DD4BF',marginBottom:4 }}>Votre lot</div>
                <div style={{ fontSize:19,fontWeight:900,color:'#fff' }}>{resultSeg&&!resultSeg.perdant?resultSeg.label:'Lot offert'}</div>
              </div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,.55)',marginBottom:16 }}>Ticket <span style={{ fontWeight:800,color:'#fff',letterSpacing:1 }}>{screen==='ticket'?ticket:existingTicket}</span></div>
              {ev?.super_event_id ? (
                <ParcoursOutro superEventId={ev.super_event_id} gain={gain} />
              ) : (
                <>
                  {gain && <ParcoursOutro gain={gain} />}
                  <a href="tel:0616354936" className="btn" style={{ display:'block',textDecoration:'none',background:'linear-gradient(180deg,#16C8B0,#0E9E8C)',border:'none',borderRadius:100,padding:'13px 0',width:'82%',margin:'0 auto',fontWeight:900,letterSpacing:1,color:'#fff' }}>📞 Contactez-nous</a>
                  <button className="btn-ghost" style={{ display:'block',width:'82%',margin:'10px auto 0',background:'transparent',border:'1px solid rgba(255,255,255,.2)',borderRadius:100,padding:'10px 0',fontWeight:700,color:'rgba(255,255,255,.7)',cursor:'pointer' }} onClick={()=>{ if (evId === 'ev-flowin-demo') { window.location.href = '/landing' } else { setScreen('landing') } }}>← Retour à l&apos;accueil</button>
                </>
              )}
              {tirageText && (
                <div style={{ fontSize:11,color:'rgba(255,255,255,.45)',marginTop:12,display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}>
                  <i className="ti ti-calendar" style={{ fontSize:12 }} aria-hidden="true" />{tirageText}
                </div>
              )}
              <div style={{ fontSize:10,color:'rgba(255,255,255,.3)',marginTop:14,letterSpacing:1 }}>Powered by Flowin</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
