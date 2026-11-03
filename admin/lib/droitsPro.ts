/**
 * Droits d'acces du pro, pilotes par le Super Admin (sql/06-droits-pro.sql).
 *
 * Une seule source pour l'interface : les 5 droits, leurs valeurs par defaut et
 * la lecture « tolerante ». MODE DEGRADE : tant que la colonne pros.droits
 * n'existe pas (SQL 06 non applique), `droitsEffectifs` renvoie les valeurs par
 * defaut, c'est-a-dire le comportement d'avant : creer une animation, rejoindre
 * un super event, creer des banques et gerer ses partenaires restent permis ; la
 * creation DIRECTE d'un super event reste fermee (le pro « propose » a Flowin,
 * comme aujourd'hui). Rien ne casse.
 *
 * Le verrou reel est en base (triggers de 06) ; ceci ne fait que masquer et expliquer.
 */
import { supabaseVivant } from './supabase'

export type CleDroit = 'creer_animation' | 'creer_super_event' | 'rejoindre_super_event' | 'creer_banques' | 'gerer_partenaires'
export type DroitsPro = Record<CleDroit, boolean>

export const DROITS_DEFAUT: DroitsPro = {
  creer_animation: true,
  creer_super_event: false,
  rejoindre_super_event: true,
  creer_banques: true,
  gerer_partenaires: true,
}

export const DROITS_LISTE: { cle: CleDroit; titre: string; aide: string; verrouBase: boolean }[] = [
  { cle: 'creer_animation', titre: 'Peut créer une animation', aide: 'Le bouton « Créer une animation » et le parcours de création.', verrouBase: true },
  { cle: 'creer_super_event', titre: 'Peut créer un super event', aide: 'Désactivé : le pro peut seulement « proposer » un super event à Flowin. Activé : il le crée lui-même.', verrouBase: true },
  { cle: 'rejoindre_super_event', titre: 'Peut rejoindre / intégrer un super event', aide: 'Demander à devenir une station d’un super event existant.', verrouBase: true },
  { cle: 'creer_banques', titre: 'Peut créer des banques de quiz', aide: 'Créer et alimenter ses banques de questions (quiz et bonus).', verrouBase: true },
  { cle: 'gerer_partenaires', titre: 'Peut gérer ses partenaires et logos', aide: 'Sa fiche partenaire, son logo, ses liens. Masqué dans l’interface seulement (pas de verrou en base).', verrouBase: false },
]

export const MESSAGE_DROIT_REFUSE = 'Cette option n’est pas activée sur votre compte — contactez Flowin.'

export function droitsEffectifs(brut: unknown): DroitsPro {
  const out: DroitsPro = { ...DROITS_DEFAUT }
  if (brut && typeof brut === 'object') {
    const o = brut as Record<string, unknown>
    ;(Object.keys(DROITS_DEFAUT) as CleDroit[]).forEach(k => { if (typeof o[k] === 'boolean') out[k] = o[k] as boolean })
  }
  return out
}

/** La colonne existe-t-elle sur cette ligne de pro ? (select * ne la renvoie pas tant que le SQL 06 manque.) */
export function colonneDroitsPresente(pro: unknown): boolean {
  return !!pro && typeof pro === 'object' && 'droits' in (pro as object)
}

/** Lecture des droits d'un pro (serveur ou navigateur). Colonne absente / erreur : valeurs par defaut. */
export async function lireDroitsPro(proId: string): Promise<DroitsPro> {
  if (!proId) return { ...DROITS_DEFAUT }
  try {
    const { data, error } = await supabaseVivant.from('pros').select('droits').eq('id', proId).maybeSingle()
    if (error || !data) return { ...DROITS_DEFAUT }
    return droitsEffectifs((data as { droits?: unknown }).droits)
  } catch { return { ...DROITS_DEFAUT } }
}

/** L'espace « Nouvelle animation » a-t-il au moins une porte ouverte ? */
export function peutOuvrirNouvelle(d: DroitsPro): boolean {
  return d.creer_animation || d.rejoindre_super_event || d.creer_super_event
}

/** Une erreur renvoyee par la base vient-elle d'un droit retire ? */
export function estRefusDroit(err: { code?: string; message?: string; hint?: string } | null | undefined): boolean {
  if (!err) return false
  return err.code === '42501' || err.hint === 'droit_pro' || /pas activée sur votre compte/i.test(err.message || '')
}
