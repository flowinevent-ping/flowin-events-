/** Demandes de rappel déposées depuis les plaquettes (table demandes_rappel, sql/14). */
import { supabase } from '@/lib/supabase'

export interface DemandeRappel {
  id: string; created_at: string; statut: 'nouvelle' | 'traitee'
  prenom: string; nom: string; entreprise: string; ville: string; tel: string; email: string
  creneau: string | null; message: string | null; origine: string | null; commercial: string | null
  pro_id: string | null; traitee_at: string | null; traitee_par: string | null; note_interne: string | null
}

const COLS = 'id,created_at,statut,prenom,nom,entreprise,ville,tel,email,creneau,message,origine,commercial,pro_id,traitee_at,traitee_par,note_interne'

export async function fetchDemandesRappel(proId?: string): Promise<DemandeRappel[]> {
  let q = supabase.from('demandes_rappel').select(COLS).order('created_at', { ascending: false })
  if (proId) q = q.eq('pro_id', proId)
  const { data } = await q
  return (data ?? []) as DemandeRappel[]
}

export async function marquerRappel(id: string, traitee: boolean): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('demandes_rappel')
    .update(traitee ? { statut: 'traitee', traitee_at: new Date().toISOString(), traitee_par: u.user?.email ?? null } : { statut: 'nouvelle', traitee_at: null, traitee_par: null })
    .eq('id', id).select('id')
  return !error && !!data?.length
}

export function origineLisible(o: string | null): string {
  if (o === 'plaquette-super-event') return 'Plaquette Super event'
  if (o === 'plaquette-animation-magasin') return 'Plaquette Animation magasin'
  return o || 'Origine inconnue'
}
