import { supabase } from './supabase'

/**
 * CRM des landings — DEUX origines distinctes, fusionnees pour l affichage seulement.
 *
 *   1. v_crm_landing_pages : pipeline commercial B2B (landings Flowin et partenaires)
 *   2. joueurs source = 'brigade-manuel' : saisies terrain de la Brigade Verte
 *
 * Ces deux flux N ONT PAS LA MEME NATURE. Le premier est un pipeline de vente avec des
 * etats et des montants ; le second est une collecte de contacts sans dimension
 * commerciale. Ils sont affiches ensemble mais restent identifiables par `source_label`,
 * et leurs compteurs ne doivent JAMAIS etre additionnes en un total unique presente
 * comme un volume d affaires.
 */

export interface LigneCrmLanding {
  id: string
  source_label: string
  created_at: string | null
  enseigne: string | null
  contact_nom: string | null
  contact_tel: string | null
  contact_email: string | null
  ville: string | null
  cp: string | null
  etat: string | null
  offre: string | null
  montant: number | null
  /* propres a la Brigade Verte — nuls sur le pipeline B2B */
  bv_prenom: string | null
  bv_nom: string | null
  bv_genre: string | null
  bv_age: string | null
  bv_tickets: number | null
  commercial: boolean
}

interface VueCrm {
  id: number; created_at: string | null; enseigne: string | null
  contact_nom: string | null; contact_tel: string | null; contact_email: string | null
  ville: string | null; cp: string | null; etat: string | null
  offre: string | null; montant: number | null; source_label: string | null
}

interface JoueurBv {
  id: string; prenom: string | null; nom: string | null; tel: string | null
  email: string | null; genre: string | null; age_tranche: string | null
  code_postal: string | null; ville: string | null
  first_seen: string | null; updated_at: string | null
}

export async function fetchCrmLanding(): Promise<LigneCrmLanding[]> {
  const [pipeline, brigade] = await Promise.all([
    supabase.from('v_crm_landing_pages').select('*').order('created_at', { ascending: false }),
    supabase
      .from('joueurs')
      .select('id,prenom,nom,tel,email,genre,age_tranche,code_postal,ville,first_seen,updated_at')
      .eq('source', 'brigade-manuel')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(5000),
  ])

  if (pipeline.error) console.error('[fetchCrmLanding pipeline]', pipeline.error.message)
  if (brigade.error) console.error('[fetchCrmLanding brigade]', brigade.error.message)

  const lignesB2B: LigneCrmLanding[] = ((pipeline.data as VueCrm[]) ?? []).map(r => ({
    id: `crm-${r.id}`,
    source_label: r.source_label ?? 'Landing',
    created_at: r.created_at,
    enseigne: r.enseigne,
    contact_nom: r.contact_nom,
    contact_tel: r.contact_tel,
    contact_email: r.contact_email,
    ville: r.ville,
    cp: r.cp,
    etat: r.etat,
    offre: r.offre,
    montant: r.montant,
    bv_prenom: null, bv_nom: null, bv_genre: null, bv_age: null, bv_tickets: null,
    commercial: true,
  }))

  const lignesBv: LigneCrmLanding[] = ((brigade.data as JoueurBv[]) ?? []).map(j => {
    const nomComplet = [j.prenom, j.nom].filter(Boolean).join(' ')
    return {
      id: `bv-${j.id}`,
      source_label: 'Landing Brigade Verte',
      created_at: j.updated_at ?? j.first_seen,
      enseigne: nomComplet || null,
      contact_nom: nomComplet || null,
      contact_tel: j.tel,
      contact_email: j.email,
      ville: j.ville,
      cp: j.code_postal,
      /* pas d etat commercial : ce flux n est pas un pipeline de vente */
      etat: null,
      offre: null,
      montant: null,
      bv_prenom: j.prenom, bv_nom: j.nom, bv_genre: j.genre, bv_age: j.age_tranche,
      bv_tickets: null,
      commercial: false,
    }
  })

  return [...lignesBv, ...lignesB2B].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )
}

export const COULEUR_ETAT: Record<string, string> = {
  nouveau: '#6366f1',
  en_discussion: '#0ea5e9',
  devis_envoye: '#f59e0b',
  a_valider: '#f97316',
  paiement: '#8b5cf6',
  gagne: '#10b981',
  perdu: '#ef4444',
}
