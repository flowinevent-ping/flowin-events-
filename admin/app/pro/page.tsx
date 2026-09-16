import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fetchOperationsPro } from '@/lib/operations'
import { rangerParPeriode, type FiltreType } from '@/lib/rangementOperations'
import ProShell from '@/components/pro/ProShell'
import GrilleOperations, { Vignette } from '@/components/pro/GrilleOperations'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, MUTED, H1, SUB, BTN, BTN2 } from '@/lib/proui'

export const metadata: Metadata = { title: 'Mes opérations — Flowin Pro' }
export const dynamic = 'force-dynamic'

interface Props { searchParams: { pro?: string; ev?: string; type?: string } }

const TYPES: { id: '' | 'event' | 'super'; label: string }[] = [
  { id: '', label: 'Toutes' },
  { id: 'event', label: 'Animations' },
  { id: 'super', label: 'Super events' },
]

/**
 * MES OPERATIONS — la porte d entree du pro (Romain, 16/09 nuit) :
 * petites vignettes, rangees En cours / A venir / Passees puis par mois et
 * annee. Le type (animation, super event) est un filtre.
 */
export default async function ProAccueilPage({ searchParams }: Props) {
  let proId = searchParams.pro ?? ''
  const evId = searchParams.ev ?? ''
  if (!proId && evId) {
    const { data: ev } = await supabase.from('events').select('pro_id').eq('id', evId).single()
    proId = ev?.pro_id ?? ''
  }
  const ops = await fetchOperationsPro(proId)
  const proName = ops.proNom ?? 'Mon établissement'
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const et = q ? '&' : '?'
  const lien = (cle: string, onglet?: string) => `/pro/operation${q}${et}op=${encodeURIComponent(cle)}${onglet ? `&onglet=${onglet}` : ''}`
  const type = (searchParams.type === 'event' || searchParams.type === 'super' ? searchParams.type : null) as FiltreType
  const groupes = rangerParPeriode(ops.operations, type)

  return (
    <ProShell proName={proName} proId={proId} active="operations">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={H1}>Mes opérations</h1>
          <div style={SUB}>En cours, à venir, passées — par mois.</div>
        </div>
        <Link href={`/pro/parcours${q}`} style={{ ...BTN2, padding: '10px 18px', fontSize: 13.5, textDecoration: 'none' }}>Parcours mobil</Link>
        <Link href={`/pro/nouvelle${q}`} style={{ ...BTN, padding: '11px 20px', fontSize: 14, textDecoration: 'none' }}>+ Nouvelle opération</Link>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {TYPES.map(t => {
          const on = (t.id || null) === type
          return (
            <Link key={t.id || 'toutes'} href={`/pro${q}${t.id ? `${et}type=${t.id}` : ''}`}
              style={{ borderRadius: 50, padding: '7px 15px', fontWeight: 800, fontSize: 13, textDecoration: 'none',
                background: on ? C.degrade : '#fff', color: on ? '#fff' : C.accent, border: on ? 'none' : `1.5px solid ${C.bordureChamp}` }}>
              {t.label}
            </Link>
          )
        })}
      </div>

      {groupes.length === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: 26 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{ops.operations.length ? 'Aucune opération de ce type' : 'Aucune opération pour le moment'}</div>
          <div style={{ fontSize: 13.5, ...MUTED, margin: '6px 0 14px' }}>Créez votre animation ou rejoignez un super event.</div>
          <Link href={`/pro/nouvelle${q}`} style={{ ...BTN, textDecoration: 'none' }}>Commencer</Link>
        </div>
      )}

      <GrilleOperations groupes={groupes} vignette={op => (
        <Vignette op={op} href={lien(op.cle)} liens={[
          { label: 'Lots', href: lien(op.cle, 'lots') },
          { label: 'Gagnants', href: lien(op.cle, 'gagnants') },
          { label: 'CRM', href: lien(op.cle, 'crm') },
          { label: 'Trafic', href: lien(op.cle, 'trafic') },
          { label: 'Bons', href: lien(op.cle, 'bons') },
        ]} />
      )} />
    </ProShell>
  )
}
