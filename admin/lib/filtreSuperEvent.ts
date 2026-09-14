'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'

/**
 * FILTRE PAR SUPER EVENT — la brique commune des pages du dashboard.
 *
 * Romain, 14/09 : « si quand j appuie sur pro, je n ai pas les pros ou les
 * partenaires qui correspondent a l evenement, je ne vois pas l interet de voir
 * l ensemble des pros ».
 *
 * Les cinq acces rapides de la carte d un super event (Pros, Partenaires,
 * Joueurs, Lots, Gagnants) ouvraient les pages GLOBALES : depuis la carte des
 * Nuits du Sud, « Pros » affichait les 16 pros du compte, Croix Rouge comprise,
 * qui n a jamais participe au festival. Le super event de la carte n etait
 * transmis nulle part.
 *
 * Chaque page lit desormais `?se=<id>` et se restreint a cette operation.
 * SANS le parametre, elle affiche tout comme avant : l acces direct par la
 * sidebar reste une vue d ensemble.
 *
 * Le rattachement passe par `events` : un pro appartient a une operation s il y
 * tient au moins une station. C est la seule relation fiable -- 7 pros sur 16
 * n ont aucun `partenaire_id` (constat 3 de docs/audit-parcours.html), donc
 * passer par les partenaires en perdrait la moitie.
 */
export function useFiltreSuperEvent() {
  const params = useSearchParams()
  const { events } = useDashboard()
  const seId = params.get('se')

  return useMemo(() => {
    if (!seId) return { seId: null, proIds: null, eventIds: null }

    const evs = events.filter(e => e.super_event_id === seId)
    return {
      seId,
      eventIds: new Set(evs.map(e => e.id)),
      proIds: new Set(evs.map(e => e.pro_id).filter(Boolean) as string[]),
    }
  }, [seId, events])
}
