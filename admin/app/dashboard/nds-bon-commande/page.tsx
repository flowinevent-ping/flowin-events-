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
import { fetchBonsCommande, majBonCommande, estSigne, remise, type BonCommande } from '@/lib/commercial'

const euros = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const dateFr = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')

const fLabel: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--sa-muted)', display: 'block', marginBottom: 4 }
const fInput: React.CSSProperties = { width: '100%', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: 'var(--sa-bg)', color: 'inherit' }

export default function Page() {
  const [list, setList] = useState<BonCommande[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState<'tous' | 'signes' | 'en_attente'>('tous')
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [brouillon, setBrouillon] = useState<Record<string, string>>({})
  const [enregistrement, setEnregistrement] = useState(false)

  const recharger = () => fetchBonsCommande().then(setList).finally(() => setCharge(false))
  useEffect(() => { recharger() }, [])

  const bon = list.find(b => b.id === ouvert) ?? null

  function ouvrir(b: BonCommande) {
    setOuvert(b.id)
    setBrouillon({
      statut: b.statut ?? 'brouillon',
      montant_ht: String(b.montant_ht ?? ''),
      date_signature: b.date_signature ?? '',
      signataire: b.signataire ?? '',
      cgv_acceptee_at: b.cgv_acceptee_at ? b.cgv_acceptee_at.slice(0, 10) : '',
      tel: b.tel ?? '',
      email: b.email ?? '',
      mention_particuliere: b.mention_particuliere ?? '',
    })
  }

  async function enregistrer() {
    if (!bon) return
    setEnregistrement(true)
    const ok = await majBonCommande(bon.id, {
      statut: brouillon.statut,
      montant_ht: brouillon.montant_ht ? Number(brouillon.montant_ht) : null,
      date_signature: brouillon.date_signature || null,
      signataire: brouillon.signataire || null,
      cgv_acceptee_at: brouillon.cgv_acceptee_at ? new Date(brouillon.cgv_acceptee_at).toISOString() : null,
      tel: brouillon.tel || null,
      email: brouillon.email || null,
      mention_particuliere: brouillon.mention_particuliere || null,
    })
    setEnregistrement(false)
    if (ok) { await recharger(); setOuvert(null) }
  }

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
                  <tr key={b.id} onClick={() => ouvrir(b)} style={{ cursor: 'pointer' }}>
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

      {bon && (
        <>
          <div onClick={() => setOuvert(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 100vw)', background: 'var(--sa-card)', borderLeft: '1px solid var(--sa-border)', zIndex: 41, overflowY: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{bon.raison_sociale ?? bon.id}</div>
                <div className="sa-muted" style={{ fontSize: 12 }}>{bon.ville ?? '—'}{bon.cp ? ` (${bon.cp})` : ''}</div>
              </div>
              <button className="sa-btn icon sm" onClick={() => setOuvert(null)}>×</button>
            </div>
            {bon.adresse && <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 14 }}>{bon.adresse}</div>}

            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--sa-muted)', margin: '14px 0 8px' }}>Offre</div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>{bon.offre_label ?? bon.offre ?? '—'}</div>
            <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 4 }}>Catalogue : {euros(bon.montant_ht_catalogue)}{(() => { const r = remise(bon); return r != null ? ` · remise ${r > 0 ? `−${r} %` : '0 %'}` : '' })()}</div>
            {bon.prestations_incluses && (
              <ul style={{ margin: '6px 0 4px', paddingLeft: 18, fontSize: 12 }}>
                {bon.prestations_incluses.split('\n').filter(Boolean).map(l => <li key={l} style={{ marginBottom: 3 }}>{l}</li>)}
              </ul>
            )}
            {bon.lot_descriptif && (
              <div className="sa-muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                Lot : {bon.lot_descriptif}{bon.lot_valeur != null ? ` (${euros(bon.lot_valeur)})` : ''}{bon.lot_validite ? ` — ${bon.lot_validite}` : ''}
              </div>
            )}
            {bon.lot_conditions && <div className="sa-muted" style={{ fontSize: 11, marginTop: 2 }}>{bon.lot_conditions}</div>}

            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--sa-muted)', margin: '18px 0 8px' }}>Suivi commercial</div>

            <label style={fLabel}>Statut</label>
            <select style={{ ...fInput, marginBottom: 10 }} value={brouillon.statut ?? ''} onChange={e => setBrouillon(p => ({ ...p, statut: e.target.value }))}>
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoyé</option>
              <option value="signe">Signé</option>
            </select>

            <label style={fLabel}>HT facturé (€)</label>
            <input style={{ ...fInput, marginBottom: 10 }} type="number" value={brouillon.montant_ht ?? ''} onChange={e => setBrouillon(p => ({ ...p, montant_ht: e.target.value }))} />

            <label style={fLabel}>Signataire</label>
            <input style={{ ...fInput, marginBottom: 10 }} value={brouillon.signataire ?? ''} onChange={e => setBrouillon(p => ({ ...p, signataire: e.target.value }))} />

            <label style={fLabel}>Date de signature</label>
            <input style={{ ...fInput, marginBottom: 10 }} type="date" value={brouillon.date_signature ?? ''} onChange={e => setBrouillon(p => ({ ...p, date_signature: e.target.value }))} />

            <label style={fLabel}>CGV acceptées le</label>
            <input style={{ ...fInput, marginBottom: 10 }} type="date" value={brouillon.cgv_acceptee_at ?? ''} onChange={e => setBrouillon(p => ({ ...p, cgv_acceptee_at: e.target.value }))} />
            {bon.cgv_version && <div className="sa-muted" style={{ fontSize: 10.5, marginTop: -6, marginBottom: 10 }}>Version {bon.cgv_version}</div>}

            <label style={fLabel}>Téléphone</label>
            <input style={{ ...fInput, marginBottom: 10 }} value={brouillon.tel ?? ''} onChange={e => setBrouillon(p => ({ ...p, tel: e.target.value }))} />

            <label style={fLabel}>Email</label>
            <input style={{ ...fInput, marginBottom: 10 }} value={brouillon.email ?? ''} onChange={e => setBrouillon(p => ({ ...p, email: e.target.value }))} />

            <label style={fLabel}>Mention particulière</label>
            <textarea style={{ ...fInput, minHeight: 60, resize: 'vertical', marginBottom: 16 }} value={brouillon.mention_particuliere ?? ''} onChange={e => setBrouillon(p => ({ ...p, mention_particuliere: e.target.value }))} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="sa-btn sm" onClick={() => setOuvert(null)}>Annuler</button>
              <button className="sa-btn sm primary" disabled={enregistrement} onClick={enregistrer}>{enregistrement ? '…' : '✓ Enregistrer'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
