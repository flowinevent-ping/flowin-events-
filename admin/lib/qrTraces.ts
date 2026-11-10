import { supabase } from '@/lib/supabase'
import type { QrStation } from '@/lib/dashboard'
import { lienAncien, lienPermanent } from '@/lib/qrPermalien'
import { libelleSource } from '@/lib/nds'

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

/** Types de support a pictogramme (Romain, 10/11/2026 soir : « QR = métrique de chaque support »).
 *  `p` = cle du pictogramme (components/operations/PictoSupport). Les reseaux sociaux sont digitaux. */
export const SUPPORTS_QR: { v: string; digital: boolean; p: string }[] = [
  { v: 'Bus / transport', digital: false, p: 'bus' },
  { v: 'Instagram', digital: true, p: 'instagram' },
  { v: 'Facebook', digital: true, p: 'facebook' },
  { v: 'TikTok', digital: true, p: 'tiktok' },
  { v: 'Affiche', digital: false, p: 'affiche' },
  { v: 'Flyer', digital: false, p: 'flyer' },
  { v: 'Ticket de caisse', digital: false, p: 'ticket' },
  { v: 'Vitrine / comptoir', digital: false, p: 'vitrine' },
  { v: 'Site web', digital: false, p: 'site' },
  { v: 'Presse / magazine', digital: false, p: 'presse' },
  { v: 'Radio', digital: false, p: 'radio' },
  { v: 'Autre', digital: false, p: 'autre' },
]
/** Anciens libelles encore en base -> pictogramme. */
const PICTO_ANCIENS: Record<string, string> = {
  'Entrée / vitrine': 'vitrine', 'Caisse': 'ticket', 'Snapchat': 'autre', 'Support publicitaire': 'affiche',
}
/** Cle de pictogramme d un support (texte libre tolere). */
export function pictoDuSupport(support: string | null | undefined, source?: string | null): string {
  const s = support || ''
  const t = SUPPORTS_QR.find(x => x.v === s)
  if (t) return t.p
  if (PICTO_ANCIENS[s]) return PICTO_ANCIENS[s]
  const k = (s + ' ' + (source || '')).toLowerCase()
  if (k.indexOf('bus') >= 0 || k.indexOf('tram') >= 0) return 'bus'
  if (k.indexOf('insta') >= 0) return 'instagram'
  if (k.indexOf('facebook') >= 0) return 'facebook'
  if (k.indexOf('tiktok') >= 0) return 'tiktok'
  if (k.indexOf('magasin') >= 0 || k.indexOf('vitrine') >= 0) return 'vitrine'
  if (k.indexOf('caisse') >= 0) return 'ticket'
  if (k.indexOf('affiche') >= 0 || k.indexOf('tracking') >= 0) return 'affiche'
  if (k.indexOf('flyer') >= 0) return 'flyer'
  return 'autre'
}
/** Piste de prix (non tranchee) : 2 QR de tracking inclus, au-dela « QR supplementaire ». Informatif. */
export const QR_INCLUS = 2
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
  /** Code court du QR permanent (sql/09-qr-permaliens.sql) ; null = pas encore de code (SQL non applique). */
  code_court?: string | null
  /** Archive (sql/2026-11-10-sa-carte-relance.sql) : le QR reste valable au scan, il sort des listes. */
  archive_le?: string | null
}

/** Lien a imprimer / copier / encoder pour un QR : le permalien /q/<code> quand le QR a un code
 *  (le jeu n'est alors PAS dans l'URL), sinon l'ancien lien (le jeu est dans l'URL : ce QR casserait
 *  si on changait de jeu -- `estPermanent` permet de l'afficher). */
export const urlDuQr = (q: QrTrace, eventId: string, module: string | null | undefined): string =>
  q.code_court ? lienPermanent(q.code_court) : lienAncien(eventId, module, q.source_qr)
export const estPermanent = (q: QrTrace): boolean => !!q.code_court

/** Les 3 QR donnes a la fin de la creation, corriges selon la convention :
 *  le QR reseaux est DIGITAL (`reseaux-instagram`, plus `instagram`). */
export const QR_PAR_DEFAUT: QrTrace[] = [
  { id: null, nom: 'En magasin', support: 'Vitrine / comptoir', type: 'physique', source_qr: 'magasin', publie: true, parDefaut: true },
  { id: null, nom: 'Réseaux sociaux', support: 'Instagram', type: 'digital', source_qr: 'reseaux-instagram', publie: true, parDefaut: true },
  { id: null, nom: 'Tracking', support: 'Affiche', type: 'physique', source_qr: 'tracking', publie: true, parDefaut: true },
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

type LigneQr = QrStation & { support?: string | null; type_qr?: string | null; code_court?: string | null; archive_le?: string | null }

export function versQrTrace(r: LigneQr): QrTrace {
  const type: TypeQr = r.type_qr === 'digital' || r.type_qr === 'physique' ? r.type_qr : (estDigital(r.source_qr) ? 'digital' : 'physique')
  return { id: r.id, nom: r.nom, support: r.support ?? null, type, source_qr: r.source_qr, publie: r.publie !== false, code_court: r.code_court ?? null, archive_le: r.archive_le ?? null }
}

export async function fetchQrTraces(eventId: string): Promise<QrTrace[]> {
  const { data, error } = await supabase.from('qr_stations').select('*').eq('event_id', eventId).order('created_at')
  if (error) { console.error('[fetchQrTraces]', error.message); return [] }
  return ((data ?? []) as LigneQr[]).map(versQrTrace)
}

/** Cree en base (sans doublon) les 3 QR par defaut d'une animation pour qu'ils aient un code
 *  permanent : RPC qr_assurer_defauts (sql/08). Silencieux si le SQL n'est pas applique. Retourne
 *  true quand la liste doit etre rechargee. */
export async function assurerQrParDefaut(eventId: string, qrs: QrTrace[]): Promise<boolean> {
  /* Ne rien ecrire en simple consultation tant que le SQL 08 n'est pas applique : on le
     detecte par la presence de la colonne (une ligne portant code_court) ou en sondant. */
  const sonde = await supabase.from('qr_stations').select('code_court').limit(1)
  if (sonde.error) return false
  if (QR_PAR_DEFAUT.every(d => qrs.some(q => q.source_qr === d.source_qr && q.code_court))) return false
  const r = await supabase.rpc('qr_assurer_defauts', { p_event_id: eventId })
  return !r.error
}

export type ResultatChangementJeu = { ok: boolean; erreur?: string }

/** Change le jeu derriere TOUS les QR de l'animation (module + master ensemble) : le QR imprime ne
 *  change pas. Reserve au proprietaire et au Super Admin, journalise (sql/08). */
export async function changerJeuStation(eventId: string, jeu: string): Promise<ResultatChangementJeu> {
  const { error } = await supabase.rpc('changer_jeu_station', { p_event_id: eventId, p_module: jeu })
  if (!error) return { ok: true }
  const m = error.message || ''
  if (/Could not find the function|changer_jeu_station|schema cache/i.test(m) && !/propriétaire/.test(m)) return { ok: false, erreur: 'Fonction non disponible : le SQL 09-qr-permaliens.sql n’est pas encore appliqué.' }
  return { ok: false, erreur: m }
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

export async function renommerQrTrace(id: string, nom: string): Promise<boolean> {
  const n = nom.trim()
  if (!n) return false
  const { error } = await supabase.from('qr_stations').update({ nom: n }).eq('id', id)
  return !error
}

export async function archiverQrTrace(id: string, archive: boolean): Promise<boolean> {
  const { error } = await supabase.from('qr_stations').update({ archive_le: archive ? new Date().toISOString() : null }).eq('id', id)
  return !error
}

export async function publierQrTrace(id: string, publie: boolean): Promise<boolean> {
  const { error } = await supabase.from('qr_stations').update({ publie }).eq('id', id)
  return !error
}

/* ── Statistiques par QR ─────────────────────────────────────────────────────
   Meme mecanique que les stations NDS : flash = ligne visites sans etape
   portant la source ; partie = ligne participations portant source_qr ;
   joueurs = joueurs distincts. Les lignes sans source sont « Lien principal ». */
export interface StatQr { source: string; nom: string; type: TypeQr; flashs: number; parties: number; joueurs: number; support?: string | null }

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
    const rows = (rpc.data as { source: string | null; flashs: number; parties: number; joueurs: number }[]).slice()
    /* Les QR enregistres apparaissent meme a zero (le pro voit qu'ils existent). */
    ;((qrsRows ?? []) as LigneQr[]).forEach(r => {
      if (!r.archive_le && !rows.some(x => (x.source || '') === r.source_qr)) rows.push({ source: r.source_qr, flashs: 0, parties: 0, joueurs: 0 })
    })
    return rows.map(r => {
      const k = r.source || ''
      const q = noms.get(k)
      return {
        source: k,
        nom: k === '' ? 'Lien principal (sans QR tracé)' : q ? q.nom : libelleSource(k),
        type: q ? q.type : estDigital(k) ? 'digital' as const : 'physique' as const,
        support: q ? q.support : null,
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
      nom: k === '' ? 'Lien principal (sans QR tracé)' : q ? q.nom : libelleSource(k),
      type: q ? q.type : estDigital(k) ? 'digital' : 'physique',
      support: q ? q.support : null,
      flashs: v.flashs, parties: v.parties, joueurs: v.joueurs.size,
    })
  })
  return out.sort((a, b) => b.flashs + b.parties - (a.flashs + a.parties))
}
