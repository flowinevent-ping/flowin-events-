'use client'

/**
 * Prospection commerciale.
 *
 * `pas_interesse` FERME le dossier : un prospect refusé ne peut pas apparaitre en
 * relance en retard. Sans cette regle, la pile de relances se remplit de dossiers morts
 * et le compteur devient inexploitable.
 *
 * NE JAMAIS y faire figurer de societes de media ou de production : ce ne sont pas
 * des commerces prospectables pour ce produit.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchProspects, relanceEnRetard, type Prospect } from '@/lib/commercial'

const dateFr = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')

export default function Page() {
  const [list, setList] = useState<Prospect[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')
  const [ville, setVille] = useState('toutes')
  const [vue, setVue] = useState<'tous' | 'retard' | 'ouverts' | 'fermes'>('tous')

  useEffect(() => {
    fetchProspects().then(setList).finally(() => setCharge(false))
  }, [])

  const villes = useMemo(
    () => Array.from(new Set(list.map(p => p.ville).filter(Boolean) as string[])).sort(),
    [list]
  )

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    return list.filter(p => {
      if (ville !== 'toutes' && p.ville !== ville) return false
      if (vue === 'retard' && !relanceEnRetard(p)) return false
      if (vue === 'ouverts' && p.pas_interesse === true) return false
      if (vue === 'fermes' && p.pas_interesse !== true) return false
      if (!t) return true
      return [p.enseigne, p.ville, p.contact_nom, p.type_commerce].some(v =>
        (v ?? '').toLowerCase().includes(t))
    })
  }, [list, q, ville, vue])

  const ouverts = list.filter(p => p.pas_interesse !== true).length
  const enRetard = list.filter(p => relanceEnRetard(p)).length

  const cell = { padding: '7px 9px', whiteSpace: 'nowrap' as const }

  return (
    <div className="sa-page">
      <PageHeader
        title="Prospection"
        subtitle={`${list.length} fiche${list.length > 1 ? 's' : ''} · ${ouverts} ouverte${ouverts > 1 ? 's' : ''} · ${enRetard} relance${enRetard > 1 ? 's' : ''} en retard`}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          className="sa-input"
          placeholder="Rechercher une enseigne, un contact, un type…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <select className="sa-input" value={ville} onChange={e => setVille(e.target.value)}>
          <option value="toutes">Toutes les villes</option>
          {villes.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        {([['tous', 'Tout'], ['ouverts', 'Ouverts'], ['retard', 'Relances en retard'], ['fermes', 'Sans suite']] as const).map(([k, l]) => (
          <button key={k} className={`sa-btn sm${vue === k ? ' primary' : ''}`} onClick={() => setVue(k)}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 8 }}>
        Un prospect marqué sans suite est un dossier fermé : il n&apos;apparaît jamais en relance en retard.
      </div>

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}

      {!charge && !filtres.length && (
        <EmptyState icon="📞" title="Aucune fiche" desc="Aucun prospect ne correspond à cette sélection." />
      )}

      {!charge && filtres.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ ...cell, textAlign: 'left' }}>Enseigne</th>
                <th style={{ ...cell, textAlign: 'left' }}>Type</th>
                <th style={{ ...cell, textAlign: 'left' }}>Ville</th>
                <th style={{ ...cell, textAlign: 'left' }}>Contact</th>
                <th style={{ ...cell, textAlign: 'left' }}>État</th>
                <th style={{ ...cell, textAlign: 'left' }}>Relance</th>
                <th style={{ ...cell, textAlign: 'right' }}>Priorité</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map(p => {
                const retard = relanceEnRetard(p)
                return (
                  <tr key={p.id} style={p.pas_interesse ? { opacity: 0.55 } : undefined}>
                    <td style={{ ...cell, fontWeight: 600 }}>
                      {p.enseigne ?? '—'}
                      {p.adresse && <div className="sa-muted" style={{ fontSize: 10.5 }}>{p.adresse}</div>}
                    </td>
                    <td style={cell}>{p.type_commerce ?? '—'}</td>
                    <td style={cell}>{p.ville ?? '—'}{p.cp ? ` (${p.cp})` : ''}</td>
                    <td style={cell}>
                      {p.contact_nom ?? '—'}
                      {p.tel && <div className="sa-muted" style={{ fontSize: 10.5 }}>{p.tel}</div>}
                    </td>
                    <td style={cell}>
                      {p.pas_interesse ? (
                        <span className="sa-chip" style={{ fontSize: 10 }}>Sans suite</span>
                      ) : p.etat ? (
                        <span className="sa-chip" style={{ fontSize: 10 }}>{p.etat}</span>
                      ) : '—'}
                    </td>
                    <td style={{ ...cell, color: retard ? '#c46a6a' : undefined, fontWeight: retard ? 700 : undefined }}>
                      {dateFr(p.date_relance)}
                      {retard && <div style={{ fontSize: 10 }}>en retard</div>}
                    </td>
                    <td style={{ ...cell, textAlign: 'right' }}>{p.priorite ?? '—'}</td>
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
