/**
 * MES LOTS GAGNÉS (profil joueur /moi) — animations ET super events (10/11/2026).
 *
 * Décision Romain : le ticket gagnant validé est stocké dans le profil du
 * participant et dans l'espace du pro, et déstocké du stock du pro.
 *
 * Source unique : la table `tirages` (déjà alimentée par appliquer_regle_gain
 * pour les animations — gain immédiat / roue — et par les tirages au sort).
 * Même billet (/nds/billets-partenaires.html?t=), même QR (/lot.html?t=), même
 * validation PIN + déstockage (valider_lot). Rien de nouveau côté base pour
 * l'affichage.
 *
 * Colonnes optionnelles (sql/2026-11-10-tickets-animation.sql, NON APPLIQUÉ) :
 * valable_jusqu_au, offert_le. Tant qu'elles n'existent pas, la lecture repasse
 * sans elles et la validité affichée est la date de fin de l'animation.
 */
import { supabase } from '@/lib/supabase'

export type EtatLot = 'a_utiliser' | 'a_confirmer' | 'utilise' | 'expire'

export interface MonLot {
  id: string
  commerce: string
  commerceCle: string
  operation: string | null
  type: 'animation' | 'super'
  lot: string
  valeur: number | null
  ticketCode: string | null
  token: string | null
  etat: EtatLot
  gagneLe: string | null
  /** Date limite (ISO) : colonne dédiée si présente, sinon fin de l'animation. */
  valableJusquAu: string | null
  offertLe: string | null
}

interface TirRow {
  id: string | number; event_id: string | null; super_event_id: string | null; partenaire_id: string | null
  lot_nom: string | null; lot_valeur: number | null; ticket_code: string | null; retrait_token: string | null
  retire_at: string | null; notifie_at: string | null; statut: string | null; created_at: string | null
  valable_jusqu_au?: string | null; offert_le?: string | null
}

const COLS = 'id,event_id,super_event_id,partenaire_id,lot_nom,lot_valeur,ticket_code,retrait_token,retire_at,notifie_at,statut,created_at'

export function joursRestants(iso: string | null, maintenant: number = Date.now()): number | null {
  if (!iso) return null
  const d = new Date(iso.length <= 10 ? iso + 'T23:59:59' : iso).getTime()
  if (isNaN(d)) return null
  return Math.ceil((d - maintenant) / 86400000)
}

/** Palier de rappel in-app : 1 mois, 15 jours, 48 h avant l'expiration. */
export function palierRappel(j: number | null): '30j' | '15j' | '48h' | null {
  if (j === null || j < 0) return null
  if (j <= 2) return '48h'
  if (j <= 15) return '15j'
  if (j <= 30) return '30j'
  return null
}

export function dateCourte(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function lienBillet(token: string): string {
  const o = typeof window !== 'undefined' ? window.location.origin : 'https://flowin-events.vercel.app'
  return o + '/nds/billets-partenaires.html?t=' + encodeURIComponent(token)
}
export function lienQr(token: string): string {
  const o = typeof window !== 'undefined' ? window.location.origin : 'https://flowin-events.vercel.app'
  return o + '/lot.html?t=' + encodeURIComponent(token)
}

export async function chargerMesLots(joueurId: string): Promise<MonLot[]> {
  /* Colonnes optionnelles d'abord ; repli sans elles si le SQL n'est pas appliqué. */
  let r: { data: unknown[] | null; error: unknown } = await supabase.from('tirages').select(COLS + ',valable_jusqu_au,offert_le')
    .eq('joueur_id', joueurId).order('created_at', { ascending: false }).limit(200)
  if (r.error) {
    r = await supabase.from('tirages').select(COLS)
      .eq('joueur_id', joueurId).order('created_at', { ascending: false }).limit(200)
  }
  const rows = ((r.data ?? []) as unknown as TirRow[]).filter(t => (t.statut || '') !== 'annule')
  if (!rows.length) return []

  const evIds = Array.from(new Set(rows.map(t => t.event_id).filter((x): x is string => !!x)))
  const seIds = Array.from(new Set(rows.map(t => t.super_event_id).filter((x): x is string => !!x)))
  const ptIds = Array.from(new Set(rows.map(t => t.partenaire_id).filter((x): x is string => !!x)))
  const [ev, se, pt] = await Promise.all([
    evIds.length ? supabase.from('events').select('id,nom,date_f,cfg').in('id', evIds) : Promise.resolve({ data: [] }),
    seIds.length ? supabase.from('super_events').select('id,nom,date_f').in('id', seIds) : Promise.resolve({ data: [] }),
    ptIds.length ? supabase.from('partenaires').select('id,nom').in('id', ptIds) : Promise.resolve({ data: [] }),
  ])
  const evs: Record<string, { nom: string | null; date_f: string | null; titre: string | null }> = {}
  ;((ev.data ?? []) as { id: string; nom: string | null; date_f: string | null; cfg: { front?: { titre?: string } } | null }[])
    .forEach(e => { evs[e.id] = { nom: e.nom, date_f: e.date_f, titre: (e.cfg && e.cfg.front && e.cfg.front.titre) || null } })
  const ses: Record<string, { nom: string | null; date_f: string | null }> = {}
  ;((se.data ?? []) as { id: string; nom: string | null; date_f: string | null }[]).forEach(s => { ses[s.id] = s })
  const pts: Record<string, string> = {}
  ;((pt.data ?? []) as { id: string; nom: string | null }[]).forEach(p => { if (p.nom) pts[p.id] = p.nom })

  return rows.map(t => {
    const e = t.event_id ? evs[t.event_id] : undefined
    const s = t.super_event_id ? ses[t.super_event_id] : undefined
    const commerce = (t.partenaire_id && pts[t.partenaire_id]) || (e && (e.titre || e.nom)) || '[commerce à compléter]'
    const valable = t.valable_jusqu_au || (e && e.date_f) || (s && s.date_f) || null
    const j = joursRestants(valable)
    let etat: EtatLot = 'a_utiliser'
    if (t.retire_at) etat = 'utilise'
    else if (j !== null && j < 0) etat = 'expire'
    else if (t.super_event_id && !t.notifie_at) etat = 'a_confirmer'
    return {
      id: String(t.id), commerce, commerceCle: t.partenaire_id || t.event_id || commerce,
      operation: s ? s.nom : null, type: t.super_event_id ? 'super' : 'animation',
      lot: t.lot_nom || 'Lot', valeur: t.lot_valeur, ticketCode: t.ticket_code, token: t.retrait_token,
      etat, gagneLe: t.created_at, valableJusquAu: valable, offertLe: t.offert_le || null,
    } as MonLot
  })
}

/** Note « offert à un ami » côté serveur (RPC du SQL du 10/11). Sans le SQL : rien, le partage marche quand même. */
export async function noterOffert(token: string): Promise<void> {
  try { await supabase.rpc('offrir_ticket_ami', { p_token: token }) } catch { /* SQL pas encore appliqué */ }
}
