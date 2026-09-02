'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader, EmptyState, SearchBar, useTri } from '@/components/dashboard/DashboardUI'
import { supabase } from '@/lib/supabase'
import { useDashboard } from '@/contexts/DashboardContext'
import type { DemandeRattachement } from '@/lib/types'

type Ligne = DemandeRattachement & { pro_nom: string; se_nom: string }
type Col = 'created_at' | 'pro_nom' | 'statut'

const STATUT_STYLE: Record<string, { bg: string; c: string; label: string }> = {
  en_attente: { bg: '#FEF3C7', c: '#92400E', label: 'En attente' },
  approuve: { bg: '#DCFCE7', c: '#166534', label: 'Approuvé' },
  refuse: { bg: '#FEE2E2', c: '#991B1B', label: 'Refusé' },
}

/**
 * Relie le parcours pro (/pro/rejoindre) a la creation d event cote SA.
 * On ne fabrique pas d event ici : on pre-remplit le wizard existant.
 */
function urlWizard(l: Ligne): string {
  const p = new URLSearchParams()
  if (l.pro_id) p.set('pro', l.pro_id)
  if (l.super_event_id) p.set('se', l.super_event_id)
  if (l.pro_nom) p.set('nom', l.pro_nom)
  if (l.date_debut_souhaite) p.set('d', l.date_debut_souhaite)
  if (l.date_fin_souhaite) p.set('f', l.date_fin_souhaite)
  return `/dashboard/wizard-event?${p.toString()}`
}

export default function Page() {
  const router = useRouter()
  const { openDrawer } = useDashboard()
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [charge, setCharge] = useState(true)
  const [enCours, setEnCours] = useState<number | null>(null)
  const { tri, onSort } = useTri<Col>('created_at')
  const [q, setQ] = useState('')

  async function recharger() {
    setCharge(true)
    const { data } = await supabase
      .from('demandes_rattachement_super_event')
      .select('*, pros(nom), super_events(nom)')
      .order('created_at', { ascending: false })
    const l: Ligne[] = (data ?? []).map((d: any) => ({ ...d, pro_nom: d.pros?.nom ?? d.pro_id, se_nom: d.super_events?.nom ?? d.super_event_id }))
    setLignes(l)
    setCharge(false)
  }

  useEffect(() => { recharger() }, [])

  async function traiter(id: number, statut: 'approuve' | 'refuse') {
    setEnCours(id)
    const { error } = await supabase.from('demandes_rattachement_super_event').update({ statut, traite_at: new Date().toISOString() }).eq('id', id)
    if (!error) setLignes(lignes.map(l => l.id === id ? { ...l, statut, traite_at: new Date().toISOString() } : l))
    setEnCours(null)
  }

  const nbEnAttente = lignes.filter(l => l.statut === 'en_attente').length

  const triees = useMemo(() => {
    const t = q.trim().toLowerCase()
    const base = t ? lignes.filter(l => [l.pro_nom, l.se_nom, l.offre].some(v => String(v ?? '').toLowerCase().includes(t))) : lignes
    return [...base].sort((a, b) => {
      const va = String(a[tri.col] ?? ''); const vb = String(b[tri.col] ?? '')
      return va.localeCompare(vb, 'fr') * (tri.asc ? 1 : -1)
    })
  }, [lignes, tri, q])

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="🤝 Demandes de participation"
          subtitle={`${lignes.length} demande${lignes.length > 1 ? 's' : ''}${nbEnAttente ? ` · ${nbEnAttente} en attente` : ''}`}
        />

        <SearchBar value={q} onChange={setQ} placeholder="Rechercher un pro, un super event, une offre…" />

        <div style={{ display: 'flex', gap: 4, marginBottom: 14, marginTop: 10 }}>
          {([['created_at', 'Date'], ['pro_nom', 'Pro'], ['statut', 'Statut']] as [Col, string][]).map(([c, l]) => (
            <button key={c} className={`sa-btn sm${tri.col === c ? ' primary' : ''}`} onClick={() => onSort(c)}>
              {l}{tri.col === c ? (tri.asc ? ' ▲' : ' ▼') : ''}
            </button>
          ))}
        </div>

        {charge && <div style={{ color: 'var(--sa-muted)', fontSize: 13.5 }}>Chargement…</div>}
        {!charge && lignes.length === 0 && <EmptyState title="Aucune demande pour le moment" />}
        {!charge && lignes.length > 0 && triees.length === 0 && <EmptyState title="Aucun résultat pour cette recherche" />}

        {!charge && triees.map(l => {
          const st = STATUT_STYLE[l.statut] ?? STATUT_STYLE.en_attente
          return (
            <div key={l.id} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 14, padding: 18, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>
                    <span onClick={() => openDrawer('pro', l.pro_id)} style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--sa-border)' }}>{l.pro_nom}</span>
                    <span style={{ color: 'var(--sa-muted)', fontWeight: 600 }}> → {l.se_nom}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginTop: 2 }}>Reçue le {new Date(l.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <span style={{ background: st.bg, color: st.c, fontSize: 11.5, fontWeight: 800, padding: '3px 9px', borderRadius: 99, height: 'fit-content' }}>{st.label}</span>
              </div>

              {l.offre && <div style={{ fontSize: 13.5, marginBottom: 6 }}><b>Offre :</b> {l.offre}</div>}
              {l.regle_jeu && <div style={{ fontSize: 13.5, marginBottom: 6 }}><b>Règle du jeu :</b> {l.regle_jeu}</div>}
              {(l.date_debut_souhaite || l.date_fin_souhaite) && (
                <div style={{ fontSize: 13.5, marginBottom: 6 }}><b>Dates souhaitées :</b> {l.date_debut_souhaite ?? '—'} → {l.date_fin_souhaite ?? '—'}</div>
              )}
              {Array.isArray(l.lots) && l.lots.length > 0 && (
                <div style={{ fontSize: 13.5, marginBottom: 6 }}>
                  <b>Lots proposés :</b>
                  <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                    {(l.lots as any[]).map((lot, i) => (
                      <li key={i}>{lot.titre} — {lot.valeur_euros}€ × {lot.quantite}</li>
                    ))}
                  </ul>
                </div>
              )}

              {l.statut === 'en_attente' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="sa-btn sm" disabled={enCours === l.id} onClick={() => traiter(l.id, 'approuve')} style={{ background: '#166534', color: '#fff' }}>Approuver</button>
                  <button className="sa-btn sm" disabled={enCours === l.id} onClick={() => traiter(l.id, 'refuse')}>Refuser</button>
                </div>
              )}

              {l.statut === 'approuve' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Ouvre le wizard EXISTANT deja rempli : rien n est ecrit ici, le SA valide. */}
                  <button className="sa-btn sm primary" onClick={() => router.push(urlWizard(l))}>
                    ✨ Créer l&apos;event depuis cette demande
                  </button>
                  <span style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}>
                    Le wizard s&apos;ouvre pré-rempli (pro, super event, dates) — rien n&apos;est enregistré avant votre validation.
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {!charge && lignes.some(l => l.statut === 'approuve') && (
          <div style={{ fontSize: 12.5, color: 'var(--sa-muted)', marginTop: 16, background: '#F8FAFC', padding: '10px 14px', borderRadius: 10 }}>
            Une demande approuvée ouvre le wizard de création pré-rempli. La conversion
            reste volontaire : aucun event n&apos;est créé tant que vous n&apos;avez pas validé.
          </div>
        )}
      </div>
    </div>
  )
}
