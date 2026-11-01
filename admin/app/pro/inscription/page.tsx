import { redirect } from 'next/navigation'

/**
 * L'inscription pro passe desormais par le parcours « Ma premiere fois »
 * (/pro/premiere-fois, 31/10) : memes definitions (lib/proCreation), plus le
 * pre-remplissage par SIRET. Les anciens liens /pro/inscription y menent.
 */
export default function Page() {
  redirect('/pro/premiere-fois')
}
