'use client'

/**
 * PLANNING — kanban par statut.
 *
 * Remplace le calendrier mensuel (type Google Agenda) livre juste avant :
 * Romain a compare deux maquettes (calendrier vs kanban par statut) dans un
 * artifact et a explicitement choisi le kanban (27/10) -- le calendrier
 * n etait pas le bon livrable, pas une regression a corriger plus tard.
 *
 * Regle inchangee (deja valable sur le calendrier qu il remplace) : une carte
 * par OPERATION (super event ou event autonome), jamais une carte par
 * station individuelle -- un super event a 8 stations ne doit pas afficher 8
 * cartes identiques le meme jour. lib/operations.ts (grouperOperations) fait
 * deja ce regroupement pour la fiche pro ; ce planning l utilise directement
 * au lieu de re-ecrire la logique.
 *
 * Statuts de colonne : lib/planningKanban.ts (grouperParStatut) -- voir ce
 * fichier pour pourquoi "archive" existe en plus des 3 statuts de
 * lib/types.ts.
 */
import { useEffect, useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'
import { grouperOperations, libelleDates, type Operation } from '@/lib/operations'
import { grouperParStatut } from '@/lib/planningKanban'
import { TypeChip, PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { ACCENT_SUPER, ACCENT_ANIM } from '@/lib/charte'

export default function Page() {
  const { events, pros, partenaires, openDrawer } = useDashboard()
  const [supers, setSupers] = useState<SuperEvent[]>([])
  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])

  const enseigne = (proId: string | null) => {
    const p = pros.find(x => x.id === proId)
    const pt = p?.partenaire_id ? partenaires.find(x => x.id === p.partenaire_id) : null
    return pt?.nom || p?.nom || null
  }

  // Une carte par OPERATION (super event ou event autonome), jamais par
  // station -- grouperOperations fait deja ce regroupement pour la fiche pro.
  const operations = useMemo(() => grouperOperations(events, supers), [events, supers])

  const colonnes = useMemo(() => grouperParStatut(operations), [operations])

  const ouvrir = (op: Operation) => openDrawer(op.type === 'super' ? 'superevent' : 'event', op.id)

  const participants = (op: Operation) => op.stations.reduce((n, s) => n + (s.participants ?? 0), 0)

  return (
    <div className="sa-content">
      <PageHeader title="Planning" subtitle="Super events et events, par statut" />

      {operations.length === 0 ? (
        <EmptyState icon="📅" title="Aucune operation" desc="Créez votre premier event ou super event depuis la section Events." />
      ) : (
        <div className="sa-kanban">
          {colonnes.map(col => (
            <section key={col.cle} className="sa-kb-col">
              <header className="sa-kb-tete">
                <span className="t">{col.titre}</span>
                <span className="n">{col.ops.length}</span>
              </header>
              <div className="sa-kb-corps">
                {col.ops.length === 0 && <div className="sa-kb-vide">—</div>}
                {col.ops.map(op => (
                  <button
                    key={op.cle}
                    className="sa-kb-vignette"
                    style={{ borderLeftColor: op.type === 'super' ? ACCENT_SUPER : ACCENT_ANIM }}
                    onClick={() => ouvrir(op)}
                    title={`Ouvrir ${op.nom}`}
                  >
                    <div className="chips">
                      <TypeChip estSuper={op.type === 'super'} />
                    </div>
                    <div className="kb-corps-texte">
                      <div className="nom">{op.nom}</div>
                      {op.type === 'super'
                        ? <div className="pro">{op.stations.length} station{op.stations.length > 1 ? 's' : ''}</div>
                        : (enseigne(op.stations[0]?.pro_id ?? null) && <div className="pro">🏢 {enseigne(op.stations[0]?.pro_id ?? null)}</div>)}
                    </div>
                    <div className="meta">
                      <span>👥 {participants(op)}</span>
                      {op.dateD && <span>📅 {libelleDates(op.dateD, op.dateF)}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
