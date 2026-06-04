'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { generateTicket } from '@/lib/ticket'
import { getJoueurLocal, claimJoueur, attribuerSuperEvent, rememberJoueur } from '@/lib/parcours'
import ParcoursOutro from '../_components/ParcoursOutro'
import type { FlowinEvent, FlowinLot, FlowinPartenaire } from '@/lib/types'

type Screen = 'landing' | 'form' | 'partenaires' | 'partSheet' | 'ticket' | 'already'

const SOURCES = ['📸 Instagram', '🔵 Facebook', '📋 Affiche / Flyer', '📣 Bouche à oreille', '🌐 Autre']
const AGE_OPTIONS = [
  { val: '', label: 'Tranche d\'âge' },
  { val: '-18', label: 'Moins de 18 ans' },
  { val: '18-25', label: '18–25 ans' },
  { val: '26-35', label: '26–35 ans' },
  { val: '36-50', label: '36–50 ans' },
  { val: '51-65', label: '51–65 ans' },
  { val: '65+', label: '66 ans et plus' },
]

interface Props {
  ev: FlowinEvent | null
  lots: FlowinLot[]
  partenaires: FlowinPartenaire[]
  evId: string
}

export default function TombolaClient({ ev, lots, partenaires, evId }: Props) {
  const [screen, setScreen] = useState<Screen>('landing')
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
      if (local.prenom) setForm(f => ({ ...f, prenom: local.prenom as string }))
      const res = await claimJoueur(local, evId, 'TB')
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
    const emailLower = form.email.toLowerCase().trim()

    const { data: dup } = await supabase
      .from('joueurs').select('id,ticket_code')
      .eq('email_lower', emailLower).contains('events', [evId]).limit(1)

    if (dup?.length) {
      const d0 = dup[0] as { id?: string; ticket_code?: string }
      rememberJoueur(d0.id, emailLower, form.prenom)
      const t = d0.ticket_code ?? ''
      try { localStorage.setItem(lsKey, t) } catch {}
      setExistingTicket(t); setSubmitting(false); setScreen('already'); return
    }

    const tc = generateTicket('TB')
    const today = new Date().toISOString().slice(0, 10)
    const extId = `j-tb-${emailLower.replace(/[^a-z0-9]/g, '-').substring(0, 36)}`

    const { data: joueurRows } = await supabase.from('joueurs').upsert({
      external_id: extId, email: emailLower,
      prenom: form.prenom.trim(), nom: form.nom.trim(), tel: form.tel.trim(),
      code_postal: form.cp.trim() || null, genre: form.genre || null,
      age_tranche: form.age || null,
      decouverte: form.source.replace(/^[^ ]+ /, '') || null,
      optin: true, optin_date: today, first_seen: today, last_seen: today,
      events: [evId], ticket_code: tc, source: 'tombola',
    }, { onConflict: 'external_id' }).select('id')

    if (joueurRows?.length) {
      const joueurId = (joueurRows[0] as { id: string }).id
      await supabase.from('participations').insert({
        joueur_id: joueurId,
        event_id: evId,
        ticket_code: tc,
        score: 0,
        completed: true,
        tickets: 1,
      })
      await attribuerSuperEvent(joueurId, evId, today)
      rememberJoueur(joueurId, emailLower, form.prenom)
    }

    try { localStorage.setItem(lsKey, tc) } catch {}
    setTicket(tc); setExistingTicket(tc); setSubmitting(false); setScreen('ticket')
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
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: '#0F172A', color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .screen{padding:20px;min-height:100dvh;display:flex;flex-direction:column}
        .btn-cta{width:100%;padding:16px;border:none;border-radius:50px;background:${c};color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit}
        .btn-ghost{background:none;border:1px solid rgba(255,255,255,.15);border-radius:12px;color:rgba(255,255,255,.55);font-size:13px;padding:10px;cursor:pointer;width:100%;font-family:inherit;margin-top:6px}
        .input{width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;font-size:15px;font-weight:600;outline:none;font-family:inherit}
        .input:focus{border-color:${c}} .input.err{border-color:#F87171}
        .label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-bottom:5px}
        .err-msg{font-size:11px;color:#F87171;margin-top:3px;font-weight:700}
        .source-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:600;color:rgba(255,255,255,.55);cursor:pointer;font-family:inherit}
        .source-chip.sel{background:rgba(168,85,247,.15);border-color:#7C2D92;color:#C4B5FD}
        .gender-btn{flex:1;padding:10px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;font-weight:700;color:#fff;cursor:pointer;font-family:inherit;font-size:14px}
        .gender-btn.sel{background:rgba(168,85,247,.15);border-color:#7C2D92;color:#C4B5FD}
        .lot-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
        .lot-row:last-child{border-bottom:none}
        .part-tile{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px;text-align:center;cursor:pointer}
        .link-btn{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;margin-bottom:8px}
        select.input option{background:#1E293B}
      `}</style>

      {/* LANDING */}
      {screen === 'landing' && (
        <div className="screen" style={{ paddingTop: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            {badge && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 100, padding: '5px 14px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>
                ❤️ {badge}
              </div>
            )}
            <svg viewBox="0 0 100 100" width={84} height={84} style={{ display: 'block', margin: '0 auto 14px', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.4))' }}>
              <circle cx="50" cy="50" r="50" fill="#fff" />
              <rect x="38" y="16" width="24" height="68" rx="5" fill={c} />
              <rect x="16" y="38" width="68" height="24" rx="5" fill={c} />
            </svg>
            <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>{nom}</div>
            {description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: 10, padding: '0 8px' }}>{description}</div>}
            {dates && <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 16 }}>{dates}</div>}
          </div>
          {lots.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, marginBottom: 14 }}>
              {lots.slice(0, 5).map((l, i) => {
                const ranks = ['🥇', '🥈', '🥉', '🎁', '🎁']
                return (
                  <div key={l.id} className="lot-row">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(168,85,247,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {l.emoji || ranks[i] || '🎁'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{l.titre || l.nom}</div>
                      {l.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{l.description}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {tirageText && (
            <div style={{ background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.25)', borderRadius: 10, padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.8)', marginBottom: 16 }}>
              {tirageText}
            </div>
          )}
          <button className="btn-cta" onClick={() => setScreen('form')}>{ctaText}</button>
          <div style={{ fontSize: 10, textAlign: 'center', color: 'rgba(255,255,255,.3)', margin: '6px 0 8px' }}>Jeu gratuit · Sans achat obligatoire</div>
          {partenaires.length > 0 && (
            <button className="btn-ghost" onClick={() => setScreen('partenaires')}>🤝 Nos {partenaires.length} partenaires</button>
          )}
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
            <label className="label">Genre</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['👩 Femme', '👨 Homme'].map(g => (
                <button key={g} className={`gender-btn${form.genre === g ? ' sel' : ''}`} onClick={() => setForm(f => ({ ...f, genre: g }))}>{g}</button>
              ))}
            </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label className="label">Tranche d&apos;âge</label>
              <select className="input" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}>
                {AGE_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Code postal</label>
              <input className="input" inputMode="numeric" autoComplete="postal-code" value={form.cp} onChange={e => setForm(f => ({ ...f, cp: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Comment nous avez-vous connu ?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {SOURCES.map(s => (
                <button key={s} className={`source-chip${form.source === s ? ' sel' : ''}`} onClick={() => setForm(f => ({ ...f, source: s }))}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '12px 0 0', fontSize: 11, color: 'rgba(255,255,255,.45)', lineHeight: 1.5 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>✓</div>
            <div>J&apos;accepte de participer à cette tombola et d&apos;être recontacté(e) par les organisateurs. Données jamais cédées à des tiers.</div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {partenaires.map((p, i) => (
              <div key={p.id} className="part-tile" onClick={() => { setPartIdx(i); setScreen('partSheet') }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.nom} style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8, marginBottom: 6, display: 'block', margin: '0 auto 6px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  : <div style={{ fontSize: 32, marginBottom: 6 }}>{p.emoji || '🤝'}</div>
                }
                <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>{p.nom}</div>
              </div>
            ))}
          </div>
          {existingTicket ? (
            <button className="btn-cta" style={{ background:'rgba(34,197,94,.15)',border:'2px solid #22C55E',color:'#4ADE80' }}
              onClick={() => setScreen('already')}>✅ Déjà inscrit(e) · revoir mon ticket</button>
          ) : (
            <button className="btn-cta" onClick={() => setScreen('form')}>{ctaText}</button>
          )}
        </div>
      )}

      {/* BOTTOM SHEET PARTENAIRE */}
      {screen === 'partSheet' && partSelected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 10, display: 'flex', alignItems: 'flex-end' }} onClick={() => setScreen('partenaires')}>
          <div style={{ background: '#1E293B', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 430, margin: '0 auto', maxHeight: '70dvh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 12px' }}>
              {partSelected.image_url ? <img src={partSelected.image_url} alt={partSelected.nom} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} /> : partSelected.emoji || '🤝'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, textAlign: 'center', marginBottom: 4 }}>{partSelected.nom}</div>
            {partSelected.description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', textAlign: 'center', lineHeight: 1.5, marginBottom: 12 }}>{partSelected.description}</div>}
            {partSelected.promo_text && (
              <div style={{ background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C4B5FD', marginBottom: 12, textAlign: 'center' }}>
                🎁 {partSelected.promo_text}
              </div>
            )}
            {(partSelected.site_web || partSelected.url) && (
              <a href={partSelected.site_web ?? partSelected.url!} target="_blank" rel="noopener" className="link-btn">🌐 <span>Site web</span></a>
            )}
            {partSelected.instagram && (
              <a href={partSelected.instagram.startsWith('http') ? partSelected.instagram : `https://instagram.com/${partSelected.instagram.replace('@', '')}`} target="_blank" rel="noopener" className="link-btn">📸 <span>Instagram</span></a>
            )}
            {partSelected.facebook && (
              <a href={partSelected.facebook.startsWith('http') ? partSelected.facebook : `https://facebook.com/${partSelected.facebook}`} target="_blank" rel="noopener" className="link-btn">🔵 <span>Facebook</span></a>
            )}
            <button className="btn-ghost" onClick={() => setScreen('partenaires')}>← Retour</button>
          </div>
        </div>
      )}

      {/* TICKET */}
      {screen === 'ticket' && (
        <div className="screen" style={{ justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 100, padding: '4px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
              INSCRIPTION CONFIRMÉE
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Tu es dans la course ! 🎉</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.55)' }}>Ton numéro de tombola a été enregistré</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16, borderTop: `4px solid ${c}` }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎟️</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Ton ticket tombola</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.4)' }}>{nom}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: c, letterSpacing: '.1em', margin: '12px 0', fontFamily: 'monospace' }}>{ticket}</div>
            {tirageText && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{tirageText}</div>}
          </div>
          {partenaires.length > 0 && (
            <button className="btn-ghost" onClick={() => setScreen('partenaires')}>🤝 Découvrir nos partenaires</button>
          )}
          <ParcoursOutro superEventId={ev?.super_event_id} />
        </div>
      )}

      {/* DÉJÀ INSCRIT */}
      {screen === 'already' && (
        <div className="screen" style={{ justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Déjà inscrit !</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.55)' }}>Tu es déjà dans la course pour {nom}.</div>
          </div>
          {existingTicket && (
            <div style={{ background: 'rgba(255,255,255,.06)', border: `1.5px solid rgba(255,255,255,.15)`, borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16, borderTop: `4px solid ${c}` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎟️</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: c, letterSpacing: '.1em', fontFamily: 'monospace' }}>{existingTicket}</div>
              {tirageText && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 8 }}>{tirageText}</div>}
            </div>
          )}
          {partenaires.length > 0 && (
            <button className="btn-ghost" onClick={() => setScreen('partenaires')}>🤝 Découvrir nos partenaires</button>
          )}
          <ParcoursOutro superEventId={ev?.super_event_id} />
        </div>
      )}
    </div>
  )
}
