'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Metric { val: string; lbl: string; c: string }
interface Profil {
  id: string; ico: string; lbl: string; couleur: string
  before: string; how: string; after: string; metrics: Metric[]
}
interface Module { id: string; ico: string; nom: string; tagline: string; couleur: string; features: string[] }
interface PricingTier {
  id: string; nom: string; prix: string; unite: string | null; badge: string | null
  highlight: boolean; features: string[]; cta: string
}
interface LandingCfg {
  id: string; nom: string; accent_color: string
  hero: { questions: string[]; answer: string; cta: string }
  proof: { stat1: string; stat1Lbl: string; stat2: string; stat2Lbl: string; stat3: string; stat3Lbl: string; quote: string; quoteAuthor: string }
  profils: Profil[]
  modules: Module[]
  pricing: PricingTier[]
  cta_section: { title: string; subtitle: string; formPlaceholderNom: string; formPlaceholderEmail: string; formPlaceholderTel: string; ctaSubmit: string; successTitle: string; successText: string }
}

const COLORS: Record<string, string> = { teal:'#00B4A0', orange:'#F97316', navy:'#1B3A5C', purple:'#A855F7', yellow:'#F59E0B' }
const DEMO_URL = 'https://flowin-events.vercel.app/parcours/spin?ev=ev-flowin-demo'

const BESOINS = [
  { id:'capter', verb:'Captez', icon:'ti-crosshair', couleur:'#D85A30',
    tagline:'Construisez votre base là où vous êtes',
    desc:'Avoir du trafic, c\'est bien. Transformer chaque passage en futur client — c\'est ce qui fait la différence. Flowin capte les contacts qualifiés directement sur le terrain.',
    features:['6 mécaniques d\'engagement','Formulaire CRM intégré (email, tél, âge, ville)','94% d\'opt-in moyen','Export CSV immédiat'],
    metric:'186 contacts en 3 jours · Ville de Vence' },
  { id:'convertir', verb:'Convertissez', icon:'ti-bolt', couleur:'#3B5CC4',
    tagline:'Le jeu est votre levier de conversion physique',
    desc:'La mécanique de jeu est votre outil de conversion terrain. En 30 secondes, un inconnu s\'identifie et entre dans votre base. Vous ne laissez plus repartir personne sans contact.',
    features:['Parcours joueur en 30 secondes','Anti-doublon & RGPD intégrés','Ticket de participation automatique','Dashboard temps réel'],
    metric:'Bien travailler sa base coûte 5 à 7× moins cher' },
  { id:'fideliser', verb:'Fidélisez', icon:'ti-repeat', couleur:'#1D9E75',
    tagline:'Faites revenir ceux que vous avez captés',
    desc:'La tombola récurrente, le quiz de saison, le super event annuel — Flowin crée le prétexte de revenir. Votre base capturée devient un actif durable.',
    features:['Events récurrents configurables','Super events multi-sites','Tirage au sort transparent','Analyse post-event'],
    metric:'De l\'événement ponctuel à la relation durable' },
]

export default function LandingClient({ cfg: cfgProp, source }: { cfg: LandingCfg | null; source: string }) {
  const cfg = cfgProp!
  const hero    = cfg?.hero
  const proof   = cfg?.proof
  const profils = cfg?.profils ?? []
  const modules = cfg?.modules ?? []
  const pricing = cfg?.pricing ?? []
  const cta     = cfg?.cta_section
  const teal = '#00B4A0'; const navy = '#1B3A5C'

  const [qIdx, setQIdx]           = useState(0)
  const [qVisible, setQVisible]   = useState(true)
  const [selProf, setSelProf]     = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'before'|'how'|'after'>('before')
  const [form, setForm]           = useState({ nom:'', email:'', tel:'' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [counters, setCounters]   = useState({ c1:0, c2:0, c3:0 })
  const [counted, setCounted]     = useState(false)

  useEffect(() => {
    if (!hero?.questions?.length) return
    const iv = setInterval(() => {
      setQVisible(false)
      setTimeout(() => { setQIdx(i => (i+1) % hero.questions.length); setQVisible(true) }, 400)
    }, 3400)
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
    const SECS = ['s-hero','s-besoins','s-demo','s-profils','s-proof','s-modules','s-accomp','s-pricing','s-cta']
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
    { id:'before' as const, lbl:'Avant' },
    { id:'how'    as const, lbl:'Avec Flowin' },
    { id:'after'  as const, lbl:'Résultat' },
  ]

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background:'#F4F6F9', color:navy, minHeight:'100dvh', overflowX:'hidden' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:rgba(244,246,249,.96);backdrop-filter:blur(12px);position:sticky;top:0;z-index:10;border-bottom:1px solid rgba(27,58,92,.1)}
        .logo{font-size:20px;font-weight:700;color:${navy}}.logo em{font-style:normal;color:${teal}}
        .btn-demo{background:${teal};color:#fff;border:none;border-radius:50px;padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px}
        .hero{position:relative;overflow:hidden;padding:90px 24px 70px;text-align:center;background:#fff;border-bottom:1px solid rgba(27,58,92,.08)}
        .hero-q{font-size:clamp(18px,3.5vw,28px);font-weight:700;color:${navy};line-height:1.3;transition:opacity .4s,transform .4s;text-align:center;min-height:72px;display:flex;align-items:center;justify-content:center}
        .hero-baseline{display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;margin:24px 0 32px}
        .baseline-verb{font-size:clamp(14px,2vw,18px);font-weight:700;letter-spacing:.04em}
        .baseline-sep{color:rgba(27,58,92,.25);font-size:22px;font-weight:300}
        /* BESOINS */
        .besoins{background:#fff;padding:70px 24px;border-bottom:1px solid rgba(27,58,92,.08)}
        .besoins-inner{max-width:960px;margin:0 auto}
        .besoins-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(27,58,92,.1);border-radius:16px;overflow:hidden;margin-top:40px}
        @media(max-width:680px){.besoins-grid{grid-template-columns:1fr}}
        .besoin-card{background:#fff;padding:28px 24px;display:flex;flex-direction:column;gap:0}
        .besoin-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:16px;flex-shrink:0}
        .besoin-verb{font-size:22px;font-weight:700;margin-bottom:4px}
        .besoin-tag{font-size:12px;font-weight:600;margin-bottom:14px}
        .besoin-desc{font-size:13px;line-height:1.65;color:rgba(27,58,92,.65);margin-bottom:16px}
        .besoin-feats{list-style:none;margin-bottom:16px}
        .besoin-feats li{font-size:12px;color:rgba(27,58,92,.65);padding:4px 0;border-bottom:1px solid rgba(27,58,92,.05);display:flex;align-items:center;gap:8px}
        .besoin-feats li:last-child{border-bottom:none}
        .besoin-metric{font-size:11px;font-weight:600;padding:8px 12px;border-radius:8px;display:flex;align-items:center;gap:6px;margin-top:auto}
        /* DEMO */
        .demo-section{background:#1B3A5C;padding:70px 24px}
        .demo-inner{max-width:820px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
        @media(max-width:640px){.demo-inner{grid-template-columns:1fr;gap:28px;text-align:center}}
        .phone-mock{width:180px;height:320px;border-radius:28px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.15);margin:0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px}
        .phone-notch{width:60px;height:16px;background:rgba(255,255,255,.1);border-radius:0 0 10px 10px;position:absolute;top:0;left:50%;transform:translateX(-50%)}
        .spin-circle{width:100px;height:100px;border-radius:50%;border:2.5px solid ${teal};display:flex;align-items:center;justify-content:center;font-size:32px;animation:spinAnim 9s linear infinite}
        @keyframes spinAnim{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .demo-cta-a{display:block;background:${teal};color:#fff;text-decoration:none;border-radius:50px;padding:14px 28px;font-size:15px;font-weight:700;text-align:center;font-family:inherit;cursor:pointer;border:none;margin-bottom:10px}
        /* PROFILS */
        .profils-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}
        .prof{background:#fff;border:1.5px solid rgba(27,58,92,.1);border-radius:14px;padding:16px 10px;text-align:center;cursor:pointer;transition:all .18s}
        .prof.sel{border-color:${teal};box-shadow:0 4px 20px rgba(0,180,160,.15)}
        .prof:hover{box-shadow:0 3px 12px rgba(0,0,0,.07)}
        .prof-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px}
        .result-card{background:#fff;border-radius:16px;box-shadow:0 6px 28px rgba(0,0,0,.07);padding:24px;margin-top:20px}
        .tab-row{display:flex;gap:6px;margin-bottom:14px}
        .tab-btn{padding:6px 14px;border-radius:20px;border:1.5px solid rgba(27,58,92,.15);background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:${navy};font-family:inherit;display:flex;align-items:center;gap:5px}
        .tab-btn.on{background:${teal};border-color:${teal};color:#fff}
        .tab-content{font-size:14px;color:rgba(27,58,92,.75);line-height:1.7;font-style:italic}
        /* PROOF */
        .proof{background:${navy};padding:70px 24px;color:#fff}
        .proof-inner{max-width:700px;margin:0 auto;text-align:center}
        .proof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px}
        .pn-val{font-size:56px;font-weight:700;line-height:1}
        .pn-lbl{font-size:12px;color:rgba(255,255,255,.5);margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
        /* MODULES */
        .modules-section{background:#fff;padding:70px 24px}
        .modules-inner{max-width:920px;margin:0 auto}
        .modules-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px;margin-top:32px}
        .module-card{border:1px solid rgba(27,58,92,.1);border-radius:16px;padding:20px;transition:box-shadow .18s}
        .module-card:hover{box-shadow:0 6px 24px rgba(0,0,0,.07)}
        .module-ico{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:12px;flex-shrink:0}
        .module-feats{list-style:none;margin-top:10px}
        .module-feats li{font-size:12px;color:rgba(27,58,92,.6);padding:3px 0;display:flex;align-items:center;gap:7px}
        /* ACCOMP */
        .accomp{background:#F4F6F9;padding:70px 24px}
        .accomp-inner{max-width:860px;margin:0 auto}
        .accomp-card{background:#fff;border-top:3px solid ${teal};border-radius:0 0 16px 16px;padding:32px;margin-top:32px}
        .accomp-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        @media(max-width:560px){.accomp-grid{grid-template-columns:1fr}}
        .accomp-item{display:flex;align-items:flex-start;gap:12px}
        .accomp-ico{width:36px;height:36px;border-radius:10px;background:rgba(0,180,160,.1);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;color:${teal}}
        /* PRICING */
        .pricing-section{background:#fff;padding:70px 24px;border-top:1px solid rgba(27,58,92,.08)}
        .pricing-inner{max-width:920px;margin:0 auto}
        .pricing-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px;margin-top:32px}
        .price-card{border:1px solid rgba(27,58,92,.1);border-radius:20px;padding:24px;position:relative;background:#fff}
        .price-card.hl{border-color:${teal};box-shadow:0 6px 32px rgba(0,180,160,.14)}
        .price-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:${teal};color:#fff;font-size:10px;font-weight:700;padding:4px 14px;border-radius:100px;white-space:nowrap;letter-spacing:.04em}
        .price-amount{font-size:42px;font-weight:700;color:${navy};line-height:1}
        .price-feats{list-style:none;margin:14px 0 18px}
        .price-feats li{font-size:13px;color:rgba(27,58,92,.7);padding:5px 0;border-bottom:1px solid rgba(27,58,92,.05);display:flex;align-items:center;gap:8px}
        .price-feats li:last-child{border-bottom:none}
        .btn-price{width:100%;padding:13px;border:none;border-radius:50px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
        .btn-price.hl{background:${teal};color:#fff}
        .btn-price.ghost{background:transparent;border:1.5px solid rgba(27,58,92,.2);color:${navy}}
        /* CTA */
        .cta-section{background:#F4F6F9;padding:70px 24px;border-top:1px solid rgba(27,58,92,.08)}
        .cta-inner{max-width:460px;margin:0 auto;text-align:center}
        .inp{width:100%;padding:14px 16px;background:#fff;border:1.5px solid rgba(27,58,92,.15);border-radius:12px;color:${navy};font-size:15px;font-family:inherit;outline:none;margin-bottom:10px}
        .inp:focus{border-color:${teal}}
        .btn-submit{width:100%;padding:16px;background:${teal};color:#fff;border:none;border-radius:50px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit}
        .success-box{background:rgba(0,180,160,.07);border:1.5px solid rgba(0,180,160,.25);border-radius:14px;padding:28px}
        .footer{text-align:center;padding:24px;font-size:11px;color:rgba(27,58,92,.35);background:#F4F6F9}
        .section-eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${teal};margin-bottom:10px}
        .section-title{font-size:clamp(22px,4vw,30px);font-weight:700;color:${navy};margin-bottom:8px}
        .section-sub{color:rgba(27,58,92,.5);font-size:15px;line-height:1.6}
      `}</style>

      {/* NAV */}
      <nav className="topbar">
        <div className="logo">Flow<em>in</em></div>
        <button className="btn-demo" onClick={() => document.getElementById('s-besoins')?.scrollIntoView({ behavior:'smooth' })}>
          <i className="ti ti-arrow-right" style={{fontSize:15}} aria-hidden="true" />
          Voir la solution
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="s-hero">
        <div style={{ position:'relative', zIndex:1, maxWidth:720, margin:'0 auto' }}>
          <div style={{ marginBottom:28, minHeight:80 }}>
            <div className="hero-q" style={{ opacity:qVisible?1:0, transform:qVisible?'translateY(0)':'translateY(8px)' }}>
              {hero?.questions?.[qIdx] ?? ''}
            </div>
          </div>
          <div style={{ fontSize:'clamp(14px,2.2vw,17px)', color:'rgba(27,58,92,.6)', marginBottom:28, lineHeight:1.6 }}>
            {hero?.answer}
          </div>
          <div className="hero-baseline">
            <span className="baseline-verb" style={{ color:'#D85A30' }}>Captez</span>
            <span className="baseline-sep">·</span>
            <span className="baseline-verb" style={{ color:'#3B5CC4' }}>Convertissez</span>
            <span className="baseline-sep">·</span>
            <span className="baseline-verb" style={{ color:'#1D9E75' }}>Fidélisez</span>
          </div>
          <button className="btn-demo" style={{ display:'inline-flex', fontSize:16, padding:'16px 36px', margin:'0 auto' }}
            onClick={() => document.getElementById('s-besoins')?.scrollIntoView({ behavior:'smooth' })}>
            {hero?.cta ?? 'Voir comment Flowin fonctionne →'}
          </button>
        </div>
      </section>

      {/* VOS BESOINS */}
      <section className="besoins" id="s-besoins">
        <div className="besoins-inner">
          <div style={{ textAlign:'center' }}>
            <div className="section-eyebrow">Vos besoins</div>
            <div className="section-title">Tout ce dont vous avez besoin, là où vous êtes</div>
            <div className="section-sub">Trois résultats. Une seule plateforme. Un chef de projet dédié.</div>
          </div>
          <div className="besoins-grid">
            {BESOINS.map(b => (
              <div key={b.id} className="besoin-card">
                <div className="besoin-icon" style={{ background:`${b.couleur}14`, color:b.couleur }}>
                  <i className={`ti ${b.icon}`} aria-hidden="true" />
                </div>
                <div className="besoin-verb" style={{ color:b.couleur }}>{b.verb}</div>
                <div className="besoin-tag" style={{ color:b.couleur }}>{b.tagline}</div>
                <p className="besoin-desc">{b.desc}</p>
                <ul className="besoin-feats">
                  {b.features.map((f,i) => (
                    <li key={i}>
                      <i className="ti ti-check" style={{ color:teal, fontSize:13, flexShrink:0 }} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="besoin-metric" style={{ background:`${b.couleur}0d`, color:b.couleur }}>
                  <i className="ti ti-trending-up" style={{ fontSize:14 }} aria-hidden="true" />
                  {b.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="demo-section" id="s-demo">
        <div className="demo-inner">
          <div>
            <div className="section-eyebrow" style={{ color:teal }}>Démo live</div>
            <div className="section-title" style={{ color:'#fff', marginBottom:12 }}>
              Testez l&apos;expérience en 30 secondes
            </div>
            <div style={{ color:'rgba(255,255,255,.6)', fontSize:14, lineHeight:1.7, marginBottom:24 }}>
              Vivez exactement ce que vivra votre client. Formulaire CRM, ticket de tirage — le parcours complet.
            </div>
            <a href={DEMO_URL} target="_blank" rel="noopener" className="demo-cta-a">
              <i className="ti ti-player-play" style={{ marginRight:6 }} aria-hidden="true" />
              Jouer à la démo
            </a>
            <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:12, padding:12 }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(DEMO_URL)}&bgcolor=1B3A5C&color=ffffff&margin=6`}
                alt="QR démo" style={{ width:56, height:56, borderRadius:8, flexShrink:0 }} />
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:'#fff' }}>Accès mobile</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>Scannez pour tester depuis votre téléphone</div>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <div className="phone-mock" style={{ position:'relative' }}>
              <div className="phone-notch" />
              <div className="spin-circle">
                <i className="ti ti-rotate-clockwise" style={{ fontSize:36, color:teal }} aria-hidden="true" />
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.7)', textAlign:'center' }}>Roue de la fortune</div>
              <div style={{ background:teal, borderRadius:50, padding:'7px 16px', fontSize:11, fontWeight:700, color:'#fff' }}>
                Faire tourner
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROFILS */}
      <section id="s-profils" style={{ padding:'70px 24px', background:'#F4F6F9' }}>
        <div style={{ maxWidth:880, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div className="section-eyebrow">Votre métier</div>
            <div className="section-title">Flowin s&apos;adapte à votre activité</div>
            <div className="section-sub">Choisissez votre profil pour voir ce que Flowin peut faire pour vous.</div>
          </div>
          <div className="profils-grid">
            {profils.map(p => (
              <div key={p.id} className={`prof${selProf===p.id?' sel':''}`}
                onClick={() => { setSelProf(p.id===selProf?null:p.id); setActiveTab('before') }}>
                <div className="prof-ico" style={{ background:`${p.couleur}14`, color:p.couleur }}>
                  <i className={`ti ${p.ico}`} aria-hidden="true" />
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:navy, lineHeight:1.3 }}>{p.lbl}</div>
              </div>
            ))}
          </div>
          {sp && (
            <div className="result-card">
              <div style={{ fontWeight:700, fontSize:17, color:navy, marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:`${sp.couleur}14`, color:sp.couleur, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                  <i className={`ti ${sp.ico}`} aria-hidden="true" />
                </div>
                {sp.lbl}
              </div>
              <div className="tab-row">
                {TAB_LABELS.map(t => (
                  <button key={t.id} className={`tab-btn${activeTab===t.id?' on':''}`}
                    onClick={() => setActiveTab(t.id)}>
                    {t.lbl}
                  </button>
                ))}
              </div>
              <div className="tab-content">
                {activeTab==='before' && sp.before}
                {activeTab==='how'    && sp.how}
                {activeTab==='after'  && sp.after}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PROOF */}
      <section className="proof" id="s-proof">
        <div className="proof-inner">
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', color:teal, marginBottom:14 }}>
            Ils l&apos;ont fait. Vraiment.
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
              <div className="pn-val" style={{ color:'#A855F7' }}>{counters.c3}%</div>
              <div className="pn-lbl">{proof?.stat3Lbl}</div>
            </div>
          </div>
          {proof?.quote && (
            <>
              <div style={{ fontSize:16, fontStyle:'italic', color:'rgba(255,255,255,.85)', lineHeight:1.7, marginBottom:10 }}>
                &ldquo;{proof.quote}&rdquo;
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>— {proof.quoteAuthor}</div>
            </>
          )}
        </div>
      </section>

      {/* MODULES */}
      <section className="modules-section" id="s-modules">
        <div className="modules-inner">
          <div style={{ textAlign:'center' }}>
            <div className="section-eyebrow">Les mécaniques</div>
            <div className="section-title">6 formats de capture. 1 plateforme.</div>
            <div className="section-sub">Chaque mécanique collecte les données CRM et génère un ticket de tirage automatique.</div>
          </div>
          <div className="modules-grid">
            {modules.map(m => (
              <div key={m.id} className="module-card">
                <div className="module-ico" style={{ background:`${m.couleur}14`, color:m.couleur }}>
                  <i className={`ti ${m.ico}`} aria-hidden="true" />
                </div>
                <div style={{ fontWeight:700, fontSize:15, color:navy }}>{m.nom}</div>
                <div style={{ fontSize:12, color:m.couleur, fontWeight:600, marginTop:2 }}>{m.tagline}</div>
                <ul className="module-feats">
                  {m.features.map((f,i) => (
                    <li key={i}>
                      <i className="ti ti-check" style={{ color:teal, fontSize:12, flexShrink:0 }} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACCOMPAGNEMENT */}
      <section className="accomp" id="s-accomp">
        <div className="accomp-inner">
          <div style={{ textAlign:'center' }}>
            <div className="section-eyebrow">L&apos;accompagnement</div>
            <div className="section-title">Un chef de projet à chaque déploiement</div>
            <div className="section-sub">Vous ne configurez pas seul. Flowin vous accompagne de la conception au live.</div>
          </div>
          <div className="accomp-card">
            <div className="accomp-grid">
              {[
                { icon:'ti-palette', title:'Création graphique', desc:'Visuels aux couleurs de votre marque, white label complet' },
                { icon:'ti-database', title:'Intégration données internes', desc:'CRM existant, caisse, billetterie, base adhérents' },
                { icon:'ti-settings', title:'Paramétrage complet', desc:'Lots, questions, parcours, tirage — clés en main' },
                { icon:'ti-school', title:'Formation & suivi', desc:'Prise en main dashboard + analyse résultats post-event' },
              ].map((item, i) => (
                <div key={i} className="accomp-item">
                  <div className="accomp-ico">
                    <i className={`ti ${item.icon}`} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:navy, marginBottom:3 }}>{item.title}</div>
                    <div style={{ fontSize:12, color:'rgba(27,58,92,.55)', lineHeight:1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-section" id="s-pricing">
        <div className="pricing-inner">
          <div style={{ textAlign:'center' }}>
            <div className="section-eyebrow">Tarifs</div>
            <div className="section-title">Simple. Transparent. Sans surprise.</div>
            <div className="section-sub">Démo gratuite · Activation en 24h · Sans engagement</div>
          </div>
          <div className="pricing-grid">
            {pricing.map(tier => (
              <div key={tier.id} className={`price-card${tier.highlight?' hl':''}`}>
                {tier.badge && <div className="price-badge">{tier.badge}</div>}
                <div style={{ fontWeight:700, fontSize:11, color:'rgba(27,58,92,.45)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>{tier.nom}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:3, marginBottom:3 }}>
                  <div className="price-amount">{tier.prix}</div>
                  {tier.prix !== 'Devis' && <div style={{ fontSize:14, color:'rgba(27,58,92,.4)' }}>€</div>}
                </div>
                {tier.unite && <div style={{ fontSize:12, color:'rgba(27,58,92,.4)', fontWeight:600, marginBottom:4 }}>{tier.unite}</div>}
                <ul className="price-feats">
                  {tier.features.map((f,i) => (
                    <li key={i}>
                      <i className="ti ti-check" style={{ color:teal, fontSize:12, flexShrink:0 }} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`btn-price${tier.highlight?' hl':' ghost'}`}
                  onClick={() => document.getElementById('s-cta')?.scrollIntoView({ behavior:'smooth' })}>
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:14, fontSize:11, color:'rgba(27,58,92,.35)' }}>
            TVA non applicable · Art. 293B du CGI
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="s-cta">
        <div className="cta-inner">
          {submitted ? (
            <div className="success-box">
              <div style={{ fontSize:20, fontWeight:700, color:navy, marginBottom:8 }}>{cta?.successTitle}</div>
              <div style={{ fontSize:14, color:'rgba(27,58,92,.6)', lineHeight:1.6 }}>{cta?.successText}</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:28, fontWeight:700, color:navy, marginBottom:6 }}>{cta?.title}</div>
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
        </div>
      </section>

      <footer className="footer">
        Flowin · OPConsult / BAITA EURL · Vence 06140 ·{' '}
        <a href="mailto:romain@opconsult.fr" style={{ color:'inherit' }}>romain@opconsult.fr</a>
      </footer>
    </div>
  )
}
