'use client'

import { useState } from 'react'
import { writeLandingProspect } from '@/lib/landing'

type Step = 1 | 2 | 3 | 4 | 5

const TYPE_PROS = [
  { val: 'restaurant', ico: '🍽️', label: 'Restaurant / Bar' },
  { val: 'commerce', ico: '🏪', label: 'Commerce' },
  { val: 'cinema', ico: '🎬', label: 'Cinéma / Culture' },
  { val: 'sport', ico: '🏃', label: 'Sport / Fitness' },
  { val: 'collectivite', ico: '🏛️', label: 'Collectivité' },
  { val: 'evenement', ico: '🎪', label: 'Événementiel' },
  { val: 'autre', ico: '✨', label: 'Autre' },
]

const DECOUVERTES = [
  { val: 'bouche_a_oreille', label: 'Bouche à oreille' },
  { val: 'reseaux_sociaux', label: 'Réseaux sociaux' },
  { val: 'qr_code', label: 'QR Code sur place' },
  { val: 'salon', label: 'Salon / Événement' },
  { val: 'internet', label: 'Recherche internet' },
  { val: 'autre', label: 'Autre' },
]

const HOOK_QUESTIONS = [
  'Avez-vous le contact de tous vos clients ?',
  'Un moyen de capter les prospects de passage ?',
  'Combien dépensez-vous pour trouver de nouveaux clients ?',
  'Travaillez-vous déjà avec vos acquis ?',
]

interface Props {
  source?: string
  proId?: string
}

export default function LandingClient({ source }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [typePro, setTypePro] = useState('')
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', tel: '', decouverte: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function ff(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {}
    if (!form.prenom.trim()) errs.prenom = 'Prénom requis'
    if (!form.nom.trim()) errs.nom = 'Nom requis'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    if (form.tel.replace(/\s/g, '').length < 8) errs.tel = 'Téléphone requis'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    const result = await writeLandingProspect({
      ...form,
      typePro,
      source: source ?? 'landing_btob',
    })
    setSubmitting(false)

    if (result.success || result.error === 'email_duplicate') {
      setStep(5) // succès même si doublon
    } else {
      setErrors({ global: 'Erreur technique. Veuillez réessayer.' })
    }
  }

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100dvh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: step === 1 ? '#0f172a' : '#f8fafc',
      color: step === 1 ? '#fff' : '#0f172a',
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .lnd-btn { display: block; width: 100%; padding: 16px; border: none; border-radius: 14px; font-size: 16px; font-weight: 800; cursor: pointer; text-align: center; transition: opacity .15s, transform .1s; }
        .lnd-btn:active { transform: scale(.98); }
        .lnd-btn-teal { background: #1D9E75; color: #fff; }
        .lnd-btn-white { background: #fff; color: #0f172a; }
        .lnd-btn-ghost { background: none; border: 1.5px solid rgba(255,255,255,.25); color: rgba(255,255,255,.8); }
        .lnd-input { width: 100%; padding: 14px 16px; border: 1.5px solid #E2E8F0; border-radius: 12px; font-size: 15px; font-weight: 600; background: #fff; color: #0f172a; outline: none; }
        .lnd-input:focus { border-color: #1D9E75; }
        .lnd-input.err { border-color: #E24B4A; }
        .lnd-err { font-size: 11px; font-weight: 700; color: #E24B4A; margin-top: 4px; }
        .lnd-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #64748B; margin-bottom: 5px; display: block; }
        .type-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 8px; background: #fff; border: 2px solid #E2E8F0; border-radius: 14px; cursor: pointer; transition: all .15s; }
        .type-btn.sel { border-color: #1D9E75; background: rgba(29,158,117,.06); }
        .type-btn .ico { font-size: 28px; }
        .type-btn .lbl { font-size: 11px; font-weight: 700; text-align: center; color: #0f172a; line-height: 1.3; }
        .progress { display: flex; gap: 4px; margin-bottom: 24px; }
        .progress-dot { flex: 1; height: 3px; border-radius: 2px; background: #E2E8F0; }
        .progress-dot.done { background: #1D9E75; }
      `}</style>

      {/* ── STEP 1 : Hero hook ── */}
      {step === 1 && (
        <div style={{ padding: '48px 24px 40px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
          {/* Logo */}
          <div style={{ fontWeight: 900, fontSize: 24, letterSpacing: '-.5px', marginBottom: 40 }}>
            Flow<span style={{ color: '#5DD4AC' }}>in</span>
          </div>

          {/* Questions hook */}
          <div style={{ flex: 1 }}>
            {HOOK_QUESTIONS.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 16, lineHeight: 1.5, color: 'rgba(255,255,255,.85)' }}>{q}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 32 }}>
            <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
              La solution tient en un clic.
            </div>
            <div style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,.5)', marginBottom: 20 }}>
              Gamification · CRM · Tombola
            </div>
            <button className="lnd-btn lnd-btn-teal" style={{ fontSize: 17 }} onClick={() => setStep(2)}>
              Je veux essayer →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 : Type de pro ── */}
      {step === 2 && (
        <div style={{ padding: '32px 20px' }}>
          <div className="progress">
            {[1,2,3].map(i => <div key={i} className={`progress-dot${i <= 1 ? ' done' : ''}`} />)}
          </div>
          <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Vous êtes…</div>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Sélectionnez votre activité</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {TYPE_PROS.map(t => (
              <button
                key={t.val}
                className={`type-btn${typePro === t.val ? ' sel' : ''}`}
                onClick={() => setTypePro(t.val)}
              >
                <span className="ico">{t.ico}</span>
                <span className="lbl">{t.label}</span>
              </button>
            ))}
          </div>

          <button
            className="lnd-btn lnd-btn-teal"
            onClick={() => typePro && setStep(3)}
            style={{ opacity: typePro ? 1 : 0.5 }}
          >
            Continuer →
          </button>
          <button className="lnd-btn" style={{ background: 'none', color: '#94A3B8', marginTop: 8, fontSize: 13 }} onClick={() => setStep(1)}>
            ← Retour
          </button>
        </div>
      )}

      {/* ── STEP 3 : Comment découvert ── */}
      {step === 3 && (
        <div style={{ padding: '32px 20px' }}>
          <div className="progress">
            {[1,2,3].map(i => <div key={i} className={`progress-dot${i <= 2 ? ' done' : ''}`} />)}
          </div>
          <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Comment vous avez découvert Flowin ?</div>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Pour mieux vous accompagner</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {DECOUVERTES.map(d => (
              <button
                key={d.val}
                onClick={() => setForm(p => ({ ...p, decouverte: d.val }))}
                style={{
                  padding: '14px 16px', borderRadius: 12,
                  border: `2px solid ${form.decouverte === d.val ? '#1D9E75' : '#E2E8F0'}`,
                  background: form.decouverte === d.val ? 'rgba(29,158,117,.06)' : '#fff',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'left',
                  color: '#0f172a',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <button
            className="lnd-btn lnd-btn-teal"
            onClick={() => form.decouverte && setStep(4)}
            style={{ opacity: form.decouverte ? 1 : 0.5 }}
          >
            Continuer →
          </button>
          <button className="lnd-btn" style={{ background: 'none', color: '#94A3B8', marginTop: 8, fontSize: 13 }} onClick={() => setStep(2)}>
            ← Retour
          </button>
        </div>
      )}

      {/* ── STEP 4 : Formulaire ── */}
      {step === 4 && (
        <div style={{ padding: '32px 20px' }}>
          <div className="progress">
            {[1,2,3].map(i => <div key={i} className={`progress-dot done`} />)}
          </div>
          <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Vos coordonnées</div>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
            On vous contacte rapidement pour une démo.
          </div>

          {errors.global && (
            <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#A32D2D', marginBottom: 16 }}>
              ⚠️ {errors.global}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {[
              { k: 'prenom', label: 'Prénom *', type: 'text', ph: 'Jean' },
              { k: 'nom', label: 'Nom *', type: 'text', ph: 'Dupont' },
              { k: 'email', label: 'Email *', type: 'email', ph: 'jean@restaurant.fr' },
              { k: 'tel', label: 'Téléphone *', type: 'tel', ph: '06 xx xx xx xx' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="lnd-label">{label}</label>
                <input
                  className={`lnd-input${errors[k] ? ' err' : ''}`}
                  type={type}
                  placeholder={ph}
                  value={form[k as keyof typeof form]}
                  onChange={ff(k as keyof typeof form)}
                  autoCapitalize={type === 'email' ? 'none' : 'words'}
                />
                {errors[k] && <div className="lnd-err">{errors[k]}</div>}
              </div>
            ))}
          </div>

          <button
            className="lnd-btn lnd-btn-teal"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ fontSize: 16, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Envoi en cours…' : '✓ Je veux une démo →'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 10, lineHeight: 1.5 }}>
            Pas de spam. Vos données restent confidentielles.
          </div>
        </div>
      )}

      {/* ── STEP 5 : Confirmation ── */}
      {step === 5 && (
        <div style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, minHeight: '100dvh', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: 72 }}>🎉</div>
          <div style={{ fontWeight: 900, fontSize: 24 }}>C&apos;est parti !</div>
          <div style={{ fontSize: 16, color: '#64748B', lineHeight: 1.6, maxWidth: 300 }}>
            Votre demande a été enregistrée.<br />
            Notre équipe vous contacte sous <strong>24h</strong> pour une démo personnalisée.
          </div>
          <div style={{ background: 'rgba(29,158,117,.08)', border: '1px solid rgba(29,158,117,.2)', borderRadius: 14, padding: '16px 24px', marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56' }}>
              ✅ Coordonnées enregistrées dans notre CRM<br />
              📅 Démo programmée sous 24h<br />
              🎁 Accès démo gratuite inclus
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
