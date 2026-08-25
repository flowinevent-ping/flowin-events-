'use client'

/**
 * Tableau de tracking par station — brique reutilisee partout :
 * page statistiques, fiche pro, fiche partenaire.
 *
 * Un flash est une OUVERTURE DE QR, pas une personne : quelqu un qui rescanne
 * compte plusieurs fois. C est ce qui explique l ecart avec le nombre de parties,
 * et l en-tete le rappelle pour qu on ne le reinterprete pas a chaque lecture.
 */
import { useEffect, useState, useMemo } from 'react'
import { fetchTracking, SE_DEFAUT, type Tracking, type StationTracking } from '@/lib/nds'

type Champ = keyof StationTracking

export function TableauStations({
  se = SE_DEFAUT, proId, partenaireId, jour, titre = 'Tracking par station', compact = false,
  onStation,
}: {
  se?: string; proId?: string; partenaireId?: string; jour?: string
  titre?: string; compact?: boolean
  onStation?: (s: StationTracking) => void
}) {
  const [t, setT] = useState<Tracking | null>(null)
  const [charge, setCharge] = useState(true)
  const [tri, setTri] = useState<{ champ: Champ; sens: 1 | -1 }>({ champ: 'flashs', sens: -1 })

  useEffect(() => {
    setCharge(true)
    fetchTracking(se, { proId, partenaireId, jour }).then(setT).finally(() => setCharge(false))
  }, [se, proId, partenaireId, jour])

  const stations = useMemo(() => {
    if (!t) return []
    return [...t.stations].sort((a, b) => {
      const va = a[tri.champ], vb = b[tri.champ]
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * tri.sens
      return String(va ?? '').localeCompare(String(vb ?? ''), 'fr') * tri.sens
    })
  }, [t, tri])

  function trierPar(champ: Champ) {
    setTri(x => x.champ === champ ? { champ, sens: x.sens === 1 ? -1 : 1 } : { champ, sens: -1 })
  }
  function Th({ champ, children, right }: { champ: Champ; children: React.ReactNode; right?: boolean }) {
    const actif = tri.champ === champ
    return (
      <th style={{ textAlign: right ? 'right' : 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trierPar(champ)}>
        {children} <span style={{ opacity: actif ? 1 : 0.25, fontSize: 10 }}>{actif && tri.sens === 1 ? '▲' : '▼'}</span>
      </th>
    )
  }

  if (charge) return <div className="sa-muted" style={{ fontSize: 13 }}>Chargement du tracking…</div>
  if (!t || !t.stations.length) return <div className="sa-muted" style={{ fontSize: 13 }}>Aucun flash enregistré.</div>

  const g = t.totaux
  const cellule = { padding: '8px 10px', borderTop: '1px solid var(--sa-border)' } as const

  return (
    <>
      {!compact && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 12 }}>
          {([['Flashs', g.flashs], ['dont physique', g.physique], ['dont digital', g.digital],
             ['Parties', g.parties], ['Joueurs', g.joueurs], ['Ont rejoué', g.rejoue]] as [string, number][])
            .map(([lib, val]) => (
            <div key={lib} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: '12px 10px' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{val}</div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 3 }}>{lib}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 8 }}>
        <b>{titre}</b> — un flash est une ouverture du QR, pas une personne : un joueur qui rescanne compte plusieurs fois.
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
          <thead><tr>
            <Th champ="station">Station</Th><Th champ="type">Type</Th>
            <Th champ="flashs" right>Flashs</Th>
            <Th champ="physique" right>Physique</Th>
            <Th champ="digital" right>Digital</Th>
            <Th champ="parties" right>Parties</Th>
            <Th champ="joueurs" right>Joueurs</Th>
            <Th champ="rejoue" right>Rejoué</Th>
            <Th champ="heure_pic" right>Pic</Th>
          </tr></thead>
          <tbody>
            {stations.map(s => (
              <tr key={s.event_id}
                onClick={onStation ? () => onStation(s) : undefined}
                style={onStation ? { cursor: 'pointer' } : undefined}
                title={onStation ? 'Voir le détail de cette station' : undefined}>
                <td style={{ ...cellule, fontWeight: 700 }}>
                  {s.type === 'partenaire' ? '🤝 ' : '🎪 '}{s.station}
                </td>
                <td style={cellule}>
                  <span className={`sa-chip ${s.type === 'partenaire' ? 'live' : 'past'}`}>
                    {s.type === 'partenaire' ? 'Partenaire' : 'Station NDS'}
                  </span>
                </td>
                <td style={{ ...cellule, textAlign: 'right', fontWeight: 800 }}>{s.flashs}</td>
                <td style={{ ...cellule, textAlign: 'right' }}>{s.physique}</td>
                <td style={{ ...cellule, textAlign: 'right', color: s.digital ? '#E0218A' : 'var(--sa-muted)', fontWeight: s.digital ? 700 : 400 }}>{s.digital}</td>
                <td style={{ ...cellule, textAlign: 'right', fontWeight: 800 }}>{s.parties}</td>
                <td style={{ ...cellule, textAlign: 'right' }}>{s.joueurs}</td>
                <td style={{ ...cellule, textAlign: 'right', color: '#7C2D92', fontWeight: 700 }}>{s.rejoue}</td>
                <td style={{ ...cellule, textAlign: 'right', color: 'var(--sa-muted)' }}>
                  {s.heure_pic != null ? `${String(s.heure_pic).padStart(2, '0')}h` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
