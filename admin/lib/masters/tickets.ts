/**
 * MES TICKETS PAR COMMERCE + RESULTATS DE TIRAGE (profil joueur, 01/11).
 *
 * Lecture :
 *   - participations du joueur (table existante) -> ses tickets ;
 *   - events / super_events -> commerce, animation, date du tirage ;
 *   - rpc mes_resultats_tirage (sql/10-resultats-tirage.sql) -> statut de CHAQUE
 *     tirage (gagne / pas tire). Elle ne renvoie QUE les lignes de ce joueur,
 *     jamais d'e-mail.
 * MODE DEGRADE : si la fonction n'existe pas encore (SQL pas applique), `dispo`
 * vaut false : le profil affiche les tickets sans statut, rien ne casse.
 *
 * « Vu » : memorise cote serveur (vu_le) ET dans le navigateur (repli), pour ne
 * pas reafficher le message a chaque ouverture.
 */
import { supabase } from '@/lib/supabase'
import type { GroupeTickets, ResultatVue, TicketLigne } from './engine'

export interface ResultatRow {
  id: string; event_id: string | null; super_event_id: string | null; commerce_nom: string | null; super_event_nom: string | null
  tirage_ref: string; tirage_le: string; statut: 'gagne' | 'perdu'; tickets: number; vu_le: string | null
  lot_nom: string | null; retrait_token: string | null
}
interface PartRow { event_id: string | null; ticket_code: string | null; created_at: string; tickets: number | null }
interface EvRow { id: string; nom: string | null; super_event_id: string | null; cfg: Record<string, unknown> | null }

const CLE_VUS = 'fm_resultats_vus'
export function idsVusLocal(): string[] { try { return JSON.parse(localStorage.getItem(CLE_VUS) || '[]') as string[] } catch { return [] } }
export function memoriserVus(ids: string[]): void {
  try { localStorage.setItem(CLE_VUS, JSON.stringify(Array.from(new Set(idsVusLocal().concat(ids))).slice(-300))) } catch { /* ignore */ }
}

export const dateFr = (iso: string | null | undefined): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Date de tirage « a venir » d'une animation : programmee, annoncee, ou laissee au commerce. */
function tirageAVenir(cfg: Record<string, unknown> | null): string {
  const c = (cfg || {}) as { tirage?: { mode?: string; date?: string | null }; tirageDate?: string }
  if (c.tirage && c.tirage.mode === 'auto' && c.tirage.date) return dateFr(c.tirage.date)
  if (c.tirageDate) return String(c.tirageDate)
  return 'à la date choisie par le commerce'
}

/** Composition pure (testable) : participations + evenements + resultats -> groupes par commerce. */
export function composerGroupes(parts: PartRow[], evs: EvRow[], supers: Record<string, string>, res: ResultatRow[], dispo: boolean): GroupeTickets[] {
  const evMap: Record<string, EvRow> = {}
  evs.forEach(e => { evMap[e.id] = e })
  const groupes: Record<string, GroupeTickets & { _t: number }> = {}
  parts.forEach(p => {
    if (!p.event_id) return
    const ev = evMap[p.event_id]
    const cfg = (ev && ev.cfg) || {}
    const front = (cfg as { front?: { titre?: string } }).front
    const g = groupes[p.event_id] || (groupes[p.event_id] = {
      cle: p.event_id,
      commerce: (front && front.titre) || (ev && ev.nom) || '[commerce à compléter]',
      operation: ev && ev.super_event_id ? (supers[ev.super_event_id] || undefined) : undefined,
      tirageDate: tirageAVenir(ev ? (ev.cfg as Record<string, unknown>) : null),
      tickets: [], _t: 0,
    })
    /* Resultat qui couvre ce ticket : le premier tirage de CE commerce (ou de son super event) posterieur au ticket. */
    const concerne = res.filter(r => (r.event_id === p.event_id) || (!r.event_id && r.super_event_id && ev && r.super_event_id === ev.super_event_id))
      .filter(r => new Date(r.tirage_le).getTime() >= new Date(p.created_at).getTime())
      .sort((a, b) => new Date(a.tirage_le).getTime() - new Date(b.tirage_le).getTime())[0]
    const statut: TicketLigne['statut'] = !dispo ? 'inconnu' : concerne ? concerne.statut : 'attente'
    if (concerne) g.tirageDate = dateFr(concerne.tirage_le) || g.tirageDate
    if (concerne && concerne.statut === 'gagne' && concerne.lot_nom && !(g.lots || []).some(l => l.nom === concerne.lot_nom)) g.lots = (g.lots || []).concat({ nom: concerne.lot_nom, token: concerne.retrait_token || undefined })
    g._t = Math.max(g._t, new Date(p.created_at).getTime())
    g.tickets.push({ code: p.ticket_code || 'TK-—', le: dateFr(p.created_at), statut, n: p.tickets || 1 })
  })
  return Object.keys(groupes).map(k => groupes[k]).sort((a, b) => b._t - a._t).map(g => ({ cle: g.cle, commerce: g.commerce, operation: g.operation, tirageDate: g.tirageDate, tickets: g.tickets, lots: g.lots }))
}

export async function chargerMesTickets(joueurId: string): Promise<{ groupes: GroupeTickets[]; resultats: ResultatRow[]; dispo: boolean }> {
  const { data: pd } = await supabase.from('participations').select('event_id,ticket_code,created_at,tickets').eq('joueur_id', joueurId).order('created_at', { ascending: false }).limit(300)
  const parts = ((pd ?? []) as PartRow[])
  const ids = Array.from(new Set(parts.map(p => p.event_id).filter((x): x is string => !!x)))
  let evs: EvRow[] = []
  if (ids.length) {
    const { data } = await supabase.from('events').select('id,nom,super_event_id,cfg').in('id', ids)
    evs = (data ?? []) as EvRow[]
  }
  const seIds = Array.from(new Set(evs.map(e => e.super_event_id).filter((x): x is string => !!x)))
  const supers: Record<string, string> = {}
  if (seIds.length) {
    const { data } = await supabase.from('super_events').select('id,nom').in('id', seIds)
    ;((data ?? []) as { id: string; nom: string }[]).forEach(s => { supers[s.id] = s.nom })
  }
  let resultats: ResultatRow[] = []
  let dispo = true
  try {
    const { data, error } = await supabase.rpc('mes_resultats_tirage', { p_joueur_id: joueurId })
    if (error) dispo = false
    else resultats = (data ?? []) as ResultatRow[]
  } catch { dispo = false }
  return { groupes: composerGroupes(parts, evs, supers, resultats, dispo), resultats, dispo }
}

/** Resultats pas encore vus (serveur ET navigateur). */
export function nonVus(resultats: ResultatRow[]): ResultatRow[] {
  const locaux = idsVusLocal()
  return resultats.filter(r => !r.vu_le && locaux.indexOf(r.id) < 0)
}

export function versVue(r: ResultatRow): ResultatVue {
  return {
    id: r.id, statut: r.statut, commerce: r.commerce_nom || '[commerce à compléter]', operation: r.super_event_nom || undefined,
    tirageLe: dateFr(r.tirage_le), tickets: r.tickets || 1, lot: r.lot_nom || undefined, token: r.retrait_token || undefined,
  }
}

export async function marquerVus(joueurId: string, ids: string[]): Promise<void> {
  memoriserVus(ids)
  try { await supabase.rpc('marquer_resultats_vus', { p_joueur_id: joueurId, p_ids: ids }) } catch { /* mode degrade : le navigateur s'en souvient */ }
}

/** Exemple de la maquette (jamais en reel) : trois commerces, les trois statuts. */
export const TICKETS_EXEMPLE: GroupeTickets[] = [
  { cle: 'ex-1', commerce: 'Boulangerie Exemple', tirageDate: '30 novembre 2026', tickets: [{ code: 'TK-0427', le: 'aujourd’hui', statut: 'attente', n: 1 }, { code: 'TK-0311', le: 'hier', statut: 'attente', n: 1 }] },
  { cle: 'ex-2', commerce: 'Café Exemple', operation: 'Marché de Noël Exemple', tirageDate: '12 novembre 2026', lots: [{ nom: 'Un café offert' }], tickets: [{ code: 'TK-0288', le: '8 novembre', statut: 'gagne', n: 1 }] },
  { cle: 'ex-3', commerce: 'Fleuriste Exemple', tirageDate: '5 novembre 2026', tickets: [{ code: 'TK-0190', le: '2 novembre', statut: 'perdu', n: 2 }] },
]
