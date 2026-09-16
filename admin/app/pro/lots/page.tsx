import Link from 'next/link'
import { fetchOperationsPro } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import { OngletOperationsPro } from '@/components/operations/BlocsOperations'
import { CARD, MUTED, H1, SUB, ACC } from '@/lib/proui'

/**
 * Lots & distribution — un bloc par operation, jamais a plat.
 *
 * Romain, 04/09 : « il faut selectionner l event sinon bordel ». Le selecteur
 * du 04/09 montrait UNE operation a la fois ; la regle du 14/09 va plus loin :
 * toutes les operations, chacune sous son titre (nom + date), la plus recente
 * en tete. Une operation sans lot le dit sous son propre titre.
 */
export default async function ProLotsPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const ops = await fetchOperationsPro(proId)
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="lots">
      <h1 style={H1}>Lots &amp; distribution</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>Les lots de chacune de vos opérations, leur stock et leur distribution.</div>
      <OngletOperationsPro initial={ops} onglet="lots" />
      <div style={{ ...CARD, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, fontSize: 12.5, ...MUTED }}>La distribution se gère depuis l&apos;écran Gagnants.</div>
        <Link href={`/pro/tirage${q}`} style={{ background: ACC, color: '#fff', borderRadius: 12, padding: '10px 16px', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Aller aux gagnants →</Link>
      </div>
    </ProShell>
  )
}
