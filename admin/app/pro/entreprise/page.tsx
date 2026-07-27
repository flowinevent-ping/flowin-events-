import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import { CARD, MUTED, H1, SUB } from '@/lib/proui'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 5 }}>{label}</div>
      <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '11px 13px', fontSize: 14, background: '#F8FAFC' }}>{value || '—'}</div>
    </div>
  )
}

export default async function ProEntreprisePage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  const p = (data.pro ?? {}) as any
  return (
    <ProShell proName={p.nom ?? 'Mon établissement'} proId={proId} active="entreprise">
      <h1 style={H1}>Mon entreprise</h1><div style={{ ...SUB, marginBottom: 18 }}>Vos coordonnées, enregistrées une fois.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <div style={CARD}>
          <Field label="Établissement" value={p.nom} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Secteur" value={p.secteur} /><Field label="Ville" value={p.ville} />
          </div>
          <Field label="Adresse" value={p.adresse} />
          <Field label="Code postal" value={p.code_postal} />
        </div>
        <div style={CARD}>
          <Field label="Contact" value={p.contact} />
          <Field label="Email" value={p.email} />
          <Field label="Téléphone" value={p.tel} />
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'rgba(168,85,247,.06)', border: '1px solid rgba(168,85,247,.2)', borderRadius: 12, padding: '11px 13px', fontSize: 12.5, color: '#6B248A', lineHeight: 1.5, marginTop: 4 }}>
            Logo &amp; liens digitaux (Instagram, Facebook, site web) : à compléter — ils s&apos;afficheront sur vos jeux et QR.
          </div>
        </div>
      </div>
    </ProShell>
  )
}
