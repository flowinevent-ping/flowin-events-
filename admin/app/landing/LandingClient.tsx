'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface LandingCfg {
  id: string; nom: string; accent_color: string
  hero: { questions: string[]; answer: string; cta: string }
  proof: { stat1: string; stat1Lbl: string; stat2: string; stat2Lbl: string; stat3: string; stat3Lbl: string; quote: string; quoteAuthor: string }
  profils: Array<{ id: string; ico: string; lbl: string; avant: string; apres: string; couleur: string }>
  cta_section: { title: string; subtitle: string; formPlaceholderNom: string; formPlaceholderEmail: string; formPlaceholderTel: string; ctaSubmit: string; successTitle: string; successText: string }
}

const DEF: LandingCfg = {
  id: 'ld-flowin-demo', nom: 'Flowin', accent_color: '#3B5CC4',
  hero: { questions: ['Avez-vous le contact de tous vos clients ?','Un moyen de capter les prospects de passage ?','Combien dépensez-vous pour trouver de nouveaux clients ?',"Travaillez-vous déjà avec vos acquis ?"], answer: 'La solution tient en un clic.', cta: "Vivre l'expérience joueur →" },
  proof: { stat1:'186', stat1Lbl:'personnes', stat2:'3', stat2Lbl:'jours', stat3:'94', stat3Lbl:'opt-in', quote:"En un week-end, nous avons récupéré 186 contacts qualifiés avec un taux d'opt-in à 94%.", quoteAuthor:'Ville de Vence — Fêtes de Pâques 2026' },
  profils: [
    { id:'p0', ico:'🛍️', lbl:'Boutique / Commerce', couleur:'#E85D04', avant:"Vos clients repartent sans laisser leurs coordonnées", apres:"Tombola = 186 emails en un week-end." },
    { id:'p1', ico:'🍽️', lbl:'Restaurant / Café', couleur:'#D62828', avant:"Vos tables se remplissent au hasard", apres:"QR sur table → base clients fidèles" },
    { id:'p2', ico:'⛺', lbl:'Marché / Stand', couleur:'#2D6A4F', avant:"Les passants repartent sans trace", apres:"Quiz rapide → 300 contacts en une matinée" },
    { id:'p3', ico:'🏪', lbl:'Réseau / Animation', couleur:'#7B2FBE', avant:"Chaque event est une boîte noire", apres:"Dashboard + export CSV + opt-in RGPD" },
    { id:'p4', ico:'🏢', lbl:'Entreprise / Association', couleur:'#1B4F72', avant:"Vos actions de com' sans métriques", apres:"QR → CRM → rapport automatique" },
    { id:'p5', ico:'🗺️', lbl:'Tourisme / Collectivité', couleur:'#0B6E4F', avant:"Touristes et locaux passent sans trace", apres:"Spin wheel → 94% opt-in" },
  ],
  cta_section: { title:'Testez gratuitement', subtitle:'Aucune CB requise · Réponse sous 24h', formPlaceholderNom:'Votre prénom', formPlaceholderEmail:'Email professionnel', formPlaceholderTel:'Téléphone (optionnel)', ctaSubmit:'Je veux ma démo gratuite →', successTitle:'🎉 Demande envoyée !', successText:'On revient vers vous sous 24h.' },
}

export default function LandingClient({ cfg: cfgProp, source }: { cfg: LandingCfg | null; source: string }) {
  const cfg = cfgProp ?? DEF
  const hero = cfg.hero ?? DEF.hero
  const proof = cfg.proof ?? DEF.proof
  const profils = cfg.profils ?? DEF.profils
  const cta = cfg.cta_section ?? DEF.cta_section
  const teal = '#00B4A0'
  const purple = '#A855F7'
  const navy = '#1B3A5C'

  const [qIdx, setQIdx] = useState(0)
  const [qVisible, setQVisible] = useState(true)
  const [selProf, setSelProf] = useState<string | null>(null)
  const [form, setForm] = useState({ nom: '', email: '', tel: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [counters, setCounters] = useState({ c1: 0, c2: 0, c3: 0 })
  const [counted, setCounted] = useState(false)

  /* Questions rotation */
  useEffect(() => {
    const iv = setInterval(() => {
      setQVisible(false)
      setTimeout(() => { setQIdx(i => (i + 1) % hero.questions.length); setQVisible(true) }, 400)
    }, 3200)
    return () => clearInterval(iv)
  }, [hero.questions.length])

  /* Proof counters animation */
  useEffect(() => {
    if (counted) return
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return
      setCounted(true)
      const t1 = parseInt(proof.stat1) || 186
      const t3 = parseInt(proof.stat3) || 94
      let n = 0
      const iv = setInterval(() => {
        n += 4
        setCounters({ c1: Math.min(n * Math.round(t1 / 40), t1), c2: 3, c3: Math.min(Math.round(n * t3 / 40), t3) })
        if (n >= 40) clearInterval(iv)
      }, 30)
      observer.disconnect()
    }, { threshold: 0.3 })
    const el = document.getElementById('s-proof')
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [counted, proof.stat1, proof.stat3])

  /* Navigation postMessage — flèches dashboard SA */
  useEffect(() => {
    const SECTIONS = ['s-hero', 's-profils', 's-proof', 's-cta']
    let idx = 0
    function onMsg(e: MessageEvent) {
      if (!e.data?.flowinNav) return
      if (e.data.flowinNav === 'next') idx = Math.min(idx + 1, SECTIONS.length - 1)
      if (e.data.flowinNav === 'prev') idx = Math.max(idx - 1, 0)
      const el = document.getElementById(SECTIONS[idx])
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  async function handleSubmit() {
    if (!form.nom.trim() || !form.email.includes('@')) return
    setSubmitting(true)
    const today = new Date().toISOString().slice(0, 10)
    const emailLower = form.email.toLowerCase().trim()
    const profil = profils.find(p => p.id === selProf)
    await supabase.from('joueurs').upsert({
      external_id: `j-cta-${emailLower.replace(/[^a-z0-9]/g, '-').substring(0, 36)}`,
      email: emailLower, prenom: form.nom.trim(), tel: form.tel.trim() || null,
      tags: ['btob', 'cta', profil?.lbl ?? ''].filter(Boolean),
      optin: true, optin_date: today, first_seen: today, last_seen: today,
      source: source === 'qr' ? 'landing_qr' : 'landing_cta',
      client_type: 'btob', enseigne: profil?.lbl ?? null,
    }, { onConflict: 'external_id' })
    setSubmitting(false); setSubmitted(true)
  }

  const selProfilData = profils.find(p => p.id === selProf)
  const qrUrl = 'https://flowin-events.vercel.app/landing?source=qr'

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background:'#F4F6F9', color:navy, minHeight:'100dvh', overflowX:'hidden' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:rgba(244,246,249,.92);backdrop-filter:blur(12px);position:sticky;top:0;z-index:10;border-bottom:1px solid rgba(27,58,92,.1)}
        .logo{font-size:20px;font-weight:900;color:${navy}}
        .logo em{font-style:normal;color:${purple}}
        .btn-demo{background:${teal};color:#fff;border:none;border-radius:50px;padding:10px 22px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit}
        /* HERO */
        .hero{position:relative;overflow:hidden;padding:80px 24px 60px;text-align:center;background:#fff}
        .hero::before{content:'';position:absolute;width:500px;height:500px;background:${teal};opacity:.08;border-radius:50%;top:-200px;right:-150px}
        .hero::after{content:'';position:absolute;width:400px;height:400px;background:${purple};opacity:.08;border-radius:50%;bottom:-100px;left:-100px}
        .hq-wrap{position:relative;min-height:80px;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
        .hq-num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${teal};color:#fff;font-size:12px;font-weight:800;margin-right:10px;flex-shrink:0}
        .hq-text{font-size:clamp(20px,4vw,32px);font-weight:900;color:${navy};line-height:1.25;transition:opacity .4s,transform .4s}
        .hero-ans{font-size:clamp(14px,2.5vw,18px);color:rgba(27,58,92,.6);margin:16px 0 28px}
        .hero-cta{background:${teal};color:#fff;border:none;border-radius:50px;padding:16px 36px;font-size:17px;font-weight:800;cursor:pointer;font-family:inherit}
        .hero-cta:hover{background:#009175}
        /* PROFILS */
        .s-profils{padding:60px 24px;background:#F4F6F9;max-width:900px;margin:0 auto}
        .s-title{font-size:26px;font-weight:900;text-align:center;color:${navy};margin-bottom:8px}
        .s-sub{color:rgba(27,58,92,.5);text-align:center;margin-bottom:32px;font-size:15px}
        .profils-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
        .prof{background:#fff;border:2px solid rgba(27,58,92,.1);border-radius:14px;padding:18px 12px;text-align:center;cursor:pointer;transition:all .2s}
        .prof.sel{border-color:${teal};box-shadow:0 8px 32px rgba(0,180,160,.18)}
        .prof:hover{box-shadow:0 4px 16px rgba(0,0,0,.08)}
        .prof-ico{font-size:30px;margin-bottom:8px}
        .prof-lbl{font-size:11px;font-weight:800;color:${navy};line-height:1.3}
        .result-card{background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.08);padding:28px;margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:20px}
        @media(max-width:600px){.result-card{grid-template-columns:1fr}}
        .rc-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
        .rc-text{font-size:14px;color:rgba(27,58,92,.7);line-height:1.6}
        /* PROOF */
        .proof{background:${navy};padding:60px 24px;color:#fff}
        .proof-inner{max-width:700px;margin:0 auto;text-align:center}
        .proof-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px}
        .pn-val{font-size:52px;font-weight:900;line-height:1}
        .pn-lbl{font-size:12px;color:rgba(255,255,255,.5);margin-top:4px;font-weight:700}
        .proof-quote{font-size:17px;font-style:italic;color:rgba(255,255,255,.85);line-height:1.7;margin-bottom:10px}
        .proof-author{font-size:12px;color:rgba(255,255,255,.4)}
        /* CTA */
        .cta-section{background:#fff;padding:60px 24px;border-top:1px solid rgba(27,58,92,.08)}
        .cta-inner{max-width:460px;margin:0 auto;text-align:center}
        .cta-title{font-size:28px;font-weight:900;color:${navy};margin-bottom:6px}
        .cta-sub{color:rgba(27,58,92,.5);margin-bottom:28px;font-size:14px}
        .inp{width:100%;padding:14px 16px;background:#F4F6F9;border:1.5px solid rgba(27,58,92,.15);border-radius:12px;color:${navy};font-size:15px;font-family:inherit;outline:none;margin-bottom:10px}
        .inp:focus{border-color:${teal}}
        .btn-submit{width:100%;padding:16px;background:${teal};color:#fff;border:none;border-radius:50px;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit}
        .btn-submit:hover{background:#009175}
        .qr-box{display:flex;align-items:center;gap:12px;background:#F4F6F9;border:1px solid rgba(27,58,92,.1);border-radius:12px;padding:14px;margin-top:20px;text-align:left}
        .qr-box img{width:60px;height:60px;border-radius:8px;flex-shrink:0}
        .success-box{background:rgba(0,180,160,.08);border:1.5px solid rgba(0,180,160,.3);border-radius:14px;padding:28px;text-align:center}
        .footer{text-align:center;padding:24px;font-size:11px;color:rgba(27,58,92,.35);background:#F4F6F9}
      `}</style>

      {/* TOPBAR */}
      <nav className="topbar">
        <div className="logo">Flow<em>in</em></div>
        <button className="btn-demo" onClick={() => document.getElementById('s-cta')?.scrollIntoView({ behavior: 'smooth' })}>
          Demander une démo
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="s-hero">
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
          <div className="hq-wrap">
            <div className="hq-text" style={{ opacity: qVisible ? 1 : 0, transform: qVisible ? 'translateY(0)' : 'translateY(8px)' }}>
              <span className="hq-num">{qIdx + 1}</span>
              {hero.questions[qIdx]}
            </div>
          </div>
          <div className="hero-ans">{hero.answer}</div>
          <button className="hero-cta" onClick={() => document.getElementById('s-profils')?.scrollIntoView({ behavior: 'smooth' })}>
            {hero.cta}
          </button>
        </div>
      </section>

      {/* PROFILS */}
      <section id="s-profils" style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="s-title">Qui êtes-vous ?</div>
          <div className="s-sub">Choisissez votre profil pour voir ce que Flowin peut faire pour vous.</div>
          <div className="profils-grid">
            {profils.map(p => (
              <div key={p.id} className={`prof${selProf === p.id ? ' sel' : ''}`}
                onClick={() => setSelProf(p.id === selProf ? null : p.id)}>
                <div className="prof-ico">{p.ico}</div>
                <div className="prof-lbl">{p.lbl}</div>
              </div>
            ))}
          </div>

          {selProfilData && (
            <div className="result-card">
              <div>
                <div className="rc-label" style={{ color: 'rgba(27,58,92,.4)' }}>Votre situation aujourd&apos;hui</div>
                <div className="rc-text">{selProfilData.avant}</div>
              </div>
              <div>
                <div className="rc-label" style={{ color: teal }}>⚡ Avec Flowin</div>
                <div className="rc-text" style={{ color: navy, fontWeight: 700 }}>{selProfilData.apres}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PROOF */}
      <section className="proof" id="s-proof">
        <div className="proof-inner">
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: teal, marginBottom: 12 }}>
            ILS L&apos;ONT FAIT. VRAIMENT.
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 32 }}>
            {proof.quoteAuthor}
          </div>
          <div className="proof-grid">
            <div>
              <div className="pn-val" style={{ color: teal }}>{counters.c1}</div>
              <div className="pn-lbl">{proof.stat1Lbl}</div>
            </div>
            <div>
              <div className="pn-val" style={{ color: '#F59E0B' }}>{counters.c2}</div>
              <div className="pn-lbl">{proof.stat2Lbl}</div>
            </div>
            <div>
              <div className="pn-val" style={{ color: '#A855F7' }}>{counters.c3}%</div>
              <div className="pn-lbl">{proof.stat3Lbl}</div>
            </div>
          </div>
          {proof.quote && (
            <>
              <div className="proof-quote">&ldquo;{proof.quote}&rdquo;</div>
              <div className="proof-author">— {proof.quoteAuthor}</div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="s-cta">
        <div className="cta-inner">
          {submitted ? (
            <div className="success-box">
              <div style={{ fontSize: 22, fontWeight: 900, color: navy, marginBottom: 8 }}>{cta.successTitle}</div>
              <div style={{ fontSize: 14, color: 'rgba(27,58,92,.6)', lineHeight: 1.6 }}>{cta.successText}</div>
            </div>
          ) : (
            <>
              <div className="cta-title">{cta.title}</div>
              <div className="cta-sub">{cta.subtitle}</div>
              <input className="inp" placeholder={cta.formPlaceholderNom}
                value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              <input className="inp" type="email" placeholder={cta.formPlaceholderEmail}
                autoCapitalize="none"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <input className="inp" type="tel" placeholder={cta.formPlaceholderTel}
                value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} />
              <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Envoi…' : cta.ctaSubmit}
              </button>
              <div style={{ fontSize: 11, color: 'rgba(27,58,92,.35)', marginTop: 8 }}>
                Données jamais cédées à des tiers · RGPD
              </div>
            </>
          )}
          <div className="qr-box">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrUrl)}&bgcolor=1B3A5C&color=ffffff&margin=6`} alt="QR" />
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: navy }}>📱 Partager la landing</div>
              <div style={{ fontSize: 11, color: 'rgba(27,58,92,.5)', marginTop: 3 }}>Scannez pour accéder depuis votre téléphone</div>
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(27,58,92,.35)', marginTop: 4, wordBreak: 'break-all' }}>flowin-events.vercel.app/landing</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        Flowin · OPConsult / BAITA EURL · Vence 06140 ·{' '}
        <a href="mailto:romain@opconsult.fr" style={{ color: 'inherit' }}>romain@opconsult.fr</a>
      </footer>
    </div>
  )
}
