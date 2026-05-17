'use client'
import { useState } from 'react'
import { SUPA_URL, SUPA_ANON } from '@/lib/supabase'

function extId(email: string) {
  return 'j-btob-' + email.toLowerCase().replace(/[^a-z0-9]/g,'-').substring(0,35)
}

export default function LandingPage() {
  const [step, setStep] = useState<'hero'|'form'|'done'>('hero')
  const [form, setForm] = useState({nom:'',email:'',tel:'',secteur:''})
  const [err, setErr] = useState('')

  async function submit() {
    if (!form.nom || !form.email) { setErr('Prénom et email requis'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErr('Email invalide'); return }
    const payload = {
      external_id: extId(form.email),
      prenom: form.nom.split(' ')[0],
      nom: form.nom.split(' ').slice(1).join(' ')||'',
      email: form.email.toLowerCase().trim(),
      tel: form.tel,
      optin: true,
      optin_date: new Date().toISOString().slice(0,10),
      first_seen: new Date().toISOString().slice(0,10),
      last_seen: new Date().toISOString().slice(0,10),
      client_type: 'btob',
      source: 'landing-b2b',
    }
    try {
      await fetch(`${SUPA_URL}/rest/v1/joueurs?on_conflict=external_id`, {
        method:'POST',
        headers:{'apikey':SUPA_ANON,'Authorization':'Bearer '+SUPA_ANON,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
        body: JSON.stringify(payload)
      })
    } catch(e) { console.warn('[landing]', e) }
    setStep('done')
  }

  const inp = (f: keyof typeof form, ph: string, type='text') => (
    <input type={type} placeholder={ph} value={form[f]}
      onChange={e=>setForm(x=>({...x,[f]:e.target.value}))}
      style={{width:'100%',padding:'14px 16px',borderRadius:12,border:'1.5px solid #E5E7EB',fontFamily:'inherit',fontSize:15,color:'#1a1a2e',background:'#fff',boxSizing:'border-box',outline:'none',marginBottom:12}}
    />
  )

  const TEAL = '#00B4A0'
  const NAVY = '#0D1B2A'

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{fontFamily:"'DM Sans',sans-serif",background:NAVY,color:'#fff',minHeight:'100vh'}}>

        {/* TOPBAR */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 24px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:TEAL}}>Flowin</div>
          <button onClick={()=>setStep('form')} style={{background:TEAL,color:'#fff',border:'none',borderRadius:10,padding:'9px 18px',fontWeight:800,fontSize:13,cursor:'pointer'}}>
            Tester gratuitement →
          </button>
        </div>

        {/* HERO */}
        {step !== 'done' && (
          <div style={{padding:'48px 24px 32px',textAlign:'center',maxWidth:560,margin:'0 auto'}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:3,color:TEAL,textTransform:'uppercase',marginBottom:20}}>
              Gamification événementielle
            </div>
            <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:'clamp(32px,8vw,52px)',fontWeight:800,lineHeight:1.1,marginBottom:20,color:'#fff'}}>
              Transformez vos visiteurs<br/><span style={{color:TEAL}}>en contacts qualifiés</span>
            </h1>
            <p style={{fontSize:16,color:'rgba(255,255,255,.6)',marginBottom:32,lineHeight:1.6}}>
              Quiz, spin, vote — vos participants jouent, gagnent, et laissent leurs coordonnées. En 3 jours, Vence a capté 186 contacts avec 97% d&apos;opt-in.
            </p>
            {/* Stats */}
            <div style={{display:'flex',gap:16,justifyContent:'center',marginBottom:40,flexWrap:'wrap'}}>
              {[{n:'186',l:'contacts captés'},{n:'97%',l:'opt-in RGPD'},{n:'3j',l:'durée événement'}].map((s,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,.06)',borderRadius:14,padding:'16px 20px',minWidth:90}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:TEAL}}>{s.n}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.5)',fontWeight:700,marginTop:4}}>{s.l}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>setStep('form')} style={{background:TEAL,color:'#fff',border:'none',borderRadius:14,padding:'16px 32px',fontWeight:800,fontSize:16,cursor:'pointer',boxShadow:'0 8px 24px rgba(0,180,160,.4)'}}>
              Je veux mon premier event →
            </button>
          </div>
        )}

        {/* MODULES */}
        {step==='hero' && (
          <div style={{padding:'0 24px 48px',maxWidth:560,margin:'0 auto'}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:'rgba(255,255,255,.4)',textTransform:'uppercase',marginBottom:20,textAlign:'center'}}>
              Modules disponibles
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[{e:'🎯',n:'Quiz',d:'Questions + timer'},{e:'🎰',n:'Spin',d:'Roue de la chance'},{e:'⭐',n:'Vote',d:'Note les artistes'},{e:'🎟️',n:'Tombola',d:'Tirage au sort pur'}].map((m,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,.04)',borderRadius:14,padding:'16px',border:'1px solid rgba(255,255,255,.08)'}}>
                  <div style={{fontSize:28,marginBottom:8}}>{m.e}</div>
                  <div style={{fontWeight:800,fontSize:14}}>{m.n}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:2}}>{m.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FORM */}
        {step==='form' && (
          <div style={{padding:'32px 24px',maxWidth:460,margin:'0 auto'}}>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,marginBottom:8}}>Parlons de votre projet</h2>
            <p style={{fontSize:14,color:'rgba(255,255,255,.5)',marginBottom:24}}>Je vous rappelle dans les 24h.</p>
            <div style={{background:'rgba(255,255,255,.04)',borderRadius:16,padding:24,border:'1px solid rgba(255,255,255,.08)'}}>
              {inp('nom','Votre nom *')}
              {inp('email','Email professionnel *','email')}
              {inp('tel','Téléphone')}
              <select value={form.secteur} onChange={e=>setForm(f=>({...f,secteur:e.target.value}))}
                style={{width:'100%',padding:'14px 16px',borderRadius:12,border:'1.5px solid #E5E7EB',fontFamily:'inherit',fontSize:15,color:'#1a1a2e',background:'#fff',boxSizing:'border-box',marginBottom:12}}>
                <option value="">Secteur (optionnel)</option>
                <option>Collectivité</option><option>Association</option>
                <option>Commerce / CHR</option><option>Événementiel</option>
              </select>
              {err && <div style={{color:'#EF4444',fontSize:13,fontWeight:700,marginBottom:12}}>⚠️ {err}</div>}
              <button onClick={submit} style={{width:'100%',padding:16,background:TEAL,color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:15,cursor:'pointer',boxShadow:'0 8px 24px rgba(0,180,160,.4)'}}>
                Je veux mon premier event →
              </button>
            </div>
          </div>
        )}

        {/* DONE */}
        {step==='done' && (
          <div style={{padding:'64px 24px',textAlign:'center',maxWidth:400,margin:'0 auto'}}>
            <div style={{fontSize:64,marginBottom:16}}>✅</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,marginBottom:8,color:TEAL}}>C&apos;est noté !</div>
            <div style={{fontSize:15,color:'rgba(255,255,255,.6)',lineHeight:1.6}}>
              Je vous recontacte dans les 24h pour discuter de votre projet.
            </div>
          </div>
        )}
      </div>
    </>
  )
}
