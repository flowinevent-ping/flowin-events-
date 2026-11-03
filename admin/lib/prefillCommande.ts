/**
 * PRE-REMPLISSAGE DU BON DE COMMANDE depuis le compte pro (01/11/2026).
 *
 * « Ma premiere fois » depose deja `flowin_am_prefill` dans le stockage local de l'appareil ; un pro qui
 * revient plus tard (autre appareil, navigation privee, stockage vide) retombait sur un bon vierge, alors
 * que sa fiche entreprise est deja en base. Avant d'ouvrir le bon, on relit sa fiche et on recree ce
 * stockage. On ne remplace jamais un pre-remplissage deja present pour CE compte ; rien n'est invente :
 * un champ vide en base reste vide, et tout reste modifiable sur le bon.
 */
import { supabase } from './supabase'

const CLE = 'flowin_am_prefill'

interface FichePrefill {
  nom?: string | null; nom_commercial?: string | null; siret?: string | null; adresse?: string | null
  code_postal?: string | null; ville?: string | null; contact?: string | null; role_contact?: string | null
  email?: string | null; tel?: string | null; nb_points_vente?: number | null
}

export async function preparerBonDeCommande(proId: string): Promise<void> {
  if (!proId) return
  try {
    const actuel = window.localStorage.getItem(CLE)
    if (actuel) { try { if ((JSON.parse(actuel) as { pro_id?: string }).pro_id === proId) return } catch { /* ecrase un contenu illisible */ } }
    const { data } = await supabase.from('pros').select('*').eq('id', proId).maybeSingle()
    const p = data as FichePrefill | null
    if (!p) return
    window.localStorage.setItem(CLE, JSON.stringify({
      raison: p.nom ?? '', enseigne: p.nom_commercial ?? '', siret: p.siret ?? '', adresse: p.adresse ?? '', cp: p.code_postal ?? '', ville: p.ville ?? '',
      contact: p.contact ?? '', fonction: p.role_contact ?? '', email: p.email ?? '', tel: p.tel ?? '',
      nb: Number(p.nb_points_vente) > 0 ? Number(p.nb_points_vente) : 1, commercial: '', pro_id: proId,
    }))
  } catch { /* stockage indisponible : le bon se remplit a la main */ }
}
