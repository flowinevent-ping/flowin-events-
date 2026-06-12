'use client'

import { useState, useEffect, useCallback } from 'react'
import { writeJoueur, shuffle, AGE_OPTIONS } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import { NDS_CSS, NDS_SPRITE } from '@/lib/nds2026Design'
import type { ParcoursPageData, QuizQuestion, BonusQuestion } from '@/lib/parcours'

type Screen = 'onboard' | 'inscription' | 'quiz' | 'resultats' | 'bonus' | 'final' | 'tickets' | 'carte' | 'partenaires'
interface Props extends ParcoursPageData { evId: string }

const SRC = ['Instagram', 'Affiche', 'Bouche à oreille', 'Autre']

/* Les 3 stations fixes du festival (carte). joue=true => station courante scannée */
const STATIONS = [
  { id: 'ev-nds-caisses', nom: 'Les Caisses', ou: "À l'entrée, près de la billetterie", icon: 'i-ticket' },
  { id: 'ev-nds-bar',     nom: 'Le Bar',      ou: 'Au bar des Nuits du Sud',          icon: 'i-glass' },
  { id: 'ev-nds-ecrans',  nom: "L'Écran",     ou: "Sur l'écran géant, entre deux concerts", icon: 'i-monitor' },
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
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', tel: '', age: '', cp: '', source: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ticket, setTicket] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bonusAnswers, setBonusAnswers] = useState<Record<string, string | string[]>>({})
  const [bonusIdx, setBonusIdx] = useState(0)
  const [bonusDone, setBonusDone] = useState(false)
  const [sheetPart, setSheetPart] = useState<number | null>(null)

  const lsKey = `flowin_played_${evId}`

  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s) { setTicket(s); setSaved(true) } } catch {}
  }, [lsKey])

  useEffect(() => {
    if (screen !== 'quiz' || answered) return
    setTimer(timerSec)
    const iv = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(iv); handleAnswer(-1); return 0 } return t - 1 }), 1000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, qIdx])

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

  function submitInscription() {
    const errs: Record<string, string> = {}
    if (!form.prenom.trim()) errs.prenom = 'Requis'
    if (!form.nom.trim()) errs.nom = 'Requis'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setScreen('quiz')
  }

  async function persist(): Promise<string> {
    if (saved) return ticket
    setSaving(true)
    const tc = generateTicket('ND')
    const res = await writeJoueur({
      email: form.email, prenom: form.prenom, nom: form.nom, tel: form.tel,
      code_postal: form.cp, age_tranche: form.age, decouverte: form.source || undefined,
      score_moy: `${score}/${questions.length}`, events: [evId], ticket_code: tc,
      source: 'nds2026', prefix: 'ND', bonus_reponses: bonusAnswers,
    })
    setSaving(false)
    const finalTicket = res.ticket || tc
    setTicket(finalTicket)
    // On ne marque "joué" (local + écran tickets) QUE si l'écriture Supabase a réussi
    // (ou doublon = déjà en base). En cas d'échec réseau/base, on autorise un nouvel essai.
    if (res.success || res.duplicate) {
      setSaved(true)
      try { localStorage.setItem(lsKey, finalTicket) } catch {}
    } else if (res.error) {
      console.error('[nds2026] enregistrement Supabase échoué:', res.error)
    }
    return finalTicket
  }

  async function finaliser() { await persist(); setScreen('tickets') }

  async function finishBonus() {
    await persist(); setBonusDone(true); setScreen('final')
  }

  const q = questions[qIdx]
  const navOn = screen === 'tickets' || screen === 'carte' || screen === 'partenaires'

  function setSource(s: string) { setForm(f => ({ ...f, source: s })) }
  function nb(target: Screen) { setSheetPart(null); setScreen(target) }

  return (
    <div className="ndsbody">
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');" + NDS_CSS + `
        .ndsbody{min-height:100vh;min-height:100dvh;display:block;background:#160820;font-family:'Manrope',system-ui,sans-serif;color:#fff;padding:0}
        .ndsbody .phone{width:100%;max-width:480px;margin:0 auto;min-height:100vh;min-height:100dvh;background:#160820;position:relative;display:flex;flex-direction:column;overflow:hidden}
        .ndsbody .scr{position:static !important;inset:auto !important;display:flex !important;flex-direction:column;flex:1;min-height:0}
        .ndsbody .scr>.stage{flex:1 0 auto;display:flex;flex-direction:column;justify-content:center}
        .ndsbody .scr#carteScr,.ndsbody .scr.carte{position:relative !important;min-height:70vh}
        .ndsbody .padnav{padding-bottom:96px}
        .ndsbody .nav{position:sticky;bottom:0}
        .ndsbody .map-fake{flex:1;min-height:340px;background:linear-gradient(160deg,#241233,#3a1450);position:relative}
        .ndsbody .map-list{position:absolute;left:14px;right:14px;bottom:96px;display:flex;flex-direction:column;gap:10px}
        .ndsbody .stn{display:flex;align-items:center;gap:13px;background:#fff;color:#1a1020;border-radius:16px;padding:13px 15px;box-shadow:0 6px 22px rgba(20,26,38,.22)}
        .ndsbody .stn.cur{outline:2px solid var(--magenta)}
        .ndsbody .stn .em{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--purple),var(--magenta));display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
        .ndsbody .stn .em .ic{width:22px;height:22px}
        .ndsbody .stn .nm{font-weight:800;font-size:15px}
        .ndsbody .stn .ou{font-size:12px;color:#6b6076;margin-top:1px}
        .ndsbody .stn .tg{margin-left:auto;font-size:11px;font-weight:800;padding:4px 9px;border-radius:100px;flex-shrink:0}
        .ndsbody .pt-sheet2{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:480px;z-index:1000;background:#fff;color:#1a1020;border-radius:22px 22px 0 0;padding:22px 20px 30px;box-shadow:0 -8px 40px rgba(0,0,0,.3)}
        .ndsbody .pt-dim2{position:fixed;inset:0;background:rgba(10,4,16,.55);z-index:999}
        .ndsbody .sh-row{display:flex;align-items:center;gap:9px;margin-top:10px;text-decoration:none;color:var(--purple);font-weight:700;font-size:14px}
      ` }} />
      <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: NDS_SPRITE }} />

      <div className="phone">
        {screen === 'onboard' && (
          <section className="scr on">
            <div className="hero">
              <div className="htop"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ verticalAlign: -1, marginRight: 5 }}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" /></svg>VENCE</div>
              <div className="hname">Nuits du<br />Sud</div>
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
              <a className="btn" onClick={() => setScreen(saved ? 'tickets' : 'inscription')}>{saved ? 'Voir mes tickets' : 'Je joue maintenant'}</a>
              <div className="foot">En participant, tu acceptes notre politique de confidentialité.</div>
            </div>
          </section>
        )}

        {screen === 'inscription' && (
          <section className="scr purple on">
            <div className="pad">
              <div className="dhead">
                <div className="back" onClick={() => setScreen('onboard')}><svg className="ic"><use href="#i-arrowl" /></svg></div>
                <div><div className="dtitle">On y va !</div><div className="dsub">Juste une fois, pour recevoir tes gains</div></div>
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
              <div className="rgpd"><span className="rc"><svg className="ic"><use href="#i-check" /></svg></span><div>J&apos;accepte d&apos;être recontacté(e) par le festival. Données jamais cédées.</div></div>
              <a className="btn" onClick={submitInscription}>C&apos;est parti</a>
            </div>
          </section>
        )}

        {screen === 'quiz' && q && (
          <section className="scr purple on">
            <div className="pad">
              <div className="dhead">
                <div className="back" onClick={() => setScreen('inscription')}><svg className="ic"><use href="#i-arrowl" /></svg></div>
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
                  return <button key={i} className={cls} onClick={() => handleAnswer(i)}>{opt}</button>
                })}
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
              <a className="btn" style={{ marginTop: 10 }} onClick={finaliser}>{saving ? 'Enregistrement…' : 'Voir mon ticket →'}</a>
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
              <div className="res-sub">+1 point bonus ajouté à ta participation</div>
            </div>
            <div className="res-body">
              <div className="res-eyebrow">Joue les autres stations ce soir</div>
              <div className="nextcard">
                {STATIONS.filter(s => s.id !== evId).map(s => (
                  <div className="nextline" key={s.id}><span className="em"><svg className="ic"><use href={`#${s.icon}`} /></svg></span><div><div className="nm">{s.nom}</div><div className="ou">{s.ou}</div></div></div>
                ))}
              </div>
              <div className="bnote" style={{ margin: '6px 4px 16px', textAlign: 'left' }}>Chaque station jouée = 1 ticket de plus pour le tirage de 12h30.</div>
              <a className="double" onClick={() => setScreen('carte')}><svg className="ic"><use href="#i-map" /></svg> Voir les points sur la carte</a>
              <a className="reslink" onClick={() => setScreen('tickets')}>Mes tickets</a>
            </div>
          </section>
        )}

        {screen === 'tickets' && (
          <section className="scr on" style={{ background: '#fff' }}>
            <div className="pad padnav">
              <div className="tk-hero">
                <div className="tk-big">1</div>
                <div className="tk-lbl">ticket gagné ce soir</div>
                <div className="tk-draw"><svg className="ic"><use href="#i-clock" /></svg> Tirage demain à 12h30 · 3 places à gagner</div>
              </div>
              <div className="infocard b-magenta" style={{ marginTop: 14 }}><svg className="ic"><use href="#i-ticket" /></svg><div>Ton code : <b>{ticket || '—'}</b></div></div>
              <div className="tk-tip" style={{ marginTop: 12 }}><svg className="ic"><use href="#i-layers" /></svg><div>Joue les autres stations chaque soir — plus tu cumules de tickets, plus tu as de chances au tirage.</div></div>
            </div>
          </section>
        )}

        {screen === 'carte' && (
          <section className="scr carte" id="carteScr">
            <div className="map-top">
              <div className="qc">
                <span className="em"><svg className="ic"><use href="#i-map" /></svg></span>
                <div style={{ minWidth: 0 }}><div className="t">Les points de jeu</div><div className="s">Flashe le QR sur place</div></div>
                <span className="tk"><svg className="ic"><use href="#i-ticket" /></svg> 1</span>
              </div>
            </div>
            <div className="map-fake">
              <div className="map-list">
                {STATIONS.map(s => {
                  const cur = s.id === evId
                  return (
                    <div className={`stn${cur ? ' cur' : ''}`} key={s.id}>
                      <span className="em"><svg className="ic"><use href={`#${s.icon}`} /></svg></span>
                      <div style={{ minWidth: 0 }}><div className="nm">{s.nom}</div><div className="ou">{s.ou}</div></div>
                      <span className="tg" style={cur ? { background: '#e9f9ef', color: '#16a34a' } : { background: '#f3edf7', color: '#7a708a' }}>{cur ? 'Tu es ici' : 'À flasher'}</span>
                    </div>
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

        {navOn && (
          <nav className="nav" id="nav">
            <button className={`nb${screen === 'carte' ? ' on' : ''}`} onClick={() => nb('carte')}><svg className="ic"><use href="#i-map" /></svg>Carte</button>
            <button className={`nb${screen === 'tickets' ? ' on' : ''}`} onClick={() => nb('tickets')}><svg className="ic"><use href="#i-ticket" /></svg>Mes tickets</button>
            <button className={`nb${screen === 'partenaires' ? ' on' : ''}`} onClick={() => nb('partenaires')}><svg className="ic"><use href="#i-store" /></svg>Partenaires</button>
          </nav>
        )}
      </div>
    </div>
  )
}
