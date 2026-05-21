'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Metric { val: string; lbl: string; c: string }
interface Profil {
  id: string; ico: string; lbl: string; couleur: string
  before: string; how: string; after: string; metrics: Metric[]
}
interface LandingCfg {
  id: string; nom: string; accent_color: string
  hero: { questions: string[]; answer: string; cta: string }
  proof: { stat1: string; stat1Lbl: string; stat2: string; stat2Lbl: string; stat3: string; stat3Lbl: string; quote: string; quoteAuthor: string }
  profils: Profil[]
  cta_section: { title: string; subtitle: string; formPlaceholderNom: string; formPlaceholderEmail: string; formPlaceholderTel: string; ctaSubmit: string; successTitle: string; successText: string }
}

const COLORS: Record<string, string> = { teal:'#00B4A0', orange:'#F97316', navy:'#1B3A5C', purple:'#A855F7', yellow:'#F59E0B' }

export default function LandingClient({ cfg: cfgProp, source }: { cfg: LandingCfg | null; source: string }) {
  const cfg = cfgProp!
  const hero    = cfg?.hero
  const proof   = cfg?.proof
  const profils = cfg?.profils ?? []
  const cta     = cfg?.cta_section
  const teal = '#00B4A0'; const purple = '#A855F7'; const navy = '#1B3A5C'

  const [qIdx, setQIdx]         = useState(0)
  const [qVisible, setQVisible] = useState(true)
  const [selProf, setSelProf]   = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'before'|'how'|'after'>('before')
  const [form, setForm]         = useState({ nom:'', email:'', tel:'' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [counters, setCounters] = useState({ c1:0, c2:0, c3:0 })
  const [counted, setCounted]   = useState(false)

  useEffect(() => {
    if (!hero?.questions?.length) return
    const iv = setInterval(() => {
      setQVisible(false)
      setTimeout(() => { setQIdx(i => (i+1) % hero.questions.length); setQVisible(true) }, 400)
    }, 3200)
    return () => clearInterval(iv)
  }, [hero?.questions?.length])

  useEffect(() => {
    if (counted) return
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return
      setCounted(true)
      const t1 = parseInt(proof?.stat1 ?? '186'), t3 = parseInt(proof?.stat3 ?? '94')
      let n = 0
      const iv = setInterval(() => {
        n += 4
        setCounters({ c1: Math.min(n*Math.round(t1/40), t1), c2: 3, c3: Math.min(Math.round(n*t3/40), t3) })
        if (n >= 40) clearInterval(iv)
      }, 30)
      observer.disconnect()
    }, { threshold: 0.3 })
    const el = document.getElementById('s-proof')
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [counted, proof?.stat1, proof?.stat3])

  useEffect(() => {
    const SECS = ['s-hero','s-profils','s-proof','s-cta']
    let idx = 0
    function onMsg(e: MessageEvent) {
      if (!e.data?.flowinNav) return
      if (e.data.flowinNav === 'next') idx = Math.min(idx+1, SECS.length-1)
      if (e.data.flowinNav === 'prev') idx = Math.max(idx-1, 0)
      document.getElementById(SECS[idx])?.scrollIntoView({ behavior: 'smooth' })
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  async function handleSubmit() {
    if (!form.nom.trim() || !form.email.includes('@')) return
    setSubmitting(true)
    const today = new Date().toISOString().slice(0,10)
    const emailLower = form.email.toLowerCase().trim()
    const profil = profils.find(p => p.id === selProf)
    await supabase.from('joueurs').upsert({
      external_id: `j-cta-${emailLower.replace(/[^a-z0-9]/g,'-').substring(0,36)}`,
      email: emailLower, prenom: form.nom.trim(), tel: form.tel.trim()||null,
      tags: ['btob','cta', profil?.lbl ?? ''].filter(Boolean),
      optin:true, optin_date:today, first_seen:today, last_seen:today,
      source: source==='qr' ? 'landing_qr' : 'landing_cta',
      client_type:'btob', enseigne: profil?.lbl ?? null,
    }, { onConflict:'external_id' })
    setSubmitting(false); setSubmitted(true)
  }

  const sp = profils.find(p => p.id === selProf)
  const TAB_LABELS = [
    { id:'before' as const, ico:'😔', lbl:'Avant' },
    { id:'how'    as const, ico:'⚡', lbl:'Avec Flowin' },
    { id:'after'  as const, ico:'✅', lbl:'Résultat' },
  ]

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background:'#F4F6F9', color:navy, minHeight:'100dvh', overflowX:'hidden' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:rgba(244,246,249,.95);backdrop-filter:blur(12px);position:sticky;top:0;z-index:10;border-bottom:1px solid rgba(27,58,92,.1)}
        .logo{font-size:20px;font-weight:900;color:${navy}}.logo em{font-style:normal;color:${purple}}
        .btn-demo{background:${teal};color:#fff;border:none;border-radius:50px;padding:10px 22px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit}
        .hero{position:relative;overflow:hidden;padding:80px 24px 60px;text-align:center;background:#fff}
        .hero::before{content:'';position:absolute;width:500px;height:500px;background:${teal};opacity:.07;border-radius:50%;top:-200px;right:-150px;pointer-events:none}
        .hero::after{content:'';position:absolute;width:400px;height:400px;background:${purple};opacity:.07;border-radius:50%;bottom:-100px;left:-100px;pointer-events:none}
        .hq-num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${teal};color:#fff;font-size:12px;font-weight:800;margin-right:10px;flex-shrink:0;vertical-align:middle}
        .profils-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
        .prof{background:#fff;border:2px solid rgba(27,58,92,.1);border-radius:14px;padding:18px 12px;text-align:center;cursor:pointer;transition:all .2s}
        .prof.sel{border-color:${teal};box-shadow:0 8px 32px rgba(0,180,160,.18)}
        .prof:hover{box-shadow:0 4px 16px rgba(0,0,0,.08)}
        .result-card{background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.08);padding:24px;margin-top:24px}
        .tab-row{display:flex;gap:8px;margin-bottom:16px}
        .tab-btn{padding:7px 14px;border-radius:20px;border:1.5px solid rgba(27,58,92,.15);background:#fff;font-size:12px;font-weight:700;cursor:pointer;color:${navy};font-family:inherit}
        .tab-btn.on{background:${teal};border-color:${teal};color:#fff}
        .tab-content{font-size:15px;color:rgba(27,58,92,.75);line-height:1.7;font-style:italic}
        .metrics-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:16px}
        @media(min-width:500px){.metrics-grid{grid-template-columns:repeat(4,1fr)}}
        .metric{background:#F4F6F9;border-radius:10px;padding:10px;text-align:center}
        .metric-val{font-size:18px;font-weight:900}
        .metric-lbl{font-size:10px;color:rgba(27,58,92,.5);margin-top:2px;font-weight:700}
        .proof{background:${navy};padding:60px 24px;color:#fff}
        .proof-inner{max-width:700px;margin:0 auto;text-align:center}
        .proof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px}
        .pn-val{font-size:52px;font-weight:900;line-height:1}
        .pn-lbl{font-size:12px;color:rgba(255,255,255,.5);margin-top:4px;font-weight:700}
        .cta-section{background:#fff;padding:60px 24px;border-top:1px solid rgba(27,58,92,.08)}
        .cta-inner{max-width:460px;margin:0 auto;text-align:center}
        .inp{width:100%;padding:14px 16px;background:#F4F6F9;border:1.5px solid rgba(27,58,92,.15);border-radius:12px;color:${navy};font-size:15px;font-family:inherit;outline:none;margin-bottom:10px}
        .inp:focus{border-color:${teal}}
        .btn-submit{width:100%;padding:16px;background:${teal};color:#fff;border:none;border-radius:50px;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit}
        .qr-box{display:flex;align-items:center;gap:12px;background:#F4F6F9;border:1px solid rgba(27,58,92,.1);border-radius:12px;padding:14px;margin-top:20px;text-align:left}
        .success-box{background:rgba(0,180,160,.08);border:1.5px solid rgba(0,180,160,.3);border-radius:14px;padding:28px}
        .footer{text-align:center;padding:24px;font-size:11px;color:rgba(27,58,92,.35);background:#F4F6F9}
      `}</style>

      <nav className="topbar">
        <div className="logo">Flow<em>in</em></div>
        <button className="btn-demo" onClick={() => document.getElementById('s-cta')?.scrollIntoView({ behavior:'smooth' })}>
          Demander une démo
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="s-hero">
        <div style={{ position:'relative', zIndex:1, maxWidth:700, margin:'0 auto' }}>
          <div style={{ minHeight:80, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
            <div style={{ fontSize:'clamp(20px,4vw,32px)', fontWeight:900, color:navy, lineHeight:1.25, transition:'opacity .4s,transform .4s', opacity:qVisible?1:0, transform:qVisible?'translateY(0)':'translateY(8px)', textAlign:'center' }}>
              <span className="hq-num">{qIdx+1}</span>
              {hero?.questions?.[qIdx] ?? ''}
            </div>
          </div>
          <div style={{ fontSize:'clamp(14px,2.5vw,18px)', color:'rgba(27,58,92,.6)', margin:'16px 0 28px' }}>{hero?.answer}</div>
          <button className="btn-demo" style={{ fontSize:16, padding:'16px 36px' }}
            onClick={() => document.getElementById('s-profils')?.scrollIntoView({ behavior:'smooth' })}>
            {hero?.cta}
          </button>
        </div>
      </section>

      {/* PROFILS */}
      <section id="s-profils" style={{ padding:'60px 24px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ fontSize:26, fontWeight:900, textAlign:'center', color:navy, marginBottom:8 }}>Qui êtes-vous ?</div>
          <div style={{ color:'rgba(27,58,92,.5)', textAlign:'center', marginBottom:32, fontSize:15 }}>
            Choisissez votre profil pour voir ce que Flowin peut faire pour vous.
          </div>
          <div className="profils-grid">
            {profils.map(p => (
              <div key={p.id} className={`prof${selProf===p.id?' sel':''}`}
                onClick={() => { setSelProf(p.id===selProf?null:p.id); setActiveTab('before') }}>
                <div style={{ fontSize:30, marginBottom:8 }}>{p.ico}</div>
                <div style={{ fontSize:11, fontWeight:800, color:navy, lineHeight:1.3 }}>{p.lbl}</div>
              </div>
            ))}
          </div>

          {sp && (
            <div className="result-card">
              <div style={{ fontWeight:900, fontSize:18, color:navy, marginBottom:16 }}>
                {sp.ico} {sp.lbl}
              </div>
              <div className="tab-row">
                {TAB_LABELS.map(t => (
                  <button key={t.id} className={`tab-btn${activeTab===t.id?' on':''}`}
                    onClick={() => setActiveTab(t.id)}>
                    {t.ico} {t.lbl}
                  </button>
                ))}
              </div>
              <div className="tab-content">
                {activeTab==='before' && sp.before}
                {activeTab==='how'    && sp.how}
                {activeTab==='after'  && sp.after}
              </div>
              {sp.metrics?.length > 0 && (
                <div className="metrics-grid">
                  {sp.metrics.map((m, i) => (
                    <div key={i} className="metric">
                      <div className="metric-val" style={{ color: COLORS[m.c] ?? navy }}>{m.val}</div>
                      <div className="metric-lbl">{m.lbl}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* PROOF */}
      <section className="proof" id="s-proof">
        <div className="proof-inner">
          <div style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.12em', color:teal, marginBottom:12 }}>
            ILS L&apos;ONT FAIT. VRAIMENT.
          </div>
          <div className="proof-grid">
            <div>
              <div className="pn-val" style={{ color:teal }}>{counters.c1}</div>
              <div className="pn-lbl">{proof?.stat1Lbl}</div>
            </div>
            <div>
              <div className="pn-val" style={{ color:'#F59E0B' }}>{counters.c2}</div>
              <div className="pn-lbl">{proof?.stat2Lbl}</div>
            </div>
            <div>
              <div className="pn-val" style={{ color:purple }}>{counters.c3}%</div>
              <div className="pn-lbl">{proof?.stat3Lbl}</div>
            </div>
          </div>
          {proof?.quote && (
            <>
              <div style={{ fontSize:17, fontStyle:'italic', color:'rgba(255,255,255,.85)', lineHeight:1.7, marginBottom:10 }}>
                &ldquo;{proof.quote}&rdquo;
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>— {proof.quoteAuthor}</div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="s-cta">
        <div className="cta-inner">
          {submitted ? (
            <div className="success-box">
              <div style={{ fontSize:22, fontWeight:900, color:navy, marginBottom:8 }}>{cta?.successTitle}</div>
              <div style={{ fontSize:14, color:'rgba(27,58,92,.6)', lineHeight:1.6 }}>{cta?.successText}</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:28, fontWeight:900, color:navy, marginBottom:6 }}>{cta?.title}</div>
              <div style={{ color:'rgba(27,58,92,.5)', marginBottom:28, fontSize:14 }}>{cta?.subtitle}</div>
              <input className="inp" placeholder={cta?.formPlaceholderNom} value={form.nom}
                onChange={e => setForm(f=>({...f,nom:e.target.value}))} />
              <input className="inp" type="email" placeholder={cta?.formPlaceholderEmail}
                autoCapitalize="none" value={form.email}
                onChange={e => setForm(f=>({...f,email:e.target.value}))} />
              <input className="inp" type="tel" placeholder={cta?.formPlaceholderTel} value={form.tel}
                onChange={e => setForm(f=>({...f,tel:e.target.value}))} />
              <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Envoi…' : cta?.ctaSubmit}
              </button>
              <div style={{ fontSize:11, color:'rgba(27,58,92,.35)', marginTop:8 }}>Données jamais cédées à des tiers · RGPD</div>
            </>
          )}
          <div className="qr-box">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('https://flowin-events.vercel.app/landing?source=qr')}&bgcolor=1B3A5C&color=ffffff&margin=6`} alt="QR" style={{ width:60, height:60, borderRadius:8, flexShrink:0 }} />
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:navy }}>📱 Partager la landing</div>
              <div style={{ fontSize:11, color:'rgba(27,58,92,.5)', marginTop:3 }}>Scannez pour accéder depuis votre téléphone</div>
              <div style={{ fontSize:10, fontFamily:'monospace', color:'rgba(27,58,92,.35)', marginTop:4 }}>flowin-events.vercel.app/landing</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        Flowin · OPConsult / BAITA EURL · Vence 06140 ·{' '}
        <a href="mailto:romain@opconsult.fr" style={{ color:'inherit' }}>romain@opconsult.fr</a>
      </footer>
    </div>
  )
}
