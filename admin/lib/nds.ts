/**
 * Socle metier des super events — Flowin
 * ---------------------------------------------------------------------------
 * Regroupe les briques reutilisables d un super event a l autre : gagnants,
 * cycle de vie, billets, PIN commercant, pack d envoi.
 *
 * REGLES PORTEES PAR CE MODULE (voir handoff Supabase + Notion) :
 *  - Cycle du gagnant : TIRE (interne) -> CONFIRME (visible partenaire) -> RETIRE.
 *  - Le partenaire ne voit QUE les gagnants confirmes. Filtrage cote serveur
 *    (parametre p_mode), jamais cote client.
 *  - Le billet ne devient nominatif qu a la confirmation.
 *  - Le PIN est confidentiel : jamais expose cote client final.
 *
 * Rien n est code en dur sur NDS : le super event est toujours un parametre.
 */
import { supabase } from './supabase'

export const SE_DEFAUT = 'se-nds-2026'

export type EtatGagnant = 'a_confirmer' | 'confirme' | 'retire'

export interface GagnantPartenaire {
  tirage_id: number
  joueur_nom: string | null
  joueur_email: string | null
  joueur_tel: string | null
  lot_nom: string | null
  lot_valeur: number | string | null
  statut: string | null
  notifie_at: string | null
  retire_at: string | null
  etat: EtatGagnant
  retrait_token: string | null
  ticket_code: string | null
  date: string | null
  partenaire_nom: string | null
  partenaire_adresse: string | null
  partenaire_tel: string | null
  conditions: string | null
}

export interface EtatPartenaire {
  tires: number
  a_confirmer: number
  confirmes: number
  retires: number
}

/** Gagnants d un partenaire. mode 'partenaire' ne renvoie que les confirmes. */
export async function fetchGagnantsPartenaire(
  partenaireId: string,
  se: string = SE_DEFAUT,
  mode: 'interne' | 'partenaire' = 'interne'
): Promise<GagnantPartenaire[]> {
  const { data, error } = await supabase.rpc('partenaire_gagnants', {
    p_partenaire_id: partenaireId,
    p_se: se,
    p_mode: mode,
  })
  if (error) { console.error('[fetchGagnantsPartenaire]', error.message); return [] }
  return Array.isArray(data) ? (data as GagnantPartenaire[]) : []
}

/** Compteurs par etat, pour piloter l avancement des appels. */
export async function fetchEtatPartenaire(
  partenaireId: string,
  se: string = SE_DEFAUT
): Promise<EtatPartenaire> {
  const vide: EtatPartenaire = { tires: 0, a_confirmer: 0, confirmes: 0, retires: 0 }
  const { data, error } = await supabase.rpc('partenaire_gagnants_etat', {
    p_partenaire_id: partenaireId,
    p_se: se,
  })
  if (error) { console.error('[fetchEtatPartenaire]', error.message); return vide }
  return { ...vide, ...(data as Partial<EtatPartenaire> | null) }
}

/** Confirme un gagnant : il devient visible du partenaire et son billet se nomme. */
export async function confirmerGagnant(tirageId: number): Promise<boolean> {
  const { error } = await supabase.rpc('marquer_notifie', { p_tirage_id: tirageId })
  if (error) { console.error('[confirmerGagnant]', error.message); return false }
  return true
}

/* ── Liens ─────────────────────────────────────────────────────────────── */

const origine = () => (typeof window !== 'undefined' ? window.location.origin : '')

/** Billet d un gagnant. print=true declenche l impression (export PDF). */
export function lienBillet(token: string, print = false): string {
  return `${origine()}/nds/billets-partenaires.html?t=${encodeURIComponent(token)}${print ? '&print=1' : ''}`
}
/** Planche de billets d un commerce — ne montre que les gagnants confirmes. */
export function lienPlanchePartenaire(partenaireId: string): string {
  return `${origine()}/nds/billets-partenaires.html?p=${encodeURIComponent(partenaireId)}`
}
/** Page bilan + procedure + PIN, destinee au commercant. */
export function lienBilanPartenaire(partenaireId: string): string {
  return `${origine()}/nds/bilan/email-partenaire.html?p=${encodeURIComponent(partenaireId)}`
}

export interface ElementPack { icone: string; libelle: string; url: string }

/** Pack d envoi : tout ce que le commercant doit recevoir, en un bloc. */
export function packEnvoi(partenaireId: string): ElementPack[] {
  const slug = partenaireId.replace(/^pt-/, '')
  const o = origine()
  return [
    { icone: '✉️', libelle: 'Email de remerciement (chiffres + son PIN)', url: lienBilanPartenaire(partenaireId) },
    { icone: '🎟️', libelle: 'Billets de ses gagnants confirmés',          url: lienPlanchePartenaire(partenaireId) },
    { icone: '📊', libelle: 'Visuel bilan',                                url: `${o}/nds/bilan/bilan-nds-2026.png` },
    { icone: '📄', libelle: 'Affiche A4 boutique',                         url: `${o}/nds/visuels/nds_a4_${slug}.png` },
    { icone: '🎫', libelle: 'Planche de tickets (PDF)',                    url: `${o}/nds/visuels/tickets/nds_tickets_${slug}.pdf` },
    { icone: '🎨', libelle: 'Kit digital complet',                         url: `${o}/nds/kit-digital/${slug}/` },
    { icone: '🔗', libelle: 'Page de validation en caisse',                url: `${o}/lot.html` },
  ]
}

/* ── Conditions d utilisation ──────────────────────────────────────────── */

/**
 * Compose les conditions affichees sur un billet.
 * Un billet doit TOUJOURS dire sur quoi le bon s applique, ou l utiliser et
 * jusqu a quand : "non cumulable" seul expose a une contestation en boutique.
 * On assemble donc objet + lieu + conditions saisies en base.
 */
export function composerConditions(g: {
  lot_nom?: string | null
  partenaire_nom?: string | null
  partenaire_adresse?: string | null
  conditions?: string | null
}): string[] {
  const out: string[] = []
  if (g.lot_nom) out.push(`À valoir sur : ${g.lot_nom}`)
  if (g.partenaire_nom) {
    out.push(`À présenter chez ${g.partenaire_nom}${g.partenaire_adresse ? `, ${g.partenaire_adresse}` : ''}`)
  }
  String(g.conditions ?? '')
    .split('·')
    .map(c => c.trim())
    .filter(c => c.length > 0 && c.toLowerCase() !== String(g.lot_nom ?? '').toLowerCase())
    .forEach(c => out.push(c))
  if (out.length < 3) out.push('Billet nominatif, non remboursable, validable une seule fois')
  return out
}

/* ── Résultat journalier ───────────────────────────────────────────────── */

export interface StationJour {
  event_id: string
  nom: string
  type: 'station' | 'commerce'
  scans: number
  visiteurs: number
  commencees: number
  terminees: number
  joueurs: number
}

export interface JourActivite {
  jour: string
  commencees: number
  terminees: number
  joueurs: number
  hors_periode: boolean
}

/** Jours ou le jeu a tourne, avec reperage des journees hors periode de festival. */
export async function fetchJours(se: string = SE_DEFAUT): Promise<JourActivite[]> {
  const { data, error } = await supabase.rpc('super_event_jours', { p_se: se })
  if (error) { console.error('[fetchJours]', error.message); return [] }
  return Array.isArray(data) ? (data as JourActivite[]) : []
}

/**
 * Stations actives un jour donne. Separe les stations du festival des commerces
 * partenaires : les melanger rendait le compteur par partenaire introuvable.
 */
export async function fetchStations(jour: string | null, se: string = SE_DEFAUT): Promise<StationJour[]> {
  const { data, error } = await supabase.rpc('super_event_stations', { p_se: se, p_date: jour })
  if (error) { console.error('[fetchStations]', error.message); return [] }
  const arr = (data as { par_station?: StationJour[] } | null)?.par_station
  return Array.isArray(arr) ? arr : []
}

/* ── Super events : duplication ────────────────────────────────────────── */

export interface SuperEvent {
  id: string
  nom: string
  status: string | null
  date_d: string | null
  date_f: string | null
  description: string | null
}

export interface ResultatDuplication {
  ok: boolean
  raison?: string
  super_event?: string
  events_source?: number
  events_dupliques?: number
  events_hors_convention?: number
  partenaires_reutilisables?: number
  note?: string
}

export async function fetchSuperEvents(): Promise<SuperEvent[]> {
  const { data, error } = await supabase
    .from('super_events')
    .select('id, nom, status, date_d, date_f, description')
    .order('date_d', { ascending: false })
  if (error) { console.error('[fetchSuperEvents]', error.message); return [] }
  return (data ?? []) as SuperEvent[]
}

/**
 * Duplique la STRUCTURE d un super event : parametres, events, stations.
 * Les donnees d edition (joueurs, tirages, gagnants, stock consomme) ne sont
 * jamais copiees — une nouvelle edition repart a zero.
 */
export async function dupliquerSuperEvent(params: {
  source: string
  nouveauId: string
  nouveauNom: string
  dateD?: string | null
  dateF?: string | null
}): Promise<ResultatDuplication> {
  const { data, error } = await supabase.rpc('dupliquer_super_event', {
    p_source: params.source,
    p_nouveau_id: params.nouveauId,
    p_nouveau_nom: params.nouveauNom,
    p_date_d: params.dateD || null,
    p_date_f: params.dateF || null,
    p_avec_partenaires: true,
  })
  if (error) { console.error('[dupliquerSuperEvent]', error.message); return { ok: false, raison: error.message } }
  return (data ?? { ok: false, raison: 'reponse_vide' }) as ResultatDuplication
}

/** Normalise un nom en identifiant : "Jazz à Nice 2027" -> "se-jazz-a-nice-2027". */
export function slugSuperEvent(nom: string): string {
  const base = nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return base ? `se-${base}` : ''
}
