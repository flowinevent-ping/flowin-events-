import { supabase } from '@/lib/supabase'
import type { QrStation } from '@/lib/dashboard'

/**
 * QR TRACES = STATIONS DE JEU (lot QR, 31/10).
 *
 * Decision client : le pro cree autant de QR qu'il veut, chacun nomme, rattache
 * a un SUPPORT et type PHYSIQUE ou DIGITAL, publie tout de suite (plus de
 * validation Flowin). Chaque QR est une « station de jeu » au sens de NDS 2026 :
 * son `source_qr` est porte par le lien (`?source=`), ecrit dans
 * visites.source (flash) et participations.source_qr (partie), et les regles
 * de jeu en dependent (lib/parcours.ts, controleRegleQr) :
 *   - physique : 1 participation par jour, par joueur et par QR ;
 *   - digital  : 1 seule fois par compte -- son slug commence par `reseaux-`
 *     (convention NDS 2026, deja lue par evenement_tracking et ParcoursHero).
 *
 * Table : qr_stations (nom, source_qr, publie) + colonnes `support` et
 * `type_qr` ajoutees par sql/2026-11-01-tirage-auto-liste-gagnants.sql. Tant
 * que ce SQL n'est pas applique, l'insertion retombe sur les seules colonnes
 * historiques : le type reste lisible par le prefixe du slug.
 */

export type TypeQr = 'physique' | 'digital'

export const SUPPORTS_QR: { v: string; digital: boolean }[] = [
  { v: 'Entrée / vitrine', digital: false },
  { v: 'Caisse', digital: false },
  { v: 'Facebook', digital: true },
  { v: 'Instagram', digital: true },
  { v: 'TikTok', digital: true },
  { v: 'Snapchat', digital: true },
  { v: 'Support publicitaire', digital: false },
  { v: 'Autre', digital: false },
]
export const typeParDefaut = (support: string): TypeQr =>
  (SUPPORTS_QR.find(s => s.v === support)?.digital ? 'digital' : 'physique')

export interface QrTrace {
  /** null pour un QR par defaut (non enregistre en base, lien toujours valide). */
  id: string | null
  nom: string
  support: string | null
  type: TypeQr
  source_qr: string
  publie: boolean
  parDefaut?: boolean
}

/** Les 3 QR donnes a la fin de la creation, corriges selon la convention :
 *  le QR reseaux est DIGITAL (`reseaux-instagram`, plus `instagram`). */
export const QR_PAR_DEFAUT: QrTrace[] = [
  { id: null, nom: 'En magasin', support: 'Entrée / vitrine', type: 'physique', source_qr: 'magasin', publie: true, parDefaut: true },
  { id: null, nom: 'Réseaux sociaux', support: 'Instagram', type: 'digital', source_qr: 'reseaux-instagram', publie: true, parDefaut: true },
  { id: null, nom: 'Tracking', support: 'Support publicitaire', type: 'physique', source_qr: 'tracking', publie: true, parDefaut: true },
]

export const estDigital = (source: string | null | undefined) => !!source && source.indexOf('reseaux-') === 0

function slugBrut(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)
}

/** Slug du QR : `reseaux-<support>-<nom>` pour un digital, `<nom>` sinon ;
 *  suffixe -2, -3… s il existe deja sur l event (ou parmi les QR par defaut). */
export function slugQr(nom: string, support: string, type: TypeQr, existants: string[]): string {
  let base = slugBrut(nom) || slugBrut(support) || 'qr'
  if (type === 'digital') {
    const sup = slugBrut(support)
    base = 'reseaux-' + (sup && base.indexOf(sup) !== 0 ? sup + '-' : '') + base
  } else if (base.indexOf('reseaux-') === 0) {
    base = base.slice(8) || 'qr' /* un physique ne doit jamais etre lu comme digital */
  }
  const pris = existants.concat(QR_PAR_DEFAUT.map(q => q.source_qr))
  let s = base, n = 2
  while (pris.indexOf(s) >= 0) { s = base + '-' + n; n++ }
  return s
}

type LigneQr = QrStation & { support?: string | null; type_qr?: string | null }

export function versQrTrace(r: LigneQr): QrTrace {
  const type: TypeQr = r.type_qr === 'digital' || r.type_qr === 'physique' ? r.type_qr : (estDigital(r.source_qr) ? 'digital' : 'physique')
  return { id: r.id, nom: r.nom, support: r.support ?? null, type, source_qr: r.source_qr, publie: r.publie !== false }
}

export async function fetchQrTraces(eventId: string): Promise<QrTrace[]> {
  const { data, error } = await supabase.from('qr_stations').select('*').eq('event_id', eventId).order('created_at')
  if (error) { console.error('[fetchQrTraces]', error.message); return [] }
  return ((data ?? []) as LigneQr[]).map(versQrTrace)
}

/** QR enregistres + QR par defaut absents de la base (fusion par slug). */
export function avecDefauts(qrs: QrTrace[]): QrTrace[] {
  const vus = qrs.map(q => q.source_qr)
  return QR_PAR_DEFAUT.filter(d => vus.indexOf(d.source_qr) < 0).concat(qrs)
}

/** Cree un QR publie immediatement. Retourne le QR cree, ou une erreur. */
export async function creerQrTrace(eventId: string, p: { nom: string; support: string; type: TypeQr }, existants: string[]): Promise<{ qr: QrTrace | null; erreur?: string }> {
  const nom = p.nom.trim() || p.support
  const source_qr = slugQr(nom, p.support, p.type, existants)
  const base = { event_id: eventId, nom, source_qr, publie: true }
  let r = await supabase.from('qr_stations').insert({ ...base, support: p.support, type_qr: p.type }).select('*').single()
  /* Colonnes support/type_qr pas encore creees (SQL non applique) : on
     retombe sur les colonnes historiques, le type reste porte par le slug. */
  if (r.error && /support|type_qr|column/i.test(r.error.message)) {
    r = await supabase.from('qr_stations').insert(base).select('*').single()
  }
  if (r.error || !r.data) return { qr: null, erreur: r.error?.message ?? 'QR non enregistré' }
  const qr = versQrTrace(r.data as LigneQr)
  return { qr: { ...qr, support: qr.support ?? p.support, type: p.type } }
}

export async function publierQrTrace(id: string, publie: boolean): Promise<boolean> {
  const { error } = await supabase.from('qr_stations').update({ publie }).eq('id', id)
  return !error
}

/* ── Statistiques par QR ─────────────────────────────────────────────────────
   Meme mecanique que les stations NDS : flash = ligne visites sans etape
   portant la source ; partie = ligne participations portant source_qr ;
   joueurs = joueurs distincts. Les lignes sans source sont « Lien principal ». */
export interface StatQr { source: string; nom: string; type: TypeQr; flashs: number; parties: number; joueurs: number }

export async function fetchStatsQr(eventIds: string[]): Promise<StatQr[]> {
  if (!eventIds.length) return []
  /* 1. RPC stats_qr_evenement (sql/2026-11-01-…) : comptes exacts cote base,
     sans plafond de lignes. 2. Repli client si le SQL n'est pas applique. */
  const rpc = await supabase.rpc('stats_qr_evenement', { p_events: eventIds })
  if (!rpc.error && Array.isArray(rpc.data)) {
    const { data: qrsRows } = await supabase.from('qr_stations').select('*').in('event_id', eventIds)
    const noms = new Map<string, QrTrace>()
    QR_PAR_DEFAUT.forEach(q => noms.set(q.source_qr, q))
    ;((qrsRows ?? []) as LigneQr[]).forEach(r => noms.set(r.source_qr, versQrTrace(r)))
    return (rpc.data as { source: string | null; flashs: number; parties: number; joueurs: number }[]).map(r => {
      const k = r.source || ''
      const q = noms.get(k)
      return {
        source: k,
        nom: k === '' ? 'Lien principal (sans QR tracé)' : q ? q.nom : k === 'parrainage' ? 'Parrainage' : k,
        type: q ? q.type : estDigital(k) ? 'digital' as const : 'physique' as const,
        flashs: Number(r.flashs) || 0, parties: Number(r.parties) || 0, joueurs: Number(r.joueurs) || 0,
      }
    }).sort((x, y) => y.flashs + y.parties - (x.flashs + x.parties))
  }
  const [qrRes, visRes, partRes] = await Promise.all([
    supabase.from('qr_stations').select('*').in('event_id', eventIds),
    supabase.from('visites').select('source').in('event_id', eventIds).is('etape', null).limit(20000),
    supabase.from('participations').select('source_qr,joueur_id').in('event_id', eventIds).limit(20000),
  ])
  const noms = new Map<string, QrTrace>()
  QR_PAR_DEFAUT.forEach(q => noms.set(q.source_qr, q))
  ;((qrRes.data ?? []) as LigneQr[]).forEach(r => noms.set(r.source_qr, versQrTrace(r)))
  const m = new Map<string, { flashs: number; parties: number; joueurs: Set<string> }>()
  const cle = (s: string | null | undefined) => {
    const k = (s || '').trim()
    return !k || k === 'direct' ? '' : k
  }
  const ligne = (k: string) => {
    let x = m.get(k)
    if (!x) { x = { flashs: 0, parties: 0, joueurs: new Set<string>() }; m.set(k, x) }
    return x
  }
  ;((visRes.data ?? []) as { source: string | null }[]).forEach(v => { ligne(cle(v.source)).flashs++ })
  ;((partRes.data ?? []) as { source_qr: string | null; joueur_id: string | null }[]).forEach(p => {
    const x = ligne(cle(p.source_qr)); x.parties++
    if (p.joueur_id) x.joueurs.add(p.joueur_id)
  })
  /* Les QR enregistres apparaissent meme a zero : le pro voit qu'ils existent. */
  ;((qrRes.data ?? []) as LigneQr[]).forEach(r => { ligne(r.source_qr) })
  const out: StatQr[] = []
  m.forEach((v, k) => {
    const q = noms.get(k)
    out.push({
      source: k,
      nom: k === '' ? 'Lien principal (sans QR tracé)' : q ? q.nom : k === 'parrainage' ? 'Parrainage' : k,
      type: q ? q.type : estDigital(k) ? 'digital' : 'physique',
      flashs: v.flashs, parties: v.parties, joueurs: v.joueurs.size,
    })
  })
  return out.sort((a, b) => b.flashs + b.parties - (a.flashs + a.parties))
}
