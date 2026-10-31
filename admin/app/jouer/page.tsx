/**
 * /jouer — LE PARCOURS JOUEUR DES MASTERS DE JEUX.
 *
 *   /jouer?ev=<event>          partie reelle d'une animation qui utilise un master
 *                              (events.cfg.master) — les anciennes routes
 *                              /parcours/<module> y redirigent dans ce cas ;
 *   /jouer?ev=…&preview=1&apercu=…   apercu pendant la creation (rien n'est ecrit) ;
 *   /jouer?m=<master>          maquette navigable du master (exemples), utilisee
 *                              par l'ecran « Masters de jeux » du Super Admin ;
 *   /jouer?se=<super event>    univers comics du super event.
 *   Options : &s=<ecran> (ecran de depart, apercu SA), &perso=<base64url json>
 *   (personnalisations en cours de saisie, apercu SA).
 *
 * Nuits du Sud n'est pas concerne (route /parcours/nds2026 inchangee).
 */
import type { Metadata, Viewport } from 'next'
import { fetchParcoursData, type ParcoursPageData } from '@/lib/parcours'
import { lireApercu, appliquerApercu } from '@/lib/apercu'
import { supabase } from '@/lib/supabase'
import { construireVue, referenceMaster, type SuperEventVue, type StationVue } from '@/lib/masters/resolve'
import { lireDefautsBase } from '@/lib/masters/base'
import { estMasterId, MASTERS } from '@/lib/masters/defs'
import type { ContenuMaster, MasterId } from '@/lib/masters/types'
import JouerClient from './JouerClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Jouer et gagner', description: 'Une partie gratuite, des lots à gagner.' }
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#F4F6F9', colorScheme: 'light' }

interface Props { searchParams: { ev?: string; m?: string; se?: string; s?: string; preview?: string; apercu?: string; perso?: string; sb?: string } }

function lirePerso(s?: string): ContenuMaster | null {
  if (!s) return null
  try { return JSON.parse(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as ContenuMaster } catch { return null }
}

function libDates(d: string | null, f: string | null): string {
  const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  const fd = (x: string | null) => (x ? new Date(x).toLocaleDateString('fr-FR', o) : '')
  if (d && f) return fd(d) + ' → ' + fd(f)
  return fd(d || f) || '[dates à compléter]'
}

type SuperCharge = SuperEventVue & { fin: string | null }
/** Super event reel : nom, dates, stations (events du super event, avec leurs
 *  coordonnees reelles si connues) et lots du grand tirage (se_lots). */
async function chargerSuperEvent(seId: string): Promise<SuperCharge | null> {
  const { data: se } = await supabase.from('super_events').select('id,nom,date_d,date_f').eq('id', seId).maybeSingle()
  if (!se) return null
  const s = se as { id: string; nom: string; date_d: string | null; date_f: string | null }
  const [{ data: evs }, { data: sl }] = await Promise.all([
    supabase.from('events').select('id,nom,lat,lng,adresse,categorie,module,status').eq('super_event_id', seId).neq('status', 'pending'),
    supabase.from('se_lots').select('libelle,valeur,rang').eq('super_event_id', seId).order('rang'),
  ])
  const stations: StationVue[] = ((evs ?? []) as (StationVue & { status?: string })[]).map(e => ({ id: e.id, nom: e.nom, lat: e.lat ?? null, lng: e.lng ?? null, adresse: e.adresse ?? null, categorie: e.categorie ?? null, module: e.module ?? null }))
  const vus: Record<string, boolean> = {}
  const lots = ((sl ?? []) as { libelle: string | null; valeur: number | null }[]).filter(l => l.libelle && !vus[l.libelle] && (vus[l.libelle] = true)).map(l => ({
    type: (Number(l.valeur) > 0 ? 'bon' : 'produit') as 'bon' | 'produit', big: Number(l.valeur) > 0 ? String(l.valeur) : '1', small: Number(l.valeur) > 0 ? '€' : 'lot',
    nom: String(l.libelle), cond: 'Grand tirage du super event', mode: 'tir' as const,
  }))
  return { id: s.id, nom: s.nom, dates: libDates(s.date_d, s.date_f), nbStations: stations.length, stations, lots, fin: s.date_f }
}

export default async function Page({ searchParams: sp }: Props) {
  const { base, tableAbsente } = await lireDefautsBase()
  const perso = lirePerso(sp.perso)
  let data: ParcoursPageData | null = null
  let masterId: MasterId | null = estMasterId(sp.m) ? sp.m : null
  let superEvent: SuperEventVue | null = null
  let persoSe: ContenuMaster | null = null

  if (sp.se) {
    masterId = 'super'
    const r = await chargerSuperEvent(sp.se)
    if (r) {
      superEvent = r
      persoSe = { commerce: { nom: r.nom }, tirageDate: r.fin ? libDates(null, r.fin) : undefined, lots: r.lots && r.lots.length ? r.lots : undefined }
    }
  } else if (sp.ev) {
    const saisie = lireApercu(sp)
    let brut = await fetchParcoursData(sp.ev)
    /* Apercu de creation sur un event de demonstration absent de la base :
       la saisie suffit a construire l'ecran (rien n'est ecrit). */
    if (!brut.ev && saisie) {
      const mod = (saisie.cfg && (saisie.cfg.master as { id?: string } | undefined)?.id) || (estMasterId(sp.m) ? sp.m : 'quiz')
      brut = { ...brut, ev: { id: sp.ev, nom: saisie.nom || '', module: mod, cfg: {}, adresse: '' } as unknown as ParcoursPageData['ev'] }
    }
    data = await appliquerApercu(brut, saisie)
    if (!data.ev) data = null
    const seId = data?.ev?.super_event_id
    if (seId) superEvent = await chargerSuperEvent(seId)
  }

  const demo = !data && !superEvent
  if (!masterId && data) masterId = referenceMaster(data.ev?.cfg)?.id ?? (estMasterId(data.ev?.module) ? (data.ev?.module as MasterId) : null)
  if (!masterId) masterId = 'quiz'
  const vue = construireVue(data, { base, masterId, perso: perso || persoSe, demo, superEvent })

  return (
    <JouerClient
      vue={vue}
      demo={demo}
      evId={data?.ev?.id ?? null}
      prefixe={MASTERS[masterId].prefixe}
      source={MASTERS[masterId].module}
      debut={sp.s || null}
      barre={demo || sp.sb === '1'}
      timer={data?.ev?.cfg && typeof (data.ev.cfg as Record<string, unknown>).quizTimer === 'number' ? Number((data.ev.cfg as Record<string, unknown>).quizTimer) : (data?.ev?.cfg as Record<string, unknown> | undefined)?.quizTimer === false ? 0 : 30}
      tableAbsente={tableAbsente}
    />
  )
}
