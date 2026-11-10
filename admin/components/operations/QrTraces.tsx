'use client'

/**
 * QR TRACES — creation et diffusion des QR d une animation (lot QR, 31/10).
 *
 * Un seul composant, reutilise :
 *   - a la fin du parcours de creation (pro et SA, ParcoursCreation) ;
 *   - dans la diffusion d une station (DiffusionOperation, pro et SA) ;
 *   - dans l onglet « QR & Liens » de la fiche SA (QrLiensEvent).
 *
 * Chaque QR : nom, support, type physique/digital, publie tout de suite
 * (plus d attente de validation Flowin), et TOUS les supports du composant
 * Diffusion (image, lien copiable, PNG, SVG, affiche A4) -- y compris pour les
 * QR publies qui n avaient jusqu ici que l image.
 */

import { useEffect, useState } from 'react'
import Diffusion from '@/components/dashboard/Diffusion'
import {
  SUPPORTS_QR, typeParDefaut, fetchQrTraces, avecDefauts, creerQrTrace, publierQrTrace,
  assurerQrParDefaut, changerJeuStation, urlDuQr, estPermanent,
  type QrTrace, type TypeQr,
} from '@/lib/qrTraces'
import { lienAncien } from '@/lib/qrPermalien'
import { libelleModule } from '@/lib/operations'

/* Jeux proposables derriere un QR (hors Nuits du Sud). Memes identifiants que events.module. */
const JEUX_CHANGEABLES = ['quiz', 'quizsolo', 'quizmaster', 'spin', 'tombola', 'vote']
const BRD = 'var(--sa-border, #E2E8F0)'
const MUT = 'var(--sa-muted, #64748B)'
const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8,
  border: `1.5px solid ${BRD}`, background: '#fff', color: '#0F172A', fontSize: 12, fontWeight: 700,
  cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit', whiteSpace: 'nowrap',
}
const btnP: React.CSSProperties = { ...btn, background: 'var(--sa-accent, #3B5CC4)', borderColor: 'var(--sa-accent, #3B5CC4)', color: '#fff' }
const champ: React.CSSProperties = { border: `1.5px solid ${BRD}`, borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }

/** Ancien format (jeu dans l'URL). Les QR a imprimer passent par `urlDuQr` (lien permanent /q/<code>). */
export const lienQr = (eventId: string, module: string | null | undefined, source?: string) => lienAncien(eventId, module, source)

/** Pastille « permanent » : le QR ne change pas si on change de jeu. */
export function BadgePermanent({ q }: { q: QrTrace }) {
  const ok = estPermanent(q)
  /* Romain (10/11/2026) : aucune étiquette « ancien format » visible ; seuls les QR permanents portent une pastille. */
  if (!ok) return null
  return (
    <span title={ok ? 'Le QR ne contient pas le jeu : vous pouvez changer de jeu sans le réimprimer.' : 'Le lien contient le jeu : ce QR changerait si vous changiez de jeu.'}
      style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', padding: '2px 7px', borderRadius: 99, whiteSpace: 'nowrap',
        background: ok ? 'rgba(59,92,196,.1)' : 'rgba(245,158,11,.14)', color: ok ? '#3B5CC4' : '#B45309' }}>
      Permanent
    </span>
  )
}

/** Pastille physique / digital. */
export function BadgeTypeQr({ type }: { type: TypeQr }) {
  const d = type === 'digital'
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', padding: '2px 7px', borderRadius: 99,
      background: d ? 'rgba(224,33,138,.1)' : 'rgba(22,163,74,.1)', color: d ? '#BE185D' : '#15803D', whiteSpace: 'nowrap',
    }}>{d ? 'Digital' : 'Physique'}</span>
  )
}

export const REGLE_TYPE_QR: Record<TypeQr, string> = {
  physique: '1 participation par jour et par joueur sur ce QR.',
  digital: 'Une seule participation par compte : ensuite, le joueur est invité à venir en magasin.',
}

/** Formulaire d un QR : nom + support + type (les reseaux sont digitaux par
 *  defaut, modifiable). Utilise tel quel par le brouillon de la creation. */
export function FormulaireQr({ onAjouter, occupe, libelle = '+ Créer le QR' }: {
  onAjouter: (q: { nom: string; support: string; type: TypeQr }) => void | Promise<void>
  occupe?: boolean; libelle?: string
}) {
  const [nom, setNom] = useState('')
  const [support, setSupport] = useState(SUPPORTS_QR[0].v)
  const [type, setType] = useState<TypeQr>(typeParDefaut(SUPPORTS_QR[0].v))
  const ok = !!(nom.trim() || support)
  async function valider() {
    if (!ok) return
    await onAjouter({ nom: nom.trim() || support, support, type })
    setNom('')
  }
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input style={{ ...champ, flex: '2 1 180px' }} placeholder="Nom du QR — ex. Vitrine rue principale" value={nom} onChange={e => setNom(e.target.value)} aria-label="Nom du QR" />
      <select style={{ ...champ, flex: '1 1 150px' }} value={support} aria-label="Support"
        onChange={e => { setSupport(e.target.value); setType(typeParDefaut(e.target.value)) }}>
        {SUPPORTS_QR.map(s => <option key={s.v} value={s.v}>{s.v}</option>)}
      </select>
      <div style={{ display: 'inline-flex', border: `1.5px solid ${BRD}`, borderRadius: 8, overflow: 'hidden' }} role="radiogroup" aria-label="Type de QR">
        {(['physique', 'digital'] as const).map(t => (
          <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)}
            style={{ border: 'none', padding: '7px 11px', fontSize: 12, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', background: type === t ? 'var(--sa-accent, #3B5CC4)' : '#fff', color: type === t ? '#fff' : '#0F172A' }}>
            {t === 'physique' ? 'Physique' : 'Digital'}
          </button>
        ))}
      </div>
      <button type="button" style={btnP} disabled={occupe || !ok} onClick={valider}>{occupe ? 'Création…' : libelle}</button>
      <div style={{ flexBasis: '100%', fontSize: 11, color: MUT }}>{type === 'physique' ? 'QR physique' : 'QR digital'} : {REGLE_TYPE_QR[type]}</div>
    </div>
  )
}

/** Liste + creation des QR d un event. `grille` : tuiles (fin de creation). */
export default function QrTraces({ eventId, module, titre, mode, grille = false, recharge = 0, sansAjout = false }: {
  eventId: string; module: string | null | undefined; titre: string; mode: 'pro' | 'sa'
  grille?: boolean
  /** Grille sans le formulaire « Ajouter un QR » (écran final de publication en carrousel). */
  sansAjout?: boolean
  /** Incrementer pour forcer un rechargement (QR crees par l appelant). */
  recharge?: number
}) {
  const [qrs, setQrs] = useState<QrTrace[]>([])
  const [ouvert, setOuvert] = useState<string>('')
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState('')
  const [jeu, setJeu] = useState<string>(module || 'nds2026')
  const [jeuChoix, setJeuChoix] = useState<string>(module || 'quiz')
  const [jeuMsg, setJeuMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [jeuOccupe, setJeuOccupe] = useState(false)
  useEffect(() => { setJeu(module || 'nds2026'); setJeuChoix(module || 'quiz') }, [module, eventId])
  const charger = () => { fetchQrTraces(eventId).then(setQrs) }
  /* Charge, puis cree (une fois) les QR par defaut en base pour qu'ils aient un code permanent. */
  useEffect(() => {
    let vivant = true
    fetchQrTraces(eventId).then(async l => {
      if (!vivant) return
      setQrs(l)
      /* Nuits du Sud (nds2026) : ses QR sont deja imprimes et ont leur propre mecanique -- on n'y ecrit rien en simple consultation. */
      if (module !== 'nds2026' && await assurerQrParDefaut(eventId, l) && vivant) setQrs(await fetchQrTraces(eventId))
    })
    return () => { vivant = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, module, recharge])

  async function changerJeu() {
    if (jeuChoix === jeu) return
    const ancien = libelleModule(jeu), nouveau = libelleModule(jeuChoix)
    if (typeof window !== 'undefined' && !window.confirm(`Changer le jeu de « ${ancien} » à « ${nouveau} » ?\n\nLes QR déjà imprimés restent valables et mènent au nouveau jeu. Les statistiques et les règles (1 partie par jour par QR, digital 1 fois par compte) sont conservées. Le changement est enregistré dans le journal.\n\nPensez à vérifier le contenu du nouveau jeu (questions, lots, cases de la roue) : sinon le joueur verrait le contenu d’exemple.`)) return
    setJeuOccupe(true); setJeuMsg(null)
    const r = await changerJeuStation(eventId, jeuChoix)
    setJeuOccupe(false)
    if (r.ok) { setJeu(jeuChoix); setJeuMsg({ ok: true, t: `Jeu changé : « ${nouveau} ». Les QR imprimés mènent maintenant à ce jeu.` }) }
    else setJeuMsg({ ok: false, t: r.erreur || 'Changement impossible.' })
  }

  async function ajouter(q: { nom: string; support: string; type: TypeQr }) {
    setOccupe(true); setErreur('')
    const r = await creerQrTrace(eventId, q, qrs.map(x => x.source_qr))
    setOccupe(false)
    if (!r.qr) { setErreur(`Le QR n’a pas pu être créé${r.erreur ? ` (${r.erreur})` : ''}.`); return }
    setQrs(l => l.concat(r.qr as QrTrace))
    setOuvert(r.qr.source_qr)
  }

  const tous = avecDefauts(qrs)
  /* Cote pro, un QR masque par le SA n apparait plus. */
  const visibles = mode === 'sa' ? tous : tous.filter(q => q.publie)

  if (grille) {
    return (
      <div>
        <div className="pc-qr" style={{ marginBottom: 14 }}>
          {visibles.map(q => (
            <div key={q.source_qr} className="pc-qr-tuile">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13.5, fontWeight: 800 }}>{q.nom}</span><BadgeTypeQr type={q.type} />{jeu !== 'nds2026' && <BadgePermanent q={q} />}
              </div>
              <div style={{ fontSize: 11.5, color: MUT, margin: '3px 0 10px', lineHeight: 1.4 }}>{q.support ?? ''}{q.support ? ' · ' : ''}{REGLE_TYPE_QR[q.type]}</div>
              <Diffusion compact url={urlDuQr(q, eventId, jeu)} titre={titre} qrNom={q.nom} support={q.support} code={q.code_court} ancienFormat={false} sousTitre="Scannez pour jouer" />
            </div>
          ))}
        </div>
        {!sansAjout && <>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Ajouter un QR</div>
        <FormulaireQr onAjouter={ajouter} occupe={occupe} />
        {erreur && <div style={{ fontSize: 12, color: '#B45309', fontWeight: 700, marginTop: 6 }}>{erreur}</div>}
        </>}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 4 }}>QR tracés — un QR par support</div>
      <div style={{ fontSize: 11, color: MUT, marginBottom: 6 }}>
        Chaque QR est une station de jeu avec ses propres statistiques (onglet Trafic). Il est utilisable dès sa création.
      </div>
      {visibles.map(q => {
        const url = urlDuQr(q, eventId, jeu)
        const cle = q.source_qr
        return (
          <div key={cle} style={{ padding: '6px 0', borderTop: `1px solid ${BRD}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Diffusion vignette={44} url={url} titre={q.nom} />
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 12.5 }}>{q.nom}</span>
                  <BadgeTypeQr type={q.type} />
                  {jeu !== 'nds2026' && <BadgePermanent q={q} />}
                  {q.parDefaut && <span style={{ fontSize: 10.5, color: MUT }}>par défaut</span>}
                  {!q.publie && <span style={{ fontSize: 10.5, fontWeight: 800, color: '#B45309' }}>masqué au pro</span>}
                </div>
                <div style={{ fontSize: 10.5, color: MUT }}>{q.support ? `${q.support} · ` : ''}{q.code_court ? `réf. ${q.code_court}` : `?source=${q.source_qr}`}</div>
              </div>
              <button style={btn} onClick={() => setOuvert(o => (o === cle ? '' : cle))}>{ouvert === cle ? '▲ Supports' : '▼ Lien, PNG, SVG, affiche'}</button>
              {mode === 'sa' && q.id && (
                <button style={q.publie ? btn : btnP} onClick={() => publierQrTrace(q.id as string, !q.publie).then(charger)}>{q.publie ? 'Masquer' : 'Republier'}</button>
              )}
            </div>
            {ouvert === cle && (
              <div style={{ padding: '10px 0 4px' }}>
                <Diffusion compact url={url} titre={titre} qrNom={q.nom} support={q.support} code={q.code_court} ancienFormat={false} sousTitre="Scannez pour jouer" />
              </div>
            )}
          </div>
        )
      })}
      <div style={{ marginTop: 8 }}>
        <FormulaireQr onAjouter={ajouter} occupe={occupe} />
        {erreur && <div style={{ fontSize: 12, color: '#B45309', fontWeight: 700, marginTop: 6 }}>{erreur}</div>}
      </div>
      {jeu !== 'nds2026' && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BRD}` }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 4 }}>Jeu derrière les QR : {libelleModule(jeu)}</div>
          <div style={{ fontSize: 11, color: MUT, marginBottom: 6 }}>
            Les QR « Permanent » ne contiennent pas le jeu : vous pouvez changer de jeu sans réimprimer. Réservé au propriétaire de l’animation et à Flowin ; chaque changement est journalisé.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select style={{ ...champ, flex: '0 1 200px' }} value={jeuChoix} aria-label="Nouveau jeu" onChange={e => { setJeuChoix(e.target.value); setJeuMsg(null) }}>
              {JEUX_CHANGEABLES.map(j => <option key={j} value={j}>{libelleModule(j)}</option>)}
            </select>
            <button type="button" style={btnP} disabled={jeuOccupe || jeuChoix === jeu} onClick={changerJeu}>{jeuOccupe ? 'Changement…' : 'Changer le jeu'}</button>
            {jeuMsg && <span role="status" style={{ fontSize: 12, fontWeight: 700, color: jeuMsg.ok ? '#15803D' : '#B45309' }}>{jeuMsg.t}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
