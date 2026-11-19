'use client'
/**
 * PROFIL PARTICIPANT /moi — refonte audit 17/11/2026 (Romain : pas de scroll interminable,
 * rubriques ; lots gagnés, lots en jeu à proximité, lots qui expirent, notifications, compte).
 * Une rubrique = un écran (barre d'onglets à icônes). Un toucher sur le QR d'un lot l'affiche en
 * plein écran pour la caisse. Compteurs et badges calculés uniquement sur les vraies données.
 * Identité : flowin_joueur (localStorage), créée en jouant. Pas de mot de passe côté participant.
 */
import { chargerTicketsGainsJoueur } from '@/lib/moiTicketsGains'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Ico } from '@/lib/proicons'
import { buildInviteLink } from '@/lib/parrainage'
import { estDemo } from '@/lib/demo'
import MesLots from '@/components/joueur/MesLots'
import ConnexionEmail from '@/components/joueur/ConnexionEmail'
import { fetchCarteCommercesPublique, type CommerceCarte } from '@/lib/carteReseau'
import {
  chargerMesLots, chargerNotifications, marquerCadeauxVus, joursRestants, palierRappel, libelleNotif,
  chargerConsentements, majConsentement, distanceM, distanceTxt,
  type MonLot, type Notif, type Consentement,
} from '@/lib/mesLots'

type Joueur = { id: string; prenom?: string | null; nom?: string | null; email?: string | null; external_id?: string | null }
type Ticket = { event_id: string | null; super_event_id: string | null }
type Gain = { id: string; libelle: string | null; code: string | null; utilise: boolean | null; event_id: string | null; super_event_id: string | null }
type Rubrique = 'lots' | 'bientot' | 'proche' | 'notifs' | 'compte'
type Pos = { lat: number; lng: number }

const HERO = '#2746A6'
const PROCHE_M = 2000

const RUBRIQUES: { k: Rubrique; ico: string; txt: string }[] = [
  { k: 'lots', ico: 'gift', txt: 'Mes lots' },
  { k: 'bientot', ico: 'clock', txt: 'Expirent' },
  { k: 'proche', ico: 'shop', txt: 'Près de moi' },
  { k: 'notifs', ico: 'bell', txt: 'Alertes' },
  { k: 'compte', ico: 'user', txt: 'Compte' },
]

export default function MonComptePage() {
  const [loading, setLoading] = useState(true)
  const [joueur, setJoueur] = useState<Joueur | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [gains, setGains] = useState<Gain[]>([])
  const [evNames, setEvNames] = useState<Record<string, string>>({})
  const [seNames, setSeNames] = useState<Record<string, string>>({})
  const [lots, setLots] = useState<MonLot[]>([])
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [consent, setConsent] = useState<Consentement[] | null>(null)
  const [commerces, setCommerces] = useState<CommerceCarte[]>([])
  const [pos, setPos] = useState<Pos | null>(null)
  const [geoEtat, setGeoEtat] = useState<'' | 'demande' | 'refus'>('')
  const [rub, setRub] = useState<Rubrique>('lots')

  useEffect(() => {
    let local: { id?: string } | null = null
    try { const s = localStorage.getItem('flowin_joueur'); if (s) local = JSON.parse(s) } catch { /* */ }
    /* Demonstration (?demo=1) sans compte sur ce telephone : profil fictif, aucune lecture ni ecriture. */
    let demo = false
    try { demo = new URLSearchParams(location.search).get('demo') === '1' || estDemo() } catch { /* */ }
    /* Apres une partie de demo, l'identifiant local est fictif (demo-…) : meme profil fictif, et le lot
       gagne pendant la demo (rangé dans l'onglet par /jouer) apparait dans « Mes lots ». */
    if (demo && (!local?.id || String(local.id).indexOf('demo') === 0)) {
      setJoueur({ id: 'demo', prenom: 'Prénom', nom: 'Exemple' })
      /* Annonce de commerce fictive (18/11) : montre la notification « annonce » dans Alertes. */
      setNotifs([{ id: 'demo-annonce', tirage_id: null, palier: 'annonce', created_at: new Date().toISOString(), vu_le: null, lot_nom: null, retrait_token: null, valable_jusqu_au: null,
        titre: 'Nouveau jeu ce week-end', message: 'Venez jouer et tenter de gagner un lot.', lien: '/moi?demo=1', commerce: 'Commerce Démo' }])
      try {
        const l = JSON.parse(sessionStorage.getItem('flowin_demo_lots') || '[]') as { commerce?: string; lot?: string; ticketCode?: string | null; eventId?: string | null }[]
        setLots(l.map((x, i) => ({
          id: 'demo-' + i, commerce: x.commerce || 'Commerce Démo', commerceCle: x.eventId || 'demo', operation: null, type: 'animation' as const,
          lot: x.lot || 'Lot Démo', valeur: null, ticketCode: x.ticketCode || null, token: 'demo-' + String(x.ticketCode || i).replace(/[^A-Za-z0-9]/g, '').toLowerCase(),
          etat: 'a_utiliser' as const, gagneLe: new Date().toISOString(), valableJusquAu: null, offertLe: null, eventId: x.eventId || null,
        })))
      } catch { /* */ }
      setLoading(false); return
    }
    if (!local?.id) { setLoading(false); return }
    const jid = local.id
    ;(async () => {
      const [jr, tg, ml] = await Promise.all([
        supabase.from('joueurs').select('id,prenom,nom,email,external_id').eq('id', jid).single(),
        chargerTicketsGainsJoueur(jid).catch(() => ({ tickets: [], gains: [], stationsTerminees: [] })),
        chargerMesLots(jid).catch(() => [] as MonLot[]),
      ])
      const tk = { data: tg.tickets }, ga = { data: tg.gains }
      setLots(ml)
      chargerNotifications(jid).then(setNotifs).catch(() => { /* */ })
      chargerConsentements(jid).then(setConsent).catch(() => { /* */ })
      fetchCarteCommercesPublique().then(setCommerces).catch(() => { /* */ })
      setJoueur((jr.data as Joueur) ?? { id: jid })
      const tkRows = (tk.data ?? []) as Ticket[]
      const gaRows = (ga.data ?? []) as Gain[]
      setTickets(tkRows)
      setGains(gaRows)
      const evIds = Array.from(new Set([...tkRows, ...gaRows].map(r => r.event_id).filter(Boolean))) as string[]
      const seIds = Array.from(new Set([...tkRows, ...gaRows].map(r => r.super_event_id).filter(Boolean))) as string[]
      if (evIds.length) {
        const ev = await supabase.from('events').select('id,nom').in('id', evIds)
        const m: Record<string, string> = {}
        ;(ev.data ?? []).forEach((e: { id: string; nom: string }) => { m[e.id] = e.nom })
        setEvNames(m)
      }
      if (seIds.length) {
        const se = await supabase.from('super_events').select('id,nom').in('id', seIds)
        const m: Record<string, string> = {}
        ;(se.data ?? []).forEach((s: { id: string; nom: string }) => { m[s.id] = s.nom })
        setSeNames(m)
      }
      setLoading(false)
    })()
    /* Géolocalisation : seulement si déjà autorisée (aucune demande à l'ouverture). */
    try { if (document.body.style.paddingTop) document.documentElement.style.setProperty('--moi-haut', document.body.style.paddingTop) } catch { /* */ }
    const t = setInterval(() => { try { document.documentElement.style.setProperty('--moi-haut', document.body.style.paddingTop || '0px') } catch { /* */ } }, 700)
    try {
      const nav = navigator as Navigator & { permissions?: { query: (d: { name: string }) => Promise<{ state: string }> } }
      if (nav.permissions && nav.geolocation) nav.permissions.query({ name: 'geolocation' }).then(p => { if (p.state === 'granted') localiser() }).catch(() => { /* */ })
    } catch { /* */ }
    return () => clearInterval(t)
  }, [])

  function localiser() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setGeoEtat('refus'); return }
    setGeoEtat('demande')
    navigator.geolocation.getCurrentPosition(
      p => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setGeoEtat('') },
      () => setGeoEtat('refus'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  /* Anciens gains (table se_gains, abandonnée le 28/07) : à la suite, sans QR. */
  const tousLots: MonLot[] = useMemo(() => lots.concat(gains.map(g => ({
    id: 'g-' + g.id, commerce: (g.event_id && evNames[g.event_id]) || '[commerce à compléter]', commerceCle: g.event_id || 'autre',
    operation: g.super_event_id ? seNames[g.super_event_id] || null : null, type: g.super_event_id ? 'super' : 'animation',
    lot: g.libelle || 'Lot', valeur: null, ticketCode: g.code, token: null, etat: g.utilise ? 'utilise' : 'a_utiliser',
    gagneLe: null, valableJusquAu: null, offertLe: null,
  } as MonLot))), [lots, gains, evNames, seNames])

  const actifs = tousLots.filter(l => !l.donne && (l.etat === 'a_utiliser' || l.etat === 'a_confirmer'))
  const bientot = tousLots.filter(l => !l.donne && l.etat === 'a_utiliser' && palierRappel(joursRestants(l.valableJusquAu)))
    .sort((a, b) => (joursRestants(a.valableJusquAu) ?? 999) - (joursRestants(b.valableJusquAu) ?? 999))
  const nonVues = notifs.filter(n => !n.vu_le)

  /* Compteurs et badges : uniquement des données réelles. */
  const nbGagnes = tousLots.filter(l => !l.recu).length
  const commercesVisites = new Set(tickets.map(t => t.event_id).filter(Boolean).concat(tousLots.filter(l => !l.recu).map(l => l.commerceCle))).size
  const nbOfferts = tousLots.filter(l => l.donne || (l.offertLe && !l.recu)).length
  const nbUtilises = tousLots.filter(l => l.etat === 'utilise').length
  const badges = [
    { k: 'premier', ico: 'star', txt: 'Premier lot', ok: nbGagnes >= 1 },
    { k: 'explorateur', ico: 'shop', txt: '3 commerces', ok: commercesVisites >= 3 },
    { k: 'genereux', ico: 'gift', txt: 'Généreux', ok: nbOfferts >= 1 },
    { k: 'fidele', ico: 'ticket', txt: '10 tickets', ok: tickets.length >= 10 },
    { k: 'client', ico: 'check', txt: 'Lot utilisé', ok: nbUtilises >= 1 },
  ]

  const proches = useMemo(() => {
    const l = commerces.map(c => ({ c, d: pos ? distanceM(pos, c) : null }))
    if (pos) l.sort((a, b) => (a.d ?? 0) - (b.d ?? 0))
    return l
  }, [commerces, pos])
  const plusProche = pos && proches.length && proches[0].d !== null && proches[0].d <= PROCHE_M ? proches[0] : null

  const ouvrir = (k: Rubrique) => {
    setRub(k)
    if (k === 'notifs' && joueur && nonVues.length) {
      if (joueur.id !== 'demo') marquerCadeauxVus(joueur.id, nonVues.map(n => n.id))
      setNotifs(notifs.map(n => n.vu_le ? n : { ...n, vu_le: new Date().toISOString() }))
    }
  }

  /* Parrainage depuis le profil (Romain, 17/11) : meme mecanisme que la fin de parcours
     (buildInviteLink, ref = external_id du joueur, source=parrainage). Sans identifiant connu,
     le lien reste partageable mais ne credite personne. Partage natif, sinon WhatsApp. */
  const [partageMsg, setPartageMsg] = useState('')
  async function parrainer(canal: 'natif' | 'wa' | 'sms' | 'mail') {
    if (!joueur) return
    const ev = tickets.map(t => t.event_id).filter(Boolean)[0]
    const base = ev ? '/jouer?ev=' + encodeURIComponent(ev as string) : '/carte-commerces'
    const ref = joueur.external_id || (joueur.email && joueur.email.indexOf('@') > 0 ? 'j-' + joueur.email.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 40) : '')
    const lien = ref ? buildInviteLink(base, ref, (ev as string) || undefined, 'wa') + '&source=parrainage' : new URL(base, location.origin).toString()
    const texte = 'Je joue avec Flowin dans les commerces partenaires : une partie gratuite par jour, des lots à gagner. Viens jouer avec moi ! ' + lien
    if (joueur.id === 'demo') { setPartageMsg('Démonstration : le lien d’invitation est prêt, rien n’est envoyé.'); return }
    try {
      if (canal === 'natif' && typeof navigator !== 'undefined' && navigator.share) { await navigator.share({ title: 'Viens jouer avec moi', text: texte }); return }
    } catch { return }
    if (canal === 'sms') { location.href = 'sms:?&body=' + encodeURIComponent(texte); return }
    if (canal === 'mail') { location.href = 'mailto:?subject=' + encodeURIComponent('Viens jouer avec moi') + '&body=' + encodeURIComponent(texte); return }
    window.open('https://wa.me/?text=' + encodeURIComponent(texte), '_blank')
  }

  /* Écran fixe (pas de défilement de page) ; en mode démo le bandeau de 24 px reste visible au-dessus. */
  const wrap: React.CSSProperties = { position: 'fixed', left: 0, right: 0, bottom: 0, top: 'var(--moi-haut, 0px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', background: '#f1ede6', fontFamily: 'system-ui, sans-serif', color: '#141a26', overflow: 'hidden' }

  if (loading) {
    return <div style={{ ...wrap, alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#9aa0ad' }}>Chargement…</div></div>
  }

  if (!joueur) {
    return (
      <div style={{ ...wrap, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div>
          <div style={{ display: 'inline-flex', marginBottom: 14 }}><Ico k="game" size={50} /></div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Aucun compte sur ce téléphone</div>
          <div style={{ fontSize: 14.5, color: '#5a6071', lineHeight: 1.6, maxWidth: 320 }}>
            Déjà joué ? Reçois un lien par e-mail : tes lots reviennent ici. Sinon, ton compte se crée en jouant.
          </div>
          <div style={{ marginTop: 16 }}><ConnexionEmail /></div>
          <a href="/carte-commerces" style={{ display: 'inline-block', marginTop: 18, padding: '13px 22px', borderRadius: 100, background: HERO, color: '#fff', fontWeight: 800, textDecoration: 'none' }}>Trouver un jeu près de moi</a>
        </div>
      </div>
    )
  }

  const carte: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '13px 14px', boxShadow: '0 2px 8px rgba(20,26,38,.06)' }
  const titre = (t: string, sous?: string) => (
    <div style={{ margin: '4px 0 12px' }}>
      <div style={{ fontSize: 19, fontWeight: 800 }}>{t}</div>
      {sous && <div style={{ fontSize: 13, color: '#5a6071', marginTop: 2 }}>{sous}</div>}
    </div>
  )

  return (
    <div style={wrap} data-profil>
      {/* En-tête compact : identité, compteurs, badges */}
      <div style={{ background: `linear-gradient(135deg,${HERO},#3B7DE0)`, color: '#fff', padding: '18px 18px 14px', flexShrink: 0 }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
              {((joueur.prenom?.[0] ?? '') + (joueur.nom?.[0] ?? '')).toUpperCase() || '·'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{joueur.prenom ? `Salut ${joueur.prenom}` : 'Mon Flowin'}</div>
              <div style={{ fontSize: 12.5, opacity: 0.85 }}>{actifs.length ? `${actifs.length} lot${actifs.length > 1 ? 's' : ''} à utiliser` : 'Aucun lot à utiliser'}</div>
            </div>
          </div>
          <div data-compteurs style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {[
              { n: nbGagnes, t: nbGagnes > 1 ? 'lots gagnés' : 'lot gagné', i: 'gift' },
              { n: commercesVisites, t: commercesVisites > 1 ? 'commerces' : 'commerce', i: 'shop' },
              { n: tickets.length, t: tickets.length > 1 ? 'tickets' : 'ticket', i: 'ticket' },
            ].map(c => (
              <div key={c.i} style={{ flex: 1, background: 'rgba(255,255,255,.16)', borderRadius: 12, padding: '7px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 19, fontWeight: 800 }}><Ico k={c.i} size={12} style={{ marginRight: 4, verticalAlign: -1 }} />{c.n}</div>
                <div style={{ fontSize: 10.5, opacity: 0.85 }}>{c.t}</div>
              </div>
            ))}
          </div>
          <div data-badges style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {badges.map(b => (
              <span key={b.k} data-badge={b.k} data-obtenu={b.ok ? '1' : '0'} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, padding: '4px 9px', borderRadius: 100, background: b.ok ? '#FBBF24' : 'rgba(255,255,255,.12)', color: b.ok ? '#3b2a00' : 'rgba(255,255,255,.55)' }}>
                <Ico k={b.ico} size={11} />{b.txt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Coup de pouce de proximité (géolocalisation déjà autorisée, vraie distance) */}
      {plusProche && rub !== 'proche' && (
        <button data-nudge onClick={() => ouvrir('proche')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, margin: '10px auto 0', width: 'calc(100% - 36px)', maxWidth: 504, background: '#FEF3C7', color: '#92400E', border: 'none', borderRadius: 12, padding: '10px 12px', fontSize: 13.5, fontWeight: 800, textAlign: 'left', cursor: 'pointer' }}>
          <Ico k="game" size={16} />Un jeu est en cours à {distanceTxt(plusProche.d as number)} : {plusProche.c.nom || 'un commerce'}
        </button>
      )}

      {/* Rubrique courante : un écran, pas de longue page */}
      <div data-rubrique={rub} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 18px 10px' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          {rub === 'lots' && (<>
            {titre('Mes lots', actifs.length ? 'Touche le QR pour le montrer en caisse.' : undefined)}
            <MesLots lots={tousLots} joueurId={joueur.id} onChange={joueur.id === 'demo' ? undefined : () => { chargerMesLots(joueur.id).then(setLots).catch(() => { /* */ }) }} vide="Pas encore de lot. Joue dans un commerce près de chez toi !" />
          </>)}

          {rub === 'bientot' && (<>
            {titre('Expirent bientôt', 'Rappels à 1 mois, 15 jours et 48 h.')}
            {bientot.length
              ? <MesLots lots={bientot} joueurId={joueur.id} onChange={joueur.id === 'demo' ? undefined : () => { chargerMesLots(joueur.id).then(setLots).catch(() => { /* */ }) }} />
              : <div style={{ ...carte, textAlign: 'center', color: '#5a6071', fontSize: 14 }}>Aucun lot n’expire dans le mois.</div>}
          </>)}

          {rub === 'proche' && (<>
            {titre('Lots en jeu près de moi', pos ? 'Commerces avec un jeu en cours, du plus proche au plus loin.' : 'Commerces avec un jeu en cours.')}
            {!pos && (
              <button data-localiser onClick={localiser} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12, borderRadius: 12, border: 'none', background: HERO, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginBottom: 10 }}>
                <Ico k="globe" size={15} />{geoEtat === 'demande' ? 'Localisation…' : geoEtat === 'refus' ? 'Localisation refusée' : 'Me localiser'}
              </button>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {proches.slice(0, 4).map(({ c, d }) => (
                <div key={c.cle} data-commerce style={{ ...carte, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nom || '[commerce à compléter]'}</div>
                    <div style={{ fontSize: 12.5, color: '#5a6071', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[d !== null ? distanceTxt(d) : '', c.adresse || ''].filter(Boolean).join(' · ')}</div>
                  </div>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`} target="_blank" rel="noreferrer" aria-label="Itinéraire" style={{ flexShrink: 0, padding: '9px 12px', borderRadius: 10, background: '#EFF3FE', color: HERO, fontWeight: 800, fontSize: 12.5, textDecoration: 'none' }}>Y aller</a>
                </div>
              ))}
              {!proches.length && <div style={{ ...carte, textAlign: 'center', color: '#5a6071', fontSize: 14 }}>Aucun jeu en cours pour l’instant.</div>}
            </div>
            <a href="/carte-commerces" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13.5, fontWeight: 800, color: HERO, textDecoration: 'none' }}>Voir la carte ({commerces.length})</a>
          </>)}

          {rub === 'notifs' && (<>
            {titre('Mes notifications')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifs.slice(0, 6).map(n => (
                n.palier === 'annonce' ? (
                <div key={n.id} data-notif="annonce" style={{ ...carte, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ flexShrink: 0, color: HERO, marginTop: 2 }}><Ico k="bell" size={18} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: HERO }}>{n.commerce || '[commerce à compléter]'}</span>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 800 }}>{libelleNotif(n)}</span>
                    {n.message && <span style={{ display: 'block', fontSize: 13, color: '#5a6071', marginTop: 2 }}>{n.message}</span>}
                    {n.lien && <a href={n.lien} style={{ display: 'inline-block', marginTop: 6, fontSize: 13, fontWeight: 800, color: HERO, textDecoration: 'none' }}>Voir l’animation</a>}
                  </span>
                </div>
                ) :
                <button key={n.id} data-notif={n.palier} onClick={() => setRub('lots')} style={{ ...carte, display: 'flex', alignItems: 'center', gap: 10, border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}>
                  <span style={{ flexShrink: 0, color: n.palier === 'cadeau' ? '#0B6E50' : n.palier === '48h' ? '#991B1B' : HERO }}><Ico k={n.palier === 'cadeau' ? 'gift' : 'bell'} size={18} /></span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{libelleNotif(n)}</span>
                </button>
              ))}
              {!notifs.length && <div style={{ ...carte, textAlign: 'center', color: '#5a6071', fontSize: 14 }}>Rien de nouveau. On te prévient ici avant qu’un lot expire.</div>}
            </div>
          </>)}

          {rub === 'compte' && (<>
            {titre('Mon compte')}
            <div style={{ ...carte, marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{[joueur.prenom, joueur.nom].filter(Boolean).join(' ') || 'Participant'}</div>
              <div style={{ fontSize: 13, color: '#5a6071', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{joueur.email || ''}</div>
            </div>
            <div data-parrainage style={{ ...carte, marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Parrainer mes amis</div>
              <div style={{ fontSize: 13, color: '#5a6071', margin: '2px 0 10px' }}>Un ami qui s’inscrit avec ton lien = 1 ticket de plus pour toi.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {([['natif', 'Partager'], ['sms', 'SMS'], ['mail', 'Email']] as const).map(([k, t]) => (
                  <button key={k} data-share={k} onClick={() => parrainer(k)} style={{ flex: 1, minHeight: 44, borderRadius: 12, border: 'none', background: k === 'natif' ? HERO : '#EFF3FE', color: k === 'natif' ? '#fff' : HERO, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>{t}</button>
                ))}
              </div>
              {partageMsg && <div data-partage-msg style={{ fontSize: 12.5, color: '#0B6E50', marginTop: 8 }}>{partageMsg}</div>}
            </div>
            {consent && consent.length > 0 && (
              <div data-consentements style={{ ...carte, marginBottom: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 6 }}>Rester en contact</div>
                {consent.slice(0, 4).map(c => (
                  <label key={c.pro_id || 'flowin'} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" data-consent={c.pro_id || 'flowin'} checked={c.optin} onChange={async e => {
                      const v = e.target.checked
                      setConsent(consent.map(x => x.pro_id === c.pro_id ? { ...x, optin: v } : x))
                      const ok = await majConsentement(joueur.id, c.pro_id, v)
                      if (!ok) setConsent(consent)
                    }} style={{ width: 20, height: 20, accentColor: HERO }} />
                    <span style={{ flex: 1 }}>{c.pro_id ? c.nom : 'Flowin Event : offres, bons deals, prochains events'}</span>
                  </label>
                ))}
                <div style={{ fontSize: 11.5, color: '#9aa0ad', marginTop: 4 }}>Tes données ne sont jamais vendues, échangées ni commercialisées.</div>
              </div>
            )}
            <div style={{ ...carte, marginBottom: 10, fontSize: 13, color: '#5a6071', lineHeight: 1.5 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#141a26', marginBottom: 6 }}>Utiliser un autre compte</div>
              <ConnexionEmail compact />
            </div>
            {tickets.length > 0 && (
              <div style={{ ...carte, fontSize: 13, color: '#5a6071' }}>
                <Ico k="ticket" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
                {tickets.length} ticket{tickets.length > 1 ? 's' : ''} de tirage
                {/* Contrôle audit 17/11 : détail par opération et par commerce rétabli (présent avant l'audit). */}
                {Array.from(new Set(tickets.map(t => t.super_event_id || '').filter(Boolean))).map(se => {
                  const parCom: Record<string, number> = {}
                  tickets.filter(t => t.super_event_id === se).forEach(t => { const k = t.event_id || ''; if (k) parCom[k] = (parCom[k] || 0) + 1 })
                  return (
                    <a key={se} href={`/se/${se}`} style={{ display: 'block', marginTop: 8, color: 'inherit', textDecoration: 'none' }}>
                      <b style={{ color: HERO }}>{seNames[se] || 'Opération'}</b> · {tickets.filter(t => t.super_event_id === se).length}
                      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                        {Object.keys(parCom).map(eid => <span key={eid} style={{ fontSize: 11.5, background: '#f3f4f6', padding: '2px 8px', borderRadius: 100 }}>{evNames[eid] || eid} · {parCom[eid]}</span>)}
                      </span>
                    </a>
                  )
                })}
              </div>
            )}
          </>)}
        </div>
      </div>

      {/* Barre des rubriques (toujours visible, pouce) */}
      <nav data-rubriques style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e6e1d8', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex' }}>
          {RUBRIQUES.map(r => {
            const a = rub === r.k
            const pastille = r.k === 'notifs' ? nonVues.length : r.k === 'bientot' ? bientot.length : r.k === 'lots' ? actifs.length : 0
            return (
              <button key={r.k} data-onglet={r.k} onClick={() => ouvrir(r.k)} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 2px 8px', border: 'none', background: 'none', cursor: 'pointer', color: a ? HERO : '#7a8091', fontWeight: 800, fontSize: 11 }}>
                <Ico k={r.ico} size={20} />
                {r.txt}
                {pastille > 0 && <span style={{ position: 'absolute', top: 4, left: '56%', minWidth: 16, height: 16, borderRadius: 8, background: r.k === 'lots' ? '#0B6E50' : '#DC2626', color: '#fff', fontSize: 10, lineHeight: '16px', textAlign: 'center', padding: '0 4px', boxSizing: 'border-box' }}>{pastille}</span>}
                {a && <span style={{ position: 'absolute', top: 0, left: '30%', right: '30%', height: 3, borderRadius: 3, background: HERO }} />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
