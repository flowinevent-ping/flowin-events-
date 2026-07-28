import { redirect } from 'next/navigation'
import { creerBanque } from '@/lib/banques'

export default async function NouvelleBanquePage({ searchParams }: { searchParams: { pro?: string; tags?: string; depuis?: string } }) {
  const proId = searchParams.pro ?? ''
  const tags = (searchParams.tags ?? 'quiz').split(',').filter(Boolean)
  const nomDefaut = tags.includes('bonus') ? 'Nouveau sondage bonus' : 'Nouvelle banque quiz'
  const banque = proId ? await creerBanque({ proId, nom: nomDefaut, tags }) : null
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const suffixe = searchParams.depuis ? `${q ? '&' : '?'}depuis=${encodeURIComponent(searchParams.depuis)}` : ''
  redirect(banque ? `/pro/banques/${banque.id}${q}${suffixe}` : `/pro/banques${q}`)
}
