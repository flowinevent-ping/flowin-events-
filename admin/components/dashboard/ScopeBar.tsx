'use client'

/**
 * BARRE DE PORTEE — en tete de sidebar, visible sur tout le dashboard.
 *
 * Deux selecteurs : le super event, puis l event a l interieur de ce super
 * event. Ils pilotent ScopeContext, qui ecrit ?se=&ev= dans l URL.
 *
 * Le selecteur d event liste uniquement les events rattaches au super event
 * courant (super_event_id), plus "Tous les events". Un event orphelin
 * (super_event_id null) n apparait donc pas ici : il se trouve par le kanban.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { useScope } from '@/contexts/ScopeContext'
import { useDashboard } from '@/contexts/DashboardContext'

export default function ScopeBar() {
  const { seId, evId, superEvents, chargement, setSe, setEv } = useScope()
  const { events } = useDashboard()

  const eventsDuSe = useMemo(() => {
    if (!seId) return []
    return events
      .filter(e => e.super_event_id === seId)
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'))
  }, [events, seId])

  return (
    <div className="sa-scope">
      <div className="sa-scope-lbl">Contexte de travail</div>

      <select
        className="sa-scope-sel"
        aria-label="Super event"
        value={seId ?? ''}
        onChange={e => setSe(e.target.value || null)}
        disabled={chargement || superEvents.length === 0}
      >
        {chargement && <option value="">Chargement…</option>}
        {!chargement && superEvents.length === 0 && <option value="">Aucun super event</option>}
        {superEvents.map(s => (
          <option key={s.id} value={s.id}>{s.nom}</option>
        ))}
      </select>

      <select
        className="sa-scope-sel sub"
        aria-label="Event"
        value={evId ?? ''}
        onChange={e => setEv(e.target.value || null)}
        disabled={!seId}
      >
        <option value="">
          {eventsDuSe.length > 0 ? `Tous les events (${eventsDuSe.length})` : 'Aucun event rattaché'}
        </option>
        {eventsDuSe.map(e => (
          <option key={e.id} value={e.id}>{e.nom}</option>
        ))}
      </select>

      {/* Choisir un event doit faire quelque chose de visible tout de suite :
          les pages qui savent se filtrer par event le font, et d ici on ouvre
          directement sa fiche. */}
      {evId && (
        <Link href={`/dashboard/event/${evId}`} className="sa-scope-lien">
          Ouvrir la fiche de l&apos;event →
        </Link>
      )}
      {seId && !evId && (
        <Link href={`/dashboard/super-event/${seId}`} className="sa-scope-lien">
          Ouvrir l&apos;espace du super event →
        </Link>
      )}
    </div>
  )
}
