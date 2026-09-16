/**
 * OPERATIONS D UN PRO — la brique commune du rangement par event / super event.
 *
 * Romain, repete plusieurs fois (handoff du 14/09, §3) : « Un pro a plusieurs
 * events et super events. Rien ne s affiche a plat. »
 *
 * Chaque ecran qui parle d un pro (les six onglets de la fiche pro SA, et le
 * dashboard pro) part de la LISTE COMPLETE des events du pro et affiche UN
 * BLOC PAR OPERATION, titre nom + date, trie par date decroissante :
 *   - une operation « super » = un super event ; elle regroupe toutes les
 *     stations que le pro y tient (Charvolin : NDS 2026, Fetes du Haut Pays) ;
 *   - une operation « event » = un event autonome du pro (sans super event).
 * Une operation sans donnees affiche son vide SOUS SON PROPRE TITRE.
 *
 * Cause racine traitee : ces onglets etaient delegues a PartenaireDrawer, filtre
 * sur `partenaire_id` -- une seule operation. D ou « 0 lot » a cote d un badge
 * « 5 stations ». Ici on part des events du pro, jamais d une fiche partenaire.
 *
 * Tout est lu dans les tables qui font foi (verifie le 16/09) :
 *   lots engages sur un super event  partenaires.lots (quantite) -- 59 lots NDS
 *   lots d un event / d une station  table `lots` (event_id)
 *   stock physique                   lots_stock (partenaire)
 *   gagnants                         tirages (super_event_id / event_id)
 *   contrat                          bons_commande + factures, champs partenaire
 *
 * Aucun appel ne passe par `find(e => e.super_event_id)` : l operation est
 * toujours designee explicitement (famille D de l audit).
 */
import { supabase } from './supabase'
import type { FlowinEvent } from './types'

/* ── Gabarit marque blanche : jamais une operation (famille B) ─────────────── */

/** Le super event gabarit. Romain : « gabarit, jamais une operation ». */
export const GABARIT_SE_ID = 'se-master-superevent'

/** true si l event appartient au gabarit master (22 events en base au 14/09). */
export function estGabarit(e: { super_event_id?: string | null } | null | undefined): boolean {
  return !!e && e.super_event_id === GABARIT_SE_ID
}

/** Retire le gabarit d une liste d events. Filtre unique, a utiliser partout. */
export function sansGabarit<T extends { super_event_id?: string | null }>(liste: T[] | null | undefined): T[] {
  return (liste ?? []).filter(e => !estGabarit(e))
}

/** Retire le gabarit d une liste de super events. */
export function superEventsReels<T extends { id: string }>(liste: T[] | null | undefined): T[] {
  return (liste ?? []).filter(s => s.id !== GABARIT_SE_ID)
}

/* ── Libelles des modules (famille A) ──────────────────────────────────────── */

const MODULES: Record<string, { nom: string; icone: string }> = {
  nds2026: { nom: 'Quiz + bonus', icone: '🎯' },
  quiz: { nom: 'Quiz', icone: '🧠' },
  quizmaster: { nom: 'Quiz Master', icone: '🎮' },
  quizsolo: { nom: 'Quiz Solo', icone: '⏱️' },
  spin: { nom: 'Roue', icone: '🎡' },
  tombola: { nom: 'Tombola', icone: '🎟️' },
  vote: { nom: 'Vote', icone: '⭐' },
  paques: { nom: 'Chasse aux œufs', icone: '🥚' },
}

/** Nom lisible d un module. `nds2026` -> « Quiz + bonus ». */
export function libelleModule(m: string | null | undefined): string {
  if (!m) return '—'
  return MODULES[m]?.nom ?? m
}
export function iconeModule(m: string | null | undefined): string {
  return (m && MODULES[m]?.icone) || '🎮'
}

/* ── Dates ─────────────────────────────────────────────────────────────────── */

export function libelleDates(d: string | null | undefined, f: string | null | undefined): string {
  if (!d) return 'sans date'
  const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  const fmt = (x: string) => new Date(`${x}T12:00:00`).toLocaleDateString('fr-FR', o)
  return f && f !== d ? `${fmt(d)} → ${fmt(f)}` : fmt(d)
}

/* ── Le decoupage ──────────────────────────────────────────────────────────── */

export interface SuperEventRef {
  id: string; nom: string; date_d: string | null; date_f: string | null; status?: string | null
}

export interface Operation {
  /** 'se:<id>' ou 'ev:<id>' -- cle React stable. */
  cle: string
  type: 'super' | 'event'
  /** id du super event, ou de l event autonome. */
  id: string
  nom: string
  dateD: string | null
  dateF: string | null
  status: string | null
  /** Les events du pro dans cette operation (un seul pour un event autonome). */
  stations: FlowinEvent[]
}

type EvMin = Pick<FlowinEvent, 'id' | 'nom' | 'date_d' | 'date_f' | 'status' | 'super_event_id'> & Partial<FlowinEvent>

/**
 * Regroupe les events d un pro en operations. Le gabarit est exclu.
 * Tri : date de debut decroissante, les operations sans date en dernier.
 */
export function grouperOperations(events: EvMin[], supers: SuperEventRef[]): Operation[] {
  const ops = new Map<string, Operation>()
  sansGabarit(events).forEach(e => {
    if (e.super_event_id) {
      const cle = `se:${e.super_event_id}`
      let op = ops.get(cle)
      if (!op) {
        const se = supers.find(s => s.id === e.super_event_id)
        op = {
          cle, type: 'super', id: e.super_event_id,
          nom: se?.nom ?? e.super_event_id,
          dateD: se?.date_d ?? e.date_d ?? null,
          dateF: se?.date_f ?? e.date_f ?? null,
          status: se?.status ?? null,
          stations: [],
        }
        ops.set(cle, op)
      }
      op.stations.push(e as FlowinEvent)
    } else {
      ops.set(`ev:${e.id}`, {
        cle: `ev:${e.id}`, type: 'event', id: e.id,
        nom: e.nom || e.id, dateD: e.date_d ?? null, dateF: e.date_f ?? null,
        status: e.status ?? null, stations: [e as FlowinEvent],
      })
    }
  })
  return Array.from(ops.values()).sort((a, b) => {
    if (!a.dateD && !b.dateD) return a.nom.localeCompare(b.nom, 'fr')
    if (!a.dateD) return 1
    if (!b.dateD) return -1
    return b.dateD.localeCompare(a.dateD)
  })
}

/* ── Les donnees par operation ─────────────────────────────────────────────── */

export interface LotOperation {
  id: string
  nom: string
  emoji: string | null
  valeur: number | null
  quantite: number
  conditions: string | null
  /** Referentiel 29 : un lot vit dans la table `lots`, sur sa station, que
   *  l operation soit un event ou un super event. */
  source: 'station'
  stationNom: string | null
  /** Stock physique de ce lot (lots_stock.lot_id), null si non gere en stock. */
  stock: { total: number; dispo: number } | null
}

export interface GagnantOperation {
  id: number
  joueurNom: string | null
  joueurEmail: string | null
  joueurTel: string | null
  lotNom: string | null
  lotValeur: number | null
  ticketCode: string | null
  retraitToken: string | null
  /** a_confirmer : tire, pas encore appele (SA) · confirme : appele · retire : lot remis. */
  etat: 'a_confirmer' | 'confirme' | 'retire'
  date: string | null
  superEventId: string | null
  eventId: string | null
}

export interface ContratOperation {
  offre: string | null
  montant: number | null
  paiementMode: string | null
  statutPaiement: string | null
  factureEmise: boolean | null
  bonId: string | null
  bonStatut: string | null
  bonMontantTtc: number | null
  factureNumero: string | null
  dateEmission: string | null
}

export interface DonneesOperation extends Operation {
  lots: LotOperation[]
  /** Stock physique de l operation (referentiel 43) : les codes de lots_stock
   *  rattaches aux lots de ses stations. null si aucun lot n est gere en stock. */
  stock: { total: number; dispo: number } | null
  gagnants: GagnantOperation[]
  contrat: ContratOperation | null
}

export interface PartenaireMin {
  id: string; nom: string; email: string | null; super_event_id: string | null
  code_pin: string | null; lots: unknown
  offre: string | null; montant_sponsoring: number | null; paiement_mode: string | null
  statut_paiement: string | null; facture_emise: boolean | null
}

export interface OperationsPro {
  proId: string
  proNom: string | null
  proEmail: string | null
  partenaire: PartenaireMin | null
  operations: DonneesOperation[]
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/**
 * Charge tout ce qu il faut pour les blocs d un pro, en une fois.
 * Utilisable cote serveur (pages /pro) comme cote client (fiche SA) : meme
 * client supabase anon.
 */
export async function fetchOperationsPro(proId: string): Promise<OperationsPro> {
  const vide: OperationsPro = { proId, proNom: null, proEmail: null, partenaire: null, operations: [] }
  if (!proId) return vide

  const [{ data: pro }, { data: evs }, { data: ses }] = await Promise.all([
    supabase.from('pros').select('id,nom,email,partenaire_id').eq('id', proId).maybeSingle(),
    supabase.from('events')
      .select('id,pro_id,nom,module,status,date_d,date_f,super_event_id,participants,cfg,paiement_statut,created_at')
      .eq('pro_id', proId),
    supabase.from('super_events').select('id,nom,date_d,date_f,status'),
  ])
  if (!pro) return vide
  const partenaireId = (pro as { partenaire_id: string | null }).partenaire_id

  const ops = grouperOperations((evs ?? []) as EvMin[], (ses ?? []) as SuperEventRef[])
  const evIds = ops.flatMap(o => o.stations.map(s => s.id))
  const seIds = ops.filter(o => o.type === 'super').map(o => o.id)

  const [partRes, lotsRes, tirSeRes, tirEvRes, stockRes, bonsRes] = await Promise.all([
    partenaireId
      ? supabase.from('partenaires')
        .select('id,nom,email,super_event_id,code_pin,lots,offre,montant_sponsoring,paiement_mode,statut_paiement,facture_emise')
        .eq('id', partenaireId).maybeSingle()
      : Promise.resolve({ data: null }),
    evIds.length
      ? supabase.from('lots').select('id,event_id,titre,nom,emoji,valeur,valeur_euros,quantite,conditions').in('event_id', evIds)
      : Promise.resolve({ data: [] }),
    partenaireId && seIds.length
      ? supabase.from('tirages')
        .select('id,joueur_nom,joueur_email,joueur_tel,lot_nom,lot_valeur,ticket_code,retrait_token,notifie_at,retire_at,created_at,super_event_id,event_id,statut,type')
        .eq('partenaire_id', partenaireId).in('super_event_id', seIds).neq('statut', 'annule').eq('type', 'grand')
      : Promise.resolve({ data: [] }),
    evIds.length
      ? supabase.from('tirages')
        .select('id,joueur_nom,joueur_email,joueur_tel,lot_nom,lot_valeur,ticket_code,retrait_token,notifie_at,retire_at,created_at,super_event_id,event_id,statut,type')
        .in('event_id', evIds).neq('statut', 'annule')
      : Promise.resolve({ data: [] }),
    evIds.length
      ? supabase.from('lots').select('id').in('event_id', evIds)
        .then(async r => {
          const lotIds = ((r.data ?? []) as { id: string }[]).map(x => x.id)
          if (!lotIds.length) return { data: [] }
          return supabase.from('lots_stock').select('id,lot_id,utilise').in('lot_id', lotIds)
        })
      : Promise.resolve({ data: [] }),
    partenaireId
      ? supabase.from('bons_commande').select('id,super_event_id,montant_ttc,statut,created_at').eq('partenaire_id', partenaireId).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const partenaire = (partRes.data ?? null) as PartenaireMin | null
  const lotsTable = (lotsRes.data ?? []) as Record<string, unknown>[]
  const stock = (stockRes.data ?? []) as { lot_id: string | null; utilise: boolean | null }[]
  const stockDe = (lotIds: Set<string>) => {
    const l = stock.filter(x => x.lot_id && lotIds.has(x.lot_id))
    return l.length ? { total: l.length, dispo: l.filter(x => !x.utilise).length } : null
  }
  const bons = (bonsRes.data ?? []) as { id: string; super_event_id: string | null; montant_ttc: number | null; statut: string | null }[]

  /* Tirages : dedoublonnes par id (un tirage d event pris dans un super event
     remonte dans les deux requetes). */
  const tirMap = new Map<number, Record<string, unknown>>()
  ;[...((tirSeRes.data ?? []) as Record<string, unknown>[]), ...((tirEvRes.data ?? []) as Record<string, unknown>[])]
    .forEach(t => tirMap.set(Number(t.id), t))
  const tirages: GagnantOperation[] = Array.from(tirMap.values()).map(t => ({
    id: Number(t.id),
    joueurNom: (t.joueur_nom as string) ?? null,
    joueurEmail: (t.joueur_email as string) ?? null,
    joueurTel: (t.joueur_tel as string) ?? null,
    lotNom: (t.lot_nom as string) ?? null,
    lotValeur: num(t.lot_valeur),
    ticketCode: (t.ticket_code as string) ?? null,
    retraitToken: (t.retrait_token as string) ?? null,
    etat: t.retire_at ? 'retire' : t.notifie_at ? 'confirme' : 'a_confirmer',
    date: t.created_at ? String(t.created_at).slice(0, 10) : null,
    superEventId: (t.super_event_id as string) ?? null,
    eventId: (t.event_id as string) ?? null,
  }))
  tirages.sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')) || (a.lotNom ?? '').localeCompare(b.lotNom ?? '', 'fr'))

  /* Facture liee au bon le plus recent de chaque super event. */
  const facturesParBon = new Map<string, { numero: string; date_emission: string | null }>()
  if (bons.length) {
    const { data: facs } = await supabase.from('factures')
      .select('numero,date_emission,client').in('client->>bon_id', bons.map(b => b.id))
    ;((facs ?? []) as { numero: string; date_emission: string | null; client: { bon_id?: string } | null }[])
      .forEach(f => { const b = f.client?.bon_id; if (b && !facturesParBon.has(b)) facturesParBon.set(b, f) })
  }

  const operations: DonneesOperation[] = ops.map(op => {
    const ids = new Set(op.stations.map(s => s.id))
    const nomStation = (id: string) => op.stations.find(s => s.id === id)?.nom ?? id
    const estSEduPartenaire = op.type === 'super' && !!partenaire && partenaire.super_event_id === op.id

    /* Lots : une seule source, la table `lots` (referentiel 29). Les
       engagements NDS (partenaires.lots) y ont ete recopies sur la station du
       commerce (sql/operation_unique_lot1.sql). */
    const lots: LotOperation[] = lotsTable.filter(l => ids.has(String(l.event_id))).map(l => {
      const id = String(l.id)
      return {
        id, nom: String(l.titre ?? l.nom ?? 'Lot'), emoji: (l.emoji as string) ?? null,
        valeur: num(l.valeur_euros ?? l.valeur), quantite: num(l.quantite) ?? 1,
        conditions: (l.conditions as string) ?? null,
        source: 'station' as const, stationNom: op.type === 'super' ? nomStation(String(l.event_id)) : null,
        stock: stockDe(new Set([id])),
      }
    })

    const gagnants = tirages.filter(t =>
      (t.eventId && ids.has(t.eventId)) || (op.type === 'super' && t.superEventId === op.id))

    let contrat: ContratOperation | null = null
    if (estSEduPartenaire && partenaire) {
      const bon = bons.find(b => b.super_event_id === op.id) ?? bons.find(b => !b.super_event_id) ?? null
      const fac = bon ? facturesParBon.get(bon.id) : undefined
      contrat = {
        offre: partenaire.offre, montant: num(partenaire.montant_sponsoring),
        paiementMode: partenaire.paiement_mode, statutPaiement: partenaire.statut_paiement,
        factureEmise: partenaire.facture_emise,
        bonId: bon?.id ?? null, bonStatut: bon?.statut ?? null, bonMontantTtc: num(bon?.montant_ttc),
        factureNumero: fac?.numero ?? null, dateEmission: fac?.date_emission ?? null,
      }
    } else if (op.type === 'event') {
      const ps = (op.stations[0] as unknown as { paiement_statut?: string | null }).paiement_statut ?? null
      if (ps) contrat = {
        offre: null, montant: null, paiementMode: null, statutPaiement: ps, factureEmise: null,
        bonId: null, bonStatut: null, bonMontantTtc: null, factureNumero: null, dateEmission: null,
      }
    }

    return {
      ...op, lots, gagnants, contrat,
      stock: stockDe(new Set(lots.map(l => l.id))),
    }
  })

  return {
    proId,
    proNom: (pro as { nom: string | null }).nom ?? null,
    proEmail: (pro as { email: string | null }).email ?? null,
    partenaire,
    operations,
  }
}

/* ── Tracking d une operation ──────────────────────────────────────────────── */

export interface StationSuivi {
  event_id: string; station: string; flashs: number; physique: number; digital: number
  parties: number; joueurs: number; rejoue: number; heure_pic: number | null
}
/** Stats uniformes (RPC operation_stats). Romain, 16/09 : rejoue = les deux
 *  (meme jour ET d un jour a l autre) ; pic = les deux (heure ET jour). */
export interface StatsOperation {
  parties: number
  joueurs: number
  rejoue_meme_jour: number
  rejoue_autre_jour: number
  pic_heure: { heure: number; parties: number } | null
  pic_jour: { jour: string; parties: number } | null
  par_heure: { heure: number; parties: number }[]
  par_jour: { jour: string; parties: number }[]
  sexe: { valeur: string; n: number }[]
  age: { valeur: string; n: number }[]
}

export interface SuiviOperation {
  stations: StationSuivi[]
  totaux: { flashs: number; physique: number; digital: number; parties: number; joueurs: number; rejoue: number }
  stats: StatsOperation | null
}

/**
 * Tracking d une operation, borne aux stations du pro.
 * Super event : station_tracking(se, pro) -- periode officielle de l operation.
 * Event autonome : evenement_tracking([id]) -- tout son historique.
 */
export async function fetchSuiviOperation(op: Operation, proId: string): Promise<SuiviOperation | null> {
  const ids = op.stations.map(s => s.id)
  const [{ data, error }, st] = await Promise.all([
    op.type === 'super'
      ? supabase.rpc('station_tracking', { p_se: op.id, p_pro: proId, p_partenaire: null, p_jour: null, p_tout: false })
      : supabase.rpc('evenement_tracking', { p_events: ids }),
    supabase.rpc('operation_stats', { p_events: ids, p_se: op.type === 'super' ? op.id : null }),
  ])
  if (error) { console.error('[fetchSuiviOperation]', error.message); return null }
  if (st.error) console.error('[fetchSuiviOperation] stats', st.error.message)
  if (!data) return null
  return { ...(data as Omit<SuiviOperation, 'stats'>), stats: (st.data as StatsOperation) ?? null }
}

/* ── Libelles d etat ───────────────────────────────────────────────────────── */

export function libelleStatut(s: string | null | undefined): string {
  switch (s) {
    case 'live': return 'En cours'
    case 'upcoming': return 'À venir'
    case 'past': return 'Terminé'
    case 'archived': return 'Archivé'
    default: return s || '—'
  }
}
