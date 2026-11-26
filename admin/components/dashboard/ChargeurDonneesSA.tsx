'use client'
import { useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { fetchAllJoueurs, fetchAllPros } from '@/lib/dashboard'

/**
 * Recharge, dans le navigateur, les joueurs et les pros avec le jeton Super Admin.
 * Le layout du dashboard les lit côté serveur avec la clé publique : depuis la fermeture de la lecture
 * anonyme (joueurs, pros), il recevait des listes vides et tout le CRM s'affichait à 0.
 * On ne remplace les listes que si la lecture authentifiée renvoie des lignes.
 */
export default function ChargeurDonneesSA() {
  const { setJoueurs, setPros } = useDashboard()
  useEffect(() => {
    let vivant = true
    fetchAllJoueurs().then(l => { if (vivant && l.length > 0) setJoueurs(l) })
    fetchAllPros().then(l => { if (vivant && l.length > 0) setPros(l) })
    return () => { vivant = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
