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
import { useDashboard } from '@/contexts/DashboardContext'

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

type Cle = keyof ProspectBtoB
export default function Page() {
  const { openDrawer } = useDashboard()
  const [list, setList] = useState<ProspectBtoB[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')
  const [triCle, setTriCle] = useState<Cle>('first_seen')
  const [triAsc, setTriAsc] = useState(false)

  useEffect(() => {
    fetchProspectsBtoB().then(setList).finally(() => setCharge(false))
  }, [])

  function trier(cle: Cle) {
    if (cle === triCle) setTriAsc(a => !a)
    else { setTriCle(cle); setTriAsc(true) }
  }

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    const base = !t ? list : list.filter(p =>
      [p.enseigne, p.nom, p.prenom, p.email, p.ville, p.secteur].some(v => (v ?? '').toLowerCase().includes(t)))
    const triee = [...base].sort((a, b) => {
      const va = a[triCle] ?? ''
      const vb = b[triCle] ?? ''
      const cmp = String(va).localeCompare(String(vb))
      return triAsc ? cmp : -cmp
    })
    return triee
  }, [list, q, triCle, triAsc])

  const flecheTri = (cle: Cle) => (triCle === cle ? (triAsc ? ' ▲' : ' ▼') : '')

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
                    <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('enseigne')}>Enseigne{flecheTri('enseigne')}</th>
                    <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('nom')}>Contact{flecheTri('nom')}</th>
                    <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('email')}>Email{flecheTri('email')}</th>
                    <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('ville')}>Ville{flecheTri('ville')}</th>
                    <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('secteur')}>Secteur{flecheTri('secteur')}</th>
                    <th style={{ ...cell, textAlign: 'left' }}>Lot gagné</th>
                    <th style={{ ...cell, textAlign: 'left' }}>Découvert via</th>
                    <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('optin')}>Opt-in{flecheTri('optin')}</th>
                    <th style={{ ...cell, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => trier('first_seen')}>Date{flecheTri('first_seen')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtres.map(p => (
                    <tr key={p.id} onClick={() => openDrawer('joueur', p.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ ...cell, fontWeight: 600 }}>{p.enseigne ?? '—'}</td>
                      <td style={cell}>
                        {[p.prenom, p.nom].filter(Boolean).join(' ') || '—'}
                        {p.tel && <div className="sa-muted" style={{ fontSize: 10.5 }}>{p.tel}</div>}
                      </td>
                      <td style={cell} onClick={e => e.stopPropagation()}>
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
