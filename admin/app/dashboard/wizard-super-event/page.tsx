'use client'

/**
 * CREER UN SUPER EVENT — cote Super Admin.
 *
 * Romain, 29/10 : « tout est trop complexe — simplifier, fluidifier, vignettes ».
 * Meme parcours que l espace pro (components/creation/ParcoursCreation) :
 * super event -> jeu -> lots du grand tirage -> pros participants (CRM pro)
 * -> diffusion & recap. Seul le SA cree un super event ; le pro, lui, en
 * propose la creation a Flowin depuis son espace.
 *
 * La suppression d un super event cree par erreur vit sur sa fiche
 * (/dashboard/operations/<id>), pas ici.
 */
import { Suspense } from 'react'
import ParcoursCreationSA from '@/components/creation/ParcoursCreationSA'
import { CHARTE_PRO as C, POLICE_PRO } from '@/lib/charte'

export default function Page() {
  return (
    <div className="sa-page" style={{ background: C.fond, fontFamily: POLICE_PRO, color: C.texte }}>
      <Suspense fallback={<div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}>
        <ParcoursCreationSA typeInitial="super" />
      </Suspense>
    </div>
  )
}
