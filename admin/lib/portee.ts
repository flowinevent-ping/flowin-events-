'use client'

/**
 * PORTEE — comment un module sait de quelle operation on lui parle.
 *
 * Romain, 02/09 : « pourquoi on ne peut pas avoir la copie de ce module a
 * chaque creation d event ou super event ? [...] il faut pouvoir avoir un
 * rangement pas par pages ».
 *
 * REPONSE, et c est le principe de tout ce fichier : ON NE COPIE PAS LE MODULE.
 * Vingt operations, ce serait vingt copies du tirage ; un bug de tirage se
 * corrigerait vingt fois, un lot ajoute se saisirait vingt fois, et vingt jeux
 * de gagnants cesseraient de se parler. C est exactement ce que le monolithe a
 * deja coute.
 *
 * Un seul module, qui RECOIT sa portee. Le systeme fait deja ca par endroits —
 * `station_tracking(p_se, p_pro, p_partenaire, p_jour)` est UN calcul qui sert
 * les trois niveaux, et tirage-nds.html accepte deja `?se=`.
 *
 * Ce qui manquait n est donc pas la copie : c est que les FICHES ne passaient
 * pas leur portee aux modules qu elles ouvrent. On ouvrait la fiche « Jazz a
 * Nice 2027 », on cliquait « Tirage au sort », et on tombait sur les tirages de
 * Nuits du Sud.
 *
 * Trois niveaux, LES MEMES MODULES :
 *   - le menu de gauche  -> acces general, toutes operations ;
 *   - la fiche super event -> les memes, cadres sur elle ;
 *   - la fiche pro / event -> les memes, cadres sur eux.
 */

import { useEffect, useState } from 'react'

export interface Portee {
  se?: string | null
  pro?: string | null
  event?: string | null
}

/**
 * Ajoute la portee a une URL de module. Les valeurs vides sont ignorees : un
 * lien sans portee reste le lien general, ce qui est le comportement voulu
 * depuis le menu de gauche.
 */
export function lienPortee(base: string, p: Portee = {}): string {
  const q = new URLSearchParams()
  if (p.se) q.set('se', p.se)
  if (p.pro) q.set('pro', p.pro)
  if (p.event) q.set('event', p.event)
  const s = q.toString()
  if (!s) return base
  return base.includes('?') ? `${base}&${s}` : `${base}?${s}`
}

/**
 * Lit la portee de l URL, UNE SEULE FOIS au montage.
 *
 * Volontairement via `window.location.search` et non `useSearchParams` : ce
 * dernier impose une frontiere Suspense sous peine de faire basculer la page en
 * rendu dynamique. Ces ecrans sont prerendus en statique et doivent le rester ;
 * et une lecture unique au montage suffit, puisque l utilisateur pilote ensuite
 * la portee avec les boutons de l ecran.
 */
export function usePorteeInitiale(): Portee {
  const [p, setP] = useState<Portee>({})
  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search)
    setP({ se: q.get('se'), pro: q.get('pro'), event: q.get('event') })
  }, [])
  return p
}
