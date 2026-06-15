'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { writeJoueur, claimJoueur, getJoueurLocal, shuffle, AGE_OPTIONS } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import { NDS_CSS, NDS_SPRITE } from '@/lib/nds2026Design'
import type { ParcoursPageData, QuizQuestion, BonusQuestion } from '@/lib/parcours'

type Screen = 'onboard' | 'inscription' | 'quiz' | 'resultats' | 'bonus' | 'final' | 'tickets' | 'carte' | 'partenaires' | 'profil'
interface Props extends ParcoursPageData { evId: string }

const SRC = ['Instagram', 'Affiche', 'Bouche à oreille', 'Autre']

/* Consentement RGPD — versionné pour traçabilité de la preuve de consentement.
   Incrémenter la version à chaque modification du texte. */
const OPTIN_VERSION = 'nds-2026-v2'
const OPTIN_TEXT = "J'accepte de garder le contact avec les Nuits du Sud et partenaires."

/* Les 3 stations fixes du festival (carte). joue=true => station courante scannée */
const STATIONS = [
  { id: 'ev-nds-caisses', nom: 'Les Caisses', ou: "À l'entrée, près de la billetterie", icon: 'i-ticket', lat: 43.72325, lng: 7.11120 },
  { id: 'ev-nds-bar',     nom: 'Le Bar',      ou: 'Au bar des Nuits du Sud',          icon: 'i-glass', lat: 43.72372, lng: 7.11205 },
  { id: 'ev-nds-ecrans',  nom: "L'Écran",     ou: "Sur l'écran géant, entre deux concerts", icon: 'i-monitor', lat: 43.72405, lng: 7.11158 },
]

export default function NDS2026Client({ ev, lots, partenaires, banques, evId }: Props) {
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const nom = ev?.nom ?? 'Nuits du Sud'
  const allQs = banques.flatMap(b => b.questions ?? [])
  const customQs = (cfg.customQuestions ?? []) as QuizQuestion[]
  const nbQ = (cfg.quizNbQuestions as number) ?? 4
  const timerSec = (cfg.quizTimer as number) || 20
  const bonusQs = (cfg.quizBonusList ?? []) as BonusQuestion[]

  const [questions] = useState<QuizQuestion[]>(() => shuffle([...allQs, ...customQs]).slice(0, nbQ))
  const [screen, setScreen] = useState<Screen>('onboard')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(timerSec)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', tel: '', age: '', cp: '', source: '', optin: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ticket, setTicket] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bonusAnswers, setBonusAnswers] = useState<Record<string, string | string[]>>({})
  const [bonusIdx, setBonusIdx] = useState(0)
  const [bonusDone, setBonusDone] = useState(false)
  const [sheetPart, setSheetPart] = useState<number | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapObjRef = useRef<unknown>(null)
  const [recurrent, setRecurrent] = useState<{ id: string; email: string; prenom?: string } | null>(null)
  const [ticketCount, setTicketCount] = useState(1)

  const lsKey = `flowin_played_${evId}`

  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s) { setTicket(s); setSaved(true) } } catch {}
    // Profil déjà enregistré (autre station / session précédente) -> mode récurrent
    const prof = getJoueurLocal()
    if (prof) {
      setRecurrent(prof)
      setForm(f => ({ ...f,
        prenom: prof.prenom || f.prenom, nom: prof.nom || f.nom,
        email: prof.email || f.email, tel: prof.tel || f.tel,
        cp: prof.cp || f.cp, age: prof.age || f.age }))
    }
    // Cumul de tickets : nombre de stations NDS déjà jouées (1 ticket / station / jour)
    try {
      let n = 0
      STATIONS.forEach(st => { if (localStorage.getItem(`flowin_played_${st.id}`)) n++ })
      setTicketCount(Math.max(1, n))
    } catch {}
  }, [lsKey])

  useEffect(() => {
    if (screen !== 'quiz' || answered) return
    setTimer(timerSec)
    const iv = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(iv); handleAnswer(-1); return 0 } return t - 1 }), 1000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, qIdx])

  // Carte Leaflet : chargée à la demande quand on arrive sur l'écran carte
  useEffect(() => {
    if (screen !== 'carte') return
    let cancelled = false

    function ensureLeaflet(): Promise<unknown> {
      const w = window as unknown as { L?: unknown }
      if (w.L) return Promise.resolve(w.L)
      return new Promise((resolve, reject) => {
        // CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }
        // JS
        const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null
        if (existing) { existing.addEventListener('load', () => resolve((window as unknown as { L: unknown }).L)); return }
        const s = document.createElement('script')
        s.id = 'leaflet-js'
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        s.onload = () => resolve((window as unknown as { L: unknown }).L)
        s.onerror = reject
        document.head.appendChild(s)
      })
    }

    ensureLeaflet().then((L) => {
      if (cancelled || !mapRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const LL = L as any
      // Si une map existe déjà sur ce node, on la détruit (re-entrée écran)
      if (mapObjRef.current) { try { (mapObjRef.current as { remove: () => void }).remove() } catch {} mapObjRef.current = null }

      const center: [number, number] = [43.72367, 7.11161]
      const map = LL.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(center, 17)
      mapObjRef.current = map
      LL.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      STATIONS.forEach(st => {
        const cur = st.id === evId
        const html = `<div style="width:34px;height:34px;border-radius:50%;background:${cur ? '#16a34a' : 'linear-gradient(135deg,#7C2D92,#E0218A)'};border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px">${cur ? '★' : ''}</div>`
        const icon = LL.divIcon({ html, className: '', iconSize: [34, 34], iconAnchor: [17, 17] })
        LL.marker([st.lat, st.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${st.nom}</b><br>${st.ou}${cur ? '<br><b style="color:#16a34a">Tu es ici</b>' : ''}`)
      })
      setTimeout(() => { try { map.invalidateSize() } catch {} }, 120)
    }).catch(() => { /* CDN bloqué : la liste de stations reste affichée en fallback */ })

    return () => {
      cancelled = true
      if (mapObjRef.current) { try { (mapObjRef.current as { remove: () => void }).remove() } catch {} mapObjRef.current = null }
    }
  }, [screen, evId])

  const handleAnswer = useCallback((idx: number) => {
    if (answered) return
    setSelected(idx); setAnswered(true)
    const cur = questions[qIdx]
    if (cur && idx === cur.bonne) setScore(s => s + 1)
    setTimeout(() => {
      if (qIdx + 1 < questions.length) { setQIdx(i => i + 1); setSelected(null); setAnswered(false) }
      else setScreen('resultats')
    }, 1100)
  }, [answered, qIdx, questions])

  async function submitInscription() {
    const errs: Record<string, string> = {}
    if (!form.prenom.trim()) errs.prenom = 'Requis'
    if (!form.nom.trim()) errs.nom = 'Requis'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    if (!form.optin) errs.optin = 'Merci de cocher cette case pour continuer'
    setErrors(errs)
    if (Object.keys(errs).length) return
    await persist()
    setScreen('final')
  }

  async function persist(): Promise<string> {
    if (saved) return ticket
    setSaving(true)
    const tc = generateTicket('ND')
    // Marquage "joué" en local IMMEDIATEMENT (avant tout appel réseau) : c'est ce qui
    // empêche de rejouer la même station, même si Supabase est lent ou injoignable.
    setTicket(tc)
    setSaved(true)
    try {
      localStorage.setItem(lsKey, tc)
      let n = 0
      STATIONS.forEach(st => { if (localStorage.getItem(`flowin_played_${st.id}`)) n++ })
      setTicketCount(Math.max(1, n))
    } catch {}

    const res = recurrent
      ? await claimJoueur(recurrent, evId, 'ND', bonusAnswers)
      : await writeJoueur({
          email: form.email, prenom: form.prenom, nom: form.nom, tel: form.tel,
          code_postal: form.cp, age_tranche: form.age, decouverte: form.source || undefined,
          score_moy: `${score}/${questions.length}`, events: [evId], ticket_code: tc,
          source: 'nds2026', prefix: 'ND', bonus_reponses: bonusAnswers,
          optin: form.optin, optin_version: OPTIN_VERSION,
        })
    setSaving(false)
    // Si Supabase a renvoyé un ticket (ex. doublon avec code existant), on l'aligne
    const finalTicket = res.ticket || tc
    if (finalTicket !== tc) {
      setTicket(finalTicket)
      try { localStorage.setItem(lsKey, finalTicket) } catch {}
    }
    if (!res.success && !res.duplicate && res.error) {
      console.error('[nds2026] enregistrement Supabase échoué (jeu marqué joué en local):', res.error)
    }
    return finalTicket
  }

  async function finaliser() {
    // Profil déjà connu (récurrent) -> on enregistre directement, sinon on demande le profil
    if (recurrent) { await persist(); setScreen('final') }
    else setScreen('inscription')
  }

  async function finishBonus() {
    setBonusDone(true)
    if (recurrent) { await persist(); setScreen('final') }
    else setScreen('inscription')
  }

  const q = questions[qIdx]
  const navOn = screen === 'final' || screen === 'tickets' || screen === 'carte' || screen === 'partenaires' || screen === 'profil' || (screen === 'onboard' && saved)

  function setSource(s: string) { setForm(f => ({ ...f, source: s })) }
  function nb(target: Screen) { setSheetPart(null); setScreen(target) }

  return (
    <div className="ndsbody">
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');" + NDS_CSS + `
        .ndsbody{width:100%;min-height:100vh;min-height:100dvh;display:block;background:#160820;font-family:'Manrope',system-ui,sans-serif;color:#fff;padding:0}
        .ndsbody .phone{width:100%;max-width:480px;margin:0 auto;min-height:100vh;min-height:100dvh;background:#160820;position:relative;display:flex;flex-direction:column;overflow:hidden}
        .ndsbody .scr{position:static !important;inset:auto !important;display:flex !important;flex-direction:column;flex:1;min-height:0;width:100%}
        .ndsbody .scr>.stage{flex:1 0 auto;display:flex;flex-direction:column;justify-content:center}
        .ndsbody .scr#carteScr,.ndsbody .scr.carte{position:relative !important;min-height:70vh;width:100%}
        .ndsbody .padnav{padding-bottom:96px}
        .ndsbody .nav{position:sticky;bottom:0}
        .ndsbody .map-fake{flex:1;width:100%;min-height:340px;background:linear-gradient(160deg,#241233,#3a1450);position:relative}
        .ndsbody .map-real{position:absolute;inset:0;width:100%;height:100%;z-index:1}
        .ndsbody .map-list{position:absolute;left:14px;right:14px;bottom:96px;z-index:600;display:flex;flex-direction:column;gap:10px}
        .ndsbody .stn{display:flex;align-items:center;gap:13px;background:#fff;color:#1a1020;border-radius:16px;padding:13px 15px;box-shadow:0 6px 22px rgba(20,26,38,.22);cursor:pointer;border:none;text-align:left;width:100%;font-family:inherit;transition:transform .12s}
        .ndsbody .stn:active{transform:scale(.98)}
        .ndsbody .stn.cur{outline:2px solid var(--magenta)}
        .ndsbody .stn .go{margin-left:auto;flex-shrink:0;color:var(--magenta)}
        .ndsbody .stn .go .ic{width:18px;height:18px}
        .ndsbody .stn .em{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--purple),var(--magenta));display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
        .ndsbody .stn .em .ic{width:22px;height:22px}
        .ndsbody .stn .nm{font-weight:800;font-size:15px}
        .ndsbody .stn .ou{font-size:12px;color:#6b6076;margin-top:1px}
        .ndsbody .stn .tg{margin-left:auto;font-size:11px;font-weight:800;padding:4px 9px;border-radius:100px;flex-shrink:0}
        .ndsbody .pt-sheet2{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:480px;z-index:1000;background:#fff;color:#1a1020;border-radius:22px 22px 0 0;padding:22px 20px 30px;box-shadow:0 -8px 40px rgba(0,0,0,.3)}
        .ndsbody .pt-dim2{position:fixed;inset:0;background:rgba(10,4,16,.55);z-index:999}
        .ndsbody .sh-row{display:flex;align-items:center;gap:9px;margin-top:10px;text-decoration:none;color:var(--purple);font-weight:700;font-size:14px}
        .ndsbody .opt.correct{border-color:#16a34a !important;background:rgba(22,163,74,.18) !important;color:#fff}
        .ndsbody .opt.wrong{border-color:#ef4444 !important;background:rgba(239,68,68,.18) !important;color:#fff}
        .ndsbody .opt.correct::after{content:'✓';float:right;font-weight:800;color:#4ade80}
        .ndsbody .opt.wrong::after{content:'✕';float:right;font-weight:800;color:#f87171}
        .ndsbody .qexpl{margin-top:4px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.5;color:rgba(255,255,255,.9)}
        .ndsbody .qexpl b{color:#4ade80}
      ` }} />
      <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: NDS_SPRITE }} />

      <div className="phone">
        {screen === 'onboard' && (
          <section className={`scr on${saved ? ' padnav' : ''}`}>
            <div className="hero">
              <div className="htop"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ verticalAlign: -1, marginRight: 5 }}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" /></svg>VENCE</div>
              <img className="hlogo" src="/nds/logo_nds_blanc_hd.png" alt="Nuits du Sud" />
              <div className="hdate">9 → 18 Juillet 2026</div>
            </div>
            <div className="stage">
              <div className="prize">
                <div className="lbl">À gagner chaque soir</div>
                <div className="prow">
                  <span className="sq" style={{ background: 'linear-gradient(135deg,#E0218A,#8E2E9E)' }}><svg className="ic"><use href="#i-ticket" /></svg></span>
                  <div><div className="nm">3 places offertes</div><div className="vl">Pour ton prochain concert</div></div>
                </div>
                <div className="div" />
                <div className="tir"><span className="dot" /> Tirage au sort chaque soir du festival</div>
              </div>
              {saved ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(22,163,74,.16)', border: '1px solid rgba(22,163,74,.4)', borderRadius: 14, padding: '14px 15px', marginBottom: 14, fontSize: 14, fontWeight: 600 }}>
                    <svg className="ic" style={{ width: 20, height: 20, color: '#4ade80', flexShrink: 0 }}><use href="#i-checkc" /></svg>
                    <span>Station validée ! Tu as <b>{ticketCount} ticket{ticketCount > 1 ? 's' : ''}</b> pour le tirage de ce soir.</span>
                  </div>
                  {ticketCount < STATIONS.length ? (
                    <>
                      <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '14px 15px', marginBottom: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                          <svg className="ic" style={{ width: 16, height: 16, color: 'var(--magenta)' }}><use href="#i-layers" /></svg>
                          Chaque station = 1 ticket de plus
                        </div>
                        {STATIONS.filter(s => { try { return !localStorage.getItem(`flowin_played_${s.id}`) } catch { return s.id !== evId } }).map(s => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'rgba(255,255,255,.8)', padding: '5px 0' }}>
                            <span style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,var(--purple),var(--magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg className="ic" style={{ width: 14, height: 14, color: '#fff' }}><use href={`#${s.icon}`} /></svg></span>
                            <span><b>{s.nom}</b> — à jouer</span>
                          </div>
                        ))}
                      </div>
                      <a className="btn" onClick={() => setScreen('carte')}><svg className="ic" style={{ width: 18, height: 18, marginRight: 7, verticalAlign: -3 }}><use href="#i-map" /></svg>Gagner d&apos;autres tickets</a>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(224,33,138,.14)', border: '1px solid rgba(224,33,138,.4)', borderRadius: 14, padding: '14px 15px', marginBottom: 14, fontSize: 14, fontWeight: 600 }}>
                      <svg className="ic" style={{ width: 20, height: 20, color: 'var(--magenta)', flexShrink: 0 }}><use href="#i-ticket" /></svg>
                      <span>Toutes les stations jouées ! Tu as le <b>maximum de tickets</b> pour ce soir. Bonne chance au tirage 🎉</span>
                    </div>
                  )}
                  <a className="reslink" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: 'rgba(255,255,255,.85)', fontWeight: 700, cursor: 'pointer' }} onClick={() => setScreen('tickets')}>Voir mes tickets</a>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Bienvenue au Super Event</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '15px 16px', marginBottom: 14 }}>
                    {[
                      { ic: 'i-help', t: 'Réponds au Quizz', s: 'Remporte 1 ticket' },
                      { ic: 'i-layers', t: '3 lieux, 3 quizz', s: '3 fois plus de chance de gagner !' },
                      { ic: 'i-scan', t: 'Flashe le QR code', s: 'Remporte le lot' },
                      { ic: 'i-clock', t: 'Tirage chaque soir', s: '3 places à gagner' },
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 0' }}>
                        <span style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,var(--purple),var(--magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg className="ic" style={{ width: 17, height: 17, color: '#fff' }}><use href={`#${step.ic}`} /></svg></span>
                        <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,.9)', lineHeight: 1.3 }}><b style={{ color: '#fff' }}>{step.t}</b><br /><span style={{ fontSize: 12.5, opacity: .8 }}>{step.s}</span></span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 7, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                      {STATIONS.map(s => (
                        <span key={s.id} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.85)', background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '7px 4px' }}>{s.nom}</span>
                      ))}
                    </div>
                  </div>
                  <a className="btn" onClick={() => {
                    setScreen(questions.length > 0 ? 'quiz' : 'resultats')
                  }}>{recurrent ? `Rejouer${recurrent.prenom ? ', ' + recurrent.prenom : ''} →` : 'Je joue maintenant'}</a>
                  <div className="foot">En participant, tu acceptes notre politique de confidentialité.</div>
                </>
              )}
            </div>
          </section>
        )}

        {screen === 'inscription' && (
          <section className="scr purple on">
            <div className="pad">
              <div className="dhead">
                <div className="back" onClick={() => setScreen('resultats')}><svg className="ic"><use href="#i-arrowl" /></svg></div>
                <div><div className="dtitle">Dernière étape !</div><div className="dsub">Tes infos pour valider ton ticket et recevoir tes gains</div></div>
              </div>
              <div className="grid2" style={{ marginBottom: 12 }}>
                <div><label className="label">Prénom</label><input className="input" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />{errors.prenom && <div className="err">{errors.prenom}</div>}</div>
                <div><label className="label">Nom</label><input className="input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />{errors.nom && <div className="err">{errors.nom}</div>}</div>
              </div>
              <div style={{ marginBottom: 12 }}><label className="label">Email</label><input className="input" type="email" inputMode="email" autoCapitalize="none" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />{errors.email && <div className="err">{errors.email}</div>}</div>
              <div style={{ marginBottom: 12 }}><label className="label">Téléphone</label><input className="input" type="tel" inputMode="tel" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} /></div>
              <div className="grid2" style={{ marginBottom: 12 }}>
                <div><label className="label">Tranche d&apos;âge</label><select className="input" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}>{AGE_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}</select></div>
                <div><label className="label">Code postal</label><input className="input" inputMode="numeric" placeholder="—" value={form.cp} onChange={e => setForm(f => ({ ...f, cp: e.target.value }))} /></div>
              </div>
              <div><label className="label">Tu as connu le festival par…</label>
                <div className="chips">{SRC.map(s => <span key={s} className={`chip${form.source === s ? ' sel' : ''}`} onClick={() => setSource(s)}>{s}</span>)}</div>
              </div>
              <div className={`rgpd rgpd-check${form.optin ? ' on' : ''}`} onClick={() => setForm(f => ({ ...f, optin: !f.optin }))} role="checkbox" aria-checked={form.optin} tabIndex={0}>
                <span className="rc">{form.optin && <svg className="ic"><use href="#i-check" /></svg>}</span>
                <div>{OPTIN_TEXT}</div>
              </div>
              {errors.optin && <div className="err">{errors.optin}</div>}
              <a className="btn" onClick={submitInscription}>{saving ? 'Enregistrement…' : 'Valider mon ticket →'}</a>
            </div>
          </section>
        )}

        {screen === 'quiz' && q && (
          <section className="scr purple on">
            <div className="pad">
              <div className="dhead">
                <div className="back" onClick={() => setScreen('onboard')}><svg className="ic"><use href="#i-arrowl" /></svg></div>
                <div style={{ flex: 1 }}><div className="dtitle">{nom}</div><div className="dsub">Quiz · {qIdx + 1} / {questions.length}</div></div>
                <div style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 15, color: '#fff', background: timer <= 5 ? 'rgba(239,68,68,.35)' : 'rgba(255,255,255,.18)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{timer}</div>
              </div>
              <div className="progress">{questions.map((_, k) => <div key={k} className={`pstep${k <= qIdx ? ' on' : ''}`} />)}</div>
              <div className="qcard">
                <div className="qtxt">{q.texte}</div>
                {q.options.map((opt, i) => {
                  let cls = 'opt'
                  if (answered) { if (i === q.bonne) cls = 'opt correct'; else if (i === selected) cls = 'opt wrong' }
                  else if (i === selected) cls = 'opt sel'
                  return <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={answered}>{opt}</button>
                })}
                {answered && (
                  <div className="qexpl">
                    {selected === q.bonne ? <b>Bonne réponse ✓</b> : <span>Bonne réponse : <b>{q.options[q.bonne]}</b></span>}
                    {q.explication && <div style={{ marginTop: 6 }}>{q.explication}</div>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {screen === 'resultats' && (
          <section className="scr on" style={{ background: '#fff' }}>
            <div className="res-head">
              <div className="res-ico"><svg className="ic"><use href="#i-trophy" /></svg></div>
              <div className="res-bravo disp">Bravo !</div>
              <div className="res-sub">Participation enregistrée pour le tirage</div>
            </div>
            <div className="res-body">
              <div className="score-card">
                <div className="score disp">{score}/{questions.length}</div>
                <div className="score-line">Bien joué&#8239;!</div>
              </div>
              {bonusQs.length > 0 && !bonusDone && <a className="double" onClick={() => { setBonusIdx(0); setScreen('bonus') }}><svg className="ic"><use href="#i-spark" /></svg> Double tes chances</a>}
              <div className="infocard b-magenta"><svg className="ic"><use href="#i-gift" /></svg><div>Lot : <b>3 places pour ton prochain concert</b></div></div>
              <div className="infocard b-green"><svg className="ic"><use href="#i-checkc" /></svg><div>Participation enregistrée&#8239;!</div></div>
              <a className="btn" style={{ marginTop: 10 }} onClick={finaliser}>{saving ? 'Enregistrement…' : (recurrent ? 'Voir mon ticket →' : 'Valider et recevoir mon ticket →')}</a>
            </div>
          </section>
        )}

        {screen === 'bonus' && bonusQs[bonusIdx] && (
          <section className="scr purple on">
            <div className="pad">
              <div className="dhead"><div className="back" onClick={() => setScreen('resultats')}><svg className="ic"><use href="#i-arrowl" /></svg></div><div style={{ flex: 1 }}><div className="dtitle">Bonus</div><div className="dsub">{bonusIdx + 1} / {bonusQs.length} · double tes chances</div></div><div className="reslink" style={{ padding: 0, margin: 0 }} onClick={finishBonus}>Passer</div></div>
              <div className="qcard">
                <div className="qtxt">{bonusQs[bonusIdx].label}</div>
                {bonusQs[bonusIdx].options.map(opt => {
                  const bq = bonusQs[bonusIdx]
                  const ans = bonusAnswers[bq.id]
                  const isSel = Array.isArray(ans) ? ans.includes(opt.val) : ans === opt.val
                  return <button key={opt.val} className={`opt${isSel ? ' sel' : ''}`} onClick={() => setBonusAnswers(a => bq.type === 'multi'
                    ? { ...a, [bq.id]: ((a[bq.id] as string[] | undefined) ?? []).includes(opt.val) ? (a[bq.id] as string[]).filter(v => v !== opt.val) : [...((a[bq.id] as string[] | undefined) ?? []), opt.val] }
                    : { ...a, [bq.id]: opt.val })}>{opt.label}</button>
                })}
              </div>
              <a className="btn" onClick={() => bonusIdx + 1 < bonusQs.length ? setBonusIdx(i => i + 1) : finishBonus()}>{bonusIdx + 1 < bonusQs.length ? 'Suivant →' : (saving ? 'Enregistrement…' : 'Terminer →')}</a>
            </div>
          </section>
        )}

        {screen === 'final' && (
          <section className="scr on" style={{ background: '#fff' }}>
            <div className="res-head">
              <div className="res-ico"><svg className="ic"><use href="#i-checkc" /></svg></div>
              <div className="res-bravo disp">C&apos;est validé !</div>
              <div className="res-sub">Participation enregistrée pour le tirage</div>
            </div>
            <div className="res-body padnav">
              <div className="res-eyebrow">Joue les autres stations ce soir</div>
              <div className="nextcard">
                {STATIONS.filter(s => s.id !== evId).map(s => (
                  <div className="nextline" key={s.id}><span className="em"><svg className="ic"><use href={`#${s.icon}`} /></svg></span><div><div className="nm">{s.nom}</div><div className="ou">{s.ou}</div></div></div>
                ))}
              </div>
              <div className="bnote" style={{ margin: '6px 4px 16px', textAlign: 'left' }}>Chaque station jouée = 1 ticket de plus pour le tirage de 12h30.</div>
              <a className="double" onClick={() => setScreen('carte')}><svg className="ic"><use href="#i-map" /></svg> Carte &amp; autres stations</a>
              <a className="reslink" onClick={() => setScreen('profil')}>Mon profil &amp; mes tickets</a>
            </div>
          </section>
        )}

        {screen === 'tickets' && (
          <section className="scr on" style={{ background: '#fff' }}>
            <div className="pad padnav">
              <div className="tk-hero">
                <div className="tk-big">{ticketCount}</div>
                <div className="tk-lbl">{ticketCount > 1 ? 'tickets cumulés ce soir' : 'ticket gagné ce soir'}</div>
                <div className="tk-draw"><svg className="ic"><use href="#i-clock" /></svg> Tirage demain à 12h30 · 3 places à gagner</div>
              </div>
              <div className="infocard b-magenta" style={{ marginTop: 14 }}><svg className="ic"><use href="#i-ticket" /></svg><div>Ton code : <b>{ticket || '—'}</b></div></div>
              {ticketCount < STATIONS.length && (
                <>
                  <div className="tk-tip" style={{ marginTop: 12 }}><svg className="ic"><use href="#i-layers" /></svg><div>Réponds aux quiz des autres stations : <b>chaque station = 1 ticket de plus</b> et plus de chances au tirage.</div></div>
                  <a className="double" style={{ marginTop: 14 }} onClick={() => setScreen('carte')}><svg className="ic"><use href="#i-map" /></svg> Cumuler aux autres stations</a>
                </>
              )}
              {ticketCount >= STATIONS.length && (
                <div className="tk-tip" style={{ marginTop: 12, background: '#e9f9ef', borderColor: '#bbf7d0', color: '#16a34a' }}><svg className="ic"><use href="#i-checkc" /></svg><div><b>Toutes les stations jouées !</b> Tu as le maximum de tickets pour le tirage de ce soir.</div></div>
              )}
            </div>
          </section>
        )}

        {screen === 'carte' && (
          <section className="scr carte" id="carteScr">
            <div className="map-top">
              <div className="qc">
                <span className="em"><svg className="ic"><use href="#i-map" /></svg></span>
                <div style={{ minWidth: 0 }}><div className="t">Les points de jeu</div><div className="s">Touche une station pour y aller</div></div>
                <span className="tk"><svg className="ic"><use href="#i-ticket" /></svg> {ticketCount}</span>
              </div>
            </div>
            <div className="map-fake">
              <div className="map-real" ref={mapRef} />
              <div className="map-list">
                <label className="stn" style={{ background: 'linear-gradient(135deg,#7C2D92,#E0218A)', color: '#fff', justifyContent: 'center', gap: 10, fontWeight: 800 }}>
                  <svg className="ic" style={{ width: 22, height: 22 }}><use href="#i-scan" /></svg>
                  Scanner le QR d&apos;une station
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={() => setScreen('carte')} />
                </label>
                {STATIONS.map(s => {
                  const cur = s.id === evId
                  return (
                    <button
                      className={`stn${cur ? ' cur' : ''}`}
                      key={s.id}
                      onClick={() => { if (!cur) window.location.href = `/parcours/nds2026?ev=${s.id}`; else setScreen('onboard') }}
                    >
                      <span className="em"><svg className="ic"><use href={`#${s.icon}`} /></svg></span>
                      <div style={{ minWidth: 0 }}><div className="nm">{s.nom}</div><div className="ou">{s.ou}</div></div>
                      {cur
                        ? <span className="tg" style={{ background: '#e9f9ef', color: '#16a34a' }}>Tu es ici</span>
                        : <span className="go"><svg className="ic" style={{ transform: 'scaleX(-1)' }}><use href="#i-arrowl" /></svg></span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {screen === 'partenaires' && (
          <section className="scr" style={{ background: '#fff' }}>
            <div className="pad padnav">
              <div className="pt-hero">Ils font vivre le festival</div>
              <div className="pt-sub">Les partenaires des Nuits du Sud. Touche un logo pour leurs offres et leurs réseaux.</div>
              {partenaires.length === 0 && <div className="pt-banner"><svg className="ic"><use href="#i-store" /></svg><div>Espace partenaires — la liste réelle s&apos;affichera ici (logos, promo, réseaux).</div></div>}
              <div className="pt-grid">
                {partenaires.map((p, i) => (
                  <div className="pt-card" key={p.id} onClick={() => setSheetPart(i)}>
                    <div className="pt-logo">{p.image_url ? <img src={p.image_url} alt={p.nom} style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover' }} /> : <svg className="ic"><use href="#i-store" /></svg>}</div>
                    <div className="pt-nm">{p.nom}</div>
                  </div>
                ))}
              </div>
            </div>
            {sheetPart !== null && partenaires[sheetPart] && (
              <>
                <div className="pt-dim2" onClick={() => setSheetPart(null)} />
                <div className="pt-sheet2">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 6 }}>
                    <div className="pt-logo" style={{ margin: 0 }}>{partenaires[sheetPart].image_url ? <img src={partenaires[sheetPart].image_url!} alt="" style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover' }} /> : <svg className="ic"><use href="#i-store" /></svg>}</div>
                    <div><div style={{ fontWeight: 800, fontSize: 19 }}>{partenaires[sheetPart].nom}</div>{partenaires[sheetPart].promo_text && <div style={{ fontSize: 13, color: '#7a708a' }}>{partenaires[sheetPart].promo_text}</div>}</div>
                  </div>
                  {partenaires[sheetPart].description && <div style={{ fontSize: 14, color: '#52455e', lineHeight: 1.5, margin: '8px 0' }}>{partenaires[sheetPart].description}</div>}
                  {(partenaires[sheetPart].site_web || partenaires[sheetPart].url) && <a className="sh-row" href={partenaires[sheetPart].site_web || partenaires[sheetPart].url || '#'} target="_blank" rel="noopener noreferrer"><svg className="ic" style={{ width: 16, height: 16 }}><use href="#i-store" /></svg> Site web</a>}
                  {partenaires[sheetPart].instagram && <a className="sh-row" href={partenaires[sheetPart].instagram!} target="_blank" rel="noopener noreferrer"><svg className="ic" style={{ width: 16, height: 16 }}><use href="#i-insta" /></svg> Instagram</a>}
                  {partenaires[sheetPart].facebook && <a className="sh-row" href={partenaires[sheetPart].facebook!} target="_blank" rel="noopener noreferrer"><svg className="ic" style={{ width: 16, height: 16 }}><use href="#i-fb" /></svg> Facebook</a>}
                  <a className="btn" style={{ marginTop: 16 }} onClick={() => setSheetPart(null)}>Fermer</a>
                </div>
              </>
            )}
          </section>
        )}

        {screen === 'profil' && (
          <section className="scr on" style={{ background: '#fff' }}>
            <div className="pad padnav">
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 18 }}>
                <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg className="ic" style={{ width: 28, height: 28, color: '#fff' }}><use href="#i-user" /></svg></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1226' }}>{form.prenom || recurrent?.prenom || 'Mon profil'}</div>
                  <div style={{ fontSize: 13, color: '#7a708a' }}>{form.email || recurrent?.email || 'Participant Nuits du Sud'}</div>
                </div>
              </div>

              <div className="infocard b-magenta"><svg className="ic"><use href="#i-ticket" /></svg><div>Ton code ticket : <b>{ticket || '—'}</b></div></div>
              <div className="infocard b-green" style={{ marginTop: 10 }}><svg className="ic"><use href="#i-checkc" /></svg><div><b>{ticketCount} ticket{ticketCount > 1 ? 's' : ''}</b> pour le tirage de ce soir</div></div>

              <div style={{ background: '#f7f4fb', border: '1px solid #ece6f3', borderRadius: 14, padding: '14px 15px', marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 800, color: '#1a1226', marginBottom: 6 }}>
                  <svg className="ic" style={{ width: 17, height: 17, color: 'var(--magenta)' }}><use href="#i-spark" /></svg>
                  Tu restes informé
                </div>
                <div style={{ fontSize: 13, color: '#52455e', lineHeight: 1.5 }}>Tu recevras les infos du festival, les offres et nouveautés des commerçants partenaires. Désinscription à tout moment.</div>
              </div>

              <div className="res-eyebrow" style={{ marginTop: 20 }}>Accès rapides</div>
              <a className="double" onClick={() => setScreen('partenaires')}><svg className="ic"><use href="#i-store" /></svg> Les partenaires &amp; leurs offres</a>
              <a className="double" onClick={() => setScreen('carte')} style={{ marginTop: 10 }}><svg className="ic"><use href="#i-map" /></svg> La carte des stations</a>
            </div>
          </section>
        )}

        {navOn && (
          <nav className="nav on" id="nav">
            <button className={`nb${screen === 'profil' ? ' on' : ''}`} onClick={() => nb('profil')}><svg className="ic"><use href="#i-user" /></svg>Profil</button>
            <button className={`nb${screen === 'carte' ? ' on' : ''}`} onClick={() => nb('carte')}><svg className="ic"><use href="#i-map" /></svg>Carte</button>
            <button className={`nb${screen === 'tickets' ? ' on' : ''}`} onClick={() => nb('tickets')}><svg className="ic"><use href="#i-ticket" /></svg>Tickets</button>
            <button className={`nb${screen === 'partenaires' ? ' on' : ''}`} onClick={() => nb('partenaires')}><svg className="ic"><use href="#i-store" /></svg>Partenaires</button>
          </nav>
        )}
      </div>
    </div>
  )
}
