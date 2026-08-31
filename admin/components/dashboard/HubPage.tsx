'use client'

/**
 * HUB — une page a onglets qui REND les pages existantes, sans les copier.
 * Lot 6 de la reorganisation.
 *
 * Le pole General occupait 20 entrees de sidebar pour 6 sujets. Plutot que de
 * deplacer du code (donc de risquer une regression sur des ecrans qui marchent),
 * chaque onglet importe la page concernee et la rend telle quelle : une page de
 * route Next est un composant React comme un autre, et toutes celles-ci sont des
 * composants client sans props.
 *
 * Consequences voulues :
 *  - zero duplication, zero divergence possible entre l onglet et la page ;
 *  - les URLs d origine continuent de fonctionner a l identique (regle
 *    anti-regression : aucune route supprimee) ;
 *  - le chargement est paresseux, onglet par onglet, pour ne pas empiler les
 *    bundles de 4 pages dans un seul ecran.
 *
 * L onglet actif vit dans le hash (#joueurs) : partageable, et sans rendu
 * serveur implique, donc sans <Suspense> a poser autour de la page.
 */

import { useEffect, useState, type ComponentType } from 'react'
import { DrawerTabs } from './DashboardUI'

export interface OngletHub {
  id: string
  label: string
  /** Page existante, chargee paresseusement (next/dynamic). */
  Composant: ComponentType
}

export interface LienHub {
  label: string
  href: string
  /** Outil HTML autonome : navigation dure obligatoire. */
  statique?: boolean
}

interface Props {
  titre: string
  sousTitre?: string
  onglets: OngletHub[]
  /** Outils hors routeur Next, presentes a part plutot que caches en onglet. */
  liens?: LienHub[]
}

export default function HubPage({ titre, sousTitre, onglets, liens = [] }: Props) {
  const [tab, setTab] = useState(onglets[0]?.id ?? '')

  useEffect(() => {
    const h = window.location.hash.replace('#', '')
    if (h && onglets.some(o => o.id === h)) setTab(h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changer = (t: string) => {
    setTab(t)
    window.history.replaceState(null, '', `${window.location.pathname}#${t}`)
  }

  const actif = onglets.find(o => o.id === tab) ?? onglets[0]
  const Contenu = actif?.Composant

  return (
    <div className="sa-hub">
      <div className="sa-hub-h">
        <div>
          <div className="sa-hub-t">{titre}</div>
          {sousTitre && <div className="sa-hub-s">{sousTitre}</div>}
        </div>
        {liens.length > 0 && (
          <div className="sa-hub-liens">
            {liens.map(l => (
              <a
                key={l.href}
                className="sa-btn sm"
                href={l.href}
                {...(l.statique ? {} : {})}
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>

      <DrawerTabs
        tabs={onglets.map(o => ({ id: o.id, label: o.label }))}
        active={actif?.id ?? ''}
        onSelect={changer}
      />

      <div className="sa-hub-body">{Contenu ? <Contenu /> : null}</div>
    </div>
  )
}
