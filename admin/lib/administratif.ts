import { supabase } from './supabase'

/* ── Documents legaux (CGV, mentions, confidentialite) ─────────────────── */

export interface DocumentLegal {
  id: string
  type: string | null
  titre: string | null
  version: string | null
  statut: string | null
  contenu: string | null
  created_at: string | null
  updated_at: string | null
}

export async function fetchDocumentsLegaux(): Promise<DocumentLegal[]> {
  const { data, error } = await supabase
    .from('documents_legaux')
    .select('*')
    .order('type', { ascending: true })
    .order('updated_at', { ascending: false })
  if (error) { console.error('[fetchDocumentsLegaux]', error.message); return [] }
  return (data as DocumentLegal[]) ?? []
}

/**
 * Un document n est opposable que si son statut vaut 'valide'.
 * Tant qu il est en brouillon il ne doit PAS etre presente comme en vigueur.
 */
export async function majDocumentLegal(
  id: string,
  champs: Partial<Pick<DocumentLegal, 'titre' | 'version' | 'statut' | 'contenu'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('documents_legaux')
    .update({ ...champs, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('[majDocumentLegal]', error.message); return false }
  return true
}

/* ── Landing pages ─────────────────────────────────────────────────────── */

export interface Landing {
  id: string
  nom: string | null
  statut: string | null
  published: boolean | null
  deploy_url: string | null
  accent_color: string | null
  module_jeu: string | null
  wa_number: string | null
  created_at: string | null
  updated_at: string | null
}

export async function fetchLandings(): Promise<Landing[]> {
  const { data, error } = await supabase
    .from('landings')
    .select('id,nom,statut,published,deploy_url,accent_color,module_jeu,wa_number,created_at,updated_at')
    .order('updated_at', { ascending: false })
  if (error) { console.error('[fetchLandings]', error.message); return [] }
  return (data as Landing[]) ?? []
}

/* ── Retours CRM ───────────────────────────────────────────────────────── */

export interface RetourCrm {
  id: number
  created_at: string | null
  updated_at: string | null
  enseigne: string | null
  contact_nom: string | null
  contact_tel: string | null
  contact_email: string | null
  ville: string | null
  cp: string | null
  origine: string | null
  produit: string | null
  offre: string | null
  etat: string | null
  date_relance: string | null
  paiement_recu: boolean | null
  logo_envoye: boolean | null
  facture_emise: boolean | null
  note: string | null
  montant: number | null
}

export async function fetchRetoursCrm(): Promise<RetourCrm[]> {
  const { data, error } = await supabase
    .from('crm_retours')
    .select('*')
    .order('updated_at', { ascending: false, nullsFirst: false })
  if (error) { console.error('[fetchRetoursCrm]', error.message); return [] }
  return (data as RetourCrm[]) ?? []
}

/**
 * Avancement d un dossier : les trois jalons sont INDEPENDANTS.
 * Ne jamais deduire l un de l autre — un paiement recu n implique pas la facture emise.
 */
export async function majRetourCrm(
  id: number,
  champs: Partial<Pick<RetourCrm, 'etat' | 'note' | 'date_relance' | 'montant' | 'logo_envoye' | 'facture_emise' | 'paiement_recu'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('crm_retours')
    .update({ ...champs, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('[majRetourCrm]', error.message); return false }
  return true
}

export function jalonsRetour(r: RetourCrm): { libelle: string; fait: boolean }[] {
  return [
    { libelle: 'Logo reçu', fait: r.logo_envoye === true },
    { libelle: 'Facture émise', fait: r.facture_emise === true },
    { libelle: 'Paiement reçu', fait: r.paiement_recu === true },
  ]
}
