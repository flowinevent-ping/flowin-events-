'use client'

/* Habillage de marque partage par tous les parcours "standalone"
   (Vote/Quiz/QuizSolo/QuizMaster/Spin/Tombola) -- avant ca chaque ecran
   d'accueil dessinait son propre emoji nu, sans halo ni logo Flowin visible
   (Romain, 18/09 : « pas de logo Flowin, pas dans la charte graphique »). */

interface LogoProps { emoji?: string; logoSvg?: string; logoUrl?: string }

export function ParcoursLogo({ emoji, logoSvg, logoUrl }: LogoProps) {
  /* Une station/un event sans logo configuré laisse le halo vide, plutot
     que d'afficher un emoji ou une marque de substitution (meme regle que
     NDS2026Client.tsx : on ne substitue jamais le logo de quelqu'un
     d'autre). */
  return (
    <div className="parc-logo-halo">
      {logoSvg
        ? <div dangerouslySetInnerHTML={{ __html: logoSvg }} />
        : logoUrl
        ? <img src={logoUrl} alt="" />
        : emoji ? <span>{emoji}</span> : null}
    </div>
  )
}

export function FlowinBadge() {
  return (
    <div className="parc-flowin-badge">
      <img src="/nds/assets/flowin_blanc.png" alt="Flowin" />
      <span>Propulsé par Flowin</span>
    </div>
  )
}
