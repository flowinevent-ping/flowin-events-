import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fetchOperationsPro, libelleDates, libelleModule, libelleStatut } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, MUTED, H1, SUB, BTN, BTN2 } from '@/lib/proui'

export const metadata: Metadata = { title: 'Mes opérations — Flowin Pro' }
export const dynamic = 'force-dynamic'

interface Props { searchParams: { pro?: string; ev?: string } }

/**
 * MES OPERATIONS (P1, 16/09) — la porte d entree du pro : une carte par
 * operation (event ou super event), la plus recente en tete. Une carte
 * s ouvre sur la fiche de l operation (/pro/operation), qui porte tout le reste.
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
  const lien = (cle: string, onglet?: string) => `/pro/operation${q}${q ? '&' : '?'}op=${encodeURIComponent(cle)}${onglet ? `&onglet=${onglet}` : ''}`
  const chiffre = (v: number, l: string) => (
    <div style={{ flex: '1 1 90px', background: C.subtil, borderRadius: 12, padding: '9px 12px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.accent }}>{v}</div>
      <div style={{ fontSize: 11, fontWeight: 700, ...MUTED }}>{l}</div>
    </div>
  )

  return (
    <ProShell proName={proName} proId={proId} active="operations">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={H1}>Mes opérations</h1>
          <div style={SUB}>Vos animations et super events, du plus récent au plus ancien.</div>
        </div>
        <Link href={`/pro/parcours${q}`} style={{ ...BTN2, textDecoration: 'none' }}>Parcours mobil</Link>
        <Link href={`/pro/nouvelle${q}`} style={{ ...BTN, textDecoration: 'none' }}>+ Nouvelle opération</Link>
      </div>

      {ops.operations.length === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Aucune opération pour le moment</div>
          <div style={{ fontSize: 13.5, ...MUTED, margin: '6px 0 16px' }}>Créez votre animation ou rejoignez un super event.</div>
          <Link href={`/pro/nouvelle${q}`} style={{ ...BTN, textDecoration: 'none' }}>Commencer</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
        {ops.operations.map(op => {
          const participants = op.stations.reduce((n, s) => n + (s.participants ?? 0), 0)
          const remis = op.gagnants.filter(g => g.etat === 'retire').length
          return (
            <div key={op.cle} style={{ ...CARD, padding: 0, overflow: 'hidden', marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              <Link href={lien(op.cle)} style={{ textDecoration: 'none', color: '#fff' }}>
                <div style={{ background: `linear-gradient(180deg,${C.accent},${C.accentFonce})`, padding: '16px 18px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.filet }} />
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.8 }}>
                    {op.type === 'super' ? '⭐ Super event' : '🎯 Animation'} · {libelleStatut(op.status)}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{op.nom}</div>
                  <div style={{ fontSize: 12.5, opacity: 0.9 }}>
                    {libelleDates(op.dateD, op.dateF)} · {op.type === 'super' ? `${op.stations.length} station${op.stations.length > 1 ? 's' : ''}` : libelleModule(op.stations[0]?.module)}
                  </div>
                </div>
              </Link>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {chiffre(participants, 'parties')}
                  {chiffre(op.gagnants.length, 'gagnants')}
                  {chiffre(op.gagnants.length - remis, 'lots à remettre')}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                  {([['jeu', 'Jeu'], ['lots', 'Lots'], ['diffusion', 'Diffusion'], ['gagnants', 'Gagnants'], ['trafic', 'Trafic']] as const).map(([o, l]) => (
                    <Link key={o} href={lien(op.cle, o)} style={{ ...BTN2, padding: '7px 13px', fontSize: 12.5, textDecoration: 'none' }}>{l}</Link>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ProShell>
  )
}
