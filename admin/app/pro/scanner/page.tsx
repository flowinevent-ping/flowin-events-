import ProShell from '@/components/pro/ProShell'
import ScannerBillet from '@/components/pro/ScannerBillet'
import { supabase } from '@/lib/supabase'
import { lireFichePro } from '@/lib/proFiche'

export const dynamic = 'force-dynamic'

/** SCANNER UN BILLET GAGNANT (31/10) — remise des lots au telephone, en caisse. */
export default async function Page({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  let nom = 'Mon établissement'
  if (proId) {
    /* Sécurité pros (21/11) : nom par la fiche publique (RPC) ; RPC absente : lecture directe. */
    const { fiche, repli } = await lireFichePro(proId)
    if (repli) {
      const { data } = await supabase.from('pros').select('nom').eq('id', proId).maybeSingle()
      if (data?.nom) nom = data.nom
    } else if (fiche?.nom) nom = fiche.nom
  }
  return (
    <ProShell proName={nom} proId={proId} active="scanner">
      <ScannerBillet />
    </ProShell>
  )
}
