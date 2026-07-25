'use client'

/**
 * Retours CRM — suivi des dossiers partenaires apres signature.
 *
 * Les trois jalons (logo, facture, paiement) sont INDEPENDANTS et affiches comme tels.
 * Ne jamais deduire l un de l autre : un paiement encaisse n implique pas que la facture
 * ait ete emise dans l outil, et inversement.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchRetoursCrm, jalonsRetour, type RetourCrm } from '@/lib/administratif'

const euros = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export default function Page() {
  const [list, setList] = useState<RetourCrm[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')
  const [etat, setEtat] = useState('tous')

  useEffect(() => {
    fetchRetoursCrm().then(setList).finally(() => setCharge(false))
  }, [])

  const etats = useMemo(
    () => Array.from(new Set(list.map(r => r.etat).filter(Boolean) as string[])).sort(),
    [list]
  )

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    return list.filter(r => {
      if (etat !== 'tous' && r.etat !== etat) return false
      if (!t) return true
      return [r.enseigne, r.contact_nom, r.ville, r.offre].some(v => (v ?? '').toLowerCase().includes(t))
    })
  }, [list, q, etat])

  const total = filtres.reduce((a, r) => a + (r.montant ?? 0), 0)
  const encaisse = filtres.filter(r => r.paiement_recu).reduce((a, r) => a + (r.montant ?? 0), 0)

  const cell = { padding: '7px 9px', whiteSpace: 'nowrap' as const }

  return (
    <div className="sa-page">
      <PageHeader
        title="Retours CRM"
        subtitle={`${list.length} dossier${list.length > 1 ? 's' : ''}`}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          className="sa-input"
          placeholder="Rechercher une enseigne, un contact, une ville…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ maxWidth: 340 }}
        />
        <select className="sa-input" value={etat} onChange={e => setEtat(e.target.value)}>
          <option value="tous">Tous les états</option>
          {etats.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}

      {!charge && !filtres.length && (
        <EmptyState icon="📋" title="Aucun dossier" desc="Aucun retour ne correspond à cette sélection." />
      )}

      {!charge && filtres.length > 0 && (
        <>
          <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 8 }}>
            <b>{euros(total)}</b> engagés sur la sélection · <b>{euros(encaisse)}</b> encaissés.
            Les trois jalons sont indépendants : un paiement reçu n&apos;implique pas que la facture ait été émise.
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ ...cell, textAlign: 'left' }}>Enseigne</th>
                  <th style={{ ...cell, textAlign: 'left' }}>Contact</th>
                  <th style={{ ...cell, textAlign: 'left' }}>Ville</th>
                  <th style={{ ...cell, textAlign: 'left' }}>Offre</th>
                  <th style={{ ...cell, textAlign: 'right' }}>Montant</th>
                  <th style={{ ...cell, textAlign: 'left' }}>État</th>
                  <th style={{ ...cell, textAlign: 'left' }}>Jalons</th>
                  <th style={{ ...cell, textAlign: 'left' }}>Relance</th>
                </tr>
              </thead>
              <tbody>
                {filtres.map(r => (
                  <tr key={r.id}>
                    <td style={{ ...cell, fontWeight: 600 }}>{r.enseigne ?? '—'}</td>
                    <td style={cell}>
                      {r.contact_nom ?? '—'}
                      {r.contact_tel && (
                        <div className="sa-muted" style={{ fontSize: 10.5 }}>{r.contact_tel}</div>
                      )}
                    </td>
                    <td style={cell}>{r.ville ?? '—'}{r.cp ? ` (${r.cp})` : ''}</td>
                    <td style={cell}>{r.offre ?? r.produit ?? '—'}</td>
                    <td style={{ ...cell, textAlign: 'right', fontWeight: 600 }}>{euros(r.montant)}</td>
                    <td style={cell}>{r.etat ? <span className="sa-chip" style={{ fontSize: 10 }}>{r.etat}</span> : '—'}</td>
                    <td style={cell}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {jalonsRetour(r).map(j => (
                          <span
                            key={j.libelle}
                            title={j.libelle}
                            style={{
                              fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                              border: `1px solid ${j.fait ? '#2f7d4f' : 'var(--sa-border)'}`,
                              color: j.fait ? '#2f7d4f' : 'var(--sa-muted)',
                            }}
                          >
                            {j.libelle.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={cell}>
                      {r.date_relance ? new Date(r.date_relance).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
