import { redirect } from 'next/navigation'

/**
 * CREER UN SUPER EVENT — cote Super Admin (verification du 01/11).
 * Cette entree ouvrait un assistant a part, different de l'ecran que voit le pro.
 * Elle ouvre maintenant le PARCOURS UNIQUE (components/creation/ParcoursCreation, via
 * /dashboard/wizard-event), directement sur « Creer un super event » : memes etapes,
 * memes ecrans que dans l'espace pro. L'ancien assistant reste joignable sur
 * /dashboard/wizard-super-event/ancien le temps de la transition.
 */
export default function Page({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const q = new URLSearchParams()
  q.set('type', 'super')
  ;['nom', 'd', 'f', 'module', 'pro'].forEach(k => { if (searchParams[k]) q.set(k, String(searchParams[k])) })
  redirect('/dashboard/wizard-event?' + q.toString())
}
