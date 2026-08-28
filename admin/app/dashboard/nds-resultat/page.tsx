'use client'

/**
 * Résultat journalier — vue Next.
 * Corrige les quatre défauts releves sur la version monolithe :
 *  1. stations du festival et commerces partenaires melanges  -> deux blocs distincts
 *  2. identifiants bruts (ev-nds-tablette-2) au lieu des noms  -> noms lisibles
 *  3. journees hors festival non signalees                     -> badge explicite
 *  4. ecart parties commencees / terminees non explique        -> les deux affichees
 */
import { useEffect, useState } from 'react'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchJours, fetchStations, fetchSuperEvents, type JourActivite, type StationJour, type SuperEvent } from '@/lib/nds'
import { useDashboard } from '@/contexts/DashboardContext'

const fr = (d: string) => {
  const p = d.split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}` : d
}

export default function Page() {
  const { openDrawer } = useDashboard()
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [se, setSe] = useState<string>('')
  const [jours, setJours] = useState<JourActivite[] | null>(null)
  const [jour, setJour] = useState<string | null>(null)
  const [stations, setStations] = useState<StationJour[] | null>(null)

  useEffect(() => {
    fetchSuperEvents().then(l => {
      // Le Master est un gabarit de duplication, jamais joue reellement.
      const reels = l.filter(x => x.id !== 'se-master-superevent')
      setSupers(reels)
      if (reels.length) setSe(reels[0].id)
    })
  }, [])

  useEffect(() => {
    if (!se) return
    setJour(null)
    fetchJours(se).then(j => {
      setJours(j)
      if (j.length) setJour(j[j.length - 1].jour)
    })
  }, [se])

  useEffect(() => {
    if (!jour || !se) return
    setStations(null)
    fetchStations(jour, se).then(setStations)
  }, [jour, se])

  const courant = jours?.find(j => j.jour === jour)
  const festival = (stations ?? []).filter(s => s.type === 'station')
  const commerces = (stations ?? []).filter(s => s.type === 'commerce')

  const bloc = (titre: string, liste: StationJour[], vide: string) => (
    <>
      <SectionHeader>{titre}</SectionHeader>
      {liste.length === 0 && <div className="sa-muted" style={{ fontSize: 13, marginBottom: 16 }}>{vide}</div>}
      {liste.map(s => (
        <div
          key={s.event_id}
          onClick={() => openDrawer('event', s.event_id, 'stats')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '9px 12px', background: 'var(--sa-subtle)', borderRadius: 9, marginBottom: 6, cursor: 'pointer' }}
        >
          <span style={{ flex: 1, minWidth: 160, fontWeight: 700, fontSize: 13 }}>{s.nom}</span>
          <span style={{ fontSize: 12, color: 'var(--sa-muted)' }}>{s.visiteurs} visiteur{s.visiteurs > 1 ? 's' : ''}</span>
          <span style={{ fontSize: 12, color: 'var(--sa-muted)' }}>
            {s.terminees} partie{s.terminees > 1 ? 's' : ''} terminée{s.terminees > 1 ? 's' : ''}
            {s.commencees !== s.terminees && ` sur ${s.commencees} commencée${s.commencees > 1 ? 's' : ''}`}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--sa-accent)', fontWeight: 700 }}>Voir le détail →</span>
        </div>
      ))}
    </>
  )

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="📅 Résultat journalier" subtitle="Stations de jeu et commerces partenaires, par jour" />

        {supers.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {supers.map(x => (
              <button key={x.id} className={`sa-btn sm${x.id === se ? ' primary' : ''}`} onClick={() => setSe(x.id)}>
                {x.nom}
              </button>
            ))}
          </div>
        )}

        {jours === null && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}
        {jours?.length === 0 && <EmptyState title="Aucune activité enregistrée" />}

        {!!jours?.length && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {jours.map(j => (
              <button key={j.jour} onClick={() => setJour(j.jour)}
                className={`sa-btn sm${j.jour === jour ? ' primary' : ''}`}
                title={j.hors_periode ? 'Journée hors période de festival' : undefined}>
                {fr(j.jour)}{j.hors_periode ? ' ⚠' : ''}
              </button>
            ))}
          </div>
        )}

        {courant?.hors_periode && (
          <div className="sa-alert warn" style={{ marginBottom: 14, fontSize: 12.5 }}>
            ⚠ Journée <b>hors période de festival</b>. Des joueurs ont trouvé un QR encore actif après la clôture.
          </div>
        )}

        {courant && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {([['Parties terminées', courant.terminees],
               ['Parties commencées', courant.commencees],
               ['Joueurs uniques', courant.joueurs]] as [string, number][]).map(([lib, val]) => (
              <div key={lib} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: '16px 14px' }}>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{val}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 4 }}>{lib}</div>
              </div>
            ))}
          </div>
        )}

        {courant && courant.commencees !== courant.terminees && (
          <div className="sa-alert info" style={{ marginBottom: 16, fontSize: 12.5 }}>
            {courant.commencees - courant.terminees} partie{courant.commencees - courant.terminees > 1 ? 's' : ''} commencée{courant.commencees - courant.terminees > 1 ? 's' : ''} sans être terminée{courant.commencees - courant.terminees > 1 ? 's' : ''}. L&apos;écart entre les deux compteurs vient de là.
          </div>
        )}

        {stations === null && jour && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement des stations…</div>}
        {stations !== null && (
          <>
            {bloc(`🎪 Stations du festival (${festival.length})`, festival, 'Aucune station active ce jour-là.')}
            {bloc(`🤝 Commerces partenaires (${commerces.length})`, commerces, 'Aucun commerce flashé ce jour-là.')}
          </>
        )}
      </div>
    </div>
  )
}
