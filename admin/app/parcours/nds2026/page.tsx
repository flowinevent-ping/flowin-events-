import { fetchParcoursData } from '@/lib/parcours'
import NDS2026Client from './NDS2026Client'

interface Props { searchParams: { ev?: string } }

export default async function QuizPage({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  if (!evId) return <div style={{display:'flex',height:'100dvh',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:'#888'}}>Aucun event.</div>
  const data = await fetchParcoursData(evId)
  return <NDS2026Client {...data} evId={evId} />
}
