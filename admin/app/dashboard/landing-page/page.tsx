'use client'

/**
 * Landing pages — inventaire des landings de prospection.
 *
 * `published` et `statut` sont deux informations DISTINCTES : une landing peut etre
 * marquee prete sans etre en ligne. Les deux sont affichees separement, jamais fusionnees
 * en un seul indicateur.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchLandings, type Landing } from '@/lib/administratif'

export default function Page() {
  const [list, setList] = useState<Landing[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    fetchLandings().then(setList).finally(() => setCharge(false))
  }, [])

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return list
    return list.filter(l => (l.nom ?? l.id).toLowerCase().includes(t))
  }, [list, q])

  const enLigne = list.filter(l => l.published === true).length

  return (
    <div className="sa-page">
      <PageHeader
        title="Landing pages"
        subtitle={`${list.length} landing${list.length > 1 ? 's' : ''} · ${enLigne} en ligne`}
      />

      <div style={{ marginBottom: 12 }}>
        <input
          className="sa-input"
          placeholder="Rechercher une landing…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}

      {!charge && !filtres.length && (
        <EmptyState icon="🌐" title="Aucune landing" desc={q ? 'Aucun résultat pour cette recherche.' : 'Aucune landing enregistrée.'} />
      )}

      {!charge && filtres.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 10 }}>
          {filtres.map(l => (
            <div key={l.id} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  aria-hidden
                  style={{
                    width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                    background: l.accent_color || 'var(--sa-border)',
                    border: '1px solid var(--sa-border)',
                  }}
                />
                <div style={{ fontSize: 13, fontWeight: 700 }}>{l.nom ?? l.id}</div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <span
                  className="sa-chip"
                  style={{
                    fontSize: 10, fontWeight: 700,
                    color: l.published ? '#2f7d4f' : 'var(--sa-muted)',
                    borderColor: l.published ? '#2f7d4f' : 'var(--sa-border)',
                  }}
                >
                  {l.published ? 'En ligne' : 'Hors ligne'}
                </span>
                {l.statut && <span className="sa-chip" style={{ fontSize: 10 }}>{l.statut}</span>}
                {l.module_jeu && <span className="sa-chip" style={{ fontSize: 10 }}>🎮 {l.module_jeu}</span>}
              </div>

              {l.deploy_url ? (
                <a
                  href={l.deploy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11.5, wordBreak: 'break-all' }}
                >
                  {l.deploy_url}
                </a>
              ) : (
                <div className="sa-muted" style={{ fontSize: 11.5 }}>Aucune URL de déploiement</div>
              )}

              {l.updated_at && (
                <div className="sa-muted" style={{ fontSize: 10, marginTop: 7 }}>
                  modifiée le {new Date(l.updated_at).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
