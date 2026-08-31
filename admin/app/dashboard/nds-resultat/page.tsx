'use client'

/**
 * Résultat journalier — vue Next.
 * Corrige les quatre défauts releves sur la version monolithe :
 *  1. stations du festival et commerces partenaires melanges  -> deux blocs distincts
 *  2. identifiants bruts (ev-nds-tablette-2) au lieu des noms  -> noms lisibles
 *  3. journees hors festival non signalees                     -> badge explicite
 *  4. ecart parties commencees / terminees non explique        -> les deux affichees
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { Camembert } from '@/components/dashboard/Camembert'
import {
  fetchJours, fetchStations, fetchSuperEvents,
  fetchOptinJour, fetchEngagementJour, fetchRepondantsJour,
  type JourActivite, type StationJour, type SuperEvent,
  type OptinJour, type EngagementJour, type RepondantsJour,
} from '@/lib/nds'
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
  const [voirHorsFestival, setVoirHorsFestival] = useState(false)
  const [stations, setStations] = useState<StationJour[] | null>(null)
  const [stationFiltre, setStationFiltre] = useState<string>('toutes')
  const [optin, setOptin] = useState<OptinJour | null>(null)
  const [engag, setEngag] = useState<EngagementJour | null>(null)
  const [repond, setRepond] = useState<RepondantsJour | null>(null)

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
      // Premier jour DU FESTIVAL par defaut, jamais un jour de test -- 31/08 (fix) : avant
      // ce fix, un jour de test pouvait etre le "dernier" de la liste et s'ouvrir par defaut.
      const festivaux = j.filter(x => !x.hors_periode)
      const defaut = festivaux.length ? festivaux[festivaux.length - 1] : j[j.length - 1]
      if (defaut) setJour(defaut.jour)
    })
  }, [se])

  useEffect(() => {
    if (!jour || !se) return
    setStations(null)
    setStationFiltre('toutes')
    fetchStations(jour, se).then(setStations)
    fetchOptinJour(se, jour).then(setOptin)
    fetchEngagementJour(se, jour).then(setEngag)
    fetchRepondantsJour(se, jour).then(setRepond)
  }, [jour, se])

  const joursFestival = useMemo(() => (jours ?? []).filter(j => !j.hors_periode), [jours])
  const joursHorsFestival = useMemo(() => (jours ?? []).filter(j => j.hors_periode), [jours])

  const courant = jours?.find(j => j.jour === jour)
  const stationsFiltrees = stationFiltre === 'toutes' ? (stations ?? []) : (stations ?? []).filter(s => s.event_id === stationFiltre)
  const festival = stationsFiltrees.filter(s => s.type === 'station')
  const commerces = stationsFiltrees.filter(s => s.type === 'commerce')

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

        {!!joursFestival.length && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {joursFestival.map(j => (
              <button key={j.jour} onClick={() => setJour(j.jour)} className={`sa-btn sm${j.jour === jour ? ' primary' : ''}`}>
                {fr(j.jour)}
              </button>
            ))}
          </div>
        )}

        {!!joursHorsFestival.length && (
          <div style={{ marginBottom: 18 }}>
            <button
              className="sa-btn sm"
              onClick={() => setVoirHorsFestival(v => !v)}
              style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}
            >
              {voirHorsFestival ? '▲ Masquer' : '▼ Voir'} les {joursHorsFestival.length} jours hors festival (tests, avant/après le 9-18/07)
            </button>
            {voirHorsFestival && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {joursHorsFestival.map(j => (
                  <button key={j.jour} onClick={() => setJour(j.jour)}
                    className={`sa-btn sm${j.jour === jour ? ' primary' : ''}`}
                    title="Journée hors période de festival">
                    {fr(j.jour)} ⚠
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {courant?.hors_periode && (
          <div className="sa-alert warn" style={{ marginBottom: 14, fontSize: 12.5 }}>
            ⚠ Journée <b>hors période de festival</b> (avant le 09/07 ou après le 18/07) — activité de test ou résiduelle, pas comptée dans les chiffres officiels du festival.
          </div>
        )}

        {courant && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {([['Flashs', courant.flashs],
               ['Parties terminées', courant.terminees],
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

        {optin && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader>🛡️ Conformité RGPD & complétion</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
              {([
                [`${optin.taux_optin ?? 0} %`, 'Opt-in du jour'],
                [`${optin.cumul?.taux_optin ?? 0} %`, 'Opt-in cumulé'],
                [`${optin.taux_completion ?? 0} %`, 'Complétion du jour'],
                [`${optin.cumul?.taux_completion ?? 0} %`, 'Complétion cumulée'],
              ] as [string, string][]).map(([val, lib]) => (
                <div key={lib} style={{ background: 'var(--sa-subtle)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{val}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{lib}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
              <Camembert titre="Opt-in — jour sélectionné" unite="joueurs"
                parts={[{ valeur: 'Accepté', n: optin.optin_oui ?? 0 }, { valeur: 'Refusé', n: optin.optin_non ?? 0 }]} />
              <Camembert titre={`Opt-in — cumulé (${optin.cumul?.joueurs ?? 0} joueurs)`} unite="joueurs"
                parts={[{ valeur: 'Accepté', n: optin.cumul?.optin_oui ?? 0 }, { valeur: 'Refusé', n: optin.cumul?.optin_non ?? 0 }]} />
            </div>
          </div>
        )}

        {(engag || repond) && (
          <div style={{ marginBottom: 20 }}>
            <SectionHeader>🎯 Engagement du jour</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
              {engag && (
                <Camembert titre="Une partie vs rejoué" unite="joueurs"
                  parts={[{ valeur: 'Une seule partie', n: engag.une_partie ?? 0 }, { valeur: 'Ont rejoué', n: engag.ont_rejoue ?? 0 }]} />
              )}
              {engag && (
                <Camembert titre="Question bonus" unite="joueurs"
                  parts={[{ valeur: 'Ont répondu', n: engag.bonus_oui ?? 0 }, { valeur: 'N\u2019ont pas répondu', n: engag.bonus_non ?? 0 }]} />
              )}
              {repond && (
                <Camembert titre="Couverture bonus + landing Brigade Verte" unite="joueurs"
                  parts={[
                    { valeur: 'Bonus seulement', n: repond.bonus_seulement ?? 0 },
                    { valeur: 'Landing BV seulement', n: repond.landing_seulement ?? 0 },
                    { valeur: 'Les deux', n: repond.les_deux ?? 0 },
                    { valeur: 'Aucun des deux', n: repond.aucun ?? 0 },
                  ]} />
              )}
            </div>
          </div>
        )}

        {stations !== null && stations.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <label className="sa-muted" style={{ fontSize: 11.5, fontWeight: 700 }}>Filtrer par event :</label>
            <select className="sa-input" style={{ maxWidth: 320 }} value={stationFiltre} onChange={e => setStationFiltre(e.target.value)}>
              <option value="toutes">Toutes les stations / tous les commerces</option>
              {stations.map(s => <option key={s.event_id} value={s.event_id}>{s.type === 'station' ? '🎪' : '🤝'} {s.nom}</option>)}
            </select>
            {stationFiltre !== 'toutes' && (
              <button className="sa-btn sm" onClick={() => setStationFiltre('toutes')}>✕ Réinitialiser</button>
            )}
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
