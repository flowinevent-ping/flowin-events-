import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fetchOperationsPro } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import { BlocOperation, AucuneOperation } from '@/components/operations/BlocsOperations'
import { CARD, MUTED } from '@/lib/proui'

export const metadata: Metadata = { title: 'Dashboard Pro — Flowin' }

interface Props { searchParams: { pro?: string; ev?: string } }

/**
 * Accueil pro — un bloc par operation, jamais un total a plat.
 *
 * L accueil affichait quatre compteurs globaux (joueurs, events, opt-in,
 * lots) qui additionnaient des operations differentes et comptaient le
 * gabarit master. Chaque operation a maintenant son resume et ses acces.
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
  const acces = (href: string, l: string) => (
    <Link href={href} style={{ fontSize: 12.5, fontWeight: 700, color: '#7C2D92', textDecoration: 'none', border: '1px solid #E2E8F0', borderRadius: 9, padding: '6px 10px' }}>{l}</Link>
  )
  const chiffre = (v: number, l: string) => (
    <div style={{ flex: '1 1 100px', background: '#F8FAFC', borderRadius: 10, padding: '9px 12px' }}>
      <div style={{ fontSize: 20, fontWeight: 900 }}>{v}</div>
      <div style={{ fontSize: 11, ...MUTED }}>{l}</div>
    </div>
  )

  return (
    <ProShell proName={proName} proId={proId} active="accueil">
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-.6px' }}>Bonjour, {proName}</h1>
        <div style={{ fontSize: 14, color: '#64748B', marginTop: 2 }}>Vos opérations, de la plus récente à la plus ancienne.</div>
      </div>

      {ops.operations.length === 0 && <div style={CARD}><AucuneOperation /></div>}
      {ops.operations.map(op => {
        const participants = op.stations.reduce((n, s) => n + (s.participants ?? 0), 0)
        const remis = op.gagnants.filter(g => g.etat === 'retire').length
        return (
          <BlocOperation key={op.cle} op={op}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {chiffre(participants, 'participations')}
              {chiffre(op.lots.reduce((n, l) => n + l.quantite, 0), 'lots')}
              {chiffre(op.gagnants.length, 'gagnants')}
              {chiffre(op.gagnants.length - remis, 'lots à remettre')}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {acces(`/pro/lots${q}`, 'Lots')}
              {acces(`/pro/tirage${q}`, 'Gagnants')}
              {acces(`/pro/com${q}`, 'Emails & com')}
              {acces(`/pro/contrat${q}`, 'Contrat')}
              {acces(`/pro/tracking${q}`, 'Tracking')}
              {op.type === 'super'
                ? acces(`/pro/super${q}${q ? '&' : '?'}se=${encodeURIComponent(op.id)}`, 'Bilan du super event')
                : acces(`/pro/super/${op.id}${q}`, 'Activité')}
            </div>
          </BlocOperation>
        )
      })}

      <div style={{ ...CARD, background: '#F8FAFC', fontSize: 12.5, color: '#64748B', lineHeight: 1.6 }}>
        Espace Pro connecté aux données réelles de votre compte{proId ? '' : ' (ajoutez ?pro=VOTRE_ID pour cibler un compte)'}.
      </div>
    </ProShell>
  )
}
