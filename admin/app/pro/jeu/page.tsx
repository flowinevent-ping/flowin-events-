import { redirect } from 'next/navigation'

/* P2 (16/09) : la creation passe par /pro/nouvelle (un seul parcours). */
export default function Page({ searchParams }: { searchParams: { pro?: string } }) {
  const p = searchParams.pro ? `pro=${encodeURIComponent(searchParams.pro)}&` : ''
  redirect(`/pro/nouvelle?${p}type=animation`)
}
