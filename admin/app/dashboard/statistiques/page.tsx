'use client'

/**
 * Rapport de fin d operation — vue unique et complete.
 * Activite par date et par station (stations du festival ET commerces),
 * redirections partenaires avec pics horaires, demographie en camemberts,
 * et classement des meilleurs joueurs croise avec leurs gains.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { Camembert } from '@/components/dashboard/Camembert'
import { CarteChaleur } from '@/components/dashboard/CarteChaleur'
import { TableauStations } from '@/components/dashboard/TableauStations'
import {
  fetchRapport, fetchPics, fetchSuperEvents,
  type Rapport, type Pics, type SuperEvent,
} from '@/lib/nds'

const fr = (d: string) => { const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : d }

export default function Page() {
  /* Aucun super event code en dur : on charge la liste et on selectionne le plus recent.
     Les memes indicateurs valent pour toute edition presente ou future. */
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [se, setSe] = useState<string>('')
  const [r, setR] = useState<Rapport | null>(null)
  const [pics, setPics] = useState<Pics | null>(null)
  const [charge, setCharge] = useState(true)
  const [jour, setJour] = useState<string | 'tous'>('tous')

  useEffect(() => {
    fetchSuperEvents().then(l => {
      setSupers(l)
      if (l.length) setSe(l[0].id)
      else setCharge(false)
    })
  }, [])

  useEffect(() => {
    if (!se) return
    setCharge(true); setJour('tous')
    Promise.all([fetchRapport(se), fetchPics(se)])
      .then(([a, b]) => { setR(a); setPics(b) })
      .finally(() => setCharge(false))
  }, [se])

  const jours = useMemo(() => {
    const s = new Set((r?.par_jour_station ?? []).map(l => l.jour))
    return Array.from(s).sort()
  }, [r])

  const lignes = useMemo(() => {
    const l = r?.par_jour_station ?? []
    return jour === 'tous' ? l : l.filter(x => x.jour === jour)
  }, [r, jour])

  /* Pic de redirections : jour et heure ou les partenaires ont le plus renvoye. */
  const pic = useMemo(() => {
    const l = r?.redirections_partenaires ?? []
    return l.length ? l.reduce((a, b) => (b.clics > a.clics ? b : a)) : null
  }, [r])

  const parPartenaire = useMemo(() => {
    const m = new Map<string, { clics: number; reseaux: number }>()
    for (const x of r?.redirections_partenaires ?? []) {
      const c = m.get(x.partenaire) ?? { clics: 0, reseaux: 0 }
      c.clics += x.clics; c.reseaux += x.depuis_reseaux
      m.set(x.partenaire, c)
    }
    return Array.from(m, ([valeur, v]) => ({ valeur, n: v.clics, reseaux: v.reseaux }))
      .sort((a, b) => b.n - a.n)
  }, [r])

  if (charge) return <div className="sa-content"><div className="sa-page"><div className="sa-muted">Chargement du rapport…</div></div></div>
  if (!r) return <div className="sa-content"><div className="sa-page"><EmptyState title="Rapport indisponible" /></div></div>

  const t = r.totaux
  /* Un commerce partenaire EST une station de jeu : on ne les separe plus en deux
     tableaux, on les distingue par un marqueur dans la meme liste. */
  const nbCommerces = lignes.filter(l => l.type === 'commerce').length
  const nbStations = lignes.length - nbCommerces

  const tableau = (titre: string, l: typeof lignes, vide: string) => (
    <>
      <SectionHeader>{titre}</SectionHeader>
      {l.length === 0 && <div className="sa-muted" style={{ fontSize: 13, marginBottom: 14 }}>{vide}</div>}
      {l.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 18 }}>
          <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead><tr>
              <th>Jour</th><th>Station</th><th style={{ textAlign: 'right' }}>Clics</th>
              <th style={{ textAlign: 'right' }}>Parties</th><th style={{ textAlign: 'right' }}>Joueurs</th>
              <th style={{ textAlign: 'right' }}>1<sup>re</sup> fois</th><th style={{ textAlign: 'right' }}>Revenus</th>
            </tr></thead>
            <tbody>
              {l.map((x, i) => (
                <tr key={`${x.jour}-${x.event_id}-${i}`}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fr(x.jour)}</td>
                  <td style={{ fontWeight: 700 }}>
                    <span title={x.type === 'commerce' ? 'Station chez un commerce partenaire' : 'Station du festival'}>
                      {x.type === 'commerce' ? '🤝 ' : '🎪 '}
                    </span>{x.station}
                  </td>
                  <td style={{ textAlign: 'right' }}>{x.clics}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{x.parties}</td>
                  <td style={{ textAlign: 'right' }}>{x.joueurs}</td>
                  <td style={{ textAlign: 'right', color: '#1D9E75', fontWeight: 700 }}>{x.primo_inscrits}</td>
                  <td style={{ textAlign: 'right', color: '#7C2D92', fontWeight: 700 }}>{x.joueurs_revenus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="📊 Statistiques & résultats" subtitle="Activité, audience et retombées partenaires" />

        {supers.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {supers.map(x => (
              <button key={x.id} className={`sa-btn sm${x.id === se ? ' primary' : ''}`} onClick={() => setSe(x.id)}>
                {x.nom}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
          {([['Joueurs', t.joueurs], ['Parties', t.parties], ['Clics stations', t.clics_stations],
             ['Clics partenaires', t.clics_partenaires], ['Dont réseaux', t.clics_depuis_reseaux]] as [string, number][])
            .map(([lib, val]) => (
            <div key={lib} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: '15px 12px' }}>
              <div style={{ fontSize: 23, fontWeight: 800 }}>{val}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 4 }}>{lib}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <button className={`sa-btn sm${jour === 'tous' ? ' primary' : ''}`} onClick={() => setJour('tous')}>Toutes les dates</button>
          {jours.map(j => (
            <button key={j} className={`sa-btn sm${jour === j ? ' primary' : ''}`} onClick={() => setJour(j)}>{fr(j)}</button>
          ))}
        </div>

        <SectionHeader>📡 Tracking par station</SectionHeader>
        <div style={{ marginBottom: 22 }}>
          <TableauStations se={se} />
        </div>

        {tableau(
          `🎮 Activité par jour (${lignes.length}) — ${nbStations} du festival, ${nbCommerces} chez les partenaires`,
          lignes, 'Aucune activité sur cette sélection.')}

        {pics?.cellules?.length ? (
          <>
            <SectionHeader>🔥 Pics de jeu</SectionHeader>
            {pics.pic && (
              <div className="sa-alert info" style={{ marginBottom: 12, fontSize: 12.5 }}>
                Pic absolu : <b>{pics.pic.parties} parties</b> le <b>{pics.pic.soiree.split('-').reverse().join('/')}</b> entre{' '}
                <b>{pics.pic.heure}h et {(pics.pic.heure + 1) % 24}h</b>.
                {pics.creneau_dense && (
                  <> Le créneau <b>{pics.creneau_dense.debut}h-{pics.creneau_dense.fin}h</b> concentre{' '}
                  <b>{pics.creneau_dense.part} %</b> de l&apos;activité.</>
                )}
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <CarteChaleur cellules={pics.cellules} maximum={pics.maximum} titre="Parties par soirée et par heure" />
            </div>
          </>
        ) : null}

        <SectionHeader>🗺️ Consultation des partenaires dans l&apos;application</SectionHeader>
        <div className="sa-alert info" style={{ marginBottom: 14, fontSize: 12.5 }}>
          <b>{r.ecrans?.carte ?? 0} appareils</b> ont ouvert la carte des partenaires et{' '}
          <b>{r.ecrans?.partenaires ?? 0}</b> l&apos;écran partenaires.
          {(r.totaux.clics_sortants ?? 0) === 0 && (
            <> Le détail par partenaire n&apos;est pas disponible pour cette édition :
            le suivi des clics sortants a été mis en service le 22/07, après la clôture du 18.
            Il est actif pour les prochaines opérations.</>
          )}
        </div>

        <SectionHeader>🔗 Redirections vers les partenaires</SectionHeader>
        {pic && (
          <div className="sa-alert info" style={{ marginBottom: 14, fontSize: 12.5 }}>
            Pic de redirections : <b>{pic.clics} clics</b> vers <b>{pic.partenaire}</b> le <b>{fr(pic.jour)}</b> à <b>{String(pic.heure).padStart(2, '0')}h</b>.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <Camembert titre="Clics par partenaire" parts={parPartenaire} unite="clics" />
          <Camembert titre="Origine des clics partenaires" unite="clics"
            parts={[
              { valeur: 'Depuis les réseaux sociaux', n: t.clics_depuis_reseaux },
              { valeur: 'Origine non déclarée', n: t.clics_partenaires - t.clics_depuis_reseaux },
            ]} />
        </div>

        <SectionHeader>👥 Profil de l&apos;audience</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <Camembert titre="Genre" parts={r.genre} unite="joueurs" />
          <Camembert titre="Tranche d'âge" parts={r.age} unite="joueurs" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <Camembert titre="Comment ont-ils connu le festival ?" parts={r.decouverte} unite="joueurs" />
        </div>

        <SectionHeader>🏅 Meilleurs joueurs</SectionHeader>
        <div style={{ overflowX: 'auto' }}>
          <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead><tr>
              <th>#</th><th>Joueur</th><th>Code postal</th>
              <th style={{ textAlign: 'right' }}>Parties</th><th style={{ textAlign: 'right' }}>Lots gagnés</th><th>Contact</th>
            </tr></thead>
            <tbody>
              {r.meilleurs_joueurs.map((j, i) => (
                <tr key={j.joueur_id} style={j.gains > 0 ? { background: 'rgba(245,161,0,.08)' } : undefined}>
                  <td style={{ fontWeight: 800, color: 'var(--sa-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{[j.prenom, j.nom].filter(Boolean).join(' ') || '—'}</td>
                  <td>{j.code_postal ?? '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{j.parties}</td>
                  <td style={{ textAlign: 'right' }}>{j.gains > 0 ? <b style={{ color: '#a1690a' }}>🏆 {j.gains}</b> : '—'}</td>
                  <td>{j.optin ? <span className="sa-chip live">✓</span> : <span className="sa-chip past">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
