/**
 * STATISTIQUES PRO (lots 5 E et 6 C, 24/11/2026) : lecture de la RPC `stats_pro_audience` (sql/2026-11-24-stats-pro-audience.sql).
 * Agrégats seulement. RPC absente (SQL pas encore appliqué) : état « bientot », jamais une erreur affichée.
 * Les flashs ont un repli qui marche sans le SQL : fetchStatsQr (lib/qrTraces.ts).
 * Âge : la colonne remplie est joueurs.age_tranche (643 lignes sur 842) ; joueurs.tranche_age est vide.
 */
import { supabase } from '@/lib/supabase'
import { fetchStatsQr } from '@/lib/qrTraces'

export interface StatsAudience {
  flashs: number
  joueurs: number
  optin: number
  petitEchantillon: boolean
  genre: { hommes: number; femmes: number; non_renseigne: number } | null
  ages: { tranche: string; n: number }[] | null
  cp: { cp: string; ville: string | null; n: number }[] | null
  cpTotal: number
  adressesConnues: number
  scan: { connus: number; moins_500: number; de_500_a_1000: number; de_1000_a_3000: number; plus_loin: number } | null
}

export type EtatStats =
  | { etat: 'ok'; stats: StatsAudience }
  | { etat: 'bientot'; flashs: number | null }
  | { etat: 'connexion'; flashs: number | null }

export type Periode = 7 | 30 | null
export const PERIODES: { v: Periode; label: string }[] = [{ v: 30, label: '30 jours' }, { v: 7, label: '7 jours' }, { v: null, label: 'Tout' }]

const nb = (v: unknown): number => { const x = Number(v); return Number.isFinite(x) ? x : 0 }

export function lireStats(d: unknown): StatsAudience | null {
  if (!d || typeof d !== 'object') return null
  const o = d as Record<string, unknown>
  if (o.refuse) return null
  const g = o.genre && typeof o.genre === 'object' ? o.genre as Record<string, unknown> : null
  const s = o.scan && typeof o.scan === 'object' ? o.scan as Record<string, unknown> : null
  return {
    flashs: nb(o.flashs), joueurs: nb(o.joueurs), optin: nb(o.optin), petitEchantillon: o.petit_echantillon === true,
    genre: g ? { hommes: nb(g.hommes), femmes: nb(g.femmes), non_renseigne: nb(g.non_renseigne) } : null,
    ages: Array.isArray(o.ages) ? (o.ages as { tranche: unknown; n: unknown }[]).map(a => ({ tranche: String(a.tranche), n: nb(a.n) })) : null,
    cp: Array.isArray(o.cp) ? (o.cp as { cp: unknown; ville: unknown; n: unknown }[]).map(c => ({ cp: String(c.cp), ville: c.ville ? String(c.ville) : null, n: nb(c.n) })) : null,
    cpTotal: nb(o.cp_total), adressesConnues: nb(o.adresses_connues),
    scan: s ? { connus: nb(s.connus), moins_500: nb(s.moins_500), de_500_a_1000: nb(s.de_500_a_1000), de_1000_a_3000: nb(s.de_1000_a_3000), plus_loin: nb(s.plus_loin) } : null,
  }
}

/** Flashs sans le SQL : somme des flashs par QR (toute la période). null si la lecture échoue. */
export async function flashsRepli(eventIds: string[]): Promise<number | null> {
  try { return (await fetchStatsQr(eventIds)).reduce((t, q) => t + q.flashs, 0) } catch { return null }
}

export async function fetchStatsAudience(eventIds: string[], jours: Periode): Promise<EtatStats> {
  if (!eventIds.length) return { etat: 'bientot', flashs: 0 }
  try {
    const r = await supabase.rpc('stats_pro_audience', { p_events: eventIds, p_jours: jours })
    if (!r.error) {
      const st = lireStats(r.data)
      if (st) return { etat: 'ok', stats: st }
      return { etat: 'connexion', flashs: await flashsRepli(eventIds) }
    }
  } catch { /* RPC absente ou réseau : repli ci-dessous */ }
  return { etat: 'bientot', flashs: await flashsRepli(eventIds) }
}

/** Part en % arrondie, 0 si le total est nul. */
export const pct = (a: number, total: number): number => (total > 0 ? Math.round((a / total) * 100) : 0)

/** Libellés lisibles des tranches stockées (« -18 », « 18-25 », « 65+ »...). Une valeur inconnue reste telle quelle. */
const LIBELLES_AGE: Record<string, string> = {
  '-18': 'Moins de 18 ans', '18-25': '18 à 25 ans', '26-35': '26 à 35 ans', '36-50': '36 à 50 ans', '51-65': '51 à 65 ans', '65+': 'Plus de 65 ans',
}
const ORDRE_AGE = ['-18', '18-25', '26-35', '36-50', '51-65', '65+']
export const libelleAge = (t: string): string => LIBELLES_AGE[t] ?? t
export function ordonnerAges(a: { tranche: string; n: number }[]): { tranche: string; n: number }[] {
  const rang = (t: string) => { const i = ORDRE_AGE.indexOf(t); return i < 0 ? 99 : i }
  return a.slice().sort((x, y) => rang(x.tranche) - rang(y.tranche))
}

/** Exemple de la démo : étiqueté « exemple » à l'écran, jamais mélangé à des chiffres réels. */
export const STATS_DEMO: StatsAudience = {
  flashs: 1248, joueurs: 312, optin: 312, petitEchantillon: false,
  genre: { hommes: 143, femmes: 156, non_renseigne: 13 },
  ages: [{ tranche: '18-25', n: 44 }, { tranche: '26-35', n: 84 }, { tranche: '36-50', n: 97 }, { tranche: '51-65', n: 59 }, { tranche: '65+', n: 28 }],
  cp: [{ cp: '06140', ville: 'Vence', n: 118 }, { cp: '06570', ville: 'Saint-Paul', n: 53 }, { cp: '06480', ville: 'La Colle-sur-Loup', n: 37 }, { cp: '06800', ville: 'Cagnes-sur-Mer', n: 28 }, { cp: '06000', ville: 'Nice', n: 22 }],
  cpTotal: 312, adressesConnues: 0,
  scan: { connus: 280, moins_500: 50, de_500_a_1000: 67, de_1000_a_3000: 115, plus_loin: 48 },
}
