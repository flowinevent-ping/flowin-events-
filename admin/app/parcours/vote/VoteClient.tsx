'use client'
import { useState, useEffect } from 'react'
import { writeJoueur, parcoursCSS, getJoueurLocal, claimJoueur, RGPD_TEXT } from '@/lib/parcours'
import { buildInviteLink } from '@/lib/parrainage'
import { NDS_JEU_POLICE } from '@/lib/parcours'
import ParcoursOutro from '../_components/ParcoursOutro'
import { FlowinBadge } from '@/components/parcours/ParcoursBranding'
import ParcoursChampsStandard from '@/components/parcours/ParcoursChampsStandard'
import { ParcoursPartenairesGrid, ParcoursPartenaireSheet } from '@/components/parcours/ParcoursPartenaires'
import { ParcoursHero, ParcoursPrizeCard, ParcoursHowTo, ParcoursRefusDigital, isDigitalLinkSource, PARCOURS_HERO_CSS } from '@/components/parcours/ParcoursHero'
import type { GainImmediat } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import type { ParcoursPageData } from '@/lib/parcours'
import { useParcoursTracking } from '@/lib/parcours-tracking'
import { resolveParcoursTheme } from '@/lib/parcoursTheme'

type Screen = 'landing' | 'vote' | 'form' | 'partenaires' | 'partSheet' | 'ticket' | 'already' | 'refusdigital'
/* Une "manche" = un écran de vote (image/logo + étoiles). Source normale :
   `cfg.vote_manches` (tableau jsonb {image?, logo?, emoji?, nom, texte?},
   1 à 10 entrées), écrite par un futur éditeur admin mini-Canva (pas encore
   construit). Tant qu'il n'existe pas, on retombe sur les clés historiques
   (`voteItems`/`comediens`/`standupComediens`) pour ne rien casser sur les
   events déjà configurés. */
interface VoteItem { id: string; nom: string; emoji?: string; genre?: string; desc?: string; image?: string; logo?: string; texte?: string }
interface Props extends ParcoursPageData { evId: string }

/* Étapes de l'écran "Comment jouer ?" (ParcoursHowTo) — propres au module. */
const VOTE_STEPS = [
  { titre: 'Flashe le QR code', sous: 'À la station' },
  { titre: 'Vote pour ton favori', sous: 'Et tente ta chance' },
]

export default function VoteClient({ ev, lots, partenaires, evId }: Props) {
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const c = ev?.couleur ?? '#7C2D92'
  const nom = ev?.nom ?? 'Vote'
  const items = ((cfg.vote_manches as VoteItem[] | undefined)?.length
    ? cfg.vote_manches
    : (cfg.voteItems ?? cfg.comediens ?? cfg.standupComediens ?? [])) as VoteItem[]
  const mode = (cfg.voteMode ?? 'stars') as string
  const tirageText = (cfg.tirageDate as string) ? `Tirage ${cfg.tirageDate}` : ''
  const lsKey = `flowin_played_${evId}`
  const theme = resolveParcoursTheme('vote', ev?.cfg)

  const [screen, setScreen] = useState<Screen>('landing')
  /* Referentiel 8 : gain immediat attribue par la regle de l event. */
  const [gain, setGain] = useState<GainImmediat | null>(null)
  useParcoursTracking('vote', evId, screen)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [partIdx, setPartIdx] = useState(0)
  /* Vote par etoiles : un artiste/element a la fois, pas une liste entiere
     d'un coup (Romain, 18/09 : « le vote doit se passer page à page... on ne
     voit pas si jamais il y a des questions ou des artistes »). */
  const [voteIdx, setVoteIdx] = useState(0)
  const [form, setForm] = useState({ prenom:'',nom:'',email:'',tel:'',genre:'',age:'',cp:'',source:'' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState('')
  const [existingTicket, setExistingTicket] = useState('')

  /* Anti-fraude "lien digital" — même pattern que QuizClient (voir
     ParcoursHero.tsx) : un joueur déjà reconnu sur l'appareil qui arrive via
     un lien réseaux (pas le lien de parrainage, qui ne porte pas ce
     paramètre) ne doit pas pouvoir revoter sans flasher le vrai QR. */
  const lsCheck = () => {
    try {
      if (isDigitalLinkSource() && getJoueurLocal()) { setScreen('refusdigital'); return true }
      const s = localStorage.getItem(lsKey); if (s) { setExistingTicket(s); setScreen('already'); return true }
    } catch {}
    return false
  }

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


  /* Partage — Vote n'offre PAS de ticket/tour supplémentaire au parrain
     (décision Romain, contrairement à Quiz/Tombola/Spin) : ce bouton ne sert
     qu'à partager le lien du vote. `captureParrainage` reste appelé
     génériquement par `writeJoueur` (lib/parcours.ts) pour tous les
     modules — l'attribution éventuelle d'un ticket dépend uniquement du
     trigger DB `tg_parrainage_credit_ticket`, pas de ce bouton. */
  const shareVote = async () => {
    const email = (form.email || getJoueurLocal()?.email || '').trim().toLowerCase()
    if (!email.includes('@')) return
    const extId = 'j-vs-' + email.replace(/[^a-z0-9]/g, '-').substring(0, 36)
    const link = buildInviteLink(`/parcours/vote?ev=${evId}`, extId, evId, 'wa') + '&source=parrainage'
    const txt = `Je vote pour ${nom}. Viens voter toi aussi ! ${link}`
    try {
      if (typeof navigator !== 'undefined' && navigator.share) { await navigator.share({ title: nom, text: txt }) }
      else { window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank') }
    } catch { /* annule */ }
  }

  const partSelected = partenaires[partIdx]

  /* Navigation postMessage — flèches dashboard SA */
  useEffect(() => {
    const NAV_SCREENS: Screen[] = ['landing', 'vote', 'form', 'partenaires', 'ticket', 'already']
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
    <div style={{ maxWidth:430,margin:'0 auto',minHeight:'100dvh',background: theme.bgImage ? `url(${theme.bgImage}) center/cover` : theme.bgColor, color: '#fff', fontFamily: NDS_JEU_POLICE }}>
      <style dangerouslySetInnerHTML={{ __html: parcoursCSS(c) + PARCOURS_HERO_CSS }} />

      {screen === 'landing' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
          <ParcoursHero module="vote" nom={nom}
            emoji={(cfg.logoEmoji as string) || theme.logoEmoji} logoSvg={(cfg.logoSvg as string) || theme.logoSvg} logoUrl={theme.logoUrl}
            subtitle={(cfg.subtitle as string) || theme.texts.landingSubtitle || undefined} />
          <div className="pc-stage">
            <ParcoursPrizeCard lots={lots} />
            <ParcoursHowTo steps={VOTE_STEPS} />
            <div style={{ flex: 1 }} />
            <div style={{ padding: '0 18px' }}>
              <button className="btn" onClick={()=>lsCheck()||setScreen('vote')}>{theme.texts.ctaLanding || 'Voter maintenant'} →</button>
              {partenaires.length > 0 && (
                <button className="btn-ghost" onClick={() => setScreen('partenaires')}>Nos {partenaires.length} partenaires</button>
              )}
              <FlowinBadge />
            </div>
          </div>
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
                    {choisi && <div style={{ color:c,fontWeight:800,fontSize:11,textTransform:'uppercase',letterSpacing:'.05em' }}>Sélectionné</div>}
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
                {/* Bloc image/logo en position fixe : image de la manche si configurée,
                    sinon logo, sinon initiale (fallback historique, inchangé). */}
                {items[voteIdx].image ? (
                  <img src={items[voteIdx].image} alt={items[voteIdx].nom}
                    style={{ width:76,height:76,borderRadius:22,objectFit:'cover',marginBottom:18,boxShadow:'0 8px 20px rgba(0,0,0,.25)' }} />
                ) : items[voteIdx].logo ? (
                  <div style={{ width:76,height:76,borderRadius:22,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,.08)',marginBottom:18,padding:10 }}>
                    <img src={items[voteIdx].logo} alt={items[voteIdx].nom} style={{ maxWidth:'100%',maxHeight:'100%',objectFit:'contain' }} />
                  </div>
                ) : (
                  <div style={{ width:76,height:76,borderRadius:22,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:28,background:`${c}33`,color:c,marginBottom:18 }}>
                    {(items[voteIdx].nom||'?').trim().slice(0,1).toUpperCase()}
                  </div>
                )}
                <div style={{ fontWeight:900,fontSize:21,marginBottom:4 }}>{items[voteIdx].nom}</div>
                {items[voteIdx].genre && <div style={{ fontSize:12.5,color:'rgba(255,255,255,.45)' }}>{items[voteIdx].genre}</div>}
                {(items[voteIdx].texte || items[voteIdx].desc) && <div style={{ fontSize:12.5,color:'rgba(255,255,255,.45)',marginTop:4 }}>{items[voteIdx].texte || items[voteIdx].desc}</div>}
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
          <ParcoursChampsStandard form={form} setForm={setForm} />
          <div className="rgpd"><div className="rgpd-check" /><div>{RGPD_TEXT}</div></div>
          <button className="btn" style={{ marginTop:16 }} onClick={handleSubmit} disabled={submitting}>{submitting?'Envoi…':'Valider →'}</button>
        </div>
      )}

      {screen === 'partenaires' && (
        <div className="screen">
          <div className="header"><div><div className="title">Nos partenaires</div><div className="sub">{nom}</div></div></div>
          <ParcoursPartenairesGrid partenaires={partenaires} onSelect={i => { setPartIdx(i); setScreen('partSheet') }} />
          <button className="btn-ghost" onClick={() => setScreen('landing')}>Retour</button>
        </div>
      )}

      {screen === 'partSheet' && partSelected && (
        <ParcoursPartenaireSheet p={partSelected} onClose={() => setScreen('partenaires')} />
      )}

      {(screen === 'ticket' || screen === 'already') && (
        <div className="screen" style={{ justifyContent:'center',textAlign:'center' }}>
          <div style={{ fontSize:22,fontWeight:900,marginBottom:20 }}>{screen==='ticket'?'Vote enregistré !':'Déjà voté !'}</div>
          <div className="card" style={{ borderTop:`4px solid ${c}` }}>
            <div className="ticket-code">{screen==='ticket'?ticket:existingTicket}</div>
            {tirageText && <div style={{ fontSize:11,color:'rgba(255,255,255,.45)' }}>{tirageText}</div>}
          </div>
          {partenaires.length > 0 && (
            <button className="btn-ghost" onClick={() => setScreen('partenaires')}>Découvrir nos partenaires</button>
          )}
          {(form.email || getJoueurLocal()?.email) && (
            <button className="btn-ghost" style={{ marginTop: 8 }} onClick={shareVote}>Partage ce vote</button>
          )}
          <ParcoursOutro superEventId={ev?.super_event_id} gain={gain} />
        </div>
      )}

      {screen === 'refusdigital' && (
        <div className="pc-stage">
          <ParcoursRefusDigital superEventId={ev?.super_event_id} />
        </div>
      )}
    </div>
  )
}
