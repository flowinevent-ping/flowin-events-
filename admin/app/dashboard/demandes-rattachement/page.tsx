'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState, SearchBar, useTri } from '@/components/dashboard/DashboardUI'
import { supabase } from '@/lib/supabase'
import { useDashboard } from '@/contexts/DashboardContext'
import type { DemandeRattachement } from '@/lib/types'

type Ligne = DemandeRattachement & { pro_nom: string; se_nom: string }
type Col = 'created_at' | 'pro_nom' | 'statut'

const STATUT_STYLE: Record<string, { bg: string; c: string; label: string }> = {
  en_attente: { bg: '#FEF3C7', c: '#92400E', label: 'En attente' },
  validee: { bg: '#DCFCE7', c: '#166534', label: 'Approuvée' },
  refusee: { bg: '#FEE2E2', c: '#991B1B', label: 'Refusée' },
}

export default function Page() {
  const { openDrawer } = useDashboard()
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [charge, setCharge] = useState(true)
  const [enCours, setEnCours] = useState<number | null>(null)
  const [erreur, setErreur] = useState('')
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

  const [info, setInfo] = useState('')

  /* REFERENTIEL 24/26 — approuver CREE la station, en une fois, avec tout ce que
     le pro a saisi (nom du commerce, adresse, GPS, lots) et le jeu du super
     event. Avant, l approbation ne changeait qu un statut puis ouvrait un
     wizard pre-rempli de 5 champs : adresse, lots et GPS etaient perdus. */
  async function approuver(l: Ligne) {
    setEnCours(l.id); setErreur(''); setInfo('')
    const { data, error } = await supabase.rpc('approuver_demande_rattachement', { p_id: l.id })
    const r = (data ?? {}) as { ok?: boolean; erreur?: string; event_id?: string | null; lots?: number }
    if (error || !r.ok) setErreur(`Demande non approuvée — ${error?.message ?? r.erreur ?? 'erreur inconnue'}`)
    else {
      setInfo(r.event_id
        ? `Station créée pour ${l.nom_commerce || l.pro_nom} — ${r.lots ?? 0} lot(s) enregistré(s).`
        : `${l.pro_nom} rattaché à ${l.se_nom} (annonceur, sans station).`)
      await recharger()
    }
    setEnCours(null)
  }

  async function refuser(id: number) {
    setEnCours(id); setErreur(''); setInfo('')
    const { error } = await supabase.from('demandes_rattachement_super_event').update({ statut: 'refusee', traite_at: new Date().toISOString() }).eq('id', id)
    if (error) setErreur(`Statut non enregistré — ${error.message}`)
    else setLignes(lignes.map(l => l.id === id ? { ...l, statut: 'refusee', traite_at: new Date().toISOString() } : l))
    setEnCours(null)
  }

  const nbEnAttente = lignes.filter(l => l.statut === 'en_attente').length

  const triees = useMemo(() => {
    const t = q.trim().toLowerCase()
    const base = t ? lignes.filter(l => [l.pro_nom, l.nom_commerce, l.se_nom, l.offre].some(v => String(v ?? '').toLowerCase().includes(t))) : lignes
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

        {info && (
          <div style={{ background: '#DCFCE7', color: '#166534', fontSize: 12.5, padding: '9px 12px', borderRadius: 9, marginBottom: 10 }}>{info}</div>
        )}
        {erreur && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 12.5, padding: '9px 12px', borderRadius: 9, marginBottom: 10 }}>{erreur}</div>
        )}

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
                    <span onClick={() => openDrawer('pro', l.pro_id)} style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--sa-border)' }}>{l.nom_commerce || l.pro_nom}</span>
                    {l.nom_commerce && l.nom_commerce !== l.pro_nom && <span style={{ color: 'var(--sa-muted)', fontWeight: 600, fontSize: 12.5 }}> ({l.pro_nom})</span>}
                    <span style={{ color: 'var(--sa-muted)', fontWeight: 600 }}> → {l.se_nom}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginTop: 2 }}>Reçue le {new Date(l.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <span style={{ background: st.bg, color: st.c, fontSize: 11.5, fontWeight: 800, padding: '3px 9px', borderRadius: 99, height: 'fit-content' }}>{st.label}</span>
              </div>

              <div style={{ fontSize: 13.5, marginBottom: 6 }}>
                <b>{l.persona === 'annonceur' ? 'Annonceur / sponsor' : 'Commerce participant'}</b>
                {l.categorie ? ` · ${l.categorie}` : ''}
              </div>
              {(l.adresse || l.ville) && (
                <div style={{ fontSize: 13.5, marginBottom: 6 }}><b>Adresse :</b> {[l.adresse, [l.code_postal, l.ville].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                  {l.lat != null && l.lng != null
                    ? <span style={{ color: 'var(--sa-muted)', fontSize: 12 }}> · GPS {l.lat}, {l.lng}</span>
                    : l.persona !== 'annonceur' && <span style={{ color: '#B45309', fontSize: 12 }}> · sans GPS : la station n’apparaîtra pas sur la carte</span>}
                </div>
              )}
              {l.offre && <div style={{ fontSize: 13.5, marginBottom: 6 }}><b>Offre :</b> {l.offre}</div>}
              {(l.date_debut_souhaite || l.date_fin_souhaite) && (
                <div style={{ fontSize: 13.5, marginBottom: 6 }}><b>Dates souhaitées :</b> {l.date_debut_souhaite ?? '—'} → {l.date_fin_souhaite ?? '—'}</div>
              )}
              {/* FAMILLE E : le pro coche une diffusion et l ecran lui disait
                  « demande envoyee automatiquement ». Rien n etait envoye, et
                  cet ecran ne l affichait pas : la demande n existait pour
                  personne. Elle est affichee ici, la ou le SA la traite. */}
              {(() => {
                const d = l as unknown as { diffusion_physique?: boolean; diffusion_digital?: boolean; diffusion_qr_tracking?: boolean }
                const quoi = [d.diffusion_physique && 'QR physique à imprimer', d.diffusion_digital && 'lien digital', d.diffusion_qr_tracking && 'QR de suivi'].filter(Boolean)
                return quoi.length > 0 ? (
                  <div style={{ fontSize: 13.5, marginBottom: 6 }}><b>Diffusion demandée :</b> {quoi.join(' · ')} <span style={{ color: '#B45309', fontSize: 12 }}>— à produire par Flowin</span></div>
                ) : null
              })()}
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
                  <button className="sa-btn sm" disabled={enCours === l.id} onClick={() => approuver(l)} style={{ background: '#166534', color: '#fff' }}>
                    {enCours === l.id ? '…' : l.persona === 'annonceur' ? 'Approuver' : 'Approuver et créer la station'}
                  </button>
                  <button className="sa-btn sm" disabled={enCours === l.id} onClick={() => refuser(l.id)}>Refuser</button>
                </div>
              )}

              {l.statut === 'validee' && l.event_id && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="sa-btn sm primary" onClick={() => openDrawer('event', l.event_id!)}>
                    Ouvrir la station
                  </button>
                  <code className="sa-code">{l.event_id}</code>
                </div>
              )}
            </div>
          )
        })}

      </div>
    </div>
  )
}
