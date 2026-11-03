'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState, SearchBar } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'
import CarteRappel from '@/components/dashboard/CarteRappel'
import { fetchDemandesRappel, marquerRappel, type DemandeRappel } from '@/lib/demandesRappel'

export default function Page() {
  const { openDrawer } = useDashboard()
  const [lignes, setLignes] = useState<DemandeRappel[]>([])
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [filtre, setFiltre] = useState<'nouvelle' | 'traitee' | 'toutes'>('nouvelle')
  const [q, setQ] = useState('')

  useEffect(() => { fetchDemandesRappel().then(setLignes).finally(() => setCharge(false)) }, [])

  async function basculer(d: DemandeRappel) {
    setErreur('')
    const vers = d.statut === 'nouvelle'
    const ok = await marquerRappel(d.id, vers)
    if (!ok) { setErreur('Statut non enregistré (droits Super Admin requis).'); return }
    setLignes(l => l.map(x => x.id === d.id ? { ...x, statut: vers ? 'traitee' : 'nouvelle', traitee_at: vers ? new Date().toISOString() : null } : x))
  }

  const nb = lignes.filter(l => l.statut === 'nouvelle').length
  const vues = useMemo(() => {
    const t = q.trim().toLowerCase()
    return lignes.filter(l => (filtre === 'toutes' || l.statut === filtre)
      && (!t || [l.prenom, l.nom, l.entreprise, l.ville, l.email, l.tel, l.message].some(v => String(v ?? '').toLowerCase().includes(t))))
  }, [lignes, filtre, q])

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="Demandes de rappel" subtitle={`${lignes.length} demande${lignes.length > 1 ? 's' : ''}${nb ? ` · ${nb} à rappeler` : ''}`} />
        {erreur && <div style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 12.5, padding: '9px 12px', borderRadius: 9, marginBottom: 10 }}>{erreur}</div>}
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher un nom, une entreprise, un email…" />
        <div style={{ display: 'flex', gap: 6, margin: '10px 0 14px' }}>
          {([['nouvelle', `À rappeler (${nb})`], ['traitee', 'Traitées'], ['toutes', 'Toutes']] as ['nouvelle' | 'traitee' | 'toutes', string][]).map(([v, l]) => (
            <button key={v} className={`sa-btn sm${filtre === v ? ' primary' : ''}`} onClick={() => setFiltre(v)}>{l}</button>
          ))}
        </div>
        {charge && <div style={{ color: 'var(--sa-muted)', fontSize: 13.5 }}>Chargement…</div>}
        {!charge && vues.length === 0 && <EmptyState title={filtre === 'nouvelle' ? 'Aucune demande à rappeler' : 'Aucune demande'} />}
        {!charge && vues.map(d => <CarteRappel key={d.id} d={d} onBascule={basculer} onPro={id => openDrawer('pro', id)} />)}
      </div>
    </div>
  )
}
