'use client'

/**
 * Parcours mobil — vue SA (v2). Reutilise les evenements deja charges dans le contexte dashboard
 * et delegue au composant ParcoursMobil qui affiche le vrai parcours en direct (iframe).
 *
 * MAJ 26/08 -- Romain signale une liste avec des "doublons" visuels dans le
 * selecteur. Verifie en base : pas un bug de donnees, chaque station NDS 2026
 * existe bien deux fois par conception (une fois reelle sous se-nds-2026, une
 * fois sous se-master-superevent, le template garde pour "Dupliquer"). Le
 * selecteur ne filtrait pas ce template -- exclu desormais. Deuxieme point de
 * Romain, plus important : toutes les stations NDS partagent le MEME design
 * (NDS2026Client.tsx), aucune utilite a les lister une par une -- le
 * selecteur montre desormais UNE entree representative par pro (createur
 * d'animation), pas chaque station individuellement.
 */
import { useMemo } from 'react'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import ParcoursMobil from '@/components/pro/ParcoursMobil'
import { useDashboard } from '@/contexts/DashboardContext'

export default function Page() {
  const { events, pros } = useDashboard()

  const evs = useMemo(() => {
    const reels = (events ?? []).filter(e => e.module && e.super_event_id && e.super_event_id !== 'se-master-superevent')
    const parPro = new Map<string, typeof reels[number]>()
    for (const e of reels) {
      const cle = e.pro_id ?? e.id
      const actuel = parPro.get(cle)
      // Priorite a une station 'live', sinon la premiere rencontree.
      if (!actuel || (e.status === 'live' && actuel.status !== 'live')) parPro.set(cle, e)
    }
    return Array.from(parPro.values())
      .map(e => {
        const proNom = pros.find(p => p.id === e.pro_id)?.nom
        return { id: e.id, module: e.module, nom: proNom ?? e.nom }
      })
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }, [events, pros])

  const seId = events?.find(e => e.super_event_id && e.super_event_id !== 'se-master-superevent')?.super_event_id ?? undefined

  return (
    <div>
      <PageHeader title="📱 Parcours mobil" subtitle="Aperçu du vrai parcours joueur — event & super event" />
      <ParcoursMobil events={evs} seId={seId} showTitle={false} />
    </div>
  )
}
