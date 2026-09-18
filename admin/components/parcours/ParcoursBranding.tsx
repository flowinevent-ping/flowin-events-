'use client'

/* Habillage de marque partage par tous les parcours "standalone"
   (Vote/Quiz/QuizSolo/QuizMaster/Spin/Tombola) -- avant ca chaque ecran
   d'accueil dessinait son propre emoji nu, sans halo ni logo Flowin visible
   (Romain, 18/09 : « pas de logo Flowin, pas dans la charte graphique »). */

interface LogoProps { emoji?: string; logoSvg?: string }

export function ParcoursLogo({ emoji, logoSvg }: LogoProps) {
  return (
    <div className="parc-logo-halo">
      {logoSvg
        ? <div dangerouslySetInnerHTML={{ __html: logoSvg }} />
        : <span>{emoji || '⭐'}</span>}
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
