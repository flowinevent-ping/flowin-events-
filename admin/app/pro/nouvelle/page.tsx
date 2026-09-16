import { fetchProDashboard } from '@/lib/pro'
import { fetchBanquesPro } from '@/lib/banques'
import { fetchPacksParticipation } from '@/lib/commercial'
import { supabase } from '@/lib/supabase'
import ProShell from '@/components/pro/ProShell'
import NouvelleOperation, { type SuperOuvert, type ProNouvelle } from '@/components/pro/NouvelleOperation'

export const dynamic = 'force-dynamic'

/**
 * NOUVELLE OPERATION (P2) — creer une animation, rejoindre un super event,
 * creer un super event : un seul parcours (components/pro/NouvelleOperation).
 * ?type=animation|rejoindre|super ouvre directement le parcours voulu,
 * ?se=<id> preselectionne le super event a rejoindre.
 */
export default async function Page({ searchParams }: { searchParams: { pro?: string; type?: string; se?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, banques, packs, { data: ses }] = await Promise.all([
    fetchProDashboard(proId),
    fetchBanquesPro(proId),
    fetchPacksParticipation(),
    supabase.from('super_events').select('id,nom,status,date_d,date_f,description,logo_url,module,cfg_jeu,pro_id,frais_pro,events')
      .neq('id', 'se-master-superevent').not('status', 'in', '("past","pending")').order('date_d', { ascending: false }),
  ])
  const p = data.pro as unknown as ProNouvelle | null
  if (!p) {
    return (
      <ProShell proName="Mon établissement" proId={proId} active="nouvelle">
        <div style={{ fontSize: 14 }}>Établissement introuvable.</div>
      </ProShell>
    )
  }
  const supers: SuperOuvert[] = ((ses ?? []) as (SuperOuvert & { events: string[] | null })[]).map(s => ({
    ...s, station: (s.events ?? [])[0] ?? null,
  }))
  const t = searchParams.type
  const type = t === 'animation' || t === 'rejoindre' || t === 'super' ? t : null
  return (
    <ProShell proName={p.nom ?? 'Mon établissement'} proId={proId} active="nouvelle">
      <NouvelleOperation
        pro={p} banques={banques} supers={supers} packs={packs}
        typeInitial={searchParams.se ? 'rejoindre' : type} seInitial={searchParams.se ?? null}
      />
    </ProShell>
  )
}
