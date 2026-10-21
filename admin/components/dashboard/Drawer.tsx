'use client'

import { useEffect, useRef, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import JoueurDrawer from './JoueurDrawer'
import EventDrawer from './EventDrawer'
import PartenaireDrawer from './PartenaireDrawer'
import ProDrawer from './ProDrawer'
import SuperEventDrawer from './SuperEventDrawer'

const LARGEUR_MIN = 420
const LARGEUR_DEFAUT = 980
const CLE_LARGEUR = 'sa-drawer-largeur'

/** Poignee de redimensionnement a gauche du drawer -- Romain (21/10), apres
 * un premier agrandissement fixe : « rend-moi la fenêtre modifiable en
 * dimension ». Largeur glissee a la souris/au doigt, bornee et memorisee
 * (localStorage) pour rester d un panneau a l autre et d une session a
 * l autre. Le drawer reste ancre a droite (CSS `right:0`), donc glisser son
 * bord GAUCHE vers la gauche agrandit : largeur = distance au bord droit
 * de l ecran. */
function usePoigneeRedimension() {
  const [largeur, setLargeur] = useState<number | null>(null)
  const actif = useRef(false)

  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem(CLE_LARGEUR) ?? '', 10)
      setLargeur(Number.isFinite(v) && v > 0 ? v : LARGEUR_DEFAUT)
    } catch { setLargeur(LARGEUR_DEFAUT) }
  }, [])

  useEffect(() => {
    function bouger(clientX: number) {
      const max = Math.round(window.innerWidth * 0.96)
      const v = Math.min(max, Math.max(LARGEUR_MIN, Math.round(window.innerWidth - clientX)))
      setLargeur(v)
    }
    function onMove(e: PointerEvent) { if (actif.current) bouger(e.clientX) }
    function onUp() {
      if (!actif.current) return
      actif.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setLargeur(v => { try { if (v) localStorage.setItem(CLE_LARGEUR, String(v)) } catch { /* rien */ } return v })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [])

  function demarrer(e: React.PointerEvent) {
    e.preventDefault()
    actif.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return { largeur: largeur ?? LARGEUR_DEFAUT, demarrer }
}

export default function Drawer() {
  const { drawer, closeDrawer, drawerCanGoBack, goBackDrawer } = useDashboard()
  const { largeur, demarrer } = usePoigneeRedimension()

  if (!drawer.open) return null

  const entity = (() => {
    switch (drawer.type) {
      case 'joueur':      return <JoueurDrawer />
      case 'event':       return <EventDrawer />
      case 'partenaire':  return <PartenaireDrawer />
      case 'pro':         return <ProDrawer />
      case 'superevent':  return <SuperEventDrawer />
      default:            return null
    }
  })()

  return (
    <>
      <div className="sa-drawer-bd" onClick={closeDrawer} />
      <div className="sa-drawer wide" style={{ position: 'relative', width: `min(${largeur}px, 96vw)` }}>
        <div className="sa-drawer-resize" onPointerDown={demarrer} title="Glisser pour redimensionner" />
        {drawerCanGoBack && (
          <button
            onClick={goBackDrawer}
            style={{ position: 'absolute', top: 14, left: 14, zIndex: 5, background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Retour
          </button>
        )}
        {entity}
      </div>
    </>
  )
}
