'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface LandingCfg {
  id: string
  nom: string
  accent_color: string
  hero: {
    questions: string[]
    answer: string
    cta: string
  }
  proof: {
    stat1: string; stat1Lbl: string
    stat2: string; stat2Lbl: string
    stat3: string; stat3Lbl: string
    quote: string; quoteAuthor: string
  }
  profils: Array<{
    id: string; ico: string; lbl: string
    avant: string; apres: string; couleur: string
  }>
  cta_section: {
    title: string; subtitle: string
    formPlaceholderNom: string
    formPlaceholderEmail: string
    formPlaceholderTel: string
    ctaSubmit: string
    successTitle: string; successText: string
  }
}

const DEFAULTS: LandingCfg = {
  id: 'ld-flowin-demo', nom: 'Flowin',
  accent_color: '#3B5CC4',
  hero: {
    questions: [
      'Avez-vous le contact de tous vos clients ?',
      'Un moyen de capter les prospects de passage ?',
      'Combien dépensez-vous pour trouver de nouveaux clients ?',
      'Travaillez-vous déjà avec vos acquis ?',
    ],
    answer: 'La solution tient en un clic.',
    cta: "Vivre l'expérience joueur →",
  },
  proof: {
    stat1: '186', stat1Lbl: 'personnes',
    stat2: '3',   stat2Lbl: 'jours',
    stat3: '94',  stat3Lbl: 'opt-in',
    quote: "En un week-end, nous avons récupéré 186 contacts qualifiés avec un taux d'opt-in à 94%.",
    quoteAuthor: 'Ville de Vence — Fêtes de Pâques 2026',
  },
  profils: [
    { id:'p0', ico:'🛍️', lbl:'Boutique / Commerce', couleur:'#E85D04',
      avant:"Vous perdez des clients car ils repartent sans laisser leurs coordonnées",
      apres:"Chaque client devient un contact. Tombola = 186 emails en un week-end." },
    { id:'p1', ico:'🍽️', lbl:'Restaurant / Café', couleur:'#D62828',
      avant:"Vos tables se remplissent au hasard, sans fil rouge",
      apres:"QR sur table → participation → base clients fidèles → retargeting direct" },
    { id:'p2', ico:'⛺', lbl:'Marché / Stand', couleur:'#2D6A4F',
      avant:"Les passants repartent sans trace — zéro suivi possible",
      apres:"Quiz rapide → ticket → email capté. 300 participants en une matinée." },
    { id:'p3', ico:'🏪', lbl:'Réseau / Animation', couleur:'#7B2FBE',
      avant:"Chaque event est une boîte noire : qui est venu ? Qui rachètera ?",
      apres:"Dashboard temps réel + export CSV + opt-in RGPD validé" },
    { id:'p4', ico:'🏢', lbl:'Entreprise / Association', couleur:'#1B4F72',
      avant:"Vos actions de com' n'ont pas de métriques claires",
      apres:"QR → module ludique → CRM → rapport automatique. ROI mesurable." },
    { id:'p5', ico:'🗺️', lbl:'Tourisme / Collectivité', couleur:'#0B6E4F',
      avant:"Les touristes passent, les locaux aussi — sans laisser de trace",
      apres:"Spin wheel → 94% opt-in → liste segments géo" },
  ],
  cta_section: {
    title: 'Testez gratuitement',
    subtitle: 'Aucune CB requise · Réponse sous 24h',
    formPlaceholderNom: 'Votre prénom',
    formPlaceholderEmail: 'Email professionnel',
    formPlaceholderTel: 'Téléphone (optionnel)',
    ctaSubmit: 'Je veux ma démo gratuite →',
    successTitle: '🎉 Demande envoyée !',
    successText: 'On revient vers vous sous 24h avec votre accès de démonstration.',
  },
}

export default function LandingClient({
  cfg: cfgProp,
  source,
}: {
  cfg: LandingCfg | null
  source: string
}) {
  const cfg: LandingCfg = cfgProp ?? DEFAULTS
  const accent = cfg.accent_color ?? '#3B5CC4'
  const hero = cfg.hero ?? DEFAULTS.hero
  const proof = cfg.proof ?? DEFAULTS.proof
  const profils = cfg.profils ?? DEFAULTS.profils
  const cta = cfg.cta_section ?? DEFAULTS.cta_section

  const [qIdx, setQIdx] = useState(0)
  const [selectedProfil, setSelectedProfil] = useState<string | null>(null)
  const [form, setForm] = useState({ nom: '', email: '', tel: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  // Animation questions hero
  useEffect(() => {
    const iv = setInterval(() => setQIdx(i => (i + 1) % hero.questions.length), 3200)
    return () => clearInterval(iv)
  }, [hero.questions.length])

  async function handleSubmit() {
    if (!form.nom.trim() || !form.email.includes('@')) return
    setSubmitting(true)

    const today = new Date().toISOString().slice(0, 10)
    const emailLower = form.email.toLowerCase().trim()
    const extId = `j-cta-${emailLower.replace(/[^a-z0-9]/g, '-').substring(0, 36)}`
    const profil = profils.find(p => p.id === selectedProfil)

    await supabase.from('joueurs').upsert({
      external_id: extId,
      email: emailLower,
      prenom: form.nom.trim(),
      tel: form.tel.trim() || null,
      tags: ['btob', 'cta', profil?.lbl ?? ''].filter(Boolean),
      optin: true,
      optin_date: today,
      first_seen: today,
      last_seen: today,
      source: source === 'qr' ? 'landing_qr' : 'landing_cta',
      client_type: 'btob',
      enseigne: profil?.lbl ?? null,
    }, { onConflict: 'external_id' })

    setSubmitting(false)
    setSubmitted(true)
  }

  const selProfil = profils.find(p => p.id === selectedProfil)

  /* Navigation postMessage — flèches dashboard SA */
  useEffect(() => {
    const SECTIONS = ['', 's-profils', 's-proof', 's-cta']
    let sIdx = 0
    function onMsg(e: MessageEvent) {
      if (!e.data?.flowinNav) return
      if (e.data.flowinNav === 'next') sIdx = Math.min(sIdx + 1, SECTIONS.length - 1)
      if (e.data.flowinNav === 'prev') sIdx = Math.max(sIdx - 1, 0)
      const id = SECTIONS[sIdx]
      if (!id) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])


  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: '#0B1121', color: '#fff', minHeight: '100dvh',
      '--accent': accent,
    } as React.CSSProperties}>
      <style>{`
        :root { --accent: ${accent}; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .topbar { display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px; background: rgba(11,17,33,.9);
          backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 10;
          border-bottom: 1px solid rgba(255,255,255,.08); }
        .logo { font-size: 20px; font-weight: 900; letter-spacing: -.5px; }
        .logo span { color: var(--accent); }
        .hero { padding: 80px 24px 60px; text-align: center; max-width: 700px; margin: 0 auto; }
        .hero-q { font-size: clamp(22px, 5vw, 38px); font-weight: 900; line-height: 1.2;
          min-height: 100px; display: flex; align-items: center; justify-content: center;
          transition: opacity .4s; }
        .hero-answer { font-size: clamp(16px, 3vw, 22px); color: rgba(255,255,255,.6);
          margin: 20px 0 32px; }
        .hero-cta { background: var(--accent); color: #fff; border: none;
          border-radius: 50px; padding: 16px 36px; font-size: 17px; font-weight: 800;
          cursor: pointer; font-family: inherit; }
        .section { padding: 60px 24px; max-width: 900px; margin: 0 auto; }
        .section-title { font-size: 26px; font-weight: 900; text-align: center; margin-bottom: 8px; }
        .section-sub { color: rgba(255,255,255,.5); text-align: center; margin-bottom: 40px; font-size: 15px; }
        .profils-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
        .profil-tile { background: rgba(255,255,255,.06); border: 2px solid rgba(255,255,255,.1);
          border-radius: 14px; padding: 20px 14px; text-align: center; cursor: pointer; transition: all .2s; }
        .profil-tile.sel { border-color: var(--accent); background: rgba(255,255,255,.1); }
        .profil-tile:hover { background: rgba(255,255,255,.1); }
        .profil-ico { font-size: 32px; margin-bottom: 8px; }
        .profil-lbl { font-size: 11px; font-weight: 800; line-height: 1.3; }
        .result-card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px; padding: 28px; margin-top: 24px; display: grid;
          grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 600px) { .result-card { grid-template-columns: 1fr; } }
        .rc-label { font-size: 10px; font-weight: 800; text-transform: uppercase;
          letter-spacing: .1em; color: rgba(255,255,255,.4); margin-bottom: 8px; }
        .rc-text { font-size: 14px; color: rgba(255,255,255,.7); line-height: 1.6; }
        .rc-after .rc-label { color: var(--accent); }
        .proof-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 40px; }
        .proof-num { font-size: 48px; font-weight: 900; line-height: 1; }
        .proof-lbl { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 4px; font-weight: 700; }
        .proof-quote { font-size: 17px; line-height: 1.7; color: rgba(255,255,255,.8);
          font-style: italic; text-align: center; margin-bottom: 10px; }
        .proof-author { font-size: 12px; color: rgba(255,255,255,.4); text-align: center; }
        .cta-section { background: rgba(255,255,255,.04);
          border-top: 1px solid rgba(255,255,255,.08); padding: 60px 24px; }
        .cta-inner { max-width: 480px; margin: 0 auto; text-align: center; }
        .cta-title { font-size: 28px; font-weight: 900; margin-bottom: 6px; }
        .cta-sub { color: rgba(255,255,255,.5); margin-bottom: 28px; font-size: 14px; }
        .form-row { margin-bottom: 12px; }
        .inp { width: 100%; padding: 14px 16px; background: rgba(255,255,255,.07);
          border: 1.5px solid rgba(255,255,255,.12); border-radius: 12px; color: #fff;
          font-size: 15px; font-family: inherit; outline: none; }
        .inp:focus { border-color: var(--accent); }
        .btn-submit { width: 100%; padding: 16px; background: var(--accent); color: #fff;
          border: none; border-radius: 50px; font-size: 16px; font-weight: 800;
          cursor: pointer; font-family: inherit; margin-top: 8px; }
        .qr-section { display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
          border-radius: 12px; padding: 14px 16px; margin-top: 20px; }
        .qr-section img { width: 60px; height: 60px; border-radius: 6px; }
        .qr-text { font-size: 12px; color: rgba(255,255,255,.5); }
        .qr-url { font-size: 10px; font-family: monospace; color: rgba(255,255,255,.3);
          word-break: break-all; margin-top: 4px; }
        .footer { text-align: center; padding: 24px; font-size: 11px; color: rgba(255,255,255,.25); }
        .success-box { background: rgba(34,197,94,.1); border: 1.5px solid rgba(34,197,94,.3);
          border-radius: 14px; padding: 28px; text-align: center; }
        .success-title { font-size: 22px; font-weight: 900; margin-bottom: 8px; }
        .success-text { font-size: 14px; color: rgba(255,255,255,.6); line-height: 1.6; }
      `}</style>

      {/* TOPBAR */}
      <nav className="topbar">
        <div className="logo">Flow<span>in</span></div>
        <button className="hero-cta"
          style={{ padding: '10px 20px', fontSize: 13 }}
          onClick={() => document.getElementById('s-cta')?.scrollIntoView({ behavior: 'smooth' })}>
          Demander une démo
        </button>
      </nav>

      {/* HERO */}
      <div className="hero" ref={heroRef}>
        <div className="hero-q">
          {hero.questions[qIdx]}
        </div>
        <div className="hero-answer">{hero.answer}</div>
        <button className="hero-cta"
          onClick={() => document.getElementById('s-profils')?.scrollIntoView({ behavior: 'smooth' })}>
          {hero.cta}
        </button>
      </div>

      {/* PROFILS */}
      <div className="section" id="s-profils">
        <div className="section-title">Qui êtes-vous ?</div>
        <div className="section-sub">Choisissez votre profil pour voir ce que Flowin peut faire pour vous.</div>
        <div className="profils-grid">
          {profils.map(p => (
            <div key={p.id}
              className={`profil-tile${selectedProfil === p.id ? ' sel' : ''}`}
              style={{ '--accent': p.couleur } as React.CSSProperties}
              onClick={() => setSelectedProfil(p.id === selectedProfil ? null : p.id)}>
              <div className="profil-ico">{p.ico}</div>
              <div className="profil-lbl">{p.lbl}</div>
            </div>
          ))}
        </div>

        {selProfil && (
          <div className="result-card">
            <div className="rc-before">
              <div className="rc-label">Votre situation aujourd&apos;hui</div>
              <div className="rc-text">{selProfil.avant}</div>
            </div>
            <div className="rc-after">
              <div className="rc-label">Avec Flowin</div>
              <div className="rc-text" style={{ color: '#fff' }}>{selProfil.apres}</div>
            </div>
          </div>
        )}
      </div>

      {/* PREUVE SOCIALE */}
      <div className="section" id="s-proof" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="section-title">Ils l&apos;ont fait. Vraiment.</div>
        <div className="section-sub">Chiffres réels — Ville de Vence, Fêtes de Pâques 2026</div>
        <div className="proof-grid">
          <div style={{ textAlign: 'center' }}>
            <div className="proof-num" style={{ color: '#5DD4AC' }}>{proof.stat1}</div>
            <div className="proof-lbl">{proof.stat1Lbl}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="proof-num" style={{ color: '#F59E0B' }}>{proof.stat2}</div>
            <div className="proof-lbl">{proof.stat2Lbl}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="proof-num" style={{ color: accent }}>{proof.stat3}%</div>
            <div className="proof-lbl">{proof.stat3Lbl}</div>
          </div>
        </div>
        {proof.quote && (
          <>
            <div className="proof-quote">&ldquo;{proof.quote}&rdquo;</div>
            {proof.quoteAuthor && <div className="proof-author">— {proof.quoteAuthor}</div>}
          </>
        )}
      </div>

      {/* CTA FORM */}
      <div className="cta-section" id="s-cta">
        <div className="cta-inner">
          {submitted ? (
            <div className="success-box">
              <div className="success-title">{cta.successTitle}</div>
              <div className="success-text">{cta.successText}</div>
            </div>
          ) : (
            <>
              <div className="cta-title">{cta.title}</div>
              <div className="cta-sub">{cta.subtitle}</div>
              <div className="form-row">
                <input className="inp" placeholder={cta.formPlaceholderNom}
                  value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div className="form-row">
                <input className="inp" type="email" placeholder={cta.formPlaceholderEmail}
                  autoCapitalize="none"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-row">
                <input className="inp" type="tel" placeholder={cta.formPlaceholderTel}
                  value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} />
              </div>
              <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Envoi…' : cta.ctaSubmit}
              </button>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 10 }}>
                Données jamais cédées à des tiers · RGPD
              </div>
            </>
          )}

          {/* QR */}
          <div className="qr-section">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('https://flowin-events.vercel.app/landing?source=qr')}&bgcolor=1B3A5C&color=ffffff&margin=6`}
              alt="QR landing" />
            <div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>📱 Scannez pour accéder</div>
              <div className="qr-text">Partagez cette page directement depuis votre téléphone</div>
              <div className="qr-url">flowin-events.vercel.app/landing</div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer">
        Flowin · OPConsult / BAITA EURL · Vence 06140
        <br />
        <a href="mailto:romain@opconsult.fr" style={{ color: 'inherit', textDecoration: 'none' }}>
          romain@opconsult.fr
        </a>
      </div>
    </div>
  )
}
