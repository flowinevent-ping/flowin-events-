import { creerBanque, enregistrerBanque, PRO_COMMUN, type Banque, type QuestionBanque } from '../banques'
import { tagsDe, type BanqueModele } from './index'

/**
 * Copie une banque modele dans les banques d un pro (ou de « flowin » cote Super Admin).
 * Action declenchee par une personne, depuis l ecran « Banques de questions » : jamais en
 * automatique. Les identifiants de questions sont conserves ; les modeles a variables restent
 * vides (le commercant les renseigne dans l editeur).
 */
export async function installerModele(proId: string, modele: BanqueModele): Promise<Banque | null> {
  const b = await creerBanque({ proId, nom: modele.nom, tags: tagsDe(modele) })
  if (!b) return null
  const questions = JSON.parse(JSON.stringify(modele.questions)) as QuestionBanque[]
  /* Banque commune (Super Admin) : toujours en brouillon, le Super Admin la valide avant diffusion. */
  const valider = !modele.personnalisable && proId !== PRO_COMMUN
  const ok = await enregistrerBanque(b.id, questions, valider)
  if (!ok) return null
  return { ...b, questions, statut: valider ? 'valide' : 'brouillon' }
}
