/**
 * MODELES D EVENT REUTILISABLES — lot 7 de la reorganisation.
 *
 * Un modele fige ce qui se reutilise d un event : module, contenu du jeu,
 * lots types, visibilite pro, couleur, score minimum. Il ne contient AUCUNE
 * donnee d edition — ni participants, ni gagnants, ni dates, ni pro client :
 * une nouvelle edition repart toujours a zero, exactement comme le fait la
 * duplication de super event.
 *
 * Creer un event depuis un modele PRE-REMPLIT le wizard, il n ecrit rien tout
 * seul : les controles de coherence restent le seul chemin vers la base.
 *
 * Table : public.event_modeles (policy role public, comme toutes les tables du
 * projet — il n y a pas de session Supabase Auth ici, tout passe par la cle
 * anon ; restreindre a `authenticated` casserait la prod en silence).
 */

import { supabase } from './supabase'
import type { Module } from './types'
import type { BrouillonEvent, BrouillonLot } from './wizard'

export interface ModeleEvent {
  id: string
  nom: string
  description: string | null
  module: Module
  cfg: Record<string, unknown>
  lots: BrouillonLot[]
  pro_visib: Record<string, boolean>
  couleur: string | null
  score_min: number
  origine_event_id: string | null
  created_at: string
}

export async function fetchModeles(): Promise<ModeleEvent[]> {
  const { data, error } = await supabase
    .from('event_modeles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('[fetchModeles]', error.message); return [] }
  return (data ?? []) as ModeleEvent[]
}

function identifiant(): string {
  return `mod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export interface ResultatModele {
  ok: boolean
  id?: string
  erreur?: string
}

/** Enregistre un modele. Les champs d edition sont volontairement ignores. */
export async function enregistrerModele(m: {
  nom: string
  description?: string | null
  module: Module
  cfg?: Record<string, unknown>
  lots?: BrouillonLot[]
  pro_visib?: Record<string, boolean>
  couleur?: string | null
  score_min?: number
  origine_event_id?: string | null
}): Promise<ResultatModele> {
  if (!m.nom?.trim()) return { ok: false, erreur: 'Le modèle doit avoir un nom.' }
  if (!m.module) return { ok: false, erreur: 'Le modèle doit porter un module de jeu.' }

  /* qrUrl est propre a un event : le recopier dans un modele produirait un QR
     pointant vers l event d origine sur chaque event cree ensuite. */
  const cfg = { ...(m.cfg ?? {}) }
  delete (cfg as Record<string, unknown>).qrUrl

  const id = identifiant()
  const { error } = await supabase.from('event_modeles').insert({
    id,
    nom: m.nom.trim(),
    description: m.description?.trim() || null,
    module: m.module,
    cfg,
    lots: (m.lots ?? []).filter(l => l.nom?.trim()),
    pro_visib: m.pro_visib ?? {},
    couleur: m.couleur ?? null,
    score_min: m.score_min ?? 0,
    origine_event_id: m.origine_event_id ?? null,
  })
  if (error) return { ok: false, erreur: `Modèle non enregistré — ${error.message}` }
  return { ok: true, id }
}

export async function supprimerModele(id: string): Promise<boolean> {
  const { error } = await supabase.from('event_modeles').delete().eq('id', id)
  if (error) { console.error('[supprimerModele]', error.message); return false }
  return true
}

/**
 * Applique un modele a un brouillon : ne touche QUE la structure.
 * Le nom, le pro client, les dates et le rattachement deja saisis sont
 * conserves — appliquer un modele ne doit jamais effacer une saisie en cours.
 */
export function appliquerModele(d: BrouillonEvent, m: ModeleEvent): BrouillonEvent {
  return {
    ...d,
    module: m.module,
    cfg: { ...(m.cfg ?? {}) },
    lots: (m.lots ?? []).map(l => ({ ...l })),
    pro_visib: { ...d.pro_visib, ...(m.pro_visib ?? {}) },
    couleur: m.couleur ?? d.couleur,
    score_min: m.score_min ?? d.score_min,
  }
}
