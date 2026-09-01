import { supabase } from './supabase'
import type { FlowinEvent, FlowinLot, Module, ClientType } from './types'

/**
 * Creation et edition d un evenement.
 *
 * CHEMIN D ECRITURE EN PRODUCTION. Deux regles non negociables :
 *
 *  1. L ORDRE des ecritures est significatif. L event est ecrit AVANT ses lots et AVANT
 *     le rattachement au super event. Si l event echoue, rien d autre n est tente :
 *     des lots orphelins pointant vers un event inexistant sont plus penibles a nettoyer
 *     qu une creation ratee a refaire.
 *
 *  2. `qrUrl` est calcule a partir de l identifiant DEFINITIF, apres attribution, jamais
 *     avant. Un QR genere sur un identifiant provisoire pointe dans le vide — et comme il
 *     part a l impression, l erreur ne se voit qu une fois les affiches posees.
 *
 * Ce module ne modifie JAMAIS le parcours joueur. La configuration passe par `cfg`.
 */

export interface BrouillonLot {
  nom: string
  partenaire_id?: string | null
  valeur?: number
  quantite?: number
  emoji?: string | null
  description?: string | null
}

export interface BrouillonEvent {
  id?: string
  nom: string
  pro_id: string
  module: Module | ''
  date_d: string | null
  date_f: string | null
  h_start: string | null
  h_end: string | null
  lieu: string
  adresse: string
  description: string
  couleur: string
  score_min: number
  client_type: ClientType
  cfg: Record<string, unknown>
  pro_visib: Record<string, boolean>
  super_event_id: string | null
  lots: BrouillonLot[]
}

export const VISIBILITE_PAR_DEFAUT: Record<string, boolean> = {
  stats: true, participants: true, lots: true, qr: true, export: true, activite: true,
}

export function brouillonVide(superEventId: string | null = null): BrouillonEvent {
  return {
    nom: '', pro_id: '', module: '',
    date_d: null, date_f: null, h_start: null, h_end: null,
    lieu: '', adresse: '', description: '', couleur: '#5B79E0',
    score_min: 0, client_type: 'btoc',
    cfg: {}, pro_visib: { ...VISIBILITE_PAR_DEFAUT },
    super_event_id: superEventId,
    lots: [],
  }
}

/** Nombre de jours couverts, bornes incluses. Renvoie 1 si une seule date. */
export function nbJours(d: BrouillonEvent): number {
  if (!d.date_d || !d.date_f || d.date_f === d.date_d) return 1
  const ms = new Date(d.date_f).getTime() - new Date(d.date_d).getTime()
  return Math.max(1, Math.round(ms / 86400000) + 1)
}

export interface Probleme { etape: string; message: string }

/**
 * Controle de coherence. Renvoie la liste des problemes, vide si tout va bien.
 * Le formulaire ne s enregistre pas tant qu il reste un probleme : mieux vaut refuser
 * l ecriture que creer un event a moitie defini qu il faudra corriger a la main.
 */
export function controler(d: BrouillonEvent): Probleme[] {
  const p: Probleme[] = []
  if (!d.nom.trim()) p.push({ etape: 'A', message: "Le nom de l'événement est obligatoire." })
  if (!d.pro_id) p.push({ etape: 'A', message: 'Un pro client doit être sélectionné.' })
  if (!d.date_d) p.push({ etape: 'A', message: 'La date de début est obligatoire.' })
  if (d.date_d && d.date_f && d.date_f < d.date_d) {
    p.push({ etape: 'A', message: 'La date de fin précède la date de début.' })
  }
  if (!d.module) p.push({ etape: 'B', message: 'Un module de jeu doit être choisi.' })
  d.lots.forEach((l, i) => {
    if (!l.nom?.trim()) p.push({ etape: 'E', message: `Le lot n°${i + 1} n'a pas de nom.` })
    if ((l.quantite ?? 1) < 1) p.push({ etape: 'E', message: `Le lot « ${l.nom || i + 1} » a une quantité nulle.` })
  })
  return p
}

/** Statut deduit des dates, jamais saisi : une saisie diverge des dates des le lendemain. */
export function statutDeduit(d: BrouillonEvent): 'upcoming' | 'live' | 'past' {
  const jour = new Date().toISOString().slice(0, 10)
  const debut = d.date_d ?? jour
  const fin = d.date_f ?? debut
  if (jour < debut) return 'upcoming'
  if (jour > fin) return 'past'
  return 'live'
}

function identifiant(prefixe: string): string {
  const a = Date.now().toString(36)
  const b = Math.random().toString(36).slice(2, 7)
  return `${prefixe}-${a}${b}`
}

export function urlQr(module: Module | '', evId: string): string {
  return `https://flowin-events.vercel.app/parcours/${module || 'quiz'}?ev=${evId}`
}

export interface ResultatEcriture {
  ok: boolean
  eventId?: string
  erreur?: string
  /* Ce qui a ete ecrit malgre une erreur ulterieure : sert au message, pas au silence. */
  partiel?: string[]
}

/**
 * Enregistre le brouillon. Cree si `mode` vaut 'create', met a jour sinon.
 * L ordre est : event, puis lots, puis rattachement au super event.
 */
export async function enregistrer(
  d: BrouillonEvent,
  mode: 'create' | 'edit'
): Promise<ResultatEcriture> {
  const problemes = controler(d)
  if (problemes.length) return { ok: false, erreur: problemes[0].message }

  const evId = mode === 'edit' && d.id ? d.id : identifiant('ev')
  const fait: string[] = []

  /* qrUrl calcule sur l identifiant definitif, jamais avant. */
  const cfg = { ...d.cfg, qrUrl: urlQr(d.module, evId) }

  const ligne: Partial<FlowinEvent> = {
    id: evId,
    pro_id: d.pro_id,
    nom: d.nom.trim(),
    module: d.module as Module,
    status: statutDeduit(d),
    date_d: d.date_d,
    date_f: d.date_f ?? d.date_d,
    h_start: d.h_start,
    h_end: d.h_end,
    lieu: d.lieu,
    adresse: d.adresse,
    description: d.description,
    couleur: d.couleur,
    score_min: d.score_min,
    client_type: d.client_type,
    cfg: cfg as FlowinEvent['cfg'],
    pro_visib: d.pro_visib,
    super_event_id: d.super_event_id,
  }

  if (mode === 'create') {
    Object.assign(ligne, { participants: 0, gagnants: 0, joueurs_optin: 0 })
  }

  const { error: errEvent } = await supabase.from('events').upsert(ligne, { onConflict: 'id' })
  if (errEvent) return { ok: false, erreur: `Événement non enregistré — ${errEvent.message}` }
  fait.push('événement')

  /* Lots : uniquement a la creation. En edition ils se gerent depuis la fiche event,
     pour ne pas ecraser silencieusement des lots deja distribues. */
  if (mode === 'create' && d.lots.length) {
    const lignes: Partial<FlowinLot>[] = d.lots
      .filter(l => l.nom?.trim())
      .map(l => ({
        id: identifiant('lot'),
        event_id: evId,
        partenaire_id: l.partenaire_id || null,
        nom: l.nom.trim(),
        titre: l.nom.trim(),
        valeur: l.valeur ?? 0,
        quantite: l.quantite ?? 1,
        retire: false,
        emoji: l.emoji ?? null,
        description: l.description ?? null,
      }))
    if (lignes.length) {
      const { error } = await supabase.from('lots').insert(lignes)
      if (error) {
        return { ok: false, eventId: evId, partiel: fait, erreur: `Événement créé, mais lots non enregistrés — ${error.message}` }
      }
      fait.push(`${lignes.length} lot${lignes.length > 1 ? 's' : ''}`)
    }
  }

  /* Rattachement au super event : la liste `events` du super doit contenir l identifiant.
     Lecture avant ecriture pour ne pas ecraser les autres events deja rattaches. */
  if (d.super_event_id) {
    const { data, error } = await supabase
      .from('super_events').select('events').eq('id', d.super_event_id).maybeSingle()
    if (!error && data) {
      const actuels: string[] = (data as { events: string[] | null }).events ?? []
      if (!actuels.includes(evId)) {
        const { error: errMaj } = await supabase
          .from('super_events').update({ events: [...actuels, evId] }).eq('id', d.super_event_id)
        if (errMaj) {
          return { ok: false, eventId: evId, partiel: fait, erreur: `Rattachement au super event échoué — ${errMaj.message}` }
        }
        fait.push('rattachement au super event')
      }
    }
  }

  return { ok: true, eventId: evId, partiel: fait }
}
