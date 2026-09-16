import { redirect } from 'next/navigation'

/* P1 (16/09) : le menu pro tient en quatre entrées ; cette page y est rangée. */
export default function Page({ searchParams }: { searchParams: { pro?: string } }) {
  const params = new URLSearchParams()
  if (searchParams.pro) params.set('pro', searchParams.pro)
  const extra = 'onglet=trafic'
  if (extra) { const [k, v] = extra.split('='); params.set(k, v) }
  const s = params.toString()
  redirect(`/pro/donnees${s ? '?' + s : ''}`)
}
