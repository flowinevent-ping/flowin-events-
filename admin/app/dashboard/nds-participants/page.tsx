'use client'

/**
 * Participants d un super event.
 * Liste filtrable et exportable, avec l activite reelle de chaque joueur.
 * Les dates affichees sont des jours d exploitation : une partie jouee a 3h du
 * matin appartient a la soiree de la veille.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchParticipants, type Participant } from '@/lib/nds'

const PAGE = 50
const fr = (d: string | null) => {
  if (!d) return '—'
  const p = d.split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}` : d
}

export default function Page() {
  const [liste, setListe] = useState<Participant[] | null>(null)
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState<'tous' | 'optin' | 'fideles'>('tous')
  const [limite, setLimite] = useState(PAGE)

  useEffect(() => { fetchParticipants().then(setListe) }, [])

  const filtres = useMemo(() => {
    let r = liste ?? []
    if (filtre === 'optin') r = r.filter(p => p.optin)
    if (filtre === 'fideles') r = r.filter(p => (p.nb_parties ?? 0) >= 3)
    const t = q.trim().toLowerCase()
    if (t) {
      r = r.filter(p => [p.nom, p.prenom, p.email, p.tel, p.code_postal]
        .some(v => String(v ?? '').toLowerCase().includes(t)))
    }
    return r
  }, [liste, q, filtre])

  useEffect(() => { setLimite(PAGE) }, [q, filtre])

  const stats = useMemo(() => {
    const l = liste ?? []
    const optin = l.filter(p => p.optin).length
    const parties = l.reduce((s, p) => s + (p.nb_parties ?? 0), 0)
    return {
      total: l.length,
      optin,
      pctOptin: l.length ? Math.round((optin / l.length) * 1000) / 10 : 0,
      moyenne: l.length ? Math.round((parties / l.length) * 10) / 10 : 0,
    }
  }, [liste])

  function exporterCsv() {
    const entetes = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Code postal', 'Opt-in', 'Parties', 'Tickets', 'Première', 'Dernière']
    const lignes = filtres.map(p => [
      p.nom, p.prenom, p.email, p.tel, p.code_postal,
      p.optin ? 'oui' : 'non', p.nb_parties, p.nb_tickets, p.premiere, p.derniere,
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))
    const csv = '\uFEFF' + [entetes.join(';'), ...lignes].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `participants-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="👥 Participants" subtitle="Joueurs du super event et leur activité" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
          {([['Participants', stats.total], ['Acceptent le contact', stats.optin],
             ['Taux d\u2019opt-in', `${stats.pctOptin} %`], ['Parties par joueur', stats.moyenne]] as [string, string | number][])
            .map(([lib, val]) => (
            <div key={lib} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: '16px 14px' }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{val}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 4 }}>{lib}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un nom, un email, un code postal…"
            style={{ flex: 1, minWidth: 220, padding: '9px 12px', border: '1px solid var(--sa-border)', borderRadius: 9, fontSize: 13.5 }} />
          {(['tous', 'optin', 'fideles'] as const).map(f => (
            <button key={f} className={`sa-btn sm${filtre === f ? ' primary' : ''}`} onClick={() => setFiltre(f)}>
              {f === 'tous' ? 'Tous' : f === 'optin' ? 'Opt-in' : '3 parties et +'}
            </button>
          ))}
          <button className="sa-btn sm" onClick={exporterCsv} disabled={!filtres.length}>⬇ Export CSV</button>
          <span style={{ fontSize: 12, color: 'var(--sa-muted)', marginLeft: 'auto' }}>
            {filtres.length} résultat{filtres.length > 1 ? 's' : ''}{liste && filtres.length !== liste.length ? ` sur ${liste.length}` : ''}
          </span>
        </div>

        {liste === null && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}
        {liste !== null && filtres.length === 0 && <EmptyState title="Aucun participant pour cette sélection" />}

        {filtres.slice(0, limite).map(p => (
          <div key={p.joueur_id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '9px 12px', background: 'var(--sa-subtle)', borderRadius: 9, marginBottom: 5 }}>
            <span style={{ flex: 1, minWidth: 170 }}>
              <b style={{ fontSize: 13 }}>{[p.prenom, p.nom].filter(Boolean).join(' ') || '—'}</b>
              <span style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}>{p.code_postal ? ` · ${p.code_postal}` : ''}</span>
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--sa-muted)', minWidth: 170 }}>{p.email ?? '—'}</span>
            <span className="sa-chip past" title="Parties jouées">{p.nb_parties} partie{(p.nb_parties ?? 0) > 1 ? 's' : ''}</span>
            <span style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}>{fr(p.premiere)} → {fr(p.derniere)}</span>
            {p.optin && <span className="sa-chip live">✓ Contact</span>}
          </div>
        ))}

        {filtres.length > limite && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button className="sa-btn sm" onClick={() => setLimite(l => l + PAGE)}>
              Voir {PAGE} de plus ({filtres.length - limite} restants)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
