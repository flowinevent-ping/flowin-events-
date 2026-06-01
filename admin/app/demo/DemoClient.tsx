'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ywcqtupgoxfzkddqkztk.supabase.co',
  'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1'
)

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Screen = 'form' | 'spin' | 'win'
interface Seg { label: string; color: string; perdant?: boolean }
interface FormData {
  secteur: string; prenom: string; nom: string
  email: string; cp: string; tel: string
}

// ── SEGMENTS ──────────────────────────────────────────────────────────────────
const SEGS: Seg[] = [
  { label: '1er event offert', color: '#00B4A0' },
  { label: 'Accès démo',       color: '#3B5CC4' },
  { label: '1 mois gratuit',   color: '#8E24AA' },
  { label: 'Retentez !',       color: '#4A5568', perdant: true },
  { label: 'Onboarding',       color: '#E53935' },
  { label: 'Démo + 1 mois',   color: '#00BCD4' },
  { label: 'Formation',        color: '#1565C0' },
  { label: 'Retentez !',       color: '#374151', perdant: true },
  { label: 'Event offert',     color: '#6A1B9A' },
  { label: 'Support dédié',    color: '#00897B' },
]
const DARK = ['#007A6C','#29408C','#6A0080','#111827','#0088A0','#0D3E8C','#4A0070','#111827','#005048','#1A2468']

function genTicket() {
  return 'SP-2026-' + Math.floor(10000 + Math.random() * 89999)
}

// ── WHEEL DRAW ────────────────────────────────────────────────────────────────
function drawCanovaWheel(canvas: HTMLCanvasElement, angle: number) {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width, CX = W / 2, CY = W / 2
  const sR = 138, RIM = 18, hR = 26
  const N = SEGS.length, ARC = (2 * Math.PI) / N

  ctx.clearRect(0, 0, W, W)

  // Background bleu
  const bg = ctx.createRadialGradient(CX, CY * 0.65, 40, CX, CY, W * 0.7)
  bg.addColorStop(0, '#1030A0'); bg.addColorStop(0.4, '#0A1E6A'); bg.addColorStop(1, '#030818')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, W)

  const oR = sR + RIM

  // Shadow
  ctx.save(); ctx.translate(0, 8)
  ctx.beginPath(); ctx.arc(CX, CY, oR + 3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill(); ctx.restore()

  // Anneau bleu drum (20 passes)
  for (let i = 0; i <= 20; i++) {
    const t = i / 20, r = sR + t * RIM
    const brt = 0.5 + Math.pow(Math.sin(t * Math.PI * 0.92 + 0.1), 1.2) * 0.6
    ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgb(${~~(10 + brt * 25)},${~~(48 + brt * 98)},${~~(172 + brt * 68)})`
    ctx.lineWidth = RIM / 20 * 1.5; ctx.stroke()
  }
  // Spéculaire haut-gauche
  ctx.save()
  ctx.beginPath(); ctx.arc(CX, CY, sR + RIM * 0.45, -Math.PI * 0.82, -Math.PI * 0.12)
  ctx.strokeStyle = 'rgba(180,220,255,.22)'; ctx.lineWidth = 11; ctx.stroke()
  ctx.restore()
  ctx.beginPath(); ctx.arc(CX, CY, oR + 2, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0,20,80,.75)'; ctx.lineWidth = 2; ctx.stroke()
  ctx.beginPath(); ctx.arc(CX, CY, oR + 1, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(80,160,255,.45)'; ctx.lineWidth = 1.2; ctx.stroke()

  // LED dots amber (16 dots)
  const dR = sR + RIM * 0.55
  for (let i = 0; i < 16; i++) {
    const da = i / 16 * Math.PI * 2, dx = CX + Math.cos(da) * dR, dy = CY + Math.sin(da) * dR
    ctx.beginPath(); ctx.arc(dx, dy, 4.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,12,45,.7)'; ctx.fill()
    const dg = ctx.createRadialGradient(dx - 1, dy - 1, 0, dx, dy, 3.5)
    dg.addColorStop(0, '#FFE566'); dg.addColorStop(0.5, '#FFAA00'); dg.addColorStop(1, '#CC7700')
    ctx.beginPath(); ctx.arc(dx, dy, 3.5, 0, Math.PI * 2); ctx.fillStyle = dg; ctx.fill()
    ctx.beginPath(); ctx.arc(dx, dy, 1.3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill()
  }

  // Séparateur chrome
  ctx.beginPath(); ctx.arc(CX, CY, sR + 2, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0,0,0,.38)'; ctx.lineWidth = 2.5; ctx.stroke()
  const cg = ctx.createLinearGradient(CX - sR, CY, CX + sR, CY)
  cg.addColorStop(0, '#B8C0D0'); cg.addColorStop(0.3, '#E0E8F4'); cg.addColorStop(0.7, '#A0ACBC'); cg.addColorStop(1, '#B8C0D0')
  ctx.beginPath(); ctx.arc(CX, CY, sR + 1, 0, Math.PI * 2); ctx.strokeStyle = cg; ctx.lineWidth = 3; ctx.stroke()

  // Segments
  SEGS.forEach((seg, i) => {
    const s = i * ARC + angle + 0.025, e = s + ARC - 0.05, mid = (s + e) / 2
    const mx = CX + Math.cos(mid) * sR * 0.52, my = CY + Math.sin(mid) * sR * 0.52
    const sg = ctx.createRadialGradient(mx, my, 0, CX, CY, sR)
    sg.addColorStop(0, seg.color + 'FF'); sg.addColorStop(0.6, seg.color + 'CC'); sg.addColorStop(1, DARK[i % DARK.length] + '99')
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, sR, s, e); ctx.closePath(); ctx.fillStyle = sg; ctx.fill()
    // Bevel
    ctx.save()
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, sR, s, e); ctx.closePath(); ctx.clip()
    const bv = ctx.createLinearGradient(CX + Math.cos(mid) * 8, CY + Math.sin(mid) * 8, CX + Math.cos(mid) * sR, CY + Math.sin(mid) * sR)
    bv.addColorStop(0, 'rgba(255,255,255,.3)'); bv.addColorStop(0.4, 'rgba(255,255,255,.07)'); bv.addColorStop(1, 'rgba(0,0,0,.2)')
    ctx.fillStyle = bv; ctx.fillRect(CX - sR, CY - sR, sR * 2, sR * 2); ctx.restore()
    // Divider
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + Math.cos(s) * sR, CY + Math.sin(s) * sR)
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5; ctx.stroke()
    // Label
    ctx.save(); ctx.translate(CX, CY); ctx.rotate(mid); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
    ctx.font = 'bold 13px Inter,system-ui,sans-serif'
    const lbl = seg.label.length > 13 ? seg.label.slice(0, 12) + '…' : seg.label
    ctx.strokeStyle = 'rgba(0,0,0,.95)'; ctx.lineWidth = 4.5; ctx.strokeText(lbl, sR - 9, 0)
    ctx.fillStyle = '#fff'; ctx.fillText(lbl, sR - 9, 0)
    ctx.restore()
  })
  ctx.beginPath(); ctx.arc(CX, CY, sR, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.5; ctx.stroke()

  // Hub chrome + bille verte
  for (let r = hR + 12; r > hR + 1; r -= 0.7) {
    const t = (r - hR - 1) / 11, v = ~~(138 + Math.sin(t * Math.PI) * 105)
    ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgb(${v},${v + 8},${v + 18})`; ctx.lineWidth = 0.8; ctx.stroke()
  }
  ctx.beginPath(); ctx.arc(CX, CY, hR + 12, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(80,100,140,.7)'; ctx.lineWidth = 2; ctx.stroke()
  const hg = ctx.createRadialGradient(CX - hR * 0.3, CY - hR * 0.32, 2, CX, CY, hR)
  hg.addColorStop(0, '#88DD44'); hg.addColorStop(0.4, '#44AA22'); hg.addColorStop(1, '#114408')
  ctx.beginPath(); ctx.arc(CX, CY, hR, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill()
  ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, hR, 0, Math.PI * 2); ctx.clip()
  const hs = ctx.createRadialGradient(CX - hR * 0.3, CY - hR * 0.34, 0, CX, CY, hR)
  hs.addColorStop(0, 'rgba(200,255,140,.45)'); hs.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = hs; ctx.fillRect(CX - hR, CY - hR, hR * 2, hR * 2); ctx.restore()
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter,system-ui,sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SPIN', CX, CY)

  // Pointer bleu angulaire
  const py = CY - sR - RIM * 0.5
  ctx.save(); ctx.translate(2, 4)
  ctx.beginPath(); ctx.moveTo(CX - 12, py - 13); ctx.lineTo(CX + 12, py - 13); ctx.lineTo(CX + 7, py + 1); ctx.lineTo(CX, py + 13); ctx.lineTo(CX - 7, py + 1); ctx.closePath()
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill(); ctx.restore()
  const ptg = ctx.createLinearGradient(CX - 12, 0, CX + 12, 0)
  ptg.addColorStop(0, '#6AABEE'); ptg.addColorStop(0.5, '#AACCF0'); ptg.addColorStop(1, '#6AABEE')
  ctx.beginPath(); ctx.moveTo(CX - 12, py - 13); ctx.lineTo(CX + 12, py - 13); ctx.lineTo(CX + 7, py + 1); ctx.lineTo(CX, py + 13); ctx.lineTo(CX - 7, py + 1); ctx.closePath()
  ctx.fillStyle = ptg; ctx.fill(); ctx.strokeStyle = 'rgba(80,140,210,.5)'; ctx.lineWidth = 1; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(CX, py - 11); ctx.lineTo(CX, py + 9); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.stroke()
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function DemoClient() {
  const [screen, setScreen] = useState<Screen>('form')
  const [form, setForm] = useState<FormData>({ secteur: '', prenom: '', nom: '', email: '', cp: '', tel: '' })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [spinning, setSpinning] = useState(false)
  const [angle, setAngle] = useState(0)
  const [wonSeg, setWonSeg] = useState<Seg | null>(null)
  const [ticket, setTicket] = useState('')
  const [hint, setHint] = useState('Touchez la roue')
  const [confetti, setConfetti] = useState<{ x:number;y:number;vx:number;vy:number;w:number;h:number;color:string;rot:number;vr:number;life:number;sq:boolean }[]>([])

  const wheelRef = useRef<HTMLCanvasElement>(null)
  const confRef  = useRef<HTMLCanvasElement>(null)
  const angleRef = useRef(0)
  const confRef2 = useRef<typeof confetti>([])
  const rafRef   = useRef<number>(0)
  const rayAngle = useRef(0)

  // Draw wheel on angle change
  useEffect(() => {
    if (wheelRef.current) drawCanovaWheel(wheelRef.current, angle)
  }, [angle, screen])

  // Initial draw on spin screen mount
  useEffect(() => {
    if (screen === 'spin' && wheelRef.current) {
      drawCanovaWheel(wheelRef.current, angleRef.current)
    }
  }, [screen])

  // ── FORM SUBMIT ─────────────────────────────────────────────────────────────
  function submitForm() {
    const errs: Partial<FormData> = {}
    if (!form.secteur) errs.secteur = 'Obligatoire'
    if (!form.prenom.trim()) errs.prenom = 'Obligatoire'
    if (!form.nom.trim()) errs.nom = 'Obligatoire'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    if (form.cp.length < 4) errs.cp = 'Obligatoire'
    if (form.tel.replace(/\s/g, '').length < 8) errs.tel = 'Invalide'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setScreen('spin')
  }

  // ── SPIN ────────────────────────────────────────────────────────────────────
  const doSpin = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    setHint('En cours…')
    const winners = SEGS.filter(s => !s.perdant)
    const target  = winners[Math.floor(Math.random() * winners.length)]
    const winIdx  = SEGS.indexOf(target)
    const ARC     = (2 * Math.PI) / SEGS.length
    const start   = angleRef.current
    const targetA = start + Math.PI * 2 * (12 + Math.floor(Math.random() * 4)) + (Math.PI * 2 - (winIdx * ARC + ARC / 2) + Math.PI * 1.5) % (Math.PI * 2)
    const dur = 4400
    let t0 = 0

    function anim(ts: number) {
      if (!t0) t0 = ts
      const p    = Math.min((ts - t0) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 5)
      const cur  = start + (targetA - start) * ease
      angleRef.current = cur
      if (wheelRef.current) drawCanovaWheel(wheelRef.current, cur)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(anim)
      } else {
        setSpinning(false)
        setWonSeg(target)
        const tc = genTicket()
        setTicket(tc)
        // Write to Supabase
        supabase.from('leads_landing').insert({
          secteur: form.secteur, prenom: form.prenom, nom: form.nom,
          email: form.email, code_postal: form.cp, telephone: form.tel,
          lot_gagne: target.label, ticket_code: tc, perdant: target.perdant ?? false
        }).then()
        setScreen('win')
        startConfettiLoop()
      }
    }
    rafRef.current = requestAnimationFrame(anim)
  }, [spinning, form])

  // ── CONFETTI LOOP ────────────────────────────────────────────────────────────
  const CONF_COLORS = ['#00B4A0','#3B5CC4','#8E24AA','#F97316','#FFD700','#00BCD4','#EC4899','#ffffff']

  function spawnBurst() {
    const parts = []
    for (let i = 0; i < 200; i++) {
      parts.push({
        x: Math.random() * 430, y: Math.random() * 300 - 50,
        vx: (Math.random() - 0.5) * 22, vy: (Math.random() - 0.5) * 22 - 8,
        w: Math.random() * 13 + 3, h: Math.random() * 5 + 2,
        color: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)],
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.35,
        life: 1, sq: Math.random() > 0.4
      })
    }
    confRef2.current = parts
  }

  function startConfettiLoop() {
    spawnBurst()
    rayAngle.current = 0
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    function loop() {
      const cv = confRef.current
      if (!cv) return
      const ctx = cv.getContext('2d')!
      const W = cv.width, H = cv.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(3,8,24,.92)'; ctx.fillRect(0, 0, W, H)

      // Rayons
      rayAngle.current += 0.003
      const CX = W / 2, CY = H / 2
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * Math.PI * 2 + rayAngle.current
        const c = ['rgba(0,180,160,.08)','rgba(59,92,196,.06)','rgba(142,36,170,.05)'][i % 3]
        ctx.save(); ctx.translate(CX, CY); ctx.rotate(a)
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-70, -700); ctx.lineTo(70, -700); ctx.lineTo(5, 0); ctx.closePath()
        ctx.fillStyle = c; ctx.fill(); ctx.restore()
      }

      // Confetti update + draw
      confRef2.current = confRef2.current.filter(p => p.life > 0)
      confRef2.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.vx *= 0.98; p.rot += p.vr; p.life -= 0.012
        ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.sq) ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        else { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
      })
      // Pluie continue
      if (Math.random() > 0.6) confRef2.current.push({
        x: Math.random() * W, y: -8, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 4 + 2,
        w: 9, h: 4, color: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)],
        rot: 0, vr: 0.25, life: 1, sq: true
      })

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  // Size confetti canvas
  useEffect(() => {
    if (screen === 'win' && confRef.current) {
      confRef.current.width  = 430
      confRef.current.height = window.innerHeight
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [screen])

  function reset() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    confRef2.current = []
    setWonSeg(null); setTicket('')
    setHint('Touchez la roue')
    setScreen('spin')
  }

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const S: Record<string, React.CSSProperties> = {
    app:      { background:'#030818', color:'#fff', fontFamily:'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', maxWidth:430, margin:'0 auto', minHeight:'100dvh' },
    screen:   { display:'flex', flexDirection:'column', minHeight:'100dvh', padding:'24px 20px 32px' },
    label:    { display:'block', fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:5 },
    input:    { width:'100%', padding:'12px 14px', background:'rgba(255,255,255,.06)', border:'1.5px solid rgba(255,255,255,.12)', borderRadius:10, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none' },
    inputErr: { width:'100%', padding:'12px 14px', background:'rgba(255,255,255,.06)', border:'1.5px solid #EF4444', borderRadius:10, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none' },
    errMsg:   { fontSize:11, color:'#EF4444', marginTop:4 },
    btn:      { width:'100%', padding:15, background:'#00B4A0', color:'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:800, cursor:'pointer', letterSpacing:'.3px' },
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>

      {/* ══ SCREEN FORM ════════════════════════════════════════════════════════ */}
      {screen === 'form' && (
        <div style={S.screen}>
          <div style={{ fontSize:22, fontWeight:900, marginBottom:28 }}>
            Flow<span style={{ color:'#00B4A0' }}>in</span>
          </div>
          <div style={{ fontSize:20, fontWeight:800, marginBottom:6, lineHeight:1.3 }}>
            Découvrez comment Flowin transforme vos passages en contacts
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:24 }}>
            Remplissez le formulaire · Faites tourner la roue · Récupérez votre lot
          </div>

          {/* Secteur */}
          <div style={{ marginBottom:14 }}>
            <label style={S.label}>Votre secteur *</label>
            <select style={errors.secteur ? S.inputErr : S.input} value={form.secteur}
              onChange={e => setForm(f => ({ ...f, secteur: e.target.value }))}>
              <option value="">-- Sélectionnez --</option>
              {['Commerce & Négoce','Point de vente indépendant','Restaurateur','Association / Événementiel',
                'Municipalité / Office de tourisme','Centre commercial','Entreprise / RH','Organisateur de salon'
              ].map(o => <option key={o}>{o}</option>)}
            </select>
            {errors.secteur && <div style={S.errMsg}>{errors.secteur}</div>}
          </div>

          {/* Prénom + Nom */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            {([['prenom','Prénom','Camille'],['nom','Nom','Dupont']] as const).map(([k,l,p]) => (
              <div key={k}>
                <label style={S.label}>{l} *</label>
                <input style={errors[k] ? S.inputErr : S.input} placeholder={p}
                  value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                {errors[k] && <div style={S.errMsg}>{errors[k]}</div>}
              </div>
            ))}
          </div>

          {/* Email */}
          <div style={{ marginBottom:14 }}>
            <label style={S.label}>Email *</label>
            <input style={errors.email ? S.inputErr : S.input} type="email"
              placeholder="contact@structure.fr" autoCapitalize="none"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            {errors.email && <div style={S.errMsg}>{errors.email}</div>}
          </div>

          {/* CP + Tel */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            {([['cp','Code postal','06140'],['tel','Téléphone','06 XX XX']] as const).map(([k,l,p]) => (
              <div key={k}>
                <label style={S.label}>{l} *</label>
                <input style={errors[k] ? S.inputErr : S.input} placeholder={p}
                  value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                {errors[k] && <div style={S.errMsg}>{errors[k]}</div>}
              </div>
            ))}
          </div>

          <button style={S.btn} onClick={submitForm}>Accéder à ma démo →</button>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.25)', textAlign:'center', marginTop:10, lineHeight:1.5 }}>
            Données confidentielles · Jamais revendues · RGPD
          </div>
        </div>
      )}

      {/* ══ SCREEN SPIN ════════════════════════════════════════════════════════ */}
      {screen === 'spin' && (
        <div style={{ ...S.screen, alignItems:'center', paddingTop:20 }}>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'rgba(255,255,255,.85)' }}>
              Bienvenue {form.prenom} !
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:4 }}>
              Cliquez sur la roue pour tenter votre chance
            </div>
          </div>

          {/* Roue */}
          <canvas ref={wheelRef} width={340} height={340}
            onClick={doSpin}
            style={{ display:'block', cursor: spinning ? 'default' : 'pointer', borderRadius:10, touchAction:'manipulation' }} />

          {/* Badge GAME TIME */}
          <div style={{ position:'relative', width:200, height:66, margin:'8px auto 0' }}>
            <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:168, height:36, background:'linear-gradient(180deg,#9A28CC,#7818A8 45%,#520C80)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(180,80,255,.4)' }}>
              <span style={{ fontSize:18, fontWeight:900, color:'rgba(235,210,255,.95)', letterSpacing:4 }}>TIME</span>
            </div>
            <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:152, height:42, background:'linear-gradient(180deg,#5A88EE,#3868D0 40%,#1A44A8)', borderRadius:21, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(140,180,255,.5)', zIndex:1, overflow:'hidden' }}>
              <div style={{ position:'absolute', top:3, left:6, right:6, height:'42%', background:'rgba(255,255,255,.22)', borderRadius:14 }} />
              <span style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:3, position:'relative', zIndex:1, textShadow:'0 1px 4px rgba(0,0,100,.4)' }}>GAME</span>
            </div>
          </div>

          <div style={{ fontSize:12, color:'rgba(100,140,200,.6)', marginTop:12, textAlign:'center' }}>{hint}</div>
        </div>
      )}

      {/* ══ SCREEN WIN ═════════════════════════════════════════════════════════ */}
      {screen === 'win' && (
        <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', overflow:'hidden' }}>
          {/* Canvas confetti + rayons */}
          <canvas ref={confRef} style={{ position:'absolute', inset:0, pointerEvents:'none' }} />

          {/* Win card */}
          <div style={{ position:'relative', zIndex:10, background:'#060E1E', border:'2.5px solid #00B4A0', borderRadius:18, width:'88%', maxWidth:340, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.6)' }}>
            {/* Header teal */}
            <div style={{ background:'#00B4A0', padding:'14px', textAlign:'center', fontSize:14, fontWeight:800, letterSpacing:2 }}>
              ✦&nbsp;&nbsp;FÉLICITATIONS&nbsp;&nbsp;✦
            </div>

            <div style={{ padding:'24px 20px 20px', textAlign:'center' }}>
              <div style={{ fontSize:56, marginBottom:12 }}>🥳</div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(0,200,180,.8)', textTransform:'uppercase', letterSpacing:2, marginBottom:6 }}>
                Vous avez gagné
              </div>
              <div style={{ fontSize:26, fontWeight:900, marginBottom:18 }}>{form.prenom}</div>

              {/* Lot */}
              <div style={{ background:'rgba(0,180,160,.1)', border:'1px solid rgba(0,180,160,.25)', borderRadius:10, padding:'14px', marginBottom:16 }}>
                <div style={{ fontSize:10, color:'rgba(0,200,175,.7)', marginBottom:4 }}>Votre lot</div>
                <div style={{ fontSize:16, fontWeight:800 }}>{wonSeg?.label}</div>
              </div>

              {/* Ticket */}
              <div style={{ fontSize:11, color:'rgba(0,200,175,.5)', marginBottom:20 }}>
                Ticket de participation
                <div style={{ fontSize:15, fontFamily:'monospace', color:'rgba(0,220,190,.9)', marginTop:3, fontWeight:700 }}>{ticket}</div>
              </div>

              <button onClick={reset}
                style={{ width:'100%', padding:14, background:'#00B4A0', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer' }}>
                ▶&nbsp;&nbsp;PLAY AGAIN
              </button>
            </div>
            <div style={{ fontSize:10, color:'rgba(0,180,160,.2)', textAlign:'center', paddingBottom:12 }}>
              Powered by Flowin
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
