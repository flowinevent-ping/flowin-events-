'use client'
import { useState, useRef, useEffect } from 'react'
import { SUPA_URL, SUPA_ANON } from '@/lib/supabase'

interface Segment { label: string; emoji: string; couleur: string; prob?: number }
interface SpinEvent { id: string; nom: string; lieu: string; couleur: string; cfg: any; lots: any[] }
interface FormData { prenom: string; nom: string; email: string; tel: string; optin: boolean }

function extId(e: string) { return 'j-' + e.toLowerCase().trim().replace(/[^a-z0-9]/g,'-').substring(0,40) }
function checkPlayed(evId: string) { try { return !!localStorage.getItem('flowin_played_'+evId) } catch { return false } }
function markPlayed(evId: string, email: string, ticket: string) { try { localStorage.setItem('flowin_played_'+evId, JSON.stringify({email,ticket,ts:Date.now()})) } catch {} }
function genTicket() { return 'SP-' + new Date().getFullYear() + '-' + Math.floor(1000+Math.random()*8999) }

async function write(ev: SpinEvent, form: FormData, ticket: string) {
  const date = new Date().toISOString().slice(0,10)
  try {
    await fetch(`${SUPA_URL}/rest/v1/joueurs?on_conflict=external_id`, {
      method:'POST',
      headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
      body: JSON.stringify({ external_id:extId(form.email), email:form.email.toLowerCase().trim(), prenom:form.prenom, nom:form.nom, tel:form.tel, optin:form.optin, optin_date:form.optin?date:null, events:[ev.id], client_type:'btoc', first_seen:date, last_seen:date, source:'parcours-spin' })
    })
    await fetch(`${SUPA_URL}/rest/v1/participations`, {
      method:'POST',
      headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'return=minimal'},
      body: JSON.stringify({ event_id:ev.id, ticket_code:ticket, completed:true })
    })
    markPlayed(ev.id, form.email, ticket)
  } catch(e) { console.warn('[spin]', e) }
}

export default function SpinFlow({ ev }: { ev: SpinEvent }) {
  const [screen, setScreen] = useState<'landing'|'form'|'spin'|'result'>('landing')
  const [form, setForm] = useState<FormData>({prenom:'',nom:'',email:'',tel:'',optin:false})
  const [spinning, setSpinning] = useState(false)
  const [angle, setAngle] = useState(0)
  const [result, setResult] = useState<Segment|null>(null)
  const [ticket] = useState(genTicket())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const c = ev.couleur || '#3B5CC4'

  const segs: Segment[] = ev.cfg?.spinSegments || [
    {label:'Bravo !',emoji:'🎉',couleur:'#D4537E'},{label:'Retente',emoji:'🔄',couleur:'#3B5CC4'},
    {label:'Lot !',emoji:'🎁',couleur:'#1D9E75'},{label:'Promo',emoji:'💥',couleur:'#EF9F27'}
  ]

  useEffect(() => { drawWheel(angle, -1) }, [angle, segs])

  function drawWheel(rot: number, hi: number) {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d')!
    const cx=150,cy=150,r=138,ri=28,n=segs.length,sl=2*Math.PI/n
    ctx.clearRect(0,0,300,300)
    segs.forEach((seg,i) => {
      const s=rot+i*sl,e=s+sl
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,s,e); ctx.closePath()
      ctx.fillStyle = hi===i ? seg.couleur+'cc' : seg.couleur; ctx.fill()
      ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.stroke()
      const mid=s+sl/2,tr=r*.66,tx=cx+tr*Math.cos(mid),ty=cy+tr*Math.sin(mid)
      ctx.save(); ctx.translate(tx,ty)
      const deg=((mid*180/Math.PI)%360+360)%360
      ctx.rotate(deg>90&&deg<270?mid+Math.PI:mid)
      ctx.font='bold 12px sans-serif'; ctx.fillStyle='#fff'; ctx.textAlign='center'
      ctx.fillText(seg.emoji+' '+seg.label.substring(0,8),0,0)
      ctx.restore()
    })
    // Centre
    ctx.beginPath(); ctx.arc(cx,cy,ri,0,2*Math.PI)
    ctx.fillStyle='#fff'; ctx.fill(); ctx.strokeStyle='#e5e7eb'; ctx.lineWidth=2; ctx.stroke()
    ctx.fillStyle='#1a1a2e'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.fillText('FLOWIN',cx,cy)
  }

  function spin() {
    if (spinning) return
    setSpinning(true)
    const extra = 5 + Math.floor(Math.random()*5)
    const target = angle + extra*2*Math.PI + Math.random()*2*Math.PI
    const duration = 4000
    const start = Date.now()
    const startAngle = angle
    function frame() {
      const elapsed = Date.now()-start
      const t = Math.min(1, elapsed/duration)
      const ease = 1-Math.pow(1-t,4)
      const cur = startAngle + (target-startAngle)*ease
      setAngle(cur)
      drawWheel(cur,-1)
      if (t<1) requestAnimationFrame(frame)
      else {
        const sl=2*Math.PI/segs.length
        const norm=((cur%(2*Math.PI))+2*Math.PI)%(2*Math.PI)
        const idx=Math.floor(((2*Math.PI-norm)%(2*Math.PI))/sl)%segs.length
        setResult(segs[idx]||segs[0])
        setSpinning(false)
        setScreen('result')
      }
    }
    requestAnimationFrame(frame)
  }

  async function submitForm() {
    if (!form.prenom||!form.email) return
    await write(ev, form, ticket)
    setScreen('spin')
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:430,margin:'0 auto',minHeight:'100vh',background:`linear-gradient(160deg,${c}22,#fff)`}}>
        {screen==='landing' && (
          <div style={{padding:24,textAlign:'center'}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:42,color:c,marginBottom:8}}>{ev.nom}</div>
            <div style={{fontSize:14,color:'#666',marginBottom:24}}>{ev.lieu}</div>
            <button onClick={()=>setScreen('form')} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},${c}99)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:18,border:'none',borderRadius:16,cursor:'pointer'}}>
              🎰 Tenter ma chance !
            </button>
          </div>
        )}
        {screen==='form' && (
          <div style={{padding:24}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:24,color:c,marginBottom:16}}>Tes infos</div>
            {(['prenom','nom','email','tel'] as const).map(f=>(
              <input key={f} placeholder={f.charAt(0).toUpperCase()+f.slice(1)+(f==='prenom'||f==='email'?' *':'')}
                value={form[f] as string} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))}
                type={f==='email'?'email':'text'}
                style={{width:'100%',padding:'13px 14px',borderRadius:12,border:'1.5px solid #e5e7eb',fontSize:14,marginBottom:10,boxSizing:'border-box' as any}}/>
            ))}
            <label style={{display:'flex',gap:8,alignItems:'center',marginBottom:16,fontSize:12,color:'#666'}}>
              <input type="checkbox" checked={form.optin} onChange={e=>setForm(f=>({...f,optin:e.target.checked}))}/> Opt-in newsletter
            </label>
            <button onClick={submitForm} style={{width:'100%',padding:16,background:`linear-gradient(135deg,${c},#EF9F27)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:16,border:'none',borderRadius:14,cursor:'pointer'}}>
              Faire tourner la roue →
            </button>
          </div>
        )}
        {screen==='spin' && (
          <div style={{padding:24,textAlign:'center'}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:c,marginBottom:20}}>Lance la roue !</div>
            <div style={{position:'relative',display:'inline-block'}}>
              <div style={{position:'absolute',top:-16,left:'50%',transform:'translateX(-50%)',fontSize:32,zIndex:10}}>▼</div>
              <canvas ref={canvasRef} width={300} height={300} style={{borderRadius:'50%',boxShadow:'0 8px 32px rgba(0,0,0,.15)'}}/>
            </div>
            <button onClick={spin} disabled={spinning} style={{display:'block',margin:'24px auto 0',padding:'16px 40px',background:`linear-gradient(135deg,${c},#EF9F27)`,color:'#fff',fontFamily:"'Fredoka One',cursive",fontSize:18,border:'none',borderRadius:16,cursor:spinning?'not-allowed':'pointer',opacity:spinning?.6:1}}>
              {spinning?'⏳ En cours...':'🎰 Tourner !'}
            </button>
          </div>
        )}
        {screen==='result' && result && (
          <div style={{padding:24,textAlign:'center'}}>
            <div style={{fontSize:72,marginBottom:8}}>{result.emoji}</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:32,color:c,marginBottom:8}}>{result.label}</div>
            <div style={{background:'#fff',borderRadius:16,padding:16,border:`1.5px dashed ${c}`,margin:'16px 0'}}>
              <div style={{fontSize:10,fontWeight:900,color:c,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>🎟️ Ton code</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:26,color:'#1a1a2e'}}>{ticket}</div>
            </div>
            <div style={{fontSize:12,color:'#888'}}>✅ Participation enregistrée · Bonne chance !</div>
          </div>
        )}
      </div>
    </>
  )
}
