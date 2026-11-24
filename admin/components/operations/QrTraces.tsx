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
  SUPPORTS_QR, typeParDefaut, fetchQrTraces, avecDefauts, creerQrTrace, publierQrTrace, renommerQrTrace, archiverQrTrace,
  assurerQrParDefaut, changerJeuStation, urlDuQr, estPermanent, QR_INCLUS, fetchStatsQr, remplacerQrTrace, fetchFlashsAujourdhui,
  type QrTrace, type TypeQr, type StatQr,
} from '@/lib/qrTraces'
import { lienAncien } from '@/lib/qrPermalien'
import { qrFlowinPng, qrFlowinSvg } from '@/lib/qrLogo'
import { ouvrirAfficheA4 } from '@/lib/afficheQr'
import { libelleModule } from '@/lib/operations'
import { PictoSupport, PictoQr } from './PictoSupport'

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
      background: d ? 'rgba(224,33,138,.1)' : 'rgba(21,128,61,.1)', color: d ? '#BE185D' : '#15803D', whiteSpace: 'nowrap',
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
      <input style={{ ...champ, flex: '1 1 100%' }} placeholder="Intitulé — ex. Arrière de bus · campagne salle de sport" value={nom} onChange={e => setNom(e.target.value)} aria-label="Intitulé du QR" />
      <div role="radiogroup" aria-label="Type de support" data-tuiles-support style={{ flex: '1 1 100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(76px,1fr))', gap: 6 }}>
        {SUPPORTS_QR.map(s => {
          const on = support === s.v
          return (
            <button key={s.v} type="button" role="radio" aria-checked={on} data-support-tuile={s.p}
              onClick={() => { setSupport(s.v); setType(typeParDefaut(s.v)) }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '7px 4px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                border: `2px solid ${on ? 'var(--sa-accent, #3B5CC4)' : BRD}`, background: on ? '#EEF2FB' : '#fff', color: '#0F172A', fontSize: 10.5, fontWeight: 800, lineHeight: 1.15, textAlign: 'center' }}>
              <PictoSupport k={s.p} taille={30} />{s.v}
            </button>
          )
        })}
      </div>
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

/**
 * MES QR (lot 6 B, maquette validée le 24/11/2026) : vue du pro en UN écran. Un QR identifié par support, le nombre de FLASHS
 * de chacun (fetchStatsQr), puis un QR : plein écran, flashs du jour, copier le lien, imprimer l'affiche, « Remplacer ce QR ».
 * Remplacer = le pro seul : l'ancien QR affiche « QR désactivé » (app/q/[code]/route.ts), un nouveau QR du même support est créé.
 */
function MesQr({ eventId, jeu, titre, qrs, tousLesSlugs, onAjouter, onRemplace, occupe, erreur }: {
  eventId: string; jeu: string; titre: string; qrs: QrTrace[]; tousLesSlugs: string[]
  onAjouter: (q: { nom: string; support: string; type: TypeQr }) => void | Promise<void>
  onRemplace: () => void; occupe: boolean; erreur: string
}) {
  const [stats, setStats] = useState<StatQr[]>([])
  const [selSource, setSelSource] = useState('')
  const [etape, setEtape] = useState<'liste' | 'detail' | 'confirmer' | 'nouveau'>('liste')
  const [png, setPng] = useState('')
  const [jour, setJour] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const [ajout, setAjout] = useState(false)
  const [nouveau, setNouveau] = useState<{ qr: QrTrace; ancienNom: string; heure: string } | null>(null)
  const [remplace, setRemplace] = useState(false)
  useEffect(() => { let v = true; fetchStatsQr([eventId]).then(r => { if (v) setStats(r) }); return () => { v = false } }, [eventId, qrs.length])
  const affiche = etape === 'nouveau' && nouveau ? nouveau.qr : qrs.find(q => q.source_qr === selSource) ?? null
  const flashs = (q: QrTrace) => stats.find(x => x.source === q.source_qr)?.flashs ?? 0
  const total = stats.reduce((a, x) => a + x.flashs, 0)
  const url = affiche ? urlDuQr(affiche, eventId, jeu) : ''
  useEffect(() => {
    if (!affiche) { setPng(''); return }
    let v = true; setPng(''); setJour(null)
    qrFlowinPng(urlDuQr(affiche, eventId, jeu), 520).then(s => { if (v) setPng(s) }, () => {})
    fetchFlashsAujourdhui(eventId, affiche.source_qr).then(n => { if (v) setJour(n) })
    return () => { v = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affiche?.source_qr, eventId, jeu])
  async function copier() {
    try { await navigator.clipboard.writeText(url); setMsg('Lien copié.') } catch { setMsg(url) }
  }
  async function imprimer() {
    if (!affiche) return
    setMsg('')
    try {
      const svg = await qrFlowinSvg(url, 1024)
      const e = ouvrirAfficheA4({ svg, url, titre, sousTitre: 'Scannez pour jouer', qrNom: affiche.nom, support: affiche.support, code: affiche.code_court, auto: true })
      if (e) setMsg(e)
    } catch { setMsg('L’affiche n’a pas pu être créée.') }
  }
  async function remplacer() {
    if (!affiche || !affiche.id) return
    setRemplace(true); setMsg('')
    const r = await remplacerQrTrace(eventId, affiche, tousLesSlugs)
    setRemplace(false)
    if (!r.qr) { setMsg(r.erreur || 'Remplacement impossible.'); setEtape('detail'); return }
    const h = new Date(r.desactiveA || Date.now())
    setNouveau({ qr: r.qr, ancienNom: affiche.nom, heure: `${String(h.getHours()).padStart(2, '0')}:${String(h.getMinutes()).padStart(2, '0')}` })
    if (r.erreur) setMsg(r.erreur)
    setEtape('nouveau'); onRemplace()
  }
  const B: React.CSSProperties = { minHeight: 44, borderRadius: 99, border: '1.5px solid #3B5CC4', background: '#fff', color: '#3B5CC4', fontWeight: 800, fontSize: 14, padding: '0 16px', cursor: 'pointer', fontFamily: 'inherit' }
  const BP: React.CSSProperties = { ...B, background: '#3B5CC4', color: '#fff' }

  if (etape === 'liste' || !affiche) {
    return (
      <div data-mes-qr style={{ marginTop: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>Mes QR</div>
        <div style={{ margin: '2px 0 8px', color: MUT, fontSize: 13.5 }}><b data-flashs-total style={{ fontSize: 26, color: '#3B5CC4' }}>{total}</b> flashs au total</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {qrs.map(q => {
            const n = flashs(q)
            const max = Math.max(1, ...qrs.map(flashs))
            return (
              <button key={q.source_qr} type="button" data-mes-qr-ligne={q.source_qr} onClick={() => { setSelSource(q.source_qr); setEtape('detail'); setMsg('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '6px 12px', border: `1.5px solid ${BRD}`, borderRadius: 14, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', color: '#0F172A', textAlign: 'left' }}>
                <PictoQr support={q.support} source={q.source_qr} taille={34} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 14.5 }}>{q.nom}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: MUT }}>{q.support ?? ''}</span>
                  <span style={{ display: 'block', height: 5, borderRadius: 5, background: '#E7ECF6', marginTop: 4 }}><span style={{ display: 'block', height: 5, borderRadius: 5, background: '#3B5CC4', width: `${Math.round((n / max) * 100)}%` }} /></span>
                </span>
                <span style={{ textAlign: 'right' }}><b data-flashs style={{ fontSize: 20 }}>{n}</b><span style={{ display: 'block', fontSize: 11.5, color: MUT }}>flashs</span></span>
              </button>
            )
          })}
        </div>
        {ajout
          ? <div style={{ marginTop: 10 }}><FormulaireQr onAjouter={async q => { await onAjouter(q); setAjout(false) }} occupe={occupe} libelle="Créer le QR" /></div>
          : <button type="button" data-ajouter-support style={{ ...BP, width: '100%', marginTop: 10 }} onClick={() => setAjout(true)}>Ajouter un support</button>}
        {erreur && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 6 }}>{erreur}</div>}
        <div style={{ fontSize: 12.5, color: MUT, marginTop: 8 }}>{QR_INCLUS} QR inclus · chaque flash est compté pour son support. Un support de plus : tarif à confirmer.</div>
      </div>
    )
  }

  return (
    <div data-mes-qr-detail style={{ marginTop: 8, textAlign: 'center' }}>
      <button type="button" data-retour-liste onClick={() => { setEtape('liste'); setMsg('') }} style={{ ...B, border: 'none', minWidth: 44 }}>← Mes QR</button>
      <div style={{ fontSize: 20, fontWeight: 900 }}>{etape === 'nouveau' ? 'Nouveau QR prêt' : affiche.nom}</div>
      <div style={{ fontSize: 13, color: MUT }}>{affiche.support ?? ''}</div>
      {etape === 'nouveau' && <div style={{ display: 'inline-block', margin: '6px 0', fontSize: 12.5, fontWeight: 800, color: '#15803D', background: '#E7F6EC', borderRadius: 99, padding: '2px 10px' }}>Actif</div>}
      <div style={{ width: 220, height: 220, margin: '8px auto', display: 'grid', placeItems: 'center', background: '#fff', border: '2px solid #3B5CC4', borderRadius: 18, padding: 8, boxSizing: 'border-box', filter: etape === 'confirmer' ? 'blur(3px)' : undefined }}>
        {png ? <img data-qr-grand src={png} alt={`QR ${affiche.nom}`} style={{ width: '100%', height: '100%' }} /> : <span style={{ color: MUT }}>…</span>}
      </div>
      {etape === 'nouveau' && nouveau
        ? <div data-ancien-desactive style={{ border: `1.5px solid ${BRD}`, borderRadius: 14, padding: '8px 12px', textAlign: 'left', fontSize: 13, background: '#fff' }}><b>Ancien QR : désactivé à {nouveau.heure}</b><div style={{ color: MUT }}>Un scan affiche « QR désactivé ». Vos flashs d’avant restent comptés.</div></div>
        : <div style={{ display: 'flex', justifyContent: 'center', gap: 28, margin: '4px 0 6px' }}>
            <div><b data-flashs-jour style={{ fontSize: 24, color: '#3B5CC4' }}>{jour ?? '…'}</b><div style={{ fontSize: 12, color: MUT }}>flashs aujourd’hui</div></div>
            <div><b data-flashs style={{ fontSize: 24 }}>{flashs(affiche)}</b><div style={{ fontSize: 12, color: MUT }}>en tout</div></div>
          </div>}
      <div style={{ fontSize: 11.5, color: MUT, fontFamily: 'monospace', wordBreak: 'break-all', margin: '4px 0 8px' }}>{url.replace(/^https?:\/\//, '')}</div>
      {etape !== 'confirmer' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" data-copier style={B} onClick={copier}>Copier le lien</button>
            <button type="button" data-imprimer style={BP} onClick={imprimer}>Imprimer</button>
          </div>
          {etape === 'detail' && affiche.id && <button type="button" data-remplacer style={{ ...B, borderColor: '#F3C7B1', color: '#C2410C' }} onClick={() => setEtape('confirmer')}>Il a fuité ? Remplacer ce QR</button>}
        </div>
      )}
      {etape === 'confirmer' && (
        <div data-confirmer-remplacement role="alertdialog" aria-label="Remplacer ce QR" style={{ textAlign: 'left', border: `1.5px solid ${BRD}`, borderRadius: 16, padding: 14, background: '#fff' }}>
          <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 6 }}>Remplacer ce QR ?</div>
          <ul style={{ margin: '0 0 10px', paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
            <li>L’ancien QR s’arrête tout de suite.</li>
            <li>Un nouveau QR est créé, même support.</li>
            <li>Vos flashs restent comptés.</li>
          </ul>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" data-annuler style={B} onClick={() => setEtape('detail')}>Annuler</button>
            <button type="button" data-confirmer style={BP} disabled={remplace} onClick={remplacer}>{remplace ? 'Remplacement…' : 'Remplacer'}</button>
          </div>
        </div>
      )}
      {msg && <div role="status" style={{ fontSize: 13, fontWeight: 700, marginTop: 8, color: msg === 'Lien copié.' ? '#15803D' : '#B45309' }}>{msg}</div>}
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
  const [edition, setEdition] = useState<{ id: string; nom: string } | null>(null)
  const [voirArchives, setVoirArchives] = useState(false)
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

  async function renommer() {
    if (!edition || !edition.nom.trim()) return
    const ok = await renommerQrTrace(edition.id, edition.nom)
    if (ok) { setEdition(null); charger() } else setErreur('Le QR n’a pas pu être renommé.')
  }
  async function archiver(q: QrTrace, archive: boolean) {
    if (!q.id) return
    if (archive && typeof window !== 'undefined' && !window.confirm(`Archiver « ${q.nom} » ?\n\nIl sort de la liste ; un QR déjà imprimé reste valable.`)) return
    const ok = await archiverQrTrace(q.id, archive)
    if (ok) charger(); else setErreur('Action impossible.')
  }

  const tousAvecArchives = avecDefauts(qrs)
  const archives = tousAvecArchives.filter(q => !!q.archive_le)
  const tous = tousAvecArchives.filter(q => !q.archive_le)
  /* Cote pro, un QR masque par le SA n apparait plus. */
  const visibles = mode === 'sa' ? tous : tous.filter(q => q.publie)
  /* Piste de prix (non tranchée) : 2 QR de tracking inclus (hors QR par défaut), les suivants
     sont signalés « QR supplémentaire ». Informatif seulement : rien n'est bloqué ni facturé. */
  const crees = tous.filter(q => !q.parDefaut)
  const supplementaires = crees.slice(QR_INCLUS).map(q => q.source_qr)
  const compteur = (
    <div data-qr-inclus style={{ fontSize: 11.5, fontWeight: 800, color: '#1B3A5C', margin: '4px 0 6px' }}>
      {QR_INCLUS} QR inclus · {crees.length} créé{crees.length > 1 ? 's' : ''}{supplementaires.length ? ` · ${supplementaires.length} supplémentaire${supplementaires.length > 1 ? 's' : ''} (option, prix à définir)` : ''}
    </div>
  )

  if (grille) {
    return (
      <div>
        <div className="pc-qr" style={{ marginBottom: 14 }}>
          {visibles.map(q => (
            <div key={q.source_qr} className="pc-qr-tuile">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <PictoQr support={q.support} source={q.source_qr} taille={26} /><span style={{ fontSize: 13.5, fontWeight: 800 }}>{q.nom}</span><BadgeTypeQr type={q.type} />{jeu !== 'nds2026' && <BadgePermanent q={q} />}
              </div>
              <div style={{ fontSize: 11.5, color: MUT, margin: '3px 0 10px', lineHeight: 1.4 }}>{q.support ?? ''}{q.support ? ' · ' : ''}{REGLE_TYPE_QR[q.type]}</div>
              <Diffusion compact url={urlDuQr(q, eventId, jeu)} titre={titre} qrNom={q.nom} support={q.support} code={q.code_court} ancienFormat={false} sousTitre="Scannez pour jouer" />
            </div>
          ))}
        </div>
        {!sansAjout && <>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Ajouter un QR</div>
        {compteur}
        <FormulaireQr onAjouter={ajouter} occupe={occupe} />
        {erreur && <div style={{ fontSize: 12, color: '#B45309', fontWeight: 700, marginTop: 6 }}>{erreur}</div>}
        </>}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 12 }}>
      {mode === 'pro' ? (
        <MesQr eventId={eventId} jeu={jeu} titre={titre} qrs={visibles} tousLesSlugs={qrs.map(x => x.source_qr)} onAjouter={ajouter} onRemplace={charger} occupe={occupe} erreur={erreur} />
      ) : (<>
      <div style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 4 }}>QR tracés — un QR par support de communication</div>
      <div style={{ fontSize: 11, color: MUT, marginBottom: 6 }}>
        Chaque QR est une station de jeu avec ses propres statistiques (onglet Trafic). Il est utilisable dès sa création.
      </div>
      {visibles.map(q => {
        const url = urlDuQr(q, eventId, jeu)
        const cle = q.source_qr
        return (
          <div key={cle} style={{ padding: '6px 0', borderTop: `1px solid ${BRD}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <PictoQr support={q.support} source={q.source_qr} taille={34} />
              <Diffusion vignette={44} url={url} titre={q.nom} />
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {edition && q.id && edition.id === q.id ? (
                    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <input style={{ ...champ, padding: '4px 8px', fontSize: 12.5, width: 180 }} value={edition.nom} autoFocus aria-label="Nouveau nom du QR"
                        onChange={e => setEdition({ id: edition.id, nom: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') renommer(); if (e.key === 'Escape') setEdition(null) }} />
                      <button style={btnP} onClick={renommer} disabled={!edition.nom.trim()}>OK</button>
                      <button style={btn} onClick={() => setEdition(null)}>Annuler</button>
                    </span>
                  ) : <span style={{ fontWeight: 700, fontSize: 12.5 }}>{q.nom}</span>}
                  <BadgeTypeQr type={q.type} />
                  {jeu !== 'nds2026' && <BadgePermanent q={q} />}
                  {q.parDefaut && <span style={{ fontSize: 10.5, color: MUT }}>par défaut</span>}
                  {supplementaires.indexOf(q.source_qr) >= 0 && <span data-qr-supplementaire style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: 'rgba(194,65,12,.1)', color: '#C2410C', whiteSpace: 'nowrap' }}>QR supplémentaire (option, prix à définir)</span>}
                  {!q.publie && <span style={{ fontSize: 10.5, fontWeight: 800, color: '#B45309' }}>masqué au pro</span>}
                </div>
                <div style={{ fontSize: 10.5, color: MUT }}>{q.support ? `${q.support} · ` : ''}{q.code_court ? `réf. ${q.code_court}` : `?source=${q.source_qr}`}</div>
              </div>
              <button style={btn} onClick={() => setOuvert(o => (o === cle ? '' : cle))}>{ouvert === cle ? '▲ Supports' : '▼ Lien, PNG, SVG, affiche'}</button>
              {q.id && !edition && (
                <button style={btn} onClick={() => setEdition({ id: q.id as string, nom: q.nom })} aria-label={`Renommer ${q.nom}`}>Renommer</button>
              )}
              {q.id && !q.parDefaut && (
                <button style={btn} onClick={() => archiver(q, true)} aria-label={`Archiver ${q.nom}`}>Archiver</button>
              )}
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
      {archives.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <button style={{ ...btn, border: 'none', padding: '4px 0', color: MUT }} onClick={() => setVoirArchives(v => !v)}>
            {voirArchives ? '▲' : '▼'} Archivés ({archives.length})
          </button>
          {voirArchives && archives.map(q => (
            <div key={q.source_qr} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: MUT }}>
              <span style={{ flex: 1 }}>{q.nom}{q.support ? ` · ${q.support}` : ''}</span>
              <button style={btn} onClick={() => archiver(q, false)}>Restaurer</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        {compteur}
        <FormulaireQr onAjouter={ajouter} occupe={occupe} />
        {erreur && <div style={{ fontSize: 12, color: '#B45309', fontWeight: 700, marginTop: 6 }}>{erreur}</div>}
      </div>
      </>)}
      {jeu !== 'nds2026' && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BRD}` }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 4 }}>Jeu derrière les QR : {libelleModule(jeu)}</div>
          <div style={{ fontSize: 11, color: MUT, marginBottom: 6 }}>
            Les QR « Permanent » ne contiennent pas le jeu : vous pouvez changer de jeu sans réimprimer. Réservé au propriétaire de l’animation et à Flowin ; chaque changement est journalisé.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select style={{ ...champ, flex: '0 1 200px', minHeight: 44 }} value={jeuChoix} aria-label="Nouveau jeu" onChange={e => { setJeuChoix(e.target.value); setJeuMsg(null) }}>
              {JEUX_CHANGEABLES.map(j => <option key={j} value={j}>{libelleModule(j)}</option>)}
            </select>
            <button type="button" style={{ ...btnP, minHeight: 44 }} disabled={jeuOccupe || jeuChoix === jeu} onClick={changerJeu}>{jeuOccupe ? 'Changement…' : 'Changer le jeu'}</button>
            {jeuMsg && <span role="status" style={{ fontSize: 12, fontWeight: 700, color: jeuMsg.ok ? '#15803D' : '#B45309' }}>{jeuMsg.t}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
