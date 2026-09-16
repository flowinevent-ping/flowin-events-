'use client'

/**
 * PLANNING — referentiel 38.
 *
 * « Planning des events et super events : QR code utilisé, event / super
 * event, date, enseigne, nom de l event. » Une ligne par station (event),
 * rangée par mois puis par opération, triée par date. Un clic ouvre la fiche.
 */
import { useEffect, useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import ListeCRM, { type ColonneCRM } from '@/components/dashboard/ListeCRM'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'
import { supabase } from '@/lib/supabase'
import { estGabarit, libelleModule, libelleStatut } from '@/lib/operations'
import type { FlowinEvent } from '@/lib/types'

const fmt = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const mois = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Sans date')

export default function Page() {
  const { events, pros, partenaires, openDrawer } = useDashboard()
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [qrs, setQrs] = useState<{ event_id: string; publie: boolean | null }[]>([])
  const [se, setSe] = useState('')
  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])
  useEffect(() => {
    supabase.from('qr_stations').select('event_id,publie').then(({ data }) => setQrs((data ?? []) as typeof qrs))
  }, [])

  const lignes = useMemo(
    () => events.filter(e => !estGabarit(e))
      .filter(e => !se || (se === '_ev' ? !e.super_event_id : e.super_event_id === se)),
    [events, se])

  const enseigne = (e: FlowinEvent) => {
    const p = pros.find(x => x.id === e.pro_id)
    const pt = p?.partenaire_id ? partenaires.find(x => x.id === p.partenaire_id) : null
    return pt?.nom || p?.nom || e.pro_id || '—'
  }
  const operation = (e: FlowinEvent) => e.super_event_id
    ? { id: e.super_event_id, label: `⭐ ${supers.find(s => s.id === e.super_event_id)?.nom ?? e.super_event_id}` }
    : { id: `ev:${e.id}`, label: `🎬 ${e.nom}` }
  const qrDe = (e: FlowinEvent) => {
    const l = qrs.filter(q => q.event_id === e.id)
    return { suivi: l.filter(q => q.publie).length, attente: l.filter(q => !q.publie).length }
  }

  const colonnes: ColonneCRM<FlowinEvent>[] = [
    {
      id: 'date_d', label: 'Date', valeur: e => e.date_d, horsRecherche: true, multiligne: true, largeur: 130,
      rendu: e => (
        <>
          <div style={{ fontWeight: 700 }}>{fmt(e.date_d)}</div>
          {e.date_f && e.date_f !== e.date_d && <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>→ {fmt(e.date_f)}</div>}
        </>
      ),
    },
    { id: 'nom', label: 'Event / station', valeur: e => e.nom, multiligne: true },
    { id: 'type', label: 'Opération', valeur: e => (e.super_event_id ? 'Super event' : 'Event'), largeur: 110 },
    { id: 'enseigne', label: 'Enseigne', valeur: enseigne },
    {
      id: 'qr', label: 'QR utilisé', valeur: e => (e.cfg as Record<string, unknown> | null)?.qrUrl as string | undefined, multiligne: true,
      rendu: e => {
        const url = (e.cfg as Record<string, unknown> | null)?.qrUrl as string | undefined
        const q = qrDe(e)
        return (
          <>
            <div>{url ? `QR du jeu · ${libelleModule(e.module)}` : <span style={{ color: '#B45309' }}>Aucun QR</span>}</div>
            {(q.suivi > 0 || q.attente > 0) && (
              <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>
                {q.suivi} QR de suivi{q.attente ? ` · ${q.attente} à valider` : ''}
              </div>
            )}
          </>
        )
      },
    },
    { id: 'status', label: 'Statut', valeur: e => libelleStatut(e.status), largeur: 100 },
  ]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <ListeCRM<FlowinEvent>
          titre="📅 Planning"
          sousTitre="Events et super events par date — enseigne, opération, QR"
          lignes={lignes}
          colonnes={colonnes}
          cle={e => e.id}
          onLigne={e => openDrawer('event', e.id)}
          triDefaut="date_d"
          placeholderRecherche="Rechercher un event, une enseigne…"
          filtres={[
            { id: 'tous', label: 'Tous' },
            { id: 'avenir', label: 'À venir', test: e => e.status === 'upcoming' },
            { id: 'live', label: 'En cours', test: e => e.status === 'live' },
            { id: 'past', label: 'Terminés', test: e => e.status === 'past' },
          ]}
          selecteurs={[{
            id: 'se', libelleTout: 'Toutes les opérations',
            options: [{ id: '_ev', label: 'Events autonomes' }].concat(supers.map(s => ({ id: s.id, label: s.nom }))),
            valeur: se, onChange: setSe,
          }]}
          categorie={e => ({ id: (e.date_d ?? '0000-00').slice(0, 7), label: mois(e.date_d) })}
          sousCategorie={operation}
        />
      </div>
    </div>
  )
}
