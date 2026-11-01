import { redirect } from 'next/navigation'

/**
 * Une seule page Super Admin pour les commandes Animation : /admin-commandes-animation.html
 * (connexion /admin-connexion.html, « Marquer le virement recu », indicateur « en attente depuis
 * plus de X jours », journal, CSV). Cette adresse y renvoie, pour ne pas dupliquer l'ecran.
 */
export default function Page() {
  redirect('/admin-commandes-animation.html')
}
