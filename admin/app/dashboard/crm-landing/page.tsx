'use client'

/**
 * CRM Landing pages — contacts issus des landings, toutes origines.
 *
 * Deux natures de flux coexistent ici et sont comptees SEPAREMENT :
 *   pipeline commercial (etats, montants) et collecte terrain (contacts seuls).
 * Le total general n est jamais presente comme un volume d affaires — seul le
 * pipeline commercial porte des montants.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchCrmLanding, COULEUR_ETAT, type LigneCrmLanding } from '@/lib/crmLanding'

const euros = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const dateFr = (s: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  return `${d.toLocaleDateString('fr-FR')} ${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

type Colonne = 'created_at' | 'enseigne' | 'source_label' | 'ville' | 'cp' | 'etat'

export default function Page() {
  const [list, setList] = useState<LigneCrmLanding[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')
  const [source, setSource] = useState('toutes')
  const [tri, setTri] = useState<{ col: Colonne; asc: boolean }>({ col: 'created_at', asc: false })

  useEffect(() => {
    fetchCrmLanding().then(setList).finally(() => setCharge(false))
  }, [])

  const sources = useMemo(
    () => Array.from(new Set(list.map(r => r.source_label))).sort(),
    [list]
  )

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    const out = list.filter(r => {
      if (source !== 'toutes' && r.source_label !== source) return false
      if (!t) return true
      return [r.enseigne, r.contact_nom, r.contact_email, r.ville].some(v => (v ?? '').toLowerCase().includes(t))
    })
    return out.sort((a, b) => {
      const va = (a[tri.col] ?? '') as string
      const vb = (b[tri.col] ?? '') as string
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return tri.asc ? cmp : -cmp
    })
  }, [list, q, source, tri])

  const commerciaux = filtres.filter(r => r.commercial)
  const terrain = filtres.filter(r => !r.commercial)
  const montant = commerciaux.reduce((a, r) => a + (r.montant ?? 0), 0)

  const trier = (col: Colonne) =>
    setTri(t => (t.col === col ? { col, asc: !t.asc } : { col, asc: true }))

  const cell = { padding: '7px 9px', whiteSpace: 'nowrap' as const }
  const th = (col: Colonne, label: string) => (
    <th
      style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
      onClick={() => trier(col)}
    >
      {label}{tri.col === col ? (tri.asc ? ' ▲' : ' ▼') : ''}
    </th>
  )

  return (
    <div className="sa-page">
      <PageHeader
        title="CRM Landing pages"
        subtitle={`${list.length} contact${list.length > 1 ? 's' : ''}, toutes origines`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8, marginBottom: 14 }}>
        {[
          { l: 'Contacts affichés', v: String(filtres.length) },
          { l: 'Pipeline commercial', v: String(commerciaux.length) },
          { l: 'Collecte terrain', v: String(terrain.length) },
          { l: 'Montant pipeline', v: euros(montant) },
        ].map(k => (
          <div key={k.l} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 21, fontWeight: 800 }}>{k.v}</div>
            <div className="sa-muted" style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 3 }}>
              {k.l}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 10, lineHeight: 1.5 }}>
        Deux natures de flux sont réunies ici. Le <b>pipeline commercial</b> porte des états et des montants ;
        la <b>collecte terrain</b> ne rassemble que des contacts. Le total général n&apos;est pas un volume d&apos;affaires —
        seul le montant du pipeline en est un.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          className="sa-input"
          placeholder="Rechercher un nom, un email, une ville…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <select className="sa-input" value={source} onChange={e => setSource(e.target.value)}>
          <option value="toutes">Toutes les origines</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}

      {!charge && !filtres.length && (
        <EmptyState icon="📥" title="Aucun contact" desc="Aucun contact ne correspond à cette sélection." />
      )}

      {!charge && filtres.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                {th('enseigne', 'Nom / Enseigne')}
                {th('source_label', 'Origine')}
                <th style={{ ...cell, textAlign: 'left' }}>Contact</th>
                {th('ville', 'Ville')}
                {th('cp', 'CP')}
                <th style={{ ...cell, textAlign: 'left' }}>Profil</th>
                {th('etat', 'État')}
                <th style={{ ...cell, textAlign: 'right' }}>Montant</th>
                {th('created_at', 'Date')}
              </tr>
            </thead>
            <tbody>
              {filtres.map(r => (
                <tr key={r.id}>
                  <td style={{ ...cell, fontWeight: 600 }}>{r.enseigne ?? '—'}</td>
                  <td style={cell}>
                    <span className="sa-chip" style={{ fontSize: 10 }}>{r.source_label}</span>
                  </td>
                  <td style={cell}>
                    {r.contact_email ? <a href={`mailto:${r.contact_email}`}>{r.contact_email}</a> : '—'}
                    {r.contact_tel && <div className="sa-muted" style={{ fontSize: 10.5 }}>{r.contact_tel}</div>}
                  </td>
                  <td style={cell}>{r.ville ?? '—'}</td>
                  <td style={cell}>{r.cp ?? '—'}</td>
                  <td style={cell}>
                    {r.commercial
                      ? <span className="sa-muted">—</span>
                      : [r.bv_genre, r.bv_age].filter(Boolean).join(' · ') || <span className="sa-muted">—</span>}
                  </td>
                  <td style={cell}>
                    {r.etat ? (
                      <span
                        className="sa-chip"
                        style={{ fontSize: 10, color: COULEUR_ETAT[r.etat] ?? undefined, borderColor: COULEUR_ETAT[r.etat] ?? undefined }}
                      >
                        {r.etat.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="sa-muted" style={{ fontSize: 11 }}>hors pipeline</span>
                    )}
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>{euros(r.montant)}</td>
                  <td style={cell}>{dateFr(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
