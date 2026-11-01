import { redirect } from 'next/navigation'
import { creerBanque } from '@/lib/banques'
import { lireDroitsPro } from '@/lib/droitsPro'
import ProShell from '@/components/pro/ProShell'
import OptionDesactivee from '@/components/pro/OptionDesactivee'

export default async function NouvelleBanquePage({ searchParams }: { searchParams: { pro?: string; tags?: string; depuis?: string } }) {
  const proId = searchParams.pro ?? ''
  const tags = (searchParams.tags ?? 'quiz').split(',').filter(Boolean)
  const nomDefaut = tags.includes('bonus') ? 'Nouveau sondage bonus' : 'Nouvelle banque quiz'
  if (proId && !(await lireDroitsPro(proId)).creer_banques) {
    return <ProShell proName="Mon établissement" proId={proId} active="banques"><OptionDesactivee proId={proId} option="Créer une banque de questions" /></ProShell>
  }
  const banque = proId ? await creerBanque({ proId, nom: nomDefaut, tags }) : null
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const suffixe = searchParams.depuis ? `${q ? '&' : '?'}depuis=${encodeURIComponent(searchParams.depuis)}` : ''
  redirect(banque ? `/pro/banques/${banque.id}${q}${suffixe}` : `/pro/banques${q}`)
}
