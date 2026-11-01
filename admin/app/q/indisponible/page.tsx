import type { Metadata } from 'next'
import AnimationIndisponible from '@/components/parcours/AnimationIndisponible'

/** Page d'un QR permanent qui ne mene nulle part : code inconnu ou QR desactive.
 *  Rendu serveur, sans script, aucun jeu proposé (donc rien n'est écrit). */
export const metadata: Metadata = { title: 'QR code indisponible', robots: { index: false, follow: false } }

export default function Page({ searchParams }: { searchParams: { m?: string } }) {
  return <AnimationIndisponible motif={searchParams.m === 'desactive' ? 'desactive' : 'inexistante'} />
}
