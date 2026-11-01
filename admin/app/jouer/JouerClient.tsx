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
import { useEffect, useRef, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import SuperEventMap from '@/app/se/_components/SuperEventMap'
import { supabase } from '@/lib/supabase'
import { getVisiteurId } from '@/lib/track'
import QRCode from 'qrcode'
import { MASTER_CSS } from '@/lib/masters/css'
import { rendreEcran, etatInitial, rotationPourCase, regleBarre, regleParte, regleSuperReel, ecranExiste, DEROULES, type EtatPartie } from '@/lib/masters/engine'
import type { VueMaster } from '@/lib/masters/resolve'
import { writeJoueur, getJoueurLocal, animationDejaJouee, CONSENTEMENT_VERSION } from '@/lib/parcours'
import { doitRefuserDigital } from '@/components/parcours/ParcoursHero'
import { buildInviteLink } from '@/lib/parrainage'
import { generateTicket } from '@/lib/ticket'
import type { TicketPrefix } from '@/lib/types'

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
    const seReel = !p.demo && v.superEvent && v.superEvent.id ? v.superEvent.id : ''
    regleSuperReel(seReel)
    let carteRoot: Root | null = null
    let maPosition: { lat: number; lng: number } | null = null
    const local = getJoueurLocal()
    if (local) r.profil = { prenom: local.prenom, nom: local.nom, email: local.email, tel: local.tel, cp: local.cp, age: local.age }

    function nettoyer() { minuteurs.current.forEach(id => { clearInterval(id); clearTimeout(id) }); minuteurs.current = [] }
    function plus_tard(fn: () => void, ms: number) { minuteurs.current.push(window.setTimeout(fn, ms)) }

    /* Navigation (audit 31/10) : chaque ecran est une entree d'historique
       (pushState) ; le bouton retour du navigateur et les boutons Retour
       internes ramenent a l'ecran precedent du parcours, sans quitter la page
       et sans perdre l'etat de la partie. Dans un cadre d'apercu (iframe),
       l'historique du parent n'est pas touche (pile interne). */
    /* L'etat de la partie survit a un aller-retour (ex. une station du super
       event puis retour navigateur) : sessionStorage, propre a l'onglet. */
    const cleEtat = 'fm_etat_' + (p.evId || ('m-' + v.id))
    const enCadre = (() => { try { return window.self !== window.top } catch { return true } })()
    function montrer(id: string, sansPile?: boolean) {
      if (!ecranExiste(id)) id = 's-accueil'
      /* Retour sur une question deja repondue : on remontre la correction. */
      if (id === 'q-question' && r.rep[r.qi] != null) id = r.rep[r.qi] === (v.questions[r.qi] || { ok: -1 }).ok ? 'q-bonne' : 'q-mauvaise'
      nettoyer()
      if (carteRoot) { const cr = carteRoot; carteRoot = null; setTimeout(() => { try { cr.unmount() } catch { /* ignore */ } }, 0) }
      const prec = courant.current
      if (!sansPile && prec && prec !== id) {
        pile.current.push(prec)
        if (!enCadre) { try { history.pushState({ ...(history.state || {}), fm: id, n: pile.current.length }, '', '#' + id) } catch { /* ignore */ } }
      }
      courant.current = id
      try { sessionStorage.setItem(cleEtat, JSON.stringify({ r, id, pile: pile.current })) } catch { /* ignore */ }
      host!.innerHTML = rendreEcran(v, r, id)
      const el = host!.firstElementChild as HTMLElement | null
      if (el) el.scrollTop = 0
      entree(id, el)
    }
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

    /* Animations et minuteurs d'entree d'ecran. */
    function entree(id: string, el: HTMLElement | null) {
      if (!el) return
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
      if (id === 'r-tourne') {
        const w = el.querySelector('.wheel') as HTMLElement | null, b = el.querySelector('.wheelbox')
        if (w && b) {
          w.style.transform = 'rotate(-12deg)'; void w.offsetWidth
          b.classList.add('spinning')
          w.style.transition = 'transform 4.6s cubic-bezier(.12,.62,.08,1)'
          w.style.transform = 'rotate(' + r.rotation + 'deg)'
          plus_tard(() => b.classList.remove('spinning'), 4600)
        }
      }
      const q = el.querySelector('[data-qr]') as HTMLElement | null
      if (q && r.ticket) {
        const contenu = r.gain && r.gain.token ? location.origin + '/lot.html?t=' + encodeURIComponent(r.gain.token) : (q.getAttribute('data-qr') || r.ticket)
        QRCode.toString(contenu, { type: 'svg', margin: 0, width: 110, color: { dark: '#1B3A5C', light: '#FFFFFF' } }).then(svg => { q.innerHTML = svg }).catch(() => { /* garde l'illustration */ })
      }
      if (id === 'c-inscription') majValider()
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
      const { data } = await supabase.from('se_tickets').select('event_id,type,jour').eq('joueur_id', local.id).eq('super_event_id', seReel)
      const rows = (data ?? []) as { event_id: string; type: string; jour: string }[]
      if (nb) nb.textContent = String(rows.length)
      const nomSt = (id: string) => (stations.find(x => x.id === id) || { nom: id }).nom
      const e2 = (x: string) => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c])
      zone.innerHTML = rows.length ? rows.map((t, i) => '<div class="panel" style="display:flex;margin-top:12px;box-shadow:4px 4px 0 #1B3A5C"><span style="width:14px;background:' + (i % 2 ? 'var(--fl-super-bleu)' : 'var(--fl-super-rouge)') + ';border-right:3px solid #1B3A5C"></span><div style="flex:1;padding:10px 14px"><b class="num" style="font-size:16px;font-weight:800">' + (t.type === 'bonus' ? 'Bonus' : 'Ticket') + ' · ' + e2(t.jour) + '</b><small style="display:block;font-size:12.5px;font-weight:700;color:var(--muted)">' + e2(nomSt(t.event_id)) + '</small></div></div>').join('')
        : '<div class="card" style="padding:14px 16px;margin-top:12px;font-weight:600;color:#3a4d63">Pas encore de super ticket : joue dans une station.</div>'
    }

    function repondre(i: number | null) {
      if (courant.current !== 'q-question') return
      const q = v.questions[r.qi]
      r.rep[r.qi] = i
      const ok = q && i === q.ok
      if (ok) r.bonnes++
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
        jeu: !!on('[data-consent="jeu"]'), anim: !!on('[data-consent="anim"]'),
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
      r.profil = { prenom: f.prenom, nom: f.nom, email: f.email, tel: f.tel, cp: f.cp, age: f.age }
      if (err) { r.erreur = err; montrer('c-inscription', true); return }
      r.erreur = ''
      const apres = r.after || 'c-ticket'
      if (p.demo || !p.evId) { r.ticket = generateTicket(p.prefixe as TicketPrefix); montrer(apres); return }
      r.envoi = true; majValider()
      const parfait = v.questions.length > 0 && r.bonnes >= v.questions.length
      const quiz = v.key === 'quiz' || v.key === 'solo'
      const cas = r.caseIdx != null ? v.cases[r.caseIdx] : null
      const bonus: Record<string, unknown> = {}
      if (v.key === 'vote' && r.voteIdx != null) { bonus.vote_mode = r.vitrineVote ? 'vitrine' : 'choix'; bonus.vote_choix = (r.vitrineVote ? v.vitrines : v.candidats)[r.voteIdx]?.nom ?? null }
      Object.keys(reponsesBonus).forEach(k => { bonus[k] = reponsesBonus[k] })
      const res = await writeJoueur({
        email: f.email, prenom: f.prenom, nom: f.nom, tel: f.tel, code_postal: f.cp || undefined,
        genre: f.genre || undefined, age_tranche: f.age || undefined, decouverte: f.src || undefined,
        score_moy: quiz ? r.bonnes + '/' + v.questions.length : undefined,
        lot_gagne: cas && cas.issue === 'imm' ? cas.label : undefined,
        events: [p.evId], ticket_code: r.ticket || generateTicket(p.prefixe as TicketPrefix), source: p.source, prefix: p.prefixe,
        bonus_reponses: Object.keys(bonus).length ? bonus : undefined,
        optin: f.anim, optin_version: CONSENTEMENT_VERSION,
        ...(quiz ? { quiz_ticket: parfait, bonus_ticket: r.bonusFait } : {}),
      })
      r.envoi = false
      if (res.digitalRefuse) { montrer('c-digital'); return }
      if (res.duplicate) { r.ticket = res.ticket; montrer('c-demain'); return }
      if (!res.success) { r.erreur = 'Enregistrement impossible pour le moment, réessaie dans un instant.'; montrer('c-inscription', true); return }
      r.ticket = res.ticket
      if (res.gain) { r.gain = { lot: res.gain.lot, cond: res.gain.conditions || 'Gain immédiat', token: res.gain.retraitToken }; if (res.gain.ticketCode) r.ticket = res.gain.ticketCode; montrer('c-billet'); return }
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

    function aller(go: string, repli?: string) {
      if (go === '@retour') { retour(repli || ''); return }
      if (go === 'q-suivante') { r.qi = Math.min(r.qi + 1, v.questions.length - 1); montrer('q-question'); return }
      if (go === 'q-question') { if (courant.current === 's-regles') { r.qi = 0; r.bonnes = 0; r.rep = [] } montrer('q-question'); return }
      if (go === 'q-bonusvalider') {
        host!.querySelectorAll('.chip.on[data-one^="b"]').forEach(c => { reponsesBonus['bonus_' + (c.getAttribute('data-one') || '').slice(1)] = c.getAttribute('data-val') || '' })
        r.bonusFait = true; montrer('q-bonusok'); return
      }
      if (go === 'r-lancer') { r.caseIdx = choisirCase(); r.rotation = rotationPourCase(v, r.caseIdx); montrer('r-tourne'); return }
      if (go === 'r-resultat') { const c = r.caseIdx != null ? v.cases[r.caseIdx] : null; montrer(!c ? 'r-perdu' : c.issue === 'imm' ? 'r-gain' : c.issue === 'tir' ? 'r-ticket' : 'r-perdu'); return }
      if (go === 't-impression') { r.ticket = r.ticket || generateTicket(p.prefixe as TicketPrefix); r.tombolaNo = numero(r.ticket); montrer('t-impression'); return }
      if (go === 't-resultat') { montrer('t-res-tirage'); return }
      if (go === 'v-voter') { if (r.voteIdx == null) return; montrer('v-envoi'); return }
      if (go === 'c-valider') { valider(); return }
      if (go === 'sj-geo') { autourDeMoi(); return }
      if (go === 'c-inscription') { const ch = host!.querySelector('#fpar') as HTMLInputElement | null; if (ch && ch.value.trim()) r.profil = { ...(r.profil || {}), email: ch.value.trim() } }
      if (go === 'c-code' || go === 'c-mdp') { r.erreur = 'L\'espace client arrive bientôt : en attendant, tes tickets et tes lots te sont envoyés par email.'; montrer('c-connexion', true); r.erreur = ''; return }
      montrer(go)
    }

    function clic(e: MouseEvent) {
      const t = e.target as HTMLElement
      const href = t.closest('[data-href]') as HTMLElement | null
      if (href) { location.href = href.getAttribute('data-href') || '/'; return }
      const rep = t.closest('[data-rep]') as HTMLElement | null
      if (rep) { repondre(Number(rep.getAttribute('data-rep'))); return }
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
        else if (animationDejaJouee(p.evId) && !new URLSearchParams(location.search).has('preview')) debut = 'c-demain'
      } catch { /* ignore */ }
    }
    if (ex && (debut === 'c-profil' || debut === 'c-connexion')) { r.profil = { prenom: 'Prénom', nom: 'Exemple' }; r.ticket = 'TK-0427'; r.gain = { lot: v.billet.nom, cond: v.billet.cond }; r.bonnes = v.questions.length; r.bonusFait = v.key === 'quiz'; r.after = v.key === 'spin' ? 'c-billet' : 'c-ticket' }
    if (ex && debut === 'r-tourne') { r.caseIdx = 0; r.rotation = rotationPourCase(v, 0) }
    if (ex && (debut === 'r-gain' || debut === 'r-ticket' || debut === 'r-perdu')) { const want = debut === 'r-gain' ? 'imm' : debut === 'r-ticket' ? 'tir' : 'perdu'; const i = Math.max(0, v.cases.findIndex(c => c.issue === want)); r.caseIdx = i; r.rotation = rotationPourCase(v, i) }
    if (ex && debut === 'q-resultat') r.bonnes = v.questions.length
    if (ex && (debut === 'q-bonne' || debut === 'q-mauvaise')) { const q = v.questions[0]; r.rep[0] = debut === 'q-bonne' ? q?.ok ?? 0 : ((q?.ok ?? 0) + 1) % Math.max(2, q?.opts.length || 2) }
    if (ex && debut === 'q-bonusok') { r.bonnes = v.questions.length; r.bonusFait = true }
    if (ex && (debut === 'c-billet' || debut === 'c-ticket')) { r.ticket = 'TK-0427'; r.after = debut; r.bonnes = v.questions.length; r.bonusFait = v.key === 'quiz' }
    if (ex && (debut === 'v-envoi' || debut === 'v-resultat')) r.voteIdx = 2
    if (ex && debut === 'c-inscription' && (v.key === 'spin')) r.after = 'c-billet'
    montrer(debut, true)
    /* Differe : le routeur Next doit d'abord poser son etat d'historique
       (__NA), sinon un retour sur cette entree recharge toute la page. */
    const premier = debut
    const tReplace = window.setTimeout(() => { if (!enCadre) { try { history.replaceState({ ...(history.state || {}), fm: premier, n: 0 }, '', location.pathname + location.search + '#' + premier) } catch { /* ignore */ } } }, 0)

    return () => { clearTimeout(tReplace); nettoyer(); host.removeEventListener('click', clic); host.removeEventListener('keydown', touche); window.removeEventListener('message', message); window.removeEventListener('popstate', surPopstate) }
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
