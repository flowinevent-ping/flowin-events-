import ProShell from '@/components/pro/ProShell'
import ScannerBillet from '@/components/pro/ScannerBillet'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/** SCANNER UN BILLET GAGNANT (31/10) — remise des lots au telephone, en caisse. */
export default async function Page({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  let nom = 'Mon établissement'
  if (proId) {
    const { data } = await supabase.from('pros').select('nom').eq('id', proId).maybeSingle()
    if (data?.nom) nom = data.nom
  }
  return (
    <ProShell proName={nom} proId={proId} active="scanner">
      <ScannerBillet />
    </ProShell>
  )
}
