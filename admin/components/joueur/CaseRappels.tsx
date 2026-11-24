'use client'
/**
 * Case « Rappels » (Web Push), cochée par défaut, décochable : /moi > Mes tickets. 24/11/2026.
 * Invisible si le téléphone ne sait pas recevoir de notifications (iPhone sans appli installée) ou si
 * l'autorisation a été refusée : on ne montre rien de technique. En démo : visible, sans aucun effet.
 */
import { useEffect, useState } from 'react'
import { pushSupporte, permissionRefusee, rappelsCoches, definirRappels, armerPremiereDemande } from '@/lib/pushJoueur'

export default function CaseRappels({ joueurId, demo }: { joueurId: string; demo?: boolean }) {
  const [visible, setVisible] = useState(false)
  const [coche, setCoche] = useState(true)

  useEffect(() => {
    if (demo) { setVisible(true); return }
    if (!pushSupporte() || permissionRefusee()) return
    setVisible(true)
    setCoche(rappelsCoches())
    armerPremiereDemande(joueurId)
  }, [joueurId, demo])

  if (!visible) return null
  return (
    <label data-rappels style={{ flexBasis: '100%', display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, cursor: 'pointer', borderTop: '1px solid #ece7de', paddingTop: 8, marginTop: 2 }}>
      <input type="checkbox" data-rappels-case checked={coche} onChange={e => { const v = e.target.checked; setCoche(v); if (!demo) void definirRappels(joueurId, v) }}
        style={{ width: 22, height: 22, accentColor: '#3B5CC4', flexShrink: 0 }} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800 }}>Rappels</span>
        <span style={{ display: 'block', fontSize: 13, color: '#5a6071' }}>Un message quand un lot est prêt ou va expirer.</span>
      </span>
    </label>
  )
}
