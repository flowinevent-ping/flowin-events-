import { fetchParcoursData } from '@/lib/parcours'
import { lireApercu, appliquerApercu } from '@/lib/apercu'
import MasterQuizClient from './MasterQuizClient'

/* Master Quiz + bonus marque blanche : copie de /parcours/nds2026 (le front de reference),
   pilotee par les donnees de l'event. Route de preview : ne remplace pas /parcours/quiz. */
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface Props { searchParams: { ev?: string; preview?: string; apercu?: string } }

export default async function MasterQuizPage({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  if (!evId) return <div style={{display:'flex',height:'100dvh',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:'#888'}}>Aucun event.</div>
  const data = await appliquerApercu(await fetchParcoursData(evId), lireApercu(searchParams))
  return <MasterQuizClient {...data} evId={evId} />
}
