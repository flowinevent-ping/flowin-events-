import Link from 'next/link'
import { fetchOperationsPro, libelleDates } from '@/lib/operations'
import { rangerOperations } from '@/lib/rangementOperations'
import ProShell from '@/components/pro/ProShell'
import GagnantsClient from '@/components/pro/GagnantsClient'
import ChoixOperation from '@/components/pro/ChoixOperation'
import { OngletOperationsPro } from '@/components/operations/BlocsOperations'
import { CHARTE_PRO as C } from '@/lib/charte'
import { H1, SUB } from '@/lib/proui'

export const dynamic = 'force-dynamic'

const ONGLETS = [
  { id: 'crm', label: 'CRM' },
  { id: 'gagnants', label: 'Gagnants & tirage' },
  { id: 'trafic', label: 'Trafic' },
] as const
const ALIAS: Record<string, (typeof ONGLETS)[number]['id']> = { contacts: 'crm', tracking: 'trafic', tirage: 'gagnants' }

/** MES DONNEES — CRM, gagnants, trafic : rangés par opération, une opération au choix. */
export default async function Page({ searchParams }: { searchParams: { pro?: string; onglet?: string; op?: string } }) {
  const proId = searchParams.pro ?? ''
  const ops = await fetchOperationsPro(proId)
  const brut = searchParams.onglet ?? ''
  const onglet = ONGLETS.find(o => o.id === brut)?.id ?? ALIAS[brut] ?? 'crm'
  const cle = ops.operations.some(o => o.cle === searchParams.op) ? (searchParams.op as string) : ''
  const groupes = rangerOperations(ops.operations).map(g => ({
    titre: g.titre, ops: g.ops.map(o => ({ cle: o.cle, nom: o.nom, dates: libelleDates(o.dateD, o.dateF) })),
  }))
  const base = new URLSearchParams()
  if (proId) base.set('pro', proId)
  if (cle) base.set('op', cle)
  const href = (o: string) => { const p = new URLSearchParams(base); p.set('onglet', o); return `/pro/donnees?${p.toString()}` }
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="donnees">
      <h1 style={H1}>Mes données</h1>
      <div style={{ ...SUB, marginBottom: 14 }}>CRM, gagnants et trafic de vos opérations.</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 6, background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 16, padding: 6, flexWrap: 'wrap' }}>
          {ONGLETS.map(o => (
            <Link key={o.id} href={href(o.id)}
              style={{ borderRadius: 12, padding: '10px 18px', fontWeight: 800, fontSize: 14, textDecoration: 'none',
                background: onglet === o.id ? C.degrade : 'transparent', color: onglet === o.id ? '#fff' : C.texte }}>
              {o.label}
            </Link>
          ))}
        </div>
        <ChoixOperation groupes={groupes} valeur={cle} />
      </div>
      {onglet === 'crm' && <OngletOperationsPro initial={ops} onglet="crm" cle={cle || null} />}
      {onglet === 'gagnants' && <GagnantsClient initial={ops} cle={cle || null} titre={false} />}
      {onglet === 'trafic' && <OngletOperationsPro initial={ops} onglet="tracking" prefixeStation="/pro/super/" cle={cle || null} />}
    </ProShell>
  )
}
