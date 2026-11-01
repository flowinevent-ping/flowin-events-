import { redirect } from 'next/navigation'

/**
 * L'inscription pro passe desormais par le parcours « Ma premiere fois »
 * (/pro/premiere-fois, 31/10) : memes definitions (lib/proCreation), plus le
 * pre-remplissage par SIRET. Les anciens liens /pro/inscription y menent,
 * en gardant le canal d'origine (?src=).
 */
export default function Page({ searchParams }: { searchParams?: { src?: string } }) {
  const src = (searchParams?.src ?? '').toLowerCase()
  redirect(/^[a-z0-9_-]{1,40}$/.test(src) ? `/pro/premiere-fois?src=${src}` : '/pro/premiere-fois')
}
