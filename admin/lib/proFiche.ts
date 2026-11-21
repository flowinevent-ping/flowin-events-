/**
 * Lecture publique des fiches `pros` (sécurité 21/11/2026, sql/2026-11-21-pros-lecture-publique.sql).
 * La table `pros` n'est plus lisible avec la clé publique : les pages sans session (rendu serveur,
 * parcours joueur) passent par des RPC SECURITE DEFINER qui ne rendent aucune coordonnée (jamais e-mail,
 * téléphone, SIRET, adresse). Tant que la RPC n'existe pas en base (ordre de déploiement), on retombe sur
 * l'ancien accès direct. Une RPC présente qui répond « rien » ne déclenche JAMAIS le repli.
 * Les appels sont des GET (fonctions STABLE) : le mode démo n'y voit aucune écriture.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseVivant } from './supabase'
import { rpcAbsente } from './rpcRepli'

export interface FichePro {
  id: string
  nom: string | null
  nom_commercial?: string | null
  ville?: string | null
  secteur?: string | null
  partenaire_id: string | null
  statut?: string | null
  onboarding_source?: string | null
  droits?: Record<string, boolean> | null
}

/** Fiche publique d'un pro : `fiche` null si introuvable ; `repli` true si la RPC n'existe pas encore. */
export async function lireFichePro(proId: string, client: SupabaseClient = supabaseVivant): Promise<{ fiche: FichePro | null; repli: boolean }> {
  if (!proId) return { fiche: null, repli: false }
  try {
    const r = await client.rpc('pro_fiche_publique', { p_pro_id: proId }, { get: true })
    if (r.error) return { fiche: null, repli: rpcAbsente(r.error) }
    return { fiche: (r.data ?? null) as FichePro | null, repli: false }
  } catch { return { fiche: null, repli: false } }
}

/** Identifiant de pro déjà pris ? (RPC pro_id_existe ; repli : lecture directe). */
export async function proIdExiste(client: SupabaseClient, id: string): Promise<boolean> {
  const r = await client.rpc('pro_id_existe', { p_id: id }, { get: true })
  if (!r.error) return r.data === true
  if (!rpcAbsente(r.error)) return false
  const { data } = await client.from('pros').select('id').eq('id', id).maybeSingle()
  return !!data
}

/** Partenaire lié à chacun des pros demandés (RPC pros_partenaires_de ; repli : lecture directe). */
export async function partenairesDesPros(client: SupabaseClient, proIds: string[]): Promise<{ id: string; partenaire_id: string | null }[]> {
  if (!proIds.length) return []
  const r = await client.rpc('pros_partenaires_de', { p_pro_ids: proIds }, { get: true })
  if (!r.error) return (r.data ?? []) as { id: string; partenaire_id: string | null }[]
  if (!rpcAbsente(r.error)) return []
  const { data } = await client.from('pros').select('id,partenaire_id').in('id', proIds)
  return (data ?? []) as { id: string; partenaire_id: string | null }[]
}
