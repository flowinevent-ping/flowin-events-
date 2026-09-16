import Link from 'next/link'
import { fetchOperationsPro } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import GagnantsClient from '@/components/pro/GagnantsClient'
import { OngletOperationsPro } from '@/components/operations/BlocsOperations'
import { CHARTE_PRO as C } from '@/lib/charte'
import { H1, SUB } from '@/lib/proui'

export const dynamic = 'force-dynamic'

const ONGLETS = [
  { id: 'contacts', label: 'Contacts' },
  { id: 'gagnants', label: 'Gagnants' },
  { id: 'trafic', label: 'Trafic' },
] as const

/** MES DONNEES (P1) — contacts, gagnants, trafic : toujours rangés par opération. */
export default async function Page({ searchParams }: { searchParams: { pro?: string; onglet?: string } }) {
  const proId = searchParams.pro ?? ''
  const ops = await fetchOperationsPro(proId)
  const onglet = ONGLETS.find(o => o.id === searchParams.onglet)?.id ?? 'contacts'
  const q = proId ? `?pro=${encodeURIComponent(proId)}&` : '?'
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="donnees">
      <h1 style={H1}>Mes données</h1>
      <div style={{ ...SUB, marginBottom: 14 }}>Opération par opération.</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {ONGLETS.map(o => (
          <Link key={o.id} href={`/pro/donnees${q}onglet=${o.id}`}
            style={{ borderRadius: 50, padding: '9px 18px', fontWeight: 800, fontSize: 13.5, textDecoration: 'none',
              background: onglet === o.id ? C.degrade : '#fff', color: onglet === o.id ? '#fff' : C.accent, border: onglet === o.id ? 'none' : `1.5px solid ${C.bordureChamp}` }}>
            {o.label}
          </Link>
        ))}
      </div>
      {onglet === 'contacts' && <OngletOperationsPro initial={ops} onglet="crm" />}
      {onglet === 'gagnants' && <GagnantsClient initial={ops} />}
      {onglet === 'trafic' && <OngletOperationsPro initial={ops} onglet="tracking" prefixeStation="/pro/super/" />}
    </ProShell>
  )
}
