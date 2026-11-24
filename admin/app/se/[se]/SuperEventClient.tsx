'use client'
import { chargerTicketsGainsJoueur } from '@/lib/moiTicketsGains'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import SuperEventMap, { Lieu } from '../_components/SuperEventMap'
import { Ico, IcoModule } from '@/lib/proicons'
import { ACCENT_SUPER } from '@/lib/charte'
import { estDemo } from '@/lib/demo'
import type { LotPhase } from '@/lib/superEventLots'
import { initiale, separerReperes } from '@/lib/seReperes'
import { lirePhases, phaseCourante, periodePhase, LIBELLE_PHASE, ORANGE_SE, type Phase } from '@/lib/superEventPhases'

type SE = { id: string; nom: string; description?: string | null; date_d?: string | null; date_f?: string | null; social?: { insta?: string; fb?: string; site?: string } | null; cfg_jeu?: unknown }
type Lot = { id: string; rang: number | null; valeur: number | null; libelle?: string | null }
type Sponsor = { id: string; nom: string; image_url?: string | null }
type FocusEvent = { id: string; nom: string; module?: string | null; gain_immediat?: string | null }
type Autre = { id: string; nom: string; date_d?: string | null; date_f?: string | null; nb: number }
type GainRow = { id: string; libelle?: string | null; code?: string | null; utilise?: boolean | null; event_id?: string | null; type?: string | null }
type Joueur = { id: string; prenom?: string }

interface Props {
  se: SE
  lots: Lot[]
  /** Lots rangés par phase (super event en deux phases, 19/11/2026). */
  lotsPhases?: LotPhase[]
  lieux: Lieu[]
  sponsors: Sponsor[]
  autres?: Autre[]
  focus?: FocusEvent | null
  /** Logos des commerces { event_id: image_url } (partenaires.image_url via partenaires.event_id). */
  logos?: Record<string, string>
}

const HERO = '#3B5CC4'
/* Règle Romain (24/11) : sur un Super Event on joue SUR PLACE (créer du trafic). Rayon unique, en mètres. */
const RAYON_SUR_PLACE_M = 150
/* Futur réglage par station : 'sur_place' | 'distance' (1 fois par jour et par compte). Lu avec ce défaut,
   aucune colonne ni écran pour l'instant (maquette d'abord). */
const MODE_JEU_DEFAUT = 'sur_place'
const ctaStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 14px 0', minHeight: 52, borderRadius: 26, background: 'linear-gradient(135deg,#B5471E,#D2631F)', color: '#fff', font: '700 17px system-ui', textDecoration: 'none', boxShadow: '0 6px 14px rgba(181,71,30,.35)', width: 'calc(100% - 28px)', boxSizing: 'border-box' }
const ENTETE_SE = 'linear-gradient(135deg,#C2410C 0%,#E05A0E 55%,#FF8A14 100%)'

type ModUI = { label: string; grad: string; accent: string; soft: string }
const MODULE_UI: Record<string, ModUI> = {
  spin: { label: 'Roue de la chance', grad: 'linear-gradient(135deg,#F59E0B,#EA580C)', accent: '#C2410C', soft: '#FDF1E3' },
  quiz: { label: 'Quiz', grad: 'linear-gradient(135deg,#3B5CC4,#2DA8FF)', accent: '#2746A6', soft: '#EAF0FF' },
  quizsolo: { label: 'Quiz solo', grad: 'linear-gradient(135deg,#0EA5A4,#0891B2)', accent: '#0E7490', soft: '#E5F7F7' },
  quizmaster: { label: 'Quiz Master', grad: 'linear-gradient(135deg,#2746A6,#3B5CC4)', accent: '#2746A6', soft: '#EAF0FF' },
  nds2026: { label: 'Jeu des Nuits du Sud', grad: 'linear-gradient(135deg,#F59E0B,#EA580C)', accent: '#C2410C', soft: '#FDF1E3' },
  tombola: { label: 'Tombola', grad: 'linear-gradient(135deg,#E11D48,#9F1239)', accent: '#BE123C', soft: '#FCE7EC' },
  vote: { label: 'Vote', grad: 'linear-gradient(135deg,#0EA5A4,#3B5CC4)', accent: '#0E7490', soft: '#E5F7F7' },
}
function modUI(m?: string | null): ModUI {
  return (m && MODULE_UI[m]) || { label: 'Jeu', grad: `linear-gradient(135deg,${HERO},#2DA8FF)`, accent: '#2746A6', soft: '#EAF0FF' }
}

const PODIUM = [
  { medal: '1', grad: 'linear-gradient(135deg,#FFE08A,#F59E0B)', fg: '#7A4A06', glow: 'rgba(245,158,11,.5)' },
  { medal: '2', grad: 'linear-gradient(135deg,#EDF0F4,#B9C0CA)', fg: '#454C59', glow: 'rgba(150,160,175,.4)' },
  { medal: '3', grad: 'linear-gradient(135deg,#E8B07A,#C8743C)', fg: '#5A2F10', glow: 'rgba(200,116,60,.4)' },
]

function dirUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
function jour(d?: string | null): string {
  if (!d) return ''
  const p = d.split('-')
  if (p.length < 3) return ''
  return `${parseInt(p[2], 10)} ${MOIS[parseInt(p[1], 10) - 1] || ''}`
}
function periode(a?: string | null, b?: string | null): string {
  const ja = jour(a), jb = jour(b)
  if (ja && jb) return `${ja} – ${jb}`
  return ja || jb || ''
}

function distMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000, toR = (d: number) => (d * Math.PI) / 180
  const dLat = toR(bLat - aLat), dLng = toR(bLng - aLng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}
function fmtDist(m: number): string {
  return m < 1000 ? `à ${Math.round(m / 10) * 10} m` : `à ${(m / 1000).toFixed(1).replace('.', ',')} km`
}

export default function SuperEventClient({ se, lots, lotsPhases = [], lieux, sponsors, autres = [], focus, logos = {} }: Props) {
  const [open, setOpen] = useState<boolean>(false)
  const [fiche, setFiche] = useState(false)
  const carRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Lieu | null>(null)
  const [joueur, setJoueur] = useState<Joueur | null>(null)
  const [played, setPlayed] = useState<Set<string>>(new Set())
  const [ticketCount, setTicketCount] = useState(0)
  const [gains, setGains] = useState<GainRow[]>([])
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [posRefusee, setPosRefusee] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setPosRefusee(true),
      { timeout: 8000 }
    )
  }, [])

  /* Deux phases (Romain, 19/11) : les lots affichés suivent la phase en cours.
     Phases inactives (ou SQL non appliqué) : une seule phase, comme avant.
     En démo : les deux phases sont montrées, coupées à date_d. */
  const phases = lirePhases(se)
  const [demo, setDemo] = useState(false)
  useEffect(() => { setDemo(estDemo()) }, [])
  const modePhases = (phases.actif || demo) && !!phases.dateD && lotsPhases.length > 0
  const enCours: Phase = phaseCourante({ ...phases, actif: true }) ?? 'pendant'
  const [phaseVue, setPhaseVue] = useState<Phase | null>(null)
  const phaseAff: Phase = phaseVue ?? enCours
  const lotsSorted = modePhases
    ? lotsPhases.filter(l => l.phase === phaseAff)
    : [...lots].sort((a, b) => (a.rang ?? 9) - (b.rang ?? 9))
  const idsKey = lieux.map((l) => l.id).join(',')

  // Reconnaissance joueur (localStorage) → données réelles
  useEffect(() => {
    if (typeof window === 'undefined') return
    let j: Joueur | null = null
    try {
      const s = localStorage.getItem('flowin_joueur')
      if (s) {
        const o = JSON.parse(s) as { id?: string; prenom?: string }
        if (o.id) j = { id: o.id, prenom: o.prenom }
      }
    } catch { /* ignore */ }
    if (!j) return
    setJoueur(j)
    const ids = idsKey ? idsKey.split(',') : []
    const jid = j.id
    ;(async () => {
      /* Sécurité joueurs (19/11) : une RPC limitée au joueur (repli direct si absente). */
      const tg = await chargerTicketsGainsJoueur(jid, se.id, ids)
      const tk = { data: tg.tickets }, ga = { data: tg.gains }
      const pa = { data: tg.stationsTerminees.map(event_id => ({ event_id })) }
      const tkRows = (tk.data ?? []) as { event_id: string | null }[]
      const paRows = (pa.data ?? []) as { event_id: string | null }[]
      setTicketCount(tkRows.length)
      const pset = new Set<string>()
      tkRows.forEach((r) => { if (r.event_id) pset.add(r.event_id) })
      paRows.forEach((r) => { if (r.event_id) pset.add(r.event_id) })
      setPlayed(pset)
      setGains((ga.data ?? []) as GainRow[])
    })()
  }, [se.id, idsKey])

  function choisir(l: Lieu) {
    setSelected(l)
    setOpen(false)
    setFiche(false)
  }
  function selectById(id: string) {
    const l = lieux.find((x) => x.id === id)
    if (l) choisir(l)
  }
  /* Arrivée par le QR d'un commerce : il est déjà choisi (la carte s'y recentre). */
  useEffect(() => {
    if (focus && !selected) { const l = lieux.find((x) => x.id === focus.id); if (l) setSelected(l) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.id, idsKey])

  const identified = !!joueur
  /* Pastilles a la couleur de categorie super event (orange), plus le violet
     #7C2D92 herite des donnees. */
  const mapLieux = lieux.map((l) => ({ ...l, couleur: ACCENT_SUPER, joue: identified ? played.has(l.id) : l.joue, logo: logos[l.id] || null }))
  const playedCount = lieux.filter((l) => played.has(l.id)).length
  /* Après chargement du jeu, le carrousel repart du début (les plus proches). */
  useEffect(() => { if (carRef.current) carRef.current.scrollTo({ left: 0 }) }, [playedCount])
  const fu = selected ? modUI(selected.module) : null
  /* Stations triées du plus proche au plus loin (si la position est connue), sinon l'ordre de la base. */
  const distDe = (l: Lieu): number | null => (userPos && typeof l.lat === 'number' && typeof l.lng === 'number') ? distMeters(userPos.lat, userPos.lng, l.lat, l.lng) : null
  const lieuxTries = userPos
    ? [...lieux].sort((a, b) => (distDe(a) ?? 1e12) - (distDe(b) ?? 1e12))
    : lieux
  const groupes: { label: string; items: Lieu[] }[] = []
  lieux.forEach((l) => {
    const lb = modUI(l.module).label
    let g = groupes.find((x) => x.label === lb)
    if (!g) { g = { label: lb, items: [] }; groupes.push(g) }
    g.items.push(l)
  })
  const lotTete = lotsSorted[0]
  const lotTeteTxt = lotTete ? (lotTete.libelle || (lotTete.valeur ? `${lotTete.valeur} €` : '')) : ''
  const pctJoue = lieux.length ? Math.round((playedCount / lieux.length) * 100) : 0
  /* Carrousel : les points du festival sans logo sont regroupés sur la carte, pas dans le carrousel.
     Plus proches devant ; en jeu, les commerces joués passent en fin de carrousel. */
  const sep = separerReperes(mapLieux)
  const grpIds = new Set(sep.groupes.flat().map((x) => x.id))
  const base = lieuxTries.filter((l) => !grpIds.has(l.id))
  const caro = identified ? [...base.filter((l) => !played.has(l.id)), ...base.filter((l) => played.has(l.id))] : base
  const nbCommerces = caro.length
  const prochain = caro.find((l) => !(identified && played.has(l.id))) ?? caro[0]
  const joues = caro.filter((l) => identified && played.has(l.id)).length
  const hautEntete = demo ? 26 : 0
  const urlJouer = (l: Lieu) => `/parcours/${l.module || 'nds2026'}?ev=${l.id}${demo ? '&demo=1' : ''}`
  /* Jouer ici : seulement à proximité (démo : règle ignorée ; mode 'distance' : pas de contrainte). Le QR du commerce reste valide. */
  const modeJeu = (l: Lieu): string => ((l as unknown as { mode_jeu?: string }).mode_jeu) || ((se.cfg_jeu as { mode_jeu?: string } | null | undefined)?.mode_jeu) || MODE_JEU_DEFAUT
  const distM = (l: Lieu): number | null => distDe(l)
  const surPlace = (l: Lieu): boolean => {
    if (demo || modeJeu(l) !== 'sur_place') return true
    const d = distM(l)
    return d !== null && d <= RAYON_SUR_PLACE_M
  }
  const urlAccueil = `/se/${se.id}${demo ? '?demo=1' : ''}`
  const dist = (selected && userPos && typeof selected.lat === 'number' && typeof selected.lng === 'number')
    ? fmtDist(distMeters(userPos.lat, userPos.lng, selected.lat, selected.lng))
    : null

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: 'system-ui, sans-serif', color: '#141a26', background: '#f1ede6' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes feSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes feFade{from{opacity:0}to{opacity:1}}
        @keyframes feRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:.3}}
        @keyframes feGlow{0%,100%{box-shadow:0 4px 14px var(--g)}50%{box-shadow:0 4px 26px var(--g)}}
        @keyframes feReveal{0%{transform:scale(.5) rotate(-6deg);opacity:0}60%{transform:scale(1.06) rotate(1.5deg);opacity:1}100%{transform:scale(1) rotate(0)}}
        @keyframes feEclat{0%{left:-60%}55%,100%{left:130%}}
        @keyframes feHalo{0%,100%{transform:scale(.8);opacity:.45}50%{transform:scale(1.15);opacity:.9}}
        @keyframes feSlide{from{transform:translateY(-10px);opacity:0}to{transform:none;opacity:1}}
        @keyframes feRemplit{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes feRespire{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}
        .fe-card{animation:feRise .34s ease both}
        .se-plaque{position:relative;overflow:hidden;background:#fff;border-radius:16px;padding:7px 14px;margin:0 auto;width:min(62%,240px);box-shadow:0 0 0 3px rgba(255,255,255,.35),0 10px 22px -10px rgba(120,30,0,.7);animation:feReveal .8s cubic-bezier(.2,.9,.3,1.2) both}
        .se-plaque img{display:block;width:100%;height:auto}
        .se-plaque:after{content:'';position:absolute;top:-30%;bottom:-30%;width:38%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,210,63,.85),transparent);transform:skewX(-18deg);animation:feEclat 2.6s 1s ease-in-out 2}
        .se-halo{position:absolute;inset:-60%;background:radial-gradient(closest-side,rgba(255,210,63,.42),transparent 70%);animation:feHalo 3.4s ease-in-out infinite;pointer-events:none}
        .se-glisse{animation:feSlide .55s .5s ease-out both}
        .se-barre{height:10px;border-radius:9px;background:#F8D3BC;overflow:hidden}
        .se-barre i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#C2410C,#FF8A14);transform-origin:left;animation:feRemplit 1s .4s cubic-bezier(.3,.7,.2,1) both}
        .se-cta{animation:feRespire 2.4s 2s ease-in-out infinite}
        .se-car{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding:0 20px;margin:0 -20px;padding:2px 20px 8px;scrollbar-width:none}
        .se-car::-webkit-scrollbar{display:none}
        .se-car>*{scroll-snap-align:start}
        @media (prefers-reduced-motion:reduce){
          .se-plaque,.se-plaque:after,.se-halo,.se-glisse,.se-barre i,.se-cta,.fe-card{animation:none!important}
          .se-plaque:after{display:none}
        }
      ` }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <SuperEventMap lieux={mapLieux} mode={identified ? 'jeu' : 'vitrine'} height="100%" showPosition={true} onSelect={selectById} reperes selId={selected?.id ?? null} decalageBas={selected ? 340 : 260} geoHaut={hautEntete + 100} />
      </div>

      {/* Bandeau Super Event 88 px (maquette lot 4 v2) : dégradé orange, cartouche logo, compteur ; un appui = accueil du Super Event */}
      <a data-se-entete href={urlAccueil} aria-label="Accueil du Super Event"
        onClick={(e) => { if (typeof window !== 'undefined' && window.location.pathname === `/se/${se.id}`) { e.preventDefault(); setSelected(null); setOpen(false); setFiche(false) } }}
        style={{ position: 'absolute', top: hautEntete, left: 0, right: 0, height: 88, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', background: ENTETE_SE, color: '#fff', borderRadius: '0 0 22px 22px', boxShadow: '0 3px 10px rgba(0,0,0,.3)', textDecoration: 'none', boxSizing: 'border-box' }}>
        <span style={{ flexShrink: 0, height: 44, background: '#fff', borderRadius: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', border: '3px solid #E9B993', boxSizing: 'border-box' }}>
          <img src="/flowin-super-event-logo.svg" alt="Super event" height={30} style={{ height: 30, width: 'auto', display: 'block' }} />
        </span>
        <span style={{ minWidth: 0, flex: 1, fontWeight: 800, fontSize: 16, lineHeight: 1.15 }}>
          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{se.nom}</span>
          {periode(se.date_d, se.date_f) && <span style={{ display: 'block', fontWeight: 600, fontSize: 12, opacity: .95, marginTop: 2 }}>{periode(se.date_d, se.date_f)}</span>}
        </span>
        <span style={{ flexShrink: 0, background: '#fff', color: ORANGE_SE, borderRadius: 14, padding: '6px 10px', textAlign: 'center', minWidth: 44 }}>
          <span data-nb-commerces style={{ display: 'block', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{nbCommerces}</span>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#5a6071' }}>commerces</span>
        </span>
      </a>

      {/* En jeu : pastille de progression discrète en haut de la carte */}
      {identified && nbCommerces > 0 && (
        <div data-progression-pastille style={{ position: 'absolute', top: hautEntete + 100, left: 12, zIndex: 900, background: '#fff', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,.25)', padding: '6px 12px 6px 8px', display: 'flex', alignItems: 'center', gap: 9, maxWidth: 'calc(100% - 150px)' }}>
          <span style={{ width: 38, height: 38, borderRadius: '50%', background: `conic-gradient(#15803D 0 ${Math.round((joues / nbCommerces) * 100)}%,#E5E7EB 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <b style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{joues}/{nbCommerces}</b>
          </span>
          <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.25 }}><b style={{ display: 'block', fontSize: 13, color: '#111' }}>{joues} joué{joues > 1 ? 's' : ''}</b>{ticketCount} ticket{ticketCount > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Feuille du bas : poignée, carrousel de logos balayable, fiche courte et bouton pastille */}
      <div data-feuille style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, boxShadow: '0 -4px 18px rgba(0,0,0,.25)', maxHeight: open ? '82dvh' : undefined, overflowY: open ? 'auto' : 'visible', paddingBottom: 16 }}>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Réduire' : 'Voir plus'}
          style={{ display: 'block', width: '100%', minHeight: 44, border: 'none', background: 'transparent', cursor: 'pointer', padding: '10px 0 0' }}>
          <span style={{ display: 'block', width: 44, height: 5, background: '#D1D5DB', borderRadius: 3, margin: '0 auto' }} />
        </button>
        <div style={{ padding: '0 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span style={{ font: '700 15px system-ui', color: '#B5471E' }}>{identified ? 'Prochains commerces' : 'Les commerces qui jouent'}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{identified ? 'vert = joué' : `${nbCommerces} · glissez →`}</span>
        </div>
        <div ref={carRef} data-carrousel className="se-car" style={{ margin: 0, padding: '2px 14px 6px', gap: 10 }}>
          {caro.map((l) => {
            const jo = identified && played.has(l.id)
            const on = selected?.id === l.id
            const d = distDe(l)
            const lg = logos[l.id]
            return (
              <button key={l.id} data-station data-logo={lg ? '1' : '0'} aria-pressed={on} onClick={() => choisir(l)}
                style={{ flex: '0 0 76px', width: 76, minWidth: 0, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'center', font: 'inherit' }}>
                <span style={{ position: 'relative', width: 74, height: 74, borderRadius: 16, background: lg ? '#fff' : '#FED7AA', border: `2px solid ${on ? '#1D4ED8' : jo ? '#15803D' : '#E5E7EB'}`, boxShadow: on ? '0 0 0 3px rgba(29,78,216,.2)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', margin: '0 auto' }}>
                  {lg ? <img src={lg} alt="" style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> : <span style={{ font: '800 24px system-ui', color: '#9A3412' }}>{initiale(l.nom)}</span>}
                  {jo && <span style={{ position: 'absolute', right: -5, top: -5, width: 20, height: 20, borderRadius: '50%', background: '#15803D', color: '#fff', font: '700 12px/20px system-ui', textAlign: 'center' }}>{'✓'}</span>}
                </span>
                <span style={{ display: 'block', maxWidth: 76, fontSize: 11, color: '#374151', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nom}</span>
                <span style={{ display: 'block', fontSize: 10, color: jo ? '#15803D' : '#6b7280', fontWeight: jo ? 700 : 400 }}>{jo ? 'joué' : d !== null ? (d < 1000 ? `${Math.round(d / 10) * 10} m` : `${(d / 1000).toFixed(1).replace('.', ',')} km`) : ' '}</span>
              </button>
            )
          })}
        </div>

        {selected && (
          <div data-fiche-courte style={{ margin: '6px 14px 0', border: '1px solid #E5E7EB', borderRadius: 14, padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ width: 56, height: 56, flexShrink: 0, border: '1px solid #eee', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: logos[selected.id] ? '#fff' : '#FED7AA' }}>
              {logos[selected.id] ? <img src={logos[selected.id]} alt="" style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> : <span style={{ font: '800 22px system-ui', color: '#9A3412' }}>{initiale(selected.nom)}</span>}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <b style={{ fontSize: 15, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.nom}</b>
              <div style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>{dist ? `${dist.replace(/^à /, '')} · ` : ''}{identified && played.has(selected.id) ? 'déjà joué' : selected.gain_immediat ? `Lot immédiat : ${selected.gain_immediat}` : 'Un ticket du Grand tirage'}</div>
            </div>
            <button data-infos onClick={() => setFiche(true)} style={{ flexShrink: 0, minWidth: 44, minHeight: 44, border: '1.5px solid #F8D3BC', borderRadius: 12, background: '#FFF1E8', color: '#9A3412', fontWeight: 800, fontSize: 13, cursor: 'pointer', padding: '0 10px' }}>Infos</button>
          </div>
        )}

        {selected && surPlace(selected) ? (
          <a data-cta-jouer href={urlJouer(selected)} style={ctaStyle}>Jouer ici</a>
        ) : selected ? (
          <div data-sur-place style={{ margin: '10px 14px 0', textAlign: 'center' }}>
            <div data-cta-jouer="loin" style={{ ...ctaStyle, margin: 0, width: '100%', background: '#FFF1E8', color: '#9A3412', border: '1.5px solid #F8D3BC', boxShadow: 'none', fontSize: 16 }}>Allez sur place pour jouer</div>
            <div style={{ fontSize: 13, color: '#4B5563', margin: '8px 0 6px' }}>
              {distM(selected) !== null ? `Vous êtes ${fmtDist(distM(selected) as number).replace(/^à /, 'à ')} du commerce. ` : posRefusee || !userPos ? 'Activez la position ou scannez le QR. ' : ''}
              {distM(selected) !== null ? 'Ou scannez le QR du commerce.' : ''}
            </div>
            {typeof selected.lat === 'number' && typeof selected.lng === 'number' && (
              <a data-itineraire href={dirUrl(selected.lat, selected.lng)} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 18px', borderRadius: 22, border: '1.5px solid #B5471E', color: '#B5471E', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>Itinéraire</a>
            )}
          </div>
        ) : (
          <button data-cta-jouer onClick={() => { if (prochain) choisir(prochain) }} style={{ ...ctaStyle, border: 0, cursor: 'pointer' }}>
            {identified && prochain ? `Aller à ${prochain.nom}` : 'Jouer au plus proche'}
          </button>
        )}

        {!open && (
          <button onClick={() => setOpen(true)} style={{ display: 'block', width: '100%', minHeight: 44, marginTop: 4, border: 0, background: 'transparent', color: '#5a6071', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Lots, gains et tous les commerces
          </button>
        )}

        {open && (
          <div style={{ padding: '4px 20px 12px' }}>
            {lotTeteTxt && (
              <div data-lot-tete style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFF1E8', border: '1px solid #F8D3BC', borderRadius: 14, padding: '9px 12px', marginBottom: 12 }}>
                <span style={{ flexShrink: 0, display: 'inline-flex', color: ORANGE_SE }}><Ico k="gift" size={22} /></span>
                <div style={{ minWidth: 0, fontSize: 14, fontWeight: 800, color: '#7C2D12', lineHeight: 1.25 }}>
                  Grand tirage : {lotTeteTxt}
                  {lotsSorted.length > 1 && <span style={{ fontWeight: 700, color: '#5a6071' }}> et {lotsSorted.length - 1} autre{lotsSorted.length > 2 ? 's' : ''} lot{lotsSorted.length > 2 ? 's' : ''}</span>}
                </div>
              </div>
            )}
            <div style={{ fontSize: 13, color: '#5a6071', marginBottom: 12 }}>1 ticket par commerce et par jour. Un seul grand tirage.</div>
            <a data-lien-carte-commerces href="/carte-commerces" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, marginBottom: 8, fontSize: 14, fontWeight: 800, color: '#B5471E', textDecoration: 'underline' }}>Carte de tous les commerces Flowin</a>
            {identified && lieux.length > 0 && (
              <div data-progression style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: '#141a26', marginBottom: 5 }}>
                  <span>{playedCount} sur {lieux.length} commerces</span>
                  <span style={{ color: ORANGE_SE }}>{ticketCount} ticket{ticketCount > 1 ? 's' : ''}</span>
                </div>
                <div className="se-barre"><i style={{ width: `${Math.max(pctJoue, 3)}%` }} /></div>
              </div>
            )}

            {identified && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{joueur?.prenom ? `Salut ${joueur.prenom}` : 'Salut'}</div>
                <a href="/moi" style={{ fontSize: 13, fontWeight: 800, color: '#2746A6', background: '#EFF3FE', padding: '7px 13px', borderRadius: 100, textDecoration: 'none' }}><Ico k="user" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Mon compte</a>
              </div>
            )}

            {/* Carnet de gains */}
            {identified && gains.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.04em', color: '#5a6071', textTransform: 'uppercase', marginBottom: 11 }}><Ico k="gift" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Tes gains</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {gains.map((g) => (
                    <div key={g.id} className="fe-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 16, background: g.utilise ? '#F3F4F6' : 'linear-gradient(135deg,#EAFBF3,#D6F5E6)', border: `1px solid ${g.utilise ? '#e5e7eb' : '#bfedd6'}` }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}><Ico k="gift" size={24} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: g.utilise ? '#6b7280' : '#0B6E50', textDecoration: g.utilise ? 'line-through' : 'none' }}>{g.libelle || 'Lot'}</div>
                        {g.code && <div style={{ fontSize: 12, color: '#6b7385', fontFamily: 'monospace', marginTop: 2 }}>Code : {g.code}</div>}
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, padding: '4px 9px', borderRadius: 100, background: g.utilise ? '#e5e7eb' : '#0B6E50', color: g.utilise ? '#6b7280' : '#fff' }}>
                        {g.utilise ? 'Utilisé' : 'À récupérer'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modePhases && (
              <div data-phases style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6, background: '#FFF4EC', borderRadius: 14, padding: 4 }}>
                  {(['avant', 'pendant'] as Phase[]).map(ph => (
                    <button key={ph} data-phase={ph} onClick={() => setPhaseVue(ph)}
                      style={{ flex: 1, border: 'none', borderRadius: 11, padding: '9px 6px', minHeight: 44, cursor: 'pointer', fontWeight: 800, fontSize: 13,
                        background: phaseAff === ph ? ORANGE_SE : 'transparent', color: phaseAff === ph ? '#fff' : ORANGE_SE }}>
                      {ph === 'avant' ? 'Avant' : 'Pendant'}{ph === enCours ? ' · en cours' : ''}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 7 }}>
                  {LIBELLE_PHASE[phaseAff]}{periodePhase(phases, phaseAff) ? ` · ${periodePhase(phases, phaseAff)}` : ''} · tirage au sort{demo && !phases.actif ? ' · DÉMO' : ''}
                </div>
                {lotsSorted.length === 0 && <div style={{ fontSize: 12.5, color: '#5a6071', textAlign: 'center', marginTop: 8 }}>Lots de cette phase [à compléter]</div>}
              </div>
            )}
            {/* Podium des lots */}
            {lotsSorted.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.06em', color: '#5a6071', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}><Ico k="star" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Les lots à rafler</div>
                <div style={{ display: 'flex', gap: 11, alignItems: 'flex-end' }}>
                  {lotsSorted.slice(0, 3).map((l, i) => {
                    const p = PODIUM[i] || PODIUM[2]
                    const tall = i === 0
                    return (
                      <div
                        key={l.id}
                        className="fe-card"
                        style={{ flex: 1, background: p.grad, color: p.fg, borderRadius: 18, padding: tall ? '20px 8px' : '15px 8px', textAlign: 'center', ...(i === 0 ? { ['--g' as string]: p.glow, animation: 'feGlow 2.4s ease-in-out infinite, feRise .34s ease both' } : {}) }}
                      >
                        <div style={{ fontSize: tall ? 30 : 24, lineHeight: 1, fontWeight: 900 }}>{p.medal}</div>
                        <div style={{ fontSize: tall ? 27 : 22, fontWeight: 800, marginTop: 6 }}>{l.valeur ? `${l.valeur} €` : ''}</div>
                        {l.libelle && <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{l.libelle}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(se.social?.insta || se.social?.fb) && (
              <div style={{ background: '#fff', border: '1px solid #e6e9f2', borderRadius: 16, padding: '15px 16px', marginBottom: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#2c3a63', marginBottom: 6 }}><Ico k="ticket" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Résultats du grand tirage</div>
                <div style={{ fontSize: 13, color: '#5a6071', marginBottom: 12, lineHeight: 1.45 }}>Les gagnants sont annoncés sur les réseaux des Nuits du Sud. Suis-les pour ne rien manquer.</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  {se.social?.insta && <a href={se.social.insta} target="_blank" rel="noopener" style={{ flex: 1, maxWidth: 160, padding: '11px', borderRadius: 12, background: '#3B5CC4', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>Instagram</a>}
                  {se.social?.fb && <a href={se.social.fb} target="_blank" rel="noopener" style={{ flex: 1, maxWidth: 160, padding: '11px', borderRadius: 12, background: '#3b5998', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>Facebook</a>}
                </div>
              </div>
            )}

            {/* Tous les commerces, groupés par jeu */}
            {lieux.length > 0 && (
              <div data-stations style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.04em', color: '#5a6071', textTransform: 'uppercase', marginBottom: 9 }}><Ico k="shop" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Tous les commerces</div>
                <div data-liste-groupee>
                  {groupes.map((g) => (
                    <div key={g.label} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#5a6071', marginBottom: 6 }}>{g.label} · {g.items.length}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 6 }}>
                        {g.items.map((l) => {
                          const jo = identified && played.has(l.id)
                          return (
                            <button key={l.id} onClick={() => choisir(l)} style={{ minHeight: 44, textAlign: 'left', border: `1px solid ${jo ? '#bfedd6' : '#e6e9f2'}`, background: jo ? '#EAFBF3' : '#fff', borderRadius: 12, padding: '0 12px', fontSize: 13.5, fontWeight: 700, color: '#141a26', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {jo ? '✓ ' : ''}{l.nom}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {autres.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.04em', color: '#5a6071', textTransform: 'uppercase', marginBottom: 11 }}><Ico k="globe" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Autres opérations en cours</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {autres.map((a) => (
                    <a
                      key={a.id}
                      href={`/se/${a.id}`}
                      className="fe-card"
                      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 15px', borderRadius: 18, background: 'linear-gradient(135deg,#F4F6FB,#EAF0FF)', border: '1px solid #e2e8f6', textDecoration: 'none', color: 'inherit' }}
                    >
                      <span style={{ width: 48, height: 48, borderRadius: 14, background: ENTETE_SE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, flexShrink: 0 }}><Ico k="pin" size={23} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nom}</div>
                        <div style={{ fontSize: 12.5, color: '#6b7385', marginTop: 2 }}>
                          {a.nb} commerce{a.nb > 1 ? 's' : ''}{periode(a.date_d, a.date_f) ? ` · ${periode(a.date_d, a.date_f)}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: 22, color: '#5a6071', flexShrink: 0 }}>›</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {sponsors.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: '#5a6071', marginBottom: 9 }}>Avec le soutien de</div>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  {sponsors.map((s) => (
                    <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e3e5ea', padding: '6px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>
                      {s.image_url ? <img src={s.image_url} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : ''} {s.nom}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ===== FICHE COMMERCE ===== */}
      {fiche && selected && fu && (
        <>
          <div onClick={() => setFiche(false)} style={{ position: 'absolute', inset: 0, zIndex: 1500, background: 'rgba(15,20,35,.5)', animation: 'feFade .2s ease' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1600, background: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, boxShadow: '0 -6px 30px rgba(0,0,0,.25)', maxHeight: '86dvh', overflowY: 'auto', animation: 'feSheetUp .3s cubic-bezier(.4,0,.2,1)' }}>

            {/* Hero : photo si dispo, sinon dégradé du jeu */}
            <div style={{ position: 'relative', borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden', color: '#fff', background: fu.grad }}>
              {selected.photo_url && (
                <>
                  <img src={selected.photo_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,15,30,.25) 0%, rgba(10,15,30,.78) 100%)' }} />
                </>
              )}
              <div style={{ position: 'relative', padding: '20px 22px 22px', minHeight: selected.photo_url ? 188 : undefined, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 48, height: 6, background: 'rgba(255,255,255,.7)', borderRadius: 3 }} />
                <button onClick={() => setFiche(false)} style={{ position: 'absolute', top: 14, right: 16, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.35)', color: '#fff', fontSize: 18, cursor: 'pointer', backdropFilter: 'blur(4px)' }} aria-label="Fermer">✕</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 13, background: selected.photo_url ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, backdropFilter: 'blur(4px)' }}><IcoModule module={selected?.module ?? 'quiz'} size={24} /></span>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {selected.categorie && <span style={{ fontSize: 12, fontWeight: 800, background: 'rgba(255,255,255,.22)', padding: '4px 11px', borderRadius: 100, backdropFilter: 'blur(4px)' }}>{selected.categorie}</span>}
                    {identified && played.has(selected.id) && <span style={{ fontSize: 12, fontWeight: 800, background: '#16A34A', padding: '4px 11px', borderRadius: 100 }}>✓ Déjà joué</span>}
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15, textShadow: selected.photo_url ? '0 1px 8px rgba(0,0,0,.4)' : 'none' }}>{selected.nom}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 13, opacity: 0.95 }}>
                  <span style={{ fontWeight: 700 }}><Ico k="game" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{fu.label}</span>
                  {dist && <span>· <Ico k="pin" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{dist}</span>}
                </div>
              </div>
            </div>

            <div style={{ padding: '18px 22px 26px' }}>

              {/* Gains */}
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#5a6071', marginBottom: 11 }}>Ici, tu repars avec</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.gain_immediat && (
                  <div className="fe-card" style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#E9F7F0', color: '#0B6E50', borderRadius: 16, padding: '15px 16px' }}>
                    <span style={{ display: 'inline-flex' }}><Ico k="gift" size={28} /></span>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Tu gagnes direct</div>
                      <div style={{ fontSize: 17, fontWeight: 800 }}>{selected.gain_immediat}</div>
                    </div>
                  </div>
                )}
                {selected.gain_ticket !== false && (
                  <div className="fe-card" style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#EFF3FE', color: '#2c3a63', borderRadius: 16, padding: '15px 16px', animationDelay: '60ms' }}>
                    <span style={{ display: 'inline-flex' }}><Ico k="ticket" size={28} /></span>
                    <div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Pour le grand tirage</div>
                      <div style={{ fontSize: 17, fontWeight: 800 }}>+1 ticket (1 fois par jour)</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Infos pratiques */}
              {(selected.adresse || selected.horaires || selected.tel || selected.site_web) && (
                <div style={{ marginTop: 18, border: '1px solid #eef0f3', borderRadius: 16, overflow: 'hidden' }}>
                  {selected.adresse && (
                    <div style={{ display: 'flex', gap: 12, padding: '13px 15px', borderBottom: '1px solid #f1f2f5' }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}><Ico k="pin" size={18} /></span>
                      <div style={{ fontSize: 14, color: '#2b3242' }}>{selected.adresse}{dist ? ` · ${dist}` : ''}</div>
                    </div>
                  )}
                  {selected.horaires && (
                    <div style={{ display: 'flex', gap: 12, padding: '13px 15px', borderBottom: '1px solid #f1f2f5' }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}><Ico k="clock" size={18} /></span>
                      <div style={{ fontSize: 14, color: '#2b3242' }}>{selected.horaires}</div>
                    </div>
                  )}
                  {selected.tel && (
                    <a href={`tel:${selected.tel.replace(/\s/g, '')}`} style={{ display: 'flex', gap: 12, padding: '13px 15px', borderBottom: selected.site_web ? '1px solid #f1f2f5' : 'none', textDecoration: 'none' }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}><Ico k="phone" size={18} /></span>
                      <div style={{ fontSize: 14, color: HERO, fontWeight: 600 }}>{selected.tel}</div>
                    </a>
                  )}
                  {selected.site_web && (
                    <a href={selected.site_web} target="_blank" rel="noopener" style={{ display: 'flex', gap: 12, padding: '13px 15px', textDecoration: 'none' }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}><Ico k="globe" size={18} /></span>
                      <div style={{ fontSize: 14, color: HERO, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.site_web.replace(/^https?:\/\//, '')}</div>
                    </a>
                  )}
                </div>
              )}

              {/* Description */}
              {selected.description && (
                <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6, color: '#4a5160' }}>{selected.description}</div>
              )}

              {/* Rappel jeu sur place */}
              <div style={{ background: '#FAF6EE', color: '#7a5a1e', borderRadius: 16, padding: '13px 15px', fontSize: 13.5, lineHeight: 1.5, margin: '18px 0 14px' }}>
                <Ico k="pin" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Pour jouer, c&apos;est sur place : rends-toi au commerce et <strong>scanne son QR</strong>.
              </div>

              {/* Actions */}
              {typeof selected.lat === 'number' && typeof selected.lng === 'number' && (
                <a href={dirUrl(selected.lat, selected.lng)} target="_blank" rel="noopener" style={{ display: 'block', textAlign: 'center', background: HERO, color: '#fff', fontWeight: 800, fontSize: 16.5, padding: '16px', borderRadius: 16, textDecoration: 'none' }}>
                  Y aller · Itinéraire →
                </a>
              )}
              {(selected.tel || selected.site_web) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  {selected.tel && (
                    <a href={`tel:${selected.tel.replace(/\s/g, '')}`} style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#2b3242', fontWeight: 700, fontSize: 14.5, padding: '13px', borderRadius: 14, textDecoration: 'none', border: '1px solid #e3e5ea' }}><Ico k="phone" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Appeler</a>
                  )}
                  {selected.site_web && (
                    <a href={selected.site_web} target="_blank" rel="noopener" style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#2b3242', fontWeight: 700, fontSize: 14.5, padding: '13px', borderRadius: 14, textDecoration: 'none', border: '1px solid #e3e5ea' }}><Ico k="globe" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Site</a>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  )
}
