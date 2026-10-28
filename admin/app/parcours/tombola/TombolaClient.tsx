'use client'

import { useState, useEffect } from 'react'
import { generateTicket } from '@/lib/ticket'
import { getJoueurLocal, claimJoueur, writeJoueur, RGPD_TEXT } from '@/lib/parcours'
import { NDS_JEU_POLICE } from '@/lib/parcours'
import ParcoursOutro from '../_components/ParcoursOutro'
import ParcoursChampsStandard from '@/components/parcours/ParcoursChampsStandard'
import { ParcoursPartenairesGrid, ParcoursPartenaireSheet } from '@/components/parcours/ParcoursPartenaires'
import { ParcoursHero, ParcoursPrizeCard, ParcoursHowTo, PARCOURS_HERO_CSS } from '@/components/parcours/ParcoursHero'
import type { GainImmediat } from '@/lib/parcours'
import type { FlowinEvent, FlowinLot, FlowinPartenaire } from '@/lib/types'
import { useParcoursTracking } from '@/lib/parcours-tracking'
import { resolveParcoursTheme } from '@/lib/parcoursTheme'

type Screen = 'landing' | 'form' | 'partenaires' | 'partSheet' | 'ticket' | 'already'

/* Étapes de l'écran "Comment jouer ?" (ParcoursHowTo) — propres au module. */
const TOMBOLA_STEPS = [
  { titre: 'Flashe le QR code', sous: 'À la station' },
  { titre: 'Inscris-toi au tirage', sous: 'Et tente ta chance' },
]

interface Props {
  ev: FlowinEvent | null
  lots: FlowinLot[]
  partenaires: FlowinPartenaire[]
  evId: string
}

export default function TombolaClient({ ev, lots, partenaires, evId }: Props) {
  const [screen, setScreen] = useState<Screen>('landing')
  /* Referentiel 8 : gain immediat attribue par la regle de l event. */
  const [gain, setGain] = useState<GainImmediat | null>(null)
  useParcoursTracking('tombola', evId, screen)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', tel: '', genre: '', age: '', cp: '', source: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState('')
  const [existingTicket, setExistingTicket] = useState('')
  const [partIdx, setPartIdx] = useState(0)

  const couleur = ev?.couleur ?? '#E8212B'
  const nom = ev?.nom ?? 'Tombola'
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const front = (cfg.front ?? {}) as Record<string, string>
  const badge = front.badge ?? ''
  const description = front.description ?? ''
  const tirageText = front.lotTirage ?? (cfg.tirageDate ? `\u{1F4C5} Tirage le ${cfg.tirageDate}` : '')
  const ctaText = front.ctaText ?? "Je m'inscris \u00e0 la tombola \u2192"
  const theme = resolveParcoursTheme('tombola', ev?.cfg)

  const lsKey = `flowin_played_${evId}`
  useEffect(() => {
    try {
      const saved = localStorage.getItem(lsKey)
      if (saved) { setExistingTicket(saved); setScreen('already') }
    } catch {}
  }, [lsKey])

  function fmtDate(d?: string | null) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  const d1 = fmtDate(ev?.date_d), d2 = fmtDate(ev?.date_f)
  const dates = d1 ? (d2 && d2 !== d1 ? `${d1} \u2192 ${d2}` : d1) : ''

  /* Bloc 2 — compte deja cree : saute le formulaire, attribue directement */
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
      const res = await claimJoueur(local, evId, 'TB')
      setGain(res.gain ?? null)
      try { localStorage.setItem(lsKey, res.ticket) } catch {}
      setExistingTicket(res.ticket)
      if (res.duplicate) { setScreen('already'); return }
      setTicket(res.ticket); setScreen('ticket')
    })()
  }, [screen, reco, evId, lsKey])

  async function handleSubmit() {
    const errs: Record<string, string> = {}
    if (!form.prenom.trim()) errs.prenom = 'Obligatoire'
    if (!form.nom.trim()) errs.nom = 'Obligatoire'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    if (form.tel.replace(/\s/g, '').length < 8) errs.tel = 'Invalide'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    const tc = generateTicket('TB')
    const res = await writeJoueur({
      email: form.email, prenom: form.prenom, nom: form.nom, tel: form.tel,
      code_postal: form.cp, genre: form.genre, age_tranche: form.age,
      decouverte: form.source.replace(/^[^ ]+ /, '') || undefined,
      events: [evId], ticket_code: tc, source: 'tombola', prefix: 'TB',
    })
    setGain(res.gain ?? null)
    setSubmitting(false)

    // Doublon : déjà inscrit en base -> écran "déjà joué"
    if (res.duplicate) {
      const t = res.ticket || ''
      try { localStorage.setItem(lsKey, t) } catch {}
      setExistingTicket(t); setScreen('already'); return
    }
    // Échec écriture distante : on n'enregistre pas en local (retry possible)
    if (!res.success) {
      if (res.error) console.error('[tombola] enregistrement Supabase échoué:', res.error)
      setErrors({ email: 'Enregistrement impossible, réessaie.' }); return
    }
    const finalTicket = res.ticket || tc
    try { localStorage.setItem(lsKey, finalTicket) } catch {}
    setTicket(finalTicket); setExistingTicket(finalTicket); setScreen('ticket')
  }

  const partSelected = partenaires[partIdx]
  const c = couleur


  /* Navigation postMessage — flèches dashboard SA */
  useEffect(() => {
    const NAV_SCREENS: Screen[] = ['landing', 'form', 'partenaires', 'ticket', 'already']
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
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: theme.bgImage ? `url(${theme.bgImage}) center/cover` : theme.bgColor, color: '#fff', fontFamily: NDS_JEU_POLICE }}>
      <style>{PARCOURS_HERO_CSS + `
        *{box-sizing:border-box;margin:0;padding:0}
        .part-tile-avatar{width:52px;height:52px;border-radius:12px;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;background:rgba(224,33,138,.18);color:#ffd5ec;object-fit:contain}
        .part-sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:50;display:flex;align-items:flex-end}
        .part-sheet{background:#1E293B;border-radius:20px 20px 0 0;padding:20px;width:100%;max-width:430px;margin:0 auto;max-height:80dvh;overflow-y:auto}
        .part-sheet-avatar{width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:28px;margin:0 auto 12px;overflow:hidden}
        .part-sheet-avatar img{width:100%;height:100%;object-fit:contain}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .screen{padding:20px;min-height:100dvh;display:flex;flex-direction:column}
        .btn-cta{width:100%;padding:16px;border:none;border-radius:50px;background:${c};color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit}
        .btn-ghost{background:none;border:1px solid rgba(255,255,255,.15);border-radius:12px;color:rgba(255,255,255,.55);font-size:13px;padding:10px;cursor:pointer;width:100%;font-family:inherit;margin-top:6px}
        .input{width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;font-size:15px;font-weight:600;outline:none;font-family:inherit}
        .input:focus{border-color:${c}} .input.err{border-color:#F87171}
        .label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-bottom:5px}
        .err-msg{font-size:11px;color:#F87171;margin-top:3px;font-weight:700}
        .source-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:600;color:rgba(255,255,255,.55);cursor:pointer;font-family:inherit}
        .source-chip.sel{background:rgba(224,33,138,.16);border-color:#E0218A;color:#fff}
        .gender-btn{flex:1;padding:10px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;font-weight:700;color:#fff;cursor:pointer;font-family:inherit;font-size:14px}
        .gender-btn.sel{background:rgba(224,33,138,.16);border-color:#E0218A;color:#fff}
        .lot-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
        .lot-row:last-child{border-bottom:none}
        .part-tile{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px;text-align:center;cursor:pointer}
        .link-btn{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;margin-bottom:8px}
        select.input option{background:#1E293B}
      `}</style>

      {/* LANDING */}
      {screen === 'landing' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
          <ParcoursHero module="tombola" nom={nom} badgeText={badge}
            emoji={(cfg.logoEmoji as string) || theme.logoEmoji} logoSvg={(cfg.logoSvg as string) || theme.logoSvg} logoUrl={theme.logoUrl}
            subtitle={[description, dates].filter(Boolean).join(' · ') || undefined} />
          <div className="pc-stage">
            <ParcoursPrizeCard lots={lots} />
            <ParcoursHowTo steps={TOMBOLA_STEPS} />
            <div style={{ flex: 1 }} />
            <div style={{ padding: '0 18px' }}>
              {tirageText && (
                <div style={{ background: 'rgba(124,45,146,.18)', border: '1px solid rgba(224,33,138,.3)', borderRadius: 10, padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.8)', marginBottom: 16 }}>
                  {tirageText}
                </div>
              )}
              <button className="btn-cta" onClick={() => setScreen('form')}>{ctaText}</button>
              <div style={{ fontSize: 10, textAlign: 'center', color: 'rgba(255,255,255,.3)', margin: '6px 0 8px' }}>Jeu gratuit · Sans achat obligatoire</div>
              {partenaires.length > 0 && (
                <button className="btn-ghost" onClick={() => setScreen('partenaires')}>Nos {partenaires.length} partenaires</button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, opacity: .6 }}>
                <img src="/nds/assets/flowin_blanc.png" alt="Flowin" style={{ height: 13, width: 'auto' }} />
                <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>Propulsé par Flowin</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMULAIRE */}
      {screen === 'form' && !getJoueurLocal() && (
        <div className="screen">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button className="btn-ghost" style={{ width: 34, height: 34, padding: 0, borderRadius: '50%', flexShrink: 0 }} onClick={() => setScreen('landing')}>←</button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>Crée ton compte</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>Pour {nom}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['prenom', 'Prénom *', 'given-name'], ['nom', 'Nom *', 'family-name']].map(([k, lbl, ac]) => (
              <div key={k}>
                <label className="label">{lbl}</label>
                <input className={`input${errors[k] ? ' err' : ''}`}
                  autoComplete={ac}
                  value={form[k as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                {errors[k] && <div className="err-msg">{errors[k]}</div>}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Email *</label>
            <input className={`input${errors.email ? ' err' : ''}`} type="email" inputMode="email" autoComplete="email" autoCapitalize="none"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            {errors.email && <div className="err-msg">{errors.email}</div>}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Téléphone *</label>
            <input className={`input${errors.tel ? ' err' : ''}`} type="tel" inputMode="tel" autoComplete="tel"
              value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} />
            {errors.tel && <div className="err-msg">{errors.tel}</div>}
          </div>
          <ParcoursChampsStandard form={form} setForm={setForm} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '12px 0 0', fontSize: 11, color: 'rgba(255,255,255,.45)', lineHeight: 1.5 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: c, flexShrink: 0 }} />
            <div>{RGPD_TEXT}</div>
          </div>
          <button className="btn-cta" style={{ marginTop: 20 }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Vérification…' : 'Valider mon inscription →'}
          </button>
        </div>
      )}

      {/* PARTENAIRES */}
      {screen === 'partenaires' && (
        <div className="screen">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button className="btn-ghost" style={{ width: 34, height: 34, padding: 0, borderRadius: '50%', flexShrink: 0 }} onClick={() => setScreen('landing')}>←</button>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Nos partenaires</div>
          </div>
          <ParcoursPartenairesGrid partenaires={partenaires} onSelect={i => { setPartIdx(i); setScreen('partSheet') }} />
          {existingTicket ? (
            <button className="btn-cta" style={{ background:'rgba(34,197,94,.15)',border:'2px solid #22C55E',color:'#4ADE80' }}
              onClick={() => setScreen('already')}>Déjà inscrit(e) · revoir mon ticket</button>
          ) : (
            <button className="btn-cta" onClick={() => setScreen('form')}>{ctaText}</button>
          )}
        </div>
      )}

      {/* BOTTOM SHEET PARTENAIRE */}
      {screen === 'partSheet' && partSelected && (
        <ParcoursPartenaireSheet p={partSelected} onClose={() => setScreen('partenaires')} />
      )}

      {/* TICKET */}
      {screen === 'ticket' && (
        <div className="screen" style={{ justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 100, padding: '4px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
              INSCRIPTION CONFIRMÉE
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Tu es dans la course !</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.55)' }}>Ton numéro de tombola a été enregistré</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16, borderTop: `4px solid ${c}` }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Ton ticket tombola</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.4)' }}>{nom}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: c, letterSpacing: '.1em', margin: '12px 0', fontFamily: 'monospace' }}>{ticket}</div>
            {tirageText && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{tirageText}</div>}
          </div>
          {partenaires.length > 0 && (
            <button className="btn-ghost" onClick={() => setScreen('partenaires')}>Découvrir nos partenaires</button>
          )}
          <ParcoursOutro superEventId={ev?.super_event_id} gain={gain} />
        </div>
      )}

      {/* DÉJÀ INSCRIT */}
      {screen === 'already' && (
        <div className="screen" style={{ justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Déjà inscrit !</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.55)' }}>Tu es déjà dans la course pour {nom}.</div>
          </div>
          {existingTicket && (
            <div style={{ background: 'rgba(255,255,255,.06)', border: `1.5px solid rgba(255,255,255,.15)`, borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16, borderTop: `4px solid ${c}` }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: c, letterSpacing: '.1em', fontFamily: 'monospace' }}>{existingTicket}</div>
              {tirageText && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 8 }}>{tirageText}</div>}
            </div>
          )}
          {partenaires.length > 0 && (
            <button className="btn-ghost" onClick={() => setScreen('partenaires')}>Découvrir nos partenaires</button>
          )}
          <ParcoursOutro superEventId={ev?.super_event_id} gain={gain} />
        </div>
      )}
    </div>
  )
}
