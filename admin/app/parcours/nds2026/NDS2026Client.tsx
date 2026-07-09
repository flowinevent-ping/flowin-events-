'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import { writeJoueur, claimJoueur, getJoueurLocal, lookupJoueurByEmail, fetchJoueurHistory, shuffle, AGE_OPTIONS, writeSondageBrigade, ndsQueueWrite, ndsFlushQueue } from '@/lib/parcours'
import { generateTicket } from '@/lib/ticket'
import { NDS_CSS, NDS_SPRITE } from '@/lib/nds2026Design'
import { supabase } from '@/lib/supabase'
import { trackVisite } from '@/lib/track'
import { buildInviteLink } from '@/lib/parrainage'
import type { ParcoursPageData, QuizQuestion, BonusQuestion } from '@/lib/parcours'

type Screen = 'onboard' | 'inscription' | 'quiz' | 'resultats' | 'bonus' | 'final' | 'tickets' | 'carte' | 'partenaires' | 'profil' | 'refusdigital'
interface Props extends ParcoursPageData { evId: string }

const SRC = ['Instagram', 'Affiche', 'Bouche à oreille', 'Autre']
const SRC_EMOJI: Record<string, string> = { 'Instagram': '📸', 'Affiche': '📋', 'Bouche à oreille': '🗣️', 'Autre': '✨' }

/* Consentement RGPD — versionné pour traçabilité de la preuve de consentement.
   Incrémenter la version à chaque modification du texte. */
const OPTIN_VERSION = 'nds-2026-v3'
const OPTIN_TEXT = "Je souhaite rester en contact avec les infos des Nuits du Sud et de Flowin. Mes coordonnées ne sont ni vendues ni cédées."

/* Logo partenaire robuste : si image_url est vide OU si le fichier est introuvable (404,
   logo pas encore fourni par le partenaire), on retombe proprement sur le fallback au lieu
   d'afficher une image cassée. Dès que le vrai PNG est déposé au chemin attendu, il s'affiche. */
function PartnerLogo({ src, alt, fallback, imgStyle, className }: { src: string | null; alt: string; fallback: ReactNode; imgStyle?: CSSProperties; className?: string }) {
  const [broken, setBroken] = useState(false)
  const loadedRef = useRef(false)
  useEffect(() => {
    loadedRef.current = false
    setBroken(false)
    if (!src) return
    // Réseau lent : si le logo n'a pas chargé après 6 s, on affiche le repli au lieu d'un blanc.
    const t = setTimeout(() => { if (!loadedRef.current) setBroken(true) }, 6000)
    return () => clearTimeout(t)
  }, [src])
  if (!src || broken) return <>{fallback}</>
  return <img src={src} alt={alt} className={className} style={imgStyle} loading="lazy" decoding="async" onLoad={() => { loadedRef.current = true }} onError={() => setBroken(true)} />
}

/* Les 9 stations numérotées du festival (= référentiel unique, identique au dashboard).
   Coords = vraies positions de la base (events ev-nds-* numérotés). Rafraîchies en live
   à l'entrée sur l'écran carte (voir useEffect plus bas). 1 ticket / station / jour. */
const STATIONS = [
  { id: 'ev-nds-caisse-1', nom: 'Caisse 1', ou: "À l'entrée, près de la billetterie", icon: 'i-ticket', lat: 43.722715, lng: 7.111389, msg: "Passe à la Caisse 1, à l'entrée, et flashe le QR sur place." },
  { id: 'ev-nds-caisse-2', nom: 'Caisse 2', ou: "À l'entrée, près de la billetterie", icon: 'i-ticket', lat: 43.722566, lng: 7.112381, msg: 'Passe à la Caisse 2 et flashe le QR sur place.' },
  { id: 'ev-nds-caisse-3', nom: 'Caisse 3', ou: "À l'entrée, près de la billetterie", icon: 'i-ticket', lat: 43.722172, lng: 7.110657, msg: 'Passe à la Caisse 3 et flashe le QR sur place.' },
  { id: 'ev-nds-bar-1', nom: 'Bar 1', ou: 'Au bar des Nuits du Sud', icon: 'i-glass', lat: 43.722488, lng: 7.111641, msg: 'Rends-toi au Bar 1 et flashe le QR.' },
  { id: 'ev-nds-bar-2', nom: 'Bar 2', ou: 'Au bar des Nuits du Sud', icon: 'i-glass', lat: 43.722465, lng: 7.111445, msg: 'Rends-toi au Bar 2 et flashe le QR.' },
  { id: 'ev-nds-ecrans', nom: "L'Écran", ou: "Sur l'écran géant, entre deux concerts", icon: 'i-monitor', lat: 43.722155, lng: 7.111708, msg: "Flashe au changement de scène, sur l'écran géant." },
  { id: 'ev-nds-tablette-1', nom: 'Brigade Verte 1', ou: 'Elle se balade dans le festival', icon: 'i-layers', lat: 43.722436, lng: 7.111748, msg: 'Trouve la Brigade Verte 1 et flashe son QR.' },
  { id: 'ev-nds-tablette-2', nom: 'Brigade Verte 2', ou: 'Elle se balade dans le festival', icon: 'i-layers', lat: 43.722564, lng: 7.111931, msg: 'Trouve la Brigade Verte 2 et flashe son QR.' },
  { id: 'ev-nds-tablette-3', nom: 'Brigade Verte 3', ou: 'Elle se balade dans le festival', icon: 'i-layers', lat: 43.722523, lng: 7.112175, msg: 'Trouve la Brigade Verte 3 et flashe son QR.' },
]

/* ── Tickets NDS ───────────────────────────────────────────────────────────────
   Règle : 1 ticket / station / JOUR. Le droit au ticket d'une station se remet à
   zéro chaque jour (on peut rejouer au même endroit le lendemain), MAIS le cumul
   des tickets gagnés est conservé à vie (ledger monotone, jamais remis à zéro). */
function ndsYmd(): string {
  const d = new Date()
  const p = (n: number) => (n < 10 ? '0' + n : '' + n)
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}
/* Référentiel consolidé : chaque QR numéroté EST sa propre station (1 ticket/station/jour).
   On ne regroupe plus en familles. Compat : un ancien id groupé renvoie vers la 1re
   station numérotée correspondante (au cas où un vieux QR/lien serait encore scanné). */
function ndsFamily(id: string): string {
  if (id === 'ev-nds-caisses') return 'ev-nds-caisse-1'
  if (id === 'ev-nds-bar') return 'ev-nds-bar-1'
  if (id === 'ev-nds-tablette') return 'ev-nds-tablette-1'
  return id
}
const NDS_LEDGER = 'flowin_nds_ledger'
function ndsLedgerGet(): string[] {
  try { const r = localStorage.getItem(NDS_LEDGER); return r ? (JSON.parse(r) as string[]) : [] } catch { return [] }
}
function ndsLedgerAdd(key: string): number {
  try {
    const l = ndsLedgerGet()
    if (l.indexOf(key) === -1) { l.push(key); localStorage.setItem(NDS_LEDGER, JSON.stringify(l)) }
    return l.length
  } catch { return 1 }
}
/* Cumul des tickets gagnés depuis toujours (≥ 1 pour l'affichage). */
function ndsCumul(): number { return Math.max(1, ndsLedgerGet().length) }
/* Cette famille de station a-t-elle déjà été jouée AUJOURD'HUI ? */
function ndsPlayedToday(famId: string): boolean {
  try { return localStorage.getItem('flowin_played_' + famId + '_' + ndsYmd()) != null } catch { return false }
}
/* Migration unique des anciennes clés permanentes (flowin_played_* / flowin_bonus_*
   sans suffixe de date) vers le ledger, pour ne pas faire régresser le cumul d'un
   appareil de test déjà utilisé. */
function ndsMigrateLegacy(): void {
  try {
    if (localStorage.getItem('flowin_nds_migrated')) return
    const dateSuffix = /_\d{4}-\d{2}-\d{2}$/
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (k.indexOf('flowin_played_') === 0 && !dateSuffix.test(k)) {
        ndsLedgerAdd(ndsFamily(k.slice('flowin_played_'.length)) + '@legacy')
      } else if (k.indexOf('flowin_bonus_') === 0) {
        ndsLedgerAdd('b:' + ndsFamily(k.slice('flowin_bonus_'.length)) + '@legacy')
      }
    }
    localStorage.setItem('flowin_nds_migrated', '1')
  } catch {}
}

/* Commerce partenaire affiché sur la carte (vue v_nds_commerces_carte : déjà filtrée actif/visible) */
type Commerce = {
  id: string; nom: string; pack: string | null
  latitude: number; longitude: number
  image_url: string | null; en_avant: boolean | null
  ville: string | null; adresse: string | null
  site_web: string | null; instagram: string | null; facebook: string | null
  promo_text: string | null; tickets_par_scan: number | null; ordre_carte: number | null
}

const CONFETTI_PIECES = Array.from({ length: 20 }).map((_, i) => ({ l: (i * 5.3 + (i % 4) * 2) % 100, d: (i % 7) * 0.09, c: ['#E0218A', '#22D3C6', '#F5B544', '#7C2D92', '#10b981'][i % 5] }))

export default function NDS2026Client({ ev, lots, partenaires, banques, evId }: Props) {
  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>
  const nom = ev?.nom ?? 'Nuits du Sud'
  const allQs = banques.flatMap(b => b.questions ?? [])
  const customQs = (cfg.customQuestions ?? []) as QuizQuestion[]
  const nbQ = (cfg.quizNbQuestions as number) ?? 4
  const bonusQs = (cfg.quizBonusList ?? []) as BonusQuestion[]
  const lotNom = (cfg.lotNom as string) || '3 places offertes'
  const lotDesc = (cfg.lotDesc as string) || 'Pour ton prochain concert'
  const lotResume = (cfg.lotResume as string) || '3 places pour ton prochain concert'
  const lot2Nom = (cfg.lot2Nom as string) || "Bons d'achat partenaires"
  const lot2Desc = (cfg.lot2Desc as string) || 'Au grand tirage de fin de festival'
  const tirageHeure = (cfg.tirageHeure as string) || '12h30'

  const [questions, setQuestions] = useState<QuizQuestion[]>(() => shuffle([...allQs, ...customQs]).slice(0, nbQ))
  // Anti-répétition : historique du joueur reconnu (device local), chargé en tâche de fond dès le montage.
  // Reste vide (comportement actuel inchangé) pour tout joueur non reconnu — aucune régression possible.
  const [joueurHistory, setJoueurHistory] = useState<{ answeredQuizIds: string[]; bonusDone: boolean }>({ answeredQuizIds: [], bonusDone: false })
  useEffect(() => {
    const jid = getJoueurLocal()?.id
    if (!jid) return
    fetchJoueurHistory(jid).then(setJoueurHistory).catch(() => { /* best-effort, pas de blocage */ })
  }, [])
  // Retire du tirage les questions déjà vues par ce joueur (tout le festival). Si le stock restant
  // est insuffisant pour composer un jeu complet, on retombe sur le pool entier (jamais moins de nbQ).
  function drawQuestions(): QuizQuestion[] {
    const pool = [...allQs, ...customQs]
    const fresh = pool.filter(q => !joueurHistory.answeredQuizIds.includes(q.id))
    const source = fresh.length >= nbQ ? fresh : pool
    return shuffle(source).slice(0, nbQ)
  }
  const [screen, setScreen] = useState<Screen>('onboard')
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', tel: '', age: '', cp: '', source: '', sexe: '', optin: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ticket, setTicket] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [emailKnown, setEmailKnown] = useState<{ prenom?: string; alreadyPlayed: boolean } | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [bonusAnswers, setBonusAnswers] = useState<Record<string, string | string[]>>({})
  const [quizAnswers, setQuizAnswers] = useState<{ qid: string; texte: string; choix: number; reponse: string; bonne: number; correct: boolean }[]>([])
  const [bonusIdx, setBonusIdx] = useState(0)
  const [bonusDone, setBonusDone] = useState(false)
  const sondageAnonSaved = useRef(false)
  const [sheetPart, setSheetPart] = useState<number | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapObjRef = useRef<unknown>(null)
  const [placeMode, setPlaceMode] = useState(false)
  const [isDigitalLink] = useState<boolean>(() => { try { return (new URLSearchParams(window.location.search).get('source') || '').startsWith('reseaux-') } catch { return false } })
  const [sessionStart] = useState<string>(() => new Date().toISOString())
  const [geo, setGeo] = useState<Record<string, { lat: number; lng: number }>>({})
  const geoRef = useRef<Record<string, { lat: number; lng: number }>>({})

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('place') === '1') { setPlaceMode(true); setScreen('carte'); return }
      if ((sp.get('source') || '').startsWith('reseaux-') && getJoueurLocal()) { setScreen('refusdigital'); return }
      // On a flashé une station (QR) ou on arrive par la carte : on saute l'écran d'accueil -> direct au quiz.
      // Exceptions : station déjà jouée aujourd'hui (on garde le récap « déjà flashé ») ou station sans quiz.
      let alreadyPlayed = false
      try { alreadyPlayed = localStorage.getItem(lsKey) != null } catch {}
      if (!alreadyPlayed && questions.length > 0) setScreen('quiz')
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Log du scan/ouverture parcours NDS — alimente l'entonnoir (scans -> jeux -> coordonnées)
  useEffect(() => { trackVisite('nds2026', evId) }, [evId])
  const [recurrent, setRecurrent] = useState<{ id: string; email: string; prenom?: string } | null>(null)
  // Popup reconnaissance « Déjà inscrit ? » — s'affiche au milieu du quiz après le flash
  const [recoOpen, setRecoOpen] = useState(false)
  const [recoAsked, setRecoAsked] = useState(false)
  const [recoMode, setRecoMode] = useState<'ask' | 'email'>('ask')
  const [recoEmail, setRecoEmail] = useState('')
  const [recoBusy, setRecoBusy] = useState(false)
  const [recoMsg, setRecoMsg] = useState<string | null>(null)
  const [ticketCount, setTicketCount] = useState(1)
  const [fly, setFly] = useState(0)
  const [celebrate, setCelebrate] = useState(0)
  const refreshServerTickets = useCallback(async (jid?: string | null) => {
    const id = jid || recurrent?.id || getJoueurLocal()?.id
    if (!id) return
    try {
      const { count } = await supabase.from('se_tickets').select('id', { count: 'exact', head: true }).eq('joueur_id', id).eq('super_event_id', 'se-nds-2026')
      if (typeof count === 'number' && count > 0) setTicketCount(count)
    } catch { /* hors-ligne : garde le cumul local */ }
  }, [recurrent])
  const [scanOpen, setScanOpen] = useState(false)
  const [scanErr, setScanErr] = useState(false)
  const [scanTarget, setScanTarget] = useState<{ id?: string; nom: string; lat?: number; lng?: number; msg?: string; ou?: string; done?: boolean } | null>(null)
  const [mapView, setMapView] = useState<'stations' | 'partenaires'>('stations')
  const [commerces, setCommerces] = useState<Commerce[]>([])
  const [bandPartners, setBandPartners] = useState<{ id: string; nom: string; image_url: string | null; emoji: string | null }[]>([])
  const [fiche, setFiche] = useState<Commerce | null>(null)
  // Bandeau partenaires : placeholders « Votre logo ici » tant que les partenaires ne sont pas validés (avec logo) dans le dashboard.
  const bandReal = bandPartners.filter(p => p.image_url)
  const bandUnit: { id: string; nom: string; image_url: string | null }[] = bandReal.length
    ? bandReal.map(p => ({ id: p.id, nom: p.nom, image_url: p.image_url }))
    : Array.from({ length: 6 }).map((_, i) => ({ id: `ph-${i}`, nom: 'Votre logo ici', image_url: null }))
  const bandTrack = [...bandUnit, ...bandUnit]
  const scanVideoRef = useRef<HTMLVideoElement | null>(null)

  const lsKey = `flowin_played_${ndsFamily(evId)}_${ndsYmd()}`

  useEffect(() => {
    ndsMigrateLegacy()
    try { const s = localStorage.getItem(lsKey); if (s) { setSaved(true); if (s !== 'played') setTicket(s) } } catch {}
    // Profil déjà enregistré (autre station / session précédente) -> mode récurrent
    const prof = getJoueurLocal()
    if (prof) {
      setRecurrent(prof)
      setForm(f => ({ ...f,
        prenom: prof.prenom || f.prenom, nom: prof.nom || f.nom,
        email: prof.email || f.email, tel: prof.tel || f.tel,
        cp: prof.cp || f.cp, age: prof.age || f.age, sexe: prof.genre || f.sexe }))
    }
    // Cumul des tickets gagnés à vie (jamais remis à zéro)
    try { setTicketCount(ndsCumul()) } catch {}
  }, [lsKey])

  // Popup « Déjà inscrit ? » : à l'arrivée sur le quiz, si le joueur n'est pas déjà
  // reconnu (localStorage/email) et qu'on ne l'a pas encore demandé cette session.
  useEffect(() => {
    if ((screen === 'quiz' || screen === 'bonus') && !recurrent && !recoAsked && !saved) {
      setRecoMode('ask'); setRecoMsg(null); setRecoOpen(true)
    }
  }, [screen, recurrent, recoAsked, saved])



  // Scanner QR in-app (caméra + jsQR) — flasher le QR d'une station sans sortir du jeu
  useEffect(() => {
    if (!scanOpen) return
    setScanErr(false)
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    type JsQRFn = (d: Uint8ClampedArray, w: number, h: number) => { data: string } | null

    function loadJsQR(): Promise<JsQRFn> {
      const w = window as unknown as { jsQR?: JsQRFn }
      if (w.jsQR) return Promise.resolve(w.jsQR)
      return new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://unpkg.com/jsqr@1.4.0/dist/jsQR.js'
        s.onload = () => resolve((window as unknown as { jsQR: JsQRFn }).jsQR)
        s.onerror = reject
        document.head.appendChild(s)
      })
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        const video = scanVideoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        const jsQR = await loadJsQR()
        const tick = () => {
          if (stopped) return
          if (video.readyState >= 2 && ctx && video.videoWidth) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(img.data, img.width, img.height)
            if (code && code.data) {
              const m = code.data.match(/ev=(ev-nds-[a-z0-9-]+)/i)
              if (m) { stopped = true; window.location.href = `/parcours/nds2026?ev=${m[1]}`; return }
            }
          }
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      } catch {
        setScanErr(true)
      }
    }
    start()
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [scanOpen])

  // Commerces partenaires (vue v_nds_commerces_carte) : chargés à l'entrée sur l'écran carte
  useEffect(() => {
    if (screen !== 'carte' || commerces.length) return
    let cancelled = false
    supabase.from('v_nds_commerces_carte').select('*').then(({ data }) => {
      if (cancelled) return
      const rows = (data ?? []) as Commerce[]
      setCommerces(rows.filter(c => c.latitude != null && c.longitude != null))
    })
    return () => { cancelled = true }
  }, [screen, commerces.length])

  // Positions des 4 stations carte : resync depuis la base (events) -> alignées sur le dashboard
  useEffect(() => {
    if (screen !== 'carte' || placeMode) return
    let cancelled = false
    const fams = STATIONS.map(s => s.id)
    supabase.from('events').select('id,lat,lng').in('id', fams).then(({ data }) => {
      if (cancelled || !data) return
      const next = { ...geoRef.current }
      ;(data as { id: string; lat: number | null; lng: number | null }[]).forEach(r => {
        if (r.lat != null && r.lng != null) next[r.id] = { lat: r.lat, lng: r.lng }
      })
      geoRef.current = next
      setGeo({ ...next })
    })
    return () => { cancelled = true }
  }, [screen, placeMode])

  // Bandeau partenaires défilant (dock au-dessus du nav, sur tous les écrans) : uniquement les partenaires ayant choisi la formule bandeau (bandeau=true) et actifs
  useEffect(() => {
    let cancelled = false
    supabase.from('partenaires').select('id,nom,image_url,emoji,actif,bandeau').then(({ data }) => {
      if (cancelled) return
      const rows = ((data ?? []) as { id: string; nom: string; image_url: string | null; emoji: string | null; actif: boolean | null; bandeau: boolean | null }[]).filter(p => p.actif !== false && p.bandeau === true)
      setBandPartners(rows.map(p => ({ id: p.id, nom: p.nom, image_url: p.image_url, emoji: p.emoji })))
    })
    return () => { cancelled = true }
  }, [])

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

      // Stations : jaune = validé (joué) · vert clignotant = à jouer · ★ = station courante
      if (mapView === 'stations' || placeMode) STATIONS.forEach(st => {
        const cur = st.id === ndsFamily(evId)
        let done = false
        try { done = ndsPlayedToday(st.id) } catch {}
        const bg = done ? '#F5B544' : '#16a34a'
        const cls = done ? '' : 'nds-mk-pulse'
        const mark = cur ? '★' : (done ? '✓' : '')
        const html = `<div class="${cls}" style="width:24px;height:24px;border-radius:50%;background:${bg};border:2px solid #fff;box-shadow:0 2px 7px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px">${mark}</div>`
        const icon = LL.divIcon({ html, className: '', iconSize: [24, 24], iconAnchor: [12, 12] })
        const g0 = geoRef.current[st.id]
        const mk = LL.marker([g0 ? g0.lat : st.lat, g0 ? g0.lng : st.lng], { icon, draggable: placeMode }).addTo(map)
        if (placeMode) {
          mk.on('dragend', (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
            const ll = e.target.getLatLng()
            geoRef.current = { ...geoRef.current, [st.id]: { lat: ll.lat, lng: ll.lng } }
            setGeo({ ...geoRef.current })
          })
        } else {
          mk.on('click', () => { if (cur) setScreen('onboard'); else setScanTarget({ id: st.id, nom: st.nom, lat: st.lat, lng: st.lng, msg: st.msg, ou: st.ou, done }) })
        }
      })

      // Commerces partenaires actifs (vue v_nds_commerces_carte) : clic -> fiche
      if (mapView === 'partenaires') commerces.forEach(c => {
        const big = !!c.en_avant
        const sz = big ? 30 : 24
        let cdone = false
        try { cdone = ndsPlayedToday(ndsFamily('ev-nds-' + c.id.replace(/^pt-/, ''))) } catch {}
        const cbg = cdone ? '#F5B544' : '#16a34a'
        const ccls = cdone ? '' : 'nds-mk-pulse'
        const html = `<div class="${ccls}" style="width:${sz}px;height:${sz}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${cbg};border:2px solid #fff;box-shadow:0 3px 9px rgba(0,0,0,.3)"></div>`
        const icon = LL.divIcon({ html, className: '', iconSize: [sz, sz], iconAnchor: [sz / 2, sz] })
        LL.marker([c.latitude, c.longitude], { icon }).addTo(map).on('click', () => setFiche(c))
      })
      // Position du joueur (géoloc) — affichée sur les deux vues
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          if (cancelled || mapObjRef.current !== map) return
          const uhtml = '<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25)"></div>'
          const uicon = LL.divIcon({ html: uhtml, className: '', iconSize: [18, 18], iconAnchor: [9, 9] })
          LL.marker([pos.coords.latitude, pos.coords.longitude], { icon: uicon, zIndexOffset: 1000 }).addTo(map).bindPopup('Tu es ici')
        }, () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 })
      }
      setTimeout(() => { try { map.invalidateSize() } catch {} }, 120)
    }).catch(() => { /* CDN bloqué : la liste de stations reste affichée en fallback */ })

    return () => {
      cancelled = true
      if (mapObjRef.current) { try { (mapObjRef.current as { remove: () => void }).remove() } catch {} mapObjRef.current = null }
    }
  }, [screen, evId, commerces, mapView, placeMode])

  const handleAnswer = useCallback((idx: number) => {
    if (answered) return
    setSelected(idx); setAnswered(true)
    const cur = questions[qIdx]
    if (cur) {
      if (idx === cur.bonne) setScore(s => s + 1)
      setQuizAnswers(a => [...a, { qid: cur.id, texte: cur.texte, choix: idx, reponse: cur.options[idx] ?? '', bonne: cur.bonne, correct: idx === cur.bonne }])
    }
  }, [answered, qIdx, questions])

  const goNext = useCallback(() => {
    if (qIdx + 1 < questions.length) { setQIdx(i => i + 1); setSelected(null); setAnswered(false) }
    else setScreen('resultats')
  }, [qIdx, questions])

  // Reconnaissance par email (Tâche 4) : pré-remplissage + route claimJoueur (ticket par compte, pas par appareil)
  async function onEmailBlur(): Promise<void> {
    const em = form.email.trim()
    if (em.indexOf('@') === -1 || recurrent || lookingUp) return
    setLookingUp(true)
    try {
      const j = await lookupJoueurByEmail(em, evId)
      if (j) {
        setRecurrent({ id: j.id, email: j.email, prenom: j.prenom })
        setForm(f => ({ ...f,
          prenom: j.prenom || f.prenom, nom: j.nom || f.nom, tel: j.tel || f.tel,
          cp: j.cp || f.cp, age: j.age || f.age, sexe: j.genre || f.sexe }))
        setEmailKnown({ prenom: j.prenom, alreadyPlayed: j.alreadyPlayed })
        if (isDigitalLink) setScreen('refusdigital')
      } else { setEmailKnown(null) }
    } catch { /* silencieux */ }
    setLookingUp(false)
  }

  // Popup reconnaissance : valider l'email -> retrouve le compte (reconnu = formulaire de fin sauté)
  async function recoSubmitEmail(): Promise<void> {
    const em = recoEmail.trim()
    if (em.indexOf('@') === -1 || recoBusy) { setRecoMsg('Entre un email valide.'); return }
    setRecoBusy(true); setRecoMsg(null)
    try {
      const j = await lookupJoueurByEmail(em, evId)
      if (j) {
        setRecurrent({ id: j.id, email: j.email, prenom: j.prenom })
        setForm(f => ({ ...f,
          prenom: j.prenom || f.prenom, nom: j.nom || f.nom, email: j.email || em, tel: j.tel || f.tel,
          cp: j.cp || f.cp, age: j.age || f.age, sexe: j.genre || f.sexe, optin: true }))
        setEmailKnown({ prenom: j.prenom, alreadyPlayed: j.alreadyPlayed })
        setRecoOpen(false); setRecoAsked(true)
        if (isDigitalLink) { setScreen('refusdigital'); setRecoBusy(false); return }
      } else {
        setRecoMsg("On ne te trouve pas avec cet email. Tu pourras t'inscrire à la fin du quiz.")
      }
    } catch { setRecoMsg('Connexion impossible, réessaie.') }
    setRecoBusy(false)
  }

  function recoDismiss(): void { setRecoOpen(false); setRecoAsked(true); setRecoMode('ask'); setRecoEmail(''); setRecoMsg(null) }

  async function submitInscription() {
    const errs: Record<string, string> = {}
    // Compte reconnu (recurrent) : profil déjà connu -> pas besoin de re-remplir prénom/nom
    if (!recurrent && !form.prenom.trim()) errs.prenom = 'Requis'
    if (!recurrent && !form.nom.trim()) errs.nom = 'Requis'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    // Coordonnées : tous les champs obligatoires (seul l'opt-in marketing reste facultatif — RGPD).
    if (!form.tel.trim()) errs.tel = 'Requis'
    if (!form.cp.trim()) errs.cp = 'Requis'
    if (!form.age) errs.age = 'Requis'
    if (!form.sexe) errs.sexe = 'Requis'
    setErrors(errs)
    if (Object.keys(errs).length) return
    await persist()
    setScreen('final')
  }

  // Tickets NDS : 1 ticket si quiz parfait (4/4) + 1 ticket si question bonus faite -> jusqu'à 2/station/jour
  const quizPerfect = questions.length === 0 || score >= questions.length
  useEffect(() => { if ((screen === 'resultats' || screen === 'final') && (quizPerfect || bonusDone)) { setFly(f => f + 1); setCelebrate(c => c + 1) } }, [screen, quizPerfect, bonusDone])
  useEffect(() => { if (screen === 'tickets' || screen === 'final' || (screen === 'onboard' && saved)) refreshServerTickets() }, [screen, saved, refreshServerTickets])

  // Écritures en attente (réseau coupé lors d'un jeu) : on rejoue au montage puis à chaque retour du réseau.
  useEffect(() => {
    ndsFlushQueue()
    const onOnline = () => { ndsFlushQueue() }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  // Cache hors-ligne (service worker chirurgical) — ACTIF, restreint au jeu (scope /parcours/).
  // Ne touche PAS le dashboard/brigade/carte. Kill-switch: KILL=true dans public/sw.js (~2 min à se propager).
  const ENABLE_SW = true
  useEffect(() => {
    if (!ENABLE_SW) return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/parcours/' }).catch(() => {})
  }, [ENABLE_SW])

  // Écriture distante isolée (réutilisée par persist + retry) — Tâche 5
  async function remoteWrite(tc: string, quizTk: boolean, bonusTk: boolean): Promise<{ success: boolean; duplicate: boolean; ticket: string; error?: string }> {
    const qrSource = (() => { try { return new URLSearchParams(window.location.search).get('source') || undefined } catch { return undefined } })()
    return recurrent
      ? await claimJoueur(recurrent, evId, 'ND', bonusAnswers, { quiz_reponses: quizAnswers, score: `${score}/${questions.length}`, decouverte: form.source || undefined, source_qr: qrSource, started_at: sessionStart, quizTicket: quizTk, bonusTicket: bonusTk })
      : await writeJoueur({
          email: form.email, prenom: form.prenom, nom: form.nom, tel: form.tel,
          code_postal: form.cp, age_tranche: form.age, genre: form.sexe || undefined, decouverte: form.source || undefined,
          score_moy: `${score}/${questions.length}`, events: [evId], ticket_code: tc,
          source: 'nds2026', source_qr: qrSource ?? null, started_at: sessionStart, prefix: 'ND', bonus_reponses: bonusAnswers, quiz_reponses: quizAnswers,
          optin: form.optin, optin_version: OPTIN_VERSION, quiz_ticket: quizTk, bonus_ticket: bonusTk,
        })
  }

  async function persist(bonusOverride?: boolean): Promise<string> {
    if (saved) return ticket
    setSaving(true)
    // 2 tickets possibles : quiz (4/4) + bonus. bonusOverride force l'état frais quand le bonus vient d'être validé.
    // Sans quiz (banque vide = brigade sondage), aucun ticket quiz : seul le sondage/bonus rapporte le point.
    const quizTk = questions.length > 0 && quizPerfect
    const bonusTk = bonusOverride ?? bonusDone
    const tc = generateTicket('ND')
    setTicket(tc)
    setSaved(true)
    try {
      // Marqueur "joué aujourd'hui" (anti-rejeu), distinct du compteur de tickets
      localStorage.setItem(lsKey, (quizTk || bonusTk) ? tc : 'played')
      // Cumul tickets sur tout le festival : 1 entrée par ticket gagné (quiz / bonus), par station, par jour
      if (quizTk) ndsLedgerAdd(ndsFamily(evId) + '@' + ndsYmd())
      if (bonusTk) ndsLedgerAdd('b:' + ndsFamily(evId) + '@' + ndsYmd())
      setTicketCount(ndsCumul())
    } catch {}

    let res = await remoteWrite(tc, quizTk, bonusTk)
    if (!res.success && !res.duplicate) { res = await remoteWrite(tc, quizTk, bonusTk) } // 1 réessai auto
    setSaving(false)
    const finalTicket = res.ticket || tc
    if (finalTicket !== tc) {
      setTicket(finalTicket)
      try { if (quizTk || bonusTk) localStorage.setItem(lsKey, finalTicket) } catch {}
    }
    const ok = res.success || res.duplicate
    setSaveError(!ok)
    if (!ok) {
      // File d'attente durable : rejeu auto au retour du réseau (idempotent : dédup jour/station côté serveur).
      const qrSrc = (() => { try { return new URLSearchParams(window.location.search).get('source') || undefined } catch { return undefined } })()
      if (recurrent) {
        ndsQueueWrite({ kind: 'claim', joueur: { id: recurrent.id, email: recurrent.email, prenom: recurrent.prenom }, evId, prefix: 'ND', bonus: bonusAnswers, extra: { quiz_reponses: quizAnswers, score: `${score}/${questions.length}`, decouverte: form.source || undefined, source_qr: qrSrc, started_at: sessionStart, quizTicket: quizTk, bonusTicket: bonusTk } })
      } else {
        ndsQueueWrite({ kind: 'write', payload: { email: form.email, prenom: form.prenom, nom: form.nom, tel: form.tel, code_postal: form.cp, age_tranche: form.age, genre: form.sexe || undefined, decouverte: form.source || undefined, score_moy: `${score}/${questions.length}`, events: [evId], ticket_code: tc, source: 'nds2026', source_qr: qrSrc ?? null, started_at: sessionStart, prefix: 'ND', bonus_reponses: bonusAnswers, quiz_reponses: quizAnswers, optin: form.optin, optin_version: OPTIN_VERSION, quiz_ticket: quizTk, bonus_ticket: bonusTk } })
      }
      console.error('[nds2026] enregistrement Supabase échoué — mis en file d\'attente (réessai auto):', res.error)
    }
    return finalTicket
  }

  // Réessai manuel depuis la bannière d'erreur — Tâche 5
  async function retrySave(): Promise<void> {
    if (saving) return
    setSaving(true)
    const tc = ticket || generateTicket('ND')
    const res = await remoteWrite(tc, questions.length > 0 && quizPerfect, bonusDone)
    setSaving(false)
    const ok = res.success || res.duplicate
    setSaveError(!ok)
    if (ok) {
      const ft = res.ticket || tc
      if (ft !== tc) { setTicket(ft); try { localStorage.setItem(lsKey, ft) } catch {} }
    }
  }

  async function finaliser() {
    // Profil déjà connu (récurrent) -> on enregistre directement, sinon on demande le profil
    if (recurrent) { await persist(); setScreen('final') }
    else setScreen('inscription')
  }

  async function finishBonus() {
    setBonusDone(true)
    // Stats RSE anonymes (zéro PII) : on enregistre les réponses dès la fin du sondage,
    // que la personne s'inscrive ensuite ou non. Gated par cfg.sondageAnonyme (brigade only).
    if (cfg.sondageAnonyme && !sondageAnonSaved.current) {
      sondageAnonSaved.current = true
      await writeSondageBrigade(evId, bonusAnswers)
    }
    // Le bonus rapporte le ticket si le quiz ne l'a pas déjà donné (1 ticket/station/jour) -> persist(true)
    if (recurrent) { await persist(true); setScreen('final') }
    else setScreen('inscription')
  }

  const q = questions[qIdx]
  const navOn = screen === 'final' || screen === 'tickets' || screen === 'carte' || screen === 'partenaires' || screen === 'profil' || (screen === 'onboard' && saved)
  const bandOn = screen !== 'inscription' && screen !== 'bonus'

  function setSource(s: string) { setForm(f => ({ ...f, source: s })) }

  // Tracking clic partenaire : qui (joueur) · quel partenaire · quel lien · quelle station · quand
  function logClicPartenaire(partenaireId: string, lienKey: string, url: string | null) {
    if (!url) return
    try {
      const jid = recurrent?.id || getJoueurLocal()?.id || null
      void supabase.from('partenaire_clics').insert({
        partenaire_id: partenaireId, event_id: evId, lien_key: lienKey, url, joueur_id: jid,
      })
    } catch { /* best-effort, ne bloque jamais l'ouverture du lien */ }
  }
  const shareParrainage = async () => {
    const email = (form.email || recurrent?.email || '').trim().toLowerCase()
    if (email.indexOf('@') === -1) return
    const extId = 'j-nd-' + email.replace(/[^a-z0-9]/g, '-').substring(0, 36)
    const link = buildInviteLink(`/parcours/nds2026?ev=${evId}`, extId, evId, 'wa') + '&source=parrainage'
    const txt = `Je joue au Grand Jeu des Nuits du Sud \u{1F3B6} Rejoins-moi, joue et tente de gagner des places de concert ! ${link}`
    setCelebrate(c => c + 1)
    try {
      if (typeof navigator !== 'undefined' && navigator.share) { await navigator.share({ title: 'Le Grand Jeu des Nuits du Sud', text: txt }) }
      else { window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank') }
    } catch { /* annule */ }
  }
  function nb(target: Screen) { setSheetPart(null); setScreen(target) }

  // Bandeau partenaires (inline, collé au contenu) — réutilisé en bas de plusieurs écrans
  const partnerBand = (
    <div className="logoband logoband-inline" onClick={() => nb('partenaires')} style={{ cursor: 'pointer' }} aria-label="Espace partenaires">
      <div className="logotrack">
        {bandTrack.map((p, i) => (
          <span className={`logoslot${p.image_url ? '' : ' logoslot-ph'}`} key={`bd-${p.id}-${i}`}>
            <PartnerLogo src={p.image_url} alt={p.nom} fallback={'Votre logo ici'} />
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <div className="ndsbody">
      {fly > 0 && <div key={fly} className="ticketfly" aria-hidden="true">+1&#8239;🎟️</div>}
      {celebrate > 0 && (
        <div className="confetti-wrap" key={celebrate} aria-hidden="true">
          {CONFETTI_PIECES.map((pc, i) => <span key={i} className="confetti-pc" style={{ left: `${pc.l}%`, background: pc.c, animationDelay: `${pc.d}s` }} />)}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');" + NDS_CSS + `
        html,body{height:auto !important;min-height:100dvh !important;max-height:none !important;overflow-x:hidden !important;overflow-y:auto !important;display:block !important;padding:0 !important;background:#160820}
        .ndsbody{width:100%;min-height:100vh;min-height:100dvh;display:block;background:#fff;font-family:'Manrope',system-ui,sans-serif;color:#1a1226;padding:0}
        .ndsbody .phone{overflow:visible !important}
        .ndsbody .phone{width:100%;max-width:480px;margin:0 auto;min-height:100vh;min-height:100dvh;background:#160820;position:relative;display:flex;flex-direction:column;overflow:hidden}
        .ndsbody .scr{position:static !important;inset:auto !important;display:flex !important;flex-direction:column;flex:1;min-height:0;width:100%}
        .ndsbody .scr>.stage{flex:1 0 auto;display:flex;flex-direction:column;justify-content:center}
        .ndsbody .scr#carteScr,.ndsbody .scr.carte{position:relative !important;min-height:70vh;width:100%}
        .ndsbody .padnav{padding-bottom:192px}
        .ndsbody .nav{position:sticky;bottom:0}
        .ndsbody .botdock{position:sticky;bottom:0;z-index:40;background:#fff;box-shadow:0 -6px 18px rgba(20,8,30,.07)}
        .ndsbody .botdock .nav{position:static;box-shadow:none}
        .ndsbody .botdock .logoband{border-left:none;border-right:none;border-radius:0}
        .ndsbody .footdock{position:sticky;bottom:0;z-index:1000;display:flex;flex-direction:column;width:100%}
        .ndsbody .footdock .nav{position:static}
        .ndsbody .logoband-dock{margin:0;border-radius:0;border-left:0;border-right:0;border-bottom:0;border-top:1px solid #ece7f2;background:rgba(255,255,255,.97)}
        .ndsbody .map-fake{flex:1;width:100%;min-height:340px;background:linear-gradient(160deg,#241233,#3a1450);position:relative}
        @keyframes ndsMk{0%,100%{box-shadow:0 3px 10px rgba(0,0,0,.35),0 0 0 0 rgba(22,163,74,.7)}50%{box-shadow:0 3px 10px rgba(0,0,0,.35),0 0 0 9px rgba(22,163,74,0)}}
        .nds-mk-pulse{animation:ndsMk 1.2s infinite}
        .ndsbody .stdot{width:14px;height:14px;border-radius:50%;flex-shrink:0;border:1.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.18)}
        .ndsbody .stdot-done{background:#F5B544}
        .ndsbody .stdot-todo{background:#16a34a;animation:ndsMk 1.2s infinite}
        .ndsbody .map-real{position:absolute;inset:0;width:100%;height:100%;z-index:1}
        .ndsbody .map-list{position:absolute;left:14px;right:14px;bottom:14px;z-index:600;display:flex;flex-direction:column;align-items:stretch;gap:10px}
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
        .ndsbody .pt-sheet2{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:480px;z-index:1300;max-height:82vh;overflow-y:auto;background:#fff;color:#1a1020;border-radius:22px 22px 0 0;padding:22px 20px calc(30px + env(safe-area-inset-bottom));box-shadow:0 -8px 40px rgba(0,0,0,.3)}
        .ndsbody .pt-dim2{position:fixed;inset:0;background:rgba(10,4,16,.55);z-index:1250}
        .ndsbody .sh-row{display:flex;align-items:center;gap:9px;margin-top:10px;text-decoration:none;color:var(--purple);font-weight:700;font-size:14px}
        .ndsbody .opt.correct{border-color:#16a34a !important;background:rgba(22,163,74,.18) !important;color:#fff}
        .ndsbody .opt.wrong{border-color:#ef4444 !important;background:rgba(239,68,68,.18) !important;color:#fff}
        .ndsbody .opt.correct::after{content:'✓';float:right;font-weight:800;color:#4ade80}
        .ndsbody .opt.wrong::after{content:'✕';float:right;font-weight:800;color:#f87171}
        .ndsbody .qexpl{margin-top:4px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.5;color:rgba(255,255,255,.9)}
        .ndsbody .qexpl b{color:#4ade80}
        /* A — fond blanc partout (couleurs uniquement, dimensions inchangees) */
        .ndsbody .phone{background:#fff !important}
        .ndsbody .scr.purple{background:#fff !important}
        .ndsbody .stage{background:#fff !important;flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0}
        .ndsbody .prize{background:#fff !important;border:1px solid #ece7f2 !important;box-shadow:0 8px 26px rgba(30,16,46,.10) !important;backdrop-filter:none !important;-webkit-backdrop-filter:none !important}
        .ndsbody .prize .lbl{color:#9a8fa6 !important}
        .ndsbody .prize .nm{color:#1a1226 !important}
        .ndsbody .prize .div{background:#ece7f2 !important}
        .ndsbody .prize .tir{color:#52455e !important}
        .ndsbody .qcard{background:#fff !important;border:1px solid #ece7f2 !important}
        .ndsbody .qtxt{color:#1a1226 !important}
        .ndsbody .opt{background:#faf7fd !important;border-color:#e7def0 !important;color:#1a1226 !important}
        .ndsbody .opt.sel{border-color:var(--magenta) !important;background:rgba(224,33,138,.10) !important;color:#7C2D92 !important}
        .ndsbody .optb.sel{border-color:#3B5CC4 !important;background:rgba(59,92,196,.12) !important;color:#3B5CC4 !important}
        .ndsbody .rgpd, .ndsbody .rgpd-check{color:#52455e !important}
        .ndsbody .rgpd-check div{color:#52455e !important;font-weight:600}
        .ndsbody .rgpd-check{border:1.5px solid #d9cfe6 !important;background:#faf7fd !important}
        .ndsbody .rgpd-check.on{border-color:var(--magenta) !important;background:rgba(232,33,107,.07) !important}
        .ndsbody .rgpd .rc{border:2px solid #b9a9cc !important;background:#fff !important}
        .ndsbody .rgpd-check.on .rc{background:var(--magenta) !important;border-color:var(--magenta) !important;color:#fff !important}
        .ndsbody .label-strong{color:#3a2f49 !important;font-weight:800 !important}
        .ndsbody .chip-em{font-size:15px}
        .ndsbody .opt.correct{color:#14532d !important}
        .ndsbody .opt.wrong{color:#7f1d1d !important}
        .ndsbody .dtitle{color:#1a1226 !important}
        .ndsbody .dsub{color:#7a708a !important}
        .ndsbody .dhead .back{background:#f3eef8 !important;color:#7C2D92 !important}
        .ndsbody .progress .pstep{background:#ece7f2 !important}
        .ndsbody .label{color:#7a708a !important}
        .ndsbody .input{background:#faf7fd !important;border-color:#e7def0 !important;color:#1a1226 !important}
        .ndsbody .input::placeholder{color:#b8aec6 !important}
        .ndsbody .chip{background:#faf7fd !important;border-color:#e7def0 !important;color:#52455e !important}
        .ndsbody .chip.sel{background:rgba(224,33,138,.10) !important;border-color:var(--magenta) !important;color:#7C2D92 !important}
        .ndsbody .qexpl{background:#f6f3fb !important;border-color:#e7def0 !important;color:#52455e !important}
        .ndsbody .foot{color:#9a8fa6 !important}
        /* B — bandeau hero a hauteur fixe avec image NDS d'origine (onboard uniquement). L'image vit dans .hero (pas dans .stage scrollable) ; le voile garantit la lisibilite du label+logo et le fondu vers le theme clair. La prize-card chevauche le bas via margin:-56px d'origine. */
        .ndsbody .scr.on .hero{position:relative;background:#190a25 url(/nds/bg-stage.webp) center 30%/cover no-repeat;padding:20px 16px 18px;display:flex;flex-direction:column;align-items:stretch}
        .ndsbody .scr.on .hero::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,6,24,.42) 0%,rgba(15,6,24,.10) 32%,rgba(15,6,24,.28) 100%);pointer-events:none}
        .ndsbody .scr.on .hlogo{position:relative;z-index:1;align-self:flex-start;height:110px;width:auto;max-width:86%;margin-bottom:14px}
        .ndsbody .scr.on .hero .prize{position:relative;z-index:1;margin:0 !important}
        /* D — bandeau partenaires défilant (logos depuis la table partenaires) */
        .ndsbody .logoband{margin:16px 0 4px;border:1px solid #ece7f2;border-radius:14px;background:#faf7fd;overflow:hidden;-webkit-mask:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
        .ndsbody .logotrack{display:flex;gap:14px;width:max-content;padding:9px 12px;align-items:center;animation:logoscroll 52s linear infinite}
        .ndsbody .logoband:active .logotrack{animation-play-state:paused}
        .ndsbody .logoslot{flex:0 0 auto;border:1px solid #e7def0;border-radius:13px;padding:16px 26px;color:#7C2D92;font-weight:700;font-size:16.5px;white-space:nowrap;background:#fff;display:flex;align-items:center;gap:9px;height:104px}
        .ndsbody .logoslot img{max-height:82px;max-width:215px;object-fit:contain;display:block}
        .ndsbody .logoslot-ph{border:1.5px dashed #cdbbe0;color:#9a86b5;background:#fff;min-width:196px;justify-content:center;font-size:16px;font-weight:800;letter-spacing:.01em}
        .ndsbody .logoband-inline{margin:0}
        .ndsbody .map-switch{display:flex;gap:6px;background:rgba(255,255,255,.94);border-radius:14px;padding:4px;box-shadow:0 8px 24px rgba(20,26,38,.22)}
        .ndsbody .map-switch button{flex:1;border:none;border-radius:10px;padding:7px 10px;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer;background:transparent;color:#7C2D92}
        .ndsbody .map-switch button.on{background:linear-gradient(135deg,#7C2D92,#E0218A);color:#fff}
        @keyframes logoscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @media(prefers-reduced-motion:reduce){.ndsbody .logotrack{animation:none}}
      ` }} />
      <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: NDS_SPRITE }} />

      <div className="phone">
        {screen === 'onboard' && (
          <section className="scr on">
            <div className="hero">
              <img className="hlogo" src="/nds/logo_nds_blanc_hd.png" alt="Nuits du Sud" />
              <div className="prize">
                <div className="lbl">À gagner chaque soir</div>
                <div className="prow">
                  <span className="sq" style={{ background: 'linear-gradient(135deg,#E0218A,#8E2E9E)' }}><svg className="ic"><use href="#i-ticket" /></svg></span>
                  <div><div className="nm">{lotNom}</div><div className="vl">{lotDesc}</div></div>
                </div>
                <div className="div" />
                <div className="prow">
                  <span className="sq" style={{ background: 'linear-gradient(135deg,#E0218A,#8E2E9E)' }}><svg className="ic"><use href="#i-voucher" /></svg></span>
                  <div><div className="nm">{lot2Nom}</div><div className="vl">{lot2Desc}</div></div>
                </div>
              </div>
            </div>
            <div className="stage">
              {saved ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(22,163,74,.16)', border: '1px solid rgba(22,163,74,.4)', borderRadius: 14, padding: '14px 15px', marginBottom: 14, fontSize: 14, fontWeight: 600 }}>
                    <svg className="ic" style={{ width: 20, height: 20, color: '#4ade80', flexShrink: 0 }}><use href="#i-checkc" /></svg>
                    <span>Tu as déjà flashé <b>cette station</b> aujourd&apos;hui — ton ticket est gardé (<b>{ticketCount} ticket{ticketCount > 1 ? 's' : ''}</b>). File vers une <b>autre station</b> pour en gagner un de plus&nbsp;!</span>
                  </div>
                  {STATIONS.filter(s => ndsPlayedToday(s.id)).length < STATIONS.length ? (
                    <>
                      <div style={{ background: '#faf7fd', border: '1px solid #ece7f2', borderRadius: 14, padding: '14px 15px', marginBottom: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1226', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                          <svg className="ic" style={{ width: 16, height: 16, color: 'var(--magenta)' }}><use href="#i-layers" /></svg>
                          Chaque station = 1 ticket de plus
                        </div>
                        {STATIONS.map(s => { const dn = ndsPlayedToday(s.id); return (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#52455e', padding: '5px 0' }}>
                            <span className={dn ? 'stdot stdot-done' : 'stdot stdot-todo'} />
                            <span><b>{s.nom}</b> — {dn ? 'validée ✓' : 'à jouer'}</span>
                          </div>
                        )})}
                      </div>
                      <a className="btn" onClick={() => setScreen('carte')}><svg className="ic" style={{ width: 18, height: 18, marginRight: 7, verticalAlign: -3 }}><use href="#i-map" /></svg>Gagner d&apos;autres tickets</a>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(224,33,138,.14)', border: '1px solid rgba(224,33,138,.4)', borderRadius: 14, padding: '14px 15px', marginBottom: 14, fontSize: 14, fontWeight: 600 }}>
                      <svg className="ic" style={{ width: 20, height: 20, color: 'var(--magenta)', flexShrink: 0 }}><use href="#i-ticket" /></svg>
                      <span>Toutes les stations jouées ! Tu as le <b>maximum de tickets</b> pour ce soir. Bonne chance au tirage 🎉</span>
                    </div>
                  )}
                  <a className="reslink" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: '#7C2D92', fontWeight: 700, cursor: 'pointer' }} onClick={() => setScreen('tickets')}>Voir mes tickets</a>
                </>
              ) : (
                <>
                  {cfg.intro ? (
                    <div style={{ background: '#faf7fd', border: '1px solid #ece7f2', borderRadius: 16, padding: '16px 18px', marginBottom: 14, fontSize: 14.5, lineHeight: 1.55, color: '#1a1226', fontWeight: 600, boxShadow: '0 8px 22px rgba(30,16,46,.10)' }}>{cfg.intro as string}</div>
                  ) : (<>
                  <div style={{ textAlign: 'center', marginBottom: 8, marginTop: 2 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1226' }}>Comment jouer&#8239;?</div>
                  </div>
                  <div style={{ background: '#faf7fd', border: '1px solid #ece7f2', borderRadius: 16, padding: '13px 16px', marginBottom: 12, boxShadow: '0 8px 22px rgba(30,16,46,.10)' }}>
                    {[
                      { ic: 'i-map', t: 'Rends-toi à une station jeux', s: 'Sur la carte — festival et partenaires' },
                      { ic: 'i-scan', t: 'Flash le QR code', s: 'À la station' },
                      { ic: 'i-help', t: 'Réponds au quizz', s: 'Et gagne des tickets' },
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 0' }}>
                        <span style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,var(--purple),var(--magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg className="ic" style={{ width: 17, height: 17, color: '#fff' }}><use href={`#${step.ic}`} /></svg></span>
                        <span style={{ fontSize: 13.5, color: '#52455e', lineHeight: 1.3 }}><b style={{ color: '#1a1226' }}>{step.t}</b><br /><span style={{ fontSize: 12.5, opacity: .85 }}>{step.s}</span></span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(90deg,rgba(34,211,198,.16),rgba(224,33,138,.16))', border: '1px solid #ece7f2', borderRadius: 14, padding: '11px 14px', marginBottom: 14, fontWeight: 800, fontSize: 14.5, color: '#1a1226', textAlign: 'center' }}>
                    <svg className="ic" style={{ width: 18, height: 18, color: 'var(--magenta)', flexShrink: 0 }}><use href="#i-layers" /></svg>
                    <span>+ Vous jouez, + vos chances augmentent</span>
                  </div>
                  </>)}
                  <a className="btn" onClick={() => {
                    const nextQuestions = drawQuestions()
                    setQuestions(nextQuestions)
                    if (nextQuestions.length > 0) { setScreen('quiz'); return }
                    // Pas de quiz classique (banque vide) : passe au bonus, sauf si déjà répondu
                    // par ce joueur (peu importe quand, tout le festival) -> routage neutre identique
                    // à la fin normale du bonus (recurrent -> ticket direct, sinon -> inscription).
                    if (bonusQs.length > 0 && !joueurHistory.bonusDone) { setScreen('bonus'); return }
                    if (bonusQs.length > 0 && joueurHistory.bonusDone) { finaliser(); return }
                    setScreen('resultats')
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
                <div><label className="label">Prénom</label><input className="input" autoComplete="given-name" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />{errors.prenom && <div className="err">{errors.prenom}</div>}</div>
                <div><label className="label">Nom</label><input className="input" autoComplete="family-name" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />{errors.nom && <div className="err">{errors.nom}</div>}</div>
              </div>
              <div style={{ marginBottom: 12 }}><label className="label">Email</label><input className="input" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={form.email} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, email: v })); if (emailKnown) setEmailKnown(null) }} onBlur={onEmailBlur} />{errors.email && <div className="err">{errors.email}</div>}
                {emailKnown && (
                  <div style={{ background: '#EEF2FF', border: '1px solid #3B5CC4', borderRadius: 12, padding: '10px 12px', marginTop: 8, color: '#23357a', fontSize: 13.5 }}>
                    {emailKnown.alreadyPlayed
                      ? <>Content de te revoir{emailKnown.prenom ? `, ${emailKnown.prenom}` : ''} 👋 Tu as déjà joué cette station — tu gardes ton ticket.</>
                      : <>Content de te revoir{emailKnown.prenom ? `, ${emailKnown.prenom}` : ''} 👋 On a pré-rempli tes infos, vérifie et valide.</>}
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 12 }}><label className="label">Téléphone</label><input className="input" type="tel" inputMode="tel" autoComplete="tel" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} />{errors.tel && <div className="err">{errors.tel}</div>}</div>
              <div className="grid2" style={{ marginBottom: 12 }}>
                <div><label className="label">Sexe</label><select className="input" value={form.sexe} onChange={e => setForm(f => ({ ...f, sexe: e.target.value }))}><option value="">—</option><option value="H">Homme</option><option value="F">Femme</option></select>{errors.sexe && <div className="err">{errors.sexe}</div>}</div>
                <div><label className="label">Tranche d&apos;âge</label><select className="input" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}>{AGE_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}</select>{errors.age && <div className="err">{errors.age}</div>}</div>
              </div>
              <div style={{ marginBottom: 12 }}><label className="label">Code postal</label><input className="input" inputMode="numeric" autoComplete="postal-code" placeholder="—" value={form.cp} onChange={e => setForm(f => ({ ...f, cp: e.target.value }))} />{errors.cp && <div className="err">{errors.cp}</div>}</div>
              <div><label className="label label-strong">Tu as connu le festival par…</label>
                <div className="chips">{SRC.map(s => <span key={s} className={`chip${form.source === s ? ' sel' : ''}`} onClick={() => setSource(s)}><span className="chip-em">{SRC_EMOJI[s]}</span> {s}</span>)}</div>
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
            {recoOpen && (
              <div onClick={recoDismiss} style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, background: 'rgba(20,8,30,.55)', backdropFilter: 'blur(2px)' }}>
                <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 320, background: '#fff', borderRadius: 20, padding: '22px 20px', boxShadow: '0 24px 60px rgba(20,8,40,.5)', textAlign: 'center' }}>
                  {recoMode === 'ask' ? (
                    <>
                      <div style={{ width: 54, height: 54, margin: '0 auto 12px', borderRadius: 16, background: 'linear-gradient(135deg,#7C2D92,#E0218A)', display: 'grid', placeItems: 'center' }}>
                        <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 19, color: '#23142c' }}>Déjà inscrit&nbsp;?</div>
                      <div style={{ fontSize: 13, color: '#7a708a', margin: '8px 0 18px', lineHeight: 1.45 }}>Si tu as déjà joué une station, entre ton email&nbsp;: on garde tes infos et tes tickets.</div>
                      <button onClick={() => { setRecoMode('email'); setRecoMsg(null) }} style={{ width: '100%', border: 'none', borderRadius: 13, padding: 14, fontFamily: 'inherit', fontWeight: 800, fontSize: 15, color: '#fff', cursor: 'pointer', background: 'linear-gradient(90deg,#7C2D92,#E0218A)', boxShadow: '0 8px 20px rgba(224,33,138,.32)' }}>Oui, j&apos;ai déjà joué</button>
                      <button onClick={recoDismiss} style={{ width: '100%', marginTop: 10, border: '1px solid #ece6f0', borderRadius: 13, padding: 13, fontFamily: 'inherit', fontWeight: 700, fontSize: 14, color: '#7a708a', cursor: 'pointer', background: '#fff' }}>Non, c&apos;est ma première fois</button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 800, fontSize: 18, color: '#23142c', marginBottom: 12 }}>Ton email</div>
                      <input type="email" inputMode="email" autoCapitalize="none" autoComplete="email" value={recoEmail} onChange={e => { setRecoEmail(e.target.value); if (recoMsg) setRecoMsg(null) }} placeholder="prenom@email.com" onKeyDown={e => { if (e.key === 'Enter') recoSubmitEmail() }} style={{ width: '100%', border: '1px solid #ece6f0', borderRadius: 12, padding: '13px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none', color: '#23142c' }} />
                      {recoMsg && <div style={{ fontSize: 12.5, color: '#b4456e', marginTop: 8, lineHeight: 1.4 }}>{recoMsg}</div>}
                      <button onClick={recoSubmitEmail} disabled={recoBusy} style={{ width: '100%', marginTop: 14, border: 'none', borderRadius: 13, padding: 14, fontFamily: 'inherit', fontWeight: 800, fontSize: 15, color: '#fff', cursor: 'pointer', background: 'linear-gradient(90deg,#7C2D92,#E0218A)', boxShadow: '0 8px 20px rgba(224,33,138,.32)', opacity: recoBusy ? 0.7 : 1 }}>{recoBusy ? 'Recherche…' : 'Valider'}</button>
                      <button onClick={recoDismiss} style={{ width: '100%', marginTop: 10, border: 'none', background: 'none', color: '#a99fb3', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Passer, je m&apos;inscris à la fin</button>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="pad">
              <div className="dhead">
                <div className="back" onClick={() => setScreen('onboard')}><svg className="ic"><use href="#i-arrowl" /></svg></div>
                <div style={{ flex: 1 }}><div className="dtitle">{nom}</div><div className="dsub">Quiz · {qIdx + 1} / {questions.length}</div></div>
                
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
                {answered && (
                  <button onClick={goNext} style={{ marginTop: 14, width: '100%', border: 'none', borderRadius: 14, padding: '15px', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, color: '#fff', cursor: 'pointer', background: 'linear-gradient(90deg,var(--magenta2),var(--magenta))', boxShadow: '0 8px 20px rgba(224,33,138,.32)' }}>
                    {qIdx + 1 < questions.length ? 'Question suivante →' : 'Voir mon résultat →'}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {screen === 'resultats' && (
          <section className="scr on" style={{ background: '#fff' }}>
            <div className="res-head">
              <div className="res-ico"><svg className="ic"><use href="#i-trophy" /></svg></div>
              <div className="res-bravo disp">{quizPerfect ? 'Wow, super\u202f! \u{1F389}' : (bonusDone ? 'Bravo\u202f!' : 'Presque\u202f!')}</div>
              <div className="res-sub">{quizPerfect ? 'Continue comme ça et cumule tes tickets\u202f!' : (bonusDone ? 'Ton ticket est validé pour le tirage' : 'Pas encore de ticket pour cette station')}</div>
            </div>
            <div className="res-body">
              <div className="score-card">
                <div className="score disp">{score}/{questions.length}</div>
                <div className="score-line">
                  {quizPerfect ? 'Sans faute — 1 ticket\u202f🎟️'
                    : `${score}/${questions.length} — pas de ticket sur le quiz`}
                  {bonusDone && ' · +1 ticket bonus\u202f🎟️'}
                </div>
              </div>
              {bonusQs.length > 0 && !bonusDone && !joueurHistory.bonusDone && (
                <a className="bonusbtn" onClick={() => { setBonusIdx(0); setScreen('bonus') }}>
                  <svg className="ic"><use href="#i-spark" /></svg>
                  {' Réponds à la question bonus · +1 ticket'}
                </a>
              )}
              <div className="infocard b-magenta"><svg className="ic"><use href="#i-gift" /></svg><div>Lot : <b>{lotResume}</b></div></div>
              <div className="infocard b-green"><svg className="ic"><use href="#i-checkc" /></svg><div>Participation enregistrée&#8239;!</div></div>
              {quizPerfect && (
                <div className="infocard b-magenta" style={{ flexDirection: 'column', gap: 4 }}>
                  <div><b>Continue comme ça&#8239;!</b> Chaque action = +1 ticket :</div>
                  <div style={{ fontSize: 13.5, color: '#52455e' }}>• Va dans les autres stations &nbsp;• Réponds aux questions bonus &nbsp;• Parraine tes amis</div>
                </div>
              )}
              <a className="btn" style={{ marginTop: 10 }} onClick={finaliser}>{saving ? 'Enregistrement…' : (recurrent ? (quizPerfect || bonusDone ? 'Voir mon ticket →' : 'Continuer →') : (quizPerfect || bonusDone ? 'Valider et recevoir mon ticket →' : 'Continuer sans ticket →'))}</a>
            </div>
          </section>
        )}

        {screen === 'bonus' && bonusQs[bonusIdx] && (
          <section className="scr purple on">
            <div className="pad">
              <div className="dhead"><div className="back" onClick={() => setScreen('resultats')}><svg className="ic"><use href="#i-arrowl" /></svg></div><div style={{ flex: 1 }}><div className="dtitle">Bonus</div><div className="dsub">{bonusIdx + 1} / {bonusQs.length} · double tes chances</div></div></div>
              <div className="qcard">
                <div className="qtxt">{bonusQs[bonusIdx].label}</div>
                {bonusQs[bonusIdx].options.map(opt => {
                  const bq = bonusQs[bonusIdx]
                  const ans = bonusAnswers[bq.id]
                  const isSel = Array.isArray(ans) ? ans.includes(opt.val) : ans === opt.val
                  return <button key={opt.val} className={`opt optb${isSel ? ' sel' : ''}`} onClick={() => setBonusAnswers(a => bq.type === 'multi'
                    ? { ...a, [bq.id]: ((a[bq.id] as string[] | undefined) ?? []).includes(opt.val) ? (a[bq.id] as string[]).filter(v => v !== opt.val) : [...((a[bq.id] as string[] | undefined) ?? []), opt.val] }
                    : { ...a, [bq.id]: opt.val })}>{opt.label}</button>
                })}
              </div>
              <a className="btn" onClick={() => bonusIdx + 1 < bonusQs.length ? setBonusIdx(i => i + 1) : finishBonus()}>{bonusIdx + 1 < bonusQs.length ? 'Suivant →' : (saving ? 'Enregistrement…' : 'Terminer →')}</a>
            </div>
          </section>
        )}

        {screen === 'refusdigital' && (
          <section className="scr on" style={{ background: '#fff' }}>
            <div className="res-head">
              <div className="res-ico"><svg className="ic"><use href="#i-map" /></svg></div>
              <div className="res-bravo disp">Rends-toi sur le lieu pour jouer</div>
              <div className="res-sub">Ce lien digital est reserve a ta premiere participation. Ton compte existe deja : pour rejouer, flashe le QR sur place (stations du festival &amp; commerces partenaires).</div>
            </div>
            <div className="res-body padnav">
              <a className="double" onClick={() => setScreen('carte')}><svg className="ic"><use href="#i-map" /></svg> Voir la carte des partenaires</a>
            </div>
          </section>
        )}
        {screen === 'final' && (
          <section className="scr on" style={{ background: '#fff' }}>
            <div className="res-head">
              <div className="res-ico"><svg className="ic"><use href="#i-checkc" /></svg></div>
              <div className="res-bravo disp">{quizPerfect || bonusDone ? "C'est validé !" : 'Participation enregistrée'}</div>
              <div className="res-sub">{saveError ? 'Ticket émis — sauvegarde en ligne à confirmer' : (quizPerfect || bonusDone ? 'Participation enregistrée pour le tirage' : 'Pas de ticket à cette station — réussis un sans-faute ou la question bonus')}</div>
            </div>
            <div className="res-body padnav">
              {saveError && (
                <div style={{ background: '#FFF4E5', border: '1px solid #F5B544', borderRadius: 12, padding: '12px 14px', margin: '0 0 14px', color: '#7a4d00', fontSize: 14, textAlign: 'left' }}>
                  <b>Enregistrement non confirmé.</b> Ton ticket <b>{ticket || '—'}</b> n&apos;a pas pu être sauvegardé en ligne (réseau).
                  <a onClick={retrySave} style={{ display: 'inline-block', marginTop: 8, fontWeight: 700, color: '#3B5CC4', cursor: 'pointer' }}>{saving ? 'Nouvelle tentative…' : 'Réessayer maintenant ↻'}</a>
                </div>
              )}
              <div className="res-eyebrow">Joue les autres stations ce soir</div>
              <div className="nextcard">
                {STATIONS.filter(s => s.id !== evId).map(s => { const dn = ndsPlayedToday(s.id); return (
                  <div className="nextline" key={s.id}><span className={`em${dn ? '' : ' nds-mk-pulse'}`} style={{ background: dn ? '#F5B544' : '#16a34a' }}><svg className="ic"><use href={`#${dn ? 'i-checkc' : s.icon}`} /></svg></span><div><div className="nm">{s.nom}</div><div className="ou">{dn ? 'validée ✓' : s.ou}</div></div></div>
                )})}
              </div>
              <div className="bnote" style={{ margin: '6px 4px 16px', textAlign: 'left' }}>Chaque station jouée = 1 ticket de plus. Tirage chaque soir · 1 grand tirage à la clôture du festival.</div>
              <a className="double" onClick={() => setScreen('carte')}><svg className="ic"><use href="#i-map" /></svg> Carte &amp; autres stations</a>
              {(form.email || recurrent?.email) && (
                <a className="parrainbtn" onClick={shareParrainage}><svg className="ic"><use href="#i-ticket" /></svg> Parraine un ami &amp; gagne un ticket</a>
              )}
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
                <div className="tk-draw"><svg className="ic"><use href="#i-clock" /></svg> Tirage chaque soir des Nuits du Sud · 1 grand tirage à la clôture du festival</div>
              </div>
              <div className="infocard b-magenta" style={{ marginTop: 14 }}><svg className="ic"><use href="#i-ticket" /></svg><div>Ton code : <b>{ticket || '—'}</b></div></div>
              {ticketCount < STATIONS.length * 2 && (
                <>
                  <div className="tk-tip" style={{ marginTop: 12 }}><svg className="ic"><use href="#i-layers" /></svg><div>Réponds aux quiz des autres stations : <b>chaque station = 1 ticket de plus</b> et plus de chances au tirage.</div></div>
                  <a className="double" style={{ marginTop: 14 }} onClick={() => setScreen('carte')}><svg className="ic"><use href="#i-map" /></svg> Cumuler aux autres stations</a>
                </>
              )}
              {ticketCount >= STATIONS.length * 2 && (
                <div className="tk-tip" style={{ marginTop: 12, background: '#e9f9ef', borderColor: '#bbf7d0', color: '#16a34a' }}><svg className="ic"><use href="#i-checkc" /></svg><div><b>Toutes les stations jouées !</b> Tu as le maximum de tickets pour le tirage de ce soir.</div></div>
              )}
              {(form.email || recurrent?.email) && (
                <a className="parrainbtn" onClick={shareParrainage}><svg className="ic"><use href="#i-ticket" /></svg> Parraine un ami &amp; gagne un ticket</a>
              )}
              {partnerBand}
            </div>
          </section>
        )}

        {screen === 'carte' && (
          <section className="scr carte" id="carteScr">
            <div className="map-top">
              <div className="qc">
                <span className="em"><svg className="ic"><use href="#i-map" /></svg></span>
                <div style={{ minWidth: 0 }}><div className="t">{mapView === 'stations' ? 'Les points de jeu' : 'Nos partenaires'}</div><div className="s">{mapView === 'stations' ? 'Flashe le QR de chaque station pour cumuler tes tickets' : 'Le jeu continue : retrouve nos partenaires en ville'}</div></div>
                <span className="tk"><svg className="ic"><use href="#i-ticket" /></svg> {ticketCount}</span>
              </div>
            </div>
            <div className="map-fake">
              <div className="map-real" ref={mapRef} />
              <div className="map-list">
                <div className="map-switch">
                  <button onClick={() => setMapView('stations')} className={mapView === 'stations' ? 'on' : ''}>Pendant le festival</button>
                  <button onClick={() => setMapView('partenaires')} className={mapView === 'partenaires' ? 'on' : ''}>Chez les partenaires</button>
                </div>
              </div>
            </div>
            {placeMode && (
              <div style={{ position: 'absolute', left: 12, right: 12, bottom: 204, zIndex: 1200, background: '#1a1226', color: '#fff', borderRadius: 14, padding: '12px 14px', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>Mode placement — glisse les 4 points sur la carte</div>
                {STATIONS.map(st => { const g = geo[st.id]; return <div key={st.id} style={{ fontSize: 11.5, opacity: .85, fontVariantNumeric: 'tabular-nums' }}>{st.nom} : {(g ? g.lat : st.lat).toFixed(5)}, {(g ? g.lng : st.lng).toFixed(5)}</div> })}
                <button onClick={() => { const out = STATIONS.map(st => { const g = geo[st.id]; return { id: st.id, lat: g ? +g.lat.toFixed(6) : st.lat, lng: g ? +g.lng.toFixed(6) : st.lng } }); try { navigator.clipboard.writeText(JSON.stringify(out)) } catch {} }} style={{ marginTop: 9, width: '100%', background: '#E0218A', border: 'none', color: '#fff', borderRadius: 10, padding: '10px 14px', fontFamily: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Copier les positions</button>
              </div>
            )}
            {scanTarget && (
              <>
                <div className="pt-dim2" onClick={() => setScanTarget(null)} />
                <div className="pt-sheet2">
                  {scanTarget.done ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                        <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg className="ic" style={{ width: 17, height: 17, color: '#fff' }}><use href="#i-checkc" /></svg></span>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>« {scanTarget.nom} » déjà jouée</div>
                      </div>
                      <div style={{ fontSize: 14, color: '#1a1226', fontWeight: 600, lineHeight: 1.5, marginBottom: 14, background: '#e9f9ef', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>Tu as déjà joué cette station aujourd&apos;hui. File vers une <b>autre station</b> pour gagner un ticket de plus au tirage&nbsp;!</div>
                      {scanTarget.lat && scanTarget.lng ? (
                        <a className="btn-ghost" href={`https://www.google.com/maps/dir/?api=1&destination=${scanTarget.lat},${scanTarget.lng}`} target="_blank" rel="noreferrer" style={{ marginTop: 0 }} onClick={() => logClicPartenaire(scanTarget.id || 'inconnu', 'maps', `https://www.google.com/maps/dir/?api=1&destination=${scanTarget.lat},${scanTarget.lng}`)}>
                          <svg className="ic" style={{ width: 16, height: 16, marginRight: 6, verticalAlign: -3 }}><use href="#i-map" /></svg>Y retourner (Maps)
                        </a>
                      ) : null}
                      <a className="reslink" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: '#7a708a', fontWeight: 700, cursor: 'pointer' }} onClick={() => setScanTarget(null)}>Fermer</a>
                    </>
                  ) : (
                  <>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: scanTarget.ou ? 2 : 6 }}>Direction « {scanTarget.nom} »</div>
                  {scanTarget.ou ? (
                    <div style={{ fontSize: 13.5, color: '#7a708a', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><svg className="ic" style={{ width: 15, height: 15, color: 'var(--magenta)', flexShrink: 0 }}><use href="#i-map" /></svg>{scanTarget.ou}</div>
                  ) : null}
                  {scanTarget.msg ? (
                    <div style={{ fontSize: 14.5, color: '#1a1226', fontWeight: 700, lineHeight: 1.5, marginBottom: 12, background: '#f6f3fb', border: '1px solid #e7def0', borderRadius: 12, padding: '12px 14px' }}>{scanTarget.msg}</div>
                  ) : null}
                  <div style={{ fontSize: 14, color: '#52455e', lineHeight: 1.5, marginBottom: 14 }}>Pour gagner <b>1 ticket de plus</b>, rends-toi à cette station et <b>flashe son QR code</b> sur place. Tu cumules un ticket à chaque station, toute la soirée.</div>
                  <button className="btn" style={{ marginTop: 0 }} onClick={() => { setScanTarget(null); setScanOpen(true) }}>Flasher le QR maintenant</button>
                  {scanTarget.lat && scanTarget.lng ? (
                    <a className="btn-ghost" href={`https://www.google.com/maps/dir/?api=1&destination=${scanTarget.lat},${scanTarget.lng}`} target="_blank" rel="noreferrer" style={{ marginTop: 10 }} onClick={() => logClicPartenaire(scanTarget.id || 'inconnu', 'maps', `https://www.google.com/maps/dir/?api=1&destination=${scanTarget.lat},${scanTarget.lng}`)}>
                      <svg className="ic" style={{ width: 16, height: 16, marginRight: 6, verticalAlign: -3 }}><use href="#i-map" /></svg>Itinéraire (Maps)
                    </a>
                  ) : null}
                  <a className="reslink" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: '#7a708a', fontWeight: 700, cursor: 'pointer' }} onClick={() => setScanTarget(null)}>Plus tard</a>
                  </>
                  )}
                </div>
              </>
            )}
            {fiche && (
              <>
                <div className="pt-dim2" onClick={() => setFiche(null)} />
                <div className="pt-sheet2">
                  <button onClick={() => setFiche(null)} aria-label="Fermer" style={{ position: 'absolute', top: 14, right: 16, background: '#f1edf5', border: 'none', color: '#1a1020', borderRadius: 999, width: 32, height: 32, fontSize: 18, cursor: 'pointer' }}>×</button>
                  <PartnerLogo src={fiche.image_url} alt="" fallback={null} imgStyle={{ width: 92, height: 92, borderRadius: 18, objectFit: 'contain', background: '#fff', padding: 8, boxSizing: 'border-box', marginBottom: 12 }} />
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{fiche.nom}</div>
                  {fiche.adresse || fiche.ville ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 13.5, color: '#52455e', marginBottom: 10 }}>
                      <svg className="ic" style={{ width: 15, height: 15, color: 'var(--magenta)', flexShrink: 0, marginTop: 2 }}><use href="#i-map" /></svg>
                      <span><b style={{ color: '#1a1226' }}>Le lieu — </b>{[fiche.adresse, fiche.ville].filter(Boolean).join(', ')}</span>
                    </div>
                  ) : null}
                  {(() => { const pp = partenaires.find(p => p.id === fiche.id || p.nom === fiche.nom); const tel = pp?.tel; return tel ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: '#52455e', marginBottom: 10 }}>
                      <span style={{ width: 15, textAlign: 'center', flexShrink: 0 }}>📞</span>
                      <span><b style={{ color: '#1a1226' }}>Tél — </b><a href={`tel:${tel}`} style={{ color: '#7C2D92', fontWeight: 700 }}>{tel}</a></span>
                    </div>
                  ) : null })()}
                  <div style={{ fontSize: 14, color: '#1a1226', fontWeight: 600, lineHeight: 1.5, marginBottom: 12, background: '#f6f3fb', border: '1px solid #e7def0', borderRadius: 12, padding: '11px 13px' }}><b>Le jeu — </b>{fiche.tickets_par_scan ? `Rends-toi sur place et flashe le QR du commerce pour gagner +${fiche.tickets_par_scan} ticket${fiche.tickets_par_scan > 1 ? 's' : ''} pour le tirage.` : "Rends-toi sur place et profite de l'offre partenaire."}</div>
{(() => { const pp = partenaires.find(p => p.id === fiche.id || p.nom === fiche.nom); const ls = pp && Array.isArray(pp.lots) ? pp.lots : []; return ls.length ? (
  <div className="pt-lots" style={{ marginBottom: 12 }}>
    <div className="pt-lots-h"><svg className="ic" style={{ width: 16, height: 16 }}><use href="#i-gift" /></svg> Lots à gagner</div>
    {ls.map((lot, li) => { const n = lot.gagnants ?? lot.quantite ?? 0; return (
      <div className="pt-lot" key={lot.id || li}>
        <div className="pt-lot-t">{lot.titre || lot.nom}</div>
        {n > 0 ? <div className="pt-lot-q">{n} gagnant{n > 1 ? 's' : ''}</div> : null}
        {lot.description ? <div className="pt-lot-d">{lot.description}</div> : null}
      </div>
    )})}
  </div>
) : null })()}
                  {fiche.latitude && fiche.longitude ? (
                    <a className="btn" href={`https://www.google.com/maps/dir/?api=1&destination=${fiche.latitude},${fiche.longitude}`} target="_blank" rel="noreferrer" style={{ marginTop: 0, marginBottom: 12 }} onClick={() => logClicPartenaire(fiche.id, 'maps', `https://www.google.com/maps/dir/?api=1&destination=${fiche.latitude},${fiche.longitude}`)}>
                      <svg className="ic" style={{ width: 16, height: 16, marginRight: 7, verticalAlign: -3 }}><use href="#i-map" /></svg>Itinéraire (Maps)
                    </a>
                  ) : null}
                  {fiche.promo_text ? <div style={{ background: '#fff4e6', color: '#c2410c', borderRadius: 12, padding: '10px 13px', fontWeight: 700, fontSize: 13.5, marginBottom: 12 }}>{fiche.promo_text}</div> : null}
                  {fiche.site_web || fiche.instagram || fiche.facebook ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {fiche.site_web ? <a className="reslink" href={fiche.site_web} onClick={() => logClicPartenaire(fiche.id, 'site_web', fiche.site_web)} target="_blank" rel="noreferrer" style={{ color: '#7C2D92', fontWeight: 700 }}>Site web</a> : null}
                      {fiche.instagram ? <a className="reslink" href={fiche.instagram} onClick={() => logClicPartenaire(fiche.id, 'instagram', fiche.instagram)} target="_blank" rel="noreferrer" style={{ color: '#7C2D92', fontWeight: 700 }}>Instagram</a> : null}
                      {fiche.facebook ? <a className="reslink" href={fiche.facebook} onClick={() => logClicPartenaire(fiche.id, 'facebook', fiche.facebook)} target="_blank" rel="noreferrer" style={{ color: '#7C2D92', fontWeight: 700 }}>Facebook</a> : null}
                    </div>
                  ) : null}
                </div>
              </>
            )}
            {scanOpen && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#000' }}>
                <video ref={scanVideoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg,rgba(0,0,0,.6),transparent)' }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Vise le QR de la station</span>
                  <button onClick={() => setScanOpen(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: 999, width: 38, height: 38, fontSize: 20, cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 220, height: 220, border: '3px solid rgba(255,255,255,.9)', borderRadius: 24, boxShadow: '0 0 0 4000px rgba(0,0,0,.35)' }} />
                {scanErr && (
                  <div style={{ position: 'absolute', bottom: 40, left: 20, right: 20, background: '#fff', borderRadius: 16, padding: '16px', textAlign: 'center', fontSize: 14, color: '#1a1226' }}>
                    Caméra indisponible ici. Ouvre l&apos;<b>appareil photo</b> de ton téléphone et vise le QR de la station : il ouvre le jeu automatiquement.
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {screen === 'partenaires' && (
          <section className="scr" style={{ background: '#fff' }}>
            <div className="pad padnav">
              <div className="pt-hero">Nos partenaires jeux</div>
              <div className="pt-sub">Les partenaires jeux des Nuits du Sud. Touche un logo pour leurs lots et leurs réseaux.</div>
              {partenaires.length === 0 && <div className="pt-banner"><svg className="ic"><use href="#i-store" /></svg><div>Espace partenaires — la liste réelle s&apos;affichera ici (logos, promo, réseaux).</div></div>}
              <div className="pt-grid">
                {partenaires.map((p, i) => (
                  <div className="pt-card" key={p.id} onClick={() => setSheetPart(i)}>
                    <div className="pt-logo"><PartnerLogo src={p.image_url} alt={p.nom} fallback={<svg className="ic"><use href="#i-store" /></svg>} imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
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
                    <div className="pt-logo" style={{ margin: 0 }}><PartnerLogo src={partenaires[sheetPart].image_url} alt="" fallback={<svg className="ic"><use href="#i-store" /></svg>} imgStyle={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
                    <div><div style={{ fontWeight: 800, fontSize: 19 }}>{partenaires[sheetPart].nom}</div>{partenaires[sheetPart].promo_text && <div style={{ fontSize: 13, color: '#7a708a' }}>{partenaires[sheetPart].promo_text}</div>}</div>
                  </div>
                  {partenaires[sheetPart].description && <div style={{ fontSize: 14, color: '#52455e', lineHeight: 1.5, margin: '8px 0' }}>{partenaires[sheetPart].description}</div>}
                  {Array.isArray(partenaires[sheetPart].lots) && partenaires[sheetPart].lots!.length > 0 && (
                    <div className="pt-lots">
                      <div className="pt-lots-h"><svg className="ic" style={{ width: 16, height: 16 }}><use href="#i-gift" /></svg> Lots à gagner</div>
                      {partenaires[sheetPart].lots!.map((lot, li) => {
                        const n = lot.gagnants ?? lot.quantite ?? 0
                        return (
                          <div className="pt-lot" key={lot.id || li}>
                            <div className="pt-lot-t">{lot.titre || lot.nom}</div>
                            {n > 0 ? <div className="pt-lot-q">{n} gagnant{n > 1 ? 's' : ''}</div> : null}
                            {lot.description ? <div className="pt-lot-d">{lot.description}</div> : null}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {(partenaires[sheetPart].site_web || partenaires[sheetPart].url) && <a className="sh-row" href={partenaires[sheetPart].site_web || partenaires[sheetPart].url || '#'} target="_blank" rel="noopener noreferrer" onClick={() => logClicPartenaire(partenaires[sheetPart].id, 'site_web', partenaires[sheetPart].site_web || partenaires[sheetPart].url || null)}><svg className="ic" style={{ width: 16, height: 16 }}><use href="#i-store" /></svg> Site web</a>}
                  {partenaires[sheetPart].instagram && <a className="sh-row" href={partenaires[sheetPart].instagram!} target="_blank" rel="noopener noreferrer" onClick={() => logClicPartenaire(partenaires[sheetPart].id, 'instagram', partenaires[sheetPart].instagram || null)}><svg className="ic" style={{ width: 16, height: 16 }}><use href="#i-insta" /></svg> Instagram</a>}
                  {partenaires[sheetPart].facebook && <a className="sh-row" href={partenaires[sheetPart].facebook!} target="_blank" rel="noopener noreferrer" onClick={() => logClicPartenaire(partenaires[sheetPart].id, 'facebook', partenaires[sheetPart].facebook || null)}><svg className="ic" style={{ width: 16, height: 16 }}><use href="#i-fb" /></svg> Facebook</a>}
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

        {bandOn && (
          <div className="botdock">
            {screen !== 'tickets' && partnerBand}
            {navOn && (
            <nav className="nav on" id="nav">
              <button className={`nb${screen === 'profil' ? ' on' : ''}`} onClick={() => nb('profil')}><svg className="ic"><use href="#i-user" /></svg>Profil</button>
              <button className={`nb${screen === 'carte' ? ' on' : ''}`} onClick={() => nb('carte')}><svg className="ic"><use href="#i-map" /></svg>Carte</button>
              <button className={`nb${screen === 'tickets' ? ' on' : ''}`} onClick={() => nb('tickets')}><svg className="ic"><use href="#i-ticket" /></svg>Tickets</button>
              <button className={`nb${screen === 'partenaires' ? ' on' : ''}`} onClick={() => nb('partenaires')}><svg className="ic"><use href="#i-store" /></svg>Partenaires</button>
            </nav>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
