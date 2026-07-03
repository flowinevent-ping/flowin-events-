import { supabase } from './supabase'
import { generateTicket } from './ticket'
import type { TicketPrefix } from './types'
import type { FlowinEvent, FlowinLot, FlowinPartenaire } from './types'

/* ── Types communs parcours ── */
export interface ParcoursBanque {
  id: string
  nom: string
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  type: 'qcm'
  texte: string
  options: string[]
  bonne: number
  points?: number
  explication?: string
}

export interface BonusQuestion {
  id: string
  type: 'single' | 'multi'
  label: string
  options: { val: string; label: string }[]
}

export interface ParcoursPageData {
  ev: FlowinEvent | null
  lots: FlowinLot[]
  partenaires: FlowinPartenaire[]
  banques: ParcoursBanque[]
}

/* ── Fetch partagé server-side ── */
export async function fetchParcoursData(evId: string): Promise<ParcoursPageData> {
  const [evRes, lotsRes] = await Promise.all([
    supabase.from('events').select('*').eq('id', evId).single(),
    supabase.from('lots').select('*').eq('event_id', evId),
  ])
  const ev = evRes.data as FlowinEvent | null
  const lots = (lotsRes.data ?? []) as FlowinLot[]

  const cfg = (ev?.cfg ?? {}) as Record<string, unknown>

  /* Partenaires — option 1 : tous les partenaires du super-event de la station (sur toutes les stations).
     Repli sur cfg.partenaires (liste curée) si l'event n'a pas de super-event. */
  const seId = ((ev as unknown) as { super_event_id?: string } | null)?.super_event_id
  let partenaires: FlowinPartenaire[] = []
  if (seId) {
    const { data } = await supabase
      .from('partenaires')
      .select('id,nom,emoji,description,promo_text,site_web,url,instagram,facebook,image_url,lots,actif')
      .eq('super_event_id', seId)
    partenaires = ((data ?? []) as FlowinPartenaire[]).filter(p => p.actif !== false)
  } else {
    const partIds = (cfg.partenaires ?? []) as string[]
    if (partIds.length) {
      const { data } = await supabase
        .from('partenaires')
        .select('id,nom,emoji,description,promo_text,site_web,url,instagram,facebook,image_url,lots,actif')
        .in('id', partIds)
      partenaires = ((data ?? []) as FlowinPartenaire[]).filter(p => p.actif !== false)
    }
  }

  /* Banques de questions */
  const banqueIds = (cfg.quizBanques ?? []) as string[]
  let banques: ParcoursBanque[] = []
  if (banqueIds.length) {
    const { data } = await supabase.from('banques').select('*').in('id', banqueIds)
    banques = (data ?? []) as ParcoursBanque[]
  }

  return { ev, lots, partenaires, banques }
}

/* ── Écriture joueur en Supabase ── */
export interface JoueurPayload {
  email: string
  prenom?: string
  nom?: string
  tel?: string
  ville?: string
  code_postal?: string
  genre?: string
  age_tranche?: string
  decouverte?: string
  enseigne?: string
  secteur?: string
  client_type?: string
  lot_gagne?: string
  score_moy?: string
  bonus_reponses?: Record<string, unknown>
  quiz_reponses?: unknown
  optin?: boolean
  optin_version?: string
  events: string[]
  ticket_code: string
  source: string
  source_qr?: string | null
  started_at?: string | null
  prefix: string
  /** Tickets NDS : 1 ticket quiz (4/4) + 1 ticket bonus -> jusqu'à 2/station/jour. Défaut quiz=true (autres parcours), bonus=false. */
  quiz_ticket?: boolean
  bonus_ticket?: boolean
}

/* Bloc 2 — mémorise l'identité joueur côté client pour la reconnaissance Super Event */
type JoueurProfile = { id?: string; email?: string; prenom?: string; nom?: string; tel?: string; cp?: string; age?: string; genre?: string }
export function rememberJoueur(id: string | undefined | null, email: string, prenom?: string, extra?: Partial<JoueurProfile>): void {
  if (typeof window === 'undefined') return
  try {
    let prev: Partial<JoueurProfile> = {}
    try { const s = localStorage.getItem('flowin_joueur'); if (s) prev = JSON.parse(s) } catch { /* ignore */ }
    const merged: Partial<JoueurProfile> = {
      ...prev,
      ...(id ? { id } : {}),
      email: (email || prev.email || '').toLowerCase().trim(),
      prenom: (prenom ?? prev.prenom ?? '').trim(),
      ...(extra || {}),
    }
    localStorage.setItem('flowin_joueur', JSON.stringify(merged))
  } catch { /* ignore */ }
}

/* Bloc 2 — attribue les tickets (1 quiz + 1 bonus, max 2/station/jour) + gain immédiat */
export async function attribuerSuperEvent(
  joueurId: string, evId: string, today: string,
  onSite: boolean = true,
  tickets?: { quiz?: boolean; bonus?: boolean }
): Promise<void> {
  const { data: ev } = await supabase
    .from('events')
    .select('super_event_id,gain_immediat,gain_ticket')
    .eq('id', evId)
    .single()
  const row = ev as { super_event_id?: string | null; gain_immediat?: string | null; gain_ticket?: boolean | null } | null
  if (!row || !row.super_event_id) return
  const seId = row.super_event_id

  if (onSite && row.gain_ticket !== false) {
    const quizTk = tickets?.quiz !== false      // défaut true (autres parcours = 1 ticket au scan)
    const bonusTk = tickets?.bonus === true
    const rows: { super_event_id: string; joueur_id: string; event_id: string; jour: string; type: string }[] = []
    if (quizTk) rows.push({ super_event_id: seId, joueur_id: joueurId, event_id: evId, jour: today, type: 'quiz' })
    if (bonusTk) rows.push({ super_event_id: seId, joueur_id: joueurId, event_id: evId, jour: today, type: 'bonus' })
    if (rows.length) {
      await supabase.from('se_tickets').upsert(rows, { onConflict: 'joueur_id,event_id,jour,type', ignoreDuplicates: true })
    }
  }

  if (onSite && row.gain_immediat) {
    const code = 'G-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    await supabase.from('se_gains').insert({
      super_event_id: seId,
      joueur_id: joueurId,
      event_id: evId,
      type: 'immediat',
      libelle: row.gain_immediat,
      code,
      utilise: false,
    })
  }
}

import { captureParrainage } from './parrainage'

/* ── Anti-scan à distance : géolocalisation du scan ── */
function getScanPosition(timeoutMs = 8000): Promise<GeolocationPosition | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null)
  return new Promise((resolve) => {
    let done = false
    const finish = (v: GeolocationPosition | null) => { if (!done) { done = true; resolve(v) } }
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish(pos),
        () => finish(null),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
      )
    } catch { finish(null) }
    setTimeout(() => finish(null), timeoutMs + 500)
  })
}

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(s)))
}

/**
 * Capture la position au scan et la compare au point de scan (event lat/lng) selon geofence_m.
 * Règles : sur place → ticket ; hors zone → autorisé sans ticket ; refus/indispo → non vérifié, sans ticket.
 * Si l'event n'a pas de coordonnées ou n'est pas dans un Super Event, le géofence ne s'applique pas (ticket normal).
 */
export async function captureScanGeo(evId: string): Promise<{ onSite: boolean; scan: Record<string, unknown> }> {
  const { data: ev } = await supabase
    .from('events')
    .select('lat,lng,super_event_id')
    .eq('id', evId)
    .single()
  const e = ev as { lat?: number | null; lng?: number | null; super_event_id?: string | null } | null
  if (!e || !e.super_event_id || e.lat == null || e.lng == null) {
    return { onSite: true, scan: {} }
  }
  const { data: se } = await supabase.from('super_events').select('geofence_m,geo_controle').eq('id', e.super_event_id).single()
  const seRow = se as { geofence_m?: number | null; geo_controle?: boolean | null } | null

  // Contrôle GPS désactivé : on ne demande pas la position au joueur, MAIS on enregistre
  // toujours le LIEU de la station (lat/lng fixes de l'event) — indispensable au rapport
  // (répartition géographique des participations par station).
  if (!seRow || seRow.geo_controle !== true) {
    return { onSite: true, scan: { scan_lat: e.lat, scan_lng: e.lng, scan_statut: 'station' } }
  }

  let geofence = 150
  if (typeof seRow.geofence_m === 'number' && seRow.geofence_m > 0) geofence = seRow.geofence_m

  const pos = await getScanPosition()
  if (!pos) {
    // Pas de position fournie : on garde le lieu de la station, statut non vérifié.
    return { onSite: false, scan: { scan_lat: e.lat, scan_lng: e.lng, scan_statut: 'non_verifie' } }
  }
  const lat = pos.coords.latitude
  const lng = pos.coords.longitude
  const dist = distanceMeters(lat, lng, e.lat, e.lng)
  const onSite = dist <= geofence
  return {
    onSite,
    scan: { scan_lat: lat, scan_lng: lng, scan_distance_m: dist, scan_statut: onSite ? 'sur_place' : 'hors_zone' },
  }
}

export async function writeJoueur(payload: JoueurPayload): Promise<{ success: boolean; duplicate: boolean; ticket: string; error?: string }> {
  const emailLower = payload.email.toLowerCase().trim()
  const evId = payload.events[0]

  /* Anti-doublon */
  const { data: dup } = await supabase
    .from('joueurs')
    .select('id,ticket_code')
    .eq('email_lower', emailLower)
    .contains('events', [evId])
    .limit(1)

  if (dup?.length) {
    const d0 = dup[0] as { id?: string; ticket_code?: string }
    rememberJoueur(d0.id, emailLower, payload.prenom, { nom: payload.nom, tel: payload.tel, cp: payload.code_postal, age: payload.age_tranche, genre: payload.genre })
    return { success: false, duplicate: true, ticket: d0.ticket_code ?? '' }
  }

  const tc = payload.ticket_code || generateTicket(payload.prefix as TicketPrefix)
  const today = new Date().toISOString().slice(0, 10)
  const extId = `j-${payload.prefix.toLowerCase()}-${emailLower.replace(/[^a-z0-9]/g, '-').substring(0, 36)}`

  /* score_moy = colonne NUMERIC. Le payload arrive en "bon/total" (ex "3/4").
     On convertit en pourcentage entier (0-100). Sans conversion, l'upsert échoue
     (invalid input syntax for type numeric) et RIEN n'est enregistré en base. */
  let scoreNum = 0
  let scorePct: number | null = null
  if (payload.score_moy) {
    const parts = String(payload.score_moy).split('/')
    const bon = parseInt(parts[0]) || 0
    const tot = parseInt(parts[1]) || 0
    scoreNum = bon
    scorePct = tot > 0 ? Math.round((bon / tot) * 100) : bon
  }

  const { data: joueurRows, error: joueurErr } = await supabase.from('joueurs').upsert({
    external_id: extId,
    email: emailLower,
    prenom: payload.prenom?.trim() || null,
    nom: payload.nom?.trim() || null,
    tel: payload.tel?.trim() || null,
    ville: payload.ville?.trim() || null,
    code_postal: payload.code_postal?.trim() || null,
    genre: payload.genre || null,
    age_tranche: payload.age_tranche || null,
    decouverte: payload.decouverte || null,
    enseigne: payload.enseigne || null,
    secteur: payload.secteur || null,
    client_type: payload.client_type || 'btoc',
    lot_gagne: payload.lot_gagne || null,
    score_moy: scorePct,
    optin: payload.optin !== false,
    optin_date: today,
    optin_version: payload.optin_version || null,
    first_seen: today,
    last_seen: today,
    events: payload.events,
    ticket_code: tc,
    source: payload.source,
  }, { onConflict: 'external_id' }).select('id')

  if (joueurErr) {
    console.error('[writeJoueur] upsert joueur échoué:', joueurErr.message)
    return { success: false, duplicate: false, ticket: tc, error: joueurErr.message }
  }

  /* Participation */
  if (joueurRows?.length) {
    const joueurId = (joueurRows[0] as { id: string }).id
    const geo = await captureScanGeo(evId)
    const quizTk = geo.onSite && payload.quiz_ticket !== false
    const bonusTk = geo.onSite && payload.bonus_ticket === true
    const nbTickets = (quizTk ? 1 : 0) + (bonusTk ? 1 : 0)
    const { error: partErr } = await supabase.from('participations').insert({
      joueur_id: joueurId,
      event_id: evId,
      ticket_code: tc,
      score: scoreNum,
      completed: true,
      tickets: nbTickets,
      bonus_answers: payload.bonus_reponses ?? null,
      source_qr: payload.source_qr ?? null,
      started_at: payload.started_at ?? null,
      ...geo.scan,
    })
    if (partErr) {
      if ((partErr as { code?: string }).code === '23505') return { success: false, duplicate: true, ticket: tc }
      console.error('[writeJoueur] insert participation échoué:', partErr.message)
    }
    /* Stockage complet des réponses (profil + découverte + quiz + bonus) dans se_reponses */
    await writeSeReponses({
      joueurId, evId, jour: today,
      source: payload.source,
      decouverte: payload.decouverte,
      form: {
        prenom: payload.prenom ?? null, nom: payload.nom ?? null, email: emailLower,
        tel: payload.tel ?? null, code_postal: payload.code_postal ?? null,
        age_tranche: payload.age_tranche ?? null, genre: payload.genre ?? null,
        optin: payload.optin !== false,
      },
      quiz_reponses: payload.quiz_reponses,
      bonus_reponses: payload.bonus_reponses,
      scoreMoy: payload.score_moy,
    })
    /* Bloc 2 — Super Event : tickets (quiz si 4/4, bonus si fait) + gain immédiat, scan sur place */
    await attribuerSuperEvent(joueurId, evId, today, geo.onSite, { quiz: quizTk, bonus: bonusTk })
    rememberJoueur(joueurId, emailLower, payload.prenom, { nom: payload.nom, tel: payload.tel, cp: payload.code_postal, age: payload.age_tranche, genre: payload.genre })
    /* Parrainage : si l'inscription vient d'un lien ?ref=, on l'enregistre (validé + attribué au commerce) */
    await captureParrainage(extId)
  }

  return { success: true, duplicate: false, ticket: tc }
}

/* ── Stockage exhaustif des réponses (profil + découverte + quiz + bonus) ── */
async function writeSeReponses(opts: {
  joueurId: string; evId: string; jour: string;
  source?: string; decouverte?: string;
  form?: Record<string, unknown>;
  quiz_reponses?: unknown; bonus_reponses?: unknown;
  scoreMoy?: string;
}): Promise<void> {
  try {
    let scoreNum: number | null = null
    if (opts.scoreMoy) { const p = String(opts.scoreMoy).split('/'); scoreNum = parseInt(p[0]) || 0 }
    let seId: string | null = null
    try {
      const { data: ev } = await supabase.from('events').select('super_event_id').eq('id', opts.evId).single()
      seId = (ev as { super_event_id?: string | null } | null)?.super_event_id ?? null
    } catch { /* ignore */ }
    const payload = {
      joueur_id: opts.joueurId,
      event_id: opts.evId,
      super_event_id: seId,
      jour: opts.jour,
      source: opts.source ?? null,
      decouverte: opts.decouverte ?? null,
      form: opts.form ?? null,
      quiz_reponses: opts.quiz_reponses ?? null,
      bonus_reponses: opts.bonus_reponses ?? null,
      score: scoreNum,
    }
    // Insert avec 1 ré-essai : évite la perte silencieuse du détail form+quiz sur micro-coupure réseau
    let { error } = await supabase.from('se_reponses').insert(payload)
    if (error) {
      console.error('[se_reponses] insert échoué (tentative 1):', error.message)
      await new Promise(r => setTimeout(r, 800))
      ;({ error } = await supabase.from('se_reponses').insert(payload))
      if (error) console.error('[se_reponses] insert échoué (tentative 2):', error.message)
    }
  } catch (e) { console.error('[se_reponses] exception:', e) }
}

/* ── Bloc 2 — Compte joueur déjà créé (reconnaissance) ── */
export function getJoueurLocal(): { id: string; email: string; prenom?: string; nom?: string; tel?: string; cp?: string; age?: string; genre?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const s = localStorage.getItem('flowin_joueur')
    if (s) {
      const o = JSON.parse(s) as { id?: string; email?: string; prenom?: string; nom?: string; tel?: string; cp?: string; age?: string; genre?: string }
      if (o.id && o.email) return { id: o.id, email: o.email, prenom: o.prenom, nom: o.nom, tel: o.tel, cp: o.cp, age: o.age, genre: o.genre }
    }
  } catch { /* ignore */ }
  return null
}

/* ── Historique joueur (anti-répétition) ──
   Récupère, sur TOUTES les participations passées d'un joueur reconnu (tout le festival, pas juste
   la station courante) : les ids de questions de quiz déjà vues (à exclure du prochain tirage) et si
   la question bonus a déjà été répondue au moins une fois (pour la masquer ensuite). Lecture seule,
   best-effort : en cas d'erreur réseau on retourne un historique vide (comportement identique à
   aujourd'hui, sans blocage ni régression pour les joueurs non reconnus). */
export async function fetchJoueurHistory(joueurId: string): Promise<{ answeredQuizIds: string[]; bonusDone: boolean }> {
  try {
    const { data, error } = await supabase
      .from('se_reponses')
      .select('quiz_reponses,bonus_reponses')
      .eq('joueur_id', joueurId)
      .limit(200)
    if (error || !data) return { answeredQuizIds: [], bonusDone: false }
    const seen = new Set<string>()
    let bonusDone = false
    for (const row of data as { quiz_reponses?: { qid?: string }[] | null; bonus_reponses?: Record<string, unknown> | null }[]) {
      if (Array.isArray(row.quiz_reponses)) {
        for (const a of row.quiz_reponses) { if (a && a.qid) seen.add(a.qid) }
      }
      if (row.bonus_reponses && Object.keys(row.bonus_reponses).length > 0) bonusDone = true
    }
    return { answeredQuizIds: Array.from(seen), bonusDone }
  } catch {
    return { answeredQuizIds: [], bonusDone: false }
  }
}

/* ── Bloc 2 — Reconnaissance par EMAIL (compte, pas appareil) ──
   Lecture seule. À l'accueil/inscription, on retrouve le compte par email_lower
   pour pré-remplir et router vers claimJoueur (garde-fou ticket par compte).
   alreadyPlayed = a déjà une participation pour CET event (dédup downstream). */
export async function lookupJoueurByEmail(
  email: string,
  evId: string
): Promise<{ id: string; email: string; prenom?: string; nom?: string; tel?: string; cp?: string; age?: string; genre?: string; alreadyPlayed: boolean; ticket?: string } | null> {
  const emailLower = (email || '').toLowerCase().trim()
  if (emailLower.indexOf('@') === -1) return null
  const { data, error } = await supabase
    .from('joueurs')
    .select('id,email,prenom,nom,tel,code_postal,age_tranche,genre,events,ticket_code')
    .eq('email_lower', emailLower)
    .limit(1)
  if (error || !data?.length) return null
  const j = data[0] as { id: string; email?: string; prenom?: string; nom?: string; tel?: string; code_postal?: string; age_tranche?: string; genre?: string; events?: string[]; ticket_code?: string }
  const _today = new Date().toISOString().slice(0, 10)
  const { data: _pjToday } = await supabase
    .from('participations').select('id').eq('joueur_id', j.id).eq('event_id', evId).eq('played_date', _today).limit(1)
  const alreadyPlayed = !!(_pjToday && _pjToday.length)
  return {
    id: j.id, email: j.email || emailLower, prenom: j.prenom, nom: j.nom, tel: j.tel,
    cp: j.code_postal, age: j.age_tranche, genre: j.genre,
    alreadyPlayed, ticket: j.ticket_code,
  }
}

/* ── Bloc 2 — Réclamer (joueur déjà inscrit) : participation + ticket/gain SANS re-formulaire ── */
export async function claimJoueur(
  joueur: { id: string; email: string; prenom?: string },
  evId: string,
  prefix: TicketPrefix,
  bonus?: Record<string, unknown>,
  extra?: { quiz_reponses?: unknown; score?: string; decouverte?: string; source?: string; source_qr?: string; started_at?: string; quizTicket?: boolean; bonusTicket?: boolean }
): Promise<{ success: boolean; duplicate: boolean; ticket: string; error?: string }> {
  const emailLower = joueur.email.toLowerCase().trim()
  const today = new Date().toISOString().slice(0, 10)
  // Dedup 1/jour/station : bloque le rejeu de CETTE station le MEME jour (rejouable un autre jour).
  const { data: dupToday } = await supabase
    .from('participations').select('ticket_code').eq('joueur_id', joueur.id).eq('event_id', evId).eq('played_date', today).limit(1)
  if (dupToday?.length) {
    const d0 = dupToday[0] as { ticket_code?: string }
    rememberJoueur(joueur.id, emailLower, joueur.prenom)
    return { success: false, duplicate: true, ticket: d0.ticket_code ?? '' }
  }
  const tc = generateTicket(prefix)
  const { data: jrow } = await supabase.from('joueurs').select('events').eq('id', joueur.id).single()
  const evs = Array.from(new Set([...(((jrow as { events?: string[] } | null)?.events) ?? []), evId]))
  await supabase.from('joueurs').update({ events: evs, last_seen: today, ticket_code: tc }).eq('id', joueur.id)
  const geo = await captureScanGeo(evId)
  const quizTk = geo.onSite && extra?.quizTicket !== false
  const bonusTk = geo.onSite && extra?.bonusTicket === true
  const nbTickets = (quizTk ? 1 : 0) + (bonusTk ? 1 : 0)
  const sc = extra?.score ? (parseInt(String(extra.score).split('/')[0]) || 0) : 0
  const { error: partErr2 } = await supabase.from('participations').insert({ joueur_id: joueur.id, event_id: evId, ticket_code: tc, score: sc, completed: true, tickets: nbTickets, bonus_answers: bonus ?? null, source_qr: extra?.source_qr ?? null, started_at: extra?.started_at ?? null, ...geo.scan })
  if (partErr2) {
    if ((partErr2 as { code?: string }).code === '23505') { rememberJoueur(joueur.id, emailLower, joueur.prenom); return { success: false, duplicate: true, ticket: tc } }
    return { success: false, duplicate: false, ticket: tc, error: partErr2.message }
  }
  await writeSeReponses({
    joueurId: joueur.id, evId, jour: today,
    source: extra?.source ?? 'nds2026',
    decouverte: extra?.decouverte,
    form: { email: emailLower, prenom: joueur.prenom ?? null },
    quiz_reponses: extra?.quiz_reponses,
    bonus_reponses: bonus,
    scoreMoy: extra?.score,
  })
  await attribuerSuperEvent(joueur.id, evId, today, geo.onSite, { quiz: quizTk, bonus: bonusTk })
  rememberJoueur(joueur.id, emailLower, joueur.prenom)
  return { success: true, duplicate: false, ticket: tc }
}

/* ── Fisher-Yates shuffle ── */
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ── Shared CSS generator ── */
export function parcoursCSS(couleur: string): string {
  return `
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
    html,body{height:100%;background:#0F172A}
    .app{max-width:430px;margin:0 auto;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;background:#0F172A;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .screen{flex:1;padding:20px;overflow-y:auto;display:flex;flex-direction:column}
    .btn{width:100%;padding:14px;border:none;border-radius:50px;background:${couleur};color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;transition:transform .1s}
    .btn:active{transform:scale(.98)} .btn:disabled{opacity:.6}
    .btn-ghost{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:rgba(255,255,255,.55);font-size:13px;padding:10px;cursor:pointer;width:100%;font-family:inherit;margin-top:6px}
    .back{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;flex-shrink:0}
    .input{width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;font-size:15px;font-weight:600;outline:none;font-family:inherit}
    .input:focus{border-color:${couleur}} .input.err{border-color:#F87171}
    .label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-bottom:5px}
    .err{font-size:11px;color:#F87171;margin-top:3px;font-weight:700}
    .header{display:flex;align-items:center;gap:10px;margin-bottom:20px}
    .title{font-weight:800;font-size:17px}
    .sub{font-size:12px;color:rgba(255,255,255,.45)}
    .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px}
    .chip{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:100px;padding:4px 12px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .source-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:600;color:rgba(255,255,255,.55);cursor:pointer;font-family:inherit}
    .source-chip.sel{background:rgba(168,85,247,.15);border-color:#7C2D92;color:#C4B5FD}
    .gender-btn{flex:1;padding:10px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:12px;font-weight:700;color:#fff;cursor:pointer;font-family:inherit;font-size:14px}
    .gender-btn.sel{background:rgba(168,85,247,.15);border-color:#7C2D92;color:#C4B5FD}
    .ticket-code{font-size:28px;font-weight:900;color:${couleur};letter-spacing:.1em;margin:12px 0;font-family:monospace;text-align:center}
    .part-tile{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px;text-align:center;cursor:pointer}
    .link-btn{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;margin-bottom:8px}
    select.input option{background:#1E293B}
    .progress{display:flex;gap:6px;margin-bottom:16px}
    .progress-step{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.12)}
    .progress-step.on{background:${couleur}}
    .rgpd{display:flex;gap:10px;align-items:flex-start;margin:12px 0 0;font-size:11px;color:rgba(255,255,255,.45);line-height:1.5}
    .rgpd-check{width:20px;height:20px;border-radius:5px;background:${couleur};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px}
  `
}

/* ── Shared Form Component helper ── */
export const SOURCES = ['📸 Instagram', '🔵 Facebook', '📋 Affiche / Flyer', '📣 Bouche à oreille', '🌐 Autre']
export const SECTEURS = ['Commerce & Négoce', 'Point de vente indépendant', 'Restaurateur', 'Association / Événementiel', 'Municipalité / Office de tourisme', 'Centre commercial', 'Entreprise / RH', 'Organisateur de salon']
export const AGE_OPTIONS = [
  { val: '', label: "Tranche d'âge" },
  { val: '-18', label: 'Moins de 18 ans' },
  { val: '18-25', label: '18–25 ans' },
  { val: '26-35', label: '26–35 ans' },
  { val: '36-50', label: '36–50 ans' },
  { val: '51-65', label: '51–65 ans' },
  { val: '65+', label: '66 ans et plus' },
]

/* ── Sondage Brigade Verte : enregistrement anonyme (stats RSE, zéro PII) ──
   Écrit les réponses du sondage dès la fin du bloc bonus, que la personne
   s'inscrive ensuite ou non. Aucune donnée personnelle. Gated côté UI par
   cfg.sondageAnonyme. Échec silencieux : ne bloque jamais le parcours. */
export async function writeSondageBrigade(evId: string, reponses: Record<string, unknown>): Promise<void> {
  try {
    await supabase.from('sondage_brigade').insert({ event_id: evId, reponses: reponses ?? {} })
  } catch (e) {
    console.error('[sondage_brigade] insert anonyme échoué:', e)
  }
}
