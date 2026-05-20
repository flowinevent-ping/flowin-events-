import { fetchParcoursData } from '@/lib/parcours'
import SpinClient from './SpinClient'

interface Props { searchParams: { ev?: string } }

export default async function Page({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  if (!evId) return <div style={{display:'flex',height:'100dvh',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:'#888'}}>Aucun event.</div>
  const data = await fetchParcoursData(evId)
  return <SpinClient {...data} evId={evId} />
}
