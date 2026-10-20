import { redirect } from 'next/navigation'

/* P1 (16/09) : le menu pro tient en quatre entrées ; cette page y est rangée.
 * `op` relaye desormais (audit UX du 20/10) : sans lui, un lien "Ouvrir le
 * tirage" depuis le bilan d un super event precis (pro/super/page.tsx)
 * perdait ce contexte et retombait sur la grille de toutes les operations. */
export default function Page({ searchParams }: { searchParams: { pro?: string; op?: string } }) {
  const params = new URLSearchParams()
  if (searchParams.pro) params.set('pro', searchParams.pro)
  if (searchParams.op) params.set('op', searchParams.op)
  const extra = 'onglet=gagnants'
  if (extra) { const [k, v] = extra.split('='); params.set(k, v) }
  const s = params.toString()
  redirect(`/pro/donnees${s ? '?' + s : ''}`)
}
