'use client'

/**
 * PARCOURS — le carrousel d etapes, commun aux creations du dashboard SA.
 *
 * Romain, 02/09 : « peux-tu implementer le parcours de souscription en mode
 * vignette carrousel ergonomique, fidele a la landing page [...] il faut
 * quelque chose de fluide, friendly, ergonomique. En theorie on a deja realise
 * ca sur le parcours pro de souscription. Un pour le super event, l autre pour
 * l event. »
 *
 * Il ne fabrique donc pas un troisieme style : il reprend la mecanique du
 * parcours pro (components/pro/RejoindreWizard) — une etape a la fois, une
 * barre de progression, Precedent / Suivant — mais l expose comme un composant
 * partage au lieu de la recopier dans chaque ecran.
 *
 * DEUX DIFFERENCES ASSUMEES avec le parcours pro :
 *  - la barre d etapes est CLIQUABLE en arriere : revenir sur ce qu on a deja
 *    saisi ne doit pas demander cinq clics de « Precedent ». On ne peut pas
 *    sauter en avant vers une etape non atteinte, sinon on valide a l aveugle.
 *  - une etape peut se declarer incomplete (`bloque`) : le bouton Suivant dit
 *    alors ce qui manque, plutot que de laisser avancer et echouer a la fin.
 */

import { useState } from 'react'

export interface EtapeParcours {
  id: string
  titre: string
  /** Une ligne d explication sous le titre. */
  sous?: string
  icone?: string
  contenu: React.ReactNode
  /** Message si l etape n est pas complete ; `undefined` = on peut avancer. */
  bloque?: string
}

export function Parcours({
  etapes, onTerminer, libelleFin = 'Terminer', occupe = false, message,
}: {
  etapes: EtapeParcours[]
  onTerminer: () => void
  libelleFin?: string
  occupe?: boolean
  message?: React.ReactNode
}) {
  const [i, setI] = useState(0)
  /* Le plus loin qu on ait atteint : on peut revenir librement en arriere, mais
     pas sauter par-dessus une etape qu on n a jamais vue. */
  const [atteint, setAtteint] = useState(0)

  const e = etapes[i]
  const dernier = i === etapes.length - 1
  const bloque = e?.bloque

  const aller = (n: number) => {
    const cible = Math.max(0, Math.min(etapes.length - 1, n))
    setI(cible)
    setAtteint(a => Math.max(a, cible))
  }

  return (
    <div className="sa-parc">
      <ol className="sa-parc-barre">
        {etapes.map((x, n) => {
          const accessible = n <= atteint
          return (
            <li key={x.id}>
              <button
                className={`sa-parc-pas${n === i ? ' actif' : ''}${n < i ? ' fait' : ''}`}
                onClick={() => accessible && aller(n)}
                disabled={!accessible}
                title={accessible ? x.titre : 'Étape pas encore atteinte'}
              >
                <span className="n">{n < i ? '✓' : n + 1}</span>
                <span className="l">{x.titre}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="sa-parc-scene">
        <div key={e?.id} className="sa-parc-vue">
          <div className="sa-parc-tete">
            {e?.icone && <span className="ic">{e.icone}</span>}
            <div>
              <h2>{e?.titre}</h2>
              {e?.sous && <p>{e.sous}</p>}
            </div>
          </div>
          {e?.contenu}
        </div>
      </div>

      {message}

      <div className="sa-parc-pied">
        <button className="sa-btn" onClick={() => aller(i - 1)} disabled={i === 0 || occupe}>
          ← Précédent
        </button>
        <span className="sa-parc-compte">Étape {i + 1} sur {etapes.length}</span>
        {bloque
          ? <span className="sa-parc-bloque">{bloque}</span>
          : dernier
            ? <button className="sa-btn primary" onClick={onTerminer} disabled={occupe}>{occupe ? '…' : libelleFin}</button>
            : <button className="sa-btn primary" onClick={() => aller(i + 1)}>Suivant →</button>}
      </div>
    </div>
  )
}

/**
 * Vignette de choix — la carte cliquable du parcours pro, extraite.
 * Sert a choisir un persona, un module de jeu, un pro a rattacher.
 */
export function VignetteChoix({
  titre, sous, icone, actif, onClick, badges,
}: {
  titre: string
  sous?: string
  icone?: React.ReactNode
  actif: boolean
  onClick: () => void
  badges?: string[]
}) {
  return (
    <button className={`sa-choix${actif ? ' actif' : ''}`} onClick={onClick} aria-pressed={actif}>
      {icone && <span className="ic">{icone}</span>}
      <span className="ti">{titre}</span>
      {sous && <span className="so">{sous}</span>}
      {badges && badges.length > 0 && (
        <span className="bd">{badges.map(b => <span key={b}>{b}</span>)}</span>
      )}
      <span className="cochee" aria-hidden>{actif ? '✓' : ''}</span>
    </button>
  )
}
