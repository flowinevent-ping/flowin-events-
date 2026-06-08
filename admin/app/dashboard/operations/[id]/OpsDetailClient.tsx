'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

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
  const [prix, setPrix] = useState<string>(landing?.pricing?.prix ?? landing?.pricing?.price ?? '')
  const [savingPrix, setSavingPrix] = useState(false)
  const [prixMsg, setPrixMsg] = useState('')

  const [f, setF] = useState({ nom: '', categorie: '', adresse: '', lat: '', lng: '', tel: '', site_web: '' })
  const [adding, setAdding] = useState(false)
  const [addMsg, setAddMsg] = useState('')

  if (!se) return <div style={S.page}><div style={S.wrap}>Super event introuvable.</div></div>

  const parrBy = (nom: string) => parr.find((p) => (p.commerce || '').toLowerCase() === (nom || '').toLowerCase())
  const accent = se.id === 'se-nds-2026' ? '#3B5CC4' : '#8B5CF6'

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
        couleur: accent, categorie: f.categorie || null, adresse: f.adresse || null,
        lat: f.lat ? Number(f.lat) : null, lng: f.lng ? Number(f.lng) : null,
        tel: f.tel || null, site_web: f.site_web || null, client_type: 'commerce',
        cfg: { titre: se.nom, accent, theme: 'nds' },
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
    <div style={S.page}>
      <div style={S.wrap}>
        <a href="/dashboard/operations" style={S.back}>← Super Events</a>
        <div style={S.head}>
          <div>
            <div style={{ ...S.kick, color: accent }}>SUPER EVENT</div>
            <h1 style={S.h1}>{se.nom}</h1>
            <div style={S.sub}>{se.id} · {se.date_d || '?'} → {se.date_f || '?'} · geofence {n(se.geofence_m)} m</div>
          </div>
        </div>

        {/* KPIs */}
        <div style={S.kpis}>
          <Kpi label="Commerces" value={n(se.commerces_total)} sub={`${n(se.commerces_actifs)} actifs · ${n(se.commerces_pending)} en attente`} c={accent} />
          <Kpi label="Payés" value={n(se.commerces_payes)} c="#37D399" />
          <Kpi label="Joueurs" value={n(se.joueurs)} sub={`${n(se.tickets)} tickets`} c="#22D3EE" />
          <Kpi label="Gains" value={n(se.gains)} sub={`${n(se.gains_utilises)} utilisés`} c="#F8B84E" />
          <Kpi label="Sponsors" value={n(se.sponsors)} sub={`${n(se.sponsors_valides)} validés`} c="#EC4899" />
        </div>

        {/* Pricing (NDS) */}
        {landing && (
          <Section title="Tarif de l'offre partenaire">
            <div style={S.row}>
              <input type="number" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="ex. 450" style={S.input} />
              <span style={S.eur}>€</span>
              <button onClick={savePrix} disabled={savingPrix} style={{ ...S.btn, background: accent }}>{savingPrix ? '…' : 'Enregistrer'}</button>
            </div>
            <div style={S.hint}>Piloté ici → la landing /nds l'affiche aussitôt (ISR 60 s). Vide = « Sur demande ».</div>
            {prixMsg && <div style={S.msg}>{prixMsg}</div>}
          </Section>
        )}

        {/* Partenaires */}
        <Section title={`Partenaires (${commerces.length})`}>
          {commerces.length === 0 && <div style={S.empty}>Aucun commerce rattaché.</div>}
          {commerces.map((c) => {
            const p = parrBy(c.nom)
            const festival = c.id === 'ev-nds-2026'
            return (
              <div key={c.id} style={S.com}>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 3, background: c.couleur || accent }} />
                <div style={{ flex: 1 }}>
                  <div style={S.comNom}>{c.nom}{festival && <span style={S.festTag}>QR FESTIVAL</span>}</div>
                  <div style={S.comMeta}>
                    {c.categorie || '—'}{c.adresse ? ' · ' + c.adresse : ''}{c.tel ? ' · ' + c.tel : ''}
                  </div>
                  <div style={S.comMeta}>
                    QR <code style={S.code}>{c.qr_token || '—'}</code>
                    {c.lat && c.lng ? ` · carte ✓` : ` · carte ✗`}
                    {c.site_web ? ' · site ✓' : ''}
                  </div>
                </div>
                <div style={S.comStats}>
                  <span style={{ ...S.pill, color: c.status === 'paye' ? '#37D399' : '#F8B84E' }}>{c.paiement || c.status || '—'}</span>
                  {p && <span style={S.parr}>{p.filleuls_confirmes} filleuls</span>}
                </div>
              </div>
            )
          })}
        </Section>

        {/* Ajouter un commerce */}
        <Section title="Ajouter un commerce partenaire">
          <div style={S.grid}>
            <input placeholder="Nom *" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} style={S.input} />
            <input placeholder="Catégorie" value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })} style={S.input} />
            <input placeholder="Adresse" value={f.adresse} onChange={(e) => setF({ ...f, adresse: e.target.value })} style={{ ...S.input, gridColumn: '1 / -1' }} />
            <input placeholder="Latitude (ex. 43.7223)" value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} style={S.input} />
            <input placeholder="Longitude (ex. 7.1121)" value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value })} style={S.input} />
            <input placeholder="Téléphone" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} style={S.input} />
            <input placeholder="Site web" value={f.site_web} onChange={(e) => setF({ ...f, site_web: e.target.value })} style={S.input} />
          </div>
          <button onClick={addCommerce} disabled={adding} style={{ ...S.btn, background: accent, marginTop: 12, width: '100%' }}>{adding ? 'Ajout…' : 'Créer le commerce (QR perso + carte)'}</button>
          <div style={S.hint}>Crée le pro + l'event rattaché, génère son QR perso, le place sur la carte. Lat/lng = position sur la carte du festival.</div>
          {addMsg && <div style={S.msg}>{addMsg}</div>}
        </Section>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, c }: { label: string; value: any; sub?: string; c: string }) {
  return (
    <div style={S.kpi}>
      <div style={{ ...S.kpiVal, color: c }}>{value}</div>
      <div style={S.kpiLbl}>{label}</div>
      {sub && <div style={S.kpiSub}>{sub}</div>}
    </div>
  )
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div style={S.section}><div style={S.secTitle}>{title}</div>{children}</div>
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#070510', color: '#f6f2ff', fontFamily: "'DM Sans',system-ui,sans-serif" },
  wrap: { maxWidth: 900, margin: '0 auto', padding: '24px 20px 60px' },
  back: { color: '#7E9BF2', textDecoration: 'none', fontSize: 13, fontWeight: 600 },
  head: { marginTop: 14, marginBottom: 18 },
  kick: { fontSize: 11, letterSpacing: '.2em', fontWeight: 700 },
  h1: { fontFamily: "'Fredoka','DM Sans',sans-serif", fontWeight: 600, fontSize: 26, margin: '4px 0 2px' },
  sub: { fontSize: 12, color: 'rgba(246,242,255,.45)' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 1, background: 'rgba(246,242,255,.1)', border: '1px solid rgba(246,242,255,.1)', borderRadius: 14, overflow: 'hidden', marginBottom: 22 },
  kpi: { background: '#0a0713', padding: '14px 12px' },
  kpiVal: { fontFamily: "'Fredoka','DM Sans',sans-serif", fontWeight: 600, fontSize: 24, lineHeight: 1 },
  kpiLbl: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700, color: 'rgba(246,242,255,.7)', marginTop: 6 },
  kpiSub: { fontSize: 10.5, color: 'rgba(246,242,255,.42)', marginTop: 3 },
  section: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(246,242,255,.12)', borderRadius: 16, padding: 18, marginBottom: 14 },
  secTitle: { fontFamily: "'Fredoka','DM Sans',sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 12 },
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  input: { background: '#0a0713', border: '1px solid rgba(246,242,255,.18)', borderRadius: 10, padding: '11px 12px', color: '#f6f2ff', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: '100%' },
  eur: { fontFamily: "'Fredoka','DM Sans',sans-serif", fontWeight: 600, fontSize: 18 },
  btn: { border: 'none', color: '#fff', fontFamily: "'Fredoka','DM Sans',sans-serif", fontWeight: 600, fontSize: 14, borderRadius: 10, padding: '11px 18px', cursor: 'pointer', whiteSpace: 'nowrap' },
  hint: { fontSize: 11.5, color: 'rgba(246,242,255,.45)', marginTop: 8, lineHeight: 1.45 },
  msg: { fontSize: 12.5, color: '#A6E15A', marginTop: 8 },
  empty: { color: 'rgba(246,242,255,.45)', fontSize: 13 },
  com: { display: 'flex', gap: 12, alignItems: 'stretch', padding: '12px 0', borderBottom: '1px solid rgba(246,242,255,.08)' },
  comNom: { fontFamily: "'Fredoka','DM Sans',sans-serif", fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 },
  festTag: { fontSize: 9, fontWeight: 700, color: '#0a0713', background: '#F8B84E', borderRadius: 5, padding: '2px 6px', letterSpacing: '.04em' },
  comMeta: { fontSize: 11.5, color: 'rgba(246,242,255,.5)', marginTop: 2 },
  code: { background: 'rgba(246,242,255,.1)', padding: '1px 6px', borderRadius: 5, fontSize: 11 },
  comStats: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, justifyContent: 'center' },
  pill: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.03em' },
  parr: { fontSize: 11, color: '#22D3EE', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 },
}
