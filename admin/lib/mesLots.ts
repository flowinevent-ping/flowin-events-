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
import { rpcAbsente } from './rpcRepli'

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
  /** Animation d'origine (lien d'invitation à jouer). */
  eventId?: string | null
  /** Billet reçu d'un ami (offert_a_joueur_id = moi). */
  recu?: boolean
  /** Billet que j'ai offert : il est dans le Flowin de mon ami, plus dans le mien. */
  donne?: boolean
  /** Pas de date de péremption (Nuits du Sud 2026). */
  sansLimite?: boolean
}

interface TirRow {
  id: string | number; event_id: string | null; super_event_id: string | null; partenaire_id: string | null
  lot_nom: string | null; lot_valeur: number | null; ticket_code: string | null; retrait_token: string | null
  retire_at: string | null; notifie_at: string | null; statut: string | null; created_at: string | null
  valable_jusqu_au?: string | null; offert_le?: string | null; joueur_id?: string | null; offert_a_joueur_id?: string | null
}

/** Super event sans date de péremption (décision du 10/11/2026, miroir de date_limite_tirage). */
export const SANS_PEREMPTION = 'se-nds-2026'

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
  /* Billets gagnés ET billets offerts par un ami (offert_a_joueur_id, sql/2026-11-10-finitions.sql). */
  /* Sécurité joueurs partie C (19/11) : RPC mes_lots (jamais l'uuid de l'ami), repli direct si absente. */
  const rl = await supabase.rpc('mes_lots', { p_joueur_id: joueurId })
  let r: { data: unknown[] | null; error: unknown } = !rpcAbsente(rl.error) ? { data: (rl.data ?? []) as unknown[], error: rl.error } : await supabase.from('tirages').select(COLS + ',valable_jusqu_au,offert_le,joueur_id,offert_a_joueur_id')
    .or(`joueur_id.eq.${joueurId},offert_a_joueur_id.eq.${joueurId}`).order('created_at', { ascending: false }).limit(200)
  if (r.error && rpcAbsente(rl.error)) {
    r = await supabase.from('tirages').select(COLS + ',valable_jusqu_au,offert_le')
      .eq('joueur_id', joueurId).order('created_at', { ascending: false }).limit(200)
  }
  if (r.error && rpcAbsente(rl.error)) {
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
    /* Exception Nuits du Sud 2026 (Romain, 10/11) : pas de date de péremption, comme date_limite_tirage en base. */
    const valable = t.super_event_id === SANS_PEREMPTION ? null : (t.valable_jusqu_au || (e && e.date_f) || (s && s.date_f) || null)
    const j = joursRestants(valable)
    let etat: EtatLot = 'a_utiliser'
    if (t.retire_at) etat = 'utilise'
    else if (j !== null && j < 0) etat = 'expire'
    else if (t.super_event_id && !t.notifie_at) etat = 'a_confirmer'
    return {
      id: String(t.id), commerce, commerceCle: t.partenaire_id || t.event_id || commerce,
      operation: s ? s.nom : null, type: t.super_event_id ? 'super' : 'animation',
      lot: t.lot_nom || 'Lot', valeur: t.lot_valeur, ticketCode: t.ticket_code, token: t.retrait_token,
      etat, gagneLe: t.created_at, valableJusquAu: valable, offertLe: t.offert_le || null, eventId: t.event_id,
      recu: !!t.offert_a_joueur_id && t.offert_a_joueur_id === joueurId && t.joueur_id !== joueurId,
      donne: !!t.offert_a_joueur_id && t.offert_a_joueur_id !== joueurId,
      sansLimite: t.super_event_id === SANS_PEREMPTION,
    } as MonLot
  })
}

/** Note « offert à un ami » côté serveur (RPC du SQL du 10/11). Sans le SQL : rien, le partage marche quand même. */
export async function noterOffert(token: string): Promise<void> {
  try { await supabase.rpc('offrir_ticket_ami', { p_token: token }) } catch { /* SQL pas encore appliqué */ }
}

/**
 * « En faire profiter un ami » (Romain, 10/11/2026) : RPC security definer offrir_ticket_ami_contact.
 * Ami déjà inscrit (e-mail ou téléphone connu) : notification dans son Flowin et billet dans son /moi -> 'notifie'.
 * Sinon : 'invite' (message WhatsApp avec le lien du billet et l'invitation à s'inscrire).
 * Dans les deux cas, l'ami entre dans le fichier client du commerce (source « parrainage »).
 * La réponse ne dit rien d'autre : ni nom, ni identifiant.
 */
export type ResultatAmi = { ok: boolean; resultat?: 'notifie' | 'invite'; raison?: string }
export async function offrirAmi(token: string, joueurId: string, prenom: string, contact: string): Promise<ResultatAmi> {
  const { data, error } = await supabase.rpc('offrir_ticket_ami_contact', { p_token: token, p_joueur_id: joueurId, p_prenom: prenom, p_contact: contact })
  if (error) return { ok: false, raison: 'reseau' }
  const d = (data || {}) as { ok?: boolean; resultat?: 'notifie' | 'invite'; raison?: string }
  return d.ok && d.resultat ? { ok: true, resultat: d.resultat } : { ok: false, raison: d.raison || 'inconnu' }
}

/** Lien d'invitation : jouer chez le même commerce, sinon la carte des commerces. */
export function lienInvitation(eventId: string | null | undefined): string {
  const o = typeof window !== 'undefined' ? window.location.origin : 'https://flowin-events.vercel.app'
  return eventId ? o + '/jouer?ev=' + encodeURIComponent(eventId) : o + '/carte-commerces'
}

/** Notifications « cadeau » non vues (lot offert par un ami). */
export interface Cadeau { id: string; tirage_id: number; lot_nom: string | null; created_at: string; vu_le: string | null }
export async function chargerCadeaux(joueurId: string): Promise<Cadeau[]> {
  const { data, error } = await supabase.rpc('mes_cadeaux', { p_joueur_id: joueurId })
  if (error) return []
  return ((data || []) as Cadeau[]).filter(c => !c.vu_le)
}
export async function marquerCadeauxVus(joueurId: string, ids: string[]): Promise<void> {
  if (!ids.length) return
  try { await supabase.rpc('marquer_notifications_vues', { p_joueur_id: joueurId, p_ids: ids }) } catch { /* */ }
}

/** Relances du commerce (palier « relance », RPC pro_relancer_lots) non vues, via mes_notifications. */
export interface Relance { id: string; tirage_id: number; lot_nom: string | null; vu_le: string | null; palier: string }
export async function chargerRelances(joueurId: string): Promise<Relance[]> {
  const { data, error } = await supabase.rpc('mes_notifications', { p_joueur_id: joueurId })
  if (error) return []
  return ((data || []) as Relance[]).filter(n => n.palier === 'relance' && !n.vu_le)
}

/** Toutes les notifications in-app (paliers 30j / 15j / 48h / cadeau / relance / annonce / resultat), plus récentes d'abord.
 *  « annonce » (sql/2026-11-18-annonces-pro.sql) : titre, message, lien, commerce ; absents avant activation. */
export interface Notif { id: string; tirage_id: number | null; palier: string; created_at: string; vu_le: string | null; lot_nom: string | null; retrait_token: string | null; valable_jusqu_au: string | null; titre?: string | null; message?: string | null; lien?: string | null; commerce?: string | null }
export async function chargerNotifications(joueurId: string): Promise<Notif[]> {
  const { data, error } = await supabase.rpc('mes_notifications', { p_joueur_id: joueurId })
  if (error) return []
  return (data || []) as Notif[]
}
export function libelleNotif(n: Notif): string {
  if (n.palier === 'annonce') return n.titre || 'Annonce'
  if (n.palier === 'resultat') return n.titre || 'Pas de lot cette fois'
  const lot = n.lot_nom ? `« ${n.lot_nom} »` : 'ton lot'
  if (n.palier === 'cadeau') return `Un ami t’offre ${lot}`
  if (n.palier === 'relance') return `Le commerce te rappelle ${lot}`
  if (n.palier === '48h') return `${lot} expire dans 48 h`
  if (n.palier === '15j') return `${lot} expire dans 15 jours`
  if (n.palier === '30j') return `${lot} expire dans un mois`
  return lot
}

/**
 * Consentements (audit 17/11, « à garder absolument ») : rester en contact avec Flowin Event
 * (joueurs.optin) et avec chaque commerce (clients_commerce.optin). RPC security definer
 * mes_consentements / maj_consentement (sql/2026-11-17-joueur-consentements.sql).
 * pro_id null = Flowin Event.
 */
export interface Consentement { pro_id: string | null; nom: string; optin: boolean }
export async function chargerConsentements(joueurId: string): Promise<Consentement[] | null> {
  const { data, error } = await supabase.rpc('mes_consentements', { p_joueur_id: joueurId })
  if (error) return null
  return (data || []) as Consentement[]
}
export async function majConsentement(joueurId: string, proId: string | null, optin: boolean): Promise<boolean> {
  const { error } = await supabase.rpc('maj_consentement', { p_joueur_id: joueurId, p_pro_id: proId, p_optin: optin })
  return !error
}

/** Distance en mètres (haversine). */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000, r = Math.PI / 180
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}
export function distanceTxt(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`
}
