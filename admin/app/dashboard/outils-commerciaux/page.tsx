import { redirect } from 'next/navigation'

/** L'ecran « Outils commerciaux » est integre a « Landing pages & outils commerciaux » (une seule entree de menu). */
export default function Page() {
  redirect('/dashboard/landing-page')
}
