'use client'

/**
 * Le telephone du joueur : injecte les ecrans du master (lib/masters/engine.ts),
 * gere la navigation (data-go) et les vraies actions de partie. Meme mecanique
 * que la maquette validee : un ecran = un rendu, les petits gestes (puces,
 * cases a cocher, segments) modifient l'ecran sur place.
 *
 * Ecritures : writeJoueur (lib/parcours.ts) — regles de QR, anti-doublon,
 * gain immediat (appliquer_regle_gain), parrainage. En apercu (?preview) ou en
 * maquette (?m=), rien n'est ecrit.
 */
import { chargerTicketsGainsJoueur } from '@/lib/moiTicketsGains'
import { useEffect, useRef, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import SuperEventMap from '@/app/se/_components/SuperEventMap'
import { supabase } from '@/lib/supabase'
import { getVisiteurId } from '@/lib/track'
import QRCode from 'qrcode'
import { MASTER_CSS } from '@/lib/masters/css'
import { rendreEcran, icon, etatInitial, rotationPourCase, regleBarre, regleParte, regleSuperReel, reglePastille, ecranExiste, DEROULES, type EtatPartie } from '@/lib/masters/engine'
import { chargerMesTickets, nonVus, versVue, marquerVus, TICKETS_EXEMPLE, type ResultatRow } from '@/lib/masters/tickets'
import type { VueMaster } from '@/lib/masters/resolve'
import { estDemo } from '@/lib/demo'
import { pushSupporte, permissionRefusee, rappelsCoches, definirRappels, armerPremiereDemande } from '@/lib/pushJoueur'
import { writeJoueur, getJoueurLocal, lookupJoueurByEmail, animationDejaJouee, dejaJoueAujourdhuiCeQr } from '@/lib/parcours'


/* ── Sons (lot 5 D) : Web Audio API, generes en code, style 8 bits, aucun fichier.
   Jamais de son avant un geste : le contexte audio n'est cree que dans un clic / un toucher.
   Bouton haut-parleur pour couper ; choix memorise (localStorage). Avec « reduire les animations »,
   le son est coupe au depart (le joueur peut l'allumer, son choix est alors memorise). ── */
const CLE_SON = 'flowin_son'
let ctxAudio: AudioContext | null = null
let sonActif = true
function mouvementReduit(): boolean {
  try { return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}
function lireSon(): boolean {
  try { const s = localStorage.getItem(CLE_SON); if (s === '0') return false; if (s === '1') return true } catch { /* ignore */ }
  return !mouvementReduit()
}
function ecrireSon(on: boolean) { try { localStorage.setItem(CLE_SON, on ? '1' : '0') } catch { /* ignore */ } }
/** A appeler dans un geste de l'utilisateur (clic / toucher) : cree ou reveille le contexte audio. */
function armerAudio() {
  try {
    if (!ctxAudio) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      ctxAudio = new AC()
    }
    if (ctxAudio.state === 'suspended') void ctxAudio.resume()
  } catch { /* ignore */ }
}
type Note = [number, number, number, OscillatorType?, number?]
const SONS: Record<string, Note[]> = {
  bonne: [[784, 0, .07, 'square'], [1175, .07, .13, 'square']],
  serie: [[659, 0, .07, 'square'], [784, .07, .07, 'square'], [988, .14, .07, 'square'], [1319, .21, .2, 'square']],
  mauvaise: [[392, 0, .12, 'triangle', .1], [311, .12, .2, 'triangle', .1]],
  tick: [[1500, 0, .025, 'square', .045]],
  clic: [[880, 0, .04, 'square', .05]],
  gain: [[523, 0, .08, 'square'], [659, .08, .08, 'square'], [784, .16, .08, 'square'], [1047, .24, .24, 'square']],
  fin: [[392, 0, .1, 'square'], [523, .1, .1, 'square'], [659, .2, .1, 'square'], [784, .3, .14, 'square'], [1047, .46, .4, 'square']],
}
function son(nom: string) {
  if (!sonActif || !ctxAudio) return
  const c = ctxAudio
  if (c.state === 'suspended') { c.resume().then(() => son(nom)).catch(() => { /* ignore */ }); return }
  if (c.state !== 'running') return
  try {
    const t0 = c.currentTime + .01
    ;(SONS[nom] || []).forEach(n => {
      const o = c.createOscillator(), g = c.createGain(), v = n[4] || .07
      o.type = n[3] || 'square'
      o.frequency.setValueAtTime(n[0], t0 + n[1])
      g.gain.setValueAtTime(.0001, t0 + n[1])
      g.gain.exponentialRampToValueAtTime(v, t0 + n[1] + .008)
      g.gain.exponentialRampToValueAtTime(.0001, t0 + n[1] + n[2])
      o.connect(g); g.connect(c.destination)
      o.start(t0 + n[1]); o.stop(t0 + n[1] + n[2] + .03)
    })
  } catch { /* ignore */ }
}
/* Ecrans de jeu qui portent le bouton haut-parleur. */
function ecranAvecSon(id: string): boolean { return /^(q|r|t)-/.test(id) || id === 'c-resultat' }
/* Son joue a l'arrivee sur un ecran (les sons de la roue sont lies a l'animation). */
const SON_ECRAN: Record<string, string> = { 'q-bonusok': 'gain', 't-res-instant': 'gain', 't-res-tirage': 'gain', 'c-billet': 'gain' }
function htmlBoutonSon(): string {
  return '<button class="iconbtn snd" data-son aria-pressed="' + sonActif + '" aria-label="' + (sonActif ? 'Couper le son' : 'Activer le son') + '">' + icon(sonActif ? 'speaker' : 'speakerOff', 22, 2) + '</button>'
}

/* Version du texte de consentement des masters (audit 17/11 : ajout des choix « rester en
   contact avec Flowin Event » et « rester en contact avec ce commerce »). */
const CONSENTEMENT_MASTER_VERSION = 'flowin-consentement-2026-11-17'
/* Enchainement automatique (ecran -> [suite, delai ms]) des ecrans sans decision. */
const AUTO_SUITE: Record<string, [string, number]> = {
  's-flash': ['s-accueil', 2600],
  'q-bonne': ['@suite-quiz', 1800],
  'q-mauvaise': ['@suite-quiz', 3000],
  't-impression': ['t-resultat', 3700],
  'r-tourne': ['r-resultat', 7800],
  'v-envoi': ['v-resultat', 2900],
}
/* Retour haptique (navigator.vibrate, ignore la ou il n'existe pas, ex. iOS Safari). */
const VIBRATIONS: Record<string, number | number[]> = {
  'q-bonne': 35, 'q-mauvaise': 15,
  'r-gain': [60, 50, 120], 't-res-instant': [60, 50, 120], 'c-billet': [60, 50, 120],
  'q-bonusok': [40, 40, 80], 'r-ticket': [40, 40, 80], 'c-ticket': 40, 'v-envoi': 30,
}
import { doitRefuserDigital } from '@/components/parcours/ParcoursHero'
import { buildInviteLink } from '@/lib/parrainage'
import { generateTicket } from '@/lib/ticket'
import type { TicketPrefix } from '@/lib/types'
import { proposerInstallation, marquerInstallee, refuserProposition, ecouterInstallation, installationNativeDisponible, lancerInstallationNative } from '@/lib/pwaInstall'

interface Props {
  vue: VueMaster
  demo: boolean
  evId: string | null
  prefixe: string
  source: string
  debut: string | null
  barre: boolean
  timer: number
  tableAbsente: boolean
  /** ?preview=1 : apercu de creation / du Super Admin (rien n'est ecrit, etat d'exemple pour les ecrans de fin). */
  apercu?: boolean
}

const CADRE_CSS = `
html,body{margin:0;padding:0;height:100%;background:var(--fl-paper)}
.fm-page{min-height:100dvh;display:flex;justify-content:center;align-items:flex-start;background:var(--fl-paper)}
.fm-host{position:relative;width:100%;max-width:430px;height:100dvh;overflow:hidden;background:#fff;isolation:isolate}
@media (min-width:700px){
  .fm-page{align-items:center;padding:20px 0}
  .fm-host{width:390px;height:min(844px,calc(100dvh - 40px));border-radius:40px;border:1.5px solid var(--fl-field);box-shadow:0 0 0 6px #fff,0 0 0 7.5px var(--fl-field),0 18px 34px rgba(27,58,92,.10)}
}
`

export default function JouerClient(p: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const etat = useRef<EtatPartie>(etatInitial())
  const pile = useRef<string[]>([])
  const courant = useRef<string>('')
  const minuteurs = useRef<number[]>([])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const v = p.vue
    const r = etat.current
    regleBarre(p.barre)
    sonActif = lireSon()
    const reduit = mouvementReduit()
    let raf = 0
    let enSortie = false
    const seReel = !p.demo && v.superEvent && v.superEvent.id ? v.superEvent.id : ''
    regleSuperReel(seReel)
    let carteRoot: Root | null = null
    let maPosition: { lat: number; lng: number } | null = null
    const local = getJoueurLocal()
    if (local) {
      r.profil = { prenom: local.prenom, nom: local.nom, email: local.email, tel: local.tel, cp: local.cp, age: local.age, genre: local.genre }
      /* Joueur reconnu sur ce téléphone (id gardé en local) : le formulaire de coordonnées se replie ; les 3 cases restent. */
      r.connu = !!(local.id && local.prenom && local.nom && (local.tel || '').replace(/\s/g, '').length >= 8)
    }

    function nettoyer() { minuteurs.current.forEach(id => { clearInterval(id); clearTimeout(id) }); minuteurs.current = []; if (raf) { cancelAnimationFrame(raf); raf = 0 } }
    function plus_tard(fn: () => void, ms: number) { minuteurs.current.push(window.setTimeout(fn, ms)) }

    /* Navigation (audit 31/10) : chaque ecran est une entree d'historique
       (pushState) ; le bouton retour du navigateur et les boutons Retour
       internes ramenent a l'ecran precedent du parcours, sans quitter la page
       et sans perdre l'etat de la partie. Dans un cadre d'apercu (iframe),
       l'historique du parent n'est pas touche (pile interne). */
    /* Resultats de tirage a decouvrir (alerte joueur) : file des non vus, pastille sur « Profil ». */
    const file = { current: [] as ResultatRow[] }
    const demoPastille = !!(p.demo && p.debut === 'c-profil')
    const joueurLocal = !p.demo && !p.apercu ? getJoueurLocal() : null
    function vuResultat(id: string) {
      if (!joueurLocal) return
      file.current = file.current.filter(x => x.id !== id)
      reglePastille(file.current.length)
      marquerVus(joueurLocal.id, [id])
    }
    function chargerProfil(apresChargement?: () => void) {
      if (!joueurLocal) return
      chargerMesTickets(joueurLocal.id).then(d => {
        r.mesTickets = d.groupes
        file.current = nonVus(d.resultats)
        reglePastille(file.current.length)
        if (apresChargement) apresChargement()
        else if (courant.current === 'c-profil') montrer('c-profil', true)
        else { const pa = host!.querySelector('.nav a:last-child') as HTMLElement | null; if (pa && !pa.querySelector('.pastille') && file.current.length) pa.insertAdjacentHTML('beforeend', '<span class="pastille">' + file.current.length + '</span>') }
      }).catch(() => { /* mode degrade : ancien affichage */ })
    }

    /* L'etat de la partie survit a un aller-retour (ex. une station du super
       event puis retour navigateur) : sessionStorage, propre a l'onglet. */
    const cleEtat = 'fm_etat_' + (p.evId || ('m-' + v.id))
    const enCadre = (() => { try { return window.self !== window.top } catch { return true } })()
    function montrer(id: string, sansPile?: boolean) {
      if (!ecranExiste(id)) id = 's-accueil'
      /* Retour sur une question deja repondue : on remontre la correction. */
      if (id === 'q-question' && r.rep[r.qi] != null) id = r.rep[r.qi] === (v.questions[r.qi] || { ok: -1 }).ok ? 'q-bonne' : 'q-mauvaise'
      nettoyer()
      enSortie = false
      if (carteRoot) { const cr = carteRoot; carteRoot = null; setTimeout(() => { try { cr.unmount() } catch { /* ignore */ } }, 0) }
      const prec = courant.current
      if (!sansPile && prec && prec !== id) {
        pile.current.push(prec)
        if (!enCadre) { try { history.pushState({ ...(history.state || {}), fm: id, n: pile.current.length }, '', '#' + id) } catch { /* ignore */ } }
      }
      courant.current = id
      reglePastille(demoPastille ? 2 : file.current.length)
      if (id === 'c-resultat' && r.resultat && !p.demo && !p.apercu) vuResultat(r.resultat.id)
      try { sessionStorage.setItem(cleEtat, JSON.stringify({ r, id, pile: pile.current })) } catch { /* ignore */ }
      host!.innerHTML = rendreEcran(v, r, id)
      const el = host!.firstElementChild as HTMLElement | null
      if (el) el.scrollTop = 0
      entree(id, el)
      majInstall()
    }

    /* Raccourci « ecran d'accueil » (lib/pwaInstall.ts) : l'entree n'est montree
       que si l'application n'est PAS installee et n'a pas ete refusee
       recemment. En apercu / maquette / cadre : toujours visible (ecran a montrer). */
    const apercuInstall = p.demo || !!p.apercu || enCadre
    function majInstall() {
      const voir = proposerInstallation({ apercu: apercuInstall })
      host!.querySelectorAll('[data-pwa-entree]').forEach(x => { (x as HTMLElement).style.display = voir ? '' : 'none' })
      const b = host!.querySelector('[data-pwa-installer]') as HTMLElement | null
      if (b) b.style.display = !apercuInstall && installationNativeDisponible() ? '' : 'none'
    }
    const arretInstall = apercuInstall ? null : ecouterInstallation(majInstall)
    function retour(repli: string) {
      if (!enCadre && pile.current.length && history.state && history.state.fm) { history.back(); return }
      const prec = pile.current.pop()
      montrer(prec || (repli && repli !== '@retour' ? repli : 's-accueil'), true)
    }
    function surPopstate(e: PopStateEvent) {
      const id = e.state && e.state.fm ? String(e.state.fm) : (pile.current[0] || courant.current)
      if (e.state && typeof e.state.n === 'number') pile.current.length = Math.min(pile.current.length, Math.max(0, e.state.n))
      else pile.current.length = 0
      montrer(id, true)
    }
    window.addEventListener('popstate', surPopstate)

    /* Roue (lot 5 D) : rotation pilotee image par image. Depart avec un petit recul, grande vitesse puis
       inertie, arret AU BORD de la case gagnante (suspense au dernier cran), tremblement, dernier cran franchi,
       rebond amorti. Un tick de son + un coup d'aiguille a chaque cran. Le resultat est celui deja tire (r.caseIdx). */
    function lancerRoue(el: HTMLElement) {
      const w = el.querySelector('.wheel') as HTMLElement | null, b = el.querySelector('.wheelbox') as HTMLElement | null
      const aig = el.querySelector('.pointer') as SVGElement | null
      if (!w || !b) return
      const cible = r.rotation, n = Math.max(2, v.cases.length), pas = 360 / n
      const cas = r.caseIdx != null ? v.cases[r.caseIdx] : null
      const issue = () => {
        w.style.transform = 'rotate(' + cible + 'deg)'
        el.classList.remove('en-cours')
        if (cas && cas.issue !== 'perdu') { son('gain'); vibrer([60, 50, 120]) } else { son('mauvaise'); vibrer(15) }
      }
      if (reduit) { issue(); return }
      el.classList.add('en-cours')
      const a0 = -12, recul = a0 - 14, bord = cible - pas / 2 - 1.5, apres = cible + 2.5
      const T1 = 260, T2 = 4200, T3 = 480, T4 = 520, T5 = 560, TOTAL = T1 + T2 + T3 + T4 + T5
      function angle(t: number): number {
        if (t < T1) { const x = t / T1; return a0 - 14 * (1 - Math.pow(1 - x, 2)) }
        t -= T1
        if (t < T2) { let x = t / T2; x = (x < .1 ? x * x / .2 : x - .05) / .95; return recul + (bord - recul) * (1 - Math.pow(1 - x, 3.2)) }
        t -= T2
        if (t < T3) return bord + Math.sin(t / 38) * .35
        t -= T3
        if (t < T4) { const x = t / T4; return bord + (apres - bord) * (x * x * (3 - 2 * x)) }
        t -= T4
        if (t < T5) { const x = t / 1000; return cible + 2.5 * Math.exp(-5.5 * x) * Math.cos(2 * Math.PI * 1.7 * x) }
        return cible
      }
      let dernier = Math.floor((a0 + pas / 2) / pas), dernierTick = 0
      const debut = performance.now()
      w.style.transition = 'none'
      w.style.transform = 'rotate(' + a0 + 'deg)'
      const pas_ = (now: number) => {
        if (courant.current !== 'r-tourne') { raf = 0; return }
        const t = now - debut
        if (t >= TOTAL) { raf = 0; b.classList.add('rebond'); issue(); return }
        const ang = angle(t)
        w.style.transform = 'rotate(' + ang.toFixed(2) + 'deg)'
        const seg = Math.floor((ang + pas / 2) / pas)
        if (seg !== dernier) {
          dernier = seg
          if (now - dernierTick > 45) { dernierTick = now; son('tick') }
          try { if (aig && aig.animate) aig.animate([{ transform: 'rotate(-20deg)' }, { transform: 'rotate(0deg)' }], { duration: 110, easing: 'ease-out' }) } catch { /* ignore */ }
        }
        raf = requestAnimationFrame(pas_)
      }
      raf = requestAnimationFrame(pas_)
      /* Filet : si l'onglet est en arriere-plan (pas d'image), l'etat final est pose quand meme. */
      plus_tard(() => { if (courant.current === 'r-tourne' && el.classList.contains('en-cours')) { if (raf) { cancelAnimationFrame(raf); raf = 0 } issue() } }, TOTAL + 600)
    }

    /* Animations et minuteurs d'entree d'ecran. */
    function entree(id: string, el: HTMLElement | null) {
      if (!el) return
      /* Audit jeux 17/11 : retour haptique et enchainement automatique des ecrans d'attente.
         Le bouton reste affiche (le joueur presse peut toucher avant). Jamais dans un cadre
         d'apercu ni sur un ecran de depart impose (navigation manuelle du Super Admin). */
      vibrer(VIBRATIONS[id])
      if (ecranAvecSon(id)) {
        const cible = el.querySelector('.qtop') || el.querySelector('.hdr')
        if (cible && !cible.querySelector('[data-son]')) cible.insertAdjacentHTML('beforeend', htmlBoutonSon())
      }
      if (id === 'q-bonne') son((r.serie || 0) >= 3 ? 'serie' : 'bonne')
      else if (id === 'q-mauvaise') son('mauvaise')
      else if (id === 'q-resultat') { if (v.questions.length && r.bonnes / v.questions.length >= .6) son('fin') }
      else if (id === 'c-resultat') { if (r.resultat && r.resultat.statut === 'gagne') son('fin') }
      else if (SON_ECRAN[id]) son(SON_ECRAN[id])
      const auto = AUTO_SUITE[id]
      if (auto && !enCadre && !p.apercu) plus_tard(() => { if (courant.current === id) aller(auto[0]) }, auto[1])
      if (id === 'q-question' && p.timer > 0) {
        let n = p.timer
        const b = el.querySelector('.tnum'), ring = el.querySelector('.tring')
        if (b) b.textContent = String(n)
        const iv = window.setInterval(() => {
          n--
          if (b) b.textContent = String(Math.max(0, n))
          if (ring) ring.setAttribute('stroke-dashoffset', (138.2 * (1 - n / p.timer)).toFixed(1))
          if (n <= 0) { clearInterval(iv); repondre(null) }
        }, 1000)
        minuteurs.current.push(iv)
      }
      if (id === 'q-resultat') {
        const s = el.querySelector('.score') as HTMLElement | null
        if (s) {
          const fin = r.bonnes, tot = v.questions.length
          let i = 0; s.textContent = '0/' + tot
          plus_tard(() => {
            const iv = window.setInterval(() => { if (i >= fin) { clearInterval(iv); return } i++; s.textContent = i + '/' + tot }, 380)
            minuteurs.current.push(iv)
          }, 300)
        }
      }
      if (id === 'r-tourne') lancerRoue(el)
      const q = el.querySelector('[data-qr]') as HTMLElement | null
      if (q && r.ticket) {
        const contenu = r.gain && r.gain.token ? location.origin + '/lot.html?t=' + encodeURIComponent(r.gain.token) : (q.getAttribute('data-qr') || r.ticket)
        QRCode.toString(contenu, { type: 'svg', margin: 0, width: 110, color: { dark: '#1B3A5C', light: '#FFFFFF' } }).then(svg => { q.innerHTML = svg }).catch(() => { /* garde l'illustration */ })
      }
      if (id === 'c-inscription') majValider()
      /* Rappels (Web Push, 24/11) : case cochee par defaut sur les ecrans de gain / ticket ; la demande du telephone
         n'est faite qu'une fois, au premier toucher. Masquee si le telephone ne sait pas notifier. Demo : visible, inerte. */
      if (id === 'c-billet' || id === 'c-ticket') {
        const lr = el.querySelector('[data-rappels]') as HTMLElement | null
        if (lr && !p.apercu && ((p.demo && !enCadre) || (pushSupporte() && !permissionRefusee()))) {
          lr.style.display = 'flex'
          const cb = lr.querySelector('input') as HTMLInputElement | null
          const jl = p.demo ? null : getJoueurLocal()
          if (cb) {
            cb.checked = p.demo ? true : rappelsCoches()
            cb.addEventListener('change', () => { if (jl) void definirRappels(jl.id, cb.checked) })
          }
          if (jl) armerPremiereDemande(jl.id)
        }
      }
      if (id === 'c-profil' && joueurLocal) chargerProfil()
      if (seReel && id === 'sj-carte') monterCarte(el)
      if (seReel && id === 'sj-tickets') chargerTicketsSe(el)
      if (id === 'c-demain') {
        const c = el.querySelector('[data-compte]')
        if (c) { const d = new Date(), m = (24 * 60) - (d.getHours() * 60 + d.getMinutes()); c.textContent = Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') }
      }
    }

    /* ── Super event reel : carte, autour de moi, super tickets ─────────── */
    const stations = (v.superEvent && v.superEvent.stations) || []
    function stationJouee(id: string) { try { return animationDejaJouee(id) } catch { return false } }
    function monterCarte(el: HTMLElement) {
      const zone = el.querySelector('[data-carte-se]') as HTMLElement | null
      const jouees = stations.filter(x => stationJouee(x.id)).length
      const prog = el.querySelector('[data-se-prog]'), barreSe = el.querySelector('[data-se-barre]') as HTMLElement | null
      if (prog) prog.textContent = jouees + ' station' + (jouees > 1 ? 's' : '') + ' jouée' + (jouees > 1 ? 's' : '') + ' sur ' + stations.length
      if (barreSe) barreSe.style.width = (stations.length ? Math.round(jouees / stations.length * 100) : 0) + '%'
      if (!zone) return
      if (!stations.some(x => x.lat != null && x.lng != null)) { zone.innerHTML = '<div style="height:100%;display:grid;place-items:center;text-align:center;padding:20px;font-weight:700;color:#3a4d63">Les adresses des stations ne sont pas encore géolocalisées. La liste ci-dessous reste à jour.</div>'; return }
      carteRoot = createRoot(zone)
      carteRoot.render(createElement(SuperEventMap, {
        lieux: stations.map(x => ({ id: x.id, nom: x.nom, lat: x.lat, lng: x.lng, module: x.module, adresse: x.adresse, categorie: x.categorie, joue: stationJouee(x.id) })),
        mode: 'jeu', height: '100%', showPosition: !!maPosition,
        onSelect: (sid: string) => { const c = host!.querySelector('[data-station="' + sid.replace(/"/g, '') + '"]') as HTMLElement | null; if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.style.boxShadow = '0 0 0 3px var(--fl-super-jaune)' } },
      }))
    }
    function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
      const R = 6371, t = (d: number) => d * Math.PI / 180
      const x = Math.sin(t(b.lat - a.lat) / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(t(b.lng - a.lng) / 2) ** 2
      return 2 * R * Math.asin(Math.sqrt(x))
    }
    function autourDeMoi() {
      const msg = host!.querySelector('[data-geo-msg]')
      const consent = !!host!.querySelector('[data-consent-geo].on')
      if (!navigator.geolocation) { if (msg) msg.textContent = 'Ton téléphone ne permet pas la géolocalisation.'; return }
      if (msg) msg.textContent = 'Ton téléphone va te demander l\'autorisation…'
      navigator.geolocation.getCurrentPosition(pos => {
        maPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const liste = host!.querySelector('[data-stations]')
        if (liste) {
          const cartes = Array.prototype.slice.call(liste.querySelectorAll('[data-station]')) as HTMLElement[]
          cartes.map(c => { const st = stations.find(x => x.id === c.getAttribute('data-station')); const d = st && st.lat != null && st.lng != null ? distanceKm(maPosition!, { lat: st.lat, lng: st.lng }) : 9999; const z = c.querySelector('[data-dist]'); if (z && d < 9999) z.lastChild!.textContent = (d < 1 ? Math.round(d * 1000) + ' m' : d.toFixed(1).replace('.', ',') + ' km') + ' · à jouer sur place'; return { c, d } })
            .sort((a, b) => a.d - b.d).forEach(x => liste.appendChild(x.c))
        }
        if (msg) msg.textContent = 'Commerces triés du plus proche au plus loin.' + (consent ? ' Position approximative enregistrée.' : ' Ta position n\'est pas enregistrée.')
        const el = host!.firstElementChild as HTMLElement | null
        if (el && carteRoot) { const cr = carteRoot; carteRoot = null; try { cr.unmount() } catch { /* ignore */ } monterCarte(el) }
        /* Enregistrement UNIQUEMENT avec le consentement explicite, arrondi a
           2 decimales (~1 km), une seule fois, sans suivi continu.
           Table positions_joueurs (sql/2026-10-31-positions-joueurs.sql) :
           absente = echec silencieux. */
        if (consent && seReel) {
          const local = getJoueurLocal()
          supabase.from('positions_joueurs').insert({
            super_event_id: seReel, event_id: p.evId, joueur_id: local?.id || null, visiteur_id: getVisiteurId(),
            lat: Math.round(maPosition.lat * 100) / 100, lng: Math.round(maPosition.lng * 100) / 100, consentement: true,
          }).then(() => { /* ignore */ }, () => { /* table absente */ })
        }
      }, () => { if (msg) msg.textContent = 'Position non partagée : la liste reste dans l\'ordre des stations.' }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 })
    }
    async function chargerTicketsSe(el: HTMLElement) {
      const zone = el.querySelector('[data-se-tickets]'), nb = el.querySelector('[data-se-nb]')
      const local = getJoueurLocal()
      if (!zone) return
      if (!local || !local.id) { zone.innerHTML = '<div class="card" style="padding:14px 16px;margin-top:12px;font-weight:600;color:#3a4d63">Joue dans une station pour gagner ton premier super ticket.</div>'; return }
      const data = seReel ? (await chargerTicketsGainsJoueur(local.id, seReel)).tickets : []
      const rows = (data ?? []) as { event_id: string; type: string; jour: string }[]
      if (nb) nb.textContent = String(rows.length)
      const nomSt = (id: string) => (stations.find(x => x.id === id) || { nom: id }).nom
      const e2 = (x: string) => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c])
      zone.innerHTML = rows.length ? rows.map((t, i) => '<div class="panel" style="display:flex;margin-top:12px;box-shadow:4px 4px 0 #1B3A5C"><span style="width:14px;background:' + (i % 2 ? 'var(--fl-super-bleu)' : 'var(--fl-super-rouge)') + ';border-right:3px solid #1B3A5C"></span><div style="flex:1;padding:10px 14px"><b class="num" style="font-size:16px;font-weight:800">' + (t.type === 'bonus' ? 'Bonus' : 'Ticket') + ' · ' + e2(t.jour) + '</b><small style="display:block;font-size:12.5px;font-weight:700;color:var(--muted)">' + e2(nomSt(t.event_id)) + '</small></div></div>').join('')
        : '<div class="card" style="padding:14px 16px;margin-top:12px;font-weight:600;color:#3a4d63">Pas encore de super ticket : joue dans une station.</div>'
    }

    function vibrer(motif?: number | number[]) {
      if (!motif) return
      try { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(motif) } catch { /* ignore */ }
    }
    function repondre(i: number | null) {
      if (courant.current !== 'q-question') return
      const q = v.questions[r.qi]
      r.rep[r.qi] = i
      const ok = q && i === q.ok
      if (ok) { r.bonnes++; r.serie = (r.serie || 0) + 1 } else r.serie = 0
      montrer(ok ? 'q-bonne' : 'q-mauvaise')
    }

    function numero(code: string): string { const m = code.match(/(\d{4})\s*$/); return m ? m[1] : '0000' }
    function choisirCase(): number {
      const n = v.cases.length
      const eligibles = v.cases.map((c, i) => ({ c, i })).filter(x => x.c.stock === undefined || x.c.stock > 0)
      const pool = eligibles.length ? eligibles : v.cases.map((c, i) => ({ c, i }))
      return n ? pool[Math.floor(Math.random() * pool.length)].i : 0
    }

    function lireForm() {
      const val = (id: string) => ((host!.querySelector('#' + id) as HTMLInputElement | null)?.value || '').trim()
      const on = (sel: string) => host!.querySelector(sel + '.on') as HTMLElement | null
      return {
        prenom: val('f1'), nom: val('f2'), email: val('f3'), tel: val('f4'), cp: val('f6'),
        genre: on('[data-genre]')?.getAttribute('data-genre') || '',
        age: on('[data-one="age"]')?.getAttribute('data-val') || '',
        src: on('[data-one="src"]')?.getAttribute('data-val') || '',
        jeu: !!on('[data-consent="jeu"]'), anim: !!on('[data-consent="anim"]'), com: !!on('[data-consent="com"]'),
      }
    }
    function majValider() {
      const need = host!.querySelector('[data-need]') as HTMLButtonElement | null
      if (!need) return
      let ok = true
      host!.querySelectorAll('[data-req]').forEach(x => { if (!x.classList.contains('on')) ok = false })
      need.disabled = !ok || r.envoi
      const mm = need.parentNode ? (need.parentNode as HTMLElement).querySelector('.mention') : null
      if (mm) mm.textContent = ok ? 'Tes données servent uniquement au jeu.' : 'Coche la première case pour valider.'
    }

    async function valider() {
      const f = lireForm()
      let err = ''
      if (!f.prenom || !f.nom) err = 'Indique ton prénom et ton nom.'
      else if (f.email.indexOf('@') < 1) err = 'Ton email semble incomplet.'
      else if (f.tel.replace(/\s/g, '').length < 8) err = 'Ton numéro de téléphone semble incomplet.'
      else if (!f.jeu) err = 'Coche la première case pour valider.'
      r.profil = { prenom: f.prenom, nom: f.nom, email: f.email, tel: f.tel, cp: f.cp, age: f.age, genre: f.genre, src: f.src }
      r.consent = { jeu: f.jeu, anim: f.anim, com: f.com }
      if (err) { r.erreur = err; montrer('c-inscription', true); return }
      r.erreur = ''
      const apres = r.after || 'c-ticket'
      if (p.demo || !p.evId) { r.ticket = generateTicket(p.prefixe as TicketPrefix); r.inscrit = true; montrer(apres); return }
      r.envoi = true; majValider()
      const parfait = v.questions.length > 0 && r.bonnes >= v.questions.length
      const quiz = v.key === 'quiz' || v.key === 'solo'
      const cas = r.caseIdx != null ? v.cases[r.caseIdx] : null
      const bonus: Record<string, unknown> = {}
      if (v.key === 'vote' && r.voteIdx != null) { bonus.vote_mode = r.vitrineVote ? 'vitrine' : 'choix'; bonus.vote_choix = (r.vitrineVote ? v.vitrines : v.candidats)[r.voteIdx]?.nom ?? null }
      Object.keys(reponsesBonus).forEach(k => { bonus[k] = reponsesBonus[k] })
      /* Choix « rester en contact avec ce commerce » : trace avec les reponses de la partie
         (se_reponses), sans nouvelle colonne. « Rester en contact avec Flowin Event » = optin. */
      bonus.optin_commerce = f.com
      bonus.optin_flowin_event = f.anim
      const res = await writeJoueur({
        email: f.email, prenom: f.prenom, nom: f.nom, tel: f.tel, code_postal: f.cp || undefined,
        genre: f.genre || undefined, age_tranche: f.age || undefined, decouverte: f.src || undefined,
        score_moy: quiz ? r.bonnes + '/' + v.questions.length : undefined,
        lot_gagne: cas && cas.issue === 'imm' ? cas.label : undefined,
        events: [p.evId], ticket_code: r.ticket || generateTicket(p.prefixe as TicketPrefix), source: p.source, prefix: p.prefixe,
        bonus_reponses: Object.keys(bonus).length ? bonus : undefined,
        optin: f.anim, optin_version: CONSENTEMENT_MASTER_VERSION,
        ...(quiz ? { quiz_ticket: parfait, bonus_ticket: r.bonusFait } : {}),
      })
      r.envoi = false
      if (res.digitalRefuse) { montrer('c-digital'); return }
      if (res.duplicate) { r.ticket = res.ticket; r.inscrit = true; montrer('c-demain'); return }
      if (!res.success) { r.erreur = 'Enregistrement impossible pour le moment, réessaie dans un instant.'; montrer('c-inscription', true); return }
      r.ticket = res.ticket
      r.inscrit = true
      if (res.gain) { r.gain = { lot: res.gain.lot, cond: res.gain.conditions || 'Gain immédiat', token: res.gain.retraitToken }; if (res.gain.ticketCode) r.ticket = res.gain.ticketCode; montrer('c-billet'); return }
      /* Mode demo (?demo=1) sur un event de demonstration existant : les ecritures sont court-circuitees,
         la base ne renvoie donc jamais de gain. La case « gain immediat » de la roue montre quand meme
         son billet (lot de la case), comme en vrai ; rien n'est enregistre. */
      if (!res.gain && apres === 'c-billet' && estDemo()) {
        /* Le lot de demo est range dans l'onglet (sessionStorage) : /moi?demo=1 le montre dans « Mes lots ». */
        try {
          const cs = r.caseIdx != null ? v.cases[r.caseIdx] : null
          const k = 'flowin_demo_lots', l = JSON.parse(sessionStorage.getItem(k) || '[]')
          l.unshift({ commerce: v.billetChez || v.who.nom, lot: cs ? cs.label : v.billet.nom, ticketCode: r.ticket, eventId: p.evId })
          sessionStorage.setItem(k, JSON.stringify(l.slice(0, 5)))
        } catch { /* ignore */ }
        montrer('c-billet'); return
      }
      montrer(apres === 'c-billet' && !res.gain ? 'c-ticket' : apres)
    }

    const reponsesBonus: Record<string, string> = {}

    function partager(canal: string) {
      const champ = host!.querySelector('#fpar') as HTMLInputElement | null
      if (champ && champ.value.trim()) r.profil = { ...(r.profil || {}), email: champ.value.trim() }
      const email = (r.profil?.email || getJoueurLocal()?.email || '').trim().toLowerCase()
      const base = p.evId ? '/jouer?ev=' + encodeURIComponent(p.evId) : location.pathname + location.search
      const lien = email.indexOf('@') > 0
        ? buildInviteLink(base, 'j-' + p.prefixe.toLowerCase() + '-' + email.replace(/[^a-z0-9]/g, '-').substring(0, 36), p.evId || undefined, 'wa') + '&source=parrainage'
        : new URL(base, location.origin).toString()
      const texte = 'Je joue chez ' + v.who.nom + ' : une partie gratuite par jour, des lots à gagner. Viens jouer avec moi ! ' + lien
      if (canal === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(texte), '_blank')
      if (canal === 'sms') location.href = 'sms:?&body=' + encodeURIComponent(texte)
      if (canal === 'mail') location.href = 'mailto:?subject=' + encodeURIComponent('Viens jouer chez ' + v.who.nom) + '&body=' + encodeURIComponent(texte)
    }

    /* Transition entre deux questions : la carte sort a gauche, la suivante entre a droite (une seule fois). */
    function sortir(fn: () => void) {
      if (enSortie) return
      const scr = host!.firstElementChild as HTMLElement | null
      if (reduit || !scr) { fn(); return }
      enSortie = true
      scr.classList.add('qsort')
      plus_tard(fn, 210)
    }

    function aller(go: string, repli?: string) {
      if (go === '@retour') { retour(repli || ''); return }
      if (go === '@suite-quiz') { aller(r.qi + 1 < v.questions.length ? 'q-suivante' : 'q-resultat'); return }
      if (go === 'q-suivante') { sortir(() => { r.qi = Math.min(r.qi + 1, v.questions.length - 1); montrer('q-question') }); return }
      if (go === 'q-question') { if (courant.current === 's-regles') { r.qi = 0; r.bonnes = 0; r.serie = 0; r.rep = [] } montrer('q-question'); return }
      if (go === 'q-bonus' && courant.current === 'q-bonusintro') { r.bi = 0; Object.keys(reponsesBonus).forEach(k => { if (k.indexOf('bonus_') === 0) delete reponsesBonus[k] }) }
      if (go === 'q-bonusvalider') { r.bonusFait = true; montrer('q-bonusok'); return }
      if (go === 'r-lancer') { r.caseIdx = choisirCase(); r.rotation = rotationPourCase(v, r.caseIdx); montrer('r-tourne'); return }
      if (go === 'r-resultat') { const c = r.caseIdx != null ? v.cases[r.caseIdx] : null; montrer(!c ? 'r-perdu' : c.issue === 'imm' ? 'r-gain' : c.issue === 'tir' ? 'r-ticket' : 'r-perdu'); return }
      if (go === 't-impression') { r.ticket = r.ticket || generateTicket(p.prefixe as TicketPrefix); r.tombolaNo = numero(r.ticket); montrer('t-impression'); return }
      if (go === 't-resultat') { montrer('t-res-tirage'); return }
      if (go === 'v-voter') { if (r.voteIdx == null) return; montrer('v-envoi'); return }
      if (go === 'c-valider') { valider(); return }
      if (go === '@insc-2' || go === '@insc-1') {
        /* Formulaire en 2 volets (audit 17/11) : on bascule sans re-rendre, les saisies restent en place. */
        const scr = host!.querySelector('.insc') as HTMLElement | null
        if (!scr) return
        const f = lireForm()
        r.profil = { ...(r.profil || {}), prenom: f.prenom, nom: f.nom, email: f.email, tel: f.tel }
        let err = ''
        if (go === '@insc-2') {
          if (!f.prenom || !f.nom) err = 'Indique ton prénom et ton nom.'
          else if (f.email.indexOf('@') < 1) err = 'Ton email semble incomplet.'
          else if (f.tel.replace(/\s/g, '').length < 8) err = 'Ton numéro de téléphone semble incomplet.'
        }
        let box = scr.querySelector('.fm-err') as HTMLElement | null
        if (err) {
          if (!box) { box = document.createElement('p'); box.className = 'fm-err'; box.setAttribute('role', 'alert'); const b = scr.querySelector('.body'); if (b) b.appendChild(box) }
          box.textContent = err; return
        }
        if (box) box.remove()
        r.inscVolet = go === '@insc-2' ? 2 : 1
        scr.classList.remove('v1', 'v2'); scr.classList.add('v' + r.inscVolet)
        scr.scrollTop = 0; window.scrollTo(0, 0); vibrer(8)
        return
      }
      if (go === 'c-resultat') { const x = file.current[0]; if (x) r.resultat = versVue(x); montrer('c-resultat'); return }
      if (go === 'sj-geo') { autourDeMoi(); return }
      if (go === 'c-inscription') { const ch = host!.querySelector('#fpar') as HTMLInputElement | null; if (ch && ch.value.trim()) r.profil = { ...(r.profil || {}), email: ch.value.trim() } }
      if (go === 'c-code' || go === 'c-mdp') { r.erreur = 'L\'espace client arrive bientôt : en attendant, tes tickets et tes lots te sont envoyés par email.'; montrer('c-connexion', true); r.erreur = ''; return }
      montrer(go)
    }

    function clic(e: MouseEvent) {
      const t = e.target as HTMLElement
      armerAudio()
      const bs = t.closest('[data-son]') as HTMLElement | null
      if (bs) {
        sonActif = !sonActif; ecrireSon(sonActif)
        host!.querySelectorAll('[data-son]').forEach(x => { x.setAttribute('aria-pressed', String(sonActif)); x.setAttribute('aria-label', sonActif ? 'Couper le son' : 'Activer le son'); x.innerHTML = icon(sonActif ? 'speaker' : 'speakerOff', 22, 2) })
        if (sonActif) son('clic')
        return
      }
      const bon = t.closest('[data-bon]') as HTMLElement | null
      if (bon) {
        /* Bonus : une question par ecran, la suite arrive toute seule (pas de bouton Valider). */
        if (host!.querySelector('.bopt.pick')) return
        const k = Number(bon.getAttribute('data-bon')), n = v.bonus.length
        reponsesBonus['bonus_' + k] = bon.getAttribute('data-val') || ''
        bon.classList.add('pick')
        host!.querySelectorAll('.bopt').forEach(x => { if (x !== bon) x.classList.add('faded') })
        const anneau = host!.querySelector('.bring'); if (anneau) anneau.classList.add('on')
        vibrer(12); son('clic')
        plus_tard(() => {
          if (k + 1 < n) sortir(() => { r.bi = k + 1; montrer('q-bonus') })
          else aller('q-bonusvalider')
        }, reduit ? 300 : 900)
        return
      }
      /* Raccourci : memoriser « installe » / « plus tard » (jamais en apercu). */
      if (!apercuInstall) {
        if (t.closest('[data-pwa-fait]')) { marquerInstallee(); majInstall() }
        if (t.closest('[data-pwa-refus]')) { refuserProposition(); majInstall() }
        if (t.closest('[data-pwa-installer]')) { lancerInstallationNative().then(res => { majInstall(); if (res === 'accepted') retour('') }); return }
      }
      const href = t.closest('[data-href]') as HTMLElement | null
      if (href) { location.href = href.getAttribute('data-href') || '/'; return }
      const rep = t.closest('[data-rep]') as HTMLElement | null
      if (rep) {
        /* Retour immediat : la reponse touchee passe en couleur pleine, puis le verdict. */
        if (host!.querySelector('.opt.pick')) return
        rep.classList.add('pick')
        vibrer(12)
        plus_tard(() => repondre(Number(rep.getAttribute('data-rep'))), 260)
        return
      }
      const sh = t.closest('[data-share]') as HTMLElement | null
      if (sh) { partager(sh.getAttribute('data-share') || 'wa'); return }
      const seg = t.closest('[data-seg]') as HTMLElement | null
      if (seg) {
        const on = seg.classList.contains('on')
        seg.parentNode!.querySelectorAll('[data-seg]').forEach(b => b.classList.remove('on'))
        if (!on || seg.hasAttribute('data-cx')) seg.classList.add('on')
        if (seg.hasAttribute('data-cx')) {
          const tel = seg.getAttribute('data-cx') === 'tel', lb = host!.querySelector('[data-cx-lbl]'), inp = host!.querySelector('#c1') as HTMLInputElement | null
          if (lb) lb.textContent = tel ? 'Ton téléphone' : 'Ton email'
          if (inp) { inp.type = tel ? 'tel' : 'email'; inp.value = tel ? (r.profil?.tel || '') : (r.profil?.email || '') }
        }
        return
      }
      const one = t.closest('[data-one]') as HTMLElement | null
      if (one) {
        const grp = one.getAttribute('data-one')
        host!.querySelectorAll('[data-one="' + grp + '"]').forEach(b => b.classList.remove('on'))
        one.classList.add('on')
        if (grp === 'os') {
          host!.querySelectorAll('[data-os]').forEach(x => { (x as HTMLElement).style.display = x.getAttribute('data-os') === one.getAttribute('data-osv') ? '' : 'none' })
          const note = host!.querySelector('[data-os-note]'); if (note) note.textContent = one.getAttribute('data-osv') === 'ios' ? 'Sur iPhone, le raccourci s\'installe depuis Safari uniquement.' : 'Sur Android, depuis Chrome (ou le navigateur du téléphone).'
        }
        if (grp === 'art') { r.voteIdx = Number(one.getAttribute('data-vote')); const b = host!.querySelector('[data-vote-need]') as HTMLButtonElement | null; if (b) b.disabled = false }
        if (grp && grp.charAt(0) === 'b' && /^b\d+$/.test(grp)) {
          const n = v.bonus.length, faits = host!.querySelectorAll('.chip.on[data-one^="b"]').length
          const b = host!.querySelector('[data-bonus-need]') as HTMLButtonElement | null, m = host!.querySelector('[data-bonus-msg]')
          if (b) b.disabled = faits < n
          if (m) m.textContent = faits < n ? 'Encore ' + (n - faits) + ' question' + (n - faits > 1 ? 's' : '') + ' pour gagner le ticket.' : 'C\'est complet : valide pour ton ticket bonus.'
        }
        if (!one.hasAttribute('data-go')) return
      }
      const tg = t.closest('[data-tog]') as HTMLElement | null
      if (tg) { tg.classList.toggle('on'); tg.setAttribute('aria-checked', String(tg.classList.contains('on'))); majValider(); return }
      const part = t.closest('[data-part]') as HTMLElement | null
      if (part) regleParte(Number(part.getAttribute('data-part')))
      const vit = t.closest('[data-vitrine]') as HTMLElement | null
      if (vit) { r.voteIdx = Number(vit.getAttribute('data-vitrine')); r.vitrineVote = true }
      const gg = t.closest('[data-go]') as HTMLButtonElement | null
      if (gg) {
        if (gg.hasAttribute('data-sondage')) host!.querySelectorAll('.chip.on[data-one^="s"]').forEach(c => { reponsesBonus['sondage_' + (c.getAttribute('data-one') || '').slice(1)] = c.getAttribute('data-val') || '' })
        if (gg.disabled) return
        if (gg.hasAttribute('data-after')) r.after = gg.getAttribute('data-after')
        aller(gg.getAttribute('data-go') || 's-accueil', gg.getAttribute('data-repli') || '')
      }
    }
    function touche(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      if ((e.key === ' ' || e.key === 'Enter') && t.hasAttribute && t.hasAttribute('data-tog')) { e.preventDefault(); t.click() }
    }
    /* Autre appareil : l'e-mail est demandé en premier ; une fois saisi, on retrouve le compte (RPC joueur_reconnaitre,
       repli lecture directe si la RPC est absente). Lecture seule, aucun consentement n'est sauté. */
    let dernierEmail = ''
    function sortieChamp(e: FocusEvent) {
      const t = e.target as HTMLInputElement | null
      if (!t || t.id !== 'f3' || r.connu || p.demo || p.apercu || !p.evId) return
      const em = (t.value || '').trim().toLowerCase()
      if (em.indexOf('@') < 1 || em.lastIndexOf('.') < em.indexOf('@') || em === dernierEmail) return
      dernierEmail = em
      lookupJoueurByEmail(em, p.evId).then(j => {
        if (!j || courant.current !== 'c-inscription') return
        const f = lireForm()
        const m = { prenom: f.prenom || j.prenom || '', nom: f.nom || j.nom || '', email: f.email, tel: f.tel || j.tel || '', cp: f.cp || j.cp || '', age: f.age || j.age || '', genre: f.genre || j.genre || '', src: f.src }
        r.profil = m
        r.reco = j.prenom || 'toi'
        r.connu = !!(m.prenom && m.nom && m.tel.replace(/\s/g, '').length >= 8)
        if (r.connu) { r.inscVolet = 2; montrer('c-inscription', true); return }
        /* Compte retrouvé mais coordonnées partielles : on complète les champs vides sans refaire l'écran (le focus reste). */
        const mettre = (id: string, val: string) => { const el = host!.querySelector('#' + id) as HTMLInputElement | null; if (el && !el.value && val) el.value = val }
        mettre('f1', m.prenom); mettre('f2', m.nom); mettre('f4', m.tel); mettre('f6', m.cp)
        const champ = host!.querySelector('#f3') as HTMLElement | null, fld = champ && champ.parentElement
        if (fld && !host!.querySelector('[data-reco]')) fld.insertAdjacentHTML('afterend', '<p class="reco" data-reco role="status">Content de te revoir, ' + String(r.reco).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]) + '.</p>')
      }).catch(() => { /* hors ligne ou RPC refusee : formulaire normal */ })
    }
    host.addEventListener('focusout', sortieChamp)
    host.addEventListener('click', clic)
    host.addEventListener('keydown', touche)

    /* Navigation par fleches depuis le cadre du Super Admin (meme protocole
       que les autres apercus : postMessage { flowinNav: 'next' | 'prev' }). */
    function message(e: MessageEvent) {
      if (!e.data) return
      const d = DEROULES[v.key] || []
      const i = d.indexOf(courant.current)
      if (e.data.flowinNav === 'next' && i < d.length - 1) montrer(d[i + 1])
      if (e.data.flowinNav === 'prev' && i > 0) montrer(d[i - 1])
      if (typeof e.data.flowinEcran === 'string') montrer(e.data.flowinEcran)
    }
    window.addEventListener('message', message)

    /* Ecran de depart. */
    let debut = p.debut && ecranExiste(p.debut) ? p.debut : (v.key === 'sej' ? 'sj-accueil' : 's-flash')
    const ancre = (location.hash || '').replace('#', '')
    if (!p.debut && ancre && ecranExiste(ancre)) {
      try {
        const sauve = JSON.parse(sessionStorage.getItem(cleEtat) || 'null') as { r: EtatPartie; pile: string[] } | null
        if (sauve && sauve.r) { Object.keys(sauve.r).forEach(k => { (r as unknown as Record<string, unknown>)[k] = (sauve.r as unknown as Record<string, unknown>)[k] }); pile.current = sauve.pile || []; debut = ancre }
      } catch { /* ignore */ }
    }
    const ex = p.demo || !!p.apercu
    if (!p.demo && !p.apercu && p.evId) {
      try {
        if (doitRefuserDigital(p.evId)) debut = 'c-digital'
        else if (dejaJoueAujourdhuiCeQr(p.evId) && !new URLSearchParams(location.search).has('preview')) debut = 'c-demain'
      } catch { /* ignore */ }
    }
    if (ex && (debut === 'c-profil' || debut === 'c-connexion')) { r.profil = { prenom: 'Prénom', nom: 'Exemple' }; r.ticket = 'TK-0427'; r.gain = { lot: v.billet.nom, cond: v.billet.cond }; r.bonnes = v.questions.length; r.bonusFait = v.key === 'quiz'; r.after = v.key === 'spin' ? 'c-billet' : 'c-ticket' }
    if (ex && debut === 'r-tourne') { r.caseIdx = 0; r.rotation = rotationPourCase(v, 0) }
    if (ex && (debut === 'r-gain' || debut === 'r-ticket' || debut === 'r-perdu')) { const want = debut === 'r-gain' ? 'imm' : debut === 'r-ticket' ? 'tir' : 'perdu'; const i = Math.max(0, v.cases.findIndex(c => c.issue === want)); r.caseIdx = i; r.rotation = rotationPourCase(v, i) }
    if (ex && debut === 'q-resultat') r.bonnes = v.questions.length
    if (ex && debut === 'q-bonne') r.serie = 1
    if (ex && (debut === 'q-bonne' || debut === 'q-mauvaise')) { const q = v.questions[0]; r.rep[0] = debut === 'q-bonne' ? q?.ok ?? 0 : ((q?.ok ?? 0) + 1) % Math.max(2, q?.opts.length || 2) }
    if (ex && debut === 'q-bonusok') { r.bonnes = v.questions.length; r.bonusFait = true }
    if (ex && (debut === 'c-billet' || debut === 'c-ticket')) { r.ticket = 'TK-0427'; r.after = debut; r.bonnes = v.questions.length; r.bonusFait = v.key === 'quiz' }
    if (ex && (debut === 'v-envoi' || debut === 'v-resultat')) r.voteIdx = 2
    if (ex && debut === 'c-inscription' && (v.key === 'spin')) r.after = 'c-billet'
    if (ex && (debut === 'c-profil')) r.mesTickets = TICKETS_EXEMPLE
    montrer(debut, true)
    /* Alerte a l'ouverture : si un tirage a eu lieu depuis la derniere visite, le message s'affiche (une seule fois : « vu » memorise). */
    if (joueurLocal) {
      const accueil = ['s-flash', 's-accueil', 'c-demain', 'c-digital'].indexOf(debut) >= 0 && !p.debut
      chargerProfil(() => {
        if (accueil && courant.current === debut && file.current.length) {
          r.resultat = versVue(file.current[0]); montrer('c-resultat')
        } else {
          const pa = host!.querySelector('.nav a:last-child') as HTMLElement | null
          if (pa && !pa.querySelector('.pastille') && file.current.length) pa.insertAdjacentHTML('beforeend', '<span class="pastille">' + file.current.length + '</span>')
        }
      })
    }
    /* Differe : le routeur Next doit d'abord poser son etat d'historique
       (__NA), sinon un retour sur cette entree recharge toute la page. */
    const premier = debut
    const tReplace = window.setTimeout(() => { if (!enCadre) { try { history.replaceState({ ...(history.state || {}), fm: premier, n: 0 }, '', location.pathname + location.search + '#' + premier) } catch { /* ignore */ } } }, 0)

    return () => { if (arretInstall) arretInstall(); clearTimeout(tReplace); nettoyer(); host.removeEventListener('click', clic); host.removeEventListener('focusout', sortieChamp); host.removeEventListener('keydown', touche); window.removeEventListener('message', message); window.removeEventListener('popstate', surPopstate) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.evId, p.vue.id, p.debut, p.demo])

  return (
    <div className="fm-page">
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/flowin-theme.css" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@500;700;900&family=Bangers&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: CADRE_CSS + MASTER_CSS }} />
      <div className="fm fm-host" ref={hostRef} aria-live="polite" />
    </div>
  )
}
