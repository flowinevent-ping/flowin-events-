'use client'

/**
 * Bons de commande.
 *
 * Deux montants coexistent et ne doivent jamais etre confondus :
 *   montant_ht_catalogue = le tarif de la grille
 *   montant_ht           = ce qui est reellement facture
 * Quand le catalogue n est pas renseigne, la remise n est PAS calculee — on ne suppose
 * pas que le facture est le tarif plein.
 *
 * L acceptation des CGV est une donnee juridique : elle est affichee avec sa version
 * et sa date, jamais reduite a une coche.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchBonsCommande, estSigne, remise, type BonCommande } from '@/lib/commercial'

const euros = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const dateFr = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')

export default function Page() {
  const [list, setList] = useState<BonCommande[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState<'tous' | 'signes' | 'en_attente'>('tous')

  useEffect(() => {
    fetchBonsCommande().then(setList).finally(() => setCharge(false))
  }, [])

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    return list.filter(b => {
      if (filtre === 'signes' && !estSigne(b)) return false
      if (filtre === 'en_attente' && estSigne(b)) return false
      if (!t) return true
      return [b.raison_sociale, b.ville, b.contact, b.offre_label, b.id].some(v =>
        (v ?? '').toLowerCase().includes(t))
    })
  }, [list, q, filtre])

  const signes = list.filter(estSigne)
  const htSigne = signes.reduce((a, b) => a + (b.montant_ht ?? 0), 0)
  const sansCgv = signes.filter(b => !b.cgv_acceptee_at).length

  const cell = { padding: '7px 9px', whiteSpace: 'nowrap' as const }

  return (
    <div className="sa-page">
      <PageHeader
        title="Bons de commande"
        subtitle={`${list.length} bon${list.length > 1 ? 's' : ''} · ${signes.length} signé${signes.length > 1 ? 's' : ''}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, marginBottom: 14 }}>
        {[
          { l: 'Bons émis', v: String(list.length) },
          { l: 'Signés', v: String(signes.length) },
          { l: 'HT signé', v: euros(htSigne) },
          { l: 'Signés sans CGV', v: String(sansCgv) },
        ].map(k => (
          <div key={k.l} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: '12px 12px' }}>
            <div style={{ fontSize: 21, fontWeight: 800 }}>{k.v}</div>
            <div className="sa-muted" style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 3 }}>
              {k.l}
            </div>
          </div>
        ))}
      </div>

      {sansCgv > 0 && (
        <div style={{
          marginBottom: 12, padding: '10px 12px', borderRadius: 10,
          border: '1px solid #b4791f', background: 'rgba(244,181,68,.10)', fontSize: 11.5, lineHeight: 1.5,
        }}>
          <b>{sansCgv} bon{sansCgv > 1 ? 's' : ''} signé{sansCgv > 1 ? 's' : ''} sans trace d&apos;acceptation des CGV.</b>{' '}
          La signature et l&apos;acceptation des conditions sont deux actes distincts : l&apos;une ne vaut pas l&apos;autre.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          className="sa-input"
          placeholder="Rechercher une raison sociale, une ville, un contact…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ maxWidth: 340 }}
        />
        {([['tous', 'Tous'], ['signes', 'Signés'], ['en_attente', 'En attente']] as const).map(([k, l]) => (
          <button key={k} className={`sa-btn sm${filtre === k ? ' primary' : ''}`} onClick={() => setFiltre(k)}>
            {l}
          </button>
        ))}
      </div>

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}

      {!charge && !filtres.length && (
        <EmptyState icon="🧾" title="Aucun bon" desc="Aucun bon de commande ne correspond à cette sélection." />
      )}

      {!charge && filtres.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ ...cell, textAlign: 'left' }}>Raison sociale</th>
                <th style={{ ...cell, textAlign: 'left' }}>Ville</th>
                <th style={{ ...cell, textAlign: 'left' }}>Offre</th>
                <th style={{ ...cell, textAlign: 'right' }}>HT facturé</th>
                <th style={{ ...cell, textAlign: 'right' }}>Catalogue</th>
                <th style={{ ...cell, textAlign: 'right' }}>Remise</th>
                <th style={{ ...cell, textAlign: 'right' }}>TTC</th>
                <th style={{ ...cell, textAlign: 'left' }}>Statut</th>
                <th style={{ ...cell, textAlign: 'left' }}>CGV</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map(b => {
                const r = remise(b)
                return (
                  <tr key={b.id}>
                    <td style={{ ...cell, fontWeight: 600 }}>
                      {b.raison_sociale ?? b.id}
                      {b.contact && <div className="sa-muted" style={{ fontSize: 10.5 }}>{b.contact}</div>}
                    </td>
                    <td style={cell}>{b.ville ?? '—'}{b.cp ? ` (${b.cp})` : ''}</td>
                    <td style={cell}>{b.offre_label ?? b.offre ?? '—'}</td>
                    <td style={{ ...cell, textAlign: 'right', fontWeight: 600 }}>{euros(b.montant_ht)}</td>
                    <td style={{ ...cell, textAlign: 'right', color: 'var(--sa-muted)' }}>
                      {euros(b.montant_ht_catalogue)}
                    </td>
                    <td style={{ ...cell, textAlign: 'right' }}>
                      {r == null ? <span className="sa-muted">—</span> : r > 0 ? `−${r} %` : '0 %'}
                    </td>
                    <td style={{ ...cell, textAlign: 'right' }}>{euros(b.montant_ttc)}</td>
                    <td style={cell}>
                      <span
                        className="sa-chip"
                        style={{
                          fontSize: 10, fontWeight: 700,
                          color: estSigne(b) ? '#2f7d4f' : 'var(--sa-muted)',
                          borderColor: estSigne(b) ? '#2f7d4f' : 'var(--sa-border)',
                        }}
                      >
                        {estSigne(b) ? 'Signé' : (b.statut ?? 'en attente')}
                      </span>
                      {b.date_signature && (
                        <div className="sa-muted" style={{ fontSize: 10 }}>{dateFr(b.date_signature)}</div>
                      )}
                    </td>
                    <td style={cell}>
                      {b.cgv_acceptee_at ? (
                        <>
                          <div style={{ fontSize: 11 }}>{b.cgv_version ?? 'version non précisée'}</div>
                          <div className="sa-muted" style={{ fontSize: 10 }}>{dateFr(b.cgv_acceptee_at)}</div>
                        </>
                      ) : (
                        <span className="sa-muted" style={{ fontSize: 11 }}>non acceptées</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
