import { redirect } from 'next/navigation'

/* P2 (16/09) : rejoindre un super event passe par /pro/nouvelle. */
export default function Page({ searchParams }: { searchParams: { pro?: string; se?: string } }) {
  const p = searchParams.pro ? `pro=${encodeURIComponent(searchParams.pro)}&` : ''
  const se = searchParams.se ? `&se=${encodeURIComponent(searchParams.se)}` : ''
  redirect(`/pro/nouvelle?${p}type=rejoindre${se}`)
}
