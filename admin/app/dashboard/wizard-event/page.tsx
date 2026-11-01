'use client'

/**
 * NOUVELLE ANIMATION — cote Super Admin.
 *
 * Romain, 29/10 : le SA cree une animation pour onboarder un pro ; il doit voir
 * la meme interface que le pro. Cette page rend donc le parcours unique
 * (components/creation/ParcoursCreation) en mode SA, precede du choix du pro.
 * Pre-saisie par l URL conservee : ?pro= ?se= ?nom= ?d= ?f= ?module=
 */
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ParcoursCreationSA from '@/components/creation/ParcoursCreationSA'
import { CHARTE_PRO as C, POLICE_PRO } from '@/lib/charte'

function Contenu() {
  /* ?type=super : ouvre directement « Creer un super event » (entree du menu Super events). */
  const type = useSearchParams().get('type')
  return <ParcoursCreationSA typeInitial={type === 'super' ? 'super' : null} />
}

export default function Page() {
  return (
    <div className="sa-page" style={{ background: C.fond, fontFamily: POLICE_PRO, color: C.texte, padding: '24px 28px 40px', minHeight: '100vh' }}>
      <Suspense fallback={<div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}>
        <Contenu />
      </Suspense>
    </div>
  )
}
