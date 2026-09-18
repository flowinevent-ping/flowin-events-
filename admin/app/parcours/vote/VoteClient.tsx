'use client'
import { useState, useEffect } from 'react'
import { writeJoueur, parcoursCSS, SOURCES, AGE_OPTIONS, getJoueurLocal, claimJoueur } from '@/lib/parcours'
import { NDS_JEU_FOND, NDS_JEU_POLICE } from '@/lib/parcours'
import ParcoursOutro from '../_components/ParcoursOutro'
import type { GainImmediat } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import type { ParcoursPageData } from '@/lib/parcours'
import { useParcoursTracking } from '@/lib/parcours-tracking'

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
  /* Referentiel 8 : gain immediat attribue par la regle de l event. */
  const [gain, setGain] = useState<GainImmediat | null>(null)
  useParcoursTracking('vote', evId, screen)
  const [votes, setVotes] = useState<Record<string, number>>({})
  /* Vote par etoiles : un artiste/element a la fois, pas une liste entiere
     d'un coup (Romain, 18/09 : « le vote doit se passer page à page... on ne
     voit pas si jamais il y a des questions ou des artistes »). */
  const [voteIdx, setVoteIdx] = useState(0)
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
      setForm(f => ({ ...f,
        prenom: local.prenom || f.prenom, nom: local.nom || f.nom,
        email: local.email || f.email, tel: local.tel || f.tel,
        cp: local.cp || f.cp, age: local.age || f.age, genre: local.genre || f.genre }))
      const res = await claimJoueur(local, evId, 'VS')
      setGain(res.gain ?? null)
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
    // Les votes sont la donnée clé de ce parcours -> stockés dans bonus_answers
    // (participations.bonus_answers) pour exploitation dans le rapport.
    const voteData: Record<string, unknown> = { vote_mode: mode }
    items.forEach(it => { voteData[`vote_${it.id}`] = votes[it.id] ?? null })
    const res = await writeJoueur({ email:form.email,prenom:form.prenom,nom:form.nom,tel:form.tel,code_postal:form.cp,genre:form.genre,age_tranche:form.age,decouverte:form.source.replace(/^[^ ]+ /,'')||undefined,events:[evId],ticket_code:tc,source:'vote',prefix:'VS',bonus_reponses:voteData })
    setGain(res.gain ?? null)
    setSubmitting(false)
    if (res.duplicate) { setExistingTicket(res.ticket); try{localStorage.setItem(lsKey,res.ticket)}catch{}; setScreen('already'); return }
    if (!res.success) { if (res.error) console.error('[vote] enregistrement Supabase échoué:', res.error); setErrors({ email: 'Enregistrement impossible, réessaie.' }); return }
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
    <div style={{ maxWidth:430,margin:'0 auto',minHeight:'100dvh',background: NDS_JEU_FOND, color: '#fff', fontFamily: NDS_JEU_POLICE }}>
      <style>{parcoursCSS(c)}</style>

      {screen === 'landing' && (
        // Centrage vertical + horizontal, comme l'ecran ticket/already plus bas
        // dans ce meme fichier -- le contenu (titre + sous-titre + 1 bouton) est
        // trop court pour un simple paddingTop, il restait plaque en haut de
        // l'ecran (Romain, 18/09 : « c'est décalé, c'est pas centré »). Logo de
        // l'operation si configure, meme repli que QuizClient -- pas d'emoji
        // fixe qui masque le logo Flowin/partenaire attendu.
        <div className="screen" style={{ justifyContent:'center',textAlign:'center' }}>
          {cfg.logoSvg
            ? <div dangerouslySetInnerHTML={{ __html: cfg.logoSvg as string }} style={{ display:'flex',justifyContent:'center',marginBottom:14 }} />
            : <div style={{ fontSize:48,marginBottom:14 }}>{(cfg.logoEmoji as string) || '⭐'}</div>}
          <div style={{ fontSize:24,fontWeight:900,marginBottom:8 }}>{nom}</div>
          <div style={{ fontSize:13,color:'rgba(255,255,255,.55)',marginBottom:20 }}>{(cfg.subtitle as string)||'Votez pour vos favoris !'}</div>
          <button className="btn" onClick={()=>lsCheck()||setScreen('vote')}>⭐ Voter maintenant →</button>
        </div>
      )}

      {screen === 'vote' && (
        <div className="screen">
          <div className="header"><div><div className="title">Votez !</div><div className="sub">{nom}</div></div></div>
          {items.length === 0 && <div style={{ textAlign:'center',color:'rgba(255,255,255,.45)',padding:32 }}>Aucun élément configuré.</div>}
          {mode === 'unique' ? (
            <>
              {items.map(item => {
                const choisi = votes.__choix === 1 && votes[item.id] === 1
                return (
                  <button key={item.id} className="card" onClick={()=>{
                    const next: Record<string, number> = { __choix: 1 }
                    items.forEach(it => { next[it.id] = it.id === item.id ? 1 : 0 })
                    setVotes(next)
                  }}
                    style={{ marginBottom:10,display:'flex',alignItems:'center',gap:12,width:'100%',textAlign:'left',cursor:'pointer',
                      border: choisi ? `2px solid ${c}` : undefined }}>
                    <div style={{ width:38,height:38,borderRadius:10,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:15,background:`${c}33`,color:c }}>
                      {(item.nom||'?').trim().slice(0,1).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800,fontSize:14 }}>{item.nom}</div>
                      {item.desc && <div style={{ fontSize:11,color:'rgba(255,255,255,.45)' }}>{item.desc}</div>}
                    </div>
                    {choisi && <div style={{ color:c,fontWeight:900,fontSize:18 }}>✓</div>}
                  </button>
                )
              })}
              <div style={{ flex:1 }} />
              <button className="btn" style={{ marginTop:16 }} disabled={votes.__choix !== 1} onClick={()=>setScreen('form')}>Valider mon choix →</button>
            </>
          ) : items.length > 0 && items[voteIdx] && (
            /* Un element a la fois : nom bien visible, grandes etoiles, position
               dans la liste, navigation Precedent/Suivant -- meme principe que
               les questions bonus de NDS 2026 (« Bonus 2/4 »). */
            <>
              <div style={{ fontSize:11,fontWeight:800,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6,textAlign:'center' }}>
                {voteIdx+1} / {items.length}
              </div>
              <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'16px 0' }}>
                <div style={{ width:76,height:76,borderRadius:22,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:28,background:`${c}33`,color:c,marginBottom:18 }}>
                  {(items[voteIdx].nom||'?').trim().slice(0,1).toUpperCase()}
                </div>
                <div style={{ fontWeight:900,fontSize:21,marginBottom:4 }}>{items[voteIdx].nom}</div>
                {items[voteIdx].genre && <div style={{ fontSize:12.5,color:'rgba(255,255,255,.45)' }}>{items[voteIdx].genre}</div>}
                {items[voteIdx].desc && <div style={{ fontSize:12.5,color:'rgba(255,255,255,.45)',marginTop:4 }}>{items[voteIdx].desc}</div>}
                <div style={{ display:'flex',gap:10,marginTop:26 }}>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={()=>setVotes(v=>({...v,[items[voteIdx].id]:star}))}
                      style={{ fontSize:36,background:'none',border:'none',cursor:'pointer',color:(votes[items[voteIdx].id]??0)>=star?'#FBBF24':'rgba(255,255,255,.2)',padding:4 }}>★</button>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex',gap:10 }}>
                {voteIdx > 0 && <button className="btn-ghost" style={{ flex:1,marginTop:0 }} onClick={()=>setVoteIdx(i=>i-1)}>← Précédent</button>}
                {voteIdx < items.length-1
                  ? <button className="btn" style={{ flex:1 }} onClick={()=>setVoteIdx(i=>i+1)}>Suivant →</button>
                  : <button className="btn" style={{ flex:1 }} onClick={()=>setScreen('form')}>Valider mon vote →</button>}
              </div>
            </>
          )}
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
          {/* Champs standard du formulaire d'inscription (Romain, 18/09 : « nom,
              prénom, sexe, tranche d'âge, code postal, email, téléphone, opt-in,
              vous nous avez connu comment — toujours les mêmes »). `genre`, `age`,
              `cp` et `source` existaient déjà dans l'état et étaient déjà envoyés
              à l'enregistrement (writeJoueur) : seuls les champs de saisie
              manquaient ici. */}
          <div className="grid2" style={{ marginBottom:12 }}>
            <div><label className="label">Sexe</label><select className="input" value={form.genre} onChange={e=>setForm(f=>({...f,genre:e.target.value}))}><option value="">—</option><option value="H">Homme</option><option value="F">Femme</option></select></div>
            <div><label className="label">Tranche d&apos;âge</label><select className="input" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))}>{AGE_OPTIONS.map(o=><option key={o.val} value={o.val}>{o.label}</option>)}</select></div>
          </div>
          <div style={{ marginBottom:12 }}><label className="label">Code postal</label><input className="input" inputMode="numeric" autoComplete="postal-code" value={form.cp} onChange={e=>setForm(f=>({...f,cp:e.target.value}))} /></div>
          <div style={{ marginBottom:12 }}><label className="label">Comment nous avez-vous connu ?</label><div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:6 }}>{SOURCES.map(s=><button key={s} className={`source-chip${form.source===s?' sel':''}`} onClick={()=>setForm(f=>({...f,source:s}))}>{s}</button>)}</div></div>
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
          <ParcoursOutro superEventId={ev?.super_event_id} gain={gain} />
        </div>
      )}
    </div>
  )
}
