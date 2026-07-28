import { fetchProDashboard } from '@/lib/pro'
import { fetchBanquesPro } from '@/lib/banques'
import ProShell from '@/components/pro/ProShell'
import CreerAnimationWizard from '@/components/pro/CreerAnimationWizard'

/**
 * Ex-catalogue statique ("l'editeur complet arrive au meme design") remplace par le vrai
 * parcours de creation d'animation, demande initialement des le debut de la session et jamais
 * construit avant ce tour. Style bandeau degrade + cartes, sur le modele de /pro/super valide
 * par Romain comme reference esthetique.
 */
export default async function ProJeuPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, banques] = await Promise.all([fetchProDashboard(proId), fetchBanquesPro(proId)])
  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="jeu">
      <CreerAnimationWizard proId={proId} banqueQuizExistante={banques} />
    </ProShell>
  )
}
