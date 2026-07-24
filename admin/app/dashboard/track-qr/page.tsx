'use client'

/**
 * Origines du trafic — Track QR.
 * D ou viennent les visiteurs, et ou vont les clics sortants.
 * Generique : un onglet par super event, aucun identifiant en dur.
 */
import { useEffect, useState } from 'react'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { Camembert } from '@/components/dashboard/Camembert'
import { fetchTrackQr, fetchSuperEvents, libelleSource, type TrackQr, type SuperEvent } from '@/lib/nds'

export default function Page() {
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [se, setSe] = useState('')
  const [t, setT] = useState<TrackQr | null>(null)
  const [charge, setCharge] = useState(true)

  useEffect(() => {
    fetchSuperEvents().then(l => { setSupers(l); if (l.length) setSe(l[0].id); else setCharge(false) })
  }, [])
  useEffect(() => {
    if (!se) return
    setCharge(true)
    fetchTrackQr(se).then(setT).finally(() => setCharge(false))
  }, [se])

  const parts = (t?.origines ?? [])
    .map(o => ({ valeur: libelleSource(o.source), n: o.visiteurs }))
    .filter(o => o.n > 0)

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="🔗 Origines du trafic" subtitle="D'où viennent les visiteurs, où vont les clics" />

        {supers.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {supers.map(x => (
              <button key={x.id} className={`sa-btn sm${x.id === se ? ' primary' : ''}`} onClick={() => setSe(x.id)}>{x.nom}</button>
            ))}
          </div>
        )}

        {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}
        {!charge && !t && <EmptyState title="Aucune donnée de trafic" />}

        {!charge && t && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {([['Visiteurs uniques', t.total_visiteurs],
                 ['Clics sortants', t.total_clics],
                 ['Origines identifiées', t.origines.length]] as [string, number][]).map(([lib, val]) => (
                <div key={lib} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: '16px 14px' }}>
                  <div style={{ fontSize: 25, fontWeight: 800 }}>{val}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 4 }}>{lib}</div>
                </div>
              ))}
            </div>

            <SectionHeader>📍 Origine des visiteurs</SectionHeader>
            <div style={{ marginBottom: 20 }}>
              <Camembert titre="Répartition par source" parts={parts} unite="visiteurs" />
            </div>

            <SectionHeader>📊 Détail par source</SectionHeader>
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
                <thead><tr>
                  <th>Source</th><th style={{ textAlign: 'right' }}>Visiteurs</th>
                  <th style={{ textAlign: 'right' }}>Événements</th><th style={{ textAlign: 'right' }}>Par visiteur</th>
                </tr></thead>
                <tbody>
                  {t.origines.map(o => (
                    <tr key={o.source}>
                      <td style={{ fontWeight: 700 }}>{libelleSource(o.source)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{o.visiteurs}</td>
                      <td style={{ textAlign: 'right' }}>{o.evenements}</td>
                      <td style={{ textAlign: 'right', color: 'var(--sa-muted)' }}>
                        {o.visiteurs ? Math.round((o.evenements / o.visiteurs) * 10) / 10 : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SectionHeader>↗️ Clics sortants vers les partenaires</SectionHeader>
            {t.total_clics === 0 ? (
              <div className="sa-alert warn" style={{ fontSize: 12.5 }}>
                Aucun clic sortant enregistré pour cette édition. Le suivi des clics vers les fiches,
                sites et réseaux des partenaires a été mis en service le 22/07/2026 — il est actif
                pour les opérations suivantes.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
                  <thead><tr><th>Partenaire</th><th style={{ textAlign: 'right' }}>Clics</th><th style={{ textAlign: 'right' }}>Joueurs</th></tr></thead>
                  <tbody>
                    {t.clics_par_partenaire.map(c => (
                      <tr key={c.partenaire_id}>
                        <td style={{ fontWeight: 700 }}>{c.nom}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{c.clics}</td>
                        <td style={{ textAlign: 'right' }}>{c.joueurs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {t.diagnostic && t.diagnostic.parties_sans_source > 0 && (
              <div className="sa-alert info" style={{ marginTop: 18, fontSize: 12.5 }}>
                <b>Instrumentation</b> — {t.diagnostic.parties_sans_source} parties sur {t.diagnostic.parties_totales} n&apos;ont
                pas de source rattachée. La source est bien captée à l&apos;arrivée mais n&apos;est pas reportée sur la partie créée :
                l&apos;attribution individuelle d&apos;un joueur à une campagne n&apos;est donc pas possible sur cette édition.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
