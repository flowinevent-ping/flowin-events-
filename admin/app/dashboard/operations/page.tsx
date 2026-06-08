import { supabase } from '@/lib/supabase'

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
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.head}>
          <div>
            <div style={S.kick}>FLOWIN · SUPER ADMIN</div>
            <h1 style={S.h1}>Opérations — Super Events</h1>
          </div>
          <a href="/dashboard.html" style={S.back}>← Dashboard</a>
        </div>

        {error && <div style={S.err}>Erreur de lecture : {error.message}</div>}
        {!error && rows.length === 0 && <div style={S.empty}>Aucun super event.</div>}

        {rows.map((r) => {
          const nds = r.id === 'se-nds-2026'
          return (
            <div key={r.id} style={{ ...S.card, ...(nds ? S.cardNds : {}) }}>
              <div style={S.cardHead}>
                <div>
                  <div style={S.seNom}>{r.nom}{nds && <span style={S.tag}>NDS</span>}</div>
                  <div style={S.seId}>{r.id} · {r.date_d || '?'} → {r.date_f || '?'} · geofence {n(r.geofence_m)} m</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ ...S.status, ...(r.status === 'live' ? S.stLive : r.status === 'upcoming' ? S.stUp : S.stOff) }}>{r.status}</span>
                  <a href={`/dashboard/operations/${r.id}`} style={{ color: '#7E9BF2', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Détails →</a>
                </div>
              </div>

              <div style={S.kpis}>
                <Kpi label="Commerces" value={n(r.commerces_total)} sub={`${n(r.commerces_actifs)} actifs · ${n(r.commerces_pending)} en attente`} c="#8B5CF6" />
                <Kpi label="Payés" value={n(r.commerces_payes)} sub="commerces" c="#37D399" />
                <Kpi label="Joueurs" value={n(r.joueurs)} sub={`${n(r.tickets)} tickets`} c="#22D3EE" />
                <Kpi label="Gains" value={n(r.gains)} sub={`${n(r.gains_utilises)} utilisés`} c="#F8B84E" />
                <Kpi label="Sponsors" value={n(r.sponsors)} sub={`${n(r.sponsors_valides)} validés`} c="#EC4899" />
                <Kpi label="CA pros" value={eur(r.ca_pros)} sub={`sponsoring ${eur(r.sponsoring_encaisse)}`} c="#A6E15A" isText />
              </div>
            </div>
          )
        })}

        <p style={S.note}>Données agrégées (vue v_se_dashboard), rafraîchies toutes les 30 s. Chiffres uniquement — aucune donnée nominative.</p>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, c, isText }: { label: string; value: number | string; sub?: string; c: string; isText?: boolean }) {
  return (
    <div style={S.kpi}>
      <div style={{ ...S.kpiVal, color: c, fontSize: isText ? 18 : 26 }}>{value}</div>
      <div style={S.kpiLbl}>{label}</div>
      {sub && <div style={S.kpiSub}>{sub}</div>}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#070510', color: '#f6f2ff', fontFamily: "'DM Sans',system-ui,sans-serif" },
  wrap: { maxWidth: 1000, margin: '0 auto', padding: '28px 20px 60px' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  kick: { fontSize: 11, letterSpacing: '.2em', color: '#8B5CF6', fontWeight: 700 },
  h1: { fontFamily: "'Fredoka','DM Sans',sans-serif", fontWeight: 600, fontSize: 28, margin: '4px 0 0' },
  back: { color: '#7E9BF2', textDecoration: 'none', fontSize: 14, fontWeight: 600 },
  err: { background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.3)', borderRadius: 12, padding: 14, fontSize: 13 },
  empty: { color: 'rgba(246,242,255,.5)', fontSize: 14, padding: 20 },
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(246,242,255,.12)', borderRadius: 18, padding: 20, marginBottom: 14 },
  cardNds: { borderColor: '#8B5CF6', background: 'rgba(139,92,246,.08)', boxShadow: '0 18px 44px -24px #8B5CF6' },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  seNom: { fontFamily: "'Fredoka','DM Sans',sans-serif", fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 },
  tag: { fontSize: 10, fontWeight: 700, color: '#fff', background: 'linear-gradient(100deg,#8B5CF6,#EC4899)', borderRadius: 6, padding: '2px 7px', letterSpacing: '.05em' },
  seId: { fontSize: 11.5, color: 'rgba(246,242,255,.45)', marginTop: 3 },
  status: { fontSize: 11, fontWeight: 700, borderRadius: 100, padding: '5px 11px', textTransform: 'uppercase', letterSpacing: '.04em' },
  stLive: { background: 'rgba(55,211,153,.16)', color: '#37D399' },
  stUp: { background: 'rgba(248,184,78,.16)', color: '#F8B84E' },
  stOff: { background: 'rgba(246,242,255,.1)', color: 'rgba(246,242,255,.55)' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 1, background: 'rgba(246,242,255,.1)', border: '1px solid rgba(246,242,255,.1)', borderRadius: 14, overflow: 'hidden' },
  kpi: { background: '#0a0713', padding: '14px 12px' },
  kpiVal: { fontFamily: "'Fredoka','DM Sans',sans-serif", fontWeight: 600, lineHeight: 1 },
  kpiLbl: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700, color: 'rgba(246,242,255,.7)', marginTop: 6 },
  kpiSub: { fontSize: 11, color: 'rgba(246,242,255,.42)', marginTop: 3 },
  note: { fontSize: 11.5, color: 'rgba(246,242,255,.4)', marginTop: 18, textAlign: 'center' },
}
