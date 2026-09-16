import { fetchProDashboard } from '@/lib/pro'
import ProShell from '@/components/pro/ProShell'
import EntrepriseForm from '@/components/pro/EntrepriseForm'
import { H1, SUB } from '@/lib/proui'

export default async function ProEntreprisePage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const data = await fetchProDashboard(proId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (data.pro ?? {}) as any
  return (
    <ProShell proName={p.nom ?? 'Mon établissement'} proId={proId} active="entreprise">
      <h1 style={H1}>Mon entreprise</h1><div style={{ ...SUB, marginBottom: 18 }}>Vos coordonnées, modifiables à tout moment.</div>
      {p.id
        ? <EntrepriseForm initial={{
            id: p.id, nom: p.nom ?? null, secteur: p.secteur ?? null, adresse: p.adresse ?? null,
            code_postal: p.code_postal ?? null, ville: p.ville ?? null, siret: p.siret ?? null,
            contact: p.contact ?? null, email: p.email ?? null, tel: p.tel ?? null, partenaire_id: p.partenaire_id ?? null,
          }} />
        : <div style={{ fontSize: 13, color: '#64748B' }}>Établissement introuvable.</div>}
    </ProShell>
  )
}
