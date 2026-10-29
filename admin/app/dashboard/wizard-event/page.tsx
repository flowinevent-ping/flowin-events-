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
import ParcoursCreationSA from '@/components/creation/ParcoursCreationSA'
import { CHARTE_PRO as C, POLICE_PRO } from '@/lib/charte'

export default function Page() {
  return (
    <div className="sa-page" style={{ background: C.fond, fontFamily: POLICE_PRO, color: C.texte, padding: '24px 28px 40px', minHeight: '100vh' }}>
      <Suspense fallback={<div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}>
        <ParcoursCreationSA typeInitial={null} />
      </Suspense>
    </div>
  )
}
