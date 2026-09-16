/**
 * CRM COMPLET DU PRO (16/09 nuit) — RPC crm_pro (sql/crm_pro.sql) :
 * une ligne par joueur, toutes operations confondues (events, super events),
 * avec origines, operations jouees, parties, gains et lots.
 */
import { supabase } from './supabase'
import { libelleSource } from './nds'

export interface OperationContact { cle: string; nom: string; parties: number; derniere: string | null }
export interface ContactPro {
  joueur_id: string
  prenom: string | null; nom: string | null; email: string | null; tel: string | null
  code_postal: string | null; ville: string | null; genre: string | null; tranche_age: string | null
  optin: boolean | null; source: string | null
  origines: string[]; operations: OperationContact[]
  nb_parties: number; nb_tickets: number; nb_gains: number; lots: string[]
  premiere: string | null; derniere: string | null
}

export async function fetchCrmPro(proId: string): Promise<ContactPro[]> {
  if (!proId) return []
  const { data, error } = await supabase.rpc('crm_pro', { p_pro: proId })
  if (error) { console.error('[fetchCrmPro]', error.message); return [] }
  return ((data ?? []) as ContactPro[]).map(c => ({
    ...c,
    origines: c.origines ?? [], operations: c.operations ?? [], lots: c.lots ?? [],
    nb_parties: Number(c.nb_parties ?? 0), nb_tickets: Number(c.nb_tickets ?? 0), nb_gains: Number(c.nb_gains ?? 0),
  }))
}

/** Libelle lisible d une origine : celui du trafic (lib/nds libelleSource). */
export function libelleOrigine(o: string): string {
  if (o === 'nds2026') return 'Nuits du Sud 2026'
  if (o === 'brigade-manuel') return 'Brigade (saisie sur place)'
  return libelleSource(o)
}
