'use client'

import { useState, useEffect, useCallback } from 'react'
import { writeJoueur, shuffle, getJoueurLocal } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import { NDS_CSS, NDS_SPRITE } from '@/lib/nds2026Design'
import type { ParcoursPageData, QuizQuestion, BonusQuestion } from '@/lib/parcours'

type Screen = 'onboard' | 'inscription' | 'quiz' | 'resultats' | 'bonus' | 'tickets'
interface Props extends ParcoursPageData { evId: string }

const SRC = ['Instagram', 'Affiche', 'Bouche à oreille', 'Autre']

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

  const lsKey = `flowin_played_${evId}`

  // retour : déjà joué -> on file aux tickets
  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s) { setTicket(s); setSaved(true) } } catch {}
  }, [lsKey])

  // timer par question
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

  async function finaliser() {
    if (saved) { setScreen('tickets'); return }
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
    setTicket(finalTicket); setSaved(true)
    try { localStorage.setItem(lsKey, finalTicket) } catch {}
    setScreen('tickets')
  }

  const q = questions[qIdx]
  const c = ev?.couleur ?? '#7C2D92'

  function setSource(s: string) { setForm(f => ({ ...f, source: s })) }

  return (
    <div className="ndsbody">
      <style dangerouslySetInnerHTML={{ __html: NDS_CSS + `
        .ndsbody{background:#0c0a12;font-family:'Manrope',system-ui,sans-serif;color:#fff;display:block;min-height:100dvh;padding:0}
        .ndsbody .phone{position:relative;width:100%;max-width:480px;margin:0 auto;border-radius:0;min-height:100dvh;background:transparent}
        .ndsbody .scr{position:static !important;inset:auto !important;display:block !important;min-height:100dvh}
      ` }} />
      <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: NDS_SPRITE }} />

      <div className="phone">
        {screen === 'onboard' && (
          <section className="scr on">
            <div className="hero"><img className="hlogo" src="/nds/logo_nds_blanc_hd.png" alt="Nuits du Sud" /></div>
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
                <div><label className="label">Tranche d&apos;âge</label><input className="input" placeholder="—" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></div>
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
              {bonusQs.length > 0 && <a className="double" onClick={() => { setBonusIdx(0); setScreen('bonus') }}><svg className="ic"><use href="#i-spark" /></svg> Double tes chances</a>}
              <div className="infocard b-magenta"><svg className="ic"><use href="#i-gift" /></svg><div>Lot : <b>3 places pour ton prochain concert</b></div></div>
              <div className="infocard b-green"><svg className="ic"><use href="#i-checkc" /></svg><div>Participation enregistrée&#8239;!</div></div>
              <a className="btn" style={{ marginTop: 10 }} onClick={finaliser}>{saving ? 'Enregistrement…' : 'Voir mon ticket →'}</a>
            </div>
          </section>
        )}

        {screen === 'bonus' && bonusQs[bonusIdx] && (
          <section className="scr purple on">
            <div className="pad">
              <div className="dhead"><div className="back" onClick={() => setScreen('resultats')}><svg className="ic"><use href="#i-arrowl" /></svg></div><div><div className="dtitle">Bonus</div><div className="dsub">{bonusIdx + 1} / {bonusQs.length} · double tes chances</div></div></div>
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
              <a className="btn" onClick={() => bonusIdx + 1 < bonusQs.length ? setBonusIdx(i => i + 1) : finaliser()}>{bonusIdx + 1 < bonusQs.length ? 'Suivant →' : (saving ? 'Enregistrement…' : 'Terminer →')}</a>
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
              {partenaires.length > 0 && <div className="tk-tip"><svg className="ic"><use href="#i-layers" /></svg><div>Joue les autres stations chaque soir — plus tu cumules de tickets, plus tu as de chances au tirage.</div></div>}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
