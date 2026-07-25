'use client'

/**
 * Prospects B2B — contacts issus du formulaire de la landing Flowin.
 *
 * Un prospect B2B est un joueur portant le tag `btob`. Le tag est la SEULE source :
 * on ne devine pas la qualite B2B a partir d un autre champ.
 *
 * Quand la table est vide, la vue le dit et explique d ou viennent ces fiches — plutot
 * que d afficher un tableau vide qui laisse croire a une panne.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { supabase } from '@/lib/supabase'

interface ProspectBtoB {
  id: string
  prenom: string | null
  nom: string | null
  email: string | null
  tel: string | null
  ville: string | null
  enseigne: string | null
  secteur: string | null
  lot_gagne: string | null
  ticket_code: string | null
  decouverte: string | null
  optin: boolean | null
  first_seen: string | null
  tags: string[] | null
}

async function fetchProspectsBtoB(): Promise<ProspectBtoB[]> {
  const { data, error } = await supabase
    .from('joueurs')
    .select('id,prenom,nom,email,tel,ville,enseigne,secteur,lot_gagne,ticket_code,decouverte,optin,first_seen,tags')
    .contains('tags', ['btob'])
    .order('first_seen', { ascending: false, nullsFirst: false })
  if (error) { console.error('[fetchProspectsBtoB]', error.message); return [] }
  return (data as ProspectBtoB[]) ?? []
}

const dateFr = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')

export default function Page() {
  const [list, setList] = useState<ProspectBtoB[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    fetchProspectsBtoB().then(setList).finally(() => setCharge(false))
  }, [])

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return list
    return list.filter(p =>
      [p.enseigne, p.nom, p.prenom, p.email, p.ville, p.secteur].some(v => (v ?? '').toLowerCase().includes(t)))
  }, [list, q])

  const optin = list.filter(p => p.optin).length
  const cell = { padding: '7px 9px', whiteSpace: 'nowrap' as const }

  return (
    <div className="sa-page">
      <PageHeader
        title="Prospects B2B"
        subtitle={`${list.length} prospect${list.length > 1 ? 's' : ''} · ${optin} opt-in`}
      />

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}

      {!charge && !list.length && (
        <EmptyState
          icon="🎯"
          title="Aucun prospect B2B"
          desc="Ces fiches apparaissent lorsqu'un professionnel soumet le formulaire de la landing Flowin. Aucune soumission n'a été enregistrée à ce jour."
        />
      )}

      {!charge && list.length > 0 && (
        <>
          <input
            className="sa-input"
            placeholder="Rechercher une enseigne, un contact, une ville…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ maxWidth: 340, marginBottom: 12 }}
          />

          {!filtres.length ? (
            <EmptyState icon="🔍" title="Aucun résultat" desc="Aucun prospect ne correspond à cette recherche." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th style={{ ...cell, textAlign: 'left' }}>Enseigne</th>
                    <th style={{ ...cell, textAlign: 'left' }}>Contact</th>
                    <th style={{ ...cell, textAlign: 'left' }}>Email</th>
                    <th style={{ ...cell, textAlign: 'left' }}>Ville</th>
                    <th style={{ ...cell, textAlign: 'left' }}>Secteur</th>
                    <th style={{ ...cell, textAlign: 'left' }}>Lot gagné</th>
                    <th style={{ ...cell, textAlign: 'left' }}>Découvert via</th>
                    <th style={{ ...cell, textAlign: 'left' }}>Opt-in</th>
                    <th style={{ ...cell, textAlign: 'left' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtres.map(p => (
                    <tr key={p.id}>
                      <td style={{ ...cell, fontWeight: 600 }}>{p.enseigne ?? '—'}</td>
                      <td style={cell}>
                        {[p.prenom, p.nom].filter(Boolean).join(' ') || '—'}
                        {p.tel && <div className="sa-muted" style={{ fontSize: 10.5 }}>{p.tel}</div>}
                      </td>
                      <td style={cell}>
                        {p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : '—'}
                      </td>
                      <td style={cell}>{p.ville ?? '—'}</td>
                      <td style={cell}>{p.secteur ?? '—'}</td>
                      <td style={cell}>
                        {p.lot_gagne ?? '—'}
                        {p.ticket_code && (
                          <div className="sa-muted" style={{ fontSize: 10 }}><code>{p.ticket_code}</code></div>
                        )}
                      </td>
                      <td style={cell}>{p.decouverte ?? '—'}</td>
                      <td style={cell}>
                        <span
                          className="sa-chip"
                          style={{
                            fontSize: 10,
                            color: p.optin ? '#2f7d4f' : 'var(--sa-muted)',
                            borderColor: p.optin ? '#2f7d4f' : 'var(--sa-border)',
                          }}
                        >
                          {p.optin ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td style={cell}>{dateFr(p.first_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
