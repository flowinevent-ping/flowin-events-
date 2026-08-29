'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, KpiCard, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'

type Se = any
type Com = {
  id: string; nom: string; categorie: string | null; status: string | null; paiement: string | null
  adresse: string | null; lat: number | null; lng: number | null; tel: string | null; site_web: string | null
  couleur: string | null; qr_token: string | null; pro_nom: string | null
}
type Parr = { commerce: string; parrainages_total: number; filleuls_confirmes: number; en_attente: number; tickets_attribues: number }

const n = (v: any) => (v == null ? 0 : v)
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24)

export default function OpsDetailClient({ se, commerces, parr, landing }: { se: Se; commerces: Com[]; parr: Parr[]; landing: any }) {
  const { openDrawer } = useDashboard()

  const [prix, setPrix] = useState<string>(landing?.pricing?.prix ?? landing?.pricing?.price ?? '')
  const [savingPrix, setSavingPrix] = useState(false)
  const [prixMsg, setPrixMsg] = useState('')

  const [f, setF] = useState({ nom: '', categorie: '', adresse: '', lat: '', lng: '', tel: '', site_web: '' })
  const [adding, setAdding] = useState(false)
  const [addMsg, setAddMsg] = useState('')

  if (!se) return <div className="sa-content"><div className="sa-page"><div style={{ padding: 24 }}>Super event introuvable.</div></div></div>

  const parrBy = (nom: string) => parr.find((p) => (p.commerce || '').toLowerCase() === (nom || '').toLowerCase())

  async function savePrix() {
    setSavingPrix(true); setPrixMsg('')
    try {
      const cur = landing?.pricing || {}
      const value = prix === '' ? null : Number(prix)
      const { error } = await supabase.from('landings').update({ pricing: { ...cur, prix: value }, updated_at: new Date().toISOString() }).eq('id', 'ld-nds-2026')
      setPrixMsg(error ? 'Erreur : ' + error.message : value == null ? 'Prix retiré (affiche « Sur demande »).' : `Prix enregistré : ${value} €.`)
    } catch (e: any) { setPrixMsg('Erreur : ' + (e?.message || e)) }
    setSavingPrix(false)
  }

  async function addCommerce() {
    if (!f.nom.trim()) { setAddMsg('Nom requis.'); return }
    setAdding(true); setAddMsg('')
    try {
      const rand = Math.random().toString(36).slice(2, 6)
      const sl = slug(f.nom) || 'commerce'
      const proId = `pro-${sl}-${rand}`
      const evId = `ev-${se.id}-${sl}-${rand}`.slice(0, 60)
      const { error: e1 } = await supabase.from('pros').insert({ id: proId, nom: f.nom.trim(), ville: 'Vence', code_postal: '06140', secteur: f.categorie || 'Commerce', tel: f.tel || null, abonne: false })
      if (e1) throw e1
      const { error: e2 } = await supabase.from('events').insert({
        id: evId, pro_id: proId, nom: f.nom.trim(), module: 'spin', status: 'upcoming', super_event_id: se.id,
        couleur: '#8B5CF6', categorie: f.categorie || null, adresse: f.adresse || null,
        lat: f.lat ? Number(f.lat) : null, lng: f.lng ? Number(f.lng) : null,
        tel: f.tel || null, site_web: f.site_web || null, client_type: 'commerce',
        cfg: { titre: se.nom, accent: '#8B5CF6', theme: 'nds' },
      })
      if (e2) throw e2
      const { data: cur } = await supabase.from('super_events').select('events').eq('id', se.id).single()
      const evs = Array.from(new Set([...(((cur as any)?.events) || []), evId]))
      await supabase.from('super_events').update({ events: evs }).eq('id', se.id)
      setAddMsg('Commerce ajouté. Rechargement…')
      setTimeout(() => location.reload(), 700)
    } catch (e: any) { setAddMsg('Erreur : ' + (e?.message || e)); setAdding(false) }
  }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title={`⭐ ${se.nom}`}
          subtitle={`${se.id} · ${se.date_d || '?'} → ${se.date_f || '?'} · geofence ${n(se.geofence_m)} m`}
          actions={<Link href="/dashboard/operations" className="sa-btn sm">← Super Events</Link>}
        />
        <div style={{ padding: '0 24px 24px' }}>

          <div className="sa-kpi-grid" style={{ marginTop: 4, marginBottom: 20, gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))' }}>
            <KpiCard label="Commerces" value={n(se.commerces_total)} sub={`${n(se.commerces_actifs)} actifs · ${n(se.commerces_pending)} en attente`} />
            <KpiCard label="Payés" value={n(se.commerces_payes)} sub="commerces" />
            <KpiCard label="Joueurs" value={n(se.joueurs)} sub={`${n(se.tickets)} tickets`} />
            <KpiCard label="Billets" value={n(se.gains) - n(se.gains_utilises)} sub={`actifs · ${n(se.gains_utilises)} utilisés sur ${n(se.gains)}`} />
            <KpiCard label="Sponsors" value={n(se.sponsors)} sub={`${n(se.sponsors_valides)} validés`} />
          </div>

          {landing && (
            <div className="sa-card" style={{ padding: 18, marginBottom: 16 }}>
              <SectionHeader>💶 Tarif de l'offre partenaire</SectionHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="sa-input" type="number" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="ex. 450" style={{ maxWidth: 160 }} />
                <span style={{ fontWeight: 800, fontSize: 16 }}>€</span>
                <button className="sa-btn primary" onClick={savePrix} disabled={savingPrix}>{savingPrix ? '…' : 'Enregistrer'}</button>
              </div>
              <div className="sa-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
                Piloté ici → la landing /nds l'affiche aussitôt (ISR 60 s). Vide = « Sur demande ».
              </div>
              {prixMsg && <div style={{ fontSize: 12.5, color: 'var(--sa-accent)', marginTop: 8 }}>{prixMsg}</div>}
            </div>
          )}

          <div className="sa-card" style={{ padding: 18, marginBottom: 16 }}>
            <SectionHeader>🤝 Partenaires ({commerces.length})</SectionHeader>
            <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 8 }}>Toucher un commerce ouvre sa fiche event détaillée.</div>
            {commerces.length === 0 && <EmptyState title="Aucun commerce rattaché" />}
            {commerces.map((c) => {
              const p = parrBy(c.nom)
              const festival = c.id === 'ev-nds-2026'
              return (
                <div
                  key={c.id} className="sa-list-item" style={{ cursor: 'pointer' }}
                  onClick={() => openDrawer('event', c.id)}
                >
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 3, background: c.couleur || 'var(--sa-accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                      {c.nom}
                      {festival && <span className="sa-chip warn" style={{ fontSize: 9 }}>QR FESTIVAL</span>}
                    </div>
                    <div className="sa-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                      {c.categorie || '—'}{c.adresse ? ' · ' + c.adresse : ''}{c.tel ? ' · ' + c.tel : ''}
                    </div>
                    <div className="sa-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                      QR <code className="sa-code">{c.qr_token || '—'}</code>
                      {c.lat && c.lng ? ` · carte ✓` : ` · carte ✗`}
                      {c.site_web ? ' · site ✓' : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <span className={`sa-chip ${c.status === 'paye' || c.paiement === 'paye' ? 'live' : 'warn'}`}>{c.paiement || c.status || '—'}</span>
                    {p && <span className="sa-muted" style={{ fontSize: 11, fontWeight: 700 }}>{p.filleuls_confirmes} filleuls</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="sa-card" style={{ padding: 18 }}>
            <SectionHeader>➕ Ajouter un commerce partenaire</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input className="sa-input" placeholder="Nom *" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />
              <input className="sa-input" placeholder="Catégorie" value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })} />
              <input className="sa-input" placeholder="Adresse" value={f.adresse} onChange={(e) => setF({ ...f, adresse: e.target.value })} style={{ gridColumn: '1 / -1' }} />
              <input className="sa-input" placeholder="Latitude (ex. 43.7223)" value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} />
              <input className="sa-input" placeholder="Longitude (ex. 7.1121)" value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value })} />
              <input className="sa-input" placeholder="Téléphone" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} />
              <input className="sa-input" placeholder="Site web" value={f.site_web} onChange={(e) => setF({ ...f, site_web: e.target.value })} />
            </div>
            <button className="sa-btn primary" onClick={addCommerce} disabled={adding} style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
              {adding ? 'Ajout…' : 'Créer le commerce (QR perso + carte)'}
            </button>
            <div className="sa-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
              Crée le pro + l'event rattaché, génère son QR perso, le place sur la carte. Lat/lng = position sur la carte du festival.
            </div>
            {addMsg && <div style={{ fontSize: 12.5, color: 'var(--sa-accent)', marginTop: 8 }}>{addMsg}</div>}
          </div>

        </div>
      </div>
    </div>
  )
}
