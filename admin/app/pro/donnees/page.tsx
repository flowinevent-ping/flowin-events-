import Link from 'next/link'
import { fetchOperationsPro, libelleDates } from '@/lib/operations'
import { fetchCrmPro } from '@/lib/crmPro'
import { rangerParPeriode, groupesChoix } from '@/lib/rangementOperations'
import ProShell from '@/components/pro/ProShell'
import GagnantsClient from '@/components/pro/GagnantsClient'
import ChoixOperation from '@/components/pro/ChoixOperation'
import CrmPro from '@/components/pro/CrmPro'
import GrilleOperations, { Vignette } from '@/components/pro/GrilleOperations'
import { OngletOperationsPro } from '@/components/operations/BlocsOperations'
import { CHARTE_PRO as C } from '@/lib/charte'
import { H1, SUB } from '@/lib/proui'

export const dynamic = 'force-dynamic'

const ONGLETS = [
  { id: 'crm', label: 'CRM' },
  { id: 'gagnants', label: 'Gagnants & tirage' },
  { id: 'trafic', label: 'Trafic' },
] as const
type Onglet = (typeof ONGLETS)[number]['id']
const ALIAS: Record<string, Onglet> = { contacts: 'crm', tracking: 'trafic', tirage: 'gagnants' }

/**
 * MES DONNEES (16/09 nuit)
 *  - CRM : le CRM complet, toutes operations confondues (lib/crmPro).
 *  - Gagnants, Trafic : vignettes des operations (en cours, a venir,
 *    passees, par mois) ; une vignette ouvre le detail de l operation.
 */
export default async function Page({ searchParams }: { searchParams: { pro?: string; onglet?: string; op?: string } }) {
  const proId = searchParams.pro ?? ''
  const brut = searchParams.onglet ?? ''
  const onglet: Onglet = ONGLETS.find(o => o.id === brut)?.id ?? ALIAS[brut] ?? 'crm'
  const [ops, contacts] = await Promise.all([fetchOperationsPro(proId), onglet === 'crm' ? fetchCrmPro(proId) : Promise.resolve([])])
  const cle = ops.operations.some(o => o.cle === searchParams.op) ? (searchParams.op as string) : ''
  const choix = groupesChoix(ops.operations, o => libelleDates(o.dateD, o.dateF))
  const lien = (o: Onglet, op?: string) => {
    const p = new URLSearchParams()
    if (proId) p.set('pro', proId)
    p.set('onglet', o)
    if (op) p.set('op', op)
    return `/pro/donnees?${p.toString()}`
  }
  const opChoisie = ops.operations.find(o => o.cle === cle)

  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="donnees">
      <h1 style={H1}>Mes super data</h1>
      <div style={{ ...SUB, marginBottom: 12 }}>CRM, gagnants et trafic de toutes vos opérations.</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, background: '#fff', border: `1px solid ${C.bordure}`, borderRadius: 14, padding: 5 }}>
          {ONGLETS.map(o => (
            <Link key={o.id} href={lien(o.id, cle || undefined)}
              style={{ borderRadius: 10, padding: '8px 16px', fontWeight: 800, fontSize: 13.5, textDecoration: 'none',
                background: onglet === o.id ? C.degrade : 'transparent', color: onglet === o.id ? '#fff' : C.texte }}>
              {o.label}
            </Link>
          ))}
        </div>
        {onglet !== 'crm' && <ChoixOperation groupes={choix} valeur={cle} />}
      </div>

      {onglet === 'crm' && (
        <CrmPro
          proId={proId} proNom={ops.proNom ?? ''} contacts={contacts}
          operations={choix.flatMap(g => g.ops)} operationInitiale={cle || null}
        />
      )}

      {onglet !== 'crm' && !opChoisie && (
        <GrilleOperations groupes={rangerParPeriode(ops.operations)} vignette={op => (
          <Vignette op={op} href={lien(onglet, op.cle)} />
        )} />
      )}

      {onglet !== 'crm' && opChoisie && (
        <>
          <Link href={lien(onglet)} style={{ fontSize: 13, fontWeight: 800, color: C.accent, textDecoration: 'none', display: 'inline-block', marginBottom: 10 }}>← Toutes les opérations</Link>
          {onglet === 'gagnants' && <GagnantsClient initial={ops} cle={cle} titre={false} />}
          {onglet === 'trafic' && <OngletOperationsPro initial={ops} onglet="tracking" prefixeStation="/pro/super/" cle={cle} />}
        </>
      )}
    </ProShell>
  )
}
