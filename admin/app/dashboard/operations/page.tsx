import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PageHeader, KpiCard, StatusChip, EmptyState } from '@/components/dashboard/DashboardUI'

export const revalidate = 30 // ISR

export const metadata = { title: 'Flowin — Opérations Super Events' }

type Row = {
  id: string; nom: string; status: string; date_d: string | null; date_f: string | null
  geofence_m: number | null
  commerces_total: number | null; commerces_actifs: number | null; commerces_pending: number | null; commerces_payes: number | null
  joueurs: number | null; tickets: number | null; gains: number | null; gains_utilises: number | null
  sponsors: number | null; sponsors_valides: number | null; sponsoring_encaisse: number | null
  ca_pros: number | null; part_flowin_sponsoring: number | null
}

const n = (v: number | null | undefined) => (v == null ? 0 : v)
const eur = (v: number | null | undefined) => `${n(v).toLocaleString('fr-FR')} €`

export default async function OperationsPage() {
  const { data, error } = await supabase
    .from('v_se_dashboard')
    .select('*')
    .order('date_d', { ascending: false })

  const rows = (data ?? []) as Row[]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="⭐ Opérations — Super Events"
          subtitle="Vue d'ensemble par super event : commerces, joueurs, billets, sponsors, CA"
        />
        <div style={{ padding: '0 24px 24px' }}>
          {error && <div className="sa-alert warn">Erreur de lecture : {error.message}</div>}
          {!error && rows.length === 0 && <EmptyState title="Aucun super event" />}

          {rows.map((r) => {
            const nds = r.id === 'se-nds-2026'
            return (
              <div
                key={r.id}
                className="sa-card"
                style={{ marginBottom: 14, border: '1.5px solid', borderColor: nds ? 'var(--sa-accent)' : 'var(--sa-border)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px 0' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {r.nom}
                      {nds && <span className="sa-chip purple">NDS</span>}
                    </div>
                    <div className="sa-muted" style={{ fontSize: 11.5, marginTop: 3 }}>
                      {r.id} · {r.date_d || '?'} → {r.date_f || '?'} · geofence {n(r.geofence_m)} m
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <StatusChip status={r.status} />
                    <Link href={`/dashboard/operations/${r.id}`} className="sa-btn sm primary">Détails →</Link>
                  </div>
                </div>

                <div className="sa-kpi-grid" style={{ marginTop: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))' }}>
                  <KpiCard label="Commerces" value={n(r.commerces_total)} sub={`${n(r.commerces_actifs)} actifs · ${n(r.commerces_pending)} en attente`} />
                  <KpiCard label="Payés" value={n(r.commerces_payes)} sub="commerces" />
                  <KpiCard label="Joueurs" value={n(r.joueurs)} sub={`${n(r.tickets)} tickets`} />
                  <KpiCard label="Billets" value={n(r.gains) - n(r.gains_utilises)} sub={`actifs · ${n(r.gains_utilises)} utilisés sur ${n(r.gains)}`} />
                  <KpiCard label="Sponsors" value={n(r.sponsors)} sub={`${n(r.sponsors_valides)} validés`} />
                  <KpiCard label="CA pros" value={eur(r.ca_pros)} sub={`sponsoring ${eur(r.sponsoring_encaisse)}`} />
                </div>
              </div>
            )
          })}

          <p className="sa-muted" style={{ fontSize: 11.5, marginTop: 8, textAlign: 'center' }}>
            Données agrégées (vue v_se_dashboard), rafraîchies toutes les 30 s. Chiffres uniquement — aucune donnée nominative.
          </p>
        </div>
      </div>
    </div>
  )
}
