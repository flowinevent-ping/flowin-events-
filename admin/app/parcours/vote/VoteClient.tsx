'use client'
import { useState, useEffect } from 'react'
import { writeJoueur, parcoursCSS, SOURCES, AGE_OPTIONS, getJoueurLocal, claimJoueur } from '@/lib/parcours'
import ParcoursOutro from '../_components/ParcoursOutro'
import { generateTicket } from '@/lib/ticket'
import type { ParcoursPageData } from '@/lib/parcours'

type Screen = 'landing' | 'vote' | 'form' | 'ticket' | 'already'
interface VoteItem { id: string; nom: string; emoji?: string; genre?: string; desc?: string }
interface Props extends ParcoursPageData { evId: string }

export default function VoteClient({ ev, lots, partenaires, evId }: Props) {
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const c = ev?.couleur ?? '#7C2D92'
  const nom = ev?.nom ?? 'Vote'
  const items = (cfg.voteItems ?? cfg.comediens ?? cfg.standupComediens ?? []) as VoteItem[]
  const mode = (cfg.voteMode ?? 'stars') as string
  const tirageText = (cfg.tirageDate as string) ? `Tirage ${cfg.tirageDate}` : ''
  const lsKey = `flowin_played_${evId}`

  const [screen, setScreen] = useState<Screen>('landing')
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [form, setForm] = useState({ prenom:'',nom:'',email:'',tel:'',genre:'',age:'',cp:'',source:'' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState('')
  const [existingTicket, setExistingTicket] = useState('')

  const lsCheck = () => { try { const s = localStorage.getItem(lsKey); if (s) { setExistingTicket(s); setScreen('already'); return true } } catch {}; return false }
  
  useState(() => { setTimeout(lsCheck, 0) })

  /* Bloc 2 — compte deja cree : saute le formulaire, attribue directement */
  const [reco, setReco] = useState(false)
  useEffect(() => {
    if (screen !== 'form' || reco) return
    const local = getJoueurLocal()
    if (!local) return
    setReco(true)
    ;(async () => {
      if (local.prenom) setForm(f => ({ ...f, prenom: local.prenom as string }))
      const res = await claimJoueur(local, evId, 'VS')
      try { localStorage.setItem(lsKey, res.ticket) } catch {}
      setExistingTicket(res.ticket)
      if (res.duplicate) { setScreen('already'); return }
      setTicket(res.ticket); setScreen('ticket')
    })()
  }, [screen, reco, evId, lsKey])

  async function handleSubmit() {
    const errs: Record<string,string> = {}
    if (!form.prenom.trim()) errs.prenom = 'Obligatoire'
    if (!form.nom.trim()) errs.nom = 'Obligatoire'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    if (form.tel.replace(/\s/g,'').length < 8) errs.tel = 'Invalide'
    setErrors(errs); if (Object.keys(errs).length) return
    setSubmitting(true)
    const tc = generateTicket('VS')
    const res = await writeJoueur({ email:form.email,prenom:form.prenom,nom:form.nom,tel:form.tel,code_postal:form.cp,genre:form.genre,age_tranche:form.age,decouverte:form.source.replace(/^[^ ]+ /,'')||undefined,events:[evId],ticket_code:tc,source:'vote',prefix:'VS' })
    setSubmitting(false)
    if (res.duplicate) { setExistingTicket(res.ticket); try{localStorage.setItem(lsKey,res.ticket)}catch{}; setScreen('already'); return }
    setTicket(res.ticket); setExistingTicket(res.ticket); try{localStorage.setItem(lsKey,res.ticket)}catch{}; setScreen('ticket')
  }


  /* Navigation postMessage — flèches dashboard SA */
  useEffect(() => {
    const NAV_SCREENS: Screen[] = ['landing', 'vote', 'form', 'ticket', 'already']
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
    <div style={{ maxWidth:430,margin:'0 auto',minHeight:'100dvh',background:'#0F172A',color:'#fff',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{parcoursCSS(c)}</style>

      {screen === 'landing' && (
        <div className="screen" style={{ paddingTop:32,textAlign:'center' }}>
          <div style={{ fontSize:48,marginBottom:14 }}>⭐</div>
          <div style={{ fontSize:24,fontWeight:900,marginBottom:8 }}>{nom}</div>
          <div style={{ fontSize:13,color:'rgba(255,255,255,.55)',marginBottom:20 }}>{(cfg.subtitle as string)||'Votez pour vos favoris !'}</div>
          <button className="btn" onClick={()=>lsCheck()||setScreen('vote')}>⭐ Voter maintenant →</button>
        </div>
      )}

      {screen === 'vote' && (
        <div className="screen">
          <div className="header"><div><div className="title">Votez !</div><div className="sub">{nom}</div></div></div>
          {items.length === 0 && <div style={{ textAlign:'center',color:'rgba(255,255,255,.45)',padding:32 }}>Aucun élément configuré.</div>}
          {items.map(item => (
            <div key={item.id} className="card" style={{ marginBottom:10,display:'flex',alignItems:'center',gap:12 }}>
              <div style={{ fontSize:32,flexShrink:0 }}>{item.emoji||'🎤'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800,fontSize:14 }}>{item.nom}</div>
                {item.genre && <div style={{ fontSize:11,color:'rgba(255,255,255,.45)' }}>{item.genre}</div>}
              </div>
              <div style={{ display:'flex',gap:4 }}>
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={()=>setVotes(v=>({...v,[item.id]:star}))}
                    style={{ fontSize:20,background:'none',border:'none',cursor:'pointer',color:(votes[item.id]??0)>=star?'#FBBF24':'rgba(255,255,255,.2)',padding:'2px' }}>★</button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ flex:1 }} />
          <button className="btn" style={{ marginTop:16 }} onClick={()=>setScreen('form')}>Valider mon vote →</button>
        </div>
      )}

      {screen === 'form' && !getJoueurLocal() && (
        <div className="screen">
          <div className="header"><div><div className="title">Crée ton compte</div><div className="sub">{nom}</div></div></div>
          <div className="grid2" style={{ marginBottom:12 }}>
            {[['prenom','Prénom *','given-name'],['nom','Nom *','family-name']].map(([k,l,ac])=>(
              <div key={k}><label className="label">{l}</label><input className={`input${errors[k]?' err':''}`} autoComplete={ac} value={form[k as keyof typeof form]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />{errors[k]&&<div className="err">{errors[k]}</div>}</div>
            ))}
          </div>
          <div style={{ marginBottom:12 }}><label className="label">Email *</label><input className={`input${errors.email?' err':''}`} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />{errors.email&&<div className="err">{errors.email}</div>}</div>
          <div style={{ marginBottom:12 }}><label className="label">Téléphone *</label><input className={`input${errors.tel?' err':''}`} type="tel" inputMode="tel" autoComplete="tel" value={form.tel} onChange={e=>setForm(f=>({...f,tel:e.target.value}))} />{errors.tel&&<div className="err">{errors.tel}</div>}</div>
          <div className="rgpd"><div className="rgpd-check">✓</div><div>J'accepte d'être recontacté(e). Données jamais cédées.</div></div>
          <button className="btn" style={{ marginTop:16 }} onClick={handleSubmit} disabled={submitting}>{submitting?'Envoi…':'✓ Valider →'}</button>
        </div>
      )}

      {(screen === 'ticket' || screen === 'already') && (
        <div className="screen" style={{ justifyContent:'center',textAlign:'center' }}>
          <div style={{ fontSize:48,marginBottom:12 }}>{screen==='ticket'?'🎉':'✅'}</div>
          <div style={{ fontSize:22,fontWeight:900,marginBottom:20 }}>{screen==='ticket'?'Vote enregistré !':'Déjà voté !'}</div>
          <div className="card" style={{ borderTop:`4px solid ${c}` }}>
            <div style={{ fontSize:32,marginBottom:8 }}>🎟️</div>
            <div className="ticket-code">{screen==='ticket'?ticket:existingTicket}</div>
            {tirageText && <div style={{ fontSize:11,color:'rgba(255,255,255,.45)' }}>🗓️ {tirageText}</div>}
          </div>
          <ParcoursOutro superEventId={ev?.super_event_id} />
        </div>
      )}
    </div>
  )
}
