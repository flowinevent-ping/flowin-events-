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

  /* Partenaires */
  const partIds = (cfg.partenaires ?? []) as string[]
  let partenaires: FlowinPartenaire[] = []
  if (partIds.length) {
    const { data } = await supabase
      .from('partenaires')
      .select('id,nom,emoji,description,promo_text,site_web,url,instagram,facebook,image_url,actif')
      .in('id', partIds)
    partenaires = ((data ?? []) as FlowinPartenaire[]).filter(p => p.actif !== false)
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
  events: string[]
  ticket_code: string
  source: string
  prefix: string
}

export async function writeJoueur(payload: JoueurPayload): Promise<{ success: boolean; duplicate: boolean; ticket: string }> {
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
    const t = (dup[0] as { ticket_code?: string }).ticket_code ?? ''
    return { success: false, duplicate: true, ticket: t }
  }

  const tc = payload.ticket_code || generateTicket(payload.prefix as TicketPrefix)
  const today = new Date().toISOString().slice(0, 10)
  const extId = `j-${payload.prefix.toLowerCase()}-${emailLower.replace(/[^a-z0-9]/g, '-').substring(0, 36)}`

  const { data: joueurRows } = await supabase.from('joueurs').upsert({
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
    score_moy: payload.score_moy || null,
    optin: true,
    optin_date: today,
    first_seen: today,
    last_seen: today,
    events: payload.events,
    ticket_code: tc,
    source: payload.source,
  }, { onConflict: 'external_id' }).select('id')

  /* Participation */
  if (joueurRows?.length) {
    const joueurId = (joueurRows[0] as { id: string }).id
    const scoreNum = payload.score_moy ? (parseInt(payload.score_moy.split('/')[0]) || 0) : 0
    await supabase.from('participations').insert({
      joueur_id: joueurId,
      event_id: evId,
      ticket_code: tc,
      score: scoreNum,
      completed: true,
      tickets: 1,
    })
  }

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
    .app{max-width:480px;margin:0 auto;min-height:100dvh;display:flex;flex-direction:column;background:#0F172A;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    @media (min-width:768px){
      html,body{background:radial-gradient(ellipse at 50% 0%, #14233f 0%, #0a1424 55%, #060d18 100%)}
      .app{max-width:480px;min-height:auto;margin:32px auto;border-radius:28px;box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.06);overflow:hidden;min-height:680px}
    }
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
export const AGE_OPTIONS = [
  { val: '', label: "Tranche d'âge" },
  { val: '-18', label: 'Moins de 18 ans' },
  { val: '18-25', label: '18–25 ans' },
  { val: '26-35', label: '26–35 ans' },
  { val: '36-50', label: '36–50 ans' },
  { val: '51-65', label: '51–65 ans' },
  { val: '65+', label: '66 ans et plus' },
]
