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
import { fetchRetoursCrm, majRetourCrm, jalonsRetour, type RetourCrm } from '@/lib/administratif'

const euros = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

type Cle = keyof RetourCrm
export default function Page() {
  const [list, setList] = useState<RetourCrm[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')
  const [etat, setEtat] = useState('tous')
  const [triCle, setTriCle] = useState<Cle>('updated_at')
  const [triAsc, setTriAsc] = useState(false)
  const [ouvert, setOuvert] = useState<RetourCrm | null>(null)

  useEffect(() => {
    fetchRetoursCrm().then(setList).finally(() => setCharge(false))
  }, [])

  function trier(cle: Cle) {
    if (cle === triCle) setTriAsc(a => !a)
    else { setTriCle(cle); setTriAsc(true) }
  }
  const flecheTri = (cle: Cle) => (triCle === cle ? (triAsc ? ' ▲' : ' ▼') : '')

  const etats = useMemo(
    () => Array.from(new Set(list.map(r => r.etat).filter(Boolean) as string[])).sort(),
    [list]
  )

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    const base = list.filter(r => {
      if (etat !== 'tous' && r.etat !== etat) return false
      if (!t) return true
      return [r.enseigne, r.contact_nom, r.ville, r.offre].some(v => (v ?? '').toLowerCase().includes(t))
    })
    return [...base].sort((a, b) => {
      const va = a[triCle] ?? ''
      const vb = b[triCle] ?? ''
      if (triCle === 'montant') return triAsc ? (a.montant ?? 0) - (b.montant ?? 0) : (b.montant ?? 0) - (a.montant ?? 0)
      const cmp = String(va).localeCompare(String(vb))
      return triAsc ? cmp : -cmp
    })
  }, [list, q, etat, triCle, triAsc])

  async function majJalon(r: RetourCrm, champ: 'logo_envoye' | 'facture_emise' | 'paiement_recu') {
    const val = !r[champ]
    const ok = await majRetourCrm(r.id, { [champ]: val })
    if (ok) {
      const patch = { ...r, [champ]: val }
      setList(l => l.map(x => x.id === r.id ? patch : x))
      setOuvert(o => o && o.id === r.id ? patch : o)
    }
  }

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
                  <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('enseigne')}>Enseigne{flecheTri('enseigne')}</th>
                  <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('contact_nom')}>Contact{flecheTri('contact_nom')}</th>
                  <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('ville')}>Ville{flecheTri('ville')}</th>
                  <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('offre')}>Offre{flecheTri('offre')}</th>
                  <th style={{ ...cell, textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('montant')}>Montant{flecheTri('montant')}</th>
                  <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('etat')}>État{flecheTri('etat')}</th>
                  <th style={{ ...cell, textAlign: 'left' }}>Jalons</th>
                  <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('date_relance')}>Relance{flecheTri('date_relance')}</th>
                </tr>
              </thead>
              <tbody>
                {filtres.map(r => (
                  <tr key={r.id} onClick={() => setOuvert(r)} style={{ cursor: 'pointer' }}>
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

      {ouvert && (
        <>
          <div className="sa-drawer-bd" onClick={() => setOuvert(null)} />
          <div className="sa-drawer">
            <div className="sa-drawer-h">
              <div>
                <div className="sa-drawer-title">{ouvert.enseigne ?? 'Dossier'}</div>
                <div className="sa-drawer-sub">{ouvert.contact_nom ?? '—'}{ouvert.ville ? ` · ${ouvert.ville}` : ''}</div>
              </div>
              <button className="sa-drawer-close" onClick={() => setOuvert(null)}>×</button>
            </div>
            <div className="sa-drawer-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>CONTACT</div>
                  <div style={{ fontSize: 13 }}>{ouvert.contact_nom ?? '—'}</div>
                  {ouvert.contact_tel && <div style={{ fontSize: 12, color: 'var(--sa-muted)' }}>{ouvert.contact_tel}</div>}
                  {ouvert.contact_email && (
                    <div style={{ fontSize: 12 }}><a href={`mailto:${ouvert.contact_email}`}>{ouvert.contact_email}</a></div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginTop: 2 }}>
                    {ouvert.ville ?? '—'}{ouvert.cp ? ` (${ouvert.cp})` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>OFFRE</div>
                  <div style={{ fontSize: 13 }}>{ouvert.offre ?? ouvert.produit ?? '—'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{euros(ouvert.montant)}</div>
                  {ouvert.origine && <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>Origine : {ouvert.origine}</div>}
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>ÉTAT</div>
                  <input
                    className="sa-input"
                    value={ouvert.etat ?? ''}
                    onChange={e => setOuvert({ ...ouvert, etat: e.target.value })}
                    onBlur={() => majRetourCrm(ouvert.id, { etat: ouvert.etat }).then(ok => ok && setList(l => l.map(x => x.id === ouvert.id ? ouvert : x)))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>
                    JALONS — indépendants, à cocher un par un
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {([
                      ['logo_envoye', 'Logo envoyé'],
                      ['facture_emise', 'Facture émise'],
                      ['paiement_recu', 'Paiement reçu'],
                    ] as const).map(([champ, libelle]) => (
                      <label key={champ} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!ouvert[champ]} onChange={() => majJalon(ouvert, champ)} />
                        {libelle}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>DATE DE RELANCE</div>
                  <input
                    type="date"
                    className="sa-input"
                    value={ouvert.date_relance ?? ''}
                    onChange={e => setOuvert({ ...ouvert, date_relance: e.target.value })}
                    onBlur={() => majRetourCrm(ouvert.id, { date_relance: ouvert.date_relance }).then(ok => ok && setList(l => l.map(x => x.id === ouvert.id ? ouvert : x)))}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>NOTE</div>
                  <textarea
                    className="sa-input"
                    value={ouvert.note ?? ''}
                    onChange={e => setOuvert({ ...ouvert, note: e.target.value })}
                    onBlur={() => majRetourCrm(ouvert.id, { note: ouvert.note }).then(ok => ok && setList(l => l.map(x => x.id === ouvert.id ? ouvert : x)))}
                    style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
