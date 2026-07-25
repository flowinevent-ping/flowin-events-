import { supabase } from './supabase'
import { SE_DEFAUT } from './nds'

/* ── Kit de communication partenaire ───────────────────────────────────── */

export interface CommTemplate {
  channel: string
  objet: string | null
  corps: string | null
  hashtags: string | null
  actif: boolean | null
  maj: string | null
}

export interface CommConfig {
  super_event_id: string
  evenement: string | null
  edition: string | null
  lieu: string | null
  descriptif: string | null
  maj: string | null
}

export async function fetchCommTemplates(): Promise<CommTemplate[]> {
  const { data, error } = await supabase.from('comm_templates').select('*').order('channel')
  if (error) { console.error('[fetchCommTemplates]', error.message); return [] }
  return (data as CommTemplate[]) ?? []
}

export async function fetchCommConfig(se: string = SE_DEFAUT): Promise<CommConfig | null> {
  const { data, error } = await supabase.from('comm_config').select('*').eq('super_event_id', se).maybeSingle()
  if (error) { console.error('[fetchCommConfig]', error.message); return null }
  return (data as CommConfig) ?? null
}

/**
 * COORDONNEES DES SUPPORTS PARTENAIRES — figees, ne pas modifier sans instruction.
 * Tout materiel destine a un partenaire ou a un client final porte ces coordonnees.
 * Le nom d une personne physique n apparait JAMAIS sur un visuel partenaire.
 */
export const CONTACT_PARTENAIRE = {
  email: 'flowinevent@gmail.com',
  tel: '06 16 35 49 36',
} as const

/**
 * Resolution des variables d un gabarit.
 *
 * Une variable non fournie est laissee TELLE QUELLE, entre accolades, et remontee dans
 * `manquantes`. Elle n est jamais remplacee par une chaine vide : un texte ou il manque
 * silencieusement le lien ou le lieu part en clientele sans que personne ne le voie.
 */
export function resoudreGabarit(
  texte: string | null,
  valeurs: Record<string, string | null | undefined>
): { rendu: string; manquantes: string[] } {
  if (!texte) return { rendu: '', manquantes: [] }
  const manquantes = new Set<string>()
  const rendu = texte.replace(/\{\{([a-z_]+)\}\}/g, (motif, cle: string) => {
    const v = valeurs[cle]
    if (v == null || v === '') { manquantes.add(cle); return motif }
    return v
  })
  return { rendu, manquantes: Array.from(manquantes).sort() }
}

/** Variables disponibles pour un partenaire donne, a partir de la config du super event. */
export function variablesComm(
  cfg: CommConfig | null,
  partenaire: string | null,
  lien: string | null
): Record<string, string | null> {
  return {
    evenement: cfg?.evenement ?? null,
    edition: cfg?.edition ?? null,
    lieu: cfg?.lieu ?? null,
    descriptif: cfg?.descriptif ?? null,
    partenaire: partenaire ?? null,
    lien: lien ?? null,
    signature: `${CONTACT_PARTENAIRE.email} · ${CONTACT_PARTENAIRE.tel}`,
    clause: 'Jeu sans obligation d\u2019achat. Voir conditions en magasin.',
  }
}
