'use client'

/**
 * Dashboard Pro — Comptes & participation.
 * Migration/verification : branche le Pro sur les VRAIES tables SA (pros / partenaires / events)
 * et montre, pour chaque compte raccorde, son event et son emplacement sur le Super Event NDS 2026.
 * Lecture seule (aucune ecriture). Prouve la regle : le Pro = surface filtree sur le moteur SA.
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/dashboard/DashboardUI'

type Part = { id: string; nom: string; ville: string | null; statut_paiement: string | null; latitude: number | null; longitude: number | null; event_id: string | null; image_url: string | null; actif: boolean | null }
type Ev = { id: string; nom: string | null; pro_id: string | null; module: string | null }
type Pro = { id: string; nom: string | null; partenaire_id: string | null; abonne: boolean | null }

const SE = 'se-nds-2026'

export default function ProComptesPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [evs, setEvs] = useState<Record<string, Ev>>({})
  const [prosByPart, setProsByPart] = useState<Record<string, Pro>>({})
  const [charge, setCharge] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [p, e, pr] = await Promise.all([
          supabase.from('partenaires').select('id,nom,ville,statut_paiement,latitude,longitude,event_id,image_url,actif').eq('super_event_id', SE).order('nom'),
          supabase.from('events').select('id,nom,pro_id,module').eq('super_event_id', SE),
          supabase.from('pros').select('id,nom,partenaire_id,abonne'),
        ])
        setParts((p.data ?? []) as Part[])
        const em: Record<string, Ev> = {}
        ;((e.data ?? []) as Ev[]).forEach(x => { em[x.id] = x })
        setEvs(em)
        const pm: Record<string, Pro> = {}
        ;((pr.data ?? []) as Pro[]).forEach(x => { if (x.partenaire_id) pm[x.partenaire_id] = x })
        setProsByPart(pm)
      } finally {
        setCharge(false)
      }
    })()
  }, [])

  const nbCompte = parts.filter(p => prosByPart[p.id]).length
  const nbGeo = parts.filter(p => p.latitude != null).length
  const nbEvent = parts.filter(p => p.event_id).length

  const card: React.CSSProperties = { background: 'var(--sa-card,#fff)', border: '1px solid var(--sa-border,#E2E8F0)', borderRadius: 16, padding: 16, marginBottom: 14 }
  const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--sa-muted,#64748B)', padding: '8px 10px', borderBottom: '1px solid var(--sa-border,#E2E8F0)' }
  const td: React.CSSProperties = { padding: '11px 10px', borderBottom: '1px solid var(--sa-border,#E2E8F0)', fontSize: 13, verticalAlign: 'middle' }
  const badge = (ok: boolean): React.CSSProperties => ({ fontSize: 11, fontWeight: 800, borderRadius: 99, padding: '3px 9px', background: ok ? 'rgba(34,197,94,.12)' : 'var(--sa-subtle,#F8FAFC)', color: ok ? '#15803D' : 'var(--sa-muted,#64748B)' })

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="Comptes & participation" subtitle="Super Event Nuits du Sud 2026 — comptes raccordés, events et emplacements (données réelles)" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900, color: 'var(--sa-accent,#7C2D92)' }}>{parts.length}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>partenaires NDS 2026</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{nbCompte}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>comptes pro raccordés</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{nbEvent}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>events rattachés</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{nbGeo}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>épinglés sur la carte</div></div>
        </div>

        {charge ? <div className="sa-muted" style={{ fontSize: 13 }}>Chargement des données réelles…</div> : (
          <div style={{ ...card, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead><tr><th style={th}>Partenaire</th><th style={th}>Compte pro</th><th style={th}>Event rattaché</th><th style={th}>Emplacement carte</th><th style={th}>Paiement</th></tr></thead>
              <tbody>
                {parts.map(p => {
                  const ev = p.event_id ? evs[p.event_id] : undefined
                  const pro = prosByPart[p.id]
                  return (
                    <tr key={p.id}>
                      <td style={td}><b>{p.nom}</b>{p.ville ? <span style={{ color: 'var(--sa-muted,#64748B)' }}> · {p.ville}</span> : null}</td>
                      <td style={td}><span style={badge(!!pro)}>{pro ? '✓ raccordé' : '—'}</span></td>
                      <td style={td}>{ev ? <span>{ev.nom ?? ev.id}{ev.module ? <span style={{ color: 'var(--sa-muted,#64748B)' }}> · {ev.module}</span> : null}</span> : <span style={{ color: 'var(--sa-muted,#64748B)' }}>—</span>}</td>
                      <td style={td}><span style={badge(p.latitude != null)}>{p.latitude != null ? '📍 épinglé' : '—'}</span></td>
                      <td style={td}><span style={{ color: 'var(--sa-muted,#64748B)' }}>{p.statut_paiement ?? '—'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ ...card, background: 'var(--sa-subtle,#F8FAFC)', fontSize: 12.5, color: 'var(--sa-muted,#64748B)', lineHeight: 1.6 }}>
          Ces comptes existent déjà dans la base (tables <code>pros</code> / <code>partenaires</code>) et sont raccordés à leurs events et à leur emplacement sur le super. Le Dashboard Pro les lit tels quels — aucune donnée dupliquée. La couche compte/connexion (email + PIN par <code>pro_id</code>) reste l&apos;étape suivante pour ouvrir l&apos;accès à chaque pro.
        </div>
      </div>
    </div>
  )
}
