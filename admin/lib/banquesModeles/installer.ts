import { creerBanque, enregistrerBanque, type Banque, type QuestionBanque } from '../banques'
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
  const ok = await enregistrerBanque(b.id, questions, !modele.personnalisable)
  if (!ok) return null
  return { ...b, questions, statut: modele.personnalisable ? 'brouillon' : 'valide' }
}
