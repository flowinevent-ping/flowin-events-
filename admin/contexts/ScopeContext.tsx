'use client'

/**
 * CONTEXTE GLOBAL DE PORTEE (super event + event) — lot 1 de la reorganisation.
 *
 * Probleme resolu : avant, 5 pages sur 19 avaient chacune leur propre selecteur
 * de super event, dans un useState local, avec une UI differente (boutons vs
 * select), un defaut different, aucune persistance d une page a l autre et
 * aucun deep-link possible (useSearchParams : 0 occurrence dans tout admin/app).
 *
 * Ici : une seule source de verite, lue par toutes les pages scopables.
 * - Lecture initiale depuis l URL (?se=...&ev=...) => les liens sont partageables.
 * - Repli sur localStorage => la selection survit d un ecran a l autre.
 * - Ecriture dans l URL via history.replaceState, PAS via le router Next :
 *   on ne veut ni re-render de l arbre, ni entree d historique a chaque clic.
 *   C est aussi ce qui evite d avoir a envelopper le layout dans un <Suspense>
 *   (useSearchParams force le rendu dynamique et casse le build sinon).
 *
 * Regle : ce contexte ne fetch RIEN de metier. Il ne porte que la selection et
 * la liste des super events pour alimenter le selecteur.
 */

import {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
  type ReactNode,
} from 'react'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'

const LS_SE = 'flowin.scope.se'
const LS_EV = 'flowin.scope.ev'

/** Template de duplication : jamais propose comme portee de travail. */
const SE_TEMPLATE = 'se-master-superevent'

export interface ScopeStore {
  /** Super event courant. null = aucun choisi (avant chargement de la liste). */
  seId: string | null
  /** Event courant a l interieur du super event. null = "tous les events". */
  evId: string | null
  /** Liste des super events selectionnables (template exclu). */
  superEvents: SuperEvent[]
  /** Le super event courant, resolu. */
  superEvent: SuperEvent | null
  chargement: boolean
  setSe: (id: string | null) => void
  setEv: (id: string | null) => void
}

const ScopeContext = createContext<ScopeStore | null>(null)

function lireUrl(cle: string): string | null {
  if (typeof window === 'undefined') return null
  const v = new URLSearchParams(window.location.search).get(cle)
  return v && v.trim() ? v : null
}

function lireLs(cle: string): string | null {
  try {
    const v = window.localStorage.getItem(cle)
    return v && v.trim() ? v : null
  } catch { return null }
}

function ecrireLs(cle: string, valeur: string | null) {
  try {
    if (valeur) window.localStorage.setItem(cle, valeur)
    else window.localStorage.removeItem(cle)
  } catch { /* mode prive, quota : la portee reste juste non persistee */ }
}

/** Reflete la portee dans l URL sans re-render ni entree d historique. */
function ecrireUrl(seId: string | null, evId: string | null) {
  if (typeof window === 'undefined') return
  const u = new URL(window.location.href)
  if (seId) u.searchParams.set('se', seId); else u.searchParams.delete('se')
  if (evId) u.searchParams.set('ev', evId); else u.searchParams.delete('ev')
  window.history.replaceState(null, '', u.toString())
}

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [seId, setSeId] = useState<string | null>(null)
  const [evId, setEvId] = useState<string | null>(null)
  const [superEvents, setSuperEvents] = useState<SuperEvent[]>([])
  const [chargement, setChargement] = useState(true)

  // Restauration : URL d abord (deep-link), puis localStorage.
  useEffect(() => {
    const se = lireUrl('se') ?? lireLs(LS_SE)
    const ev = lireUrl('ev') ?? lireLs(LS_EV)
    if (se) setSeId(se)
    if (ev) setEvId(ev)
  }, [])

  useEffect(() => {
    let vivant = true
    fetchSuperEvents()
      .then(liste => {
        if (!vivant) return
        const utiles = liste.filter(s => s.id !== SE_TEMPLATE)
        setSuperEvents(utiles)
        // Defaut : le premier de la liste (le plus recent, fetchSuperEvents
        // trie par date_d desc) seulement si rien n a ete restaure.
        setSeId(prev => {
          if (prev && utiles.some(s => s.id === prev)) return prev
          return utiles[0]?.id ?? null
        })
      })
      .finally(() => { if (vivant) setChargement(false) })
    return () => { vivant = false }
  }, [])

  // Synchronisation URL + localStorage a chaque changement de portee.
  useEffect(() => {
    if (chargement) return
    ecrireUrl(seId, evId)
    ecrireLs(LS_SE, seId)
    ecrireLs(LS_EV, evId)
  }, [seId, evId, chargement])

  const setSe = useCallback((id: string | null) => {
    setSeId(id)
    // Changer de super event invalide l event courant : il appartenait a l autre.
    setEvId(null)
  }, [])

  const setEv = useCallback((id: string | null) => setEvId(id), [])

  const superEvent = useMemo(
    () => superEvents.find(s => s.id === seId) ?? null,
    [superEvents, seId],
  )

  return (
    <ScopeContext.Provider value={{ seId, evId, superEvents, superEvent, chargement, setSe, setEv }}>
      {children}
    </ScopeContext.Provider>
  )
}

export function useScope(): ScopeStore {
  const ctx = useContext(ScopeContext)
  if (!ctx) throw new Error('useScope must be inside ScopeProvider')
  return ctx
}

/**
 * Variante tolerante : utilisable par un composant qui peut vivre hors du
 * dashboard (ex. un composant partage avec l espace pro). Renvoie null au lieu
 * de lever, pour ne jamais casser une page qui n a pas de portee.
 */
export function useScopeOptionnel(): ScopeStore | null {
  return useContext(ScopeContext)
}
